import { filterByTag } from "@/lib/filter"

/**
 * Themenfilter der Blog-Übersicht. Das Markup liefert die Seite (alles sichtbar, Chips erst mit JS):
 * - [data-filter-chips]: Gruppe mit Buttons; Button[data-tag] filtert, Button ohne data-tag zeigt alle
 * - [data-eintrag][data-tags]: ein Beitrag mit seinen Schlagwörtern als JSON-Liste
 * - [data-gruppe]: Abschnitt (Neu, Jahr); ohne sichtbaren Eintrag wird er samt Überschrift ausgeblendet
 * - [data-filter-leer]: Statusmeldung (role="status", Geschwister der Liste), nur bei 0 Treffern befüllt
 * Ein zweiter Klick auf den gewählten Chip hebt den Filter auf. Gibt eine Funktion zum Abmelden zurück.
 */
const KEIN_TREFFER = "Keine Beiträge zu diesem Thema."

function tagsVon(el: HTMLElement): string[] {
  try {
    const wert = JSON.parse(el.dataset.tags ?? "[]")
    return Array.isArray(wert) ? wert.filter((t): t is string => typeof t === "string") : []
  } catch {
    return []
  }
}

export function initFilter(root: HTMLElement): () => void {
  const chips = root.querySelector<HTMLElement>("[data-filter-chips]")
  if (!chips) return () => {}
  const status = root.querySelector<HTMLElement>("[data-filter-leer]")

  const anwenden = (tag: string | null) => {
    const eintraege = [...root.querySelectorAll<HTMLElement>("[data-eintrag]")].map((el) => ({ el, tags: tagsVon(el) }))
    const sichtbar = new Set(filterByTag(eintraege, tag).map((e) => e.el))
    for (const { el } of eintraege) el.hidden = !sichtbar.has(el)
    for (const gruppe of root.querySelectorAll<HTMLElement>("[data-gruppe]")) {
      gruppe.hidden = !gruppe.querySelector("[data-eintrag]:not([hidden])")
    }
    if (status) status.textContent = sichtbar.size === 0 ? KEIN_TREFFER : ""
    for (const knopf of chips.querySelectorAll<HTMLButtonElement>("button")) {
      const gewaehlt = knopf.dataset.tag === undefined ? tag === null : knopf.dataset.tag === tag
      knopf.setAttribute("aria-pressed", String(gewaehlt))
    }
  }

  const klick = (e: Event) => {
    const knopf = (e.target as HTMLElement).closest<HTMLButtonElement>("button")
    if (!knopf || !chips.contains(knopf)) return
    const tag = knopf.dataset.tag
    const aktuell = chips.querySelector<HTMLButtonElement>("button[aria-pressed='true']")?.dataset.tag ?? null
    // Alle oder erneuter Klick auf den gewählten Chip: Filter aufheben
    anwenden(tag === undefined || tag === aktuell ? null : tag)
  }

  chips.addEventListener("click", klick)
  anwenden(null)
  return () => {
    chips.removeEventListener("click", klick)
    root.querySelectorAll<HTMLElement>("[data-eintrag], [data-gruppe]").forEach((el) => (el.hidden = false))
    if (status) status.textContent = ""
  }
}
