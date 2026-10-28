// Kontaktbogen: je Seite und Breite unser Screenshot neben dem Figma-Screenshot, als HTML unter .baseline/kontaktbogen/.
//
//   node scripts/qa-kontaktbogen.mjs --base http://127.0.0.1:4323        (dist-Server; oder Dev-Server)
//
// Figma-Screenshots liegen als .baseline/kontaktbogen/figma/<slug>-<desktop|tablet|mobile>.png. Sie kommen aus der Figma-Datei
// 7EQ8Ujy720sQuGCWpLyADN (Figma-MCP `get_screenshot` je Screen, Knoten siehe FIGMA unten) und werden von Hand bzw. vom Agenten
// abgelegt; fehlt eine Datei, bleibt der Figma-Platz leer („nicht abgelegt“). Es wird nichts erfunden.
import { existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { chromium } from "playwright"

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`)
  return i > 0 ? process.argv[i + 1] : d
}
const base = (arg("base", "http://127.0.0.1:4323")).replace(/\/$/, "")
const theme = arg("theme", "light")
const out = join(process.cwd(), ".baseline/kontaktbogen")
mkdirSync(join(out, "code"), { recursive: true })

/** Slug → Route; Figma-Knoten (Datei 7EQ8Ujy720sQuGCWpLyADN) stehen in den Dateinamen unter figma/ */
export const SEITEN = [
  ["start", "/"],
  ["blog", "/blog"],
  ["artikel", "/blog/design-tokens-in-der-praxis"],
  ["projekte", "/projects"],
  ["fallstudie", "/projects/tintfield"],
  ["about", "/about"],
  ["cv", "/cv"],
  ["kontakt", "/kontakt"],
  ["impressum", "/impressum"],
  ["fehler", "/404.html"],
]
export const BREITEN = [["desktop", 1440], ["tablet", 768], ["mobile", 390]]

const browser = await chromium.launch()
const ctx = await browser.newContext({ reducedMotion: "reduce", colorScheme: theme })
await ctx.route((u) => !["127.0.0.1", "localhost"].includes(u.hostname), (r) => r.abort())
const zeilen = []
for (const [slug, route] of SEITEN) {
  const zellen = []
  for (const [bname, breite] of BREITEN) {
    const page = await ctx.newPage()
    await page.setViewportSize({ width: breite, height: 900 })
    await page.addInitScript((t) => localStorage.setItem("theme", t), theme)
    await page.goto(base + route)
    await page.waitForSelector("body[data-bereit]", { timeout: 20000 }).catch(() => undefined)
    await page.waitForTimeout(600)
    const datei = `code/${slug}-${bname}.png`
    await page.screenshot({ path: join(out, datei), fullPage: true })
    const hoehe = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.close()
    const figma = `figma/${slug}-${bname}.png`
    zellen.push({ bname, breite, datei, hoehe, figma: existsSync(join(out, figma)) ? figma : null })
  }
  zeilen.push({ slug, route, zellen })
}
await browser.close()

const html = `<!doctype html><meta charset="utf-8"><title>Kontaktbogen</title>
<style>body{font:14px system-ui;margin:24px;background:#eee}h2{margin:32px 0 8px}.reihe{display:flex;gap:16px;align-items:flex-start;margin-bottom:24px}
figure{margin:0;background:#fff;padding:8px}figcaption{font-weight:600;margin-bottom:6px}img{display:block;height:auto;max-width:100%}
.leer{width:100%;min-height:80px;display:grid;place-items:center;color:#888;border:1px dashed #bbb}
.desktop{width:600px}.tablet{width:340px}.mobile{width:200px}</style>
<h1>Kontaktbogen (${theme})</h1><p>Links unser Screenshot (${base}), rechts Figma. Basis: ${new Date().toISOString().slice(0, 10)}</p>
${zeilen
  .map(
    (z) => `<h2>${z.slug} <small>${z.route}</small></h2>${z.zellen
      .map(
        (c) => `<div class="reihe"><figure class="${c.bname}"><figcaption>Code · ${c.bname} ${c.breite} (Höhe ${c.hoehe})</figcaption><img src="${c.datei}" alt=""></figure>
<figure class="${c.bname}"><figcaption>Figma · ${c.bname}</figcaption>${c.figma ? `<img src="${c.figma}" alt="">` : `<div class="leer">nicht abgelegt</div>`}</figure></div>`
      )
      .join("")}`
  )
  .join("")}`
writeFileSync(join(out, "index.html"), html)
console.log(`Kontaktbogen: ${join(out, "index.html")}`)
