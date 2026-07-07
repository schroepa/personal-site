import React from 'react'
import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

const FONT_STACK =
  '"Helvetica Neue", Helvetica, Arial, sans-serif'
const MONO_STACK = '"SF Mono", "Menlo", "Consolas", monospace'

// Exakt aus src/styles/global.css (Dark-Mode-Tokens, in Hex aufgelöst):
// --background: oklch(0.14 0.004 75) → #0a0907
// --foreground: oklch(0.97 0.003 75) → #f6f5f3
// --muted-foreground: oklch(0.65 0.006 75) → #918f8b
const COLOR_BG = '#0a0907'
const COLOR_FG = '#f6f5f3'
const COLOR_MUTED = '#918f8b'

type BeatProps = {
  children: React.ReactNode
  fontSize?: number
  mono?: boolean
  align?: 'left' | 'center'
}

const Beat: React.FC<BeatProps> = ({ children, fontSize = 96, mono = false, align = 'center' }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const enter = spring({ frame, fps, config: { damping: 200, stiffness: 120 }, durationInFrames: 18 })
  const exitStart = durationInFrames - 14
  const exit = interpolate(frame, [exitStart, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const opacity = Math.min(enter, exit)
  const translateY = interpolate(enter, [0, 1], [28, 0])

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: align === 'center' ? 'center' : 'flex-start',
        padding: '0 140px',
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          fontFamily: mono ? MONO_STACK : FONT_STACK,
          fontWeight: mono ? 500 : 800,
          fontSize,
          lineHeight: 1.12,
          letterSpacing: mono ? '0.02em' : '-0.02em',
          color: mono ? COLOR_MUTED : COLOR_FG,
          textAlign: align,
          textTransform: mono ? 'none' : 'uppercase',
          maxWidth: 1500,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  )
}

const CornerTicks: React.FC = () => {
  const tick: React.CSSProperties = {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: 'rgba(145,143,139,0.5)', // COLOR_MUTED bei 50% Deckkraft
  }
  return (
    <>
      <div style={{ ...tick, top: 48, left: 48, borderTop: '2px solid', borderLeft: '2px solid' }} />
      <div style={{ ...tick, top: 48, right: 48, borderTop: '2px solid', borderRight: '2px solid' }} />
      <div style={{ ...tick, bottom: 48, left: 48, borderBottom: '2px solid', borderLeft: '2px solid' }} />
      <div style={{ ...tick, bottom: 48, right: 48, borderBottom: '2px solid', borderRight: '2px solid' }} />
    </>
  )
}

const Timecode: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const seconds = (frame / fps).toFixed(2).padStart(5, '0')
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 56,
        left: 96,
        fontFamily: MONO_STACK,
        fontSize: 22,
        color: 'rgba(145,143,139,0.7)', // COLOR_MUTED bei 70% Deckkraft
        letterSpacing: '0.05em',
      }}
    >
      {seconds}s — DEVTOOLS.TEASER
    </div>
  )
}

export const DevToolsTeaser: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BG }}>
      <Sequence from={0} durationInFrames={75}>
        <Beat fontSize={104}>Figma zeigt dir eine Behauptung.</Beat>
      </Sequence>

      <Sequence from={75} durationInFrames={75}>
        <Beat fontSize={104}>Der Browser zeigt dir die Wahrheit.</Beat>
      </Sequence>

      <Sequence from={150} durationInFrames={55}>
        <Beat fontSize={58} mono>
          ⌘ + ⌥ + I
        </Beat>
      </Sequence>

      <Sequence from={205} durationInFrames={70}>
        <Beat fontSize={110}>Der Handover-Prozess ist tot.</Beat>
      </Sequence>

      <Sequence from={275} durationInFrames={85}>
        <Beat fontSize={92}>Nur der Browser kann es beweisen.</Beat>
      </Sequence>

      <CornerTicks />
      <Timecode />
    </AbsoluteFill>
  )
}
