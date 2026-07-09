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

// --- Szene 1: Der Claim (0-90) ----------------------------------------------

const ClaimScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()

  const enter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 120 }, durationInFrames: 16 })
  const stampProgress = spring({ frame: frame - 40, fps: 30, config: { damping: 10, stiffness: 220 }, durationInFrames: 14 })
  const stampScale = interpolate(stampProgress, [0, 1], [1.6, 1])
  const stampOpacity = interpolate(stampProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 80px' }}>
      <div
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 20}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 800,
          fontSize: 74,
          lineHeight: 1.2,
          color: COLOR_FG,
          textAlign: 'center',
        }}
      >
        Ich kündige mein Figma-Abo.
      </div>
      <div
        style={{
          marginTop: 40,
          padding: '14px 30px',
          border: `3px solid ${COLOR_DANGER}`,
          borderRadius: 12,
          color: COLOR_DANGER,
          fontFamily: FONT_STACK,
          fontWeight: 800,
          fontSize: 30,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          transform: `scale(${stampScale}) rotate(-3deg)`,
          opacity: stampOpacity,
          textAlign: 'center',
        }}
      >
        In 1–2 Jahren.
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 2: Architektur-Unterschied, gestapelt (90-210) -------------------

const ArchScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const topEnter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })
  const bottomEnter = spring({ frame: frame - 20, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 80px' }}>
      <div
        style={{
          opacity: topEnter,
          transform: `translateY(${(1 - topEnter) * 20}px)`,
          textAlign: 'center',
          marginBottom: 70,
        }}
      >
        <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 46, color: COLOR_MUTED, marginBottom: 14 }}>
          FIGMA
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 24, color: COLOR_MUTED, lineHeight: 1.5 }}>
          eigene Engine.
          <br />
          CSS nur simuliert.
        </div>
      </div>

      <div style={{ width: 90, height: 2, backgroundColor: 'rgba(145,143,139,0.3)', marginBottom: 70 }} />

      <div
        style={{
          opacity: bottomEnter,
          transform: `translateY(${(1 - bottomEnter) * 20}px)`,
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: FONT_STACK, fontWeight: 800, fontSize: 46, color: COLOR_BLUE, marginBottom: 14 }}>
          PAPER
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 24, color: COLOR_FG, lineHeight: 1.5 }}>
          die Canvas
          <br />
          ist echtes CSS.
        </div>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 3: Paper Snapshot Workflow (210-330) ------------------------------

const SnapshotScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()

  const sourceEnter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })
  const arrowEnter = spring({ frame: frame - 18, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 14 })
  const resultEnter = spring({ frame: frame - 34, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 80px' }}>
      <div
        style={{
          fontFamily: MONO_STACK,
          fontSize: 24,
          color: COLOR_MUTED,
          marginBottom: 56,
          textAlign: 'center',
        }}
      >
        shift+cmd+p auf jeder live-seite
      </div>

      <div
        style={{
          opacity: sourceEnter,
          transform: `translateY(${(1 - sourceEnter) * 16}px)`,
          width: 340,
          height: 110,
          borderRadius: 16,
          border: `2px solid ${COLOR_MUTED}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO_STACK,
          fontSize: 20,
          color: COLOR_MUTED,
        }}
      >
        Element auf Live-Site
      </div>

      <div
        style={{
          opacity: arrowEnter,
          fontSize: 44,
          color: COLOR_MUTED,
          margin: '20px 0',
          transform: `scale(${arrowEnter})`,
        }}
      >
        ↓
      </div>

      <div
        style={{
          opacity: resultEnter,
          transform: `translateY(${(1 - resultEnter) * 16}px) scale(${0.95 + resultEnter * 0.05})`,
          width: 360,
          height: 130,
          borderRadius: 16,
          border: `2px solid ${COLOR_BLUE}`,
          backgroundColor: `color-mix(in oklch, ${COLOR_BLUE} 12%, transparent)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 24, color: COLOR_FG }}>
          Sofort editierbar
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 17, color: COLOR_BLUE }}>echtes CSS, kein Screenshot</div>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 4: Ehrliche Lücke (330-420) ---------------------------------------

const GapScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const enter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 120 }, durationInFrames: 18 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 80px' }}>
      <div
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 20}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 1.3,
          color: COLOR_FG,
          textAlign: 'center',
          marginBottom: 30,
        }}
      >
        Was fehlt: ein Token-Editor.
      </div>
      <div
        style={{
          opacity: enter,
          padding: '10px 24px',
          border: `2px solid ${COLOR_DANGER}`,
          borderRadius: 999,
          color: COLOR_DANGER,
          fontFamily: MONO_STACK,
          fontSize: 20,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        coming soon
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 5: These (420-500) --------------------------------------------------

const ThesisScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const enter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 120 }, durationInFrames: 18 })
  const translateY = interpolate(enter, [0, 1], [26, 0])

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 80px' }}>
      <div
        style={{
          opacity: enter,
          transform: `translateY(${translateY}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 800,
          fontSize: 66,
          lineHeight: 1.25,
          letterSpacing: '-0.01em',
          color: COLOR_FG,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        Design und Code.
        <br />
        <span style={{ color: COLOR_BLUE }}>Nicht länger getrennt.</span>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 6: Business-Payoff (500-560) ----------------------------------------

const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const enter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 120 }, durationInFrames: 16 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 80px' }}>
      <div
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 20}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 700,
          fontSize: 42,
          lineHeight: 1.4,
          color: COLOR_FG,
          textAlign: 'center',
        }}
      >
        Kein Handover-Meeting mehr.
        <br />
        Design-Freigabe = <span style={{ color: COLOR_BLUE }}>Production-Deploy.</span>
      </div>
    </AbsoluteFill>
  )
}

// --- Outro (560-600) -------------------------------------------------------------

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 80px' }}>
      <div style={{ opacity, textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 36, color: COLOR_FG, marginBottom: 30, lineHeight: 1.3 }}>
          Ich beobachte die Roadmap genauer als jede Figma-Release-Note.
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 24, fontWeight: 500, color: COLOR_MUTED, letterSpacing: '0.02em' }}>
          ptrckschrdtr.de
        </div>
      </div>
    </AbsoluteFill>
  )
}

export const PaperDesignTeaser: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BG }}>
      <ShaderBackground />

      <Sequence from={0} durationInFrames={90}>
        <ClaimScene />
      </Sequence>

      <Sequence from={90} durationInFrames={120}>
        <ArchScene />
      </Sequence>

      <Sequence from={210} durationInFrames={120}>
        <SnapshotScene />
      </Sequence>

      <Sequence from={330} durationInFrames={90}>
        <GapScene />
      </Sequence>

      <Sequence from={420} durationInFrames={80}>
        <ThesisScene />
      </Sequence>

      <Sequence from={500} durationInFrames={60}>
        <PayoffScene />
      </Sequence>

      <Sequence from={560} durationInFrames={40}>
        <OutroScene />
      </Sequence>

      <CornerTicks />
      <ProgressBar />
    </AbsoluteFill>
  )
}
