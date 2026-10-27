import { test } from "node:test"
import assert from "node:assert/strict"
import { ausgewaehlte, haeufigeThemen, naechstesProjekt, weitereProjekte } from "./projekte.ts"

const p = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id: `${id}.md`,
  data: { date: new Date(date), featured: true, weitere: false, tags: [] as string[], ...extra },
})

test("naechstesProjekt: das nächstjüngere Projekt, am Ende zyklisch das älteste", () => {
  const liste = [p("b", "2025-01-01"), p("c", "2026-01-01"), p("a", "2024-01-01")]
  assert.equal(naechstesProjekt(liste, "a")?.id, "b.md")
  assert.equal(naechstesProjekt(liste, "b")?.id, "c.md")
  assert.equal(naechstesProjekt(liste, "c")?.id, "a.md")
})

test("naechstesProjekt: nie das Projekt selbst, bei nur einem Projekt null", () => {
  assert.equal(naechstesProjekt([p("a", "2024-01-01")], "a"), null)
  assert.equal(naechstesProjekt([], "a"), null)
  const zwei = [p("a", "2024-01-01"), p("b", "2025-01-01")]
  assert.equal(naechstesProjekt(zwei, "a")?.id, "b.md")
  assert.equal(naechstesProjekt(zwei, "b")?.id, "a.md")
})

test("naechstesProjekt: unbekannter Slug liefert null, Eingabe bleibt unverändert", () => {
  const liste = [p("b", "2025-01-01"), p("a", "2024-01-01")]
  assert.equal(naechstesProjekt(liste, "x"), null)
  naechstesProjekt(liste, "a")
  assert.deepEqual(liste.map((x) => x.id), ["b.md", "a.md"])
})

test("naechstesProjekt: gleiches Datum entscheidet die Kennung, jedes Projekt wird genau einmal besucht", () => {
  const liste = [p("x", "2026-07-30"), p("y", "2026-07-30"), p("z", "2026-07-30")]
  const besucht: string[] = []
  let aktuell = "x"
  for (let i = 0; i < liste.length; i++) {
    besucht.push(aktuell)
    aktuell = naechstesProjekt(liste, aktuell)!.id.replace(/\.md$/, "")
  }
  assert.equal(new Set(besucht).size, 3)
  assert.equal(aktuell, "x")
})

test("ausgewaehlte: featured ohne weitere, jüngste zuerst, begrenzt", () => {
  const liste = [
    p("a", "2024-01-01"),
    p("b", "2026-01-01"),
    p("c", "2025-06-01", { weitere: true }),
    p("d", "2025-01-01", { featured: false }),
    p("e", "2025-06-01"),
  ]
  assert.deepEqual(ausgewaehlte(liste, 2).map((x) => x.id), ["b.md", "e.md"])
  assert.deepEqual(ausgewaehlte(liste, 9).map((x) => x.id), ["b.md", "e.md", "a.md"])
})

test("weitereProjekte: alles, was nicht in Ausgewählt steht, jüngste zuerst", () => {
  const liste = [
    p("a", "2024-01-01"),
    p("b", "2026-01-01"),
    p("c", "2025-06-01", { weitere: true }),
    p("d", "2025-01-01", { featured: false }),
  ]
  assert.deepEqual(weitereProjekte(liste, 1).map((x) => x.id), ["c.md", "d.md", "a.md"])
  assert.deepEqual(weitereProjekte(liste, 9).map((x) => x.id), ["c.md", "d.md"])
})

test("haeufigeThemen: nur Schlagwörter ab Mindestanzahl, häufigste zuerst, dann alphabetisch", () => {
  const liste = [p("a", "2024-01-01", { tags: ["B", "A", "Z"] }), p("b", "2024-01-02", { tags: ["B", "A"] }), p("c", "2024-01-03", { tags: ["B", "Y"] })]
  assert.deepEqual(haeufigeThemen(liste, 2), ["B", "A"])
  assert.deepEqual(haeufigeThemen(liste, 1), ["B", "A", "Y", "Z"])
  assert.deepEqual(haeufigeThemen([], 2), [])
})
