/**
 * Zeigereffekte nur mit feinem Zeiger (pointer: fine) und ohne reduzierte Bewegung. Die Bedingung gilt live:
 * ändert sie sich zur Laufzeit (Maus angesteckt, Tablet mit Tastatur), legt das Modul seine Hörer an oder ab.
 * Die Systemeinstellung „Bewegung reduzieren“ behandelt initMotion (Neustart aller Module).
 */
import { zaehle } from "./einmal"
import { prefersReducedMotion } from "./tokens"

export const FEIN = "(pointer: fine)"

/**
 * `anlegen` baut Hörer und Zustand auf und gibt das vollständige Aufräumen zurück. Gibt das Teardown des
 * Wächters zurück (räumt auch einen aktiven Aufbau ab).
 */
export function mitFeinemZeiger(anlegen: () => () => void): () => void {
  const fein = window.matchMedia(FEIN)
  let abbau: (() => void) | null = null
  const abgleichen = () => {
    const soll = !prefersReducedMotion() && fein.matches
    if (soll && !abbau) abbau = anlegen()
    else if (!soll && abbau) {
      abbau()
      abbau = null
    }
  }
  fein.addEventListener("change", abgleichen)
  zaehle(1)
  abgleichen()
  return () => {
    fein.removeEventListener("change", abgleichen)
    zaehle(-1)
    abbau?.()
    abbau = null
  }
}
