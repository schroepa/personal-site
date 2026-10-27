import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

/** Dateien des alten Layers mit bekannten Typfehlern. Neue Dateien dürfen hier nie auftauchen. */
// entfällt in Task 15b (og-render wird dort auf Tokens umgestellt)
const LEGACY = new Set([
  "src/pages/og-render/[kind]/[slug].astro", // coverImage: unknown (Task 15b)
])

/** Dateien mit Fehlern aus der Ausgabe von `astro check` (ohne Farbcodes). */
export function fehlerDateien(ausgabe) {
  const clean = ausgabe.replace(/\x1b\[[0-9;]*m/g, "")
  const dateien = new Set()
  for (const zeile of clean.split("\n")) {
    const m = zeile.match(/^(\S.*?):\d+:\d+ - error\b/)
    if (m) dateien.add(m[1])
  }
  return [...dateien]
}

/** Anzahl der Fehlerzeilen („Datei:Zeile:Spalte - error …“). */
export function fehlerZeilen(ausgabe) {
  return ausgabe.replace(/\x1b\[[0-9;]*m/g, "").split("\n").filter((z) => /^(\S.*?):\d+:\d+ - error\b/.test(z)).length
}

test("fehlerDateien: liest Dateien aus Fehlerzeilen, ignoriert Warnungen", () => {
  const text = "\x1b[96msrc/a.astro\x1b[0m:\x1b[93m4\x1b[0m:\x1b[93m1\x1b[0m - \x1b[91merror\x1b[0m ts(1): x\nsrc/b.astro:2:3 - warning ts(2): y\nsrc/a.astro:9:9 - error ts(3): z"
  assert.deepEqual(fehlerDateien(text), ["src/a.astro"])
})

/** Summe aus der Zeile „N errors“ der Zusammenfassung von astro check, sonst null. */
export function summenFehler(ausgabe) {
  const clean = ausgabe.replace(/\x1b\[[0-9;]*m/g, "")
  if (!/Result \(\d+ files?\)/.test(clean)) return null
  const m = clean.match(/^-\s*(\d+) errors?\b/m)
  return m ? Number(m[1]) : null
}

test("summenFehler: liest die Zusammenfassung, fehlt sie, kommt null", () => {
  assert.equal(summenFehler("Result (100 files): \n- 20 errors\n- 0 warnings"), 20)
  assert.equal(summenFehler("Result (3 files): \n- 0 errors"), 0)
  assert.equal(summenFehler("Result (3 files): \n- 1 error"), 1)
  assert.equal(summenFehler("irgendwas"), null)
})

test("astro check meldet keine Fehler in neuen Dateien (nur die Legacy-Liste ist erlaubt)", () => {
  const r = spawnSync("npx", ["astro", "check"], {
    cwd: root,
    encoding: "utf8",
    timeout: 90_000,
    env: { ...process.env, NO_COLOR: "1" },
    maxBuffer: 64 * 1024 * 1024,
  })
  // Ein Abbruch (Zeitlimit, Signal, Startfehler) ist ein Fehlschlag, nie ein Bestehen
  assert.ok(!r.error, `astro check nicht ausgeführt oder Zeitlimit (90 s) überschritten: ${r.error?.message}`)
  assert.ok(!r.signal, `astro check wurde mit Signal ${r.signal} beendet`)
  assert.notEqual(r.status, null, "astro check hat keinen Exit-Code geliefert")
  const ausgabe = `${r.stdout}\n${r.stderr}`
  const summe = summenFehler(ausgabe)
  assert.notEqual(summe, null, "astro check hat keine Zusammenfassung „Result … N errors“ ausgegeben (Ausgabeformat geändert?)")
  const zeilen = fehlerZeilen(ausgabe)
  assert.equal(zeilen, summe, `Fehlerzeilen (${zeilen}) und Zusammenfassung (${summe}) stimmen nicht überein (Ausgabeformat geändert?)`)
  const neu = fehlerDateien(ausgabe).filter((f) => !LEGACY.has(f))
  assert.deepEqual(neu, [], `Typfehler in neuen Dateien: ${neu.join(", ")}`)
})
