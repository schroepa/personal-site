/**
 * Lichtband: reine Geometrie, Paletten und Scroll-Zusammenzug (ohne DOM, damit node:test sie importieren kann).
 * Quelle aller Zahlen: docs/reference/atmosphaere.js (Prototyp v14, „Effekte sind gut“). Figma-Shader können keine
 * Variablen binden (Übergabe), deshalb stehen Paletten, Gauß-Konstante und Fleckenlage als feste Konstanten hier.
 */
import { LICHTBAND_SKALA_MIN, LICHTBAND_ZUG_MAX_PX } from "./motion/formen.ts"

/** RGBA: Kanäle 0–255, Alpha 0–1. */
export type Farbe = [number, number, number, number]

/** Ein Gauß-Fleck in relativen Einheiten (Anteile der Breite/Höhe, Radius bezogen auf 0.55 · max(B, H)). */
export interface Blob {
  i: number
  x: number
  y: number
  r: number
  ph: number
}

export const FLECKEN_ANZAHL = 4

/** Palette hell (RGBA), verbatim aus dem Prototyp. */
const PALETTE_HELL: readonly Farbe[] = [
  [250, 199, 219, 0.85],
  [255, 209, 168, 0.9],
  [237, 173, 107, 0.45],
  [253, 242, 224, 0.9],
]
/** Palette dunkel (RGBA), verbatim aus dem Prototyp. */
const PALETTE_DUNKEL: readonly Farbe[] = [
  [196, 104, 92, 0.55],
  [222, 140, 64, 0.6],
  [140, 82, 112, 0.45],
  [236, 178, 120, 0.4],
]

/** Gauß-Abfall exp(−GAUSS_K · d² / r²), gerechnet im Fragment-Shader in Fließkomma. */
export const GAUSS_K = 2.6
/** Dithering beim Ausgeben: ±1.5/255, sonst entstehen Stufen (vor allem im Dunklen). */
export const DITHER_STUFEN = 1.5
/** Drift: x ±5 % (sin, 0.00011 pro ms), y ±3 % (cos, 0.00009 pro ms). */
export const DRIFT_X = 0.05
export const DRIFT_Y = 0.03
export const DRIFT_TEMPO_X = 0.00011
export const DRIFT_TEMPO_Y = 0.00009
/** Radius relativ zur längeren Seite. */
export const RADIUS_FAKTOR = 0.55

/** Kopie der Palette (Aufrufer dürfen sie verändern, ohne die Konstante zu berühren). */
export function paletteFor(dunkel: boolean): Farbe[] {
  return (dunkel ? PALETTE_DUNKEL : PALETTE_HELL).map((f) => [...f] as Farbe)
}

/** Pseudozufall des Prototyps: frac(sin(seed + i·127.1) · 43758.5453). */
function rnd(seed: number, i: number): number {
  const x = Math.sin(seed + i * 127.1) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Fleckenlage zum Startwert (je Besuch ein anderer): x 8–92 %, y 30–58 %, Radius 22–52 %, Phase 0–6.28.
 * Formeln unverändert aus dem Prototyp (die Phasenspanne 6.28 statt 2π ist Absicht: „genau so“).
 */
export function blobLayout(seed: number): Blob[] {
  return Array.from({ length: FLECKEN_ANZAHL }, (_, i) => ({
    i,
    x: 0.08 + 0.84 * rnd(seed, i * 3 + 1),
    y: 0.44 + (rnd(seed, i * 3 + 2) - 0.5) * 0.28,
    r: 0.22 + 0.3 * rnd(seed, i * 3 + 3),
    ph: rnd(seed, i + 9) * 6.28,
  }))
}

/** Lage eines Flecks zur Zeit t (ms) auf einer Fläche w × h: [x, y, Radius] in Pixeln. */
export function blobPosition(blob: Blob, t: number, w: number, h: number): [number, number, number] {
  return [
    (blob.x + Math.sin(t * DRIFT_TEMPO_X + blob.ph) * DRIFT_X) * w,
    (blob.y + Math.cos(t * DRIFT_TEMPO_Y + blob.ph) * DRIFT_Y) * h,
    blob.r * Math.max(w, h) * RADIUS_FAKTOR,
  ]
}

/**
 * Zusammenzug beim Scrollen: Anteil q = Scrollstand / Höhe der Hülle (0–1); Weg bis −40 px, Stauchung bis 0.55.
 */
export function scrollZusammenzug(scrollY: number, huelleHoehe: number): { y: number; skala: number } {
  const q = Math.min(1, Math.max(0, scrollY / (huelleHoehe || 1)))
  return { y: q * -LICHTBAND_ZUG_MAX_PX, skala: 1 - q * (1 - LICHTBAND_SKALA_MIN) }
}
