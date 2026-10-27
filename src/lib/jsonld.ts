/**
 * JSON für <script type="application/ld+json"> (und application/json) mit set:html.
 * JSON.stringify maskiert `<` nicht: ein Wert mit `</script>` würde das Skript schließen.
 * Darum werden <, >, & sowie U+2028/U+2029 als \uXXXX geschrieben; JSON.parse liefert dasselbe Objekt.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (z) => `\\u${z.charCodeAt(0).toString(16).padStart(4, "0")}`)
}
