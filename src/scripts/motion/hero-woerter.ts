/**
 * Hero: die Wörter der h1 steigen nacheinander auf (Feder --motion-feder-wort-*: 900 ms / 0.12, Versatz
 * --motion-versatz-wort: 70 ms). Der Kicker („→ Design Engineer → Berlin“) zieht seine Sperrung zusammen
 * (--motion-schrift-sperrung: 1200 ms von 0.6em auf die Sperrung des Textstils), wie im Prototyp v14.
 * Der Hero liegt beim Laden im Sichtbereich und läuft deshalb sofort.
 */
import { animate, stagger } from "motion"
import { abbrechen, alle, animationErlaubt, fertig, fertigNach } from "./einmal"
import { SPERRUNG_START, WEG_TOKEN } from "./formen"
import { msToSeconds } from "./parse.mjs"
import { readEasing, readLength, readSpring, readToken } from "./tokens"

export function initHeroWoerter(): () => void {
  const woerter = alle("[data-anim='wort']")
  const kicker = document.querySelector<HTMLElement>("[data-anim='kicker']")
  if (woerter.length === 0 && !kicker) return () => {}
  if (!animationErlaubt()) {
    fertig(...woerter, kicker)
    return () => {}
  }
  const steuerungen: Array<ReturnType<typeof animate>> = []
  const weg = readLength(WEG_TOKEN)

  if (woerter.length > 0) {
    const s = animate(
      woerter,
      { opacity: [0, 1], transform: [`translateY(${weg}px)`, "translateY(0px)"] },
      { type: "spring", ...readSpring("--motion-feder-wort"), delay: stagger(msToSeconds(readToken("--motion-versatz-wort"))) }
    )
    fertigNach(s, ...woerter)
    steuerungen.push(s)
  }

  if (kicker) {
    const ende = getComputedStyle(kicker).letterSpacing
    const s = animate(
      kicker,
      { opacity: [0, 1], letterSpacing: [SPERRUNG_START, ende === "normal" ? "0px" : ende] },
      { duration: msToSeconds(readToken("--motion-schrift-sperrung")), ease: readEasing("--motion-easing-standard") }
    )
    fertigNach(s, kicker)
    steuerungen.push(s)
  }

  return () => {
    steuerungen.forEach(abbrechen)
    fertig(...woerter, kicker)
  }
}
