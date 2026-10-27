/**
 * Abschnittslinie: zeichnet sich von links, wenn der Abschnitt von unten in den Sichtbereich kommt
 * (Feder --motion-feder-linie-*: 1100 ms / 0). Läuft je Linie einmal; übersprungene oder beim Laden
 * schon sichtbare Linien stehen sofort im Endzustand.
 */
import { animate } from "motion"
import { abbrechen, alle, animationErlaubt, fertig, fertigNach, revealOnce, unterhalb } from "./einmal"
import { readSpring } from "./tokens"

export function initAbschnittslinie(): () => void {
  const linien = alle("[data-anim='linie']")
  const aufraeumen: Array<() => void> = []
  const steuerungen: Array<ReturnType<typeof animate>> = []
  for (const linie of linien) {
    if (!animationErlaubt() || !unterhalb(linie)) {
      fertig(linie)
      continue
    }
    aufraeumen.push(
      revealOnce(linie, (uebersprungen) => {
        if (uebersprungen || !animationErlaubt()) return fertig(linie)
        const s = animate(linie, { transform: ["scaleX(0)", "scaleX(1)"] }, { type: "spring", ...readSpring("--motion-feder-linie") })
        fertigNach(s, linie)
        steuerungen.push(s)
      })
    )
  }
  return () => {
    aufraeumen.forEach((fn) => fn())
    steuerungen.forEach(abbrechen)
    fertig(...linien)
  }
}
