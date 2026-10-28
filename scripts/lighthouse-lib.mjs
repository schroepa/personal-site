// Reine Teile von scripts/lighthouse.mjs (Bericht lesen, Median, Schwellen, Tabelle). Getestet in scripts/lighthouse-lib.test.mjs.

export const KATEGORIEN = ["performance", "accessibility", "best-practices", "seo"]
const KURZ = { performance: "Perf", accessibility: "A11y", "best-practices": "BP", seo: "SEO" }

/** Zahl aus einem Audit (numericValue) oder null, wenn das Audit fehlt. */
const wert = (lhr, id) => lhr.audits?.[id]?.numericValue ?? null

/** Verdichtet einen Lighthouse-Bericht (LHR) auf Scores (0-100, null = nicht bewertet), Metriken und Bytes je Ressourcentyp. */
export function zusammenfassen(lhr) {
  const scores = {}
  for (const k of KATEGORIEN) {
    const s = lhr.categories?.[k]?.score
    scores[k] = typeof s === "number" ? Math.round(s * 100) : null
  }
  const bytes = { js: 0, css: 0, font: 0, image: 0, total: 0 }
  for (const i of lhr.audits?.["network-requests"]?.details?.items ?? []) {
    const b = i.transferSize ?? 0
    bytes.total += b
    if (i.resourceType === "Script") bytes.js += b
    else if (i.resourceType === "Stylesheet") bytes.css += b
    else if (i.resourceType === "Font") bytes.font += b
    else if (i.resourceType === "Image") bytes.image += b
  }
  return {
    url: lhr.finalDisplayedUrl ?? lhr.requestedUrl,
    scores,
    lcp: wert(lhr, "largest-contentful-paint"),
    fcp: wert(lhr, "first-contentful-paint"),
    tbt: wert(lhr, "total-blocking-time"),
    cls: wert(lhr, "cumulative-layout-shift"),
    si: wert(lhr, "speed-index"),
    bytes,
  }
}

export function median(zahlen) {
  const z = zahlen.filter((x) => typeof x === "number").sort((a, b) => a - b)
  if (!z.length) return null
  const m = z.length >> 1
  return z.length % 2 ? z[m] : (z[m - 1] + z[m]) / 2
}

/** Median über mehrere Zusammenfassungen derselben Seite (Scores, Metriken, Bytes einzeln). */
export function medianVon(laeufe) {
  const feld = (f) => median(laeufe.map(f))
  return {
    url: laeufe[0]?.url,
    runs: laeufe.length,
    scores: Object.fromEntries(KATEGORIEN.map((k) => [k, feld((r) => r.scores[k])])),
    lcp: feld((r) => r.lcp),
    fcp: feld((r) => r.fcp),
    tbt: feld((r) => r.tbt),
    cls: feld((r) => r.cls),
    si: feld((r) => r.si),
    bytes: Object.fromEntries(["js", "css", "font", "image", "total"].map((k) => [k, feld((r) => r.bytes[k])])),
  }
}

/** Verstöße gegen Mindest-Scores: schwellen = { performance: 90, … }; nicht bewertete Kategorien (null) verletzen nichts. */
export function pruefeSchwellen(zeile, schwellen) {
  const verstoesse = []
  for (const [k, min] of Object.entries(schwellen)) {
    const s = zeile.scores[k]
    if (typeof s === "number" && s < min) verstoesse.push({ kategorie: k, score: s, min })
  }
  return verstoesse
}

const ms = (x) => (x == null ? "-" : `${Math.round(x)}`)
const kb = (x) => (x == null ? "-" : (x / 1024).toFixed(0))

export function tabelle(zeilen) {
  const kopf = ["Pfad", ...KATEGORIEN.map((k) => KURZ[k]), "LCP ms", "FCP ms", "TBT ms", "CLS", "SI ms", "JS kB", "CSS kB", "Font kB", "Bild kB"]
  const rows = zeilen.map((z) => [
    new URL(z.url).pathname,
    ...KATEGORIEN.map((k) => (z.scores[k] == null ? "-" : String(z.scores[k]))),
    ms(z.lcp), ms(z.fcp), ms(z.tbt), z.cls == null ? "-" : z.cls.toFixed(3), ms(z.si),
    kb(z.bytes.js), kb(z.bytes.css), kb(z.bytes.font), kb(z.bytes.image),
  ])
  const breiten = kopf.map((h, i) => Math.max(h.length, ...rows.map((r) => r[i].length)))
  const zeile = (r) => r.map((c, i) => c.padEnd(breiten[i])).join("  ")
  return [zeile(kopf), zeile(breiten.map((b) => "-".repeat(b))), ...rows.map(zeile)].join("\n")
}

/** `--min-performance 90 --min-seo 100` → { performance: 90, seo: 100 } */
export function schwellenAusArgs(argv) {
  const out = {}
  for (const k of KATEGORIEN) {
    const i = argv.indexOf(`--min-${k}`)
    if (i >= 0) out[k] = Number(argv[i + 1])
  }
  return out
}
