/**
 * Lichtband: WebGL-Shader (Port von docs/reference/atmosphaere.js, Prototyp v14) mit Canvas-2D-Rückfall.
 *
 * Gleich zum Prototyp: 4 Gauß-Flecken exp(−2.6·d²/r²) in Fließkomma, Dithering ±1.5/255, volle CSS-Auflösung,
 * Grundfläche hell Weiß / dunkel Schwarz, Paletten und Fleckenlage (lichtband-geometrie.ts), Drift, Zusammenzug beim
 * Scrollen, Zufallsstartwert je Besuch. Mischmodus, Deckkraft und Maske liegen im CSS (Lichtband.astro).
 *
 * Anders als der Prototyp (Absicht):
 * - kein <style> per JS; alles Bewegungsrelevante aus den Tokens (--motion-lichtband-*), Gate html[data-motion];
 * - vollständiges Teardown (Beobachter, Hörer, Schleife, Animation, GL-Kontext);
 * - Schleife nur, solange das Band sichtbar ist (IntersectionObserver) und der Tab sichtbar ist; sonst kein rAF;
 * - Takt 25 Bilder/s ohne Aufrunden auf Vielfache des Bildschirmtakts (Rest wird mitgeführt);
 * - Canvasgröße aus clientWidth/clientHeight (unabhängig von der Stauchung beim Scrollen) per ResizeObserver;
 * - Kontextverlust und -wiederherstellung;
 * - Pixeldichte: bewusst CSS-Pixel (wie der Prototyp, devicePixelRatio wird nicht multipliziert). Das Band ist ein
 *   weicher Verlauf; mehr Pixel kosten GPU-Zeit ohne sichtbaren Gewinn. Das Dithering läuft je CSS-Pixel weiter.
 */
import { animationErlaubt, zeigen } from "./motion/einmal"
import { prefersReducedMotion, readToken } from "./motion/tokens"
import {
  blobLayout,
  blobPosition,
  DITHER_STUFEN,
  GAUSS_K,
  paletteFor,
  scrollZusammenzug,
  type Blob,
} from "./lichtband-geometrie"

export { blobLayout, blobPosition, paletteFor, scrollZusammenzug } from "./lichtband-geometrie"
export type { Blob } from "./lichtband-geometrie"

/** Mindestgröße des Zeichenpuffers (Prototyp: 64 × 32). */
const MIN_BREITE = 64
const MIN_HOEHE = 32

declare global {
  interface Window {
    /** Nur in Dev-/Testbuilds: Zähler und Probe des Lichtbands (im Produktivbuild entfernt) */
    __lichtband?: { instanzen: number; kontexte: number; frames: number; probe: () => number[] | null }
  }
}

/** Ein Startwert je Besuch (das Modul lebt über Client-Router-Seitenwechsel hinweg). Papierkorn kann ihn teilen. */
const BESUCH_SEED = Math.random() * 1000
export function besuchSeed(): number {
  return BESUCH_SEED
}

const dev = {
  instanzen: 0,
  kontexte: 0,
  frames: 0,
  aktive: new Set<() => number[] | null>(),
}
function devMelden(): void {
  if (!import.meta.env.DEV) return
  window.__lichtband = {
    instanzen: dev.instanzen,
    kontexte: dev.kontexte,
    frames: dev.frames,
    probe: () => [...dev.aktive][0]?.() ?? null,
  }
}

const VERTEX = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}"
const FRAGMENT = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 res;uniform vec3 base;uniform vec4 pos[4];uniform vec4 col[4];uniform float t;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec2 p=vec2(gl_FragCoord.x,res.y-gl_FragCoord.y);vec3 c=base;
for(int i=0;i<4;i++){vec2 d=p-pos[i].xy;float q=dot(d,d)/(pos[i].z*pos[i].z);float a=col[i].a*exp(-${GAUSS_K.toFixed(1)}*q);c=mix(c,col[i].rgb,a);}
float n=h(p+fract(t*.001)*61.)+h(p*1.37+17.)-1.;c+=n*(${DITHER_STUFEN.toFixed(1)}/255.);
gl_FragColor=vec4(c,1.);}`

/** Dunkel? Aus dem Token (--effekt-lichtband-dunkel: 1 im dunklen Theme), sonst aus data-theme / Systemeinstellung. */
function istDunkel(): boolean {
  const roh = getComputedStyle(document.documentElement).getPropertyValue("--effekt-lichtband-dunkel").trim()
  const zahl = parseFloat(roh)
  if (Number.isFinite(zahl)) return zahl > 0.5
  const t = document.documentElement.dataset.theme
  return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches
}

type Zeichner = (t: number, w: number, h: number, dunkel: boolean) => void
interface Gl {
  zeichnen: Zeichner
  lesen: (x: number, y: number) => number[]
  freigeben: () => void
}

/** Shader, Puffer und Zeichenfunktion für einen WebGL-Kontext aufbauen. Wirft bei Compile-/Linkfehlern. */
function glAufbauen(gl: WebGLRenderingContext, flecken: Blob[]): Gl {
  const shader = (typ: number, quelle: string) => {
    const s = gl.createShader(typ)
    if (!s) throw new Error("Shader konnte nicht angelegt werden")
    gl.shaderSource(s, quelle)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`Shader: ${gl.getShaderInfoLog(s) ?? "Fehler"}`)
    return s
  }
  const vs = shader(gl.VERTEX_SHADER, VERTEX)
  const fs = shader(gl.FRAGMENT_SHADER, FRAGMENT)
  const programm = gl.createProgram()
  if (!programm) throw new Error("Programm konnte nicht angelegt werden")
  gl.attachShader(programm, vs)
  gl.attachShader(programm, fs)
  gl.linkProgram(programm)
  if (!gl.getProgramParameter(programm, gl.LINK_STATUS)) throw new Error(`Programm: ${gl.getProgramInfoLog(programm) ?? "Fehler"}`)
  gl.useProgram(programm)
  const puffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, puffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
  const a = gl.getAttribLocation(programm, "a")
  gl.enableVertexAttribArray(a)
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0)
  const U = (n: string) => gl.getUniformLocation(programm, n)
  const [uRes, uT, uBase, uPos, uCol] = [U("res"), U("t"), U("base"), U("pos"), U("col")]
  return {
    zeichnen(t, w, h, dunkel) {
      const fl = paletteFor(dunkel)
      gl.viewport(0, 0, w, h)
      gl.uniform2f(uRes, w, h)
      gl.uniform1f(uT, t)
      const grund = dunkel ? 0 : 1
      gl.uniform3f(uBase, grund, grund, grund)
      const P: number[] = []
      const C: number[] = []
      for (const f of flecken) {
        const [x, y, r] = blobPosition(f, t, w, h)
        P.push(x, y, r, 0)
        const c = fl[f.i]
        C.push(c[0] / 255, c[1] / 255, c[2] / 255, c[3])
      }
      gl.uniform4fv(uPos, P)
      gl.uniform4fv(uCol, C)
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    },
    // Nur direkt nach dem Zeichnen im selben Task gültig (ohne preserveDrawingBuffer)
    lesen(x, y) {
      const px = new Uint8Array(4)
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
      return [...px]
    },
    freigeben() {
      gl.deleteBuffer(puffer)
      gl.deleteProgram(programm)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    },
  }
}

/** Canvas-2D-Rückfall wie im Prototyp: Radialverläufe mit angenähertem Gauß-Abfall (ohne Dithering). */
function zweiDAufbauen(ctx: CanvasRenderingContext2D, flecken: Blob[]): Zeichner {
  return (t, w, h, dunkel) => {
    const fl = paletteFor(dunkel)
    ctx.fillStyle = dunkel ? "#000" : "#fff"
    ctx.fillRect(0, 0, w, h)
    for (const f of flecken) {
      const [x, y, r] = blobPosition(f, t, w, h)
      const c = fl[f.i]
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.3)
      for (const s of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
        g.addColorStop(s, `rgba(${c[0]},${c[1]},${c[2]},${(c[3] * Math.exp(-GAUSS_K * s * s * 1.69)).toFixed(3)})`)
      }
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }
  }
}

export function initLichtband(canvas: HTMLCanvasElement): () => void {
  const huelle = canvas.parentElement
  const flecken = blobLayout(besuchSeed())
  const reduziert = prefersReducedMotion()
  const abmelden: Array<() => void> = []

  let dunkel = istDunkel()
  let gl: WebGLRenderingContext | null = null
  let glRes: Gl | null = null
  let ctx2d: CanvasRenderingContext2D | null = null
  let zeichner: Zeichner | null = null
  let verloren = false
  let beendet = false
  let kontextGezaehlt = false

  const zaehleKontext = (delta: 1 | -1) => {
    if (delta === 1 && kontextGezaehlt) return
    if (delta === -1 && !kontextGezaehlt) return
    kontextGezaehlt = delta === 1
    dev.kontexte += delta
    devMelden()
  }

  // Kontext holen: WebGL, sonst 2D, sonst nichts (der statische Verlauf bleibt)
  gl = canvas.getContext("webgl", { premultipliedAlpha: false, antialias: false }) as WebGLRenderingContext | null
  if (gl) {
    zaehleKontext(1)
    if (gl.isContextLost()) verloren = true
    else {
      try {
        glRes = glAufbauen(gl, flecken)
        zeichner = glRes.zeichnen
      } catch (fehler) {
        console.warn("Lichtband: Shader nicht verfügbar, statischer Verlauf bleibt.", fehler)
        zaehleKontext(-1)
        return () => {}
      }
    }
  } else {
    ctx2d = canvas.getContext("2d")
    if (ctx2d) zeichner = zweiDAufbauen(ctx2d, flecken)
  }
  if (!gl && !ctx2d) return () => {}

  dev.instanzen += 1
  devMelden()

  let breite = 0
  let hoehe = 0
  const groesseSetzen = (): boolean => {
    const b = Math.max(MIN_BREITE, Math.round(canvas.clientWidth))
    const h = Math.max(MIN_HOEHE, Math.round(canvas.clientHeight))
    if (b === breite && h === hoehe) return false
    breite = b
    hoehe = h
    canvas.width = b
    canvas.height = h
    return true
  }

  const zeichnen = (t: number) => {
    if (!zeichner || verloren || beendet) return
    zeichner(t, breite, hoehe, dunkel)
    dev.frames += 1
    devMelden()
  }

  const aktivSetzen = (an: boolean) => huelle?.toggleAttribute("data-aktiv", an)

  // Schleife: nur während sichtbar (Band im Viewport, Tab sichtbar) und nicht reduziert
  let imBild = true
  let rafId = 0
  let zuletzt = 0
  let intervall = 0
  const sichtbarerTab = () => document.visibilityState !== "hidden"
  const schleife = (t: number) => {
    rafId = 0
    if (beendet || !imBild || !sichtbarerTab() || verloren) return
    if (t - zuletzt >= intervall) {
      zeichnen(t)
      // Rest mitführen: so bleibt der Takt im Mittel bei 25 Bildern/s, auch wenn der Bildschirm 60 Hz hat
      zuletzt = t - ((t - zuletzt) % intervall)
    }
    rafId = requestAnimationFrame(schleife)
  }
  const anwerfen = () => {
    if (reduziert || rafId || beendet || !imBild || !sichtbarerTab() || verloren) return
    zuletzt = performance.now() - intervall
    rafId = requestAnimationFrame(schleife)
  }
  const anhalten = () => {
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
  }

  groesseSetzen()
  if (!verloren) {
    zeichnen(performance.now())
    aktivSetzen(true)
  }

  // Größe folgt dem Layout (kein Layoutsprung: der Canvas ist absolut und per CSS gesetzt)
  const ro = new ResizeObserver(() => {
    if (groesseSetzen()) zeichnen(performance.now())
  })
  ro.observe(canvas)
  abmelden.push(() => ro.disconnect())

  // Theme: data-theme und Systemeinstellung; Palette, Grundfläche und Mischmodus (CSS) wechseln sofort
  const beiTheme = () => {
    dunkel = istDunkel()
    zeichnen(performance.now())
  }
  const mo = new MutationObserver(beiTheme)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
  const farbschema = matchMedia("(prefers-color-scheme: dark)")
  farbschema.addEventListener("change", beiTheme)
  abmelden.push(() => {
    mo.disconnect()
    farbschema.removeEventListener("change", beiTheme)
  })

  // Kontextverlust (nur WebGL)
  if (gl) {
    const lostGl = gl
    const beiVerlust = (e: Event) => {
      e.preventDefault()
      verloren = true
      anhalten()
      aktivSetzen(false)
    }
    const beiWiederkehr = () => {
      try {
        glRes = glAufbauen(lostGl, flecken)
        zeichner = glRes.zeichnen
        verloren = false
        groesseSetzen()
        zeichnen(performance.now())
        aktivSetzen(true)
        anwerfen()
      } catch (fehler) {
        console.warn("Lichtband: Wiederherstellung fehlgeschlagen, statischer Verlauf bleibt.", fehler)
      }
    }
    canvas.addEventListener("webglcontextlost", beiVerlust)
    canvas.addEventListener("webglcontextrestored", beiWiederkehr)
    abmelden.push(() => {
      canvas.removeEventListener("webglcontextlost", beiVerlust)
      canvas.removeEventListener("webglcontextrestored", beiWiederkehr)
    })
    // Kontext eines früheren Durchlaufs ist noch verloren (Teardown gab ihn frei): wiederbeleben
    if (verloren) lostGl.getExtension("WEBGL_lose_context")?.restoreContext()
  }

  if (!reduziert) {
    intervall = readToken("--motion-lichtband-bildintervall")

    const io = new IntersectionObserver((e) => {
      imBild = e[e.length - 1].isIntersecting
      if (imBild) {
        // gleich ein frisches Bild, danach der Takt
        if (!rafId) zeichnen(performance.now())
        anwerfen()
      } else anhalten()
    })
    io.observe(canvas)
    const beiSichtbarkeit = () => (sichtbarerTab() ? anwerfen() : anhalten())
    document.addEventListener("visibilitychange", beiSichtbarkeit)
    abmelden.push(() => {
      io.disconnect()
      document.removeEventListener("visibilitychange", beiSichtbarkeit)
      anhalten()
    })
    anwerfen()

    // Zusammenzug beim Scrollen
    if (huelle) {
      const beimScrollen = () => {
        const z = scrollZusammenzug(window.scrollY, huelle.offsetHeight)
        canvas.style.transform = `translateY(${z.y}px) scaleY(${z.skala})`
      }
      window.addEventListener("scroll", beimScrollen, { passive: true })
      beimScrollen()
      abmelden.push(() => {
        window.removeEventListener("scroll", beimScrollen)
        canvas.style.removeProperty("transform")
      })
    }
  }

  // Einblenden: Startzustand (opacity 0) setzt neu-bewegung.css unter html[data-motion] bis data-anim-fertig steht
  // data-einblenden steuert, dass auch der Fallback-Verlauf sanft ausgeht (nicht bei Wiederherstellung/Reduziert)
  const blendetEin = !reduziert && animationErlaubt() && readToken("--motion-lichtband-einblenden") > 0
  if (blendetEin) huelle?.setAttribute("data-einblenden", "")
  zeigen(canvas)
  if (blendetEin) {
    const dauer = readToken("--motion-lichtband-einblenden")
    if (dauer > 0) {
      const easing = getComputedStyle(document.documentElement).getPropertyValue("--motion-easing-blenden").trim() || "ease"
      // Einzelner Endpunkt: der Zielwert ist die berechnete Deckkraft (Token --lichtband-deckkraft)
      const anim = canvas.animate([{ opacity: 0 }], { duration: dauer, easing, fill: "backwards" })
      abmelden.push(() => anim.cancel())
    }
  }

  if (import.meta.env.DEV) {
    const probe = (): number[] | null => {
      if (!zeichner || verloren) return null
      const t = performance.now()
      zeichner(t, breite, hoehe, dunkel)
      const punkte: Array<[number, number]> = [
        [0.1, 0.5],
        [0.3, 0.5],
        [0.5, 0.5],
        [0.7, 0.5],
        [0.9, 0.5],
        [0.5, 0.2],
        [0.5, 0.8],
      ]
      const aus: number[] = []
      for (const [px, py] of punkte) {
        const x = Math.floor(px * breite)
        const y = Math.floor(py * hoehe)
        if (glRes) aus.push(...glRes.lesen(x, hoehe - 1 - y))
        else if (ctx2d) aus.push(...ctx2d.getImageData(x, y, 1, 1).data)
      }
      return aus
    }
    dev.aktive.add(probe)
    abmelden.push(() => dev.aktive.delete(probe))
  }

  return () => {
    if (beendet) return
    beendet = true
    anhalten()
    for (const fn of abmelden.splice(0).reverse()) fn()
    aktivSetzen(false)
    huelle?.removeAttribute("data-einblenden")
    glRes?.freigeben()
    if (gl) {
      // Kontext freigeben, damit wiederholte Seitenwechsel keine Kontexte anhäufen
      gl.getExtension("WEBGL_lose_context")?.loseContext()
      zaehleKontext(-1)
    }
    dev.instanzen -= 1
    devMelden()
  }
}
