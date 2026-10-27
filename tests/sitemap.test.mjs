import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

// Prüft die gebaute Sitemap (dist/, nach `npm run build`). Ohne dist wird übersprungen, damit `test:scripts` schnell bleibt.
const dist = join(process.cwd(), "dist")
const vorhanden = existsSync(dist)
// In CI muss gebaut sein: fehlendes dist/ ist dort ein Fehler, lokal ein ausdrücklich begründetes Überspringen
if (!vorhanden && process.env.CI) throw new Error("dist/ fehlt: in CI vor test:scripts `npm run build` ausführen")
const grund = "dist/ fehlt: übersprungen (lokal). Zum Prüfen erst `npm run build`, in CI ist das Pflicht."

test("Sitemap enthält /kontakt und nicht /cv", { skip: vorhanden ? false : grund }, () => {
  const xml = readdirSync(dist)
    .filter((n) => /^sitemap-\d+\.xml$/.test(n))
    .map((n) => readFileSync(join(dist, n), "utf8"))
    .join("\n")
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
  assert.ok(urls.includes("/kontakt/") || urls.includes("/kontakt"), `/kontakt fehlt: ${urls.join(" ")}`)
  assert.ok(urls.includes("/about/") || urls.includes("/about"))
  assert.ok(!urls.some((u) => /^\/cv\/?$/.test(u)))
})
