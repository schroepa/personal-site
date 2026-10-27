import React, { useCallback, useId, useRef, useState } from 'react'
import './gradient-generator.css'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Orb {
  color: string
  x: number
  y: number
  w: number
  h: number
  blur: number
  op: number
}

interface PresetDef {
  name: string
  bg: string
  grain: number
  orbs: Orb[]
}

interface State {
  bg: string
  grain: number
  orbs: Orb[]
}

// ─── Presets ──────────────────────────────────────────────────────────────────

const PRESETS: PresetDef[] = [
  {
    name: 'Rosé Dawn',  bg: '#F5EDE8', grain: 10,
    orbs: [
      { color: '#C8906A', x: 15, y: 20, w: 65, h: 60, blur: 90, op: 72 },
      { color: '#B87FA8', x: 72, y: 60, w: 55, h: 65, blur: 80, op: 60 },
      { color: '#E8C4B0', x: 40, y: 80, w: 60, h: 50, blur: 70, op: 55 },
      { color: '#9B7090', x: 85, y: 15, w: 40, h: 50, blur: 85, op: 45 },
    ],
  },
  {
    name: 'Dusty Mauve', bg: '#EDE8F0', grain: 9,
    orbs: [
      { color: '#A07898', x: 10, y: 10, w: 70, h: 55, blur: 95, op: 75 },
      { color: '#C8A090', x: 65, y: 55, w: 60, h: 60, blur: 80, op: 62 },
      { color: '#D4B8CC', x: 50, y: -10, w: 55, h: 50, blur: 75, op: 50 },
      { color: '#887098', x: 80, y: 75, w: 45, h: 55, blur: 90, op: 48 },
    ],
  },
  {
    name: 'Warm Dusk',  bg: '#F2EBE5', grain: 11,
    orbs: [
      { color: '#D4906C', x: 60, y: 10, w: 70, h: 60, blur: 100, op: 68 },
      { color: '#A87888', x:  5, y: 55, w: 60, h: 65, blur: 85,  op: 65 },
      { color: '#E0C4A8', x: 30, y: 70, w: 65, h: 45, blur: 70,  op: 52 },
      { color: '#C09898', x: 75, y: 65, w: 40, h: 50, blur: 90,  op: 42 },
    ],
  },
  {
    name: 'Pale Plum',  bg: '#ECE8F2', grain: 10,
    orbs: [
      { color: '#9880B8', x: 20, y: 15, w: 65, h: 70, blur: 90,  op: 70 },
      { color: '#C8A0A8', x: 65, y: 50, w: 60, h: 55, blur: 80,  op: 58 },
      { color: '#B890C4', x: -5, y: 65, w: 55, h: 60, blur: 95,  op: 50 },
      { color: '#D4B8D0', x: 80, y:  5, w: 45, h: 50, blur: 75,  op: 45 },
    ],
  },
  {
    name: 'Fig & Cream', bg: '#F0EAE8', grain: 12,
    orbs: [
      { color: '#9A6878', x:  5, y:  5, w: 60, h: 65, blur: 88,  op: 72 },
      { color: '#C8A888', x: 55, y: 60, w: 70, h: 55, blur: 80,  op: 60 },
      { color: '#B88898', x: 70, y:  5, w: 50, h: 60, blur: 92,  op: 55 },
      { color: '#E8C8B8', x: 25, y: 75, w: 60, h: 45, blur: 70,  op: 48 },
    ],
  },
  {
    name: 'Blush Mist',  bg: '#F4EDEC', grain: 10,
    orbs: [
      { color: '#D4A0A8', x: 30, y:  5, w: 75, h: 55, blur: 100, op: 70 },
      { color: '#A88898', x: -5, y: 50, w: 60, h: 70, blur: 85,  op: 62 },
      { color: '#C8B0C0', x: 65, y: 65, w: 55, h: 55, blur: 75,  op: 52 },
      { color: '#E0C0B8', x: 80, y: 20, w: 45, h: 50, blur: 90,  op: 44 },
    ],
  },
]

const EXPORT_SIZES = [
  { label: '21:9 — Blog Cover', value: '2100,900' },
  { label: '16:9 — Full HD',    value: '1920,1080' },
  { label: '3:2',               value: '1500,1000' },
  { label: '1:1',               value: '1200,1200' },
  { label: '9:16 — Story',      value: '1080,1920' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

function presetThumbnailStyle(p: PresetDef): React.CSSProperties {
  const stops = p.orbs.map((o) => {
    const { r, g, b } = hexToRgb(o.color)
    const cx = o.x + o.w / 2
    const cy = o.y + o.h / 2
    return `radial-gradient(ellipse ${o.w}% ${o.h}% at ${cx}% ${cy}%, rgba(${r},${g},${b},${(o.op / 100) * 0.9}) 0%, transparent 80%)`
  }).join(', ')
  return { background: `${stops}, ${p.bg}` }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
// Native Bedienelemente (input[type=range], details/summary, input[type=color], select, button),
// gestaltet in gradient-generator.css ausschließlich mit Figma-Tokens.

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
}

function SliderRow({ label, value, min, max, unit, onChange }: SliderRowProps) {
  const id = useId()
  const fuellung = `${((value - min) / (max - min)) * 100}%`
  return (
    <div className="gg-zeile">
      <label className="text-small gg-bezeichnung" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="gg-regler"
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        style={{ '--fuellung': fuellung } as React.CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output className="text-mono gg-wert" htmlFor={id} aria-live="off">{value}{unit}</output>
    </div>
  )
}

interface FarbfeldProps {
  label: string
  value: string
  onChange: (v: string) => void
}

function Farbfeld({ label, value, onChange }: FarbfeldProps) {
  const id = useId()
  return (
    <div className="gg-zeile gg-zeile-farbe">
      <label className="text-small gg-bezeichnung" htmlFor={id}>{label}</label>
      <input id={id} className="gg-farbe" type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <span className="text-mono gg-wert">{value}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GradientGenerator() {
  const [state, setState] = useState<State>(() =>
    JSON.parse(JSON.stringify(PRESETS[0]))
  )
  const [currentPreset, setCurrentPreset] = useState(0)
  const [exportSize, setExportSize] = useState('2100,900')
  const [meldung, setMeldung] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const sizeId = useId()

  const loadPreset = useCallback((i: number) => {
    setCurrentPreset(i)
    setState(JSON.parse(JSON.stringify(PRESETS[i])))
  }, [])

  const updateOrb = useCallback((i: number, key: keyof Orb, v: number | string) => {
    setState((prev) => ({
      ...prev,
      orbs: prev.orbs.map((o, idx) => idx === i ? { ...o, [key]: v } : o),
    }))
  }, [])

  const updateGlobal = useCallback((key: keyof Omit<State, 'orbs'>, v: number | string) => {
    setState((prev) => ({ ...prev, [key]: v }))
  }, [])

  const handleExport = useCallback(() => {
    const [W, H] = exportSize.split(',').map(Number)
    const cnv = document.createElement('canvas')
    cnv.width = W; cnv.height = H
    const ctx = cnv.getContext('2d')!
    const previewW = previewRef.current?.offsetWidth ?? W
    const scale = W / previewW

    ctx.fillStyle = state.bg
    ctx.fillRect(0, 0, W, H)

    state.orbs.forEach((o) => {
      const px = (o.x / 100) * W, py = (o.y / 100) * H
      const pw = (o.w / 100) * W, ph = (o.h / 100) * H
      const cx = px + pw / 2, cy = py + ph / 2, rx = pw / 2
      ctx.save()
      ctx.filter = `blur(${o.blur * scale}px)`
      ctx.globalAlpha = o.op / 100
      ctx.translate(cx, cy)
      ctx.scale(1, ph / pw)
      const { r, g, b } = hexToRgb(o.color)
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
      grad.addColorStop(0,   `rgba(${r},${g},${b},1)`)
      grad.addColorStop(0.6, `rgba(${r},${g},${b},0.4)`)
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(0, 0, rx * 1.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    ctx.filter = 'none'; ctx.globalAlpha = 1
    const imgData = ctx.getImageData(0, 0, W, H)
    const d = imgData.data
    const amp = state.grain * 2.8
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * amp
      d[i]   = Math.min(255, Math.max(0, d[i]   + n))
      d[i+1] = Math.min(255, Math.max(0, d[i+1] + n))
      d[i+2] = Math.min(255, Math.max(0, d[i+2] + n))
    }
    ctx.putImageData(imgData, 0, 0)

    cnv.toBlob((blob) => {
      if (!blob) return
      const name = PRESETS[currentPreset].name.toLowerCase().replace(/\s+/g, '-')
      const file = `gradient-${name}-${W}x${H}.png`
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = file
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      // Rückmeldung für alle (ersetzt den kurzen Aufblitzer der alten Fassung, der bei reduzierter Bewegung nicht erwünscht ist)
      setMeldung(`PNG exportiert: ${file}`)
    }, 'image/png')
  }, [state, exportSize, currentPreset])

  return (
    <div className="gg" data-gradient-generator>
      {/* Vorschau */}
      <div className="gg-vorschau" ref={previewRef}>
        <div className="gg-flaeche" style={{ background: state.bg }}>
          {state.orbs.map((orb, i) => (
            <div
              key={i}
              className="gg-kugel"
              aria-hidden="true"
              style={{
                left: `${orb.x}%`, top: `${orb.y}%`,
                width: `${orb.w}%`, height: `${orb.h}%`,
                background: orb.color,
                filter: `blur(${orb.blur}px)`,
                opacity: orb.op / 100,
              }}
            />
          ))}
        </div>
        <div className="gg-korn" aria-hidden="true" style={{ opacity: state.grain / 100 }} />
      </div>

      {/* Bedienfeld */}
      <div className="gg-felder">
        <section className="gg-gruppe" aria-labelledby="gg-preset-titel">
          <h2 id="gg-preset-titel" className="text-label gg-titel">Preset</h2>
          <div className="gg-presets">
            {PRESETS.map((p, i) => (
              <button
                key={p.name}
                type="button"
                className="gg-preset"
                aria-pressed={currentPreset === i}
                onClick={() => loadPreset(i)}
              >
                <span className="gg-vorschaubild" style={presetThumbnailStyle(p)} aria-hidden="true" />
                <span className="text-small gg-presetname">{p.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="gg-gruppe" aria-labelledby="gg-orbs-titel">
          <h2 id="gg-orbs-titel" className="text-label gg-titel">Orbs</h2>
          {state.orbs.map((orb, i) => (
            <details key={i} className="gg-orb" name="gg-orb">
              <summary className="gg-orbkopf text-small">
                <span className="gg-punkt" style={{ background: orb.color }} aria-hidden="true" />
                <span>Orb {i + 1}</span>
              </summary>
              <div className="gg-orbinhalt" role="group" aria-label={`Orb ${i + 1}`}>
                <Farbfeld label="Farbe" value={orb.color} onChange={(v) => updateOrb(i, 'color', v)} />
                <SliderRow label="Deckkraft" value={orb.op}   min={0}   max={100} unit="%" onChange={(v) => updateOrb(i, 'op',   v)} />
                <SliderRow label="Weichheit" value={orb.blur} min={0}   max={150} unit="px" onChange={(v) => updateOrb(i, 'blur', v)} />
                <SliderRow label="X"         value={orb.x}    min={-30} max={130} unit="%" onChange={(v) => updateOrb(i, 'x',    v)} />
                <SliderRow label="Y"         value={orb.y}    min={-30} max={130} unit="%" onChange={(v) => updateOrb(i, 'y',    v)} />
                <SliderRow label="Breite"    value={orb.w}    min={10}  max={150} unit="%" onChange={(v) => updateOrb(i, 'w',    v)} />
                <SliderRow label="Höhe"      value={orb.h}    min={10}  max={150} unit="%" onChange={(v) => updateOrb(i, 'h',    v)} />
              </div>
            </details>
          ))}
        </section>

        <section className="gg-gruppe" aria-labelledby="gg-global-titel">
          <h2 id="gg-global-titel" className="text-label gg-titel">Global</h2>
          <Farbfeld label="Hintergrund" value={state.bg} onChange={(v) => updateGlobal('bg', v)} />
          <SliderRow label="Grain" value={state.grain} min={0} max={25} unit="%" onChange={(v) => updateGlobal('grain', v)} />
        </section>

        <section className="gg-gruppe gg-export" aria-labelledby="gg-export-titel">
          <h2 id="gg-export-titel" className="text-label gg-titel">Export</h2>
          <div className="gg-exportzeile">
            <label className="nur-vorlesen" htmlFor={sizeId}>Exportgröße</label>
            <select id={sizeId} className="gg-auswahl text-small" value={exportSize} onChange={(e) => setExportSize(e.target.value)}>
              {EXPORT_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button type="button" className="gg-knopf text-label" onClick={handleExport}>
              <span aria-hidden="true">↓ </span>PNG
            </button>
          </div>
          <p className="text-small gg-meldung" role="status" aria-live="polite">{meldung}</p>
        </section>
      </div>
    </div>
  )
}
