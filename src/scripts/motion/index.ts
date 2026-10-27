/**
 * Einstieg der Bewegung: ruft alle Module auf und gibt das gesammelte Teardown zurück.
 * Weitere Module (Scroll-Animationen, Schrift, Magnet …) tragen sich hier in MODULES ein.
 * Jedes Modul läuft einzeln abgesichert: wirft eines, laufen die übrigen weiter.
 */
import { initLenis } from "./lenis"

export const MODULES: Array<() => () => void> = [initLenis]

export function initMotion(): () => void {
  const abmelden: Array<() => void> = []
  for (const modul of MODULES) {
    try {
      abmelden.push(modul())
    } catch (fehler) {
      console.error(fehler)
    }
  }
  return () => {
    for (const fn of abmelden.splice(0).reverse()) {
      try {
        fn()
      } catch (fehler) {
        console.error(fehler)
      }
    }
  }
}
