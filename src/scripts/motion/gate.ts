/**
 * Bewegungs-Gate: html[data-motion] schaltet die Startzustände der Animationen frei (bewegung.css).
 * Das Attribut setzt ein Inline-Skript im Kopf (SiteLayout), und zwar nur, wenn JavaScript läuft und
 * keine reduzierte Bewegung gewünscht ist. Ohne JS und bei reduzierter Bewegung gibt es das Attribut nie,
 * dann steht jeder Inhalt sofort im Endzustand.
 *
 * Ausfallsicherung (Watchdog): Läuft das Bündel nicht an (blockiert, Netzfehler, Fehler im Modul), bliebe
 * sonst Inhalt mit Startzustand unsichtbar. Das Inline-Skript entfernt data-motion deshalb nach
 * MOTION_WATCHDOG_MS wieder; initMotion() bricht den Timer ab, sobald das Bündel läuft.
 */

/**
 * Wartezeit des Watchdogs in Millisekunden. Verhaltenswert, kein Gestaltungswert: lang genug für ein
 * langsames Netz (das Bündel ist klein und kommt vom eigenen Host), kurz genug, dass ein Besucher bei
 * einem Ausfall nicht lange auf eine leere Seite schaut.
 */
export const MOTION_WATCHDOG_MS = 4000

declare global {
  interface Window {
    /** ID des Watchdog-Timers (vom Inline-Skript gesetzt) */
    __motionWacht?: number
  }
}

/**
 * Wird als Inline-Skript serialisiert (Function.toString) und vor dem ersten Paint ausgeführt.
 * Deshalb eigenständig: kein Zugriff auf Modulvariablen, die Wartezeit kommt als Argument.
 */
export function gateAn(wartezeit: number): void {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return
  const wurzel = document.documentElement
  wurzel.setAttribute("data-motion", "")
  window.__motionWacht = window.setTimeout(() => wurzel.removeAttribute("data-motion"), wartezeit)
}

/** Watchdog neu scharf schalten (nach einem Seitenwechsel des Client-Routers; das Gate wird dort übernommen). */
export function wachtStarten(): void {
  wachtStoppen()
  window.__motionWacht = window.setTimeout(
    () => document.documentElement.removeAttribute("data-motion"),
    MOTION_WATCHDOG_MS
  )
}

/** Watchdog abbrechen: das Bündel läuft. */
export function wachtStoppen(): void {
  if (window.__motionWacht !== undefined) clearTimeout(window.__motionWacht)
  window.__motionWacht = undefined
}

/** Gate öffnen: alle Startzustände entfallen (Notausstieg, wenn ein Modul scheitert). */
export function gateAus(): void {
  document.documentElement.removeAttribute("data-motion")
}
