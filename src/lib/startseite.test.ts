import { test } from "node:test"
import assert from "node:assert/strict"
import { waehleProjekte, waehleGedanken, wirkungAusBeschreibung, projektMeta, artikelMeta, kurzTitel } from "./startseite.ts"

const projekt = (id: string, date: string, featured = true) => ({ id, data: { featured, date: new Date(date) } })
const beitrag = (id: string, date: string, draft = false) => ({ id, data: { draft, date: new Date(date) } })

test("waehleProjekte: nur featured, nach Datum absteigend, begrenzt", () => {
  const liste = [
    projekt("a", "2024-01-01"),
    projekt("b", "2026-01-01"),
    projekt("c", "2025-01-01", false),
    projekt("d", "2025-06-01"),
  ]
  assert.deepEqual(
    waehleProjekte(liste, 2).map((p) => p.id),
    ["b", "d"]
  )
  assert.deepEqual(
    waehleProjekte(liste, 10).map((p) => p.id),
    ["b", "d", "a"]
  )
})

test("waehleProjekte: gleiches Datum entscheidet die Kennung absteigend; Eingabe bleibt unverändert", () => {
  const liste = [projekt("alterli", "2026-07-30"), projekt("fusca", "2026-07-30")]
  assert.deepEqual(
    waehleProjekte(liste, 2).map((p) => p.id),
    ["fusca", "alterli"]
  )
  assert.deepEqual(liste.map((p) => p.id), ["alterli", "fusca"])
})

test("waehleProjekte: leere Liste, keine featured, Anzahl 0 oder negativ", () => {
  assert.deepEqual(waehleProjekte([], 4), [])
  assert.deepEqual(waehleProjekte([projekt("a", "2024-01-01", false)], 4), [])
  assert.deepEqual(waehleProjekte([projekt("a", "2024-01-01")], 0), [])
  assert.deepEqual(waehleProjekte([projekt("a", "2024-01-01")], -1), [])
})

test("waehleGedanken: 1 groß + 2 klein, jüngste zuerst, Entwürfe fehlen", () => {
  const liste = [
    beitrag("alt", "2024-01-01"),
    beitrag("entwurf", "2026-12-01", true),
    beitrag("neu", "2026-07-13"),
    beitrag("mitte", "2025-05-05"),
    beitrag("neu-b", "2026-07-13"),
  ]
  const g = waehleGedanken(liste)
  assert.equal(g.gross?.id, "neu-b")
  assert.deepEqual(g.klein.map((b) => b.id), ["neu", "mitte"])
})

test("waehleGedanken: leer und einzelner Beitrag", () => {
  assert.deepEqual(waehleGedanken([]), { gross: undefined, klein: [] })
  assert.deepEqual(waehleGedanken([beitrag("x", "2026-01-01", true)]), { gross: undefined, klein: [] })
  const eins = waehleGedanken([beitrag("x", "2026-01-01")])
  assert.equal(eins.gross?.id, "x")
  assert.deepEqual(eins.klein, [])
  const zwei = waehleGedanken([beitrag("x", "2026-01-01"), beitrag("y", "2025-01-01")])
  assert.equal(zwei.klein.length, 1)
})

test("wirkungAusBeschreibung: erster Satz", () => {
  assert.equal(wirkungAusBeschreibung("Eins. Zwei folgt."), "Eins.")
  assert.equal(wirkungAusBeschreibung("Ohne Punkt am Ende"), "Ohne Punkt am Ende")
  assert.equal(wirkungAusBeschreibung("  Frage? Antwort."), "Frage?")
  assert.equal(wirkungAusBeschreibung(""), "")
})

test("projektMeta und artikelMeta", () => {
  assert.equal(projektMeta(["Tool", "Astro"], new Date("2026-09-24")), "Tool · 2026")
  assert.equal(projektMeta([], new Date("2026-09-24")), "2026")
  assert.equal(artikelMeta(["Tech"], 11, new Date("2026-07-13T12:00:00Z")), "Tech · 11 Min. · 13. Juli 2026")
  assert.equal(artikelMeta(undefined, 3, new Date("2026-07-09T12:00:00Z")), "3 Min. · 9. Juli 2026")
})

test("kurzTitel: Teil vor dem Geviertstrich", () => {
  assert.equal(kurzTitel("ProMan — Local-First Projektmanagement"), "ProMan")
  assert.equal(kurzTitel("Forma Design System"), "Forma Design System")
  assert.equal(kurzTitel("Digital Art – Lettering, Graffiti"), "Digital Art – Lettering, Graffiti")
})
