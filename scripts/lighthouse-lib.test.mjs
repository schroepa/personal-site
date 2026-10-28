import { test } from "node:test"
import assert from "node:assert/strict"
import { median, medianVon, pruefeSchwellen, schwellenAusArgs, tabelle, zusammenfassen } from "./lighthouse-lib.mjs"

const lhr = (perf, lcp) => ({
  finalDisplayedUrl: "http://x.test/blog",
  categories: { performance: { score: perf }, accessibility: { score: 1 }, "best-practices": { score: 0.96 }, seo: { score: null } },
  audits: {
    "largest-contentful-paint": { numericValue: lcp },
    "cumulative-layout-shift": { numericValue: 0.01 },
    "total-blocking-time": { numericValue: 40 },
    "network-requests": {
      details: { items: [
        { resourceType: "Script", transferSize: 2048 },
        { resourceType: "Font", transferSize: 1024 },
        { resourceType: "Document", transferSize: 1024 },
      ] },
    },
  },
})

test("zusammenfassen: Scores 0-100, null bleibt null, Bytes je Typ", () => {
  const z = zusammenfassen(lhr(0.874, 1500))
  assert.deepEqual(z.scores, { performance: 87, accessibility: 100, "best-practices": 96, seo: null })
  assert.equal(z.lcp, 1500)
  assert.deepEqual(z.bytes, { js: 2048, css: 0, font: 1024, image: 0, total: 4096 })
  assert.equal(z.fcp, null)
})

test("median: ungerade, gerade, leer, ignoriert null", () => {
  assert.equal(median([3, 1, 2]), 2)
  assert.equal(median([4, 1, 2, 3]), 2.5)
  assert.equal(median([]), null)
  assert.equal(median([null, 5]), 5)
})

test("medianVon: je Feld einzeln", () => {
  const m = medianVon([zusammenfassen(lhr(0.8, 1000)), zusammenfassen(lhr(0.9, 3000)), zusammenfassen(lhr(0.7, 2000))])
  assert.equal(m.runs, 3)
  assert.equal(m.scores.performance, 80)
  assert.equal(m.lcp, 2000)
})

test("pruefeSchwellen: meldet nur echte Unterschreitungen, null verletzt nichts", () => {
  const z = zusammenfassen(lhr(0.8, 1))
  assert.deepEqual(pruefeSchwellen(z, { performance: 90, seo: 100, accessibility: 100 }), [{ kategorie: "performance", score: 80, min: 90 }])
  assert.deepEqual(pruefeSchwellen(z, {}), [])
})

test("schwellenAusArgs und tabelle", () => {
  assert.deepEqual(schwellenAusArgs(["--min-performance", "90", "--min-seo", "100", "--x"]), { performance: 90, seo: 100 })
  const t = tabelle([zusammenfassen(lhr(1, 900))])
  assert.match(t, /\/blog\s+100\s+100\s+96\s+-/)
})
