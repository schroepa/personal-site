/**
 * Themenfilter: reine Funktion ohne DOM. `null` heißt alle; ein Tag trifft nur bei exakter Übereinstimmung.
 * Einträge ohne `tags` bleiben bei `null` erhalten und werden von jedem Tag ausgeschlossen. Die Reihenfolge bleibt.
 */
export function filterByTag<T extends { tags?: string[] }>(items: T[], tag: string | null): T[] {
  if (tag === null) return [...items]
  return items.filter((item) => item.tags?.includes(tag) ?? false)
}
