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
const COLOR_STAMP = '#c9503f' // gedämpftes Rot für den Stempel-Moment

const TOTAL_FRAMES = 450 // 15s @ 30fps

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

// Weicher Übergang an Szenengrenzen statt hartem Schnitt — macht das Video
// insgesamt ruhiger und hochwertiger, statt einer Slideshow aus Einzelbildern.
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

// Dezente Fortschrittsleiste unten — zeigt, wie viel vom Video noch kommt.
// Bewusst als kleiner inhaltlicher Kommentar gesetzt: eine Fortschrittsleiste
// ist selbst ein "Signifier" im Sinne des Artikels.
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
      <div
        style={{
          height: '100%',
          width: `${progress * 100}%`,
          backgroundColor: COLOR_MUTED,
          borderRadius: 999,
        }}
      />
    </div>
  )
}

// --- Szene 1: Der Stempel (0-70) -----------------------------------------

const StampScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()

  const wordScale = spring({ frame, fps: 30, config: { damping: 14, stiffness: 110 }, durationInFrames: 20 })
  const stampProgress = spring({
    frame: frame - 26,
    fps: 30,
    config: { damping: 10, stiffness: 220 },
    durationInFrames: 14,
  })
  const stampScale = interpolate(stampProgress, [0, 1], [1.6, 1])
  const stampOpacity = interpolate(stampProgress, [0, 0.3], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            fontFamily: FONT_STACK,
            fontWeight: 800,
            fontSize: 126,
            letterSpacing: '-0.02em',
            color: COLOR_FG,
            textTransform: 'uppercase',
            transform: `scale(${wordScale})`,
          }}
        >
          Intuitiv.
        </div>
        <div
          style={{
            marginTop: 30,
            padding: '14px 34px',
            border: `3px solid ${COLOR_STAMP}`,
            borderRadius: 10,
            color: COLOR_STAMP,
            fontFamily: FONT_STACK,
            fontWeight: 800,
            fontSize: 34,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            transform: `scale(${stampScale}) rotate(-4deg)`,
            opacity: stampOpacity,
          }}
        >
          Kein Kriterium.
        </div>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 2: Was eigentlich gemeint ist (70-190) -------------------------

const HIDDEN_MEANINGS = [
  '„Ich persönlich habe es nicht verstanden.“',
  '„Es weicht von einem Wettbewerber ab.“',
  '„Ich habe kein Argument, nur ein Gefühl.“',
  '„Ich will es politisch ablehnen — neutral verpackt.“',
]

const TranslationScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()
  const itemDuration = 30
  const activeIndex = Math.min(Math.floor(frame / itemDuration), HIDDEN_MEANINGS.length - 1)
  const localFrame = frame - activeIndex * itemDuration
  const itemEnter = spring({ frame: localFrame, fps: 30, config: { damping: 200, stiffness: 200 }, durationInFrames: 10 })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade, padding: '0 160px' }}>
      <div
        style={{
          fontFamily: MONO_STACK,
          fontSize: 26,
          color: COLOR_MUTED,
          letterSpacing: '0.02em',
          marginBottom: 40,
        }}
      >
        „Das ist nicht intuitiv.“ — heißt eigentlich:
      </div>
      <div
        style={{
          opacity: itemEnter,
          transform: `translateY(${(1 - itemEnter) * 18}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 1.25,
          color: COLOR_FG,
          textAlign: 'center',
          maxWidth: 1500,
        }}
      >
        {HIDDEN_MEANINGS[activeIndex]}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 44 }}>
        {HIDDEN_MEANINGS.map((_, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: i === activeIndex ? COLOR_FG : 'rgba(145,143,139,0.35)',
            }}
          />
        ))}
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 3: Die echte Taxonomie (190-320) -------------------------------

const CONCEPTS: { label: string; hue: number }[] = [
  { label: 'Learnability', hue: 250 },
  { label: 'Efficiency', hue: 150 },
  { label: 'Discoverability', hue: 40 },
  { label: 'Signifier', hue: 330 },
]

const TaxonomyScene: React.FC = () => {
  const frame = useCurrentFrame()
  const fade = useCrossfade()

  const headlineOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fade }}>
      <div
        style={{
          fontFamily: MONO_STACK,
          fontSize: 26,
          color: COLOR_MUTED,
          letterSpacing: '0.02em',
          marginBottom: 48,
          opacity: headlineOpacity,
        }}
      >
        was man stattdessen messen kann:
      </div>
      <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1500 }}>
        {CONCEPTS.map((concept, i) => {
          const delay = 16 + i * 10
          const enter = spring({
            frame: frame - delay,
            fps: 30,
            config: { damping: 200, stiffness: 140 },
            durationInFrames: 16,
          })
          const color = `oklch(0.75 0.15 ${concept.hue})`
          return (
            <div
              key={concept.label}
              style={{
                opacity: enter,
                transform: `translateY(${(1 - enter) * 20}px) scale(${0.9 + enter * 0.1})`,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '20px 34px',
                borderRadius: 999,
                border: `2px solid ${color}`,
                backgroundColor: `oklch(0.75 0.15 ${concept.hue} / 0.12)`,
              }}
            >
              <div style={{ width: 16, height: 16, borderRadius: 999, backgroundColor: color }} />
              <div
                style={{
                  fontFamily: FONT_STACK,
                  fontWeight: 700,
                  fontSize: 36,
                  color: COLOR_FG,
                }}
              >
                {concept.label}
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 4: These (320-405) ----------------------------------------------

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
          fontSize: 82,
          lineHeight: 1.18,
          letterSpacing: '-0.02em',
          color: COLOR_FG,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        Intuitiv ist keine Antwort.
        <br />
        <span style={{ color: 'oklch(0.75 0.15 330)' }}>Es ist eine Frage, die noch fehlt.</span>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 5: Outro mit der Gegenfrage (405-450) ---------------------------

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity, textAlign: 'center', maxWidth: 1400 }}>
        <div
          style={{
            fontFamily: FONT_STACK,
            fontWeight: 700,
            fontSize: 40,
            color: COLOR_FG,
            marginBottom: 30,
          }}
        >
          „Intuitiv wofür — und für wen?“
        </div>
        <div
          style={{
            fontFamily: MONO_STACK,
            fontSize: 24,
            fontWeight: 500,
            color: COLOR_MUTED,
            letterSpacing: '0.02em',
          }}
        >
          ptrckschrdtr.de
        </div>
      </div>
    </AbsoluteFill>
  )
}

const CornerTicks: React.FC = () => {
  const tick: React.CSSProperties = {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: 'rgba(145,143,139,0.5)',
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

export const IntuitivTeaser: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BG }}>
      <ShaderBackground />

      <Sequence from={0} durationInFrames={70}>
        <StampScene />
      </Sequence>

      <Sequence from={70} durationInFrames={120}>
        <TranslationScene />
      </Sequence>

      <Sequence from={190} durationInFrames={130}>
        <TaxonomyScene />
      </Sequence>

      <Sequence from={320} durationInFrames={85}>
        <ThesisScene />
      </Sequence>

      <Sequence from={405} durationInFrames={45}>
        <OutroScene />
      </Sequence>

      <CornerTicks />
      <ProgressBar />
    </AbsoluteFill>
  )
}
