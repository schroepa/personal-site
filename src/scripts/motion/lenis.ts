/**
 * Weiches Scrollen mit Lenis. Glättung aus dem Token --motion-scroll-glaettung (Alias auf
 * --physik-glaettung-0_085).
 *
 * Keine Instanz bei „Bewegung reduzieren“ (Systemeinstellung) und auf Geräten mit grobem Zeiger
 * (pointer: coarse, Touch): dort bleibt das native Scrollen mit seiner Trägheit und dem
 * Adressleisten-Verhalten unangetastet. Ändert sich die Systemeinstellung zur Laufzeit, entsteht oder
 * verschwindet die Instanz sofort. Das Teardown zerstört die Instanz und entfernt die lenis-Klassen.
 *
 * Anker (#id, auch Inhaltsverzeichnis und Schriftfeld) übernimmt Lenis selbst und beachtet
 * scroll-margin-top. Scrollbare Bereiche (Suche) tragen data-lenis-prevent und scrollen nativ.
 */
import Lenis from "lenis"
import { prefersReducedMotion, readToken, REDUZIERT_QUERY } from "./tokens"

const TOUCH_QUERY = "(pointer: coarse)"

declare global {
  interface Window {
    /** Nur in Dev-/Testbuilds: Anzahl lebender Lenis-Instanzen */
    __lenisCount?: number
  }
}

let lebend = 0
function zaehlen(delta: number) {
  lebend += delta
  if (import.meta.env.DEV) window.__lenisCount = lebend
}

export function initLenis(): () => void {
  const reduziert = window.matchMedia(REDUZIERT_QUERY)
  const touch = window.matchMedia(TOUCH_QUERY)
  let lenis: Lenis | null = null

  const erzeugen = () => {
    lenis = new Lenis({
      lerp: readToken("--motion-scroll-glaettung"),
      autoRaf: true,
      anchors: true,
    })
    zaehlen(1)
  }
  const zerstoeren = () => {
    if (!lenis) return
    lenis.destroy()
    lenis = null
    zaehlen(-1)
  }
  const abgleichen = () => {
    const soll = !prefersReducedMotion() && !touch.matches
    if (soll && !lenis) erzeugen()
    else if (!soll && lenis) zerstoeren()
  }
  // Aus einem Listener heraus nie werfen: fehlendes oder ungültiges Token wird gemeldet, die Seite scrollt nativ weiter
  const beiAenderung = () => {
    try {
      abgleichen()
    } catch (fehler) {
      console.error("Lenis konnte nicht gestartet werden:", fehler)
    }
  }

  if (import.meta.env.DEV && window.__lenisCount === undefined) window.__lenisCount = lebend
  abgleichen()
  reduziert.addEventListener("change", beiAenderung)
  touch.addEventListener("change", beiAenderung)

  return () => {
    reduziert.removeEventListener("change", beiAenderung)
    touch.removeEventListener("change", beiAenderung)
    zerstoeren()
  }
}
