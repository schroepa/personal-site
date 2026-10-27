import { test } from "node:test"
import assert from "node:assert/strict"
import { KONTAKT_EMAIL, LINKEDIN_URL, LINKEDIN_ANZEIGE, KONTAKT_SEITE, WOFUER, ABLAUF, DATEN } from "../src/data/kontakt.ts"
import { UEBER_MICH, HALTUNG, KOMPETENZEN, STATIONEN, WERKZEUGE } from "../src/data/ueber-mich.ts"

const gueltigeListe = (liste, { nummer = false, beschreibung = false } = {}) => {
  assert.ok(Array.isArray(liste) && liste.length > 0)
  for (const e of liste) {
    assert.equal(typeof e.titel, "string")
    assert.ok(e.titel.trim().length > 0)
    if (nummer) assert.ok(typeof e.nummer === "string" && e.nummer.length > 0)
    if (beschreibung) assert.ok(typeof e.beschreibung === "string" && e.beschreibung.length > 0)
    for (const k of Object.keys(e)) assert.ok(["nummer", "titel", "beschreibung"].includes(k), `unbekanntes Feld ${k}`)
  }
}

test("kontakt.ts: E-Mail, LinkedIn und Seitentexte haben die erwartete Form", () => {
  assert.match(KONTAKT_EMAIL, /^[^@\s]+@[^@\s]+\.[a-z]+$/)
  assert.match(LINKEDIN_URL, /^https:\/\/www\.linkedin\.com\/in\//)
  assert.ok(LINKEDIN_ANZEIGE.startsWith("linkedin.com/in/"))
  for (const k of ["label", "titel", "einleitung"]) assert.ok(KONTAKT_SEITE[k].length > 0)
  assert.equal(DATEN.email, KONTAKT_EMAIL)
  assert.equal(DATEN.linkedin.url, LINKEDIN_URL)
})

test("kontakt.ts: Wofür und Ablauf sind vollständige Listen, Ablauf ist 01…n nummeriert", () => {
  gueltigeListe(WOFUER, { nummer: true, beschreibung: true })
  gueltigeListe(ABLAUF, { nummer: true, beschreibung: true })
  assert.deepEqual(ABLAUF.map((e) => e.nummer), ABLAUF.map((_, i) => String(i + 1).padStart(2, "0")))
})

test("ueber-mich.ts: Haltung, Kompetenzen, Stationen, Werkzeuge haben die erwartete Form", () => {
  assert.ok(HALTUNG.length >= 1 && HALTUNG.every((a) => typeof a === "string" && a.length > 0))
  gueltigeListe(KOMPETENZEN, { nummer: true, beschreibung: true })
  gueltigeListe(STATIONEN, { nummer: true, beschreibung: true })
  gueltigeListe(WERKZEUGE, { nummer: true })
  assert.deepEqual(KOMPETENZEN.map((e) => e.nummer), KOMPETENZEN.map((_, i) => String(i + 1).padStart(2, "0")))
  for (const k of ["label", "titel", "einleitung"]) assert.ok(UEBER_MICH[k].length > 0)
})
