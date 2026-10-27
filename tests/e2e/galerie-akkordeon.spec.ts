import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Locator, type Page } from "@playwright/test"
import { expectNoHorizontalOverflow, setTheme } from "../helpers"

const URL = "/prototypes/komponenten"
const ZEIGER_AB = 768 // erst ab dieser Breite ist es ein Akkordeon, darunter ein Wisch-Streifen

async function laden(page: Page) {
  await page.goto(URL)
  await page.waitForSelector("body[data-bereit]")
}

const wurzel = (page: Page, id: string) => page.locator(`#${id} [data-galerie-akkordeon]`)
const streifen = (root: Locator) => root.locator(":scope > a")
const aktiv = (root: Locator) => root.getAttribute("data-aktiv")
const istAkkordeon = (page: Page) => page.viewportSize()!.width >= ZEIGER_AB

async function box(l: Locator) {
  const b = await l.boundingBox()
  if (!b) throw new Error("keine Box")
  return b
}

test.describe("Galerie-Akkordeon", () => {
  test("Struktur: Gruppe mit Namen, Streifen sind Links, Start auf Streifen 1", async ({ page }) => {
    await laden(page)
    const root = wurzel(page, "galerie-5")
    await expect(root).toHaveAttribute("role", "group")
    expect((await root.getAttribute("aria-label")) ?? "").not.toBe("")
    await expect(streifen(root)).toHaveCount(5)
    await expect(root).toHaveAttribute("data-aktiv", "0")
    for (const a of await streifen(root).all()) expect(await a.getAttribute("href")).toMatch(/^\//)
  })

  test("Fokus-Reihenfolge: Tab erreicht nur den aktiven Streifen", async ({ page }) => {
    await laden(page)
    const root = wurzel(page, "galerie-5")
    const s = streifen(root)
    await expect(s.nth(0)).toHaveAttribute("tabindex", "0")
    for (const i of [1, 2, 3, 4]) await expect(s.nth(i)).toHaveAttribute("tabindex", "-1")
    await s.nth(0).focus()
    await page.keyboard.press("Tab")
    const imRoot = await root.evaluate((el) => el.contains(document.activeElement))
    expect(imRoot).toBe(false)
    await page.keyboard.press("Shift+Tab")
    await expect(s.nth(0)).toBeFocused()
  })

  test("Pfeil links/rechts wechselt aktiv, Home/End springt", async ({ page }) => {
    await laden(page)
    const root = wurzel(page, "galerie-5")
    const s = streifen(root)
    await s.nth(0).focus()
    await page.keyboard.press("ArrowRight")
    expect(await aktiv(root)).toBe("1")
    await expect(s.nth(1)).toBeFocused()
    await expect(s.nth(1)).toHaveAttribute("tabindex", "0")
    await expect(s.nth(0)).toHaveAttribute("tabindex", "-1")
    await page.keyboard.press("ArrowRight")
    expect(await aktiv(root)).toBe("2")
    await page.keyboard.press("ArrowLeft")
    expect(await aktiv(root)).toBe("1")
    await page.keyboard.press("End")
    expect(await aktiv(root)).toBe("4")
    await page.keyboard.press("ArrowRight")
    expect(await aktiv(root)).toBe("4")
    await page.keyboard.press("Home")
    expect(await aktiv(root)).toBe("0")
    await page.keyboard.press("ArrowLeft")
    expect(await aktiv(root)).toBe("0")
  })

  test("Hover 90 ms: 40 ms Überfahrt ändert nichts, 120 ms Absicht aktiviert", async ({ page }) => {
    test.skip(!istAkkordeon(page), "Zeigerlogik gilt für das Akkordeon ab 768")
    await laden(page)
    const root = wurzel(page, "galerie-5")
    await root.scrollIntoViewIfNeeded()
    const s = streifen(root)
    const b = await box(s.nth(3))
    const rb = await box(root)
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
    await page.waitForTimeout(40)
    await page.mouse.move(rb.x + rb.width / 2, rb.y - 20)
    await page.waitForTimeout(250)
    expect(await aktiv(root)).toBe("0")
    // die Streifenlage hat sich nicht verschoben, der Zeiger trifft wieder denselben Streifen
    const b2 = await box(s.nth(3))
    await page.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2)
    await page.waitForTimeout(120)
    await expect.poll(() => aktiv(root)).toBe("3")
  })

  test("Bild hat feste Breite des offenen Streifens (kein Verzerren)", async ({ page }) => {
    test.skip(!istAkkordeon(page), "Fensterbild gilt für das Akkordeon ab 768")
    await laden(page)
    const root = wurzel(page, "galerie-5")
    const s = streifen(root)
    const offenBild = async (i: number) => box(s.nth(i).locator(".bild"))
    const bildBreite = async (i: number) => (await box(s.nth(i).locator("img"))).width
    const vorher = await offenBild(0)
    const imgVorher = await bildBreite(0)
    expect(Math.abs(imgVorher - vorher.width)).toBeLessThanOrEqual(1)
    // geschlossener Streifen: Bild bleibt so breit wie das offene Fenster, wird nur beschnitten
    const geschlossen = await offenBild(2)
    expect(geschlossen.width).toBeLessThan(vorher.width / 2)
    expect(Math.abs((await bildBreite(2)) - imgVorher)).toBeLessThanOrEqual(1)
    await s.nth(0).focus()
    await page.keyboard.press("ArrowRight")
    const nachher = await offenBild(1)
    expect(Math.abs(nachher.width - vorher.width)).toBeLessThanOrEqual(1)
    expect(Math.abs((await bildBreite(1)) - imgVorher)).toBeLessThanOrEqual(1)
    expect(Math.abs((await bildBreite(0)) - imgVorher)).toBeLessThanOrEqual(1)
  })

  test("mit 1 Kapitel kein Fehler, Streifen füllt die Breite", async ({ page }) => {
    await laden(page)
    const fehler: string[] = []
    page.on("pageerror", (e) => fehler.push(String(e)))
    const root = wurzel(page, "galerie-1")
    await expect(streifen(root)).toHaveCount(1)
    await expect(root).toHaveAttribute("data-aktiv", "0")
    const s = streifen(root).first()
    await s.focus()
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("End")
    expect(await aktiv(root)).toBe("0")
    if (istAkkordeon(page)) {
      const rb = await box(root)
      const sb = await box(s)
      expect(Math.abs(sb.width - rb.width)).toBeLessThanOrEqual(1)
    }
    expect(fehler).toEqual([])
  })

  test("Bild mit leerem alt, Klick folgt dem Link des Streifens", async ({ page }) => {
    await laden(page)
    const root = wurzel(page, "galerie-3")
    await expect(root.locator("img").first()).toHaveAttribute("alt", "")
    await expect(streifen(root).first()).toHaveAttribute("href", /\/projects\//)
  })

  test("Wechsel per Fokus (Klick-Fokus) setzt aktiv", async ({ page }) => {
    await laden(page)
    const root = wurzel(page, "galerie-3")
    await streifen(root).nth(2).focus()
    expect(await aktiv(root)).toBe("2")
  })

  test("Kein horizontaler Überlauf der Seite, Streifen laufen nicht aus der Wurzel", async ({ page }) => {
    await laden(page)
    await expectNoHorizontalOverflow(page)
    if (!istAkkordeon(page)) return
    for (const id of ["galerie-1", "galerie-3", "galerie-5"]) {
      const root = wurzel(page, id)
      const rb = await box(root)
      for (const a of await streifen(root).all()) {
        const b = await box(a)
        expect(b.x).toBeGreaterThanOrEqual(rb.x - 1)
        expect(b.x + b.width).toBeLessThanOrEqual(rb.x + rb.width + 1)
      }
    }
  })

  test("Mobil: Streifen gleich breit in einer horizontal wischbaren Reihe", async ({ page }) => {
    test.skip(istAkkordeon(page), "nur unter 768")
    await laden(page)
    const root = wurzel(page, "galerie-5")
    const breiten = await Promise.all((await streifen(root).all()).map(async (a) => (await a.boundingBox())!.width))
    expect(new Set(breiten.map(Math.round)).size).toBe(1)
    const scroll = await root.evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, ox: getComputedStyle(el).overflowX }))
    expect(scroll.sw).toBeGreaterThan(scroll.cw)
    expect(scroll.ox).toBe("auto")
  })

  for (const theme of ["light", "dark"] as const) {
    test(`axe ohne Verstöße (${theme})`, async ({ page }) => {
      await laden(page)
      await setTheme(page, theme)
      const ergebnis = await new AxeBuilder({ page }).include("#galerie-1").include("#galerie-3").include("#galerie-5").analyze()
      expect(ergebnis.violations).toEqual([])
    })
  }
})

test.describe("Galerie-Akkordeon ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("erster Streifen aktiv, alles sichtbar und per Link erreichbar", async ({ page }) => {
    await page.goto(URL)
    const root = wurzel(page, "galerie-5")
    await expect(root).toHaveAttribute("data-aktiv", "0")
    const s = streifen(root)
    await expect(s).toHaveCount(5)
    for (const a of await s.all()) {
      await expect(a).toBeVisible()
      expect(await a.getAttribute("tabindex")).toBeNull()
    }
    const opazitaet = await root.evaluate((el) => [...el.querySelectorAll("*")].map((e) => getComputedStyle(e).opacity))
    expect(opazitaet.every((o) => o === "1")).toBe(true)
    if (istAkkordeon(page)) {
      const b0 = await box(s.nth(0))
      const b1 = await box(s.nth(1))
      expect(b0.width).toBeGreaterThan(b1.width * 3)
    }
  })
})
