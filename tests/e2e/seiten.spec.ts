import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { expectNoHorizontalOverflow, expectSingleH1, setTheme } from "../helpers"
import { KONTAKT_EMAIL, LINKEDIN_URL, WOFUER, ABLAUF } from "../../src/data/kontakt.ts"
import { HALTUNG, KOMPETENZEN, STATIONEN, WERKZEUGE } from "../../src/data/ueber-mich.ts"

const ABOUT = "/about"
const KONTAKT = "/kontakt"
const LANGES_WORT = "Donaudampfschifffahrtsgesellschaftskapitaensmuetzenherstellungsfabrikationsunternehmen" // 80 Zeichen, ohne Trennstelle

async function laden(page: Page, url: string) {
  await page.goto(url)
  await page.waitForSelector("body[data-bereit]")
}

const abschnittsLabels = (page: Page) =>
  page.locator("main section[id] > h2").evaluateAll((els) => els.map((e) => e.textContent!.replace(/\s+/g, " ").trim()))

test.describe("Über mich", () => {
  test("Seitenkopf: eine h1, Label, Einleitung, Aktionen", async ({ page }) => {
    await laden(page, ABOUT)
    await expectSingleH1(page)
    await expect(page.locator("main h1")).toHaveText("Design Engineer aus Berlin.")
    await expect(page.locator(".seitenkopf .label")).toContainText("Über mich")
    await expect(page.locator(".seitenkopf a[href='/cv.pdf']")).toBeVisible()
    await expect(page.locator(".seitenkopf a[href^='https://www.linkedin.com/']")).toHaveAttribute("rel", /noopener/)
  })

  test("kein Foto: kein <img> im Hauptbereich", async ({ page }) => {
    await laden(page, ABOUT)
    await expect(page.locator("main img")).toHaveCount(0)
  })

  test("Abschnitte in Reihenfolge: Haltung, Kompetenzen, Stationen, Werkzeuge, dann Kontakt-Panel", async ({ page }) => {
    await laden(page, ABOUT)
    expect(await abschnittsLabels(page)).toEqual(["→ Haltung", "→ Kompetenzen", "→ Stationen", "→ Werkzeuge"])
    const ok = await page.evaluate(() => {
      const sel = [".seitenkopf", "#haltung", "#kompetenzen", "#stationen", "#werkzeuge", "[data-kontakt]"]
      const els = sel.map((s) => document.querySelector(s)!)
      return els.every((e, i) => !!e && (i === 0 || !!(els[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)))
    })
    expect(ok).toBe(true)
  })

  test("Haltung zeigt die Absätze aus den Daten", async ({ page }) => {
    await laden(page, ABOUT)
    const absaetze = await page.locator("#haltung p").allTextContents()
    expect(absaetze).toEqual(HALTUNG)
  })

  test("NummernListe: <ol> mit Nummer, Titel (h3) und Beschreibung wie in den Daten", async ({ page }) => {
    await laden(page, ABOUT)
    for (const [id, daten, ebene] of [
      ["kompetenzen", KOMPETENZEN, "h3"],
      ["stationen", STATIONEN, "h3"],
      ["werkzeuge", WERKZEUGE, null],
    ] as const) {
      const ol = page.locator(`#${id} ol`)
      await expect(ol).toHaveCount(1)
      const zeilen = await ol.locator("> li").evaluateAll((els) =>
        els.map((li) => ({
          nummer: li.querySelector(".nummer")?.textContent ?? null,
          titel: li.querySelector(".titel")?.textContent ?? null,
          tag: li.querySelector(".titel")?.tagName.toLowerCase() ?? null,
          beschreibung: li.querySelector(".beschreibung")?.textContent ?? null,
        }))
      )
      expect(zeilen).toEqual(
        daten.map((e) => ({ nummer: e.nummer ?? null, titel: e.titel, tag: ebene ?? "p", beschreibung: e.beschreibung ?? null }))
      )
    }
    // Kompetenzen sind durchnummeriert 01 … 04
    expect(KOMPETENZEN.map((e) => e.nummer)).toEqual(["01", "02", "03", "04"])
    const nummern = await page.locator("#kompetenzen .nummer").allTextContents()
    expect(nummern).toEqual(["01", "02", "03", "04"])
  })

  test("Kontakt-Panel mit E-Mail aus KONTAKT_EMAIL", async ({ page }) => {
    await laden(page, ABOUT)
    await expect(page.locator("[data-kontakt] a[href^='mailto:']").first()).toHaveAttribute("href", `mailto:${KONTAKT_EMAIL}`)
  })

  test("JSON-LD enthält die Person", async ({ page }) => {
    await laden(page, ABOUT)
    const ld = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => JSON.parse(e.textContent ?? "null")))
    expect(ld.some((d) => d["@type"] === "Person" && d.name === "Patrick Schröder")).toBe(true)
  })

  test("nicht noindex, kein Überlauf, auch mit langem Wort", async ({ page }) => {
    await laden(page, ABOUT)
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    await page.evaluate((wort) => {
      document.querySelector("main h1")!.textContent = wort
      document.querySelector("#kompetenzen .titel")!.textContent = wort
      document.querySelector("#kompetenzen .beschreibung")!.textContent = wort
      document.querySelector("#haltung p")!.textContent = wort
    }, LANGES_WORT)
    await expectNoHorizontalOverflow(page)
  })

  test("axe hell und dunkel", async ({ page }) => {
    await laden(page, ABOUT)
    for (const theme of ["light", "dark"] as const) {
      await setTheme(page, theme)
      const result = await new AxeBuilder({ page }).analyze()
      expect(result.violations, theme).toEqual([])
    }
  })
})

test.describe("Über mich ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("alle Abschnitte sichtbar", async ({ page }) => {
    await page.goto(ABOUT)
    await expectSingleH1(page)
    for (const id of ["haltung", "kompetenzen", "stationen", "werkzeuge"]) await expect(page.locator(`#${id}`)).toBeVisible()
    await expect(page.locator("#kompetenzen li")).toHaveCount(KOMPETENZEN.length)
    await expect(page.locator("main h1")).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})

test.describe("Kontakt", () => {
  test("Seitenkopf: genau eine h1, Label, E-Mail-Link, LinkedIn, kein <form>", async ({ page }) => {
    await laden(page, KONTAKT)
    await expectSingleH1(page)
    await expect(page.locator("main h1")).toHaveText("Lass uns reden.")
    await expect(page.locator(".seitenkopf .label")).toContainText("Kontakt")
    await expect(page.locator("form")).toHaveCount(0)
    await expect(page.locator(".seitenkopf a[href^='mailto:']")).toHaveAttribute("href", `mailto:${KONTAKT_EMAIL}`)
  })

  test("jeder mailto-Link nutzt KONTAKT_EMAIL", async ({ page }) => {
    await laden(page, KONTAKT)
    const hrefs = await page.locator("main a[href^='mailto:']").evaluateAll((els) => els.map((e) => e.getAttribute("href")))
    expect(hrefs.length).toBeGreaterThanOrEqual(2)
    for (const h of hrefs) expect(h).toBe(`mailto:${KONTAKT_EMAIL}`)
  })

  test("LinkedIn-Links: richtige URL, rel noopener, neuer Tab", async ({ page }) => {
    await laden(page, KONTAKT)
    const links = page.locator("main a[href*='linkedin.com']")
    expect(await links.count()).toBeGreaterThanOrEqual(1)
    for (const a of await links.all()) {
      await expect(a).toHaveAttribute("href", LINKEDIN_URL)
      await expect(a).toHaveAttribute("rel", /noopener/)
      await expect(a).toHaveAttribute("target", "_blank")
    }
  })

  test("Adresse kopieren meldet per aria-live", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {})
    await laden(page, KONTAKT)
    const live = page.locator("[aria-live='polite']").first()
    await expect(live).toHaveText("")
    await page.getByRole("button", { name: /Adresse kopieren/ }).click()
    await expect(live).not.toHaveText("")
    await expect(live).toHaveText(/kopiert|markiert/)
  })

  test("Abschnitte Wofür, Ablauf, Daten in Reihenfolge, Listen aus den Daten", async ({ page }) => {
    await laden(page, KONTAKT)
    expect(await abschnittsLabels(page)).toEqual(["→ Wofür", "→ Ablauf", "→ Daten"])
    const wofuer = await page.locator("#wofuer .titel").allTextContents()
    expect(wofuer).toEqual(WOFUER.map((e) => e.titel))
    const nummern = await page.locator("#ablauf .nummer").allTextContents()
    expect(nummern).toEqual(ABLAUF.map((e) => e.nummer))
    await expect(page.locator("#ablauf ol")).toHaveCount(1)
    await expect(page.locator("#daten")).toContainText("Patrick Schrödter")
  })

  test("nicht noindex, kein Überlauf, auch mit langem Wort", async ({ page }) => {
    await laden(page, KONTAKT)
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
    await expectNoHorizontalOverflow(page)
    await page.evaluate((wort) => {
      document.querySelector("main h1")!.textContent = wort
      document.querySelector("#wofuer .titel")!.textContent = wort
      document.querySelector("#wofuer .beschreibung")!.textContent = wort
    }, LANGES_WORT)
    await expectNoHorizontalOverflow(page)
  })

  test("axe hell und dunkel", async ({ page }) => {
    await laden(page, KONTAKT)
    for (const theme of ["light", "dark"] as const) {
      await setTheme(page, theme)
      const result = await new AxeBuilder({ page }).analyze()
      expect(result.violations, theme).toEqual([])
    }
  })

  test("Navigation und Fußzeile verweisen auf /kontakt", async ({ page }) => {
    await laden(page, KONTAKT)
    await expect(page.locator("header a[href='/kontakt']").first()).toBeVisible().catch(() => {})
    expect(await page.locator("a[href='/kontakt']").count()).toBeGreaterThanOrEqual(2)
    await expect(page.locator("footer a[href='/impressum']")).toHaveCount(1)
    await expect(page.locator("footer a[href='/datenschutz']")).toHaveCount(1)
  })
})

test.describe("Kontakt ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("alles sichtbar, E-Mail bleibt als Link nutzbar", async ({ page }) => {
    await page.goto(KONTAKT)
    await expectSingleH1(page)
    for (const id of ["wofuer", "ablauf", "daten"]) await expect(page.locator(`#${id}`)).toBeVisible()
    await expect(page.locator(".seitenkopf a[href^='mailto:']")).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })
})
