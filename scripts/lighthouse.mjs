// Lighthouse-Messung gegen einen laufenden Server (baut nichts selbst).
//
//   node tests/helpers/serve-dist.mjs --port 4324 --compress &        # dist/ mit den echten Headern (+ Kompression wie Vercel)
//   npm run lighthouse -- --base http://127.0.0.1:4324 --preset mobile --runs 3 --min-accessibility 100
//
// /404.html statt /404: der Dist-Server antwortet auf /404 mit Status 404 (Lighthouse bricht dann ab), die Datei selbst mit 200.
// Optionen: --base <url> (Pflicht), --paths /,/blog (Standard: alle Routen), --preset mobile|desktop|both, --runs 3 (Median),
// --label <name> (Unterordner in .baseline/lighthouse/), --block-cookiebot (Cookiebot wird blockiert statt echt geladen),
// --host-map <host>=<ip:port> (Chrome löst <host> auf den lokalen Server auf; z. B. www.ptrckschrdtr.de=127.0.0.1:4324 mit
//   --base http://www.ptrckschrdtr.de: Cookiebot prüft den Host gegen die im Konto eingetragene Domain, 127.0.0.1 kennt es nicht),
// --min-performance|accessibility|best-practices|seo <0-100> (Exit-Code 1 bei Unterschreitung).
// Berichte (JSON, HTML) landen in .baseline/lighthouse/<label>/ (gitignored). Chrome kommt von Playwright (chromium).
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { launch } from "chrome-launcher"
import lighthouse from "lighthouse"
import desktopConfig from "lighthouse/core/config/desktop-config.js"
import { chromium } from "playwright"
import { medianVon, pruefeSchwellen, schwellenAusArgs, tabelle, zusammenfassen } from "./lighthouse-lib.mjs"

const STANDARD_PFADE = [
  "/", "/blog", "/blog/design-tokens-in-der-praxis", "/projects", "/projects/tintfield", "/about", "/cv", "/kontakt",
  "/impressum", "/datenschutz", "/tools/gradient-generator", "/404.html",
]

const argv = process.argv.slice(2)
const arg = (name, standard) => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 ? argv[i + 1] : standard
}
const base = arg("base")
if (!base) {
  console.error("--base <url> fehlt (z. B. http://127.0.0.1:4324)")
  process.exit(2)
}
const pfade = (arg("paths") ?? STANDARD_PFADE.join(",")).split(",")
const presets = arg("preset", "both") === "both" ? ["mobile", "desktop"] : [arg("preset")]
const runs = Number(arg("runs", "3"))
const label = arg("label", "neu")
const blockCookiebot = argv.includes("--block-cookiebot")
const hostMap = arg("host-map")
const schwellen = schwellenAusArgs(argv)
const out = join(process.cwd(), ".baseline/lighthouse", label)
mkdirSync(out, { recursive: true })

const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu", ...(hostMap ? [`--host-resolver-rules=MAP ${hostMap.replace("=", " ")}`, "--disable-features=HttpsUpgrades,HttpsFirstBalancedModeAutoEnable"] : [])],
})
let verstoesse = 0
try {
  for (const preset of presets) {
    const zeilen = []
    for (const pfad of pfade) {
      const laeufe = []
      for (let i = 0; i < runs; i++) {
        const flags = {
          port: chrome.port,
          output: ["json", "html"],
          logLevel: "error",
          ...(blockCookiebot ? { blockedUrlPatterns: ["*consent.cookiebot.com*"] } : {}),
        }
        const res = await lighthouse(base.replace(/\/$/, "") + pfad, flags, preset === "desktop" ? desktopConfig : undefined)
        if (!res) throw new Error(`Kein Ergebnis für ${pfad}`)
        const name = `${preset}${pfad.replace(/\//g, "_") || "_"}-${i + 1}`
        writeFileSync(join(out, `${name}.json`), res.report[0])
        writeFileSync(join(out, `${name}.html`), res.report[1])
        laeufe.push(zusammenfassen(res.lhr))
      }
      const m = medianVon(laeufe)
      zeilen.push(m)
      verstoesse += pruefeSchwellen(m, schwellen).length
    }
    console.log(`\n== ${label} · ${preset} · Median aus ${runs} Läufen${blockCookiebot ? " · Cookiebot blockiert" : ""} ==`)
    console.log(tabelle(zeilen))
    writeFileSync(join(out, `zusammenfassung-${preset}.json`), JSON.stringify(zeilen, null, 2))
    for (const z of zeilen)
      for (const v of pruefeSchwellen(z, schwellen)) console.error(`UNTER SCHWELLE ${preset} ${new URL(z.url).pathname}: ${v.kategorie} ${v.score} < ${v.min}`)
  }
} finally {
  await chrome.kill()
}
process.exit(verstoesse ? 1 : 0)
