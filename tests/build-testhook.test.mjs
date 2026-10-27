import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

// Die Test-Hooks window.__lenisCount, window.__lenis, window.__motionLebend und window.__lichtband dürfen nur in Dev-/Testbuilds existieren, nie in gebautem JavaScript (dist/).
const dist = join(process.cwd(), "dist")
const vorhanden = existsSync(dist)
if (!vorhanden && process.env.CI) throw new Error("dist/ fehlt: in CI vor test:scripts `npm run build` ausführen")
const grund = "dist/ fehlt: übersprungen (lokal). Zum Prüfen erst `npm run build`, in CI ist das Pflicht."

function jsDateien(ordner) {
  return readdirSync(ordner).flatMap((n) => {
    const pfad = join(ordner, n)
    if (statSync(pfad).isDirectory()) return jsDateien(pfad)
    return /\.(m?js|html|map|json)$/.test(n) ? [pfad] : []
  })
}

for (const hook of ["__lenis", "__motionLebend", "__lichtband"]) {
  test(`dist: ${hook} (Test-Hook) kommt in keiner Datei des Builds (js, html, map, json) vor`, { skip: vorhanden ? false : grund }, () => {
    const treffer = jsDateien(dist).filter((f) => readFileSync(f, "utf8").includes(hook))
    assert.deepEqual(treffer, [])
  })
}
