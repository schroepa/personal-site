/**
 * Kopf-Skript (vor dem ersten Paint): gespeichertes oder System-Theme setzen (kein Hell-Blitz), data-js setzen
 * (kein offenes Menü beim Laden) und das Bewegungs-Gate data-motion öffnen (nur mit JS und ohne reduzierte Bewegung;
 * Watchdog siehe motion/gate.ts).
 *
 * Früher ein Inline-Skript im <head>; jetzt eine eigene Datei unter /js/kopf.js (Endpunkt src/pages/js/kopf.js.ts),
 * damit die CSP ohne 'unsafe-inline', Hash oder Nonce für Skripte auskommt. SiteLayout bindet sie als klassisches,
 * blockierendes <script src> ein: sie läuft damit weiterhin vor dem ersten Paint.
 * Die Funktionen werden per Function.toString serialisiert und sind dafür in sich geschlossen.
 */
import { applyStoredTheme } from "./theme.ts"
import { gateAn, MOTION_WATCHDOG_MS } from "./motion/gate.ts"

export const KOPF_SKRIPT_PFAD = "/js/kopf.js"

export function kopfSkript(): string {
  return `(${applyStoredTheme.toString()})();document.documentElement.setAttribute("data-js","");(${gateAn.toString()})(${MOTION_WATCHDOG_MS});\n`
}
