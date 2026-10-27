import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { expectNoHorizontalOverflow, expectSingleH1, setTheme } from "../helpers"
import { veroeffentlichteBeitraege } from "../content"
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
 * (Zeilenhöhe text/body 26 + Abstand site-footer/gap-links 16). Diese Abweichung ist gewollt und mit Patrick abzustimmen (Figma ergänzen).
 */
const COOKIE_ZEILE_MOBIL = 26 + 16

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

test.describe("Platzhalter vor dem Livegang", () => {
  // Wird in Task 17 scharf (test.fixme -> test): bis Patrick Anschrift, Stand und die [[PRÜFEN: …]]-Stellen ersetzt hat, ist dieser Test erwartet rot.
  test.fixme("kein [[…]] mehr auf /impressum und /datenschutz", async ({ page }) => {
    for (const url of [IMPRESSUM, DATENSCHUTZ]) {
      await laden(page, url)
      expect(await mainText(page), url).not.toContain("[[")
    }
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
      const soll = FIGMA_FOOTER_HOEHE[name] + (name === "mobile" ? COOKIE_ZEILE_MOBIL : 0)
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
