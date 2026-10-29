/**
 * Welches Element „belegt“ eine Fläche im Raster, wenn der Zeiger darüber steht? Zuerst das nächste [data-objekt]
 * (Karten, Kopf, Galerie, Prosa …); sonst der nächste Inhaltsblock im <main> (Überschrift, Absatz, Liste, Bild,
 * Zitat), damit überall die belegten Spalten markiert werden, nicht nur an ausgezeichneten Objekten.
 */
const BLOCK = "main h1, main h2, main h3, main p, main ul, main ol, main figure, main blockquote"

export function findeObjekt(ziel: Element | null): HTMLElement | null {
  const el = ziel?.closest?.("[data-objekt]") ?? ziel?.closest?.(BLOCK) ?? null
  return el instanceof HTMLElement ? el : null
}
