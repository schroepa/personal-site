import { test } from "node:test"
import assert from "node:assert/strict"
import { assertFallstudie, FALLSTUDIE_ABSCHNITTE, teileAbschnitte, trenneBild, abschnittIds } from "./fallstudie.ts"

const voll = ["Ausgangslage", "Ansatz", "Einblicke", "Entscheidungen", "Ergebnis"]

test("FALLSTUDIE_ABSCHNITTE: die fünf Pflichtabschnitte in Figma-Reihenfolge", () => {
  assert.deepEqual([...FALLSTUDIE_ABSCHNITTE], voll)
})

test("assertFallstudie: ok bei vollständiger Reihenfolge", () => {
  assert.doesNotThrow(() => assertFallstudie(voll))
})

test("assertFallstudie: weitere Überschriften sind nur nach Ergebnis erlaubt", () => {
  assert.doesNotThrow(() => assertFallstudie([...voll, "Ausblick", "Danksagung"]))
})

test("assertFallstudie: wirft bei fehlendem Ergebnis und nennt es", () => {
  assert.throws(() => assertFallstudie(voll.slice(0, 4)), /Ergebnis/)
})

test("assertFallstudie: wirft bei leerer Liste", () => {
  assert.throws(() => assertFallstudie([]), /Ausgangslage/)
})

test("assertFallstudie: wirft bei vertauschter Reihenfolge", () => {
  assert.throws(
    () => assertFallstudie(["Ausgangslage", "Einblicke", "Ansatz", "Entscheidungen", "Ergebnis"]),
    /Reihenfolge/
  )
})

test("assertFallstudie: wirft bei fremder Überschrift zwischen den Pflichtabschnitten", () => {
  assert.throws(() => assertFallstudie(["Ausgangslage", "Exkurs", "Ansatz", "Einblicke", "Entscheidungen", "Ergebnis"]), /Exkurs/)
})

test("assertFallstudie: doppelte Pflichtüberschrift wirft", () => {
  assert.throws(() => assertFallstudie(["Ausgangslage", "Ansatz", "Ansatz", "Einblicke", "Entscheidungen", "Ergebnis"]))
})

test("teileAbschnitte: Einleitung vor dem ersten h2, dann je h2 ein Abschnitt", () => {
  const md = "Einleitung.\n\n## Eins\n\nText eins.\n\n### Unter\n\nMehr.\n\n## Zwei\n\nText zwei.\n"
  const r = teileAbschnitte(md)
  assert.equal(r.einleitung.trim(), "Einleitung.")
  assert.deepEqual(r.abschnitte.map((a) => a.titel), ["Eins", "Zwei"])
  assert.match(r.abschnitte[0].markdown, /### Unter/)
  assert.equal(r.abschnitte[1].markdown.trim(), "Text zwei.")
})

test("teileAbschnitte: h2 in Codeblöcken zählt nicht", () => {
  const md = "## A\n\n```md\n## kein Abschnitt\n```\n\n## B\n\nx\n"
  assert.deepEqual(teileAbschnitte(md).abschnitte.map((a) => a.titel), ["A", "B"])
})

test("teileAbschnitte: leerer Text", () => {
  assert.deepEqual(teileAbschnitte(""), { einleitung: "", abschnitte: [] })
})

test("trenneBild: führendes Bild mit Titel als Meta herauslösen, Rest bleibt", () => {
  const html = '<p><img src="/a.jpg" alt="Der Generator" title="Generator"></p>\n<h3>Titel</h3>\n<p>Text</p>'
  const r = trenneBild(html)
  assert.deepEqual(r.bild, { src: "/a.jpg", alt: "Der Generator", meta: "Generator" })
  assert.equal(r.rest.trim(), "<h3>Titel</h3>\n<p>Text</p>")
})

test("trenneBild: ohne Titel keine Meta, ohne führendes Bild kein Bild", () => {
  assert.deepEqual(trenneBild('<p><img src="/a.jpg" alt="x"></p><p>t</p>').bild, { src: "/a.jpg", alt: "x", meta: "" })
  const r = trenneBild("<p>Text</p><p><img src=\"/a.jpg\" alt=\"\"></p>")
  assert.equal(r.bild, null)
  assert.equal(r.rest, "<p>Text</p><p><img src=\"/a.jpg\" alt=\"\"></p>")
})

test("trenneBild: HTML-Entitäten in alt und title werden aufgelöst", () => {
  const r = trenneBild('<p><img src="/a.jpg" alt="A &amp; B" title="&quot;M&quot;"></p>')
  assert.deepEqual(r.bild, { src: "/a.jpg", alt: "A & B", meta: '"M"' })
})

test("abschnittIds: wie Astro-Überschriften (Umlaute, Sonderzeichen, Dubletten)", () => {
  assert.deepEqual(abschnittIds(["Nächstes Projekt", "Größe & Ziel", "Ergebnis"]), ["nächstes-projekt", "größe--ziel", "ergebnis"])
  assert.deepEqual(abschnittIds(["Ergebnis", "Ergebnis", "Ergebnis"]), ["ergebnis", "ergebnis-1", "ergebnis-2"])
  assert.deepEqual(abschnittIds(FALLSTUDIE_ABSCHNITTE), ["ausgangslage", "ansatz", "einblicke", "entscheidungen", "ergebnis"])
})
