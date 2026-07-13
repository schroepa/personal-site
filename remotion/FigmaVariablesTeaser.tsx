import React, { useEffect, useState } from 'react'
import {
  AbsoluteFill,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { GrainGradient } from '@paper-design/shaders-react'

const FONT_STACK = '"Helvetica Neue", Helvetica, Arial, sans-serif'
const MONO_STACK = '"SF Mono", "Menlo", "Consolas", monospace'

const COLOR_BG = '#0a0907'
const COLOR_FG = '#f6f5f3'
const COLOR_MUTED = '#918f8b'
const COLOR_DANGER = '#c9503f'
const COLOR_BLUE = 'oklch(0.7 0.15 250)'

const TOTAL_FRAMES = 630 // 21s @ 30fps

const ShaderBackground: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const [handle] = useState(() => delayRender('paper-shader-init'))

  useEffect(() => {
    const timeout = setTimeout(() => continueRender(handle), 400)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <GrainGradient
      style={{ position: 'absolute', inset: 0 }}
      speed={0}
      frame={(frame / fps) * 1000}
      colorBack={COLOR_BG}
      colors={['#141312', '#26221f', '#3a3530']}
      softness={0.85}
      intensity={0.35}
      noise={0.4}
      shape="ripple"
      scale={1.4}
    />
  )
}

function useCrossfade(overlap = 12) {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const fadeIn = interpolate(frame, [0, overlap], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fadeOut = interpolate(
    frame,
    [durationInFrames - overlap, durationInFrames],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  return Math.min(fadeIn, fadeOut)
}

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame()
  const progress = interpolate(frame, [0, TOTAL_FRAMES], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        right: 64,
        bottom: 64,
        height: 4,
        borderRadius: 999,
        backgroundColor: 'rgba(145,143,139,0.2)',
        overflow: 'hidden',
      }}
    >
      <div style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: COLOR_MUTED, borderRadius: 999 }} />
    </div>
  )
}

const CornerTicks: React.FC = () => {
  const tick: React.CSSProperties = { position: 'absolute', width: 32, height: 32, borderColor: 'rgba(145,143,139,0.5)' }
  return (
    <>
      <div style={{ ...tick, top: 56, left: 56, borderTop: '2px solid', borderLeft: '2px solid' }} />
      <div style={{ ...tick, top: 56, right: 56, borderTop: '2px solid', borderRight: '2px solid' }} />
      <div style={{ ...tick, bottom: 56, left: 56, borderBottom: '2px solid', borderLeft: '2px solid' }} />
      <div style={{ ...tick, bottom: 56, right: 56, borderBottom: '2px solid', borderRight: '2px solid' }} />
    </>
  )
}

// --- Szene 1: Der Kickoff-Satz (0-90) ---------------------------------------

const ClaimScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const enter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 120 }, durationInFrames: 16 })
  const stampProgress = spring({ frame: frame - 42, fps: 30, config: { damping: 10, stiffness: 220 }, durationInFrames: 14 })
  const stampScale = interpolate(stampProgress, [0, 1], [1.6, 1])
  const stampOpacity = interpolate(stampProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 64px' }}>
      <div
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 20}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 800,
          fontSize: 84,
          lineHeight: 1.18,
          color: COLOR_FG,
          textAlign: 'center',
        }}
      >
        „Figma Variables syncen doch automatisch mit dem Code.“
      </div>
      <div
        style={{
          marginTop: 48,
          padding: '18px 36px',
          border: `4px solid ${COLOR_DANGER}`,
          borderRadius: 14,
          color: COLOR_DANGER,
          fontFamily: FONT_STACK,
          fontWeight: 800,
          fontSize: 38,
          letterSpacing: '0.03em',
          textTransform: 'uppercase',
          transform: `scale(${stampScale}) rotate(-3deg)`,
          opacity: stampOpacity,
          textAlign: 'center',
        }}
      >
        Haben sie nie.
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 2: Zwei Datenmodelle, gestapelt (90-210) -------------------------

const ModelsScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const topEnter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })
  const bottomEnter = spring({ frame: frame - 20, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 64px' }}>
      <div
        style={{
          fontFamily: MONO_STACK,
          fontSize: 30,
          color: COLOR_MUTED,
          marginBottom: 80,
          textAlign: 'center',
        }}
      >
        gleicher name. anderes modell.
      </div>

      <div style={{ opacity: topEnter, transform: `translateY(${(1 - topEnter) * 20}px)`, textAlign: 'center', marginBottom: 84 }}>
        <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 72, color: COLOR_MUTED, marginBottom: 18 }}>
          FIGMA
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 30, color: COLOR_MUTED }}>RGBA. Kein color-mix().</div>
      </div>

      <div style={{ width: 120, height: 3, backgroundColor: 'rgba(145,143,139,0.3)', marginBottom: 84 }} />

      <div style={{ opacity: bottomEnter, transform: `translateY(${(1 - bottomEnter) * 20}px)`, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 72, color: COLOR_BLUE, marginBottom: 18 }}>
          CODE
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 30, color: COLOR_FG }}>oklch(), calc(), color-mix().</div>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 3: Vier Bruchstellen (210-330) -----------------------------------

const BREAKS = ['Namenskonvention', 'Unidirektionaler Sync', 'Composite Tokens', 'Aliasing-Tiefe']

const BreaksScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const headlineOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 64px' }}>
      <div style={{ opacity: headlineOpacity, fontFamily: FONT_STACK, fontWeight: 700, fontSize: 44, color: COLOR_FG, marginBottom: 64, textAlign: 'center' }}>
        Vier Stellen, an denen es bricht:
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%' }}>
        {BREAKS.map((label, i) => {
          const enter = spring({ frame: frame - 16 - i * 10, fps: 30, config: { damping: 200, stiffness: 140 }, durationInFrames: 16 })
          return (
            <div
              key={label}
              style={{
                opacity: enter,
                transform: `translateX(${(1 - enter) * -30}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 24,
              }}
            >
              <div
                style={{
                  fontFamily: MONO_STACK,
                  fontSize: 34,
                  color: COLOR_BLUE,
                  fontWeight: 700,
                  flexShrink: 0,
                  width: 60,
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 42, color: COLOR_FG }}>{label}</div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 4: Der Farb-Drift (330-450) ---------------------------------------

const DriftScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const swatch1 = spring({ frame, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })
  const swatch2 = spring({ frame: frame - 12, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })
  const revealProgress = spring({ frame: frame - 55, fps: 30, config: { damping: 14, stiffness: 140 }, durationInFrames: 18 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 64px' }}>
      <div style={{ fontFamily: MONO_STACK, fontSize: 28, color: COLOR_MUTED, marginBottom: 56, textAlign: 'center' }}>
        primary in figma. --primary im code.
      </div>
      <div style={{ display: 'flex', gap: 48 }}>
        <div style={{ opacity: swatch1, transform: `translateY(${(1 - swatch1) * 20}px)`, textAlign: 'center' }}>
          <div style={{ width: 260, height: 200, borderRadius: 18, backgroundColor: 'oklch(0.55 0.18 250)' }} />
          <div style={{ marginTop: 18, fontFamily: MONO_STACK, fontSize: 24, color: COLOR_FG }}>Figma</div>
        </div>
        <div style={{ opacity: swatch2, transform: `translateY(${(1 - swatch2) * 20}px)`, textAlign: 'center' }}>
          <div style={{ width: 260, height: 200, borderRadius: 18, backgroundColor: 'oklch(0.55 0.18 258)' }} />
          <div style={{ marginTop: 18, fontFamily: MONO_STACK, fontSize: 24, color: COLOR_FG }}>Code</div>
        </div>
      </div>
      {revealProgress > 0.01 && (
        <div
          style={{
            marginTop: 56,
            opacity: Math.min(1, revealProgress * 1.4),
            transform: `scale(${0.9 + revealProgress * 0.1})`,
            fontFamily: FONT_STACK,
            fontWeight: 800,
            fontSize: 40,
            color: COLOR_DANGER,
            textAlign: 'center',
          }}
        >
          Drei Sprints. Niemand merkt's.
        </div>
      )}
    </AbsoluteFill>
  )
}

// --- Szene 5: These (450-540) --------------------------------------------------

const ThesisScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const enter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 120 }, durationInFrames: 18 })
  const translateY = interpolate(enter, [0, 1], [26, 0])

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 64px' }}>
      <div
        style={{
          opacity: enter,
          transform: `translateY(${translateY}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 800,
          fontSize: 84,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
          color: COLOR_FG,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        Volle Automatisierung
        <br />
        <span style={{ color: COLOR_BLUE }}>ist eine Illusion.</span>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 6: Business-Payoff (540-600) ----------------------------------------

const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const enter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 120 }, durationInFrames: 16 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 64px' }}>
      <div
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 20}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 700,
          fontSize: 54,
          lineHeight: 1.4,
          color: COLOR_FG,
          textAlign: 'center',
        }}
      >
        30 Minuten Review pro Woche.
        <br />
        Statt <span style={{ color: COLOR_DANGER }}>Feuerwehr im Sprint-Review.</span>
      </div>
    </AbsoluteFill>
  )
}

// --- Outro (600-630) -------------------------------------------------------------

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 64px' }}>
      <div style={{ opacity, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 44, color: COLOR_FG, marginBottom: 36, lineHeight: 1.3 }}>
          Code führt Werte. Figma führt Struktur.
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 30, fontWeight: 500, color: COLOR_MUTED, letterSpacing: '0.02em' }}>
          ptrckschrdtr.de
        </div>
      </div>
    </AbsoluteFill>
  )
}

export const FigmaVariablesTeaser: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BG }}>
      <ShaderBackground />

      <Sequence from={0} durationInFrames={90}>
        <ClaimScene />
      </Sequence>

      <Sequence from={90} durationInFrames={120}>
        <ModelsScene />
      </Sequence>

      <Sequence from={210} durationInFrames={120}>
        <BreaksScene />
      </Sequence>

      <Sequence from={330} durationInFrames={120}>
        <DriftScene />
      </Sequence>

      <Sequence from={450} durationInFrames={90}>
        <ThesisScene />
      </Sequence>

      <Sequence from={540} durationInFrames={60}>
        <PayoffScene />
      </Sequence>

      <Sequence from={600} durationInFrames={30}>
        <OutroScene />
      </Sequence>

      <CornerTicks />
      <ProgressBar />
    </AbsoluteFill>
  )
}
