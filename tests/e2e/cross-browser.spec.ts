import { expect, test, type Page } from "@playwright/test"
import { expectNoHorizontalOverflow, warteAufRuhe } from "../helpers"
import { ladeSeite, sammleKonsole, stubExterne } from "../helpers/qa"

// Rauchtest für Firefox und WebKit (`npm run test:cross-browser`, Browser vorher: `npx playwright install firefox webkit`).
// Klein gehalten: die Tiefe (axe, Matrix, Tastatur) läuft in Chromium in qa-alle-routen.spec.ts.
test.setTimeout(60_000)

test.beforeEach(async ({ context }) => {
  await stubExterne(context)
})

const SEITEN = [
  ["Start", "/"],
  ["Artikel", "/blog/design-tokens-in-der-praxis"],
  ["Fallstudie", "/projects/tintfield"],
  ["Über mich", "/about"],
  ["Kontakt", "/kontakt"],
  ["Werkzeug", "/tools/gradient-generator"],
] as const

/** Alle Kernelemente liegen innerhalb des Fensters (Layout lesbar, nichts ragt seitlich hinaus). */
async function layoutInnerhalb(page: Page) {
  const r = await page.evaluate(() => {
    const aus: string[] = []
    for (const sel of ["header", "main", "footer", "main h1"]) {
      const e = document.querySelector(sel)
      if (!e) {
        aus.push(`${sel} fehlt`)
        continue
      }
      const b = e.getBoundingClientRect()
      if (b.left < -1 || b.right > innerWidth + 1) aus.push(`${sel}: ${Math.round(b.left)}..${Math.round(b.right)} von ${innerWidth}`)
      if (b.width < 100) aus.push(`${sel} schmal: ${Math.round(b.width)}`)
    }
    return aus
  })
  expect(r).toEqual([])
}

for (const [name, url] of SEITEN) {
  test(`${name}: rendert ohne Konsolenfehler, ohne Überlauf, Layout im Fenster`, async ({ page }) => {
    const konsole = sammleKonsole(page)
    await ladeSeite(page, url)
    await warteAufRuhe(page)
    // Dev-Werkzeugleiste (Shadow-DOM) hat eigene h1: nur die Seite zählt
    expect(await page.locator("h1").evaluateAll((l) => l.filter((h) => !(h.getRootNode() instanceof ShadowRoot)).length)).toBe(1)
    await expect(page.locator("main h1")).toBeVisible()
    await expectNoHorizontalOverflow(page)
    await layoutInnerhalb(page)
    expect(konsole.eintraege).toEqual([])
  })
}

test("Funktionen, die das CSS nutzt: Unterstützung wird festgehalten, die Seite bleibt lesbar", async ({ page, browserName }) => {
  await ladeSeite(page, "/")
  const f = await page.evaluate(() => ({
    cornerShape: CSS.supports("corner-shape", "squircle"),
    has: CSS.supports("selector(:has(a))"),
    subgrid: CSS.supports("grid-template-columns", "subgrid"),
    dvh: CSS.supports("height", "100dvh"),
    viewTransition: CSS.supports("view-transition-name", "x"),
  }))
  test.info().annotations.push({ type: `features-${browserName}`, description: JSON.stringify(f) })
  // Ohne diese Funktionen muss die Seite trotzdem funktionieren; Pflicht sind nur :has() und dvh-Fallback
  expect(f.has, ":has() wird vom Layout vorausgesetzt").toBe(true)
  await expectNoHorizontalOverflow(page)
  // Eckenform: ohne corner-shape fällt die Rundung auf border-radius zurück (Radius > 0)
  const radius = await page.locator("main a, main button").first().evaluate((e) => getComputedStyle(e).borderTopLeftRadius).catch(() => "0px")
  expect(radius).toBeDefined()
})

test("Menü öffnet im schmalen Layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await ladeSeite(page, "/")
  const knopf = page.getByRole("button", { name: "Menü" })
  await expect(knopf).toBeVisible()
  await expect(knopf).toHaveAttribute("aria-expanded", "false")
  await knopf.click()
  await expect(knopf).toHaveAttribute("aria-expanded", "true")
  await expect(page.getByRole("navigation", { name: "Hauptnavigation" }).getByRole("link").first()).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test("Farbschema umschalten", async ({ page }) => {
  await ladeSeite(page, "/")
  await page.getByRole("button", { name: "Dunkel" }).click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe("rgb(244, 242, 240)")
  await page.getByRole("button", { name: "Hell" }).click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
})

test("Suche: Strg+K öffnet, Escape schließt", async ({ page }) => {
  await ladeSeite(page, "/")
  const dialog = page.getByRole("dialog", { name: "Suche" })
  await page.keyboard.press("Control+k")
  await expect(dialog).toBeVisible()
  await expect(page.getByRole("combobox", { name: "Suche" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(dialog).toBeHidden()
})

test("Lichtband: zeichnet oder fällt ohne Fehler zurück", async ({ page }) => {
  const konsole = sammleKonsole(page)
  await ladeSeite(page, "/")
  await warteAufRuhe(page)
  await page.waitForTimeout(800)
  const z = await page.locator("canvas[data-lichtband]").evaluate((c: HTMLCanvasElement) => {
    const gl = (c.getContext("webgl") || c.getContext("experimental-webgl")) as WebGLRenderingContext | null
    return { webgl: !!gl && !gl.isContextLost(), b: c.width, h: c.height, aktiv: c.closest("[data-lichtband-huelle]")?.hasAttribute("data-aktiv") ?? false }
  })
  test.info().annotations.push({ type: "lichtband", description: JSON.stringify(z) })
  expect(z.b).toBeGreaterThan(0)
  await expect(page.locator("main h1")).toBeVisible()
  expect(konsole.eintraege).toEqual([])
})

test("Bewegungs-Gate: ohne reduzierte Bewegung offen, mit reduzierter Endzustand sofort", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await ladeSeite(page, "/")
  await expect(page.locator("html")).toHaveAttribute("data-motion", /.*/)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await ladeSeite(page, "/")
  await expect(page.locator("html")).not.toHaveAttribute("data-motion", /.*/)
  const durchsichtig = await page.evaluate(() => Array.from(document.querySelectorAll("[data-anim]")).filter((e) => parseFloat(getComputedStyle(e).opacity) < 1).length)
  expect(durchsichtig, "bei reduzierter Bewegung ist alles sofort sichtbar").toBe(0)
})

test("Werkzeug: PNG-Export liefert ein PNG", async ({ page }) => {
  await ladeSeite(page, "/tools/gradient-generator")
  await expect(page.getByRole("button", { name: "Rosé Dawn" }).first()).toBeVisible()
  const download = page.waitForEvent("download")
  await page.getByRole("button", { name: /PNG/ }).first().click()
  const d = await download
  expect(d.suggestedFilename()).toMatch(/\.png$/)
  const stream = await d.createReadStream()
  const chunks: Buffer[] = []
  for await (const c of stream!) chunks.push(Buffer.from(c as Buffer))
  const png = Buffer.concat(chunks)
  expect(png.subarray(1, 4).toString()).toBe("PNG")
})
