import { test } from "node:test"
import assert from "node:assert/strict"
import { filterByTag } from "./filter.ts"

const eintraege = [
  { id: "a", tags: ["Design", "CSS"] },
  { id: "b", tags: ["Tooling"] },
  { id: "c" },
  { id: "d", tags: ["CSS"] },
]

test("filterByTag: null liefert alle, in unveränderter Reihenfolge", () => {
  assert.deepEqual(filterByTag(eintraege, null), eintraege)
})

test("filterByTag: liefert nur Einträge mit dem Tag, Reihenfolge bleibt", () => {
  assert.deepEqual(filterByTag(eintraege, "CSS").map((e) => e.id), ["a", "d"])
})

test("filterByTag: unbekannter Tag liefert []", () => {
  assert.deepEqual(filterByTag(eintraege, "Gibt es nicht"), [])
})

test("filterByTag: Einträge ohne tags werden nie getroffen, aber bei null behalten", () => {
  assert.deepEqual(filterByTag(eintraege, "Design").map((e) => e.id), ["a"])
  assert.equal(filterByTag(eintraege, null).length, 4)
})

test("filterByTag: Tag-Vergleich ist exakt (Groß-/Kleinschreibung, kein Teilstring)", () => {
  assert.deepEqual(filterByTag(eintraege, "css"), [])
  assert.deepEqual(filterByTag(eintraege, "Des"), [])
})

test("filterByTag: Eingabe bleibt unverändert, Ergebnis ist eine neue Liste", () => {
  const kopie = JSON.stringify(eintraege)
  const alle = filterByTag(eintraege, null)
  assert.notEqual(alle, eintraege)
  filterByTag(eintraege, "CSS")
  assert.equal(JSON.stringify(eintraege), kopie)
})

test("filterStatus: leer ohne Filter, Hinweis bei 0, sonst Anzahl (Einzahl/Mehrzahl)", async () => {
  const { filterStatus } = await import("./filter.ts")
  assert.equal(filterStatus(15, false), "")
  assert.equal(filterStatus(0, true), "Keine Beiträge zu diesem Thema.")
  assert.equal(filterStatus(1, true), "1 Beitrag")
  assert.equal(filterStatus(6, true), "6 Beiträge")
})

test("filterStatus: Wortwahl für andere Einträge (Projekte)", async () => {
  const { filterStatus } = await import("./filter.ts")
  const projekte = { ein: "Projekt", mehr: "Projekte" }
  assert.equal(filterStatus(0, true, projekte), "Keine Projekte zu diesem Thema.")
  assert.equal(filterStatus(1, true, projekte), "1 Projekt")
  assert.equal(filterStatus(3, true, projekte), "3 Projekte")
  assert.equal(filterStatus(3, false, projekte), "")
  assert.equal(filterStatus(0, true), "Keine Beiträge zu diesem Thema.")
})
