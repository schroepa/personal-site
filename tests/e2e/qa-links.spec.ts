import { expect, test, type APIRequestContext } from "@playwright/test"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { lese, veroeffentlichteBeitraege } from "../content"
import { QA_SEITEN, ladeSeite, stubExterne } from "../helpers/qa"

// Crawl-artige Prüfungen, nur im Desktop-Projekt (Breite spielt keine Rolle). Zwei Quellen:
//  - Dev-Server (baseURL): Links und Anker der Seiten, wie sie im Browser aussehen.
//  - gebautes dist/ über tests/helpers/serve-dist.mjs (Port 4323, Projekt „csp“ nutzt ihn auch): Sitemap, Meta-Daten,
//    OG-Bilder, robots.txt, llms.txt, 404. Dort stimmen Canonical und Sitemap, weil Astro `site` nur im Build einsetzt.
// Playwright verlangt hier das Destrukturierungsmuster für die Fixtures
// eslint-disable-next-line no-empty-pattern
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== "desktop", "Crawl-Prüfungen laufen nur im Desktop-Projekt")
})
test.describe.configure({ mode: "parallel" })

const SITE = "https://www.ptrckschrdtr.de"
const DIST_URL = "http://127.0.0.1:4323"
const DIST = join(process.cwd(), "dist")
const DIST_DA = existsSync(join(DIST, "index.html")) && existsSync(join(DIST, "sitemap-index.xml"))
if (process.env.CI && !DIST_DA) throw new Error("qa-links.spec.ts: dist/ fehlt – in CI vorher `npm run build`")
const DIST_GRUND = "dist/ fehlt: erst `npm run build` (in CI Pflicht)"

const mitSlash = (p: string) => (p.endsWith("/") ? p : p + "/")
const hrefs = (html: string) => [...html.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"))
const intern = (h: string): string | null => {
  if (h.startsWith("#") || /^(mailto:|tel:|javascript:)/.test(h)) return null
  if (h.startsWith("//")) return null
  if (h.startsWith("/")) return h.split("#")[0].split("?")[0]
  try {
    const u = new URL(h)
    return u.origin === SITE || u.hostname === "localhost" ? u.pathname : null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------------------------
// (8) Links im Browser: Text, rel, Anker
for (const seite of QA_SEITEN) {
  test(`Links ${seite.name}: Text vorhanden, target=_blank mit noopener, Anker zeigen auf vorhandene ids`, async ({ page, context }) => {
    await stubExterne(context)
    await ladeSeite(page, seite.url)
    const r = await page.evaluate(() => {
      const leer: string[] = []
      const ohneRel: string[] = []
      const anker: string[] = []
      for (const a of Array.from(document.querySelectorAll<HTMLAnchorElement>("a"))) {
        const href = a.getAttribute("href")
        if (href === null || href === "" || href === "#") anker.push(`<a> ohne Ziel: „${a.textContent?.trim().slice(0, 30)}“`)
        const name = (a.getAttribute("aria-label") || a.innerText || a.textContent || a.querySelector("img")?.getAttribute("alt") || a.getAttribute("title") || "").trim()
        if (!name) leer.push(href ?? "(ohne href)")
        if (a.target === "_blank" && !/\bnoopener\b/.test(a.rel)) ohneRel.push(href ?? "")
        if (href && href.startsWith("#") && href.length > 1 && !document.getElementById(decodeURIComponent(href.slice(1)))) anker.push(href)
      }
      return { leer, ohneRel, anker }
    })
    expect(r.leer, "Links ohne Text").toEqual([])
    expect(r.ohneRel, "target=_blank ohne rel=noopener").toEqual([])
    expect(r.anker, "Anker ohne Ziel").toEqual([])
  })
}

// ---------------------------------------------------------------------------------------------
// (8) Alle internen Links aller Seiten liefern 200 (Dev-Server)
test("alle internen Links der Seiten antworten mit 200 (Dev-Server)", async ({ request }) => {
  const ziele = new Set<string>()
  for (const s of QA_SEITEN) {
    const res = await request.get(s.url)
    for (const h of hrefs(await res.text())) {
      const p = intern(h)
      // cv.pdf entsteht erst im Build (postbuild), im Dev-Server gibt es sie nicht: Prüfung im Block „gebautes dist/“
      if (p && p !== "/cv.pdf") ziele.add(p)
    }
  }
  expect(ziele.size).toBeGreaterThan(20)
  const fehler: string[] = []
  for (const p of ziele) {
    const res = await request.get(p, { maxRedirects: 0 })
    if (res.status() !== 200) fehler.push(`${p} → ${res.status()}`)
  }
  expect(fehler).toEqual([])
})

// ---------------------------------------------------------------------------------------------
// (5), (11), (12) gegen dist/
test.describe("gebautes dist/", () => {
  test.skip(!DIST_DA, DIST_GRUND)

  const dist = (request: APIRequestContext, p: string) => request.get(DIST_URL + p, { maxRedirects: 0 })
  const alsDist = (u: string) => new URL(u).pathname

  /** Indexierbare Routen laut Quelle: statische Seiten ohne 404, Werkzeug, veröffentlichte Beiträge, alle Projekte. */
  const erwarteteRouten = () =>
    [
      ...["/", "/blog", "/projects", "/about", "/cv", "/kontakt", "/impressum", "/datenschutz", "/tools/gradient-generator"],
      ...veroeffentlichteBeitraege().map((b) => `/blog/${b.slug}`),
      ...lese("projects").map((p) => `/projects/${p.slug}`),
    ]
      .map(mitSlash)
      .sort()

  test("Sitemap = Menge der indexierbaren Routen (ohne /404, /prototypes, /og-render, Entwürfe)", async ({ request }) => {
    const index = await (await dist(request, "/sitemap-index.xml")).text()
    const karten = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    expect(karten.length).toBeGreaterThan(0)
    const urls: string[] = []
    for (const k of karten) {
      const res = await dist(request, alsDist(k))
      expect(res.status(), k).toBe(200)
      urls.push(...[...(await res.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]))
    }
    for (const u of urls) expect(u.startsWith(SITE + "/"), u).toBe(true)
    expect(urls.map(alsDist).sort()).toEqual(erwarteteRouten())
    for (const u of urls) expect((await dist(request, alsDist(u))).status(), u).toBe(200)
  })

  test("jeder interne Link aller Seiten antwortet im Build mit 200 (inkl. cv.pdf als PDF)", async ({ request }) => {
    const ziele = new Set<string>(["/cv.pdf"])
    for (const s of QA_SEITEN.filter((x) => x.url !== "/404")) {
      for (const h of hrefs(await (await dist(request, s.url)).text())) {
        const p = intern(h)
        if (p) ziele.add(p)
      }
    }
    const fehler: string[] = []
    for (const p of ziele) {
      const res = await dist(request, p)
      if (res.status() !== 200) fehler.push(`${p} → ${res.status()}`)
    }
    expect(fehler).toEqual([])
    expect((await dist(request, "/cv.pdf")).headers()["content-type"]).toBe("application/pdf")
  })

  test("robots.txt erlaubt alles und nennt die Sitemap, die existiert", async ({ request }) => {
    const robots = await (await dist(request, "/robots.txt")).text()
    expect(robots).toMatch(/^User-agent: \*$/m)
    expect(robots).not.toMatch(/^Disallow:\s*\S/m)
    const sm = robots.match(/^Sitemap:\s*(\S+)$/m)?.[1]
    expect(sm).toBe(`${SITE}/sitemap-index.xml`)
    expect((await dist(request, alsDist(sm!))).status()).toBe(200)
  })

  test("llms.txt: jeder Link zeigt auf eine vorhandene Seite", async ({ request }) => {
    const txt = await (await dist(request, "/llms.txt")).text()
    const links = [...txt.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]).filter((u) => u.startsWith(SITE))
    expect(links.length).toBeGreaterThan(10)
    const fehler: string[] = []
    for (const u of new Set(links)) {
      const status = (await dist(request, alsDist(u))).status()
      if (status !== 200) fehler.push(`${u} → ${status}`)
    }
    expect(fehler).toEqual([])
  })

  for (const seite of QA_SEITEN.filter((s) => s.url !== "/404")) {
    test(`Meta ${seite.name}: Titel, Beschreibung, Canonical, Open Graph, Twitter`, async ({ request }) => {
      const html = await (await dist(request, seite.url)).text()
      const meta = (re: RegExp) => html.match(re)?.[1]
      const name = (n: string) => meta(new RegExp(`<meta name="${n}" content="([^"]*)"`))
      const prop = (n: string) => meta(new RegExp(`<meta property="${n}" content="([^"]*)"`))
      expect(html).toMatch(/<html lang="de"/)
      const titel = meta(/<title>([^<]*)<\/title>/)!
      expect(titel.length, titel).toBeGreaterThan(0)
      expect(titel.length, titel).toBeLessThanOrEqual(70)
      const beschr = name("description")!
      expect(beschr.length, beschr).toBeGreaterThanOrEqual(50)
      expect(beschr.length, beschr).toBeLessThanOrEqual(200)
      const kanon = meta(/<link rel="canonical" href="([^"]*)"/)!
      expect(new URL(kanon).origin).toBe(SITE)
      expect(mitSlash(new URL(kanon).pathname)).toBe(mitSlash(seite.url))
      expect(prop("og:url")).toBe(kanon)
      expect(prop("og:title")).toBeTruthy()
      expect(prop("og:description")).toBeTruthy()
      expect(name("twitter:card")).toBe("summary_large_image")
      expect(name("twitter:title")).toBeTruthy()
      for (const bild of [prop("og:image"), name("twitter:image")]) {
        expect(bild, "Bild-URL absolut").toMatch(/^https:\/\//)
        if (bild!.startsWith(SITE)) expect((await dist(request, alsDist(bild!))).status(), bild).toBe(200)
      }
    })
  }

  test("Titel und Beschreibungen sind einmalig über alle Seiten", async ({ request }) => {
    const titel = new Map<string, string>()
    const beschr = new Map<string, string>()
    for (const s of QA_SEITEN.filter((x) => x.url !== "/404")) {
      const html = await (await dist(request, s.url)).text()
      const t = html.match(/<title>([^<]*)<\/title>/)![1]
      const d = html.match(/<meta name="description" content="([^"]*)"/)![1]
      expect(titel.get(t), `Titel doppelt: ${t} (${s.url} und ${titel.get(t)})`).toBeUndefined()
      expect(beschr.get(d), `Beschreibung doppelt (${s.url} und ${beschr.get(d)})`).toBeUndefined()
      titel.set(t, s.url)
      beschr.set(d, s.url)
    }
  })

  test("unbekannter Pfad: Status 404, Fehlerseite mit h1 und noindex", async ({ request }) => {
    for (const p of ["/gibt-es-nicht", "/blog/gibt-es-nicht", "/projects/gibt-es-nicht/"]) {
      const res = await dist(request, p)
      expect(res.status(), p).toBe(404)
      const html = await res.text()
      expect(html).toMatch(/<h1[^>]*>/)
      expect(html).toMatch(/<meta name="robots" content="noindex"/)
    }
  })

  test("Vorschau-, Hilfs- und Entwurfsseiten sind nicht in der Sitemap, aber noindex", async () => {
    const sm = readFileSync(join(DIST, "sitemap-0.xml"), "utf8")
    expect(sm).not.toMatch(/prototypes|og-render|button-label-wichtiger-als-farbe/)
    for (const p of ["prototypes/tokens", "prototypes/layout"]) {
      const f = join(DIST, p, "index.html")
      if (existsSync(f)) expect(readFileSync(f, "utf8"), p).toMatch(/<meta name="robots" content="noindex"/)
    }
  })
})
