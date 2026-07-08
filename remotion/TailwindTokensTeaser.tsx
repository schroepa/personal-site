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
const COLOR_DANGER = '#c9503f' // gedämpftes Rot, nur für den "toten Code" Moment

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

// Perzeptuell gleichmäßige OKLCH-Rampe (Hue 250, wie im Artikel-Codebeispiel)
// — derselbe Punkt, den der Artikel textlich macht, hier tatsächlich sichtbar.
const OKLCH_RAMP: { label: string; l: number; c: number }[] = [
  { label: '50', l: 0.97, c: 0.02 },
  { label: '100', l: 0.92, c: 0.04 },
  { label: '200', l: 0.85, c: 0.08 },
  { label: '300', l: 0.75, c: 0.12 },
  { label: '400', l: 0.65, c: 0.15 },
  { label: '500', l: 0.55, c: 0.18 },
  { label: '600', l: 0.45, c: 0.15 },
  { label: '700', l: 0.35, c: 0.12 },
  { label: '800', l: 0.25, c: 0.09 },
  { label: '900', l: 0.15, c: 0.06 },
]
const RAMP_HUE = 250

// --- Szene 1: Der tote Code (0-90) ------------------------------------

const DeadConfigScene: React.FC = () => {
  const frame = useCurrentFrame()

  const strike = interpolate(frame, [18, 42], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const labelOpacity = interpolate(frame, [46, 66], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const codeOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ position: 'relative', opacity: codeOpacity }}>
        <div
          style={{
            fontFamily: MONO_STACK,
            fontSize: 56,
            fontWeight: 500,
            color: COLOR_FG,
            letterSpacing: '-0.01em',
          }}
        >
          tailwind.config.js
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            height: 4,
            width: `${strike * 100}%`,
            backgroundColor: COLOR_DANGER,
            transform: 'translateY(-50%)',
          }}
        />
      </div>
      <div
        style={{
          marginTop: 28,
          fontFamily: MONO_STACK,
          fontSize: 24,
          color: COLOR_MUTED,
          opacity: labelOpacity,
          letterSpacing: '0.04em',
        }}
      >
        existiert nur zur build-zeit.
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 2: @theme tippt sich, Swatch erwacht (90-210) ---------------

const ThemeTypeScene: React.FC = () => {
  const frame = useCurrentFrame()

  const line1 = '@theme {'
  const line2 = '  --color-primary: oklch(0.55 0.18 250);'
  const line3 = '}'
  const fullLen = line1.length + line2.length + line3.length

  const typedChars = Math.floor(
    interpolate(frame, [6, 95], [0, fullLen], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  )

  const l1 = line1.slice(0, Math.min(typedChars, line1.length))
  const l2 = line2.slice(0, Math.max(0, Math.min(typedChars - line1.length, line2.length)))
  const l3 = line3.slice(0, Math.max(0, Math.min(typedChars - line1.length - line2.length, line3.length)))

  const cursorOn = Math.floor(frame / 8) % 2 === 0
  const isDone = typedChars >= fullLen

  const swatchScale = spring({
    frame: frame - 96,
    fps: 30,
    config: { damping: 12, stiffness: 140 },
    durationInFrames: 20,
  })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 56 }}>
        <div
          style={{
            fontFamily: MONO_STACK,
            fontSize: 34,
            lineHeight: 1.6,
            color: COLOR_FG,
            whiteSpace: 'pre',
          }}
        >
          <div>{l1}</div>
          <div>
            {l2}
            {!isDone && cursorOn && l2.length > 0 && (
              <span style={{ color: COLOR_FG }}>▍</span>
            )}
          </div>
          <div>{l3}</div>
        </div>

        {swatchScale > 0.01 && (
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: 20,
              backgroundColor: 'oklch(0.55 0.18 250)',
              transform: `scale(${swatchScale})`,
              boxShadow: '0 0 60px oklch(0.55 0.18 250 / 0.5)',
              flexShrink: 0,
            }}
          />
        )}
      </div>
      {isDone && (
        <div
          style={{
            marginTop: 40,
            fontFamily: MONO_STACK,
            fontSize: 22,
            color: COLOR_MUTED,
            letterSpacing: '0.04em',
          }}
        >
          jetzt eine echte variable. laufzeit, nicht build-zeit.
        </div>
      )}
    </AbsoluteFill>
  )
}

// --- Szene 3: OKLCH-Rampe erwacht (210-330) -----------------------------

const RampScene: React.FC = () => {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          fontFamily: MONO_STACK,
          fontSize: 26,
          color: COLOR_MUTED,
          marginBottom: 44,
          letterSpacing: '0.04em',
        }}
      >
        perzeptuell gleichmäßig. keine rechnerei.
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        {OKLCH_RAMP.map((stop, i) => {
          const delay = i * 5
          const enter = spring({
            frame: frame - delay,
            fps: 30,
            config: { damping: 200, stiffness: 130 },
            durationInFrames: 16,
          })
          return (
            <div
              key={stop.label}
              style={{
                opacity: enter,
                transform: `translateY(${(1 - enter) * 24}px)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 128,
                  height: 160,
                  borderRadius: 12,
                  backgroundColor: `oklch(${stop.l} ${stop.c} ${RAMP_HUE})`,
                }}
              />
              <div
                style={{
                  fontFamily: MONO_STACK,
                  fontSize: 18,
                  color: COLOR_MUTED,
                }}
              >
                {stop.label}
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 4: These (330-435) -------------------------------------------

const ThesisScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()

  const enter = spring({ frame, fps: 30, config: { damping: 200, stiffness: 120 }, durationInFrames: 18 })
  const exitStart = durationInFrames - 14
  const exit = interpolate(frame, [exitStart, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const opacity = Math.min(enter, exit)
  const translateY = interpolate(enter, [0, 1], [28, 0])

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 130px' }}>
      <div
        style={{
          opacity,
          transform: `translateY(${translateY}px)`,
          fontFamily: FONT_STACK,
          fontWeight: 800,
          fontSize: 78,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          color: COLOR_FG,
          textAlign: 'center',
          textTransform: 'uppercase',
        }}
      >
        Nicht die Syntax hat sich geändert.
        <br />
        <span style={{ color: 'oklch(0.7 0.15 250)' }}>Sondern wo Tokens leben.</span>
      </div>
    </AbsoluteFill>
  )
}

// --- Szene 5: Outro (435-480) --------------------------------------------

const OutroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ opacity, textAlign: 'center' }}>
        <div
          style={{
            fontFamily: MONO_STACK,
            fontSize: 28,
            fontWeight: 500,
            color: COLOR_FG,
            letterSpacing: '0.02em',
          }}
        >
          ptrckschrdtr.de
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: MONO_STACK,
            fontSize: 20,
            color: COLOR_MUTED,
            letterSpacing: '0.04em',
          }}
        >
          Design Tokens, Tailwind v4 &amp; OKLCH — im Blog
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

export const TailwindTokensTeaser: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR_BG }}>
      <ShaderBackground />

      <Sequence from={0} durationInFrames={90}>
        <DeadConfigScene />
      </Sequence>

      <Sequence from={90} durationInFrames={120}>
        <ThemeTypeScene />
      </Sequence>

      <Sequence from={210} durationInFrames={120}>
        <RampScene />
      </Sequence>

      <Sequence from={330} durationInFrames={105}>
        <ThesisScene />
      </Sequence>

      <Sequence from={435} durationInFrames={45}>
        <OutroScene />
      </Sequence>

      <CornerTicks />
    </AbsoluteFill>
  )
}
