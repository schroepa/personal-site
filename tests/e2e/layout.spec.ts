import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { expectNoHorizontalOverflow, expectSingleH1, setTheme } from "../helpers"

const URL = "/prototypes/layout"

/** Seite laden und warten, bis die Skripte des Layouts verdrahtet sind (body[data-bereit]). */
async function laden(page: Page, url = URL) {
  await page.goto(url)
  await page.waitForSelector("body[data-bereit]")
}

/** Im schmalen Layout liegen Farbschema und Suche im Menü: öffnen, falls der Knopf sichtbar ist. */
async function menueOeffnen(page: Page) {
  const knopf = page.getByRole("button", { name: "Menü" })
  if (await knopf.isVisible()) await knopf.click()
}

test.describe("SiteLayout", () => {
  test("hat Skip-Link als erstes fokussierbares Element", async ({ page }) => {
    await laden(page)
    await page.keyboard.press("Tab")
    const active = await page.evaluate(() => {
      const el = document.activeElement as HTMLAnchorElement | null
      return { tag: el?.tagName, href: el?.getAttribute("href"), text: el?.textContent?.trim() }
    })
    expect(active.tag).toBe("A")
    expect(active.href).toBe("#inhalt")
    expect(active.text).toBe("Zum Inhalt springen")
    await expect(page.locator("main#inhalt")).toHaveCount(1)
  })

  test("genau eine h1", async ({ page }) => {
    await laden(page)
    await expectSingleH1(page)
  })

  test("Landmarks banner, main, contentinfo", async ({ page }) => {
    await laden(page)
    await expect(page.getByRole("banner")).toHaveCount(1)
    await expect(page.getByRole("main")).toHaveCount(1)
    await expect(page.getByRole("contentinfo")).toHaveCount(1)
  })

  test("Ebenen Papierkorn, Raster, Schriftfeld sind aria-hidden und liegen unter dem Inhalt", async ({
    page,
  }) => {
    await laden(page)
    const info = await page.evaluate(() => {
      const q = (s: string) => document.querySelector(s) as HTMLElement
      const korn = q("[data-papierkorn]")
      const raster = q("[data-raster]")
      const feld = q("[data-schriftfeld]")
      const main = q("main")
      const before = (a: Element, b: Element) =>
        !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING)
      const cs = (el: HTMLElement) => getComputedStyle(el)
      return {
        hidden: [korn, raster, feld].map((e) => e.getAttribute("aria-hidden")),
        positions: [korn, raster, feld].map((e) => cs(e).position),
        pointer: [korn, raster, feld].map((e) => cs(e).pointerEvents),
        kornBeforeMain: before(korn, main),
        rasterBeforeMain: before(raster, main),
        feldAfterMain: before(main, feld),
        mainPosition: cs(main).position,
        kornImage: cs(korn).getPropertyValue("--korn-hell").length > 0,
        spalten: raster.children.length,
      }
    })
    expect(info.hidden).toEqual(["true", "true", "true"])
    expect(info.positions).toEqual(["absolute", "absolute", "fixed"])
    expect(info.pointer).toEqual(["none", "none", "none"])
    expect(info.kornBeforeMain).toBe(true)
    expect(info.rasterBeforeMain).toBe(true)
    expect(info.feldAfterMain).toBe(true)
    expect(info.mainPosition).toBe("relative")
    expect(info.kornImage).toBe(true)
    expect(info.spalten).toBe(12)
  })

  test("Raster zeigt so viele Spalten, wie --layout-columns vorgibt", async ({ page }) => {
    await laden(page)
    const { columns, visible } = await page.evaluate(() => {
      const raster = document.querySelector("[data-raster]") as HTMLElement
      const columns = Number(getComputedStyle(raster).getPropertyValue("--layout-columns"))
      const visible = [...raster.children].filter(
        (c) => (c as HTMLElement).getBoundingClientRect().height > 0
      ).length
      return { columns, visible }
    })
    expect(visible).toBe(columns)
  })

  test("Papierkorn: Kachel nutzt feTurbulence, Deckkraft folgt dem Token", async ({ page }) => {
    await laden(page)
    await setTheme(page, "light")
    const light = await page.evaluate(() => {
      const korn = document.querySelector("[data-papierkorn]") as HTMLElement
      const src = getComputedStyle(korn).getPropertyValue("--korn-hell")
      const a = getComputedStyle(korn, "::before").opacity
      const b = getComputedStyle(korn, "::after").opacity
      return { src: decodeURIComponent(src), a, b }
    })
    expect(light.src).toContain("feTurbulence")
    expect(light.src).toContain("baseFrequency='.68'")
    expect(light.src).toContain("numOctaves='4'")
    expect(Number(light.a)).toBeCloseTo(0.17, 2)
    expect(Number(light.b)).toBe(0)
    await setTheme(page, "dark")
    const dark = await page.evaluate(() => {
      const korn = document.querySelector("[data-papierkorn]") as HTMLElement
      return {
        a: getComputedStyle(korn, "::before").opacity,
        b: getComputedStyle(korn, "::after").opacity,
      }
    })
    expect(Number(dark.a)).toBe(0)
    expect(Number(dark.b)).toBeCloseTo(0.13, 2)
  })

  test("Schriftfeld klebt unten (bottom 16px)", async ({ page }) => {
    await laden(page)
    const gap = await page.evaluate(() => {
      const r = (document.querySelector("[data-schriftfeld]") as HTMLElement).getBoundingClientRect()
      return window.innerHeight - r.bottom
    })
    expect(gap).toBeCloseTo(16, 0)
  })

  test("Schriftfeld zeigt Blatt und Ortszeit Berlin", async ({ page }) => {
    await laden(page)
    const feld = page.locator("[data-schriftfeld]")
    await expect(feld).toContainText("Prüfblatt")
    await expect(feld.locator("[data-zeit]")).toHaveText(/^\d{2}:\d{2} Uhr$/)
    await expect(feld.locator("[data-raster-wert]")).toContainText("·")
  })

  test("dunkel: kein Hell-Blitz", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("theme", "dark")
      document.addEventListener("DOMContentLoaded", () => {
        ;(window as unknown as { __themeBeiDcl: string | undefined }).__themeBeiDcl =
          document.documentElement.dataset.theme
      })
    })
    await laden(page)
    const theme = await page.evaluate(
      () => (window as unknown as { __themeBeiDcl?: string }).__themeBeiDcl
    )
    expect(theme).toBe("dark")
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
    expect(bg).toBe("rgb(36, 33, 31)")
  })

  test("Theme-Toggle schaltet um und merkt sich die Wahl", async ({ page }) => {
    await laden(page)
    await setTheme(page, "light")
    await menueOeffnen(page)
    const dunkel = page.getByRole("button", { name: "Dunkel" })
    const hell = page.getByRole("button", { name: "Hell" })
    await dunkel.click()
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
    await expect(dunkel).toHaveAttribute("aria-pressed", "true")
    await expect(hell).toHaveAttribute("aria-pressed", "false")
    expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark")
    await hell.click()
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
  })

  test("axe: keine Verstöße in hell und dunkel", async ({ page }) => {
    await laden(page)
    for (const theme of ["light", "dark"] as const) {
      await setTheme(page, theme)
      const result = await new AxeBuilder({ page }).analyze()
      expect(
        result.violations.map((v) => `${theme}: ${v.id} ${v.nodes.map((n) => n.target).join(" | ")}`)
      ).toEqual([])
    }
  })

  test("kein horizontaler Überlauf", async ({ page }) => {
    await laden(page)
    await expectNoHorizontalOverflow(page)
  })

  test("Suche öffnet mit ⌘K, schließt mit Escape, Fokus kehrt zurück", async ({ page }) => {
    await laden(page)
    const dialog = page.getByRole("dialog", { name: "Suche" })
    const trigger = page.getByRole("button", { name: "Suche", exact: true })
    await expect(dialog).toBeHidden()

    await page.keyboard.press("Meta+k")
    await expect(dialog).toBeVisible()
    await expect(page.getByRole("combobox", { name: "Suche" })).toBeFocused()
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()

    await page.keyboard.press("Control+k")
    await expect(dialog).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()

    await menueOeffnen(page)
    await trigger.focus()
    await page.keyboard.press("Enter")
    await expect(dialog).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test("Suche filtert Seiten, meldet leere Treffer, Enter folgt dem Treffer", async ({ page }) => {
    await laden(page)
    await page.keyboard.press("Control+k")
    const input = page.getByRole("combobox", { name: "Suche" })
    const options = page.getByRole("option")
    expect(await options.count()).toBeGreaterThan(3)
    await input.fill("kontakt")
    await expect(options).toHaveCount(1)
    await input.fill("zzzzqqqq")
    await expect(page.getByText("Keine Treffer.")).toBeVisible()
    await input.fill("kontakt")
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/\/kontakt/)
  })
})

test.describe("SiteLayout ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("Inhalt sichtbar mit JavaScript aus", async ({ page }) => {
    await page.goto(URL)
    const main = page.locator("main")
    await expect(main).toBeVisible()
    await expect(main.locator("h1")).toBeVisible()
    await expect(main).toContainText("Dies ist eine Prüfseite")
    const opacity = await main.evaluate((el) => getComputedStyle(el).opacity)
    expect(opacity).toBe("1")
  })
})

test.describe("SiteLayout und Cookiebot", () => {
  test("Cookiebot blockiert: Seite lädt, window.posthog ist undefined", async ({ page }) => {
    await page.route("https://consent.cookiebot.com/**", (route) => route.abort())
    await laden(page)
    await expect(page.locator("main h1")).toBeVisible()
    const posthog = await page.evaluate(() => typeof (window as unknown as { posthog?: unknown }).posthog)
    expect(posthog).toBe("undefined")
  })

  test("Banner überdeckt Schriftfeld nicht", async ({ page }) => {
    await page.route("https://consent.cookiebot.com/**", (route) => route.abort())
    await laden(page)
    await page.evaluate(() => {
      const d = document.createElement("div")
      d.id = "CybotCookiebotDialog"
      d.textContent = "Cookie-Banner (Stand-in)"
      d.style.cssText = "position:fixed;left:0;bottom:0;width:100%;height:120px;"
      document.body.appendChild(d)
    })
    const boxes = await page.evaluate(() => {
      const rect = (s: string) => {
        const r = (document.querySelector(s) as HTMLElement).getBoundingClientRect()
        return { top: r.top, bottom: r.bottom }
      }
      return { dialog: rect("#CybotCookiebotDialog"), feld: rect("[data-schriftfeld]") }
    })
    expect(boxes.dialog.bottom).toBeLessThanOrEqual(boxes.feld.top)
  })
})
