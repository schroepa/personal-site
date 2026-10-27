import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { entwuerfe, erwarteteGedanken, erwarteteProjekte, erwarteteWeitere } from "../content"
import { KONTAKT_EMAIL } from "../../src/data/kontakt"
import { expectNoHorizontalOverflow, expectSingleH1, setTheme } from "../helpers"

/** Anzahl der Projektkarten im Bento, wie im Figma-Entwurf (Knoten 268:533: 4 Karten + „Außerdem“-Liste) */
const BENTO_KARTEN = 4
/** Figma 268:563: „Außerdem“ listet zwei weitere Projekte */
const AUSSERDEM_ANZAHL = 2

async function laden(page: Page) {
  await page.goto("/")
  await page.waitForSelector("body[data-bereit]")
}

test("Reihenfolge der Abschnitte 02–06", async ({ page }) => {
  await laden(page)
  const labels = await page
    .locator("main h2, main [data-kontakt] .label")
    .evaluateAll((els) => els.map((e) => e.textContent!.replace(/\s+/g, " ").trim()))
  expect(labels).toEqual(["→ 02 Über mich", "→ 03 Arbeit", "→ 04 Digital Art", "→ 05 Gedanken", "→ 06 Kontakt", "Lass uns reden."])
  const ids = await page.locator("main section[id]").evaluateAll((els) => els.map((e) => e.id))
  expect(ids).toEqual(["ueber-mich", "arbeit", "digital-art", "gedanken"])
  // Kontakt-Panel kommt zuletzt
  const reihenfolge = await page.evaluate(() => {
    const k = document.querySelector("[data-kontakt]")!
    const g = document.querySelector("#gedanken")!
    return !!(g.compareDocumentPosition(k) & Node.DOCUMENT_POSITION_FOLLOWING)
  })
  expect(reihenfolge).toBe(true)
})

test("genau eine h1, im Einstieg", async ({ page }) => {
  await laden(page)
  await expectSingleH1(page)
  await expect(page.locator("#einstieg h1")).toHaveText(/Ich entwerfe Systeme\.\s*Ich baue sie auch\./)
})

test("Signatur kommt genau einmal vor", async ({ page }) => {
  await laden(page)
  await expect(page.locator(".text-signatur")).toHaveCount(1)
  await expect(page.locator(".text-signatur")).toContainText("Design Engineer.")
  await expect(page.locator(".text-signatur")).toContainText("15+ Jahre.")
})

test("Bento zeigt nur ausgewählte Projekte (featured, nicht weitere), jüngste zuerst", async ({ page }) => {
  await laden(page)
  const slugs = await page.locator("#arbeit [data-projekt]").evaluateAll((els) => els.map((e) => e.getAttribute("data-projekt")))
  expect(slugs).toHaveLength(BENTO_KARTEN)
  expect(slugs).toEqual(erwarteteProjekte(BENTO_KARTEN))
  // „Außerdem“: die jüngsten weiteren Projekte (höchstens AUSSERDEM_ANZAHL), ohne Doppelungen
  const rest = erwarteteWeitere(BENTO_KARTEN).slice(0, AUSSERDEM_ANZAHL)
  const ausserdem = await page.locator("#arbeit .weitere li a").evaluateAll((els) => els.map((e) => e.getAttribute("href")))
  expect(ausserdem).toEqual(rest.map((s) => `/projects/${s}`))
  expect(rest.length).toBeLessThanOrEqual(AUSSERDEM_ANZAHL)
  // jede Karte: h3 mit genau einem Link zur Fallstudie
  for (const s of slugs) {
    await expect(page.locator(`#arbeit [data-projekt="${s}"] h3 > a`)).toHaveAttribute("href", `/projects/${s}`)
  }
  await expect(page.locator("#arbeit a", { hasText: "Alle Projekte" })).toHaveAttribute("href", "/projects")
})

test("Gedanken: 1 groß + 2 klein, jüngste Nicht-Entwürfe", async ({ page }) => {
  await laden(page)
  // Erwartung aus den veröffentlichten Beiträgen: 0 oder 1 große Zeile, der Rest klein (höchstens zwei)
  const veroeffentlicht = erwarteteGedanken().length
  await expect(page.locator("#gedanken .artikel-zeile-gross")).toHaveCount(Math.min(veroeffentlicht, 1))
  await expect(page.locator("#gedanken .artikel-zeile-klein")).toHaveCount(Math.max(0, veroeffentlicht - 1))
  const slugs = await page.locator("#gedanken [data-beitrag]").evaluateAll((els) => els.map((e) => e.getAttribute("data-beitrag")))
  expect(slugs).toEqual(erwarteteGedanken())
  if (veroeffentlicht > 0) {
    const grosser = await page.locator("#gedanken .artikel-zeile-gross").evaluate((e) => e.closest("[data-beitrag]")!.getAttribute("data-beitrag"))
    expect(grosser).toBe(erwarteteGedanken()[0])
  }
  const alle = await page.locator("#gedanken a").evaluateAll((els) => els.map((e) => e.getAttribute("href")))
  for (const d of entwuerfe()) expect(alle.join(" ")).not.toContain(d)
  await expect(page.locator("#gedanken a", { hasText: "Alle Artikel" })).toHaveAttribute("href", "/blog")
})

test("Bento-Raster: Tablet 2 Spalten mit 16 Abstand, Desktop 8 + 4 Spalten", async ({ page }) => {
  await laden(page)
  const b = await page.locator("#arbeit .bento").evaluate((el) => {
    const cs = getComputedStyle(el)
    const karten = [...el.querySelectorAll<HTMLElement>(".karte")].map((k) => k.getBoundingClientRect())
    return { spalten: cs.gridTemplateColumns.split(" ").length, spalt: parseFloat(cs.columnGap), zeile: parseFloat(cs.rowGap), karten: karten.map((r) => r.width) }
  })
  const breite = page.viewportSize()!.width
  if (breite >= 1024) {
    expect(b.karten[0]).toBeGreaterThan(b.karten[1] * 1.9)
  } else if (breite >= 768) {
    expect(b.spalten).toBe(2)
    expect(b.spalt).toBe(16)
    expect(b.zeile).toBe(16)
    expect(b.karten[1]).toBeCloseTo(b.karten[2], 0)
  } else {
    expect(b.karten.every((w) => Math.abs(w - b.karten[0]) < 1)).toBe(true)
  }
})

test("Digital Art: Akkordeon mit Platzhalterkapiteln", async ({ page }) => {
  await laden(page)
  await expect(page.locator("#digital-art [data-galerie-akkordeon] .streifen")).toHaveCount(5)
})

test("Kontakt: E-Mail-Adresse", async ({ page }) => {
  await laden(page)
  await expect(page.locator("[data-kontakt] a[data-email]")).toHaveText(KONTAKT_EMAIL)
})

test("Lichtband: Canvas aria-hidden, Höhe reserviert, Fallback-Verlauf sichtbar", async ({ page }) => {
  await laden(page)
  const canvas = page.locator("canvas[data-lichtband]")
  await expect(canvas).toHaveCount(1)
  await expect(canvas).toHaveAttribute("aria-hidden", "true")
  const r = await page.locator("[data-lichtband-huelle]").evaluate((el) => {
    const cs = getComputedStyle(el)
    const sonde = document.createElement("div")
    const klein = innerWidth < 768
    sonde.style.height = `var(${klein ? "--global-size-640" : innerWidth < 1440 ? "--global-size-720" : "--global-size-800"})`
    document.body.appendChild(sonde)
    const erwartet = getComputedStyle(sonde).height
    sonde.remove()
    return { hoehe: el.getBoundingClientRect().height, erwartet, bild: getComputedStyle(el, "::before").backgroundImage || cs.backgroundImage }
  })
  expect(r.hoehe).toBe(parseFloat(r.erwartet))
  expect(r.bild).toContain("gradient")
})

test("Tab-Reihenfolge: Sprunglink zuerst", async ({ page }) => {
  await laden(page)
  await page.keyboard.press("Tab")
  expect(await page.evaluate(() => document.activeElement?.className)).toContain("skip-link")
  // weitere Tabs folgen der Dokumentreihenfolge
  const reihenfolge: number[] = []
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab")
    reihenfolge.push(
      await page.evaluate(() => {
        const alle = [...document.querySelectorAll("a[href], button")]
        return alle.indexOf(document.activeElement!)
      })
    )
  }
  expect(reihenfolge).toEqual([...reihenfolge].sort((a, b) => a - b))
})

test("kein horizontaler Überlauf", async ({ page }) => {
  await laden(page)
  await expectNoHorizontalOverflow(page)
})

for (const theme of ["light", "dark"] as const) {
  test(`axe ohne Verstöße (${theme})`, async ({ page }) => {
    await laden(page)
    await setTheme(page, theme)
    const ergebnis = await new AxeBuilder({ page }).analyze()
    expect(ergebnis.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
  })
}

test.describe("ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("alle Abschnitte sichtbar, nichts bei opacity 0", async ({ page }) => {
    await page.goto("/")
    for (const selector of ["#einstieg h1", "#ueber-mich h2", "#arbeit h2", "#digital-art h2", "#gedanken h2", "[data-kontakt]"]) {
      await expect(page.locator(selector).first()).toBeVisible()
    }
    await expect(page.locator("canvas[data-lichtband]")).toHaveCount(1)
    const versteckt = await page.evaluate(
      () => [...document.querySelectorAll("main *")].filter((el) => getComputedStyle(el).opacity === "0").length
    )
    expect(versteckt).toBe(0)
  })
})
