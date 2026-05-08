import React, { useState, useRef, useCallback } from 'react'
import { Slider } from '@/components/ui/slider'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { cn } from '@/lib/utils'

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

// ─── Grain data URL (static, avoids SSR mismatch) ────────────────────────────

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SliderRowProps {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
}

function SliderRow({ label, value, min, max, unit, onChange }: SliderRowProps) {
  return (
    <div className="grid grid-cols-[4rem_1fr_2.5rem] items-center gap-2 py-1.5">
      <span className="t-label text-muted-foreground truncate">{label}</span>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]: number[]) => onChange(v)}
      />
      <span className="t-label text-muted-foreground text-right tabular-nums">
        {value}{unit}
      </span>
    </div>
  )
}

// ─── Controls Panel (proper component, not JSX variable) ─────────────────────

interface ControlsPanelProps {
  state: State
  currentPreset: number
  exportSize: string
  onLoadPreset: (i: number) => void
  onUpdateOrb: (i: number, key: keyof Orb, v: number | string) => void
  onUpdateGlobal: (key: keyof Omit<State, 'orbs'>, v: number | string) => void
  onExportSizeChange: (v: string) => void
  onExport: () => void
}

function ControlsPanel({
  state,
  currentPreset,
  exportSize,
  onLoadPreset,
  onUpdateOrb,
  onUpdateGlobal,
  onExportSizeChange,
  onExport,
}: ControlsPanelProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Preset Strip */}
      <div className="shrink-0 border-b border-border px-3 pt-3 pb-3">
        <p className="t-label text-muted-foreground mb-2 uppercase tracking-widest">Preset</p>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onLoadPreset(i)}
              title={p.name}
              className={cn(
                'flex-none flex flex-col items-center gap-1 focus:outline-none',
              )}
            >
              <div
                className={cn(
                  'w-16 h-10 rounded-md transition-all duration-150',
                  currentPreset === i
                    ? 'ring-2 ring-foreground ring-offset-2 ring-offset-card'
                    : 'ring-1 ring-border hover:ring-foreground/40',
                )}
                style={presetThumbnailStyle(p)}
              />
              <span className="t-label text-muted-foreground w-16 truncate text-center">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orb Accordion */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <Accordion type="single" collapsible className="px-3">
          {state.orbs.map((orb, i) => (
            <AccordionItem key={i} value={`orb-${i}`}>
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-border shrink-0"
                    style={{ background: orb.color }}
                  />
                  <span className="t-label text-foreground">Orb {i + 1}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {/* Color picker */}
                <div className="grid grid-cols-[4rem_1fr] items-center gap-2 py-1.5 mb-1">
                  <span className="t-label text-muted-foreground">Farbe</span>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded border border-border relative overflow-hidden block"
                        style={{ background: orb.color }}
                      >
                        <input
                          type="color"
                          value={orb.color}
                          onChange={(e) => onUpdateOrb(i, 'color', e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                      </span>
                      <span className="t-mono text-muted-foreground">{orb.color}</span>
                    </label>
                  </div>
                </div>
                <SliderRow label="Deckkraft" value={orb.op}   min={0}   max={100} unit="%" onChange={(v) => onUpdateOrb(i, 'op',   v)} />
                <SliderRow label="Weichheit" value={orb.blur} min={0}   max={150} unit="px" onChange={(v) => onUpdateOrb(i, 'blur', v)} />
                <SliderRow label="X"         value={orb.x}   min={-30} max={130} unit="%" onChange={(v) => onUpdateOrb(i, 'x',    v)} />
                <SliderRow label="Y"         value={orb.y}   min={-30} max={130} unit="%" onChange={(v) => onUpdateOrb(i, 'y',    v)} />
                <SliderRow label="Breite"    value={orb.w}   min={10}  max={150} unit="%" onChange={(v) => onUpdateOrb(i, 'w',    v)} />
                <SliderRow label="Höhe"      value={orb.h}   min={10}  max={150} unit="%" onChange={(v) => onUpdateOrb(i, 'h',    v)} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Global */}
        <div className="px-3 pt-3 pb-4 border-t border-border mx-3">
          <p className="t-label text-muted-foreground uppercase tracking-widest mb-3">Global</p>
          <div className="grid grid-cols-[4rem_1fr] items-center gap-2 py-1.5 mb-1">
            <span className="t-label text-muted-foreground">Hintergrund</span>
            <label className="cursor-pointer flex items-center gap-2">
              <span
                className="w-6 h-6 rounded border border-border relative overflow-hidden block"
                style={{ background: state.bg }}
              >
                <input
                  type="color"
                  value={state.bg}
                  onChange={(e) => onUpdateGlobal('bg', e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </span>
              <span className="t-mono text-muted-foreground">{state.bg}</span>
            </label>
          </div>
          <SliderRow
            label="Grain"
            value={state.grain}
            min={0}
            max={25}
            unit="%"
            onChange={(v) => onUpdateGlobal('grain', v)}
          />
        </div>
      </div>

      {/* Export */}
      <div className="shrink-0 border-t border-border p-3 flex gap-2 items-center">
        <select
          value={exportSize}
          onChange={(e) => onExportSizeChange(e.target.value)}
          className="flex-1 min-w-0 bg-muted border border-border text-foreground rounded-md px-2 py-2 t-small focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {EXPORT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={onExport}
          className="shrink-0 bg-foreground text-background px-4 py-2 rounded-md t-small font-medium hover:opacity-80 active:opacity-60 transition-opacity"
        >
          ↓ PNG
        </button>
      </div>
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
  const [flashing, setFlashing] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

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

    setFlashing(true)
    setTimeout(() => setFlashing(false), 120)

    cnv.toBlob((blob) => {
      if (!blob) return
      const name = PRESETS[currentPreset].name.toLowerCase().replace(/\s+/g, '-')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `gradient-${name}-${W}x${H}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }, [state, exportSize, currentPreset])

  const panelProps: ControlsPanelProps = {
    state, currentPreset, exportSize,
    onLoadPreset: loadPreset,
    onUpdateOrb: updateOrb,
    onUpdateGlobal: updateGlobal,
    onExportSizeChange: setExportSize,
    onExport: handleExport,
  }

  return (
    <div className="flex h-full w-full overflow-hidden">

      {/* Flash */}
      {flashing && (
        <div className="fixed inset-0 bg-background opacity-50 pointer-events-none z-[9999]" />
      )}

      {/* Gradient Preview */}
      <div className="relative flex-1 overflow-hidden" ref={previewRef}>
        {/* Background */}
        <div className="absolute inset-0" style={{ background: state.bg }}>
          {state.orbs.map((orb, i) => (
            <div
              key={i}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${orb.x}%`, top: `${orb.y}%`,
                width: `${orb.w}%`, height: `${orb.h}%`,
                borderRadius: '50%',
                background: orb.color,
                filter: `blur(${orb.blur}px)`,
                opacity: orb.op / 100,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>

        {/* Grain */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: GRAIN_SVG,
            backgroundSize: '200px 200px',
            opacity: state.grain / 100,
            mixBlendMode: 'overlay',
            zIndex: 5,
          }}
        />

        {/* Mobile Bottom Bar */}
        <div
          className="md:hidden absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border"
          style={{ zIndex: 10 }}
        >
          {/* Mini Preset Strip */}
          <div className="flex gap-2 px-4 pt-3 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {PRESETS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => loadPreset(i)}
                className={cn(
                  'flex-none w-12 h-7 rounded transition-all duration-150',
                  currentPreset === i
                    ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background'
                    : 'ring-1 ring-border',
                )}
                style={presetThumbnailStyle(p)}
                title={p.name}
              />
            ))}
          </div>

          {/* Sheet trigger + Export */}
          <div className="flex gap-2 px-4 pb-3 pt-1">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-2 bg-muted border border-border rounded-md py-2 t-small text-foreground hover:bg-muted/80 transition-colors"
                >
                  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
                    <path d="M1 1h12M1 5h12M1 9h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Controls
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] p-0 flex flex-col">
                <SheetHeader className="shrink-0 px-4 py-3 border-b border-border">
                  <SheetTitle className="t-label text-foreground">Gradient Controls</SheetTitle>
                </SheetHeader>
                <div className="flex-1 min-h-0">
                  <ControlsPanel {...panelProps} />
                </div>
              </SheetContent>
            </Sheet>

            <select
              value={exportSize}
              onChange={(e) => setExportSize(e.target.value)}
              className="bg-muted border border-border text-foreground rounded-md px-2 py-2 t-small focus:outline-none"
            >
              {EXPORT_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleExport}
              className="shrink-0 bg-foreground text-background px-3 py-2 rounded-md t-small font-medium hover:opacity-80 transition-opacity"
            >
              ↓ PNG
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Side Panel */}
      <div className="hidden md:flex w-72 shrink-0 flex-col border-l border-border bg-card overflow-hidden">
        <ControlsPanel {...panelProps} />
      </div>
    </div>
  )
}
