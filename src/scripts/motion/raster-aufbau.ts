/**
 * Raster beim Laden: die Spalten bauen sich von oben nach unten auf, eine nach der anderen.
 * Tokens: --motion-raster-aufbau (Dauer 1400 ms), --motion-versatz-spalte (40 ms je Spalte),
 * --motion-easing-standard. Läuft nur beim ersten Laden des Dokuments, nicht bei jedem Seitenwechsel
 * des Client-Routers (das Raster gehört zur Seite, nicht zum Inhalt) und nicht bei Zurück/Vor.
 */
import { animate, stagger } from "motion"
import { abbrechen, alle, animationErlaubt, fertig, fertigNach } from "./einmal"
import { msToSeconds } from "./parse.mjs"
import { readEasing, readToken } from "./tokens"

let schonGelaufen = false

export function initRasterAufbau(): () => void {
  const spalten = alle("[data-raster] [data-anim='spalte']")
  if (spalten.length === 0) return () => {}
  // Unsichtbare Spalten (Höhe 0, hinter --layout-columns) gehören nicht zum Aufbau
  const sichtbar = spalten.filter((s) => s.getBoundingClientRect().height > 0)
  const rest = spalten.filter((s) => !sichtbar.includes(s))
  fertig(...rest)
  const erste = !schonGelaufen
  schonGelaufen = true
  if (!erste || !animationErlaubt()) {
    fertig(...sichtbar)
    return () => {}
  }
  const dauer = msToSeconds(readToken("--motion-raster-aufbau"))
  const versatz = msToSeconds(readToken("--motion-versatz-spalte"))
  const ease = readEasing("--motion-easing-standard")
  const steuerung = animate(
    sichtbar,
    { clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"] },
    { duration: dauer, ease, delay: stagger(versatz) }
  )
  fertigNach(steuerung, ...sichtbar)
  return () => {
    abbrechen(steuerung)
    fertig(...sichtbar)
  }
}
