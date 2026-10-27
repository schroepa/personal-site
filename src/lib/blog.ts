// Auswahl und Aufbereitung für Blog-Übersicht und Artikel: reine Funktionen ohne Astro-Abhängigkeit (node:test).
import { neuesteZuerst } from "./startseite.ts"

interface Beitrag {
  id: string
  data: { date: Date; draft: boolean; tags?: string[] }
}

/** Kennung der Content-Collection ohne Endung: „mein-beitrag.md“ wird „mein-beitrag“. */
export const slugVon = (id: string): string => id.replace(/\.md$/, "")

/** Veröffentlichte Beiträge, jüngste zuerst (Gleichstand: Kennung absteigend, wie auf der Startseite). */
export function veroeffentlichte<T extends Beitrag>(beitraege: readonly T[]): T[] {
  return neuesteZuerst(beitraege.filter((b) => !b.data.draft))
}

/** Gruppiert eine bereits sortierte Liste nach Jahr (UTC), Jahre absteigend, Reihenfolge innerhalb bleibt. */
export function gruppiereNachJahr<T extends { data: { date: Date } }>(
  sortiert: readonly T[]
): { jahr: number; eintraege: T[] }[] {
  const gruppen = new Map<number, T[]>()
  for (const eintrag of sortiert) {
    const jahr = eintrag.data.date.getUTCFullYear()
    gruppen.set(jahr, [...(gruppen.get(jahr) ?? []), eintrag])
  }
  return [...gruppen.entries()].sort(([a], [b]) => b - a).map(([jahr, eintraege]) => ({ jahr, eintraege }))
}

/** Alle Schlagwörter einmal, häufigste zuerst, bei Gleichstand alphabetisch (de). */
export function themenListe(beitraege: readonly { data: { tags?: string[] } }[]): string[] {
  const anzahl = new Map<string, number>()
  for (const b of beitraege) for (const tag of new Set(b.data.tags ?? [])) anzahl.set(tag, (anzahl.get(tag) ?? 0) + 1)
  return [...anzahl.entries()].sort(([a, na], [b, nb]) => nb - na || a.localeCompare(b, "de")).map(([tag]) => tag)
}

/** Bis zu `anzahl` weitere Beiträge aus der sortierten Liste, nie der aktuelle. */
export function weiterlesen<T extends { id: string }>(sortiert: readonly T[], aktuelleId: string, anzahl = 2): T[] {
  return sortiert.filter((b) => b.id !== aktuelleId).slice(0, Math.max(0, anzahl))
}

const datumFormat = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })

/** „Tech · 13. Juli 2026“ (kleine Zeilen, Figma 266:23320). */
export function zeilenMeta(tags: readonly string[] | undefined, datum: Date): string {
  return [tags?.[0], datumFormat.format(datum)].filter(Boolean).join(" · ")
}

/** Einträge des Inhaltsverzeichnisses: die h2 des gerenderten Markdowns mit ihrem Anker. */
export function ueberschriftenFuerInhalt(
  headings: readonly { depth: number; slug: string; text: string }[]
): { id: string; text: string }[] {
  return headings.filter((h) => h.depth === 2).map((h) => ({ id: h.slug, text: h.text }))
}
