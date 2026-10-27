import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Download, type Locator, type Page } from "@playwright/test"

// Verhalten des Grainy Gradient Generators (Task 15b). Diese Tests wurden VOR dem Umbau gegen die alte
// Fassung (mit fertigen UI-Bausteinen statt nativer Regler) geschrieben und nur über Rollen, Texte und Computed Styles formuliert,
// damit sie nach der Umstellung auf native Regler unverändert gelten.

import { expectNoHorizontalOverflow, expectSingleH1, setTheme, warteAufRuhe } from "../helpers"

const URL = "/tools/gradient-generator"

async function laden(page: Page) {
  await page.goto(URL)
  await expect(page.getByRole("button", { name: "Rosé Dawn" }).first()).toBeVisible()
  // Hydriert: React hängt seine Props an die DOM-Knoten (der Server rendert die Knöpfe schon vorher, Klicks davor gingen verloren)
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => Object.keys(b).some((k) => k.startsWith("__reactProps"))))
}

/** Wert eines Reglers: Radix setzt aria-valuenow, ein natives Eingabefeld hat .value. */
const wert = (loc: Locator) =>
  loc.evaluate((e) => Number(e.getAttribute("aria-valuenow") ?? (e as HTMLInputElement).value))

/** Die Farbkugeln der Vorschau: aria-hidden, inline gesetzter Weichzeichner. */
const kugeln = (page: Page) => page.locator('[aria-hidden="true"][style*="blur("]')

async function hintergrundDerVorschau(page: Page) {
  return kugeln(page).first().evaluate((e) => getComputedStyle(e.parentElement!).backgroundColor)
}

async function kornDeckkraft(page: Page) {
  return page.evaluate(() => {
    const k = [...document.querySelectorAll("div")].find((d) => getComputedStyle(d).mixBlendMode === "overlay")
    return k ? Number(getComputedStyle(k).opacity) : null
  })
}

test.describe("Gradient-Generator: Verhalten", () => {
  test("Startzustand: Preset Rosé Dawn, vier Kugeln, Korn 10 %", async ({ page }) => {
    await laden(page)
    await expect(kugeln(page)).toHaveCount(4)
    expect(await hintergrundDerVorschau(page)).toBe("rgb(245, 237, 232)")
    expect(await kornDeckkraft(page)).toBeCloseTo(0.1, 2)
  })

  test("Preset wechseln ändert Hintergrund, Kugelfarbe und Korn", async ({ page }) => {
    await laden(page)
    await page.getByRole("button", { name: "Pale Plum" }).first().click()
    // Pale Plum: bg #ECE8F2, erste Kugel #9880B8, Korn 10
    await expect.poll(() => hintergrundDerVorschau(page)).toBe("rgb(236, 232, 242)")
    await expect(kugeln(page).first()).toHaveCSS("background-color", "rgb(152, 128, 184)")
    // Fig & Cream hat Korn 12
    await page.getByRole("button", { name: "Fig & Cream" }).first().click()
    await expect.poll(() => kornDeckkraft(page)).toBeCloseTo(0.12, 2)
  })

  test("Regler (Korn) ändert die Vorschau, auch per Tastatur", async ({ page }) => {
    await laden(page)
    const korn = page.getByRole("slider").last()
    expect(await wert(korn)).toBe(10)
    await korn.focus()
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    await expect.poll(() => kornDeckkraft(page)).toBeCloseTo(0.12, 2)
    await page.keyboard.press("Home")
    await expect.poll(() => kornDeckkraft(page)).toBeCloseTo(0, 2)
  })

  test("Orb-Regler verändern Weichheit und Position der Kugel", async ({ page }) => {
    await laden(page)
    await page.getByText("Orb 1", { exact: true }).first().click()
    const regler = page.getByRole("slider")
    // Reihenfolge im Orb: Deckkraft, Weichheit, X, Y, Breite, Höhe, danach Korn
    await expect(regler).toHaveCount(7)
    const kugel = kugeln(page).first()
    await expect(kugel).toHaveCSS("filter", "blur(90px)")
    await regler.nth(1).focus()
    await page.keyboard.press("ArrowRight")
    await expect(kugel).toHaveCSS("filter", "blur(91px)")
    await regler.nth(2).focus()
    await page.keyboard.press("End")
    const links = await kugel.evaluate((e) => (e as HTMLElement).style.left)
    expect(links).toBe("130%")
    await regler.nth(0).focus()
    await page.keyboard.press("Home")
    await expect.poll(() => kugel.evaluate((e) => getComputedStyle(e).opacity)).toBe("0")
  })

  test("Farbwähler ändert die Kugelfarbe", async ({ page }) => {
    await laden(page)
    await page.getByText("Orb 1", { exact: true }).first().click()
    const farbe = page.locator('input[type="color"]').first()
    await farbe.fill("#112233")
    await expect(kugeln(page).first()).toHaveCSS("background-color", "rgb(17, 34, 51)")
  })

  test("Export: lädt ein PNG in der gewählten Größe herunter", async ({ page }) => {
    await laden(page)
    const download = page.waitForEvent("download")
    await page.getByRole("button", { name: /PNG/ }).first().click()
    const d = await download
    expect(d.suggestedFilename()).toBe("gradient-rosé-dawn-2100x900.png")
    const png = await bytes(d)
    expect(png.subarray(1, 4).toString()).toBe("PNG")
    expect({ w: png.readUInt32BE(16), h: png.readUInt32BE(20) }).toEqual({ w: 2100, h: 900 })
  })

  test("Export: andere Größe und anderes Preset", async ({ page }) => {
    await laden(page)
    await page.getByRole("button", { name: "Dusty Mauve" }).first().click()
    await page.getByRole("combobox").first().selectOption({ label: "1:1" })
    const download = page.waitForEvent("download")
    await page.getByRole("button", { name: /PNG/ }).first().click()
    const d = await download
    expect(d.suggestedFilename()).toBe("gradient-dusty-mauve-1200x1200.png")
    const png = await bytes(d)
    expect({ w: png.readUInt32BE(16), h: png.readUInt32BE(20) }).toEqual({ w: 1200, h: 1200 })
  })
})

async function bytes(d: Download) {
  const stream = await d.createReadStream()
  const chunks: Buffer[] = []
  for await (const c of stream!) chunks.push(Buffer.from(c as Buffer))
  return Buffer.concat(chunks)
}

test.describe("Gradient-Generator: schmale Ansicht", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) >= 768, "nur Mobil")

  test("Regler sind auch schmal erreichbar und wirken auf die Vorschau", async ({ page }) => {
    // Bis 15b lagen sie hinter einem Knopf „Controls“ in einem Sheet; jetzt stehen sie unter der Vorschau
    await laden(page)
    const korn = page.getByRole("slider").last()
    await korn.scrollIntoViewIfNeeded()
    await korn.focus()
    await page.keyboard.press("End")
    await expect.poll(() => kornDeckkraft(page)).toBeCloseTo(0.25, 2)
  })

  test("Preset und Export gehen auch mobil", async ({ page }) => {
    await laden(page)
    await page.getByRole("button", { name: "Pale Plum" }).first().click()
    await expect.poll(() => hintergrundDerVorschau(page)).toBe("rgb(236, 232, 242)")
    const download = page.waitForEvent("download")
    await page.getByRole("button", { name: /PNG/ }).first().click()
    const png = await bytes(await download)
    expect({ w: png.readUInt32BE(16), h: png.readUInt32BE(20) }).toEqual({ w: 2100, h: 900 })
  })
})

test.describe("Gradient-Generator: Seite", () => {
  test("eine h1, SiteLayout, indexierbar mit Canonical und Open Graph", async ({ page }) => {
    await laden(page)
    await expectSingleH1(page)
    await expect(page.locator("h1")).toHaveText("Grainy Gradient Generator")
    await expect(page).toHaveTitle("Grainy Gradient Generator — Patrick Schrödter")
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/tools\/gradient-generator\/?$/)
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Grainy Gradient Generator/)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Gradient Generator für weiche, körnige Farbverläufe/)
    await expect(page.locator("body[data-bereit]")).toHaveCount(1)
  })

  test("kein horizontaler Überlauf, auch mit offenem Orb", async ({ page }) => {
    await laden(page)
    await expectNoHorizontalOverflow(page)
    await page.getByText("Orb 1", { exact: true }).click()
    await expectNoHorizontalOverflow(page)
  })

  test("axe hell und dunkel (zu und mit offenem Orb)", async ({ page }) => {
    await laden(page)
    await page.getByText("Orb 2", { exact: true }).click()
    for (const theme of ["light", "dark"] as const) {
      await setTheme(page, theme)
      await warteAufRuhe(page)
      const result = await new AxeBuilder({ page }).analyze()
      expect(result.violations, theme).toEqual([])
    }
  })

  test("alle Bedienelemente haben einen Namen und sind per Tastatur erreichbar", async ({ page }) => {
    await laden(page)
    for (const id of ["Orb 1", "Orb 2", "Orb 3", "Orb 4"]) await page.getByText(id, { exact: true }).click()
    const ohneName = await page.evaluate(() => {
      const namen = (e: Element) => {
        const el = e as HTMLInputElement
        return (
          el.getAttribute("aria-label") ||
          [...(el.labels ?? [])].map((l) => l.textContent).join("").trim() ||
          (e.tagName === "BUTTON" ? e.textContent!.trim() : "")
        )
      }
      return [...document.querySelectorAll("main input, main select, main button")].filter((e) => !namen(e)).map((e) => e.outerHTML.slice(0, 80))
    })
    expect(ohneName).toEqual([])
    // Tab-Reihenfolge: zuerst die Presets, am Ende der Export-Knopf
    await page.getByRole("button", { name: "Rosé Dawn" }).focus()
    await page.keyboard.press("Tab")
    await expect(page.getByRole("button", { name: "Dusty Mauve" })).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("button", { name: "Dusty Mauve" })).toHaveAttribute("aria-pressed", "true")
    // Orb-Kopf (summary) lässt sich mit Leertaste öffnen
    await page.locator("summary", { hasText: "Orb 1" }).focus()
    await page.keyboard.press("Space")
    await expect(page.locator("details", { hasText: "Orb 1" })).toHaveAttribute("open", "")
    await page.getByRole("button", { name: /PNG/ }).focus()
    await expect(page.getByRole("button", { name: /PNG/ })).toBeFocused()
  })

  test("immer nur ein Orb offen (details name)", async ({ page }) => {
    await laden(page)
    await page.getByText("Orb 1", { exact: true }).click()
    await page.getByText("Orb 3", { exact: true }).click()
    await expect(page.locator("details[open]")).toHaveCount(1)
  })

  test("Export gibt eine Rückmeldung (ohne Aufblitzen); die leere Statusmeldung bleibt vorher im Accessibility-Baum", async ({ page }) => {
    await laden(page)
    // Vor dem Export: Live-Region ist gerendert (nicht display:none/visibility:hidden), nur ohne Höhe, sonst bliebe die erste Meldung stumm
    const status = page.locator('.gg-meldung[role="status"]')
    await expect(status).toHaveCount(1)
    const vorher = await status.evaluate((e) => ({ display: getComputedStyle(e).display, visibility: getComputedStyle(e).visibility, text: e.textContent }))
    expect(vorher.display).not.toBe("none")
    expect(vorher.visibility).not.toBe("hidden")
    expect(vorher.text).toBe("")
    const d = page.waitForEvent("download")
    await page.getByRole("button", { name: /PNG/ }).click()
    await d
    await expect(page.locator(".gg-meldung")).toContainText("gradient-rosé-dawn-2100x900.png")
    await expect(page.locator(".gg-meldung")).toBeVisible()
  })

  test("Regler haben einen aria-valuetext mit Einheit", async ({ page }) => {
    await laden(page)
    const korn = page.getByRole("slider").last()
    await expect(korn).toHaveAttribute("aria-valuetext", "10 %")
    await korn.focus()
    await page.keyboard.press("ArrowRight")
    await expect(korn).toHaveAttribute("aria-valuetext", "11 %")
    await page.getByText("Orb 1", { exact: true }).click()
    await expect(page.getByRole("slider").nth(1)).toHaveAttribute("aria-valuetext", "90 px")
  })

  test("Fokusring der Presets (erstes und letztes) wird vom scrollenden Streifen nicht abgeschnitten", async ({ page }) => {
    await laden(page)
    await page.keyboard.press("Tab") // Tastaturmodus, damit :focus-visible greift
    for (const name of ["Rosé Dawn", "Blush Mist"]) {
      const knopf = page.getByRole("button", { name })
      await knopf.focus()
      const r = await knopf.evaluate((e) => {
        const cs = getComputedStyle(e)
        const ring = parseFloat(cs.outlineWidth) + parseFloat(cs.outlineOffset)
        const b = e.getBoundingClientRect()
        const c = e.closest(".gg-presets")!.getBoundingClientRect()
        return { stil: cs.outlineStyle, ring, ob: b.top - ring, ub: b.bottom + ring, lb: b.left - ring, rb: b.right + ring, c: { t: c.top, b: c.bottom, l: c.left, r: c.right } }
      })
      expect(r.stil, name).toBe("solid")
      expect(r.ring, name).toBeGreaterThan(0)
      expect(r.ob, `${name} oben`).toBeGreaterThanOrEqual(r.c.t)
      expect(r.ub, `${name} unten`).toBeLessThanOrEqual(r.c.b)
      expect(r.lb, `${name} links`).toBeGreaterThanOrEqual(r.c.l - 0.5)
      expect(r.rb, `${name} rechts`).toBeLessThanOrEqual(r.c.r + 0.5)
    }
  })

  test("reduzierte Bewegung: keine laufenden Animationen", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await laden(page)
    await page.getByText("Orb 1", { exact: true }).click()
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
  })
})

test.describe("Gradient-Generator ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("Überschrift und Hinweis statt eines toten Werkzeugs", async ({ page }) => {
    await page.goto(URL)
    await expectSingleH1(page)
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.locator("main noscript p")).toContainText("braucht JavaScript")
    await expect(page.locator("main noscript p")).toBeVisible()
    await expect(page.locator("[data-gradient-generator]")).toBeHidden()
    await expectNoHorizontalOverflow(page)
  })
})
