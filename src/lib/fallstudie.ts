// Gliederung einer Fallstudie: reine Funktionen ohne Astro-Abhängigkeit (node:test).

/** Pflichtabschnitte der Fallstudie als Markdown-h2, in Figma-Reihenfolge (Figma 267:22189). */
export const FALLSTUDIE_ABSCHNITTE = ["Ausgangslage", "Ansatz", "Einblicke", "Entscheidungen", "Ergebnis"] as const

/**
 * Prüft die h2-Überschriften einer Fallstudie (nur für Projekte mit `fakten`).
 * Regel: Die ersten fünf Überschriften sind genau die Pflichtabschnitte in dieser Reihenfolge, ohne Einschub.
 * Weitere Überschriften sind nur nach „Ergebnis“ erlaubt (ein Anhang), nie dazwischen.
 */
export function assertFallstudie(headings: readonly string[]): void {
  const erwartet = FALLSTUDIE_ABSCHNITTE
  const fehlend = erwartet.filter((h) => !headings.includes(h))
  if (fehlend.length > 0) {
    throw new Error(
      `Fallstudie: Pflichtabschnitt(e) fehlen: ${fehlend.join(", ")}. Erwartet als h2 in dieser Reihenfolge: ${erwartet.join(", ")}.`
    )
  }
  erwartet.forEach((soll, i) => {
    if (headings[i] !== soll) {
      throw new Error(
        `Fallstudie: Reihenfolge falsch an Stelle ${i + 1}: erwartet „${soll}“, gefunden „${headings[i]}“. ` +
          `Erwartet: ${erwartet.join(", ")} (weitere Überschriften nur nach Ergebnis).`
      )
    }
  })
}

export interface Abschnitt {
  titel: string
  markdown: string
}

/** Teilt Markdown an `## `-Überschriften (Codeblöcke ausgenommen): Text davor und je ein Abschnitt mit Titel. */
export function teileAbschnitte(markdown: string): { einleitung: string; abschnitte: Abschnitt[] } {
  const einleitung: string[] = []
  const abschnitte: { titel: string; zeilen: string[] }[] = []
  let imCode = false
  for (const zeile of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(zeile)) imCode = !imCode
    const h2 = !imCode && zeile.match(/^##\s+(.+?)\s*#*\s*$/)
    if (h2) abschnitte.push({ titel: h2[1], zeilen: [] })
    else (abschnitte.at(-1)?.zeilen ?? einleitung).push(zeile)
  }
  return {
    einleitung: einleitung.join("\n"),
    abschnitte: abschnitte.map((a) => ({ titel: a.titel, markdown: a.zeilen.join("\n") })),
  }
}

const entitaeten = (t: string) =>
  t.replace(/&(amp|lt|gt|quot|#39);/g, (_, n: string) => ({ amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'" })[n]!)

/**
 * Löst ein Bild am Anfang des gerenderten HTML heraus (Abschnitt Einblicke: Bild links, Text rechts).
 * Der Markdown-Titel des Bildes (`![alt](src "Meta")`) ist die Meta-Zeile über der Überschrift. Ohne führendes Bild bleibt alles im Rest.
 */
export function trenneBild(html: string): { bild: { src: string; alt: string; meta: string } | null; rest: string } {
  const m = html.match(/^\s*<p>\s*<img\s([^>]*?)\/?>\s*<\/p>/)
  if (!m) return { bild: null, rest: html }
  const attr = (n: string) => entitaeten(m[1].match(new RegExp(`(?:^|\\s)${n}="([^"]*)"`))?.[1] ?? "")
  const src = attr("src")
  if (!src) return { bild: null, rest: html }
  return { bild: { src, alt: attr("alt"), meta: attr("title") }, rest: html.slice(m[0].length) }
}
