/**
 * Galerie-Akkordeon: genau ein Streifen ist offen (data-aktiv am Wurzelelement, Index ab 0).
 * Die Breiten steuert das CSS aus diesem Zustand; hier wird nur der Zustand gewechselt.
 * Bedienung: Zeiger mit Absicht, Fokus, Pfeil links/rechts, Home/End. Roving-Tabindex: nur der
 * aktive Streifen ist per Tab erreichbar.
 */

/**
 * Hover-Absicht in Millisekunden. 90 ms stammen aus den Bewegungsregeln der Spezifikation
 * (Figma-Beschreibung „galerie-akkordeon“: „90 ms Hover-Absicht“). Es ist ein Verhaltenswert, kein
 * Gestaltungswert, deshalb keine Variable: eine kürzere Überfahrt ändert nichts.
 */
export const HOVER_ABSICHT_MS = 90

export function initGalerieAkkordeon(root: HTMLElement): () => void {
  const streifen = [...root.querySelectorAll<HTMLAnchorElement>(":scope > a")]
  if (streifen.length === 0) return () => {}

  let aktiv = Number(root.dataset.aktiv ?? 0)
  if (!Number.isInteger(aktiv) || aktiv < 0 || aktiv >= streifen.length) aktiv = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  const setzen = (index: number) => {
    aktiv = index
    root.dataset.aktiv = String(index)
    streifen.forEach((s, i) => {
      s.setAttribute("tabindex", i === index ? "0" : "-1")
      if (i === index) s.setAttribute("aria-current", "true")
      else s.removeAttribute("aria-current")
    })
  }
  setzen(aktiv)

  const abbrechen = () => {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
  }

  const abmelden: Array<() => void> = [abbrechen]
  const hoeren = <K extends keyof HTMLElementEventMap>(
    ziel: HTMLElement,
    typ: K,
    fn: (e: HTMLElementEventMap[K]) => void
  ) => {
    ziel.addEventListener(typ, fn)
    abmelden.push(() => ziel.removeEventListener(typ, fn))
  }

  streifen.forEach((streifenEl, index) => {
    hoeren(streifenEl, "pointerenter", (e) => {
      if (e.pointerType !== "mouse" || index === aktiv) return
      abbrechen()
      timer = setTimeout(() => setzen(index), HOVER_ABSICHT_MS)
    })
    hoeren(streifenEl, "pointerleave", abbrechen)
    hoeren(streifenEl, "focus", () => {
      abbrechen()
      if (index !== aktiv) setzen(index)
    })
    hoeren(streifenEl, "keydown", (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      const letzter = streifen.length - 1
      const ziel =
        e.key === "ArrowRight" ? Math.min(index + 1, letzter)
        : e.key === "ArrowLeft" ? Math.max(index - 1, 0)
        : e.key === "Home" ? 0
        : e.key === "End" ? letzter
        : null
      if (ziel === null) return
      e.preventDefault()
      abbrechen()
      setzen(ziel)
      streifen[ziel].focus()
    })
  })

  return () => abmelden.forEach((fn) => fn())
}
