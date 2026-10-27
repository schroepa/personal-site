// Auswahl der Inhalte für die Startseite: reine Funktionen, ohne Astro-Abhängigkeit (node:test).
// Sortierung: Datum absteigend; bei gleichem Datum entscheidet die Kennung absteigend (deterministisch).

interface MitDatum {
  id: string
  data: { date: Date }
}

function neuesteZuerst<T extends MitDatum>(liste: readonly T[]): T[] {
  return [...liste].sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime() || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)
  )
}

/** Höchstens `anzahl` Projekte mit `featured`, jüngste zuerst. */
export function waehleProjekte<T extends MitDatum & { data: { featured: boolean } }>(
  projekte: readonly T[],
  anzahl: number
): T[] {
  return neuesteZuerst(projekte.filter((p) => p.data.featured)).slice(0, Math.max(0, anzahl))
}

/** Die drei jüngsten veröffentlichten Beiträge: der erste groß, die übrigen klein. Weniger Beiträge sind kein Fehler. */
export function waehleGedanken<T extends MitDatum & { data: { draft: boolean } }>(
  beitraege: readonly T[]
): { gross: T | undefined; klein: T[] } {
  const [gross, ...klein] = neuesteZuerst(beitraege.filter((b) => !b.data.draft)).slice(0, 3)
  return { gross, klein }
}

/** Wirkungszeile der Karte: erster Satz der Beschreibung (bis das Schema ein eigenes Feld hat, Task 8). */
export function wirkungAusBeschreibung(beschreibung: string): string {
  const text = beschreibung.trim()
  const m = text.match(/^.*?[.!?](?=\s|$)/s)
  return m ? m[0] : text
}

/** „Tool · 2026“: erstes Schlagwort und Jahr. */
export function projektMeta(tags: readonly string[], datum: Date): string {
  const jahr = String(datum.getUTCFullYear())
  return tags.length ? `${tags[0]} · ${jahr}` : jahr
}

const datumFormat = new Intl.DateTimeFormat("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })

/** „Tech · 11 Min. · 13. Juli 2026“ */
export function artikelMeta(tags: readonly string[] | undefined, minuten: number, datum: Date): string {
  return [tags?.[0], `${minuten} Min.`, datumFormat.format(datum)].filter(Boolean).join(" · ")
}

/** Kurzer Kartentitel: Teil vor Geviert- oder Halbgeviertstrich („ProMan — Local-First …“ wird „ProMan“). */
export function kurzTitel(titel: string): string {
  const teil = titel.split(/\s[—–]\s/)[0].trim()
  return teil || titel
}
