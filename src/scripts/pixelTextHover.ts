import * as THREE from "three"

const VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/**
 * Brush displace along mouse velocity + RGB split under the tip.
 * Chromatic fringes are built from the alpha mask so they stay visible
 * on dark text (light mode) and light text (dark mode).
 */
const FRAGMENT = /* glsl */ `
uniform sampler2D uTexture;
uniform vec2 uMouse;
uniform vec2 uVelocity;
uniform float uHover;
uniform float uRadius;
uniform float uStrength;
uniform float uRgbSplit;
uniform vec3 uTextColor;
uniform vec2 uAspect;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 delta = (uv - uMouse) * uAspect;
  float dist = length(delta);

  float brush = 1.0 - smoothstep(0.0, uRadius, dist);
  brush *= brush;

  float speed = length(uVelocity);
  float motion = smoothstep(0.00015, 0.01, speed);
  float slowBoost = mix(1.45, 0.7, smoothstep(0.001, 0.022, speed));
  float amount = brush * uHover * motion * slowBoost;

  vec2 dir = speed > 0.00001 ? normalize(uVelocity) : vec2(0.0);
  vec2 offset = -dir * uStrength * amount;

  vec2 perp = vec2(-dir.y, dir.x);
  vec2 chroma = (dir * 0.65 + perp * 0.35) * uRgbSplit * amount;

  float aR = texture2D(uTexture, uv + offset + chroma).a;
  float aG = texture2D(uTexture, uv + offset).a;
  float aB = texture2D(uTexture, uv + offset - chroma).a;

  // Core glyph in theme foreground color
  vec3 color = uTextColor * aG;
  // Additive RGB fringes where channels diverge (works for black and white text)
  float fringe = clamp(amount * 1.35, 0.0, 1.0);
  color.r += max(aR - aG, 0.0) * fringe;
  color.b += max(aB - aG, 0.0) * fringe;
  color.g += max(min(aR, aB) - aG, 0.0) * fringe * 0.25;

  float alpha = max(aG, max(aR, aB) * fringe);
  gl_FragColor = vec4(color, alpha);
}
`

const HOVER_MEDIA = "(hover: hover) and (pointer: fine)"
const MAX_DPR = 2
const LERP = 0.22
const VEL_LERP = 0.32
const VEL_DECAY = 0.9
const EFFECT_RADIUS = 0.12
const EFFECT_STRENGTH = 0.062
const RGB_SPLIT = 0.012
const PAD_PX = 100

type LineSource = { text: string; x: number; y: number; width: number; height: number }

function canRun(): boolean {
  if (typeof window === "undefined") return false
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false
  if (!window.matchMedia(HOVER_MEDIA).matches) return false
  try {
    const canvas = document.createElement("canvas")
    return !!(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl")
    )
  } catch {
    return false
  }
}

function readForegroundColor(el: HTMLElement): string {
  const probe = document.createElement("span")
  probe.style.cssText =
    "position:absolute;visibility:hidden;pointer-events:none;color:var(--foreground)"
  el.appendChild(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color || getComputedStyle(document.documentElement).color
}

function cssColorToVec3(cssColor: string): THREE.Vector3 {
  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext("2d")
  if (!ctx) return new THREE.Vector3(0, 0, 0)
  ctx.fillStyle = cssColor
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return new THREE.Vector3(r / 255, g / 255, b / 255)
}

function collectLines(heading: HTMLElement): LineSource[] {
  const root = heading.getBoundingClientRect()
  const lineEls = heading.querySelectorAll<HTMLElement>(".intro-line")
  const sources: HTMLElement[] =
    lineEls.length > 0 ? Array.from(lineEls) : [heading]

  return sources.map((el) => {
    const r = el.getBoundingClientRect()
    return {
      text: (el.textContent ?? "").trim(),
      x: r.left - root.left,
      y: r.top - root.top,
      width: r.width,
      height: r.height,
    }
  })
}

function drawTextTexture(
  heading: HTMLElement,
  textWidth: number,
  textHeight: number,
  dpr: number,
  color: string,
  pad: number
): HTMLCanvasElement {
  const width = textWidth + pad * 2
  const height = textHeight + pad * 2
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.ceil(width * dpr))
  canvas.height = Math.max(1, Math.ceil(height * dpr))
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const style = getComputedStyle(heading)
  const fontSize = style.fontSize
  const fontFamily = style.fontFamily
  ctx.font = `800 ${fontSize} ${fontFamily}`
  ctx.fillStyle = color
  ctx.textAlign = "left"
  ctx.textBaseline = "top"
  if ("letterSpacing" in ctx) {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing =
      "0px"
  }
  const ctxExt = ctx as CanvasRenderingContext2D & { fontKerning?: string }
  if ("fontKerning" in ctxExt) ctxExt.fontKerning = "normal"

  for (const line of collectLines(heading)) {
    if (!line.text) continue
    ctx.fillText(line.text, line.x + pad, line.y + pad)
  }

  return canvas
}

class PixelHeading {
  private wrapper: HTMLElement
  private heading: HTMLElement
  private canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private scene: THREE.Scene
  private camera: THREE.OrthographicCamera
  private mesh: THREE.Mesh
  private material: THREE.ShaderMaterial
  private texture: THREE.CanvasTexture | null = null
  private textColor = ""
  private raf = 0
  private visible = true
  private running = false
  private disposed = false
  private hoverTarget = 0
  private hoverCurrent = 0
  private mouseTarget = new THREE.Vector2(0.5, 0.5)
  private mouseCurrent = new THREE.Vector2(0.5, 0.5)
  private velocity = new THREE.Vector2(0, 0)
  private hasMouseSample = false
  private textWidth = 0
  private textHeight = 0
  private dpr = 1
  private io: IntersectionObserver
  private ro: ResizeObserver
  private themeObserver: MutationObserver
  private onPointerMove: (e: PointerEvent) => void
  private onPointerEnter: () => void
  private onPointerLeave: () => void
  private onVisibility: () => void

  constructor(wrapper: HTMLElement, heading: HTMLElement) {
    this.wrapper = wrapper
    this.heading = heading

    this.canvas = document.createElement("canvas")
    this.canvas.className = "pixel-text-canvas"
    this.canvas.setAttribute("aria-hidden", "true")
    this.applyCanvasLayout(0, 0)
    this.wrapper.appendChild(this.canvas)

    this.dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
      premultipliedAlpha: false,
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.autoClear = true
    this.renderer.outputColorSpace = THREE.SRGBColorSpace

    this.scene = new THREE.Scene()
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: null },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uVelocity: { value: new THREE.Vector2(0, 0) },
        uHover: { value: 0 },
        uRadius: { value: EFFECT_RADIUS },
        uStrength: { value: EFFECT_STRENGTH },
        uRgbSplit: { value: RGB_SPLIT },
        uTextColor: { value: new THREE.Vector3(0, 0, 0) },
        uAspect: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.scene.add(this.mesh)

    this.textColor = readForegroundColor(this.heading)
    ;(this.material.uniforms.uTextColor.value as THREE.Vector3).copy(
      cssColorToVec3(this.textColor)
    )
    this.wrapper.classList.add("is-active")
    this.resize()

    this.onPointerMove = (e: PointerEvent) => {
      const rect = this.wrapper.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return
      const pad = PAD_PX
      const fullW = rect.width + pad * 2
      const fullH = rect.height + pad * 2
      const nextX = (e.clientX - (rect.left - pad)) / fullW
      const nextY = 1 - (e.clientY - (rect.top - pad)) / fullH

      if (this.hasMouseSample) {
        const dx = nextX - this.mouseTarget.x
        const dy = nextY - this.mouseTarget.y
        this.velocity.x += (dx - this.velocity.x) * VEL_LERP
        this.velocity.y += (dy - this.velocity.y) * VEL_LERP
      } else {
        this.hasMouseSample = true
        this.velocity.set(0, 0)
      }

      this.mouseTarget.set(nextX, nextY)
      this.mouseCurrent.set(nextX, nextY)
      this.hoverTarget = 1
    }
    this.onPointerEnter = () => {
      this.hoverTarget = 1
      this.hasMouseSample = false
    }
    this.onPointerLeave = () => {
      this.hoverTarget = 0
    }
    this.onVisibility = () => {
      this.syncLoop()
    }

    this.wrapper.addEventListener("pointermove", this.onPointerMove)
    this.wrapper.addEventListener("pointerenter", this.onPointerEnter)
    this.wrapper.addEventListener("pointerleave", this.onPointerLeave)
    document.addEventListener("visibilitychange", this.onVisibility)

    this.io = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry?.isIntersecting ?? false
        this.syncLoop()
      },
      { threshold: 0.05 }
    )
    this.io.observe(this.wrapper)

    this.ro = new ResizeObserver(() => {
      this.resize()
    })
    this.ro.observe(this.wrapper)

    this.themeObserver = new MutationObserver(() => {
      this.textColor = readForegroundColor(this.heading)
      ;(this.material.uniforms.uTextColor.value as THREE.Vector3).copy(
        cssColorToVec3(this.textColor)
      )
      this.rebuildTexture()
    })
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    this.syncLoop()
  }

  private applyCanvasLayout(fullW: number, fullH: number): void {
    const pad = PAD_PX
    this.canvas.style.cssText = [
      "position:absolute",
      `top:${-pad}px`,
      `left:${-pad}px`,
      `width:${Math.max(1, fullW)}px`,
      `height:${Math.max(1, fullH)}px`,
      "display:block",
      "pointer-events:none",
    ].join(";")
  }

  private syncLoop(): void {
    const shouldRun =
      !this.disposed && this.visible && document.visibilityState === "visible"
    if (shouldRun && !this.running) {
      this.running = true
      this.tick()
    } else if (!shouldRun && this.running) {
      this.running = false
      cancelAnimationFrame(this.raf)
      this.raf = 0
    }
  }

  private resize(): void {
    const rect = this.wrapper.getBoundingClientRect()
    const textW = Math.max(1, Math.round(rect.width))
    const textH = Math.max(1, Math.round(rect.height))
    const nextDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    if (
      textW === this.textWidth &&
      textH === this.textHeight &&
      nextDpr === this.dpr
    ) {
      return
    }

    this.textWidth = textW
    this.textHeight = textH
    this.dpr = nextDpr

    const fullW = textW + PAD_PX * 2
    const fullH = textH + PAD_PX * 2
    this.applyCanvasLayout(fullW, fullH)
    this.renderer.setPixelRatio(this.dpr)
    this.renderer.setSize(fullW, fullH, false)
    ;(this.material.uniforms.uAspect.value as THREE.Vector2).set(
      1,
      fullH / fullW
    )
    this.rebuildTexture()
  }

  private rebuildTexture(): void {
    if (this.textWidth <= 0 || this.textHeight <= 0) return

    const canvas = drawTextTexture(
      this.heading,
      this.textWidth,
      this.textHeight,
      this.dpr,
      this.textColor,
      PAD_PX
    )

    if (this.texture) {
      this.texture.dispose()
    }
    this.texture = new THREE.CanvasTexture(canvas)
    this.texture.colorSpace = THREE.SRGBColorSpace
    this.texture.generateMipmaps = false
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter
    this.texture.needsUpdate = true
    this.material.uniforms.uTexture.value = this.texture

    // Brush strength ~32–44 CSS px at typical heading widths
    const fullW = this.textWidth + PAD_PX * 2
    this.material.uniforms.uStrength.value = Math.min(
      0.09,
      Math.max(0.04, 40 / fullW)
    )
    // Brush radius ~90 CSS px in UV space (width-normalized, aspect in shader)
    this.material.uniforms.uRadius.value = Math.min(
      0.18,
      Math.max(0.08, 90 / fullW)
    )
    // RGB split ~8–14 CSS px
    this.material.uniforms.uRgbSplit.value = Math.min(
      0.02,
      Math.max(0.008, 12 / fullW)
    )

    this.renderFrame()
  }

  private tick = (): void => {
    if (!this.running || this.disposed) return

    this.hoverCurrent += (this.hoverTarget - this.hoverCurrent) * LERP

    // Velocity decays every frame — displace only while moving
    this.velocity.multiplyScalar(
      this.hoverTarget === 0 ? VEL_DECAY * 0.8 : VEL_DECAY
    )

    if (this.hoverCurrent < 0.001 && this.hoverTarget === 0) {
      this.hoverCurrent = 0
      this.velocity.set(0, 0)
      this.hasMouseSample = false
    }

    this.material.uniforms.uHover.value = this.hoverCurrent
    ;(this.material.uniforms.uMouse.value as THREE.Vector2).copy(
      this.mouseCurrent
    )
    ;(this.material.uniforms.uVelocity.value as THREE.Vector2).copy(
      this.velocity
    )

    this.renderFrame()
    this.raf = requestAnimationFrame(this.tick)
  }

  private renderFrame(): void {
    this.renderer.render(this.scene, this.camera)
  }

  destroy(): void {
    this.disposed = true
    this.running = false
    cancelAnimationFrame(this.raf)
    this.raf = 0

    this.wrapper.removeEventListener("pointermove", this.onPointerMove)
    this.wrapper.removeEventListener("pointerenter", this.onPointerEnter)
    this.wrapper.removeEventListener("pointerleave", this.onPointerLeave)
    document.removeEventListener("visibilitychange", this.onVisibility)
    this.io.disconnect()
    this.ro.disconnect()
    this.themeObserver.disconnect()

    this.texture?.dispose()
    this.material.dispose()
    this.mesh.geometry.dispose()
    this.renderer.dispose()
    this.canvas.remove()
    this.wrapper.classList.remove("is-active")
    delete this.wrapper.dataset.pixelInit
  }
}

let instances: PixelHeading[] = []
let bootToken = 0

export function destroyPixelTextHover(): void {
  bootToken += 1
  for (const instance of instances) instance.destroy()
  instances = []
}

export async function initPixelTextHover(): Promise<void> {
  destroyPixelTextHover()
  if (!canRun()) return

  const token = bootToken
  const wrappers = document.querySelectorAll<HTMLElement>("[data-pixel-text]")
  if (!wrappers.length) return

  try {
    await document.fonts.load('800 1em "PP Editorial New"')
    await document.fonts.ready
  } catch {
    // Font may already be available via CSS; continue
  }

  if (token !== bootToken) return

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  )
  if (token !== bootToken) return

  wrappers.forEach((wrapper) => {
    if (wrapper.dataset.pixelInit === "1") return
    const heading = wrapper.querySelector<HTMLElement>(
      ".intro-heading, .kontakt-heading, .t-hero"
    )
    if (!heading) return
    wrapper.dataset.pixelInit = "1"
    instances.push(new PixelHeading(wrapper, heading))
  })
}
