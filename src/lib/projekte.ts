// Auswahl für Projekt-Übersicht und Fallstudie: reine Funktionen ohne Astro-Abhängigkeit (node:test).
import { slugVon } from "./blog.ts"
import { neuesteZuerst } from "./startseite.ts"

interface Projekt {
  id: string
  data: { date: Date; featured: boolean; weitere: boolean; tags?: string[] }
}

const istAusgewaehlt = (p: Projekt) => p.data.featured && !p.data.weitere

/** Höchstens `anzahl` Projekte mit `featured` und ohne `weitere`, jüngste zuerst (Bento „Ausgewählt“). */
export function ausgewaehlte<T extends Projekt>(projekte: readonly T[], anzahl: number): T[] {
  return neuesteZuerst(projekte.filter(istAusgewaehlt)).slice(0, Math.max(0, anzahl))
}

/** Alles, was nicht im Bento steht (Liste „Weitere Projekte“), jüngste zuerst. */
export function weitereProjekte<T extends Projekt>(projekte: readonly T[], bentoAnzahl: number): T[] {
  const bento = new Set(ausgewaehlte(projekte, bentoAnzahl))
  return neuesteZuerst(projekte.filter((p) => !bento.has(p)))
}

/**
 * Das nächste Projekt in zeitlicher Reihenfolge (älteste zuerst, das nächstjüngere folgt), am Ende zyklisch das älteste.
 * Nie das Projekt selbst; bei nur einem Projekt oder unbekanntem Slug `null` (der Abschnitt entfällt).
 */
export function naechstesProjekt<T extends { id: string; data: { date: Date } }>(projekte: readonly T[], slug: string): T | null {
  const chronologisch = neuesteZuerst(projekte).reverse()
  const i = chronologisch.findIndex((p) => slugVon(p.id) === slug)
  if (i < 0 || chronologisch.length < 2) return null
  return chronologisch[(i + 1) % chronologisch.length]
}

/** Schlagwörter, die an mindestens `minimum` Projekten hängen: häufigste zuerst, dann alphabetisch (de). */
export function haeufigeThemen(projekte: readonly { data: { tags?: string[] } }[], minimum: number): string[] {
  const zaehler = new Map<string, number>()
  for (const p of projekte) for (const t of new Set(p.data.tags ?? [])) zaehler.set(t, (zaehler.get(t) ?? 0) + 1)
  return [...zaehler.entries()]
    .filter(([, n]) => n >= minimum)
    .sort(([a, na], [b, nb]) => nb - na || a.localeCompare(b, "de"))
    .map(([t]) => t)
}
