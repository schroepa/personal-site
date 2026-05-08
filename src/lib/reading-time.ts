/**
 * Berechnet die Lesezeit in Minuten.
 * Basis: 200 Wörter/Minute, mindestens 1 Minute.
 */
export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}
