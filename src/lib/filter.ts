/**
 * Themenfilter: reine Funktion ohne DOM. `null` heißt alle; ein Tag trifft nur bei exakter Übereinstimmung.
 * Einträge ohne `tags` bleiben bei `null` erhalten und werden von jedem Tag ausgeschlossen. Die Reihenfolge bleibt.
 */
/** Ansage für den Statusbereich: leer ohne Filter, „Keine Beiträge zu diesem Thema.“ bei 0, sonst „N Beiträge“. */
export function filterStatus(anzahl: number, gefiltert: boolean): string {
  if (anzahl === 0) return "Keine Beiträge zu diesem Thema."
  if (!gefiltert) return ""
  return anzahl === 1 ? "1 Beitrag" : `${anzahl} Beiträge`
}

export function filterByTag<T extends { tags?: string[] }>(items: T[], tag: string | null): T[] {
  if (tag === null) return [...items]
  return items.filter((item) => item.tags?.includes(tag) ?? false)
}
