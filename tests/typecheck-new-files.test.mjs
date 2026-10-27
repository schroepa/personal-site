import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

/** Dateien des alten Layers mit bekannten Typfehlern. Neue Dateien dürfen hier nie auftauchen. */
// entfällt in Task 15
const LEGACY = new Set([
  "src/components/LiquidToggle.tsx",
  "src/components/astro/ArticleFooter.astro",
  "src/layouts/BaseLayout.astro",
  "src/pages/og-render/[kind]/[slug].astro",
  "src/pages/projects/[slug].astro",
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

test("fehlerDateien: liest Dateien aus Fehlerzeilen, ignoriert Warnungen", () => {
  const text = "\x1b[96msrc/a.astro\x1b[0m:\x1b[93m4\x1b[0m:\x1b[93m1\x1b[0m - \x1b[91merror\x1b[0m ts(1): x\nsrc/b.astro:2:3 - warning ts(2): y\nsrc/a.astro:9:9 - error ts(3): z"
  assert.deepEqual(fehlerDateien(text), ["src/a.astro"])
})

test("astro check meldet keine Fehler in neuen Dateien (nur die Legacy-Liste ist erlaubt)", { timeout: 180_000 }, () => {
  const r = spawnSync("npx", ["astro", "check"], { cwd: root, encoding: "utf8", env: { ...process.env, NO_COLOR: "1" }, maxBuffer: 64 * 1024 * 1024 })
  const ausgabe = `${r.stdout}\n${r.stderr}`
  assert.match(ausgabe, /astro check|Result/i, "astro check ist nicht gelaufen")
  const neu = fehlerDateien(ausgabe).filter((f) => !LEGACY.has(f))
  assert.deepEqual(neu, [], `Typfehler in neuen Dateien: ${neu.join(", ")}`)
})
