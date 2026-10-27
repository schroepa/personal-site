import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { expectNoHorizontalOverflow, expectSingleH1, setTheme } from "../helpers"
import { cvData } from "../../src/data/cv.ts"
import { buildPdfOptions } from "../../scripts/cv-pdf-options.mjs"

const CV = "/cv"
const ABSCHNITTE = ["Profil", "Erfahrung", "Projekte", "Kompetenzen", "Tech Stack", "Ausbildung", "Sprachen"]
const IDS = ["profil", "erfahrung", "projekte", "kompetenzen", "tech-stack", "ausbildung", "sprachen"]

async function laden(page: Page, url = CV) {
  await page.goto(url)
  await page.waitForSelector("body[data-bereit]")
}

const labels = (page: Page) =>
  page.locator("main section[id] > h2").evaluateAll((els) => els.map((e) => e.textContent!.replace(/\s+/g, " ").trim()))

/** Seitenzahl eines PDFs: Objekte „/Type /Page“, nicht „/Type /Pages“. */
const pdfSeiten = (buf: Buffer) => (buf.toString("latin1").match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length

test.describe("Lebenslauf", () => {
  test("200, eine h1 mit dem Namen, Label, Einleitung", async ({ page }) => {
    const res = await page.goto(CV)
    expect(res?.status()).toBe(200)
    await page.waitForSelector("body[data-bereit]")
    await expectSingleH1(page)
    await expect(page.locator("main h1")).toHaveText(cvData.name)
    await expect(page.locator(".seitenkopf .label")).toContainText("CV 2026")
    await expect(page.locator(".seitenkopf")).toContainText(cvData.title)
  })

  test("indexierbar: Titel, Beschreibung, kein noindex", async ({ page }) => {
    await laden(page)
    await expect(page).toHaveTitle(/^Lebenslauf.*Patrick Schrödter/)
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
    expect(await page.locator('meta[name="description"]').getAttribute("content")).toMatch(/Lebenslauf/)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/cv\/?$/)
  })

  test("kein Foto: kein <img> im Hauptbereich", async ({ page }) => {
    await laden(page)
    await expect(page.locator("main img")).toHaveCount(0)
  })

  test("Abschnitte in Reihenfolge: Profil, Erfahrung, Projekte, Kompetenzen, Tech Stack, Ausbildung, Sprachen", async ({ page }) => {
    await laden(page)
    expect(await labels(page)).toEqual(ABSCHNITTE.map((l) => `→ ${l}`))
    expect(await page.locator("main section[id]").evaluateAll((els) => els.map((e) => e.id))).toEqual(IDS)
  })

  test("Überschriften-Ebenen: h1, dann h2 je Abschnitt, Einträge als h3", async ({ page }) => {
    await laden(page)
    const ebenen = await page.locator("main :is(h1,h2,h3,h4,h5,h6)").evaluateAll((els) => els.map((e) => Number(e.tagName[1])))
    expect(ebenen[0]).toBe(1)
    expect(ebenen.filter((e) => e === 1)).toHaveLength(1)
    expect(ebenen.filter((e) => e === 2)).toHaveLength(7)
    expect(ebenen.every((e, i) => i === 0 || e - ebenen[i - 1] <= 1)).toBe(true)
    // h3: Erfahrung, Projekte, Kompetenzen, Ausbildung
    expect(ebenen.filter((e) => e === 3)).toHaveLength(
      cvData.experience.length + cvData.projects.length + cvData.coreCompetencies.length + cvData.education.length
    )
  })

  test("Profil und Anzahlen entsprechen cv.ts", async ({ page }) => {
    await laden(page)
    await expect(page.locator("#profil p")).toHaveText(cvData.profile)
    const n = (id: string) => page.locator(`#${id} ol > li`)
    await expect(n("erfahrung")).toHaveCount(cvData.experience.length)
    await expect(n("projekte")).toHaveCount(cvData.projects.length)
    await expect(n("kompetenzen")).toHaveCount(cvData.coreCompetencies.length)
    await expect(n("tech-stack")).toHaveCount(cvData.techStack.length)
    await expect(n("ausbildung")).toHaveCount(cvData.education.length)
    await expect(n("sprachen")).toHaveCount(cvData.languages.length)
  })

  test("Erfahrung: Zeitraum, Rolle, Firma, Ort und alle Punkte aus cv.ts", async ({ page }) => {
    await laden(page)
    const items = page.locator("#erfahrung ol > li")
    for (const [i, x] of cvData.experience.entries()) {
      const li = items.nth(i)
      await expect(li.locator(".nummer")).toHaveText(x.period)
      await expect(li.locator("h3")).toHaveText(x.role)
      await expect(li.locator(".beschreibung")).toContainText(`${x.company}, ${x.location}`)
      await expect(li.locator(".beschreibung li")).toHaveText(x.achievements)
    }
  })

  test("Projekte, Kompetenzen, Tech Stack, Ausbildung zeigen die Daten", async ({ page }) => {
    await laden(page)
    expect(await page.locator("#projekte .nummer").allTextContents()).toEqual(cvData.projects.map((p) => `${p.number} · ${p.category}`))
    expect(await page.locator("#projekte h3").allTextContents()).toEqual(cvData.projects.map((p) => p.title))
    expect(await page.locator("#projekte .beschreibung").allTextContents()).toEqual(cvData.projects.map((p) => p.description))
    expect(await page.locator("#kompetenzen h3").allTextContents()).toEqual(cvData.coreCompetencies.map((c) => c.title))
    expect(await page.locator("#tech-stack .nummer").allTextContents()).toEqual(cvData.techStack.map((g) => g.category))
    expect(await page.locator("#tech-stack .titel").allTextContents()).toEqual(cvData.techStack.map((g) => g.items.join(", ")))
    expect(await page.locator("#ausbildung h3").allTextContents()).toEqual(cvData.education.map((e) => e.title))
    expect(await page.locator("#ausbildung .beschreibung").allTextContents()).toEqual(cvData.education.map((e) => e.description))
  })

  test("Sprachen: Name, Stufe als Text mit Lesetext „Level n von 5“, nicht nur Farbe", async ({ page }) => {
    await laden(page)
    const items = page.locator("#sprachen ol > li")
    for (const [i, l] of cvData.languages.entries()) {
      const li = items.nth(i)
      await expect(li.locator(".nummer")).toHaveText(l.name)
      await expect(li.locator(".titel")).toContainText(`Level ${l.level} von 5`) // im Accessibility-Tree vorhanden
      expect((await li.locator(".titel").innerText()).trim().length).toBeGreaterThan(0) // und sichtbarer Text vorhanden
    }
    expect(await page.locator("#sprachen ol [aria-hidden='true']").count()).toBe(0)
  })

  test("PDF-Link: /cv.pdf, download, klarer Name", async ({ page }) => {
    await laden(page)
    const link = page.locator("main a[href='/cv.pdf']").first()
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("download", "")
    await expect(link).toContainText("PDF herunterladen")
  })

  test("Druckansicht: Seitenrahmen verschwindet, Inhalt bleibt", async ({ page }) => {
    await laden(page)
    await page.emulateMedia({ media: "print" })
    for (const sel of ["header", "footer", "[data-schriftfeld]", "[data-papierkorn]", "[data-raster]", ".skip-link", "dialog", "#CybotCookiebotDialog"]) {
      for (const el of await page.locator(sel).all()) await expect(el, sel).toBeHidden()
    }
    await expect(page.locator("main h1")).toBeVisible()
    await expect(page.locator("main a[href='/cv.pdf']")).toBeHidden()
    await expect(page.locator("#erfahrung li").first()).toBeVisible()
    expect((await page.locator("main").innerText()).length).toBeGreaterThan(1000)
  })

  test("Druck im dunklen Theme: trotzdem helle Werte, lesbarer Text auf weißem Papier", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "dark"))
    await page.emulateMedia({ media: "print", colorScheme: "dark" })
    await laden(page)
    expect(await page.evaluate(() => document.documentElement.getAttribute("data-theme"))).toBe("dark")
    const r = await page.evaluate(() => {
      // erwarteter Light-Wert: --theme-text-default im Druck, als Farbe aufgelöst
      const probe = document.createElement("span")
      probe.style.color = "var(--theme-text-default)"
      document.body.append(probe)
      const erwartet = getComputedStyle(probe).color
      probe.remove()
      const farben = ["body", "main p", "#erfahrung .titel", "#erfahrung .beschreibung"].map((s) => getComputedStyle(document.querySelector(s)!).color)
      return { erwartet, farben, body: getComputedStyle(document.body).backgroundColor, html: getComputedStyle(document.documentElement).backgroundColor }
    })
    // Light-Wert (neutral/700 = #5F5853), nicht der Dark-Wert (neutral/50)
    expect(r.erwartet).toBe("rgb(95, 88, 83)")
    expect(r.farben[0]).toBe(r.erwartet)
    expect(r.farben[1]).toBe(r.erwartet)
    // kein dunkler Untergrund
    for (const bg of [r.body, r.html]) expect(["rgba(0, 0, 0, 0)", "rgb(255, 255, 255)"]).toContain(bg)
    // Kontrast aller Textfarben im Hauptbereich gegen Weiß mindestens 4,5:1
    const kontraste = await page.evaluate(() => {
      const lum = (c: string) => {
        const [r, g, b] = c.match(/\d+(\.\d+)?/g)!.slice(0, 3).map(Number).map((v) => {
          const x = v / 255
          return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }
      const farben = new Set<string>()
      for (const el of document.querySelectorAll("main *")) if (el.getClientRects().length > 0 && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())) farben.add(getComputedStyle(el).color)
      return [...farben].map((c) => ({ c, ratio: 1.05 / (lum(c) + 0.05) }))
    })
    expect(kontraste.length).toBeGreaterThan(0)
    for (const k of kontraste) expect(k.ratio, k.c).toBeGreaterThanOrEqual(4.5)
  })

  test("Druckansicht: Einträge brechen nicht mitten durch", async ({ page }) => {
    await laden(page)
    await page.emulateMedia({ media: "print" })
    const avoid = await page.locator("main ol > li").evaluateAll((els) => els.map((e) => getComputedStyle(e).breakInside))
    expect(avoid.length).toBeGreaterThan(0)
    expect(new Set(avoid)).toEqual(new Set(["avoid"]))
  })

  test("PDF aus der Seite: höchstens 3 Seiten, enthält Text", async ({ page, browserName }, info) => {
    test.skip(browserName !== "chromium" || info.project.name !== "desktop", "page.pdf nur in Chromium, einmal reicht")
    await laden(page)
    await page.emulateMedia({ media: "print", colorScheme: "light" })
    const buf = await page.pdf(buildPdfOptions())
    expect(buf.subarray(0, 4).toString()).toBe("%PDF")
    const seiten = pdfSeiten(buf)
    expect(seiten).toBeGreaterThanOrEqual(1)
    expect(seiten).toBeLessThanOrEqual(3)
  })

  test("kein Überlauf, auch mit langem Wort", async ({ page }) => {
    await laden(page)
    await expectNoHorizontalOverflow(page)
    await page.evaluate((w) => {
      document.querySelector("main h1")!.textContent = w
      document.querySelector("#erfahrung h3")!.textContent = w
      document.querySelector("#erfahrung .beschreibung p")!.textContent = w
      document.querySelector("#tech-stack .titel")!.textContent = w
    }, "Donaudampfschifffahrtsgesellschaftskapitaensmuetzenherstellungsfabrikationsunternehmen")
    await expectNoHorizontalOverflow(page)
  })

  test("axe hell und dunkel", async ({ page }) => {
    await laden(page)
    for (const theme of ["light", "dark"] as const) {
      await setTheme(page, theme)
      const result = await new AxeBuilder({ page }).analyze()
      expect(result.violations, theme).toEqual([])
    }
  })
})

test.describe("Lebenslauf ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("alle Abschnitte und Einträge sichtbar", async ({ page }) => {
    await page.goto(CV)
    await expectSingleH1(page)
    for (const id of IDS) await expect(page.locator(`#${id}`)).toBeVisible()
    await expect(page.locator("#erfahrung ol > li")).toHaveCount(cvData.experience.length)
    for (const li of await page.locator("main ol > li").all()) await expect(li).toBeVisible()
    await expect(page.locator("main a[href='/cv.pdf']")).toBeVisible()
  })
})
