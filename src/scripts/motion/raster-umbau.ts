/**
 * Raster-Umbau: wechselt die Spaltenzahl (12 / 8 / 4, Breakpoints), blendet das Raster kurz aus und wieder ein
 * (--motion-raster-umbau: 350 ms, --motion-easing-blenden; Figma „Überblenden beim Wechsel von 12, 8 und 4 Spalten“,
 * Prototyp v14: Deckkraft 0 → 1). Die Spaltenzahl kommt aus --layout-columns. Nur ohne reduzierte Bewegung.
 */
import { animate } from "motion"
import { abbrechen, zaehle } from "./einmal"
import { msToSeconds } from "./parse.mjs"
import { prefersReducedMotion, readEasing, readToken } from "./tokens"

const spalten = () => parseInt(getComputedStyle(document.documentElement).getPropertyValue("--layout-columns"), 10)

export function initRasterUmbau(): () => void {
  const raster = document.querySelector<HTMLElement>("[data-raster]")
  if (!raster || prefersReducedMotion()) return () => {}
  let bisher = spalten()
  let lauf: ReturnType<typeof animate> | undefined
  let rafId = 0
  const pruefen = () => {
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      const jetzt = spalten()
      if (!Number.isFinite(jetzt) || jetzt === bisher) return
      bisher = jetzt
      abbrechen(lauf)
      lauf = animate(raster, { opacity: [0, 1] }, { duration: msToSeconds(readToken("--motion-raster-umbau")), ease: readEasing("--motion-easing-blenden") })
      const frei = () => requestAnimationFrame(() => raster.style.removeProperty("opacity"))
      lauf.then(frei, frei)
    })
  }
  window.addEventListener("resize", pruefen)
  zaehle(1)
  return () => {
    window.removeEventListener("resize", pruefen)
    cancelAnimationFrame(rafId)
    zaehle(-1)
    abbrechen(lauf)
    raster.style.removeProperty("opacity")
  }
}
