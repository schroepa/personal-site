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
    name: 'Rosé Dawn',
    bg: '#F5EDE8',
    grain: 10,
    orbs: [
      { color: '#C8906A', x: 15, y: 20, w: 65, h: 60, blur: 90, op: 72 },
      { color: '#B87FA8', x: 72, y: 60, w: 55, h: 65, blur: 80, op: 60 },
      { color: '#E8C4B0', x: 40, y: 80, w: 60, h: 50, blur: 70, op: 55 },
      { color: '#9B7090', x: 85, y: 15, w: 40, h: 50, blur: 85, op: 45 },
    ],
  },
  {
    name: 'Dusty Mauve',
    bg: '#EDE8F0',
    grain: 9,
    orbs: [
      { color: '#A07898', x: 10, y: 10, w: 70, h: 55, blur: 95, op: 75 },
      { color: '#C8A090', x: 65, y: 55, w: 60, h: 60, blur: 80, op: 62 },
      { color: '#D4B8CC', x: 50, y: -10, w: 55, h: 50, blur: 75, op: 50 },
      { color: '#887098', x: 80, y: 75, w: 45, h: 55, blur: 90, op: 48 },
    ],
  },
  {
    name: 'Warm Dusk',
    bg: '#F2EBE5',
    grain: 11,
    orbs: [
      { color: '#D4906C', x: 60, y: 10, w: 70, h: 60, blur: 100, op: 68 },
      { color: '#A87888', x: 5, y: 55, w: 60, h: 65, blur: 85, op: 65 },
      { color: '#E0C4A8', x: 30, y: 70, w: 65, h: 45, blur: 70, op: 52 },
      { color: '#C09898', x: 75, y: 65, w: 40, h: 50, blur: 90, op: 42 },
    ],
  },
  {
    name: 'Pale Plum',
    bg: '#ECE8F2',
    grain: 10,
    orbs: [
      { color: '#9880B8', x: 20, y: 15, w: 65, h: 70, blur: 90, op: 70 },
      { color: '#C8A0A8', x: 65, y: 50, w: 60, h: 55, blur: 80, op: 58 },
      { color: '#B890C4', x: -5, y: 65, w: 55, h: 60, blur: 95, op: 50 },
      { color: '#D4B8D0', x: 80, y: 5, w: 45, h: 50, blur: 75, op: 45 },
    ],
  },
  {
    name: 'Fig & Cream',
    bg: '#F0EAE8',
    grain: 12,
    orbs: [
      { color: '#9A6878', x: 5, y: 5, w: 60, h: 65, blur: 88, op: 72 },
      { color: '#C8A888', x: 55, y: 60, w: 70, h: 55, blur: 80, op: 60 },
      { color: '#B88898', x: 70, y: 5, w: 50, h: 60, blur: 92, op: 55 },
      { color: '#E8C8B8', x: 25, y: 75, w: 60, h: 45, blur: 70, op: 48 },
    ],
  },
  {
    name: 'Blush Mist',
    bg: '#F4EDEC',
    grain: 10,
    orbs: [
      { color: '#D4A0A8', x: 30, y: 5, w: 75, h: 55, blur: 100, op: 70 },
      { color: '#A88898', x: -5, y: 50, w: 60, h: 70, blur: 85, op: 62 },
      { color: '#C8B0C0', x: 65, y: 65, w: 55, h: 55, blur: 75, op: 52 },
      { color: '#E0C0B8', x: 80, y: 20, w: 45, h: 50, blur: 90, op: 44 },
    ],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

/** Inline-CSS-Background für Preset-Thumbnails (ohne blur — zu klein) */
function presetBg(preset: PresetDef): React.CSSProperties {
  const stops = preset.orbs
    .map((o) => {
      const { r, g, b } = hexToRgb(o.color)
      const cx = o.x + o.w / 2
      const cy = o.y + o.h / 2
      return `radial-gradient(ellipse ${o.w}% ${o.h}% at ${cx}% ${cy}%, rgba(${r},${g},${b},${(o.op / 100) * 0.9}) 0%, transparent 80%)`
    })
    .join(', ')
  return { background: `${stops}, ${preset.bg}` }
}

const EXPORT_SIZES = [
  { label: '21:9 — Blog Cover', value: '2100,900' },
  { label: '16:9 — Full HD', value: '1920,1080' },
  { label: '3:2', value: '1500,1000' },
  { label: '1:1', value: '1200,1200' },
  { label: '9:16 — Story', value: '1080,1920' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function OrbLayer({ orb }: { orb: Orb }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: `${orb.x}%`,
        top: `${orb.y}%`,
        width: `${orb.w}%`,
        height: `${orb.h}%`,
        borderRadius: '50%',
        background: orb.color,
        filter: `blur(${orb.blur}px)`,
        opacity: orb.op / 100,
        pointerEvents: 'none',
      }}
    />
  )
}

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
    <div className="flex items-center gap-3 py-1">
      <span className="t-label text-muted-foreground w-16 shrink-0">{label}</span>
      <Slider
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="flex-1"
      />
      <span className="t-label text-muted-foreground w-10 text-right tabular-nums">
        {value}{unit}
      </span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GradientGenerator() {
  const [state, setState] = useState<State>(
    JSON.parse(JSON.stringify(PRESETS[0]))
  )
  const [currentPreset, setCurrentPreset] = useState(0)
  const [exportSize, setExportSize] = useState('2100,900')
  const [flashing, setFlashing] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  // ── State updates ──────────────────────────────────────────────────────────

  const loadPreset = useCallback((i: number) => {
    setCurrentPreset(i)
    setState(JSON.parse(JSON.stringify(PRESETS[i])))
  }, [])

  const updateOrb = useCallback((i: number, key: keyof Orb, v: number | string) => {
    setState((prev) => {
      const orbs = prev.orbs.map((o, idx) => (idx === i ? { ...o, [key]: v } : o))
      return { ...prev, orbs }
    })
  }, [])

  const updateGlobal = useCallback((key: keyof Omit<State, 'orbs'>, v: number | string) => {
    setState((prev) => ({ ...prev, [key]: v }))
  }, [])

  // ── Export ─────────────────────────────────────────────────────────────────

  const handleExport = useCallback(() => {
    const [W, H] = exportSize.split(',').map(Number)
    const cnv = document.createElement('canvas')
    cnv.width = W
    cnv.height = H
    const ctx = cnv.getContext('2d')!
    const previewW = previewRef.current?.offsetWidth ?? W
    const scale = W / previewW

    ctx.fillStyle = state.bg
    ctx.fillRect(0, 0, W, H)

    state.orbs.forEach((o) => {
      const px = (o.x / 100) * W
      const py = (o.y / 100) * H
      const pw = (o.w / 100) * W
      const ph = (o.h / 100) * H
      const cx = px + pw / 2
      const cy = py + ph / 2
      const rx = pw / 2

      ctx.save()
      ctx.filter = `blur(${o.blur * scale}px)`
      ctx.globalAlpha = o.op / 100
      ctx.translate(cx, cy)
      ctx.scale(1, ph / pw)

      const { r, g, b } = hexToRgb(o.color)
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx)
      grad.addColorStop(0, `rgba(${r},${g},${b},1)`)
      grad.addColorStop(0.6, `rgba(${r},${g},${b},0.4)`)
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(0, 0, rx * 1.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })

    ctx.filter = 'none'
    ctx.globalAlpha = 1
    const imgData = ctx.getImageData(0, 0, W, H)
    const d = imgData.data
    const amp = state.grain * 2.8
    for (let i = 0; i < d.length; i += 4) {
      const n = (Math.random() - 0.5) * amp
      d[i] = Math.min(255, Math.max(0, d[i] + n))
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n))
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n))
    }
    ctx.putImageData(imgData, 0, 0)

    setFlashing(true)
    setTimeout(() => setFlashing(false), 120)

    const name = PRESETS[currentPreset].name.toLowerCase().replace(/\s+/g, '-')
    cnv.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gradient-${name}-${W}x${H}.png`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }, 'image/png')
  }, [state, exportSize, currentPreset])

  // ── Controls Panel ─────────────────────────────────────────────────────────

  const controlsPanel = (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Preset Strip */}
      <div className="border-b border-border px-3 py-3">
        <p className="t-label text-muted-foreground mb-2">Preset</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              onClick={() => loadPreset(i)}
              className={cn(
                'flex-none flex flex-col gap-1 group focus:outline-none',
              )}
              title={p.name}
            >
              <div
                className={cn(
                  'w-16 h-10 rounded-md transition-all duration-200 ring-offset-background',
                  currentPreset === i
                    ? 'ring-2 ring-foreground ring-offset-2'
                    : 'ring-1 ring-border group-hover:ring-foreground/30',
                )}
                style={presetBg(p)}
              />
              <span className="t-label text-muted-foreground text-center leading-tight truncate w-16 block">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Orb Accordion */}
      <div className="flex-1 overflow-y-auto">
        <Accordion type="single" collapsible className="px-3">
          {state.orbs.map((orb, i) => (
            <AccordionItem key={i} value={`orb-${i}`} className="border-border">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full border border-border shrink-0"
                    style={{ background: orb.color }}
                  />
                  <span className="t-label text-foreground">Orb {i + 1}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                {/* Color picker */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="t-label text-muted-foreground w-16 shrink-0">Farbe</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      className="w-7 h-7 rounded border border-border relative overflow-hidden"
                      style={{ background: orb.color }}
                    >
                      <input
                        type="color"
                        value={orb.color}
                        onChange={(e) => updateOrb(i, 'color', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </div>
                    <span className="t-mono text-muted-foreground">{orb.color}</span>
                  </label>
                </div>

                <SliderRow label="Deckkraft" value={orb.op}   min={0}   max={100} unit="%" onChange={(v) => updateOrb(i, 'op', v)}   />
                <SliderRow label="Weichheit" value={orb.blur} min={0}   max={150} unit="px" onChange={(v) => updateOrb(i, 'blur', v)} />
                <SliderRow label="X"         value={orb.x}   min={-30} max={130} unit="%" onChange={(v) => updateOrb(i, 'x', v)}    />
                <SliderRow label="Y"         value={orb.y}   min={-30} max={130} unit="%" onChange={(v) => updateOrb(i, 'y', v)}    />
                <SliderRow label="Breite"    value={orb.w}   min={10}  max={150} unit="%" onChange={(v) => updateOrb(i, 'w', v)}    />
                <SliderRow label="Höhe"      value={orb.h}   min={10}  max={150} unit="%" onChange={(v) => updateOrb(i, 'h', v)}    />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Global */}
        <div className="px-3 pt-2 pb-6 border-t border-border mt-2">
          <p className="t-label text-muted-foreground mb-3 pt-3">Global</p>

          <div className="flex items-center gap-3 mb-3">
            <span className="t-label text-muted-foreground w-16 shrink-0">Hintergrund</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className="w-7 h-7 rounded border border-border relative overflow-hidden"
                style={{ background: state.bg }}
              >
                <input
                  type="color"
                  value={state.bg}
                  onChange={(e) => updateGlobal('bg', e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
              <span className="t-mono text-muted-foreground">{state.bg}</span>
            </label>
          </div>

          <SliderRow
            label="Grain"
            value={state.grain}
            min={0}
            max={25}
            unit="%"
            onChange={(v) => updateGlobal('grain', v)}
          />
        </div>
      </div>

      {/* Export */}
      <div className="border-t border-border p-3 flex items-center gap-2 shrink-0">
        <select
          value={exportSize}
          onChange={(e) => setExportSize(e.target.value)}
          className="flex-1 bg-muted border border-border text-foreground rounded-md px-3 py-2 t-small focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {EXPORT_SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={handleExport}
          className="shrink-0 bg-foreground text-background px-4 py-2 rounded-md t-small font-medium hover:opacity-80 active:opacity-70 transition-opacity"
        >
          ↓ PNG
        </button>
      </div>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Flash overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-background pointer-events-none z-[9999] transition-opacity duration-75',
          flashing ? 'opacity-50' : 'opacity-0'
        )}
      />

      {/* Grain SVG filter (hidden) */}
      <svg style={{ display: 'none' }} aria-hidden="true">
        <defs>
          <filter id="gg-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      <div className="flex h-full overflow-hidden">

        {/* ── Gradient Preview ── */}
        <div className="relative flex-1 overflow-hidden" ref={previewRef}>
          {/* Background + Orbs */}
          <div
            className="absolute inset-0"
            style={{ background: state.bg }}
          >
            {state.orbs.map((orb, i) => <OrbLayer key={i} orb={orb} />)}
          </div>

          {/* Grain overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: '180px 180px',
              opacity: state.grain / 100,
              mixBlendMode: 'overlay',
            }}
          />

          {/* ── Mobile Bottom Bar ── */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-xl border-t border-border">
            {/* Mini Preset Strip */}
            <div className="flex gap-2 px-4 pt-3 overflow-x-auto scrollbar-none pb-2">
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => loadPreset(i)}
                  className={cn(
                    'flex-none w-12 h-7 rounded transition-all duration-200',
                    currentPreset === i
                      ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background'
                      : 'ring-1 ring-border',
                  )}
                  style={presetBg(p)}
                  title={p.name}
                />
              ))}
            </div>

            {/* Controls trigger + Export */}
            <div className="flex items-center gap-2 px-4 pb-3 pt-1">
              <Sheet>
                <SheetTrigger className="flex-1 flex items-center justify-center gap-2 bg-muted hover:bg-muted/80 border border-border rounded-md py-2 t-small text-foreground transition-colors">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 3.5h12M1 7h12M1 10.5h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Controls
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0">
                  <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
                    <SheetTitle className="t-label text-foreground">Gradient Controls</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-hidden">
                    {controlsPanel}
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
                onClick={handleExport}
                className="bg-foreground text-background px-3 py-2 rounded-md t-small font-medium hover:opacity-80 transition-opacity shrink-0"
              >
                ↓ PNG
              </button>
            </div>
          </div>
        </div>

        {/* ── Desktop Side Panel ── */}
        <div className="hidden md:flex w-72 flex-col border-l border-border bg-card overflow-hidden shrink-0">
          {controlsPanel}
        </div>
      </div>
    </>
  )
}
