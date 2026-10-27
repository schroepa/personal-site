/**
 * Signatur „02 Über mich“: die Zeilen steigen nacheinander auf (Feder --motion-feder-zeile-*: 1000 ms / 0.14,
 * Versatz --motion-versatz-zeile: 120 ms) und das Gewicht wächst von 200 auf das Gewicht des Textstils
 * (--motion-schrift-gewicht: 1400 ms, 500 ms nach der Zeile; Geist variabel, Achse font-weight).
 * Läuft einmal, wenn die Signatur von unten in den Sichtbereich kommt; übersprungen oder schon sichtbar → Endzustand.
 *
 * Hover (nur pointer: fine, ohne reduzierte Bewegung): eine Zeile wird leicht (--font-weight-light) und kehrt beim
 * Verlassen zu ihrem Gewicht aus dem Textstil zurück; Dauer --motion-schrift-gewicht-hover (500 ms). Erst nach dem
 * Einstieg der Zeile (data-anim-fertig), damit Hover den Einstieg nicht stört.
 */
import { animate } from "motion"
import { mitFeinemZeiger } from "./zeiger"
import { abbrechen, alle, animationErlaubt, fertig, fertigNach, revealOnce, unterhalb, zaehle } from "./einmal"
import { GEWICHT_HOVER_TOKEN, GEWICHT_NACH_ZEILE_TOKEN, GEWICHT_START_TOKEN, WEG_TOKEN } from "./formen"
import { msToSeconds } from "./parse.mjs"
import { readEasing, readLength, readSpring, readToken } from "./tokens"

/** Hover-Gewicht der Zeilen (zeiger.ts: nur feiner Zeiger, ohne reduzierte Bewegung). */
function hoverAnlegen(zeilen: HTMLElement[]): () => void {
  const abmelden: Array<() => void> = []
  const laufend = new Map<HTMLElement, ReturnType<typeof animate>>()
  for (const zeile of zeilen) {
    const zu = (nach: "hover" | "ruhe") => {
      if (!zeile.hasAttribute("data-anim-fertig")) return
      const dauer = msToSeconds(readToken("--motion-schrift-gewicht-hover"))
      const ease = readEasing("--motion-easing-standard")
      abbrechen(laufend.get(zeile))
      const aktuell = parseFloat(getComputedStyle(zeile).fontWeight)
      let ziel: number
      if (nach === "hover") ziel = readToken(GEWICHT_HOVER_TOKEN)
      else {
        // Ruhegewicht = das Gewicht aus dem Textstil, also ohne Inline-Wert
        zeile.style.removeProperty("font-weight")
        ziel = parseFloat(getComputedStyle(zeile).fontWeight)
        zeile.style.fontWeight = String(aktuell)
      }
      const s = animate(zeile, { fontWeight: [aktuell, ziel] }, { duration: dauer, ease })
      laufend.set(zeile, s)
      if (nach === "ruhe") s.then(() => zeile.style.removeProperty("font-weight"), () => zeile.style.removeProperty("font-weight"))
    }
    const rein = () => zu("hover")
    const raus = () => zu("ruhe")
    zeile.addEventListener("pointerenter", rein)
    zeile.addEventListener("pointerleave", raus)
    zaehle(2)
    abmelden.push(() => {
      zeile.removeEventListener("pointerenter", rein)
      zeile.removeEventListener("pointerleave", raus)
      zaehle(-2)
    })
  }
  return () => {
    abmelden.forEach((fn) => fn())
    laufend.forEach(abbrechen)
    laufend.clear()
    zeilen.forEach((z) => z.style.removeProperty("font-weight"))
  }
}

export function initSignatur(): () => void {
  const zeilen = alle("[data-anim='zeile']")
  const wurzel = zeilen[0]?.closest<HTMLElement>("[data-signatur]")
  if (!wurzel) {
    fertig(...zeilen)
    return () => {}
  }
  const hover = mitFeinemZeiger(() => hoverAnlegen(zeilen))
  if (!animationErlaubt() || !unterhalb(wurzel)) {
    fertig(...zeilen)
    return hover
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
    hover()
    aufraeumen()
    steuerungen.forEach(abbrechen)
    fertig(...zeilen)
  }
}
