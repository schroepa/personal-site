/**
 * Hero: die Wörter der h1 steigen nacheinander auf (Feder --motion-feder-wort-*: 900 ms / 0.12, Versatz
 * --motion-versatz-wort: 70 ms). Der Kicker („→ Design Engineer → Berlin“) gehört seit Task 13 zu labels.ts
 * (Scramble und Sperrung). Der Hero liegt beim Laden im Sichtbereich und läuft deshalb sofort.
 */
import { animate, stagger } from "motion"
import { abbrechen, alle, animationErlaubt, fertig, fertigNach } from "./einmal"
import { WEG_TOKEN } from "./formen"
import { msToSeconds } from "./parse.mjs"
import { readLength, readSpring, readToken } from "./tokens"

export function initHeroWoerter(): () => void {
  const woerter = alle("[data-anim='wort']")
  if (woerter.length === 0) return () => {}
  if (!animationErlaubt()) {
    fertig(...woerter)
    return () => {}
  }
  const weg = readLength(WEG_TOKEN)
  const s = animate(
    woerter,
    { opacity: [0, 1], transform: [`translateY(${weg}px)`, "translateY(0px)"] },
    { type: "spring", ...readSpring("--motion-feder-wort"), delay: stagger(msToSeconds(readToken("--motion-versatz-wort"))) }
  )
  fertigNach(s, ...woerter)
  return () => {
    abbrechen(s)
    fertig(...woerter)
  }
}
