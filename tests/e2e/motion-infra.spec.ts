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

  test("nach 5 Navigationen über die echte Navigation und Zurück/Vor existiert genau eine Lenis-Instanz", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await laden(page, "/")
    await page.evaluate(() => ((window as unknown as { __marker: string }).__marker = "start"))
    for (const pfad of ["/blog", "/projects", "/about", "/kontakt", "/"]) {
      // Schmal liegt die Navigation hinter dem Menü-Knopf: wie ein Besucher öffnen und den echten Link wählen
      const knopf = page.getByRole("button", { name: "Menü", exact: true })
      if (await knopf.isVisible()) await knopf.click()
      const link = pfad === "/" ? page.locator("header a.logo") : page.getByRole("navigation", { name: "Hauptnavigation" }).locator(`a[href="${pfad}"]`)
      await link.click()
      await page.waitForURL(`**${pfad}`)
      await page.waitForSelector("body[data-bereit]")
      expect(await lenisAnzahl(page)).toBe(1)
      await expect(page.locator("html.lenis")).toHaveCount(1)
    }
    // Der Router hat nie neu geladen: der Marker aus dem ersten Dokument lebt noch
    expect(await page.evaluate(() => (window as unknown as { __marker?: string }).__marker)).toBe("start")
    await page.goBack()
    await page.waitForSelector("body[data-bereit]")
    expect(await lenisAnzahl(page)).toBe(1)
    await page.goForward()
    await page.waitForSelector("body[data-bereit]")
    expect(await lenisAnzahl(page)).toBe(1)
    await expect(page.locator("html.lenis")).toHaveCount(1)
  })

  test("Sekundär: ein im Dokument erzeugter Link (kein Ersatz für die echte Navigation) lässt die Instanz bei 1", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await laden(page, "/")
    await page.evaluate(() => {
      const a = document.createElement("a")
      a.href = "/blog"
      document.body.append(a)
      a.click()
      a.remove()
    })
    await page.waitForURL("**/blog")
    await page.waitForSelector("body[data-bereit]")
    expect(await lenisAnzahl(page)).toBe(1)
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

  /**
   * Löst einen echten Anker aus und liefert die Folge der scrollY-Werte pro Frame (1,5 s lang) samt Start/Ende.
   * Breit: Inhaltsverzeichnis; schmal (Verzeichnis bewusst ausgeblendet): Sprunglink #inhalt per Tab und Enter.
   */
  async function ankerLaufen(page: Page) {
    await laden(page, "/blog/single-source-of-truth-ist-eine-luege")
    const toc = page.locator("[data-inhaltsverzeichnis] a[href^='#']").nth(3)
    const breit = await toc.isVisible()
    const id = breit ? decodeURIComponent((await toc.getAttribute("href"))!.slice(1)) : "inhalt"
    if (!breit) {
      await page.evaluate(() => window.scrollTo(0, 1500))
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)
      await page.keyboard.press("Tab")
      await expect(page.locator(".skip-link")).toBeFocused()
    }
    const start = await page.evaluate(() => window.scrollY)
    await page.evaluate(() => {
      const w = window as unknown as { __proben: number[]; __lenis?: { scrollTo: (...a: unknown[]) => unknown } | null; __scrollToAufrufe: unknown[] }
      // Beobachtung: ruft Lenis' Anker-Handler scrollTo auf? (Lenis verhindert den nativen Sprung nicht, siehe Bericht)
      w.__scrollToAufrufe = []
      if (w.__lenis) {
        const original = w.__lenis.scrollTo.bind(w.__lenis)
        w.__lenis.scrollTo = (...a: unknown[]) => (w.__scrollToAufrufe.push(a[0]), original(...a))
      }
      w.__proben = []
      const ende = performance.now() + 1500
      const tick = () => {
        w.__proben.push(window.scrollY)
        if (performance.now() < ende) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    if (breit) await toc.click()
    else await page.keyboard.press("Enter")
    await page.waitForFunction(() => performance.now() > 0 && (window as unknown as { __proben: number[] }).__proben.length > 60)
    const proben = await page.evaluate(() => (window as unknown as { __proben: number[] }).__proben)
    const aufrufe = await page.evaluate(() => (window as unknown as { __scrollToAufrufe: unknown[] }).__scrollToAufrufe)
    return { id, breit, start, proben, aufrufe }
  }

  test("Anker: Lenis' Anker-Handler greift (scrollTo mit dem Hash), Ziel beachtet scroll-margin-top und Hash", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    expect(await (async () => { await laden(page, "/"); return lenisAnzahl(page) })()).toBe(1)
    const { id, breit, proben, aufrufe } = await ankerLaufen(page)
    const ende = proben[proben.length - 1]
    // Beweis für Lenis: Ohne `anchors: true` (oder ohne Instanz) würde scrollTo nie mit dem Hash aufgerufen.
    // Zwischenwerte sind nicht beobachtbar: Lenis verhindert den nativen Hash-Sprung nicht, scrollY springt sofort.
    expect(aufrufe).toEqual([`#${id}`]) // Lenis übergibt den dekodierten Hash
    const e = await page.evaluate((i) => {
      const el = document.getElementById(i)!
      return { top: el.getBoundingClientRect().top, rand: parseFloat(getComputedStyle(el).scrollMarginTop) || 0 }
    }, id)
    if (breit) expect(ende).toBeGreaterThan(100)
    else expect(ende).toBeLessThan(500)
    expect(Math.abs(e.top - e.rand)).toBeLessThan(2)
    expect(await page.evaluate(() => location.hash)).toBe(`#${encodeURIComponent(id)}`.replace(/%2F/g, "/"))
  })

  test("Anker, Gegenprobe: unter reduced motion ohne Lenis kein scrollTo-Aufruf, Sprung zum Ziel bleibt nativ", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    const { id, start, proben, aufrufe } = await ankerLaufen(page)
    const ende = proben[proben.length - 1]
    expect(ende).not.toBe(start)
    expect(aufrufe).toEqual([])
    expect(await page.evaluate(() => (window as unknown as { __lenis?: unknown }).__lenis ?? null)).toBeNull()
    expect(await lenisAnzahl(page)).toBe(0)
    const e = await page.evaluate((i) => {
      const el = document.getElementById(i)!
      return { top: el.getBoundingClientRect().top, rand: parseFloat(getComputedStyle(el).scrollMarginTop) || 0 }
    }, id)
    expect(Math.abs(e.top - e.rand)).toBeLessThan(2)
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
    // Die Seite dahinter bleibt stehen: scrollY ist stabil (mehrere Messungen) und unverändert
    let zuletzt = -1
    let stabil = 0
    await expect
      .poll(async () => {
        const y = await page.evaluate(() => window.scrollY)
        stabil = y === zuletzt ? stabil + 1 : 0
        zuletzt = y
        return stabil >= 5
      })
      .toBe(true)
    expect(zuletzt).toBe(vorher)
  })

  test("Fehlendes Glättungs-Token beim Wechsel der Systemeinstellung: Konsolenfehler mit Token-Namen, Seite bleibt benutzbar", async ({ page }) => {
    const fehler: string[] = []
    const seitenfehler: string[] = []
    page.on("console", (m) => m.type() === "error" && fehler.push(m.text()))
    page.on("pageerror", (e) => seitenfehler.push(e.message))
    await page.emulateMedia({ reducedMotion: "reduce" })
    await laden(page)
    await page.addStyleTag({ content: ":root { --motion-scroll-glaettung: kaputt; }" })
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await expect.poll(() => fehler.join("\n")).toContain("--motion-scroll-glaettung")
    expect(seitenfehler).toEqual([])
    expect(await lenisAnzahl(page)).toBe(0)
    await expect(page.locator("h1")).toBeVisible()
  })

  test("Defektes Glättungs-Token beim Laden: Seite benutzbar, Fehler nennt das Token, späterer Wechsel wirft nicht", async ({ page }) => {
    const fehler: string[] = []
    const seitenfehler: string[] = []
    page.on("console", (m) => m.type() === "error" && fehler.push(m.text()))
    page.on("pageerror", (e) => seitenfehler.push(e.message))
    await page.emulateMedia({ reducedMotion: "no-preference" })
    // Vor allen Seitenskripten: die Variable am Dokument kaputt setzen (überstimmt das Token auf :root)
    await page.addInitScript(() => {
      const stil = document.createElement("style")
      stil.textContent = ":root:root { --motion-scroll-glaettung: kaputt; }"
      document.addEventListener("DOMContentLoaded", () => document.head.append(stil))
      new MutationObserver((_, o) => {
        if (document.head) {
          document.head.append(stil)
          o.disconnect()
        }
      }).observe(document, { childList: true, subtree: true })
    })
    await laden(page)
    expect(fehler.join("\n")).toContain("--motion-scroll-glaettung")
    expect(await lenisAnzahl(page)).toBe(0)
    await expect(page.locator("h1")).toBeVisible()
    await page.emulateMedia({ reducedMotion: "reduce" })
    await expect.poll(() => page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true)
    // Die Änderungsmeldung der Medienabfrage kommt erst mit dem nächsten Frame; ohne Wartezeit würden beide Wechsel zu keinem
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await expect.poll(() => fehler.filter((f) => f.includes("--motion-scroll-glaettung")).length).toBeGreaterThan(1)
    expect(seitenfehler).toEqual([])
    expect(await lenisAnzahl(page)).toBe(0)
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
