/** Wortwahl der Statusmeldung (Standard: Beiträge). */
export interface Einheit {
  ein: string
  mehr: string
}
const BEITRAEGE: Einheit = { ein: "Beitrag", mehr: "Beiträge" }

/** Ansage für den Statusbereich: leer ohne Filter, „Keine Beiträge zu diesem Thema.“ bei 0, sonst „N Beiträge“. */
export function filterStatus(anzahl: number, gefiltert: boolean, einheit: Einheit = BEITRAEGE): string {
  if (anzahl === 0) return `Keine ${einheit.mehr} zu diesem Thema.`
  if (!gefiltert) return ""
  return anzahl === 1 ? `1 ${einheit.ein}` : `${anzahl} ${einheit.mehr}`
}

/**
 * Filtert Einträge nach Themenfilter, reine Funktion ohne DOM. `null` heißt alle; ein Tag trifft nur bei exakter Übereinstimmung.
 * Einträge ohne `tags` bleiben bei `null` erhalten und werden von jedem Tag ausgeschlossen. Die Reihenfolge bleibt.
 */
export function filterByTag<T extends { tags?: string[] }>(items: T[], tag: string | null): T[] {
  if (tag === null) return [...items]
  return items.filter((item) => item.tags?.includes(tag) ?? false)
}
