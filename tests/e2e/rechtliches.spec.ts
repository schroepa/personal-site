import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { expectNoHorizontalOverflow, expectSingleH1, setTheme, warteAufRuhe } from "../helpers"
import { veroeffentlichteBeitraege } from "../content"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { fremdeHosts, htmlDateien } from "../fremde-hosts.ts"
import { KONTAKT_EMAIL } from "../../src/data/kontakt.ts"
import { EXTERNE_RESSOURCEN, offeneStellen } from "../../src/data/rechtliches.ts"

const IMPRESSUM = "/impressum"
const DATENSCHUTZ = "/datenschutz"
const FEHLER = "/404"
const LANGES_WORT = "Donaudampfschifffahrtsgesellschaftskapitaensmuetzenherstellungsfabrikationsunternehmen" // 80 Zeichen, ohne Trennstelle

/** Höhe des Site-Footers in Figma (Node 265:21793 Desktop/Tablet, 270:1775 Mobil 390): Maße aus der Figma-Datei, nicht aus dem Code. */
const FIGMA_FOOTER_HOEHE = { desktop: 213, tablet: 213, mobile: 405 } as const
/**
 * Figma zeigt unter „Rechtliches“ nur Impressum und Datenschutz. Der Knopf „Cookie-Einstellungen“ (Widerruf, Pflicht durch Cookiebot)
 * kommt hinzu: Auf Desktop und Tablet passt er in die Zeile, auf Mobil (390) bricht er in eine eigene Zeile
 * (Zeilenhöhe text/body + Abstand site-footer/gap-links, aus den CSS-Variablen gelesen). Diese Abweichung ist gewollt und mit Patrick abzustimmen (Figma ergänzen).
 */
async function cookieZeileMobil(page: Page): Promise<number> {
  return page.evaluate(() => {
    const maß = (variable: string) => {
      const probe = document.createElement("div")
      probe.style.cssText = `position:absolute;visibility:hidden;height:var(${variable})`
      document.body.appendChild(probe)
      const h = probe.getBoundingClientRect().height
      probe.remove()
      return h
    }
    return maß("--text-body-line-height") + maß("--site-footer-gap-links")
  })
}

async function laden(page: Page, url: string) {
  await page.goto(url)
  await page.waitForSelector("body[data-bereit]")
}

const abschnittsLabels = (page: Page) =>
  page.locator("main section[id] > h2").evaluateAll((els) => els.map((e) => e.textContent!.replace(/\s+/g, " ").trim()))

const mainText = (page: Page) => page.locator("main").innerText()

test.describe("Impressum", () => {
  test("nennt § 5 DDG und § 18 Abs. 2 MStV, nicht TMG und RStV", async ({ page }) => {
    await laden(page, IMPRESSUM)
    const text = await mainText(page)
    expect(text).toContain("§ 5 DDG")
    expect(text).toContain("§ 18 Abs. 2 MStV")
    expect(text).not.toMatch(/TMG|RStV/)
  })

  test("ein Abschnitt je Pflichtangabe, eine h1, E-Mail aus KONTAKT_EMAIL", async ({ page }) => {
    await laden(page, IMPRESSUM)
    await expectSingleH1(page)
    await expect(page.locator("main h1")).toHaveText("Impressum")
    expect(await abschnittsLabels(page)).toEqual([
      "→ Anbieter",
      "→ Kontakt",
      "→ Verantwortlich",
      "→ Haftung für Inhalte",
      "→ Haftung für Links",
      "→ Urheberrecht",
    ])
    await expect(page.locator("main a[href^='mailto:']")).toHaveAttribute("href", `mailto:${KONTAKT_EMAIL}`)
  })

  test("Name ist überall Schrödter: Text, Titel, JSON-LD (kein „Schröder“)", async ({ page }) => {
    for (const url of [IMPRESSUM, DATENSCHUTZ]) {
      await laden(page, url)
      const text = await mainText(page)
      expect(text, url).toContain("Patrick Schrödter")
      expect(text, url).not.toContain("Schröder")
      expect(await page.title(), url).toContain("Schrödter")
      expect(await page.title(), url).not.toContain("Schröder")
      const ld = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "null")))
      expect(ld.some((d) => d["@type"] === "Person" && d.name === "Patrick Schrödter"), url).toBe(true)
      expect(JSON.stringify(ld), url).not.toContain("Schröder")
      expect(await page.locator("footer").innerText(), url).not.toContain("Schröder")
    }
  })

  test("indexierbar (kein noindex)", async ({ page }) => {
    for (const url of [IMPRESSUM, DATENSCHUTZ]) {
      await laden(page, url)
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
    }
  })
})

test.describe("Datenschutz", () => {
  test("genau sieben nummerierte Abschnitte in Reihenfolge", async ({ page }) => {
    await laden(page, DATENSCHUTZ)
    await expectSingleH1(page)
    await expect(page.locator("main h1")).toHaveText("Datenschutz")
    expect(await abschnittsLabels(page)).toEqual([
      "→ 1 Verantwortlicher",
      "→ 2 Hosting",
      "→ 3 Cookies und Tracking",
      "→ 4 Externe Ressourcen",
      "→ 5 Deine Rechte",
      "→ 6 Beschwerderecht",
      "→ 7 Aktualität",
    ])
  })

  test("nennt Cookiebot, PostHog, Einwilligung und die Rechtsgrundlage", async ({ page }) => {
    await laden(page, DATENSCHUTZ)
    const t3 = await page.locator("#cookies-und-tracking").innerText()
    for (const wort of ["Cookiebot", "PostHog", "Einwilligung", "Art. 6 Abs. 1 lit. a DSGVO", "Cookie-Einstellungen"]) expect(t3).toContain(wort)
    expect(t3).not.toMatch(/keine Cookies|kein Tracking/i)
  })

  test("jeder Host aus EXTERNE_RESSOURCEN steht im Datenschutztext", async ({ page }) => {
    await laden(page, DATENSCHUTZ)
    const text = await mainText(page)
    for (const r of EXTERNE_RESSOURCEN) expect(text, r.host).toContain(r.host)
  })

  test("Fußzeile bietet „Cookie-Einstellungen“ als Knopf neben Impressum und Datenschutz", async ({ page }) => {
    await laden(page, DATENSCHUTZ)
    const fuss = page.getByRole("contentinfo")
    await expect(fuss.getByRole("link", { name: "Impressum" })).toHaveAttribute("href", "/impressum")
    await expect(fuss.getByRole("link", { name: "Datenschutz" })).toHaveAttribute("href", "/datenschutz")
    await expect(fuss.getByRole("button", { name: "Cookie-Einstellungen" })).toBeVisible()
  })
})

test.describe("Cookie-Einstellungen", () => {
  test("Klick und Tastatur rufen Cookiebot.renew() auf, kein Inline-Handler", async ({ page }) => {
    await laden(page, IMPRESSUM)
    await page.evaluate(() => {
      const w = window as unknown as { Cookiebot?: { renew: () => void }; __renew: number }
      w.__renew = 0
      w.Cookiebot = { renew: () => void (w.__renew += 1) }
    })
    const knopf = page.getByRole("contentinfo").getByRole("button", { name: "Cookie-Einstellungen" })
    expect(await knopf.getAttribute("onclick")).toBeNull()
    await knopf.click()
    await knopf.focus()
    await page.keyboard.press("Enter")
    expect(await page.evaluate(() => (window as unknown as { __renew: number }).__renew)).toBe(2)
  })

  test("ohne Cookiebot passiert beim Klick nichts (kein Fehler)", async ({ page }) => {
    const fehler: string[] = []
    page.on("pageerror", (e) => fehler.push(e.message))
    await laden(page, IMPRESSUM)
    await page.evaluate(() => delete (window as unknown as { Cookiebot?: unknown }).Cookiebot)
    await page.getByRole("contentinfo").getByRole("button", { name: "Cookie-Einstellungen" }).click()
    expect(fehler).toEqual([])
  })

  test("nach Client-Navigation löst ein Klick renew() genau einmal aus (Teardown)", async ({ page }) => {
    await laden(page, IMPRESSUM)
    await page.getByRole("contentinfo").getByRole("link", { name: "Datenschutz" }).click()
    await page.waitForURL(/datenschutz/)
    await page.waitForSelector("body[data-bereit]")
    await page.evaluate(() => {
      const w = window as unknown as { Cookiebot?: { renew: () => void }; __renew: number }
      w.__renew = 0
      w.Cookiebot = { renew: () => void (w.__renew += 1) }
    })
    await page.getByRole("contentinfo").getByRole("button", { name: "Cookie-Einstellungen" }).click()
    expect(await page.evaluate(() => (window as unknown as { __renew: number }).__renew)).toBe(1)
  })
})

test.describe("Externe Links im Rechtstext", () => {
  test("öffnen in neuem Tab, mit Hinweis im zugänglichen Namen und noopener", async ({ page }) => {
    for (const url of [IMPRESSUM, DATENSCHUTZ]) {
      await laden(page, url)
      for (const a of await page.locator("main a[href^='http']").all()) {
        await expect(a).toHaveAttribute("target", "_blank")
        await expect(a).toHaveAttribute("rel", /noopener/)
        await expect(a).toHaveAttribute("aria-label", /\(öffnet in neuem Tab\)$/)
      }
    }
    await laden(page, DATENSCHUTZ)
    expect(await page.locator("main a[href^='http']").count()).toBeGreaterThanOrEqual(2)
  })
})

test.describe("Platzhalter vor dem Livegang", () => {
  // Wird in Task 17 scharf (test.fixme -> test): bis Patrick Anschrift, Stand und die [[PRÜFEN: …]]-Stellen ersetzt hat, ist dieser Test erwartet rot.
  test.fixme("kein [[…]] mehr auf /impressum und /datenschutz", async ({ page }) => {
    for (const url of [IMPRESSUM, DATENSCHUTZ]) {
      await laden(page, url)
      expect(await mainText(page), url).not.toContain("[[")
    }
  })

  // Die Aussagen „keine eigenen Ereignisse“ und „Externe Hosts sind nur diese“ im Datenschutztext prüft dieser Test gegen Code und gebaute Seiten.
  // Er braucht ein frisches dist/: in CI Pflicht (fehlt es, schlägt er fehl), lokal wird bei fehlendem oder veraltetem dist/ übersprungen.
  test("keine eigenen PostHog-Ereignisse im Code und keine Fremdhosts auf gebauten Seiten außer EXTERNE_RESSOURCEN", async () => {
    const quellen = (dir: string, muster: RegExp): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n)
        if (statSync(p).isDirectory()) return quellen(p, muster)
        return muster.test(n) ? [p] : []
      })
    const dist = join(process.cwd(), "dist")
    const einstieg = join(dist, "index.html")
    const neuesteQuelle = Math.max(...quellen(join(process.cwd(), "src"), /./).map((p) => statSync(p).mtimeMs))
    const frisch = existsSync(einstieg) && statSync(einstieg).mtimeMs >= neuesteQuelle
    if (!process.env.CI) test.skip(!frisch, "dist/ fehlt oder ist älter als src/: erst `npm run build`")

    const mitCapture = quellen(join(process.cwd(), "src"), /\.(astro|ts|tsx|js|mjs)$/).filter((p) => /posthog\??\.capture\(/.test(readFileSync(p, "utf8")))
    expect(mitCapture, "posthog.capture( im Code").toEqual([])

    expect(existsSync(dist), "dist/ fehlt: in CI vor den Tests `npm run build` ausführen").toBe(true)
    expect(frisch, "dist/ ist älter als src/: erst `npm run build`").toBe(true)
    const erlaubt = new Set([...EXTERNE_RESSOURCEN.map((r) => r.host), "www.ptrckschrdtr.de", "ptrckschrdtr.de", "www.w3.org"])
    const probleme: string[] = []
    for (const datei of htmlDateien(dist)) {
      for (const h of fremdeHosts(readFileSync(datei, "utf8"))) if (!erlaubt.has(h)) probleme.push(`${datei.slice(dist.length)}: ${h}`)
    }
    expect(probleme).toEqual([])
  })

  test("die Stellen aus den Daten stehen sichtbar auf den Seiten (Erinnerung, bis ersetzt)", async ({ page }) => {
    const sichtbar = new Set<string>()
    for (const url of [IMPRESSUM, DATENSCHUTZ]) {
      await laden(page, url)
      for (const m of (await mainText(page)).matchAll(/\[\[[^\]]+\]\]/g)) sichtbar.add(m[0].replace(/\s+/g, " "))
    }
    const erwartet = offeneStellen().map((s) => s.replace(/\s+/g, " "))
    expect([...sichtbar].sort()).toEqual([...new Set(erwartet)].sort())
  })
})

test.describe("404", () => {
  const neueste = veroeffentlichteBeitraege().slice(0, 2)

  test("eine h1, noindex, drei Wege, die zwei neuesten Artikel in Reihenfolge", async ({ page }) => {
    await laden(page, FEHLER)
    await expectSingleH1(page)
    await expect(page.locator("main h1")).toHaveText("Diese Seite gibt es nicht.")
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex")
    await expect(page.locator(".seitenkopf a[href='/']")).toHaveText(/Zur Startseite/)
    await expect(page.locator(".seitenkopf a[href='/projects']")).toHaveText(/Arbeit/)
    await expect(page.locator(".seitenkopf a[href='/blog']")).toHaveText(/Gedanken/)
    expect(await abschnittsLabels(page)).toEqual(["→ Zuletzt geschrieben"])
    const zeilen = page.locator("#zuletzt-geschrieben article")
    await expect(zeilen).toHaveCount(neueste.length)
    expect(neueste.length).toBe(2)
    const hrefs = await zeilen.locator("h3 a").evaluateAll((els) => els.map((e) => e.getAttribute("href")))
    expect(hrefs).toEqual(neueste.map((b) => `/blog/${b.slug}`))
    const titel = await zeilen.locator("h3 a").allTextContents()
    expect(titel).toEqual(neueste.map((b) => b.title))
  })

  test("noindex nur auf der 404, andere Seiten haben kein robots-noindex", async ({ page }) => {
    await laden(page, "/kontakt")
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
  })

  test("unbekannte Adresse zeigt die echte 404-Seite mit Status 404", async ({ page }) => {
    const antwort = await page.goto("/gibt-es-nicht-xyz")
    expect(antwort?.status()).toBe(404)
    await expect(page.locator("main h1")).toHaveText("Diese Seite gibt es nicht.")
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex")
  })

  test("genau ein veröffentlichter Artikel: eine Zeile; keiner: kein Block (gemeinsame Komponente, Prüfseite)", async ({ page }) => {
    await laden(page, "/prototypes/zuletzt-geschrieben")
    const eins = page.locator("#pz-eins article")
    await expect(eins).toHaveCount(1)
    await expect(eins.locator("h3 a")).toHaveText(neueste[0].title)
    await expect(eins.locator("h3 a")).toHaveAttribute("href", `/blog/${neueste[0].slug}`)
    await expect(page.locator("#pz-keiner")).toHaveCount(0)
    await expect(page.locator("[data-fall='keiner'] h2")).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
  })

  test("Kopf und Fuß sind da", async ({ page }) => {
    await laden(page, FEHLER)
    await expect(page.getByRole("banner")).toBeVisible()
    await expect(page.getByRole("contentinfo")).toBeVisible()
  })
})

test.describe("Fußzeile (Figma Site-Footer)", () => {
  for (const url of [IMPRESSUM, FEHLER]) {
    test(`Höhe entspricht Figma (±2 px) auf ${url}`, async ({ page }, testInfo) => {
      await laden(page, url)
      const h = await page.getByRole("contentinfo").evaluate((el) => el.getBoundingClientRect().height)
      const name = testInfo.project.name as keyof typeof FIGMA_FOOTER_HOEHE
      const soll = FIGMA_FOOTER_HOEHE[name] + (name === "mobile" ? await cookieZeileMobil(page) : 0)
      expect(Math.abs(h - soll), `${testInfo.project.name}: ${h} statt ${soll}`).toBeLessThanOrEqual(2)
    })
  }

  test("das feste Schriftfeld verdeckt am Seitenende keinen Footer-Link", async ({ page }) => {
    await laden(page, IMPRESSUM)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const frei = await page.evaluate(() => {
      const feld = document.querySelector("[data-schriftfeld]")!.getBoundingClientRect()
      const unten = Math.max(...Array.from(document.querySelectorAll("footer a, footer button")).map((e) => e.getBoundingClientRect().bottom))
      return feld.top - unten
    })
    expect(frei).toBeGreaterThanOrEqual(0)
  })
})

for (const [name, url] of [
  ["Impressum", IMPRESSUM],
  ["Datenschutz", DATENSCHUTZ],
  ["404", FEHLER],
] as const) {
  test.describe(`${name}: Layout und Zugänglichkeit`, () => {
    test("kein horizontaler Überlauf, auch mit langem Wort", async ({ page }) => {
      await laden(page, url)
      await expectNoHorizontalOverflow(page)
      await page.evaluate((wort) => {
        document.querySelector("main h1")!.textContent = wort
        document.querySelectorAll("main p, main li").forEach((el) => {
          if (el.children.length === 0) el.textContent = wort
        })
        document.querySelectorAll("main h3 a").forEach((el) => (el.textContent = wort))
      }, LANGES_WORT)
      await expectNoHorizontalOverflow(page)
    })

    test("axe hell und dunkel", async ({ page }) => {
      await laden(page, url)
      for (const theme of ["light", "dark"] as const) {
        await setTheme(page, theme)
        await warteAufRuhe(page)
        const result = await new AxeBuilder({ page }).analyze()
        expect(result.violations, theme).toEqual([])
      }
    })
  })
}

test.describe("Rechtliches ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  for (const [url, sektionen] of [
    [IMPRESSUM, 6],
    [DATENSCHUTZ, 7],
    [FEHLER, 1],
  ] as const) {
    test(`${url}: alles sichtbar, eine h1`, async ({ page }) => {
      await page.goto(url)
      await expectSingleH1(page)
      await expect(page.locator("main h1")).toBeVisible()
      await expect(page.locator("main section[id]")).toHaveCount(sektionen)
      for (const s of await page.locator("main section[id]").all()) await expect(s).toBeVisible()
      await expect(page.getByRole("contentinfo")).toBeVisible()
    })
  }
})
