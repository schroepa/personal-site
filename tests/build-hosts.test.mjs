import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { EXTERNE_RESSOURCEN } from "../src/data/rechtliches.ts"
import { fremdeHosts, htmlDateien } from "./fremde-hosts.ts"

// Prüft gebautes HTML (dist/): Seiten des neuen Layers laden Ressourcen nur von der eigenen Domain und aus EXTERNE_RESSOURCEN.
// Ausgehende Links (<a href>) zählen nicht, nur ressourcenladende Attribute, url(…) und Adressen in Inline-Skripten.
const dist = join(process.cwd(), "dist")
const vorhanden = existsSync(dist)
if (!vorhanden && process.env.CI) throw new Error("dist/ fehlt: in CI vor test:scripts `npm run build` ausführen")
const grund = "dist/ fehlt: übersprungen (lokal). Zum Prüfen erst `npm run build`, in CI ist das Pflicht."

const ERLAUBT = new Set(EXTERNE_RESSOURCEN.map((r) => r.host))
const EIGENE = new Set(["www.ptrckschrdtr.de", "ptrckschrdtr.de"])
/** Namensraum-URIs (SVG, XHTML), laden nichts */
const NAMENSRAUM = new Set(["www.w3.org"])

test("fremdeHosts: findet src/link/url()/Inline-Adressen, ignoriert <a href>, JSON-LD und relative Pfade", () => {
  const html = `<a href="https://x.example/a">l</a><link rel="stylesheet" href="https://css.example/s.css"><script src="//cdn.example/a.js"></script>
    <img src="/lokal.png" srcset="https://img.example/a.png 1x, /b.png 2x"><div style="background:url('https://bg.example/x.png')"></div>
    <script>fetch("https://api.example/v1")</script><script type="application/ld+json">{"@context":"https://schema.org"}</script>`
  assert.deepEqual([...fremdeHosts(html)].sort(), ["api.example", "bg.example", "cdn.example", "css.example", "img.example"])
})

test("gebaute Seiten des neuen Layers laden nur Ressourcen von der eigenen Domain, Cookiebot und PostHog", { skip: vorhanden ? false : grund }, () => {
  const neu = htmlDateien(dist).filter((p) => /data-schriftfeld/.test(readFileSync(p, "utf8")))
  const routen = neu.map((p) => p.slice(dist.length))
  for (const pflicht of ["/index.html", "/about/index.html", "/cv/index.html", "/kontakt/index.html", "/impressum/index.html", "/datenschutz/index.html", "/404.html"]) {
    assert.ok(routen.includes(pflicht), `${pflicht} fehlt oder nutzt SiteLayout nicht: ${routen.join(" ")}`)
  }
  const probleme = []
  for (const datei of neu) {
    for (const h of fremdeHosts(readFileSync(datei, "utf8"))) {
      if (!ERLAUBT.has(h) && !EIGENE.has(h) && !NAMENSRAUM.has(h)) probleme.push(`${datei.slice(dist.length)}: ${h}`)
    }
  }
  assert.deepEqual(probleme, [])
})
