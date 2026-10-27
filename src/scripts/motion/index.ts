/**
 * Einstieg der Bewegung: ruft alle Module auf und gibt das gesammelte Teardown zurück.
 * Weitere Module (Labels, Magnet …) tragen sich hier in MODULES ein. Reihenfolge: durchstreichen vor
 * hero-woerter (es fügt das Wort „Screens“ ein, das mit den anderen Wörtern einsteigt).
 * Jedes Modul läuft einzeln abgesichert: wirft eines, laufen die übrigen weiter und das Gate (data-motion)
 * wird geöffnet, damit kein Inhalt im Startzustand hängen bleibt.
 */
import { initAbschnittslinie } from "./abschnittslinie"
import { initAkkordeon } from "./akkordeon"
import { initDurchstreichen } from "./durchstreichen"
import { gateAus, wachtStoppen } from "./gate"
import { initHeroWoerter } from "./hero-woerter"
import { initLenis } from "./lenis"
import { initRasterAufbau } from "./raster-aufbau"
import { initRasterSpalte } from "./raster-spalte"
import { initSignatur } from "./signatur"

export const MODULES: Array<() => () => void> = [
  initLenis,
  initDurchstreichen,
  initHeroWoerter,
  initRasterAufbau,
  initRasterSpalte,
  initSignatur,
  initAbschnittslinie,
  initAkkordeon,
]

export function initMotion(): () => void {
  // Das Bündel läuft: der Watchdog im Kopf (gate.ts) wird nicht mehr gebraucht
  wachtStoppen()
  const abmelden: Array<() => void> = []
  // Die Meldung nennt das Modul (der äußere sicher()-Schutz in SiteLayout kennt es nicht)
  for (const modul of MODULES) {
    try {
      abmelden.push(modul())
    } catch (fehler) {
      console.error(`Bewegungsmodul „${modul.name || "anonym"}“ fehlgeschlagen:`, fehler)
      gateAus()
    }
  }
  return () => {
    for (const fn of abmelden.splice(0).reverse()) {
      try {
        fn()
      } catch (fehler) {
        console.error("Bewegungsmodul-Teardown fehlgeschlagen:", fehler)
      }
    }
  }
}
