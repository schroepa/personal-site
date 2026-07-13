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
const COLOR_GREEN = 'oklch(0.7 0.15 150)'
const COLOR_PINK = 'oklch(0.7 0.15 330)'

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

// --- Szene 1: Die Behauptung (0-90) ------------------------------------------

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
          fontSize: 96,
          lineHeight: 1.16,
          color: COLOR_FG,
          textAlign: 'center',
        }}
      >
        „Single Source of Truth.“
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
        Meistens eine Lüge.
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 2: Die drei Wahrheiten (90-240) -----------------------------------

const TRUTHS: { label: string; sub: string; color: string }[] = [
  { label: 'Figma', sub: 'wo Design entsteht', color: COLOR_BLUE },
  { label: 'Code', sub: 'was ausgeliefert wird', color: COLOR_GREEN },
  { label: 'Köpfe', sub: 'was niemand aufschreibt', color: COLOR_PINK },
]

const TruthsScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const headlineOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 64px' }}>
      <div style={{ opacity: headlineOpacity, fontFamily: MONO_STACK, fontSize: 28, color: COLOR_MUTED, marginBottom: 64, textAlign: 'center' }}>
        es gibt nicht eine. es gibt mindestens drei.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40, width: '100%', alignItems: 'center' }}>
        {TRUTHS.map((t, i) => {
          const enter = spring({ frame: frame - 16 - i * 14, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 18 })
          return (
            <div
              key={t.label}
              style={{
                opacity: enter,
                transform: `translateY(${(1 - enter) * 24}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 26,
                padding: '22px 40px',
                borderRadius: 18,
                border: `2px solid ${t.color}`,
                backgroundColor: `color-mix(in oklch, ${t.color} 12%, transparent)`,
                width: 620,
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: t.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 44, color: COLOR_FG }}>{t.label}</div>
                <div style={{ fontFamily: MONO_STACK, fontSize: 22, color: COLOR_MUTED, marginTop: 4 }}>{t.sub}</div>
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 3: Der Deprecation-Test (240-360) ---------------------------------

const TestScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const questionOpacity = interpolate(frame, [0, 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const topEnter = spring({ frame: frame - 26, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })
  const bottomEnter = spring({ frame: frame - 40, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 64px' }}>
      <div
        style={{
          opacity: questionOpacity,
          fontFamily: FONT_STACK,
          fontWeight: 700,
          fontSize: 46,
          color: COLOR_FG,
          textAlign: 'center',
          marginBottom: 60,
        }}
      >
        Was passiert, wenn ein Token deprecated wird?
      </div>
      <div
        style={{
          opacity: topEnter,
          transform: `translateY(${(1 - topEnter) * 20}px)`,
          padding: '20px 36px',
          borderRadius: 14,
          border: `2px solid ${COLOR_GREEN}`,
          textAlign: 'center',
          marginBottom: 24,
          width: 640,
        }}
      >
        <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 30, color: COLOR_GREEN }}>Alle drei wissen es.</div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 20, color: COLOR_MUTED, marginTop: 6 }}>= echte Übersetzung</div>
      </div>
      <div
        style={{
          opacity: bottomEnter,
          transform: `translateY(${(1 - bottomEnter) * 20}px)`,
          padding: '20px 36px',
          borderRadius: 14,
          border: `2px solid ${COLOR_DANGER}`,
          textAlign: 'center',
          width: 640,
        }}
      >
        <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 30, color: COLOR_DANGER }}>Nur eine merkt's.</div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 20, color: COLOR_MUTED, marginTop: 6 }}>= Behauptung, keine Wahrheit</div>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 4: These (360-450) --------------------------------------------------

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
          fontSize: 76,
          lineHeight: 1.22,
          letterSpacing: '-0.01em',
          color: COLOR_FG,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        Nicht eine Wahrheit.
        <br />
        <span style={{ color: COLOR_BLUE }}>Drei, die man übersetzt.</span>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 5: Business-Payoff (450-510) ----------------------------------------

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
          fontSize: 52,
          lineHeight: 1.4,
          color: COLOR_FG,
          textAlign: 'center',
        }}
      >
        Diese Ehrlichkeit
        <br />
        <span style={{ color: COLOR_GREEN }}>spart Geld.</span> Sie kostet keins.
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 6: Der Reminder (510-580) --------------------------------------------

const ReminderScene: React.FC = () => {
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
          fontSize: 46,
          lineHeight: 1.4,
          color: COLOR_FG,
          textAlign: 'center',
        }}
      >
        Fünf Minuten pro Entscheidung.
        <br />
        Wochen Debugging gespart.
      </div>
    </AbsoluteFill>
  )
}

// --- Outro (580-630) -------------------------------------------------------------

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 64px' }}>
      <div style={{ opacity, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 40, color: COLOR_FG, marginBottom: 36, lineHeight: 1.3 }}>
          Weniger elegant als eine Folie. Hält aber nach zwei Jahren noch.
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 30, fontWeight: 500, color: COLOR_MUTED, letterSpacing: '0.02em' }}>
          ptrckschrdtr.de
        </div>
      </div>
    </AbsoluteFill>
  )
}

export const SsotLuegeTeaser: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BG }}>
      <ShaderBackground />

      <Sequence from={0} durationInFrames={90}>
        <ClaimScene />
      </Sequence>

      <Sequence from={90} durationInFrames={150}>
        <TruthsScene />
      </Sequence>

      <Sequence from={240} durationInFrames={120}>
        <TestScene />
      </Sequence>

      <Sequence from={360} durationInFrames={90}>
        <ThesisScene />
      </Sequence>

      <Sequence from={450} durationInFrames={60}>
        <PayoffScene />
      </Sequence>

      <Sequence from={510} durationInFrames={70}>
        <ReminderScene />
      </Sequence>

      <Sequence from={580} durationInFrames={50}>
        <OutroScene />
      </Sequence>

      <CornerTicks />
      <ProgressBar />
    </AbsoluteFill>
  )
}
