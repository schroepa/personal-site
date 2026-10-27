import { test } from "node:test"
import assert from "node:assert/strict"
import { gruppiereNachJahr, themenListe, weiterlesen, zeilenMeta, veroeffentlichte, ueberschriftenFuerInhalt } from "./blog.ts"

const b = (id: string, date: string, tags: string[] = [], draft = false) => ({ id, data: { date: new Date(date), tags, draft } })

test("veroeffentlichte: ohne Entwürfe, jüngste zuerst, Gleichstand nach Kennung absteigend", () => {
  const liste = [b("a", "2024-01-01"), b("x", "2026-01-01", [], true), b("c", "2026-07-09"), b("d", "2026-07-09")]
  assert.deepEqual(veroeffentlichte(liste).map((e) => e.id), ["d", "c", "a"])
  assert.equal(liste.length, 4)
})

test("gruppiereNachJahr: Jahre absteigend, Reihenfolge innerhalb bleibt", () => {
  const liste = [b("a", "2026-07-13"), b("b", "2026-05-07"), b("c", "2024-11-12"), b("d", "2024-09-03")]
  const g = gruppiereNachJahr(liste)
  assert.deepEqual(g.map((x) => x.jahr), [2026, 2024])
  assert.deepEqual(g[0].eintraege.map((e) => e.id), ["a", "b"])
  assert.deepEqual(g[1].eintraege.map((e) => e.id), ["c", "d"])
})

test("gruppiereNachJahr: Jahreswechsel in UTC (31.12./1.1.) und leere Liste", () => {
  assert.deepEqual(gruppiereNachJahr([b("a", "2025-01-01T00:00:00Z"), b("b", "2024-12-31T23:59:59Z")]).map((x) => x.jahr), [2025, 2024])
  assert.deepEqual(gruppiereNachJahr([]), [])
})

test("themenListe: eindeutige Tags, häufigste zuerst, dann alphabetisch", () => {
  const liste = [b("a", "2026-01-01", ["Zeta", "Design"]), b("b", "2026-01-02", ["Design", "Alpha"]), b("c", "2026-01-03")]
  assert.deepEqual(themenListe(liste), ["Design", "Alpha", "Zeta"])
  assert.deepEqual(themenListe([]), [])
})

test("weiterlesen: nie der aktuelle Beitrag, höchstens zwei, jüngste zuerst", () => {
  const sortiert = [b("a", "2026-07-13"), b("b", "2026-07-09"), b("c", "2026-07-08"), b("d", "2026-07-07")]
  assert.deepEqual(weiterlesen(sortiert, "a").map((e) => e.id), ["b", "c"])
  assert.deepEqual(weiterlesen(sortiert, "c").map((e) => e.id), ["a", "b"])
})

test("weiterlesen: weniger als zwei andere Beiträge zeigt, was es gibt; keiner liefert []", () => {
  assert.deepEqual(weiterlesen([b("a", "2026-07-13"), b("b", "2026-07-09")], "a").map((e) => e.id), ["b"])
  assert.deepEqual(weiterlesen([b("a", "2026-07-13")], "a"), [])
  assert.deepEqual(weiterlesen([], "a"), [])
})

test("zeilenMeta: erstes Schlagwort und Datum, ohne Schlagwort nur das Datum", () => {
  assert.equal(zeilenMeta(["Tech", "Tooling"], new Date("2026-07-13")), "Tech · 13. Juli 2026")
  assert.equal(zeilenMeta(undefined, new Date("2026-07-13")), "13. Juli 2026")
  assert.equal(zeilenMeta([], new Date("2026-07-13")), "13. Juli 2026")
})

test("ueberschriftenFuerInhalt: nur h2, mit Anker und Text", () => {
  const h = [
    { depth: 1, slug: "t", text: "Titel" },
    { depth: 2, slug: "eins", text: "Eins" },
    { depth: 3, slug: "unter", text: "Unter" },
    { depth: 2, slug: "zwei", text: "Zwei" },
  ]
  assert.deepEqual(ueberschriftenFuerInhalt(h), [
    { id: "eins", text: "Eins" },
    { id: "zwei", text: "Zwei" },
  ])
})

test("slugVon: entfernt nur die Endung .md am Ende", async () => {
  const { slugVon } = await import("./blog.ts")
  assert.equal(slugVon("mein-beitrag.md"), "mein-beitrag")
  assert.equal(slugVon("a.md.md"), "a.md")
  assert.equal(slugVon("ohne-endung"), "ohne-endung")
})
