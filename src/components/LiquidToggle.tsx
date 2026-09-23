import * as React from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

// SVG-Koordinatenraum der Toggle-Spur (viewBox-Einheiten, nicht px)
const TRACK_WIDTH = 44
const TRACK_HEIGHT = 24
const KNOB_RADIUS = 8
const PADDING = 4
const LEFT_X = PADDING + KNOB_RADIUS
const RIGHT_X = TRACK_WIDTH - PADDING - KNOB_RADIUS
const CY = TRACK_HEIGHT / 2

// Zwei überlappende Kreise + Goo-Filter (Blur + Schwellwert-Kontrast) lassen sie
// beim Auseinanderlaufen wie einen einzigen, gestreckten Tropfen wirken.

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

interface LiquidToggleTrackProps {
  leadRef: React.RefObject<SVGCircleElement | null>
  trailRef: React.RefObject<SVGCircleElement | null>
  initialX: number
  filterId: string
}

function LiquidToggleTrack({
  leadRef,
  trailRef,
  initialX,
  filterId,
}: LiquidToggleTrackProps) {
  return (
    <svg
      viewBox={`0 0 ${TRACK_WIDTH} ${TRACK_HEIGHT}`}
      width={TRACK_WIDTH}
      height={TRACK_HEIGHT}
      aria-hidden="true"
      className="pointer-events-none"
    >
      <defs>
        <filter id={filterId}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>

      <rect
        x={0.5}
        y={0.5}
        width={TRACK_WIDTH - 1}
        height={TRACK_HEIGHT - 1}
        rx={TRACK_HEIGHT / 2}
        className="fill-muted"
      />

      <g style={{ filter: `url(#${filterId})` }}>
        <circle
          ref={trailRef}
          cx={initialX}
          cy={CY}
          r={KNOB_RADIUS}
          className="fill-foreground"
        />
        <circle
          ref={leadRef}
          cx={initialX}
          cy={CY}
          r={KNOB_RADIUS}
          className="fill-foreground"
        />
      </g>
    </svg>
  )
}

/**
 * Liest/schreibt dieselbe `localStorage("theme")` + `.dark`-Klasse wie die
 * FOUC-Prevention und die astro:before-swap-Persistenz in BaseLayout.astro.
 */
function useThemeState() {
  const [dark, setDarkState] = React.useState(false)

  React.useEffect(() => {
    setDarkState(document.documentElement.classList.contains("dark"))
  }, [])

  const setDark = React.useCallback((next: boolean) => {
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
    setDarkState(next)
    window.posthog?.capture("theme_toggled", {
      theme: next ? "dark" : "light",
    })
  }, [])

  return { dark, setDark }
}

interface LiquidToggleProps {
  className?: string
  /** Rendert eine zweite, per Portal platzierte Kopie (z.B. im Mobile-Menü). */
  portalTargetId?: string
}

export default function LiquidToggle({
  className,
  portalTargetId,
}: LiquidToggleProps) {
  const { dark, setDark } = useThemeState()
  const [portalTarget, setPortalTarget] = React.useState<Element | null>(null)
  const baseId = React.useId()

  const reducedMotionRef = React.useRef(false)
  const leadXRef = React.useRef(LEFT_X)
  const trailXRef = React.useRef(LEFT_X)
  const targetXRef = React.useRef(LEFT_X)
  const rafRef = React.useRef<number | null>(null)

  const leadCircleRef = React.useRef<SVGCircleElement>(null)
  const trailCircleRef = React.useRef<SVGCircleElement>(null)
  const leadCirclePortalRef = React.useRef<SVGCircleElement>(null)
  const trailCirclePortalRef = React.useRef<SVGCircleElement>(null)

  React.useEffect(() => {
    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    const startX = document.documentElement.classList.contains("dark")
      ? RIGHT_X
      : LEFT_X
    leadXRef.current = startX
    trailXRef.current = startX
    targetXRef.current = startX
    applyPositions(startX, startX)

    if (portalTargetId) {
      setPortalTarget(document.getElementById(portalTargetId))
    }
  }, [portalTargetId])

  function applyPositions(lead: number, trail: number) {
    leadCircleRef.current?.setAttribute("cx", String(lead))
    trailCircleRef.current?.setAttribute("cx", String(trail))
    leadCirclePortalRef.current?.setAttribute("cx", String(lead))
    trailCirclePortalRef.current?.setAttribute("cx", String(trail))
  }

  function stopLoop() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  function startLoop() {
    stopLoop()

    function tick() {
      leadXRef.current = lerp(leadXRef.current, targetXRef.current, 0.28)
      trailXRef.current = lerp(trailXRef.current, leadXRef.current, 0.16)
      applyPositions(leadXRef.current, trailXRef.current)

      const settled =
        Math.abs(leadXRef.current - targetXRef.current) < 0.05 &&
        Math.abs(trailXRef.current - leadXRef.current) < 0.05

      if (settled) {
        leadXRef.current = targetXRef.current
        trailXRef.current = targetXRef.current
        applyPositions(leadXRef.current, trailXRef.current)
        rafRef.current = null
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  React.useEffect(() => stopLoop, [])

  function handleToggle() {
    const next = !dark
    setDark(next)
    targetXRef.current = next ? RIGHT_X : LEFT_X

    if (reducedMotionRef.current) {
      leadXRef.current = targetXRef.current
      trailXRef.current = targetXRef.current
      applyPositions(leadXRef.current, trailXRef.current)
      return
    }
    startLoop()
  }

  const label = dark ? "Zu Hell-Modus wechseln" : "Zu Dunkel-Modus wechseln"

  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label={label}
      onClick={handleToggle}
      data-cursor="button"
      className={cn(
        "inline-flex items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        className
      )}
    >
      <LiquidToggleTrack
        leadRef={leadCircleRef}
        trailRef={trailCircleRef}
        initialX={leadXRef.current}
        filterId={`${baseId}-main`}
      />
    </button>
  )

  const portalButton = portalTarget
    ? (
        <button
          type="button"
          role="switch"
          aria-checked={dark}
          aria-label={label}
          onClick={handleToggle}
          data-cursor="button"
          className="inline-flex items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
        >
          <LiquidToggleTrack
            leadRef={leadCirclePortalRef}
            trailRef={trailCirclePortalRef}
            initialX={leadXRef.current}
            filterId={`${baseId}-portal`}
          />
        </button>
      )
    : null

  return (
    <>
      {button}
      {portalTarget && portalButton
        ? createPortal(portalButton, portalTarget)
        : null}
    </>
  )
}
