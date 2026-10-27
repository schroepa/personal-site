/** Menü-Knopf des Site-Heads (nur im schmalen Layout sichtbar). Gibt den Teardown zurück. */
export function initMenue(): () => void {
  const knopf = document.querySelector<HTMLButtonElement>("[data-menue-knopf]")
  const menue = document.querySelector<HTMLElement>("[data-menue]")
  if (!knopf || !menue) return () => {}

  const setze = (offen: boolean) => {
    menue.toggleAttribute("data-offen", offen)
    knopf.setAttribute("aria-expanded", String(offen))
  }
  const onKlick = () => setze(!menue.hasAttribute("data-offen"))
  const onTaste = (e: KeyboardEvent) => {
    // Escape gehört dem Suchdialog, solange er offen ist
    if (document.querySelector("dialog[open]")) return
    if (e.key === "Escape" && menue.hasAttribute("data-offen")) {
      setze(false)
      knopf.focus()
    }
  }
  knopf.addEventListener("click", onKlick)
  document.addEventListener("keydown", onTaste)
  return () => {
    knopf.removeEventListener("click", onKlick)
    document.removeEventListener("keydown", onTaste)
  }
}
