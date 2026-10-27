/**
 * Einstieg der Bewegung: ruft alle Module auf und gibt das gesammelte Teardown zurück.
 * Weitere Module tragen sich hier in MODULES ein. Reihenfolge: durchstreichen vor
 * hero-woerter (es fügt das Wort „Screens“ ein, das mit den anderen Wörtern einsteigt).
 * Jedes Modul läuft einzeln abgesichert: wirft eines, laufen die übrigen weiter und das Gate (data-motion)
 * wird geöffnet, damit kein Inhalt im Startzustand hängen bleibt.
 */
import { initAbschnittslinie } from "./abschnittslinie"
import { initAkkordeon } from "./akkordeon"
import { initBegleiter } from "./begleiter"
import { initBildZoom } from "./bild-zoom"
import { initDurchstreichen } from "./durchstreichen"
import { gateAus, notfall, wachtStoppen } from "./gate"
import { initHeroWoerter } from "./hero-woerter"
import { initLabels } from "./labels"
import { initLenis } from "./lenis"
import { initMagnet } from "./magnet"
import { initRasterAufbau } from "./raster-aufbau"
import { initRasterSpalte } from "./raster-spalte"
import { initRasterUmbau } from "./raster-umbau"
import { initSignatur } from "./signatur"
import { initTagWischen } from "./tag-wischen"
import { prefersReducedMotion, REDUZIERT_QUERY } from "./tokens"

export const MODULES: Array<() => () => void> = [
  initLenis,
  initDurchstreichen,
  initHeroWoerter,
  initRasterAufbau,
  initRasterSpalte,
  initSignatur,
  initAbschnittslinie,
  initAkkordeon,
  initLabels,
  initTagWischen,
  initRasterUmbau,
  initMagnet,
  initBegleiter,
  initBildZoom,
]

/** Alle Module einzeln abgesichert starten; gibt das gesammelte Teardown zurück. */
function starten(): () => void {
  const abmelden: Array<() => void> = []
  // Die Meldung nennt das Modul (der äußere sicher()-Schutz in SiteLayout kennt es nicht)
  for (const modul of MODULES) {
    try {
      abmelden.push(modul())
    } catch (fehler) {
      console.error(`Bewegungsmodul „${modul.name || "anonym"}“ fehlgeschlagen:`, fehler)
      notfall()
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

export function initMotion(): () => void {
  // Das Bündel läuft: der Watchdog im Kopf (gate.ts) wird nicht mehr gebraucht
  wachtStoppen()
  let stoppen = starten()
  // Systemeinstellung „Bewegung reduzieren“ zur Laufzeit: laufende Animationen abbrechen (Teardown stellt den
  // Endzustand her), bei „reduzieren“ das Gate schließen, danach alle Module neu anlegen (sie prüfen die
  // Einstellung selbst; Lenis und die Zeigereffekte entstehen bzw. verschwinden damit).
  const reduziert = window.matchMedia(REDUZIERT_QUERY)
  const beiWechsel = () => {
    stoppen()
    if (prefersReducedMotion()) gateAus()
    stoppen = starten()
  }
  reduziert.addEventListener("change", beiWechsel)
  return () => {
    reduziert.removeEventListener("change", beiWechsel)
    stoppen()
  }
}
