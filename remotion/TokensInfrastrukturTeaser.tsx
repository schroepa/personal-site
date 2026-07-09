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
const COLOR_GOOD = 'oklch(0.7 0.15 150)'
const COLOR_BLUE = 'oklch(0.7 0.15 250)'

const TOTAL_FRAMES = 600 // 20s @ 30fps

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
        left: 96,
        right: 96,
        bottom: 44,
        height: 3,
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
  const tick: React.CSSProperties = { position: 'absolute', width: 28, height: 28, borderColor: 'rgba(145,143,139,0.5)' }
  return (
    <>
      <div style={{ ...tick, top: 48, left: 48, borderTop: '2px solid', borderLeft: '2px solid' }} />
      <div style={{ ...tick, top: 48, right: 48, borderTop: '2px solid', borderRight: '2px solid' }} />
      <div style={{ ...tick, bottom: 48, left: 48, borderBottom: '2px solid', borderLeft: '2px solid' }} />
      <div style={{ ...tick, bottom: 48, right: 48, borderBottom: '2px solid', borderRight: '2px solid' }} />
    </>
  )
}

// --- Szene 1: Der Satz, der Design Systems tötet (0-90) --------------------

const QuoteStampScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()

  const quoteEnter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 120 }, durationInFrames: 16 })
  const stampProgress = spring({ frame: frame - 40, fps: 30, config: { damping: 10, stiffness: 220 }, durationInFrames: 14 })
  const stampScale = interpolate(stampProgress, [0, 1], [1.6, 1])
  const stampOpacity = interpolate(stampProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 150px' }}>
      <div
        style={{
          opacity: quoteEnter,
          transform: `translateY(${(1 - quoteEnter) * 20}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 1.3,
          color: COLOR_FG,
          textAlign: 'center',
          maxWidth: 1400,
        }}
      >
        „Die Tokens machen wir später.“
      </div>
      <div
        style={{
          marginTop: 36,
          padding: '12px 28px',
          border: `3px solid ${COLOR_DANGER}`,
          borderRadius: 10,
          color: COLOR_DANGER,
          fontFamily: FONT_STACK,
          fontWeight: 800,
          fontSize: 26,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          transform: `scale(${stampScale}) rotate(-3deg)`,
          opacity: stampOpacity,
        }}
      >
        Rewrite in 12 Monaten.
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 2: Infrastruktur-Metapher (90-190) -------------------------------

const InfraOutlet: React.FC = () => (
  <div style={{ width: 90, height: 90, borderRadius: 16, border: `3px solid ${COLOR_BLUE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
    <div style={{ width: 8, height: 26, borderRadius: 3, backgroundColor: COLOR_BLUE }} />
    <div style={{ width: 8, height: 26, borderRadius: 3, backgroundColor: COLOR_BLUE }} />
  </div>
)

const InfraToaster: React.FC = () => (
  <div style={{ width: 100, height: 70, borderRadius: 12, border: `3px solid ${COLOR_MUTED}`, position: 'relative' }}>
    <div style={{ position: 'absolute', top: -14, left: 20, width: 12, height: 18, borderRadius: 3, backgroundColor: COLOR_MUTED }} />
    <div style={{ position: 'absolute', top: -14, left: 44, width: 12, height: 18, borderRadius: 3, backgroundColor: COLOR_MUTED }} />
  </div>
)

const InfraMetaphorScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const leftEnter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })
  const rightEnter = spring({ frame: frame - 14, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <div style={{ width: 460, textAlign: 'center', opacity: leftEnter, transform: `translateY(${(1 - leftEnter) * 20}px)` }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
            <InfraOutlet />
          </div>
          <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 32, color: COLOR_FG, marginBottom: 8 }}>Token</div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 19, color: COLOR_MUTED }}>bleibt. Schnittstelle.</div>
        </div>

        <div style={{ width: 2, height: 200, backgroundColor: 'rgba(145,143,139,0.25)' }} />

        <div style={{ width: 460, textAlign: 'center', opacity: rightEnter, transform: `translateY(${(1 - rightEnter) * 20}px)` }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}>
            <InfraToaster />
          </div>
          <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 32, color: COLOR_FG, marginBottom: 8 }}>Komponente</div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 19, color: COLOR_MUTED }}>wechselt. Austauschbar.</div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 3: Der Farb-Bug (190-320) ----------------------------------------

const ColorBugScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()

  const swatch1 = spring({ frame, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })
  const swatch2 = spring({ frame: frame - 10, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })
  const revealProgress = spring({ frame: frame - 55, fps: 30, config: { damping: 14, stiffness: 140 }, durationInFrames: 18 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade }}>
      <div style={{ fontFamily: MONO_STACK, fontSize: 24, color: COLOR_MUTED, marginBottom: 44 }}>
        zwei entwickler. zwei hex-werte. kein token.
      </div>
      <div style={{ display: 'flex', gap: 40 }}>
        <div style={{ opacity: swatch1, transform: `translateY(${(1 - swatch1) * 20}px)`, textAlign: 'center' }}>
          <div style={{ width: 200, height: 140, borderRadius: 14, backgroundColor: '#e0393e' }} />
          <div style={{ marginTop: 16, fontFamily: MONO_STACK, fontSize: 20, color: COLOR_FG }}>#e0393e</div>
        </div>
        <div style={{ opacity: swatch2, transform: `translateY(${(1 - swatch2) * 20}px)`, textAlign: 'center' }}>
          <div style={{ width: 200, height: 140, borderRadius: 14, backgroundColor: '#e1393e' }} />
          <div style={{ marginTop: 16, fontFamily: MONO_STACK, fontSize: 20, color: COLOR_FG }}>#e1393e</div>
        </div>
      </div>
      {revealProgress > 0.01 && (
        <div
          style={{
            marginTop: 40,
            opacity: Math.min(1, revealProgress * 1.4),
            transform: `scale(${0.9 + revealProgress * 0.1})`,
            fontFamily: FONT_STACK,
            fontWeight: 800,
            fontSize: 34,
            color: COLOR_DANGER,
            textAlign: 'center',
          }}
        >
          Niemand merkt's. Bis zum QA.
        </div>
      )}
    </AbsoluteFill>
  )
}

// --- Szene 4: Der Test (320-430) --------------------------------------------

const TestScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()

  const questionOpacity = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const leftEnter = spring({ frame: frame - 26, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })
  const rightEnter = spring({ frame: frame - 38, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 120px' }}>
      <div
        style={{
          opacity: questionOpacity,
          fontFamily: FONT_STACK,
          fontWeight: 700,
          fontSize: 38,
          color: COLOR_FG,
          textAlign: 'center',
          marginBottom: 50,
          maxWidth: 1300,
        }}
      >
        Ein Wert ändert sich. Wie viele Dateien musst du anfassen?
      </div>
      <div style={{ display: 'flex', gap: 28 }}>
        <div
          style={{
            opacity: leftEnter,
            transform: `translateY(${(1 - leftEnter) * 20}px)`,
            padding: '22px 34px',
            borderRadius: 14,
            border: `2px solid ${COLOR_GOOD}`,
            backgroundColor: `color-mix(in oklch, ${COLOR_GOOD} 12%, transparent)`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 30, color: COLOR_GOOD }}>Eine.</div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 17, color: COLOR_MUTED, marginTop: 6 }}>= Infrastruktur</div>
        </div>
        <div
          style={{
            opacity: rightEnter,
            transform: `translateY(${(1 - rightEnter) * 20}px)`,
            padding: '22px 34px',
            borderRadius: 14,
            border: `2px solid ${COLOR_DANGER}`,
            backgroundColor: `color-mix(in oklch, ${COLOR_DANGER} 12%, transparent)`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 30, color: COLOR_DANGER }}>So viele wie du findest.</div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 17, color: COLOR_MUTED, marginTop: 6 }}>= getarnte Design-Entscheidung</div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 5: These (430-510) ------------------------------------------------

const ThesisScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const enter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 120 }, durationInFrames: 18 })
  const translateY = interpolate(enter, [0, 1], [26, 0])

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 130px' }}>
      <div
        style={{
          opacity: enter,
          transform: `translateY(${translateY}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 800,
          fontSize: 76,
          lineHeight: 1.18,
          letterSpacing: '-0.02em',
          color: COLOR_FG,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        Tokens sind keine Design-Entscheidung.
        <br />
        <span style={{ color: COLOR_BLUE }}>Sie sind Infrastruktur.</span>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 6: Business-Payoff (510-570) --------------------------------------

const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const enter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 120 }, durationInFrames: 16 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 150px' }}>
      <div
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 20}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 700,
          fontSize: 46,
          lineHeight: 1.35,
          color: COLOR_FG,
          textAlign: 'center',
          maxWidth: 1350,
        }}
      >
        Ein Rebrand wird zur <span style={{ color: COLOR_GOOD }}>einen</span> Änderung.
        <br />
        Nicht zum Cross-Team-Projekt mit eigenem QA-Zyklus.
      </div>
    </AbsoluteFill>
  )
}

// --- Outro (570-600) -----------------------------------------------------------

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity, textAlign: 'center', maxWidth: 1400 }}>
        <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 38, color: COLOR_FG, marginBottom: 30 }}>
          Tokens zuerst. Auch wenn's langweilig aussieht.
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 24, fontWeight: 500, color: COLOR_MUTED, letterSpacing: '0.02em' }}>
          ptrckschrdtr.de
        </div>
      </div>
    </AbsoluteFill>
  )
}

export const TokensInfrastrukturTeaser: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BG }}>
      <ShaderBackground />

      <Sequence from={0} durationInFrames={90}>
        <QuoteStampScene />
      </Sequence>

      <Sequence from={90} durationInFrames={100}>
        <InfraMetaphorScene />
      </Sequence>

      <Sequence from={190} durationInFrames={130}>
        <ColorBugScene />
      </Sequence>

      <Sequence from={320} durationInFrames={110}>
        <TestScene />
      </Sequence>

      <Sequence from={430} durationInFrames={80}>
        <ThesisScene />
      </Sequence>

      <Sequence from={510} durationInFrames={60}>
        <PayoffScene />
      </Sequence>

      <Sequence from={570} durationInFrames={30}>
        <OutroScene />
      </Sequence>

      <CornerTicks />
      <ProgressBar />
    </AbsoluteFill>
  )
}
