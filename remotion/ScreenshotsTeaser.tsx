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

// Exakt aus src/styles/global.css (Dark-Mode-Tokens, in Hex aufgelöst).
const COLOR_BG = '#0a0907'
const COLOR_FG = '#f6f5f3'
const COLOR_MUTED = '#918f8b'
const COLOR_DANGER = '#c9503f' // unwiderlegbar / hohl
const COLOR_GOOD = 'oklch(0.7 0.15 150)' // überprüfbar / trägt

const TOTAL_FRAMES = 465 // 15.5s @ 30fps

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

// Ein gefälschtes "Dribbble-Shot"-Karten-Mockup — glänzende UI-Vorschau,
// Avatar, Like-Zahl. Bewusst hohl gebaut: nur Dekoration, keine Funktion.
const DribbbleCard: React.FC<{ hue: number; style?: React.CSSProperties }> = ({ hue, style }) => {
  return (
    <div
      style={{
        width: 340,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#1d1a18',
        boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)',
        ...style,
      }}
    >
      <div
        style={{
          height: 190,
          background: `linear-gradient(135deg, oklch(0.6 0.14 ${hue}) 0%, oklch(0.5 0.12 ${hue + 40}) 100%)`,
        }}
      />
      <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: 999, backgroundColor: COLOR_MUTED, flexShrink: 0 }} />
        <div style={{ flex: 1, height: 10, borderRadius: 999, backgroundColor: 'rgba(145,143,139,0.35)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: COLOR_MUTED, fontFamily: MONO_STACK, fontSize: 15 }}>
          <span style={{ color: COLOR_DANGER }}>♥</span> 2.4k
        </div>
      </div>
    </div>
  )
}

// --- Szene 1: Der Stempel auf dem hübschen Nichts (0-75) ------------------

const StampCardScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()

  const cardEnter = spring({ frame, fps: 30, config: { damping: 14, stiffness: 120 }, durationInFrames: 20 })
  const stampProgress = spring({ frame: frame - 32, fps: 30, config: { damping: 10, stiffness: 220 }, durationInFrames: 14 })
  const stampScale = interpolate(stampProgress, [0, 1], [1.6, 1])
  const stampOpacity = interpolate(stampProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade }}>
      <div style={{ position: 'relative' }}>
        <DribbbleCard hue={250} style={{ transform: `scale(${cardEnter}) rotate(-2deg)`, opacity: cardEnter }} />
        <div
          style={{
            position: 'absolute',
            top: '38%',
            left: '50%',
            padding: '12px 26px',
            border: `3px solid ${COLOR_DANGER}`,
            borderRadius: 10,
            color: COLOR_DANGER,
            fontFamily: FONT_STACK,
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            transform: `translate(-50%, -50%) scale(${stampScale}) rotate(-8deg)`,
            opacity: stampOpacity,
          }}
        >
          0% Beweiskraft
        </div>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 2: Vervielfältigung (75-160) -----------------------------------

const MultiplyScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const headlineOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const offsets = [
    { hue: 250, x: -260, rot: -8, delay: 8 },
    { hue: 20, x: 0, rot: 0, delay: 0 },
    { hue: 320, x: 260, rot: 8, delay: 16 },
  ]

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade }}>
      <div
        style={{
          position: 'absolute',
          top: 130,
          fontFamily: FONT_STACK,
          fontWeight: 700,
          fontSize: 40,
          color: COLOR_FG,
          opacity: headlineOpacity,
          textAlign: 'center',
        }}
      >
        Ein Prompt reicht.
      </div>
      <div style={{ position: 'relative', width: 900, height: 300 }}>
        {offsets.map((o, i) => {
          const enter = spring({ frame: frame - o.delay, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translateX(${o.x}px) rotate(${o.rot}deg) scale(${0.7 + enter * 0.3})`,
                opacity: enter,
              }}
            >
              <DribbbleCard hue={o.hue} style={{ width: 260 }} />
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 3: Bild vs. Text — Beweiskraft (160-270) ------------------------

const VerifiabilityScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()

  const leftEnter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })
  const rightEnter = spring({ frame: frame - 14, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })
  const lineEnter = spring({ frame: frame - 28, fps: 30, config: { damping: 200, stiffness: 130 }, durationInFrames: 16 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <div
          style={{
            width: 480,
            textAlign: 'center',
            opacity: leftEnter,
            transform: `translateY(${(1 - leftEnter) * 20}px)`,
          }}
        >
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 999,
              border: `4px solid ${COLOR_DANGER}`,
              margin: '0 auto 26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT_STACK,
              fontWeight: 800,
              fontSize: 44,
              color: COLOR_DANGER,
            }}
          >
            ?
          </div>
          <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 34, color: COLOR_FG, marginBottom: 10 }}>
            Ein Bild
          </div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 20, color: COLOR_MUTED }}>
            kann man nicht widerlegen.
          </div>
        </div>

        <div
          style={{
            width: 2,
            height: 220,
            backgroundColor: 'rgba(145,143,139,0.25)',
            transform: `scaleY(${lineEnter})`,
          }}
        />

        <div
          style={{
            width: 480,
            textAlign: 'center',
            opacity: rightEnter,
            transform: `translateY(${(1 - rightEnter) * 20}px)`,
          }}
        >
          <div
            style={{
              width: 90,
              height: 90,
              borderRadius: 999,
              border: `4px solid ${COLOR_GOOD}`,
              margin: '0 auto 26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT_STACK,
              fontWeight: 800,
              fontSize: 44,
              color: COLOR_GOOD,
            }}
          >
            ✓
          </div>
          <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 34, color: COLOR_FG, marginBottom: 10 }}>
            Ein Text
          </div>
          <div style={{ fontFamily: MONO_STACK, fontSize: 20, color: COLOR_MUTED }}>
            kann man prüfen.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 4: NDA-Realität (270-340) ----------------------------------------

const NdaScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const enter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 120 }, durationInFrames: 18 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 160px' }}>
      <div
        style={{
          opacity: enter,
          transform: `translateY(${(1 - enter) * 20}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 700,
          fontSize: 56,
          lineHeight: 1.3,
          color: COLOR_FG,
          textAlign: 'center',
        }}
      >
        Der Großteil meiner Arbeit
        <br />
        gehört <span style={{ color: COLOR_DANGER }}>mir gar nicht.</span>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 5: These (340-420) ------------------------------------------------

const ThesisScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const enter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 120 }, durationInFrames: 18 })
  const translateY = interpolate(enter, [0, 1], [26, 0])

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 140px' }}>
      <div
        style={{
          opacity: enter,
          transform: `translateY(${translateY}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 800,
          fontSize: 78,
          lineHeight: 1.18,
          letterSpacing: '-0.02em',
          color: COLOR_FG,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        Keine Galerie.
        <br />
        <span style={{ color: COLOR_GOOD }}>Nur Gedanken, die man prüfen kann.</span>
      </div>
    </AbsoluteFill>
  )
}

// --- Outro (420-465) ----------------------------------------------------------

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity, textAlign: 'center', maxWidth: 1400 }}>
        <div style={{ fontFamily: FONT_STACK, fontWeight: 700, fontSize: 38, color: COLOR_FG, marginBottom: 30 }}>
          Kein Dribbble-Profil. Ein Beweisstück.
        </div>
        <div style={{ fontFamily: MONO_STACK, fontSize: 24, fontWeight: 500, color: COLOR_MUTED, letterSpacing: '0.02em' }}>
          ptrckschrdtr.de
        </div>
      </div>
    </AbsoluteFill>
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

export const ScreenshotsTeaser: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BG }}>
      <ShaderBackground />

      <Sequence from={0} durationInFrames={75}>
        <StampCardScene />
      </Sequence>

      <Sequence from={75} durationInFrames={85}>
        <MultiplyScene />
      </Sequence>

      <Sequence from={160} durationInFrames={110}>
        <VerifiabilityScene />
      </Sequence>

      <Sequence from={270} durationInFrames={70}>
        <NdaScene />
      </Sequence>

      <Sequence from={340} durationInFrames={80}>
        <ThesisScene />
      </Sequence>

      <Sequence from={420} durationInFrames={45}>
        <OutroScene />
      </Sequence>

      <CornerTicks />
      <ProgressBar />
    </AbsoluteFill>
  )
}
