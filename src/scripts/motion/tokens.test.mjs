import { test } from "node:test"
import assert from "node:assert/strict"
import { parseToken, msToSeconds } from "./parse.mjs"

test("parseToken: Millisekunden bleiben Millisekunden", () => {
  assert.equal(parseToken("750ms"), 750)
  assert.equal(parseToken("0ms"), 0)
  assert.equal(parseToken("12.5ms"), 12.5)
})

test("parseToken: Sekunden werden zu Millisekunden", () => {
  assert.equal(parseToken("1.4s"), 1400)
  assert.equal(parseToken("2s"), 2000)
  assert.equal(parseToken(".5s"), 500)
})

test("parseToken: einheitenlos bleibt unverändert", () => {
  assert.equal(parseToken("0.08"), 0.08)
  assert.equal(parseToken("0.085"), 0.085)
  assert.equal(parseToken("380"), 380)
  assert.equal(parseToken("0"), 0)
})

test("parseToken: Leerraum wird toleriert (getComputedStyle liefert führende Leerzeichen)", () => {
  assert.equal(parseToken("  750ms "), 750)
  assert.equal(parseToken("\n0.6\t"), 0.6)
})

test("parseToken: Vorzeichen: + ist erlaubt, negative Zahlen bleiben negativ", () => {
  assert.equal(parseToken("+0.5"), 0.5)
  assert.equal(parseToken("-100ms"), -100)
  assert.equal(parseToken("-0.5s"), -500)
})

test("parseToken: wörtliche Sonderfälle", () => {
  assert.throws(() => parseToken("1e3"), /1e3/)
  assert.equal(parseToken("0.0"), 0)
  assert.equal(parseToken("-5ms"), -5)
})

test("parseToken: Einheit ohne Groß-/Kleinschreibung", () => {
  assert.equal(parseToken("300MS"), 300)
  assert.equal(parseToken("1S"), 1000)
})

test("parseToken: leer, nur Leerraum und Unsinn werfen einen klaren Fehler", () => {
  assert.throws(() => parseToken(""), /leer/i)
  assert.throws(() => parseToken("   "), /leer/i)
  assert.throws(() => parseToken("abc"), /abc/)
  assert.throws(() => parseToken("NaN"), /NaN/)
  assert.throws(() => parseToken("12px"), /12px/)
  assert.throws(() => parseToken("1.2.3"), /1\.2\.3/)
  assert.throws(() => parseToken("ms"), /ms/)
  assert.throws(() => parseToken("Infinity"), /Infinity/)
  assert.throws(() => parseToken(undefined), /Token/)
})

test("msToSeconds: Millisekunden in Sekunden (Federn erwarten visualDuration in Sekunden)", () => {
  assert.equal(msToSeconds(750), 0.75)
  assert.equal(msToSeconds(0), 0)
  assert.equal(msToSeconds(1100), 1.1)
})

import { parseLength, parseEasing } from "./parse.mjs"

test("parseLength: Pixel-Tokens", () => {
  assert.equal(parseLength("24px"), 24)
  assert.equal(parseLength(" 1.5px "), 1.5)
  assert.throws(() => parseLength("24"), /Pixel/)
  assert.throws(() => parseLength("2em"), /Pixel/)
  assert.throws(() => parseLength(""), /leer/)
})

test("parseEasing: cubic-bezier wird zu vier Zahlen, Schlüsselwort bleibt", () => {
  assert.deepEqual(parseEasing("cubic-bezier(0.22, 1, 0.36, 1)"), [0.22, 1, 0.36, 1])
  assert.deepEqual(parseEasing("cubic-bezier(0.4,0,0.2,1)"), [0.4, 0, 0.2, 1])
  assert.equal(parseEasing("ease"), "ease")
  assert.throws(() => parseEasing("cubic-bezier(a, 1, 0.36, 1)"), /Easing/)
  assert.throws(() => parseEasing(""), /leer/)
})
