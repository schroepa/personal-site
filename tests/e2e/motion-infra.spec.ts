import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

declare global {
  interface Window {
    __lenisCount?: number
  }
}

async function laden(page: Page, url = "/") {
  await page.goto(url)
  await page.waitForSelector("body[data-bereit]")
}

const lenisAnzahl = (page: Page) => page.evaluate(() => window.__lenisCount)
const htmlHatLenis = (page: Page) => page.evaluate(() => document.documentElement.classList.contains("lenis"))

test.describe("Bewegungs-Infrastruktur", () => {
  test("reduced motion: Lenis nicht aktiv (html hat kein .lenis)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await laden(page)
    expect(await htmlHatLenis(page)).toBe(false)
    expect(await lenisAnzahl(page)).toBe(0)
  })

  test("normal: html.lenis vorhanden, genau eine Instanz", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await laden(page)
    await expect(page.locator("html.lenis")).toHaveCount(1)
    expect(await lenisAnzahl(page)).toBe(1)
  })

  test("Laufzeitwechsel der Systemeinstellung erzeugt und zerstört Lenis", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await laden(page)
    expect(await lenisAnzahl(page)).toBe(1)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await expect.poll(() => lenisAnzahl(page)).toBe(0)
    expect(await htmlHatLenis(page)).toBe(false)
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await expect.poll(() => lenisAnzahl(page)).toBe(1)
    expect(await htmlHatLenis(page)).toBe(true)
  })

  test("nach 5 Client-Router-Navigationen und Zurück/Vor existiert genau eine Lenis-Instanz", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await laden(page, "/")
    for (const pfad of ["/blog", "/projects", "/about", "/kontakt", "/"]) {
      await page.evaluate((p) => (window as unknown as { __marker: string }).__marker = p, pfad)
      // Ein Klick auf einen Link im Dokument: der Router fängt ihn ab (die Kopfleiste ist mobil eingeklappt)
      await page.evaluate((p) => {
        const a = document.createElement("a")
        a.href = p
        document.body.append(a)
        a.click()
        a.remove()
      }, pfad)
      await page.waitForURL(`**${pfad}`)
      await page.waitForSelector("body[data-bereit]")
      expect(await lenisAnzahl(page)).toBe(1)
      await expect(page.locator("html.lenis")).toHaveCount(1)
    }
    // Der Router hat die Seite nie neu geladen (Marker aus der ersten Navigation blieb erhalten)
    expect(await page.evaluate(() => (window as unknown as { __marker?: string }).__marker)).toBeTruthy()
    await page.goBack()
    await page.waitForSelector("body[data-bereit]")
    expect(await lenisAnzahl(page)).toBe(1)
    await page.goForward()
    await page.waitForSelector("body[data-bereit]")
    expect(await lenisAnzahl(page)).toBe(1)
    await expect(page.locator("html.lenis")).toHaveCount(1)
  })

  test("Token-Leser: Dauern sind unter reduced motion 0, sonst 750", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await laden(page)
    const lesen = () =>
      page.evaluate(async () => {
        const m = await import("/src/scripts/motion/tokens.ts")
        return {
          dauer: m.readToken("--motion-feder-akkordeon-dauer"),
          feder: m.readSpring("--motion-feder-akkordeon"),
          physik: m.readPhysics("--motion-physik-magnet"),
          glaettung: m.readToken("--motion-scroll-glaettung"),
          reduziert: m.prefersReducedMotion(),
          probe: (() => {
            const el = document.createElement("div")
            el.style.cssText = "transition-duration: var(--motion-feder-akkordeon-dauer)"
            document.body.append(el)
            const wert = getComputedStyle(el).transitionDuration
            el.remove()
            return wert
          })(),
          fehlt: (() => {
            try {
              m.readToken("--gibt-es-nicht")
              return ""
            } catch (e) {
              return (e as Error).message
            }
          })(),
        }
      })
    const normal = await lesen()
    expect(normal.dauer).toBe(750)
    expect(normal.probe).toBe("0.75s")
    expect(normal.feder.visualDuration).toBe(0.75)
    expect(normal.feder.bounce).toBe(0.08)
    expect(normal.physik).toEqual({ stiffness: 380, damping: 24, mass: 0.6 })
    expect(normal.glaettung).toBe(0.085)
    expect(normal.reduziert).toBe(false)
    expect(normal.fehlt).toContain("--gibt-es-nicht")

    await page.emulateMedia({ reducedMotion: "reduce" })
    const reduziert = await lesen()
    expect(reduziert.dauer).toBe(0)
    expect(reduziert.probe).toBe("0s")
    expect(reduziert.feder.visualDuration).toBe(0)
    expect(reduziert.reduziert).toBe(true)
  })

  test("Anker im Inhaltsverzeichnis scrollt zum Ziel und beachtet scroll-margin-top", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await laden(page, "/blog/single-source-of-truth-ist-eine-luege")
    expect(await lenisAnzahl(page)).toBe(1)
    const link = page.locator("[data-inhaltsverzeichnis] a[href^='#']").nth(3)
    const id = decodeURIComponent((await link.getAttribute("href"))!.slice(1))
    if (await link.isVisible()) {
      await link.click()
    } else {
      // Mobil ist das Inhaltsverzeichnis ausgeblendet: gleicher Anker als Link im Dokument
      await page.evaluate((i) => {
        const a = document.createElement("a")
        a.href = `#${i}`
        document.body.append(a)
        a.click()
        a.remove()
      }, id)
    }
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 8000 }).toBeGreaterThan(100)
    const ergebnis = () =>
      page.evaluate((i) => {
        const el = document.getElementById(i)!
        return { top: el.getBoundingClientRect().top, rand: parseFloat(getComputedStyle(el).scrollMarginTop) || 0, y: window.scrollY }
      }, id)
    // Warten, bis die Bewegung zur Ruhe kommt
    let letzte = -1
    await expect
      .poll(async () => {
        const y = (await ergebnis()).y
        const ruhig = Math.abs(y - letzte) < 0.5
        letzte = y
        return ruhig
      }, { timeout: 8000 })
      .toBe(true)
    const e = await ergebnis()
    expect(Math.abs(e.top - e.rand)).toBeLessThan(2)
    expect(await page.evaluate(() => location.hash)).toBe(`#${encodeURIComponent(id)}`.replace(/%2F/g, "/"))
  })

  test("Tastatur: PageDown scrollt", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await laden(page, "/blog/single-source-of-truth-ist-eine-luege")
    await page.locator("body").click({ position: { x: 5, y: 300 } })
    await page.keyboard.press("PageDown")
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100)
  })

  test("Suche: Rad in der Trefferliste scrollt die Liste, nicht die Seite dahinter", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await laden(page, "/blog/single-source-of-truth-ist-eine-luege")
    await page.evaluate(() => window.scrollTo(0, 400))
    await page.waitForTimeout(300)
    const vorher = await page.evaluate(() => window.scrollY)
    await page.keyboard.press("ControlOrMeta+k")
    const dialog = page.locator("dialog[open][data-suche]")
    await expect(dialog).toBeVisible()
    const liste = page.locator("[data-suche-treffer]")
    await expect(liste.locator("a, [role=option]").first()).toBeVisible()
    expect(await liste.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)
    const box = (await liste.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(0, 150)
    await expect.poll(() => liste.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
    await page.waitForTimeout(600)
    expect(await page.evaluate(() => window.scrollY)).toBe(vorher)
  })

  test("Axe, keine Konsolenfehler", async ({ page }) => {
    const fehler: string[] = []
    page.on("console", (m) => m.type() === "error" && fehler.push(m.text()))
    page.on("pageerror", (e) => fehler.push(e.message))
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await laden(page)
    const r = await new AxeBuilder({ page }).analyze()
    expect(r.violations).toEqual([])
    expect(fehler.filter((f) => !/cookiebot|ERR_|Failed to load resource/i.test(f))).toEqual([])
  })
})

test.describe("ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })
  test("Seite bleibt vollständig lesbar, kein Lenis", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1")).toBeVisible()
    await expect(page.locator("html.lenis")).toHaveCount(0)
  })
})
