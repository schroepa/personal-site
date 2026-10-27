/**
 * E-Mail-Adresse kopieren. Die Meldung geht in den aria-live-Bereich des Kontakt-Panels
 * (bei Fehlern: Hinweis und markierter Text, damit sich die Adresse von Hand kopieren lässt).
 */
export async function copyEmail(el: HTMLElement): Promise<void> {
  const adresse = (el.textContent ?? "").trim()
  const meldung = el.closest("[data-kontakt]")?.querySelector<HTMLElement>("[aria-live]") ?? null
  const ansagen = (text: string) => {
    if (meldung) meldung.textContent = text
  }
  try {
    await navigator.clipboard.writeText(adresse)
    ansagen("E-Mail-Adresse kopiert.")
  } catch {
    // Ohne Zwischenablage-Recht: Text markieren und den Weg nennen
    const auswahl = window.getSelection()
    const bereich = document.createRange()
    bereich.selectNodeContents(el)
    auswahl?.removeAllRanges()
    auswahl?.addRange(bereich)
    ansagen("Kopieren nicht möglich. Die Adresse ist markiert, mit Strg+C oder ⌘C kopieren.")
  }
}

/** Verdrahtet alle Knöpfe [data-kopieren]; gibt den Teardown zurück. */
export function initKopieren(): () => void {
  const abmelden: Array<() => void> = []
  document.querySelectorAll<HTMLElement>("[data-kopieren]").forEach((knopf) => {
    const ziel = knopf.closest("[data-kontakt]")?.querySelector<HTMLElement>("[data-email]")
    if (!ziel) return
    const onKlick = () => void copyEmail(ziel)
    knopf.addEventListener("click", onKlick)
    abmelden.push(() => knopf.removeEventListener("click", onKlick))
  })
  return () => abmelden.forEach((fn) => fn())
}
