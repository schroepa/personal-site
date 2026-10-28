import { expect, test, type BrowserContext, type Page } from "@playwright/test"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { ROUTES } from "../helpers"
import { buildHeaders, ladeRessourcen } from "../../scripts/build-vercel-headers.mjs"
import { MOTION_WATCHDOG_MS } from "../../src/scripts/motion/gate"
import { KOPF_SKRIPT_PFAD } from "../../src/scripts/kopf-skript.ts"
import { sourceZuRegex } from "../helpers/serve-dist.mjs"

// Sicherheits-Header und CSP im echten Browser (Task 16). Läuft im Projekt „csp“ gegen dist/, ausgeliefert von
// tests/helpers/serve-dist.mjs mit den Headern aus vercel.json (wie auf Vercel, ohne zu deployen).
//
//   npm run build && npx playwright test --project=csp
//
// Netz: Jede Anfrage an einen fremden Host wird abgefangen. Cookiebot und PostHog werden NIE echt geladen und
// bekommen NIE Daten (keine Einwilligungsnachweise, keine Analytics): uc.js ist ein Nachbau, PostHog-Endpunkte
// antworten leer; array.js ist die lokal installierte Bibliothek (node_modules/posthog-js), damit echter PostHog-Code
// unter der CSP läuft. Unbekannte Hosts werden abgebrochen und gemeldet. CSP-Prüfungen passieren im Browser VOR dem
// Abfangen: was die CSP blockiert, erreicht page.route nie.

const DIST = join(process.cwd(), "dist")
const neuesteQuelle = () => {
  const alle = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? alle(join(dir, n)) : [join(dir, n)]))
  return Math.max(...[...alle(join(process.cwd(), "src")), join(process.cwd(), "vercel.json")].map((p) => statSync(p).mtimeMs))
}
const DIST_DA = existsSync(join(DIST, "index.html")) && existsSync(join(DIST, KOPF_SKRIPT_PFAD))
const DIST_FRISCH = DIST_DA && statSync(join(DIST, "index.html")).mtimeMs >= neuesteQuelle()

if (process.env.CI && !DIST_FRISCH) throw new Error("csp.spec.ts: dist/ fehlt oder ist älter als src/ bzw. vercel.json – in CI vorher `npm run build`")
test.skip(!DIST_FRISCH, "dist/ fehlt oder ist älter als src/ bzw. vercel.json: erst `npm run build` (in CI Pflicht)")

const RESSOURCEN = ladeRessourcen() as Array<{ host: string; name: string }>
const REGELN = buildHeaders(RESSOURCEN)
const ALLGEMEIN = REGELN[0].headers
const POSTHOG_HOSTS = RESSOURCEN.filter((r) => r.name === "PostHog").map((r) => r.host)
const ERLAUBTE_HOSTS = new Set(RESSOURCEN.map((r) => r.host))

/** Je eine Seite jeder Art: alle statischen Routen, Werkzeug, Artikel, Fallstudie */
const ERSTER = (ordner: string) => (DIST_DA ? readdirSync(join(DIST, ordner)).filter((n) => existsSync(join(DIST, ordner, n, "index.html"))).sort()[0] : "x")
const SEITEN = [...ROUTES, "/tools/gradient-generator", `/blog/${ERSTER("blog")}`, `/projects/${ERSTER("projects")}`]

const ARRAY_JS = readFileSync(join(process.cwd(), "node_modules/posthog-js/dist/array.js"), "utf8")
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64")

/**
 * Nachbau von uc.js. Tut, was das echte Skript laut Analyse (uc.js vom 28.10.2026) und Cookiebot-CSP-Doku tut, damit
 * die Freigaben der CSP geprüft werden: Konfiguration als Skript vom CDN, <style> ohne Nonce, Konsens-Iframe vom CDN,
 * Banner mit style-Attribut, Bild von imgsct, XHR an das CDN. Das echte Banner prüft Patrick auf der Vercel-Preview.
 */
function falschesCookiebot(statistik: boolean, ereignisse: false | "nur-bereit" | "bereit-und-accept" = false): string {
  return `(function () {
  window.__cookiebotRenew = 0
  window.Cookiebot = window.CookieConsent = {
    consent: { necessary: true, preferences: false, statistics: ${statistik}, marketing: false },
    renew: function () { window.__cookiebotRenew++ },
  }
  var konf = document.createElement("script")
  konf.src = "https://consentcdn.cookiebot.com/consentconfig/test/ptrckschrdtr.de/configuration.js"
  document.head.appendChild(konf)
  var stil = document.createElement("style")
  stil.textContent = "#CybotCookiebotDialog{visibility:hidden}"
  document.head.appendChild(stil)
  function imBody() {
    var f = document.createElement("iframe")
    f.src = "https://consentcdn.cookiebot.com/sdk/bc-v5.min.html"
    f.setAttribute("style", "display:none")
    document.body.appendChild(f)
    var d = document.createElement("div")
    d.id = "CybotCookiebotDialog"
    d.setAttribute("style", "display:none")
    document.body.appendChild(d)
    new Image().src = "https://imgsct.cookiebot.com/1.gif"
    var x = new XMLHttpRequest()
    x.open("GET", "https://consentcdn.cookiebot.com/consentconfig/test.json")
    x.send()
    window.__cookiebotFertig = true
    // Wie das echte uc.js (Cookiebot-Doku): ist bereits eingewilligt, kommen CookiebotOnConsentReady und CookiebotOnAccept beim Laden
    ${ereignisse ? `setTimeout(function () {
      window.dispatchEvent(new Event("CookiebotOnConsentReady"))
      if (${statistik && ereignisse === "bereit-und-accept"}) window.dispatchEvent(new Event("CookiebotOnAccept"))
    }, 0)` : ""}
  }
  document.body ? imBody() : document.addEventListener("DOMContentLoaded", imBody)
})()`
}

type Netz = { extern: string[]; unerwartet: string[]; posthog: string[] }

/** Fängt jeden fremden Host ab (siehe Kopf). */
async function netzAbschotten(context: BrowserContext, statistik: boolean, cookiebot: { halten?: Promise<void>; ereignisse?: false | "nur-bereit" | "bereit-und-accept" } = {}): Promise<Netz> {
  const netz: Netz = { extern: [], unerwartet: [], posthog: [] }
  await context.route(
    (url) => url.hostname !== "127.0.0.1" && url.hostname !== "localhost",
    async (route) => {
      const url = new URL(route.request().url())
      netz.extern.push(url.href)
      // CORS wie die echten Dienste (array.js lädt mit crossorigin, PostHog sendet per fetch)
      const cors = {
        "Access-Control-Allow-Origin": route.request().headers()["origin"] ?? "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      }
      if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors })
      const js = (body: string) => route.fulfill({ status: 200, contentType: "text/javascript", body, headers: cors })
      const json = (body = "{}") => route.fulfill({ status: 200, contentType: "application/json", body, headers: cors })
      if (POSTHOG_HOSTS.includes(url.hostname)) netz.posthog.push(url.href)
      switch (url.hostname) {
        case "consent.cookiebot.com":
          if (url.pathname !== "/uc.js") return route.fulfill({ status: 204 })
          if (cookiebot.halten) await cookiebot.halten // uc.js bleibt unterwegs, bis der Test es freigibt (kein fester Zeitpuffer)
          return js(falschesCookiebot(statistik, cookiebot.ereignisse))
        case "consentcdn.cookiebot.com":
          if (url.pathname.endsWith(".js")) return js("")
          if (url.pathname.endsWith(".html")) return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>cb</title>" })
          return json()
        case "imgsct.cookiebot.com":
          return route.fulfill({ status: 200, contentType: "image/gif", body: PIXEL })
        case "eu.i.posthog.com":
          if (url.pathname === "/static/array.js") return js(ARRAY_JS)
          if (url.pathname.endsWith(".js")) return js("")
          return json(url.pathname.startsWith("/flags") || url.pathname.startsWith("/decide") ? '{"featureFlags":{},"flags":{}}' : "{}")
        case "eu-assets.i.posthog.com":
          return url.pathname.endsWith(".js") ? js("") : json()
        default:
          netz.unerwartet.push(url.href)
          return route.abort()
      }
    }
  )
  return netz
}

type Verletzung = { direktive: string; blockiert: string; probe: string; quelle: string }

/** Sammelt securitypolicyviolation-Ereignisse und hält das Theme beim Einfügen von <body> fest (vor dem ersten Paint). */
async function beobachten(page: Page) {
  const fehler: string[] = []
  page.on("console", (m) => m.type() === "error" && fehler.push(m.text()))
  page.on("pageerror", (e) => fehler.push(e.message))
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: unknown[]; __themeBeimBody?: string | null }
    w.__csp = []
    document.addEventListener("securitypolicyviolation", (e) =>
      w.__csp.push({ direktive: e.effectiveDirective, blockiert: e.blockedURI, probe: e.sample, quelle: `${e.sourceFile}:${e.lineNumber}` })
    )
    // sendBeacon geht am Abfangen eventuell vorbei: hier nur aufzeichnen, nie senden
    navigator.sendBeacon = (url: string | URL) => {
      ;(window as unknown as { __beacons: string[] }).__beacons ??= []
      ;(window as unknown as { __beacons: string[] }).__beacons.push(String(url))
      return true
    }
    new MutationObserver((_m, obs) => {
      if (document.body) {
        w.__themeBeimBody = document.documentElement.getAttribute("data-theme")
        obs.disconnect()
      }
    }).observe(document, { childList: true, subtree: true })
  })
  return {
    fehler,
    verletzungen: () => page.evaluate(() => (window as unknown as { __csp: Verletzung[] }).__csp),
  }
}

async function bereit(page: Page) {
  await page.waitForSelector("body[data-bereit]")
  await page.waitForFunction(() => (window as unknown as { __cookiebotFertig?: boolean }).__cookiebotFertig === true)
}

/** Einmal ganz nach unten und zurück (Scroll-Animationen, Lazy-Bilder), dann kurz warten, damit späte Verletzungen ankommen. */
async function durchscrollen(page: Page) {
  await page.evaluate(async () => {
    const schritt = innerHeight * 0.8
    for (let y = 0; y < document.documentElement.scrollHeight; y += schritt) {
      scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
    scrollTo(0, 0)
  })
  await page.waitForTimeout(400)
}

test.describe("Antwort-Header (wie vercel.json)", () => {
  const erwartet = (pfad: string) => REGELN.filter((r) => sourceZuRegex(r.source).test(pfad)).flatMap((r) => r.headers)

  test("HTML, fingerprintete Dateien, Schriften, PDF, Textdateien und 404 tragen genau die Header aus vercel.json", async ({ request }) => {
    const astroDatei = readdirSync(join(DIST, "_astro")).find((n) => n.endsWith(".js"))!
    for (const pfad of ["/", "/blog", "/blog/", `/_astro/${astroDatei}`, "/fonts/geist-latin.woff2", "/cv.pdf", "/llms.txt", "/js/kopf.js", "/gibt-es-nicht"]) {
      const antwort = await request.get(pfad)
      expect(antwort.status(), pfad).toBe(pfad === "/gibt-es-nicht" ? 404 : 200)
      const h = antwort.headers()
      for (const { key, value } of erwartet(pfad)) expect(h[key.toLowerCase()], `${pfad}: ${key}`).toBe(value)
      // Sicherheits-Header überall, auch auf der 404 und auf Dateien
      for (const { key, value } of ALLGEMEIN) expect(h[key.toLowerCase()], `${pfad}: ${key}`).toBe(value)
    }
    const hHtml = (await request.get("/")).headers()
    expect(hHtml["cache-control"], "HTML ohne langes Caching").toBeUndefined()
    expect((await request.get(`/_astro/${astroDatei}`)).headers()["cache-control"]).toBe("public, max-age=31536000, immutable")
    expect((await request.get("/fonts/geist-latin.woff2")).headers()["cache-control"]).toBe("public, max-age=86400, stale-while-revalidate=604800")
    expect((await request.get(KOPF_SKRIPT_PFAD)).headers()["cache-control"], "Kopf-Skript hat einen festen Namen: kein immutable").toBeUndefined()
  })

  test("cv.pdf: Content-Type application/pdf trotz nosniff, keine Content-Disposition, Datei ist ein PDF", async ({ request }) => {
    const antwort = await request.get("/cv.pdf")
    expect(antwort.headers()["content-type"]).toBe("application/pdf")
    expect(antwort.headers()["x-content-type-options"]).toBe("nosniff")
    expect(antwort.headers()["content-disposition"]).toBeUndefined()
    expect((await antwort.body()).subarray(0, 5).toString()).toBe("%PDF-")
  })
})

test.describe("Seiten unter der CSP: keine Verletzungen, keine Konsolenfehler", () => {
  for (const pfad of SEITEN) {
    for (const theme of ["light", "dark"] as const) {
      test(`${pfad} (${theme}), ohne Statistik-Einwilligung`, async ({ page, context }) => {
        const netz = await netzAbschotten(context, false)
        const b = await beobachten(page)
        await page.addInitScript((t) => localStorage.setItem("theme", t), theme)
        await page.goto(pfad)
        await bereit(page)
        await durchscrollen(page)
        expect(await b.verletzungen()).toEqual([])
        // /404 antwortet mit Status 404, das meldet Chromium für das Dokument selbst als Konsolenfehler (genau einmal)
        expect(b.fehler).toEqual(pfad === "/404" ? ["Failed to load resource: the server responded with a status of 404 (Not Found)"] : [])
        // Theme stand schon beim Einfügen von <body> fest (kein Hell-Blitz, Kopf-Skript läuft unter der CSP)
        expect(await page.evaluate(() => (window as unknown as { __themeBeimBody?: string }).__themeBeimBody)).toBe(theme)
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
        await expect(page.locator("html")).toHaveAttribute("data-js", "")
        // ohne Einwilligung keine einzige Anfrage an PostHog, kein unbekannter Host
        expect(netz.posthog).toEqual([])
        expect(netz.unerwartet).toEqual([])
        expect(await page.evaluate(() => typeof (window as unknown as { posthog?: unknown }).posthog)).toBe("undefined")
      })
    }
  }
})

test.describe("PostHog unter der CSP (gestubbt, sendet nie echt)", () => {
  test("Einwilligung besteht: array.js vom erlaubten Host, Bibliothek startet, keine Verletzung, Seitenwechsel bleibt sauber", async ({ page, context }) => {
    const netz = await netzAbschotten(context, true)
    const b = await beobachten(page)
    await page.goto("/")
    await bereit(page)
    await page.waitForFunction(() => (window as unknown as { posthog?: { __loaded?: boolean } }).posthog?.__loaded === true)
    expect(netz.posthog).toContain("https://eu.i.posthog.com/static/array.js")
    // Client-Router-Wechsel: PostHog bleibt geladen, wird nicht doppelt geladen
    await page.getByRole("navigation", { name: "Hauptnavigation" }).locator('a[href="/blog"]').click()
    await page.waitForURL("**/blog")
    await page.waitForSelector("body[data-bereit]")
    await page.waitForTimeout(1500)
    expect(netz.posthog.filter((u) => u.endsWith("/static/array.js"))).toHaveLength(1)
    // Beleg für den Bericht: welche PostHog-Adressen die Bibliothek angefragt hat (alle gestubbt)
    test.info().annotations.push({ type: "posthog-anfragen", description: [...new Set(netz.posthog.map((u) => u.split("?")[0]))].join(" ") })
    for (const u of netz.extern) expect(ERLAUBTE_HOSTS.has(new URL(u).hostname), u).toBe(true)
    expect(netz.unerwartet).toEqual([])
    expect(await b.verletzungen()).toEqual([])
    expect(b.fehler).toEqual([])
  })

  test("Zustimmung erst im Banner (CookiebotOnAccept): vorher nichts, danach PostHog", async ({ page, context }) => {
    const netz = await netzAbschotten(context, false)
    const b = await beobachten(page)
    await page.goto("/about")
    await bereit(page)
    await page.waitForTimeout(800)
    expect(netz.posthog).toEqual([])
    await page.evaluate(() => {
      const w = window as unknown as { Cookiebot: { consent: { statistics: boolean } } }
      w.Cookiebot.consent.statistics = true
      window.dispatchEvent(new Event("CookiebotOnAccept"))
    })
    await page.waitForFunction(() => (window as unknown as { posthog?: { __loaded?: boolean } }).posthog?.__loaded === true)
    expect(netz.posthog[0]).toBe("https://eu.i.posthog.com/static/array.js")
    expect(await b.verletzungen()).toEqual([])
    expect(b.fehler).toEqual([])
  })

  test("Ablehnen und „Cookie-Einstellungen“: kein PostHog, renew() wird aufgerufen", async ({ page, context }) => {
    const netz = await netzAbschotten(context, false)
    const b = await beobachten(page)
    await page.goto("/impressum")
    await bereit(page)
    await page.evaluate(() => window.dispatchEvent(new Event("CookiebotOnDecline")))
    await page.locator("[data-cookie-einstellungen]").first().click()
    expect(await page.evaluate(() => (window as unknown as { __cookiebotRenew: number }).__cookiebotRenew)).toBe(1)
    await page.waitForTimeout(500)
    expect(netz.posthog).toEqual([])
    expect(await b.verletzungen()).toEqual([])
  })
})

/** Hält uc.js zurück, bis `freigeben()` aufgerufen wird: Reihenfolge statt Zeitpuffer. */
function zurueckhalten() {
  let freigeben!: () => void
  const halten = new Promise<void>((r) => (freigeben = r))
  return { halten, freigeben }
}

test.describe("Cookiebot kommt spät (uc.js zurückgehalten, wie bei async)", () => {
  test("Einwilligung besteht, uc.js trifft spät ein und meldet NUR CookiebotOnConsentReady: PostHog startet erst dann", async ({ page, context }) => {
    const { halten, freigeben } = zurueckhalten()
    const netz = await netzAbschotten(context, true, { halten, ereignisse: "nur-bereit" })
    const b = await beobachten(page)
    // „load“ wartet auch auf async-Skripte: nur auf den Beginn der Navigation warten, uc.js ist noch unterwegs
    await page.goto("/about", { waitUntil: "commit" })
    await page.waitForSelector("body[data-bereit]")
    expect(await page.evaluate(() => (window as unknown as { Cookiebot?: { consent?: unknown } }).Cookiebot?.consent), "uc.js ist noch nicht da").toBeUndefined()
    // posthog.js hat sein Gate gesetzt; ohne Cookiebot darf nichts an PostHog gehen
    expect(netz.posthog, "vor Eintreffen von Cookiebot nichts an PostHog").toEqual([])
    freigeben()
    await page.waitForFunction(() => (window as unknown as { posthog?: { __loaded?: boolean } }).posthog?.__loaded === true, null, { timeout: 15_000 })
    expect(netz.posthog[0]).toBe("https://eu.i.posthog.com/static/array.js")
    expect(b.fehler).toEqual([])
  })

  test("Einwilligung besteht, uc.js spät, Cookiebot meldet ConsentReady und Accept: PostHog lädt genau einmal", async ({ page, context }) => {
    const { halten, freigeben } = zurueckhalten()
    const netz = await netzAbschotten(context, true, { halten, ereignisse: "bereit-und-accept" })
    await page.goto("/about", { waitUntil: "commit" })
    await page.waitForSelector("body[data-bereit]")
    expect(netz.posthog).toEqual([])
    freigeben()
    await page.waitForFunction(() => (window as unknown as { posthog?: { __loaded?: boolean } }).posthog?.__loaded === true, null, { timeout: 15_000 })
    await page.waitForTimeout(500)
    expect(netz.posthog.filter((u) => u.endsWith("/static/array.js"))).toHaveLength(1)
  })

  test("keine Einwilligung, uc.js spät (ConsentReady ohne Statistik): nie eine PostHog-Anfrage", async ({ page, context }) => {
    const { halten, freigeben } = zurueckhalten()
    const netz = await netzAbschotten(context, false, { halten, ereignisse: "nur-bereit" })
    const b = await beobachten(page)
    await page.goto("/impressum", { waitUntil: "commit" })
    await page.waitForSelector("body[data-bereit]")
    freigeben()
    await page.waitForFunction(() => (window as unknown as { __cookiebotFertig?: boolean }).__cookiebotFertig === true, null, { timeout: 15_000 })
    await page.waitForTimeout(800)
    expect(netz.posthog).toEqual([])
    expect(b.fehler).toEqual([])
  })

  test("Zustimmung im Banner nach spätem uc.js: PostHog startet erst dann", async ({ page, context }) => {
    const { halten, freigeben } = zurueckhalten()
    const netz = await netzAbschotten(context, false, { halten, ereignisse: "nur-bereit" })
    await page.goto("/about", { waitUntil: "commit" })
    freigeben()
    await page.waitForFunction(() => (window as unknown as { __cookiebotFertig?: boolean }).__cookiebotFertig === true, null, { timeout: 15_000 })
    expect(netz.posthog).toEqual([])
    await page.evaluate(() => {
      const w = window as unknown as { Cookiebot: { consent: { statistics: boolean } } }
      w.Cookiebot.consent.statistics = true
      window.dispatchEvent(new Event("CookiebotOnAccept"))
    })
    await page.waitForFunction(() => (window as unknown as { posthog?: { __loaded?: boolean } }).posthog?.__loaded === true)
    expect(netz.posthog[0]).toBe("https://eu.i.posthog.com/static/array.js")
  })

  test("Widerruf nach dem Laden: PostHog wird ausgeschaltet (opt_out_capturing), erneute Einwilligung schaltet ein", async ({ page, context }) => {
    const netz = await netzAbschotten(context, true, { ereignisse: "bereit-und-accept" })
    await page.goto("/about")
    await page.waitForFunction(() => (window as unknown as { posthog?: { __loaded?: boolean } }).posthog?.__loaded === true, null, { timeout: 15_000 })
    expect(netz.posthog.length).toBeGreaterThan(0)
    const opt = () => page.evaluate(() => (window as unknown as { posthog: { has_opted_out_capturing: () => boolean } }).posthog.has_opted_out_capturing())
    expect(await opt()).toBe(false)
    await page.evaluate(() => {
      const w = window as unknown as { Cookiebot: { consent: { statistics: boolean } } }
      w.Cookiebot.consent.statistics = false
      window.dispatchEvent(new Event("CookiebotOnAccept"))
    })
    expect(await opt()).toBe(true)
    await page.evaluate(() => {
      const w = window as unknown as { Cookiebot: { consent: { statistics: boolean } } }
      w.Cookiebot.consent.statistics = true
      window.dispatchEvent(new Event("CookiebotOnAccept"))
    })
    expect(await opt()).toBe(false)
  })
})

/**
 * Zeichnet jeden Aufruf von `opt_in_capturing` der echten PostHog-Bibliothek samt Argument auf (Stub-Umgebung, es gehen nie Daten raus).
 * Der Haken sitzt in einem Setter auf window.posthog, damit er greift, sobald die Bibliothek das Stub ersetzt, also vor `loaded`.
 * `opt_in_capturing()` ohne `captureEventName: false` würde in der Bibliothek ein `$opt_in`-Ereignis erzeugen; die Tests prüfen
 * deshalb Aufrufanzahl und Argument. (Ereignisse selbst lassen sich unter dem Stub nicht beobachten: die Bibliothek legt ihre
 * Sendewarteschlange erst nach der echten Remote-Konfiguration an und verwirft `capture` bis dahin.)
 */
async function optInAufzeichnen(page: Page) {
  await page.addInitScript(() => {
    let echt: unknown
    const w = window as unknown as { __optIn: unknown[] }
    w.__optIn = []
    Object.defineProperty(window, "posthog", {
      configurable: true,
      get: () => echt,
      set: (v: object) => {
        echt = v
        // am Prototyp: die Bibliothek übergibt `loaded` die Instanz, nicht zwingend dasselbe Objekt wie window.posthog
        const proto = (v ? Object.getPrototypeOf(v) : null) as { opt_in_capturing?: (o?: unknown) => unknown; __qaHaken?: boolean } | null
        if (proto && typeof proto.opt_in_capturing === "function" && !proto.__qaHaken) {
          proto.__qaHaken = true
          const orig = proto.opt_in_capturing
          proto.opt_in_capturing = function (this: unknown, o?: unknown) {
            w.__optIn.push(o ?? null)
            return orig.call(this, o)
          }
        }
      },
    })
  })
}

const optInAufrufe = (page: Page) => page.evaluate(() => (window as unknown as { __optIn: unknown[] }).__optIn)

test.describe("Einwilligung und Opt-in/Opt-out von PostHog (nur Stub, keine echten Ereignisse)", () => {
  // Token wie im gebauten Skript, damit der Test den Speicherschlüssel von PostHog kennt
  const TOKEN = () => readFileSync(join(DIST, "js/posthog.js"), "utf8").match(/phc_[A-Za-z0-9]+/)![0]
  const geladen = (page: Page) =>
    page.waitForFunction(() => (window as unknown as { posthog?: { __loaded?: boolean } }).posthog?.__loaded === true, null, { timeout: 15_000 })

  test("Einwilligung besteht, ConsentReady und Accept kommen nacheinander: kein opt_in_capturing-Aufruf", async ({ page, context }) => {
    await netzAbschotten(context, true, { ereignisse: "bereit-und-accept" })
    await optInAufzeichnen(page)
    await page.goto("/about")
    await geladen(page)
    await page.waitForTimeout(800)
    expect(await optInAufrufe(page)).toEqual([])
  })

  test("dauerhaftes Opt-out aus früherem Widerruf, Cookiebot meldet nur ConsentReady: PostHog ist danach wieder eingeschaltet", async ({ page, context }) => {
    await netzAbschotten(context, true, { ereignisse: "nur-bereit" })
    await optInAufzeichnen(page)
    // früherer Widerruf: PostHog speichert Opt-out je nach Einstellung in localStorage oder Cookie, beides setzen
    await page.addInitScript((t) => {
      localStorage.setItem(`__ph_opt_in_out_${t}`, "0")
      document.cookie = `__ph_opt_in_out_${t}=0; path=/`
    }, TOKEN())
    await page.goto("/about")
    await geladen(page)
    // Ergebnis: wieder eingeschaltet (Speicher „1“, kein Opt-out mehr). Dass dabei kein $opt_in entsteht (captureEventName: false), belegt der
    // vm-Test in tests/cookiebot-laden.test.mjs am loaded-Callback; im Browser lassen sich Ereignisse unter dem Stub nicht beobachten
    // (die Bibliothek verwirft capture, bis die Remote-Konfiguration echt eintrifft) und der Aufruf geschieht innerhalb der Bibliothek.
    await expect
      .poll(() => page.evaluate(() => (window as unknown as { posthog: { has_opted_out_capturing: () => boolean } }).posthog.has_opted_out_capturing()), { timeout: 10_000 })
      .toBe(false)
    expect(await page.evaluate((t) => localStorage.getItem(`__ph_opt_in_out_${t}`), TOKEN())).toBe("1")
  })

  test("Widerruf im Banner und erneute Einwilligung: ein opt_in_capturing, ohne Ereignis", async ({ page, context }) => {
    await netzAbschotten(context, true, { ereignisse: "bereit-und-accept" })
    await optInAufzeichnen(page)
    await page.goto("/about")
    await geladen(page)
    await page.evaluate(() => {
      const w = window as unknown as { Cookiebot: { consent: { statistics: boolean } } }
      w.Cookiebot.consent.statistics = false
      window.dispatchEvent(new Event("CookiebotOnAccept"))
    })
    await page.evaluate(() => {
      const w = window as unknown as { Cookiebot: { consent: { statistics: boolean } } }
      w.Cookiebot.consent.statistics = true
      window.dispatchEvent(new Event("CookiebotOnAccept"))
    })
    expect(await optInAufrufe(page)).toEqual([{ captureEventName: false }])
  })
})

test.describe("Funktionen unter der CSP", () => {
  test("Lichtband: WebGL-Kontext läuft, Canvas hat Größe", async ({ page, context }) => {
    await netzAbschotten(context, false)
    const b = await beobachten(page)
    await page.goto("/")
    await bereit(page)
    await page.waitForTimeout(800)
    const zustand = await page.locator("canvas[data-lichtband]").evaluate((c: HTMLCanvasElement) => {
      const gl = c.getContext("webgl") as WebGLRenderingContext | null
      return { webgl: !!gl && !gl.isContextLost(), breite: c.width, hoehe: c.height }
    })
    expect(zustand.webgl).toBe(true)
    expect(zustand.breite).toBeGreaterThan(0)
    expect(zustand.hoehe).toBeGreaterThan(0)
    expect(await b.verletzungen()).toEqual([])
    expect(b.fehler).toEqual([])
  })

  test("Gradient-Generator: hydriert, PNG-Export lädt herunter (Blob-URL als Download)", async ({ page, context }) => {
    await netzAbschotten(context, false)
    const b = await beobachten(page)
    await page.goto("/tools/gradient-generator")
    await bereit(page)
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some((x) => Object.keys(x).some((k) => k.startsWith("__reactProps"))))
    const download = page.waitForEvent("download")
    await page.getByRole("button", { name: /PNG/ }).first().click()
    const d = await download
    expect(d.suggestedFilename()).toMatch(/^gradient-.+\.png$/)
    const pfad = await d.path()
    const png = readFileSync(pfad!)
    expect(png.subarray(1, 4).toString()).toBe("PNG")
    expect(await b.verletzungen()).toEqual([])
    expect(b.fehler).toEqual([])
  })

  test("Suche: Dialog öffnet mit Strg+K, filtert, Enter navigiert", async ({ page, context }) => {
    await netzAbschotten(context, false)
    const b = await beobachten(page)
    await page.goto("/")
    await bereit(page)
    await page.keyboard.press("Control+k")
    const eingabe = page.getByRole("combobox", { name: "Suche" })
    await expect(eingabe).toBeFocused()
    await eingabe.fill("kontakt")
    await expect(page.getByRole("option")).toHaveCount(1)
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/\/kontakt/)
    await page.waitForSelector("body[data-bereit]")
    expect(await b.verletzungen()).toEqual([])
    expect(b.fehler).toEqual([])
  })

  test("Bewegungs-Gate: steht vor dem ersten Paint, Bündel stoppt den Watchdog", async ({ page, context }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await netzAbschotten(context, false)
    await page.addInitScript(() => {
      requestAnimationFrame(() => {
        ;(window as unknown as { __gateImErstenFrame: boolean }).__gateImErstenFrame = document.documentElement.hasAttribute("data-motion")
      })
    })
    await page.goto("/")
    await bereit(page)
    expect(await page.evaluate(() => (window as unknown as { __gateImErstenFrame: boolean }).__gateImErstenFrame)).toBe(true)
    await page.waitForTimeout(MOTION_WATCHDOG_MS + 500)
    await expect(page.locator("html"), "Watchdog wurde vom Bündel gestoppt").toHaveAttribute("data-motion", "")
  })

  test("Watchdog: scheitert das Bündel, nimmt das Kopf-Skript das Gate nach der Wartezeit zurück", async ({ page, context }) => {
    test.setTimeout(MOTION_WATCHDOG_MS + 30_000)
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await netzAbschotten(context, false)
    await page.route("**/_astro/**", (r) => (r.request().resourceType() === "script" ? r.abort() : r.continue()))
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await expect(page.locator("html")).toHaveAttribute("data-motion", "")
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", /.*/, { timeout: MOTION_WATCHDOG_MS + 3000 })
    for (const el of await page.locator("[data-anim]").all()) await expect(el).toHaveCSS("opacity", "1")
  })
})

test.describe("Die CSP greift wirklich (Gegenproben)", () => {
  test("Inline-Skript, Inline-Handler, eval und fremdes Skript werden blockiert und gemeldet", async ({ page, context }) => {
    const netz = await netzAbschotten(context, false)
    const b = await beobachten(page)
    // gleicher Ursprung, also von script-src 'self' erlaubt; was darin passiert, prüft die CSP der Seite
    await page.route("**/__probe-eval.js", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body: 'try { eval("1 + 1"); window.__evalErgebnis = "lief" } catch (e) { window.__evalErgebnis = e.name }',
      })
    )
    await page.goto("/")
    await bereit(page)
    const ergebnis = await page.evaluate(async () => {
      const w = window as unknown as Record<string, unknown>
      const inline = document.createElement("script")
      inline.textContent = "window.__inlineLief = true"
      document.head.appendChild(inline)
      const knopf = document.createElement("button")
      knopf.setAttribute("onclick", "window.__handlerLief = true")
      document.body.appendChild(knopf)
      knopf.click()
      // eval aus einem Skript der Seite (page.evaluate selbst umgeht die CSP über die DevTools-Schnittstelle)
      const evalErgebnis = await new Promise<string>((fertig) => {
        const s = document.createElement("script")
        s.src = "/__probe-eval.js"
        s.onload = () => fertig(String(w.__evalErgebnis))
        s.onerror = () => fertig("Skript nicht geladen")
        document.head.appendChild(s)
      })
      const fremd = await new Promise<string>((fertig) => {
        const s = document.createElement("script")
        s.src = "https://example.com/x.js"
        s.onload = () => fertig("geladen")
        s.onerror = () => fertig("blockiert")
        document.head.appendChild(s)
      })
      const bild = await new Promise<string>((fertig) => {
        const i = new Image()
        i.onload = () => fertig("geladen")
        i.onerror = () => fertig("blockiert")
        i.src = "https://example.com/x.png"
      })
      await new Promise((r) => setTimeout(r, 200))
      return { inline: w.__inlineLief ?? false, handler: w.__handlerLief ?? false, evalErgebnis, fremd, bild }
    })
    expect(ergebnis).toEqual({ inline: false, handler: false, evalErgebnis: "EvalError", fremd: "blockiert", bild: "blockiert" })
    const v = await b.verletzungen()
    const direktiven = v.map((x) => x.direktive)
    expect(direktiven).toContain("script-src-elem")
    expect(direktiven).toContain("script-src-attr")
    expect(direktiven).toContain("script-src")
    expect(direktiven).toContain("img-src")
    expect(v.some((x) => x.blockiert === "https://example.com/x.js")).toBe(true)
    // blockiert im Browser, nicht erst durch das Abfangen: die Anfrage kam nie im Netz an
    expect(netz.extern.filter((u) => u.includes("example.com"))).toEqual([])
  })

  test("frame-ancestors 'none': die Seite lässt sich nicht einbetten, auch nicht vom eigenen Ursprung", async ({ page, context }) => {
    await netzAbschotten(context, false)
    await page.goto("/robots.txt")
    await page.evaluate(() => {
      const f = document.createElement("iframe")
      f.src = "/impressum"
      document.body.appendChild(f)
    })
    // Chromium ersetzt einen verweigerten Rahmen durch seine Fehlerseite; die Seite selbst wird nie geladen
    await expect.poll(() => page.frames().length).toBe(2)
    const rahmen = page.frames()[1]
    await expect.poll(() => rahmen.url(), { timeout: 5000 }).toMatch(/^chrome-error:/)
    expect(await rahmen.evaluate(() => document.querySelector("[data-schriftfeld]") === null).catch(() => true)).toBe(true)
  })
})
