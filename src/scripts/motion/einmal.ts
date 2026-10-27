/**
 * Gemeinsame Hilfen der Bewegungsmodule.
 *
 * - Start-/Endzustand: Animierte Elemente tragen data-anim="…". Unter html[data-motion] versteckt
 *   neu-bewegung.css sie, solange data-anim-fertig fehlt. fertig() gibt sie frei und räumt Inline-Reste auf.
 * - revealOnce: führt eine Animation einmal aus, wenn ein Element von unten in den Sichtbereich kommt.
 */
import type { AnimationPlaybackControls } from "motion"
import { prefersReducedMotion } from "./tokens"

/**
 * Wie weit der Sichtbereich unten schrumpft, bevor ein Element als „eingetreten“ gilt (Anteil der Höhe).
 * Verhaltenswert: die Animation beginnt, wenn die Oberkante des Elements den unteren 15-%-Streifen verlässt.
 */
export const EINTRITT_ANTEIL = 0.15

/**
 * Wie weit der Beobachtungsbereich nach oben reicht (px). Alles oberhalb des Sichtbereichs zählt dadurch
 * als bereits eingetreten: so meldet der Beobachter auch Elemente, die ein Ankersprung übersprungen hat.
 */
const OBEN_REICHWEITE_PX = 100_000

const FERTIG = "data-anim-fertig"

/** Inline-Eigenschaften, die die Animationen setzen und beim Fertigstellen verschwinden. */
const INLINE_RESTE = ["opacity", "transform", "filter", "font-weight", "letter-spacing", "clip-path", "flex-grow"]

declare global {
  interface Window {
    /** Nur in Dev-/Testbuilds: Zahl lebender Beobachter und Hörer der Bewegungsmodule */
    __motionLebend?: number
  }
}

let lebend = 0
/** Zählt lebende Beobachter/Hörer (Dev-/Testhook, im Produktivbuild entfernt). */
export function zaehle(delta: number): void {
  lebend += delta
  if (import.meta.env.DEV) window.__motionLebend = lebend
}

/** Art der letzten Client-Router-Navigation (push, replace, traverse). Vor der ersten: undefined. */
let letzteNavigation: string | undefined
if (typeof document !== "undefined") {
  document.addEventListener("astro:before-preparation", (e) => {
    letzteNavigation = (e as unknown as { navigationType?: string }).navigationType
  })
}

/**
 * Wiederherstellung statt frischer Ankunft: Zurück/Vor (Client-Router: traverse; Neuladen aus dem
 * Verlauf: back_forward). Dann steht alles sofort im Endzustand, die Animationen laufen nicht erneut.
 */
export function wiederherstellung(): boolean {
  if (letzteNavigation !== undefined) return letzteNavigation === "traverse"
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
  return nav?.type === "back_forward"
}

/** Dürfen Animationen laufen? Nur mit offenem Gate, ohne reduzierte Bewegung und bei frischer Ankunft. */
export function animationErlaubt(): boolean {
  return document.documentElement.hasAttribute("data-motion") && !prefersReducedMotion() && !wiederherstellung()
}

/** Gibt Elemente im Endzustand frei und entfernt Inline-Reste der Animation. */
export function fertig(...elemente: Array<Element | null | undefined>): void {
  for (const el of elemente) {
    if (!el) continue
    el.setAttribute(FERTIG, "")
    if (el instanceof HTMLElement || el instanceof SVGElement) {
      for (const eigenschaft of INLINE_RESTE) el.style.removeProperty(eigenschaft)
      if (el.getAttribute("style") === "") el.removeAttribute("style")
    }
  }
}

/**
 * Gibt Elemente frei, sobald die Animation fertig ist. Einen Frame später: Motion schreibt den Endwert
 * nach dem Ende noch inline, das fertig() sonst nicht mehr aufräumen könnte.
 * Auch bei abgelehnter oder abgebrochener Animation (cancel, Fehler) wird freigegeben: ein Element darf nie
 * im Startzustand (opacity 0) hängen bleiben, nur weil seine Animation nicht zu Ende lief.
 */
export function fertigNach(steuerung: { then: (onResolve: () => void, onReject?: () => void) => unknown }, ...elemente: Array<Element | null | undefined>): void {
  const freigeben = () => void requestAnimationFrame(() => fertig(...elemente))
  steuerung.then(freigeben, freigeben)
}

/** Liegt das Element unterhalb des Bereichs, ab dem revealOnce auslöst? (nur dann wird animiert) */
export function unterhalb(el: Element): boolean {
  return el.getBoundingClientRect().top > window.innerHeight * (1 - EINTRITT_ANTEIL)
}

/** Alle Elemente eines Selektors in Dokumentreihenfolge. */
export function alle<T extends HTMLElement = HTMLElement>(selektor: string): T[] {
  return [...document.querySelectorAll<T>(selektor)]
}

/** Laufende Animation abbrechen (ohne zu werfen). */
export function abbrechen(steuerung: AnimationPlaybackControls | undefined): void {
  try {
    steuerung?.cancel()
  } catch {
    steuerung?.stop()
  }
}

/**
 * Führt `run` einmal aus, sobald das Element von unten in den Sichtbereich kommt. Wurde es durch einen
 * Ankersprung oder Scrollen übersprungen (liegt beim Auslösen ganz oberhalb), ruft es `run(true)` auf:
 * dann soll das Modul den Endzustand ohne Animation setzen. Gibt das Aufräumen zurück (trennt den Beobachter).
 * Elemente, die beim Aufruf schon im Sichtbereich liegen, behandelt das Modul selbst (siehe unterhalb()).
 */
export function revealOnce(el: Element, run: (uebersprungen: boolean) => void): () => void {
  if (!("IntersectionObserver" in window)) {
    run(true)
    return () => {}
  }
  let offen = true
  const beenden = () => {
    if (!offen) return false
    offen = false
    io.disconnect()
    zaehle(-1)
    return true
  }
  const io = new IntersectionObserver(
    (eintraege) => {
      for (const e of eintraege) {
        if (!e.isIntersecting) continue
        if (!beenden()) return
        run(e.boundingClientRect.bottom <= 0)
        return
      }
    },
    { rootMargin: `${OBEN_REICHWEITE_PX}px 0px -${EINTRITT_ANTEIL * 100}% 0px` }
  )
  io.observe(el)
  zaehle(1)
  return () => {
    beenden()
  }
}
