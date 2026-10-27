/**
 * Tag-Wischen: das Handschrift-Tag im Kontakt-Panel (Slot „tag“, data-anim="tag") wischt von links auf, sobald das
 * Panel von unten in den Sichtbereich kommt (revealOnce). Dauer 1600 ms = --motion-dauer-sehr-lang, Kurve
 * --motion-easing-oeffnen („Masken, die sich öffnen: Tag-Wischen“, Figma Foundation-Motion). Maske per clip-path.
 * Der Startzustand (eingeklappt) steht in neu-bewegung.css hinter dem Gate; ohne JS, bei reduzierter Bewegung,
 * bei schon sichtbarem Panel und nach Ankersprung steht das Tag sofort voll da. Was im Slot liegt, ist egal.
 */
import { animate } from "motion"
import { abbrechen, alle, animationErlaubt, fertig, fertigNach, revealOnce, unterhalb } from "./einmal"
import { msToSeconds } from "./parse.mjs"
import { readEasing, readToken } from "./tokens"

export function initTagWischen(): () => void {
  const tags = alle("[data-anim='tag']")
  const aufraeumen: Array<() => void> = []
  const steuerungen: Array<ReturnType<typeof animate>> = []
  for (const tag of tags) {
    const panel = tag.closest<HTMLElement>("[data-kontakt]") ?? tag
    if (!animationErlaubt() || !unterhalb(panel)) {
      fertig(tag)
      continue
    }
    aufraeumen.push(
      revealOnce(panel, (uebersprungen) => {
        if (uebersprungen || !animationErlaubt()) return fertig(tag)
        const s = animate(
          tag,
          { clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)"] },
          { duration: msToSeconds(readToken("--motion-dauer-sehr-lang")), ease: readEasing("--motion-easing-oeffnen") }
        )
        fertigNach(s, tag)
        steuerungen.push(s)
      })
    )
  }
  return () => {
    aufraeumen.forEach((fn) => fn())
    steuerungen.forEach(abbrechen)
    fertig(...tags)
  }
}
