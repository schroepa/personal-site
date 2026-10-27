/**
 * Lichtband (Startseite, Einstieg): startet den Shader für jedes canvas[data-lichtband]. Die eigentliche Arbeit
 * steht in src/scripts/lichtband.ts. Läuft im MODULES-Register und erbt damit Einzelabsicherung und Notausstieg.
 */
import { initLichtband } from "../lichtband"
import { alle } from "./einmal"

export function initLichtbandModul(): () => void {
  const abmelden = alle<HTMLCanvasElement>("canvas[data-lichtband]").map((c) => initLichtband(c))
  return () => abmelden.forEach((fn) => fn())
}
