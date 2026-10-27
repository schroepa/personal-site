/**
 * Token-Leser: Bewegungswerte kommen ausschließlich aus den Figma-Tokens in tokens.css
 * (per getComputedStyle), nie als Zahl im Code. Unter prefers-reduced-motion liefern die Dauer-Tokens 0.
 */
import { msToSeconds, parseToken } from "./parse.mjs"

/** Liest eine Custom Property als Zahl (Zeiten in ms). Fehlt sie, wirft der Aufruf mit dem Namen des Tokens. */
export function readToken(name: string, el?: Element): number {
  const raw = getComputedStyle(el ?? document.documentElement).getPropertyValue(name)
  try {
    return parseToken(raw)
  } catch (fehler) {
    throw new Error(`Token ${name}: ${(fehler as Error).message}`)
  }
}

/** Feder aus `<prefix>-dauer` (ms, wird zu Sekunden) und `<prefix>-federung`. */
export function readSpring(prefix: string): { visualDuration: number; bounce: number } {
  return {
    visualDuration: msToSeconds(readToken(`${prefix}-dauer`)),
    bounce: readToken(`${prefix}-federung`),
  }
}

/** Physik-Feder aus `<prefix>-steifigkeit`, `-daempfung` und `-masse`. */
export function readPhysics(prefix: string): { stiffness: number; damping: number; mass: number } {
  return {
    stiffness: readToken(`${prefix}-steifigkeit`),
    damping: readToken(`${prefix}-daempfung`),
    mass: readToken(`${prefix}-masse`),
  }
}

export const REDUZIERT_QUERY = "(prefers-reduced-motion: reduce)"

export function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUZIERT_QUERY).matches
}
