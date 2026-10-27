import { test } from "node:test"
import assert from "node:assert/strict"
import { cvData } from "../data/cv.ts"
import { CV_ABSCHNITTE, cvEintraege, sprachStufe } from "./cv.ts"

test("sprachStufe: Text und Lesetext für Level 1 bis 5", () => {
  assert.deepEqual(sprachStufe(5), { sichtbar: "Muttersprache", lesetext: "Level 5 von 5" })
  assert.deepEqual(sprachStufe(4), { sichtbar: "C1", lesetext: "Level 4 von 5" })
  // Ohne Bezeichnung aus dem Entwurf steht die Stufe als Text sichtbar da, nicht doppelt als Lesetext
  assert.deepEqual(sprachStufe(2), { sichtbar: "Level 2 von 5", lesetext: undefined })
})

test("sprachStufe: lehnt Werte außerhalb von 1 bis 5 und Nicht-Ganzzahlen ab", () => {
  for (const x of [0, 6, -1, 2.5, Number.NaN]) assert.throws(() => sprachStufe(x), RangeError, String(x))
})

test("CV_ABSCHNITTE: Reihenfolge wie im Entwurf", () => {
  assert.deepEqual(
    CV_ABSCHNITTE.map((a) => a.label),
    ["Profil", "Erfahrung", "Projekte", "Kompetenzen", "Tech Stack", "Ausbildung", "Sprachen"]
  )
  assert.equal(new Set(CV_ABSCHNITTE.map((a) => a.id)).size, CV_ABSCHNITTE.length)
})

test("cvEintraege: je Eintrag der Daten genau ein Listeneintrag, Texte aus cv.ts", () => {
  const e = cvEintraege(cvData)
  assert.equal(e.erfahrung.length, cvData.experience.length)
  assert.equal(e.projekte.length, cvData.projects.length)
  assert.equal(e.kompetenzen.length, cvData.coreCompetencies.length)
  assert.equal(e.techStack.length, cvData.techStack.length)
  assert.equal(e.ausbildung.length, cvData.education.length)
  assert.equal(e.sprachen.length, cvData.languages.length)

  const x = cvData.experience[0]
  assert.deepEqual(e.erfahrung[0], {
    nummer: x.period,
    titel: x.role,
    zusatz: `${x.company}, ${x.location}`,
    punkte: x.achievements,
  })
  const p = cvData.projects[1]
  assert.deepEqual(e.projekte[1], { nummer: `${p.number} · ${p.category}`, titel: p.title, beschreibung: p.description })
  assert.deepEqual(e.techStack[0], { nummer: cvData.techStack[0].category, titel: cvData.techStack[0].items.join(", ") })
  assert.deepEqual(e.sprachen[1], { nummer: "Englisch", titel: "C1", lesetext: "Level 4 von 5" })
  assert.deepEqual(e.kompetenzen.map((k) => k.nummer), ["01", "02", "03", "04"])
})
