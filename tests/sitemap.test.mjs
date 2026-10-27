import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

// Prüft die gebaute Sitemap (dist/, nach `npm run build`). Ohne dist wird übersprungen, damit `test:scripts` schnell bleibt.
const dist = join(process.cwd(), "dist")
const vorhanden = existsSync(dist)

test("Sitemap enthält /kontakt und nicht /cv", { skip: vorhanden ? false : "dist/ fehlt (erst npm run build)" }, () => {
  const xml = readdirSync(dist)
    .filter((n) => /^sitemap-\d+\.xml$/.test(n))
    .map((n) => readFileSync(join(dist, n), "utf8"))
    .join("\n")
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname)
  assert.ok(urls.includes("/kontakt/") || urls.includes("/kontakt"), `/kontakt fehlt: ${urls.join(" ")}`)
  assert.ok(urls.includes("/about/") || urls.includes("/about"))
  assert.ok(!urls.some((u) => /^\/cv\/?$/.test(u)))
})
