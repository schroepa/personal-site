/**
 * Rasterspalte unter dem Zeiger: eine Hervorhebungs-Ebene (::before der Spalte), deren Deckkraft
 * (--spalte-an) eine Feder treibt. Ein: --motion-feder-spalte-ein (450 ms), aus: --motion-feder-spalte-aus
 * (1300 ms, die Spur klingt nach). Nur bei pointer: fine und ohne reduzierte Bewegung.
 *
 * Der Zeiger wird pro Frame ausgewertet (rAF-Drossel, nicht pro Ereignis). Ob ein feiner Zeiger da ist, gilt live:
 * wechselt (pointer: fine) zur Laufzeit, legt das Modul die Hörer an oder ab.
 *
 * Gleiche Quelle wie das Schriftfeld: über einem [data-objekt] sind dessen Spalten hervorgehoben („Spalte a–b“).
 * Die Spalten tragen data-hover, solange sie hervorgehoben sind.
 */
import { animate, motionValue, type MotionValue } from "motion"
import { zaehle } from "./einmal"
import { prefersReducedMotion, readSpring } from "./tokens"

const FEIN = "(pointer: fine)"

/** Hörer, Federn und Zustand für feine Zeiger. Gibt das vollständige Aufräumen zurück. */
function anlegen(raster: HTMLElement): () => void {
  const werte = new Map<HTMLElement, MotionValue<number>>()
  const an = new Set<HTMLElement>()
  const spalten = () =>
    [...raster.children].filter((c): c is HTMLElement => c instanceof HTMLElement && c.getBoundingClientRect().height > 0)

  const wert = (spalte: HTMLElement) => {
    let w = werte.get(spalte)
    if (!w) {
      w = motionValue(0)
      w.on("change", (v) => spalte.style.setProperty("--spalte-an", String(v)))
      werte.set(spalte, w)
    }
    return w
  }

  const setzen = (soll: Set<HTMLElement>) => {
    for (const s of spalten()) {
      const will = soll.has(s)
      if (will === an.has(s)) continue
      if (will) {
        an.add(s)
        s.setAttribute("data-hover", "")
      } else {
        an.delete(s)
        s.removeAttribute("data-hover")
      }
      animate(wert(s), will ? 1 : 0, { type: "spring", ...readSpring(will ? "--motion-feder-spalte-ein" : "--motion-feder-spalte-aus") })
    }
  }

  const auswerten = (x: number, ziel: Element | null) => {
    const liste = spalten()
    const soll = new Set<HTMLElement>()
    // Toleranz: der halbe Spaltenabstand, damit die Lücke zwischen zwei Spalten nicht „keine“ ergibt (gemessen, nicht gesetzt)
    const abstand = parseFloat(getComputedStyle(raster).columnGap) || 0
    const unter = liste.find((s) => {
      const r = s.getBoundingClientRect()
      return x >= r.left - abstand / 2 && x <= r.right + abstand / 2
    })
    if (unter) soll.add(unter)
    const objekt = ziel?.closest?.("[data-objekt]")
    if (objekt) {
      const o = objekt.getBoundingClientRect()
      for (const s of liste) {
        const r = s.getBoundingClientRect()
        if (r.right > o.left && r.left < o.right) soll.add(s)
      }
    }
    setzen(soll)
  }

  // Drossel: pro Frame wird nur die letzte Zeigerposition ausgewertet
  let letzte: { x: number; ziel: Element | null } | null = null
  let rafId = 0
  const beiBewegung = (e: PointerEvent) => {
    letzte = { x: e.clientX, ziel: e.target as Element | null }
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      if (letzte) auswerten(letzte.x, letzte.ziel)
      letzte = null
    })
  }
  const beiVerlassen = () => {
    letzte = null
    setzen(new Set())
  }

  document.addEventListener("pointermove", beiBewegung, { passive: true })
  document.documentElement.addEventListener("pointerleave", beiVerlassen)
  zaehle(2)

  return () => {
    document.removeEventListener("pointermove", beiBewegung)
    document.documentElement.removeEventListener("pointerleave", beiVerlassen)
    cancelAnimationFrame(rafId)
    zaehle(-2)
    for (const [spalte, w] of werte) {
      w.stop()
      spalte.removeAttribute("data-hover")
      spalte.style.removeProperty("--spalte-an")
    }
    werte.clear()
    an.clear()
  }
}

export function initRasterSpalte(): () => void {
  const raster = document.querySelector<HTMLElement>("[data-raster]")
  if (!raster) return () => {}
  const fein = window.matchMedia(FEIN)
  let abbau: (() => void) | null = null
  const abgleichen = () => {
    const soll = !prefersReducedMotion() && fein.matches
    if (soll && !abbau) abbau = anlegen(raster)
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
