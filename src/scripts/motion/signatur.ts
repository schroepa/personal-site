/**
 * Signatur „02 Über mich“: die Zeilen steigen nacheinander auf (Feder --motion-feder-zeile-*: 1000 ms / 0.14,
 * Versatz --motion-versatz-zeile: 120 ms) und das Gewicht wächst von 200 auf das Gewicht des Textstils
 * (--motion-schrift-gewicht: 1400 ms, 500 ms nach der Zeile; Geist variabel, Achse font-weight).
 * Läuft einmal, wenn die Signatur von unten in den Sichtbereich kommt; übersprungen oder schon sichtbar → Endzustand.
 */
import { animate } from "motion"
import { abbrechen, alle, animationErlaubt, fertig, fertigNach, revealOnce, unterhalb } from "./einmal"
import { GEWICHT_NACH_ZEILE_TOKEN, GEWICHT_START_TOKEN, WEG_TOKEN } from "./formen"
import { msToSeconds } from "./parse.mjs"
import { readEasing, readLength, readSpring, readToken } from "./tokens"

export function initSignatur(): () => void {
  const zeilen = alle("[data-anim='zeile']")
  const wurzel = zeilen[0]?.closest<HTMLElement>("[data-signatur]")
  if (!wurzel) {
    fertig(...zeilen)
    return () => {}
  }
  if (!animationErlaubt() || !unterhalb(wurzel)) {
    fertig(...zeilen)
    return () => {}
  }
  const steuerungen: Array<ReturnType<typeof animate>> = []
  const aufraeumen = revealOnce(wurzel, (uebersprungen) => {
    if (uebersprungen || !animationErlaubt()) return fertig(...zeilen)
    const versatz = msToSeconds(readToken("--motion-versatz-zeile"))
    const gewichtDauer = msToSeconds(readToken("--motion-schrift-gewicht"))
    const gewichtNach = msToSeconds(readToken(GEWICHT_NACH_ZEILE_TOKEN))
    const von = readToken(GEWICHT_START_TOKEN)
    const weg = readLength(WEG_TOKEN)
    const ease = readEasing("--motion-easing-standard")
    const feder = readSpring("--motion-feder-zeile")
    zeilen.forEach((zeile, k) => {
      const bis = parseFloat(getComputedStyle(zeile).fontWeight)
      zeile.style.fontWeight = String(von)
      const aufstieg = animate(
        zeile,
        { opacity: [0, 1], transform: [`translateY(${weg}px)`, "translateY(0px)"] },
        { type: "spring", ...feder, delay: k * versatz }
      )
      const gewicht = animate(zeile, { fontWeight: [von, bis] }, { duration: gewichtDauer, ease, delay: gewichtNach + k * versatz })
      steuerungen.push(aufstieg, gewicht)
      fertigNach(Promise.all([aufstieg, gewicht]), zeile)
    })
  })
  return () => {
    aufraeumen()
    steuerungen.forEach(abbrechen)
    fertig(...zeilen)
  }
}
