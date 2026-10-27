import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { setTheme, warteAufRuhe } from "../helpers"

// Lichtband (Task 14). Erwartungswerte stammen aus den Tokens der Seite (getComputedStyle), nie als Zahl im Test;
// nur Verhaltenswerte (Toleranzen, Wartezeiten) stehen hier. Die Zähler window.__lichtband gibt es nur im Dev-Server.

declare global {
  interface Window {
    __lichtband?: { instanzen: number; kontexte: number; frames: number; probe: () => number[] | null }
    __cls?: number
  }
}

const GEHT_NICHT = /cookiebot|ERR_|Failed to load resource/i

async function laden(page: Page, url = "/") {
  await page.goto(url)
  await page.waitForSelector("body[data-bereit]")
  await page.waitForFunction(() => !!window.__lichtband && window.__lichtband.instanzen >= 1)
}

const zaehler = (page: Page) => page.evaluate(() => ({ ...window.__lichtband! }))
const frames = (page: Page) => page.evaluate(() => window.__lichtband!.frames)
const token = (page: Page, name: string) =>
  page.evaluate((n) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n)), name)
const probe = (page: Page) => page.evaluate(() => window.__lichtband!.probe())
const mittel = (werte: number[]) => werte.reduce((a, b) => a + b, 0) / werte.length

/** Fehler der Konsole und der Seite sammeln (ohne bekannte Fremdhost-Meldungen). */
function fehlerSammeln(page: Page): string[] {
  const fehler: string[] = []
  page.on("console", (m) => m.type() === "error" && !GEHT_NICHT.test(m.text()) && fehler.push(m.text()))
  page.on("pageerror", (e) => fehler.push(e.message))
  return fehler
}

test.describe("Lichtband", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
  })

  test("Canvas aria-hidden, Höhe reserviert, kein Layout-Shift (CLS < 0.01)", async ({ page }) => {
    await page.addInitScript(() => {
      window.__cls = 0
      new PerformanceObserver((liste) => {
        for (const e of liste.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
          if (!e.hadRecentInput) window.__cls! += e.value
        }
      }).observe({ type: "layout-shift", buffered: true })
    })
    await laden(page)
    await expect(page.locator("canvas[data-lichtband]")).toHaveAttribute("aria-hidden", "true")
    const vorher = await page.locator("[data-lichtband-huelle]").evaluate((el) => el.getBoundingClientRect().height)
    await page.waitForTimeout(2200) // Einblenden (Token) abwarten
    const nachher = await page.locator("[data-lichtband-huelle]").evaluate((el) => el.getBoundingClientRect().height)
    expect(nachher).toBe(vorher)
    expect(await page.evaluate(() => window.__cls)).toBeLessThan(0.01)
  })

  test("WebGL: ein Kontext, Frame wird gezeichnet (nicht einfarbig), hell und dunkel unterscheiden sich", async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await laden(page)
    const z = await zaehler(page)
    expect(z.instanzen).toBe(1)
    expect(z.kontexte).toBe(1)
    const hell = await probe(page)
    expect(hell).not.toBeNull()
    // 4 Werte (RGBA) je Probe; nicht einfarbig weiß und nicht alle Proben gleich
    const kanaele = hell!.filter((_, i) => i % 4 !== 3)
    expect(Math.min(...kanaele)).toBeLessThan(250)
    expect(new Set(hell!).size).toBeGreaterThan(4)
    await setTheme(page, "dark")
    await page.waitForTimeout(100)
    const dunkel = await probe(page)
    expect(mittel(dunkel!)).toBeLessThan(mittel(hell!) - 40)
    await setTheme(page, "light")
    await page.waitForTimeout(100)
    expect(mittel((await probe(page))!)).toBeGreaterThan(mittel(dunkel!) + 40)
    expect(fehler).toEqual([])
  })

  test("Themewechsel setzt Mischmodus und Deckkraft aus den Tokens (hell multiply 100 %, dunkel screen 50 %)", async ({ page }) => {
    await laden(page)
    const lesen = () =>
      page.locator("canvas[data-lichtband]").evaluate((c) => {
        const cs = getComputedStyle(c)
        return { modus: cs.mixBlendMode, deckkraft: parseFloat(cs.opacity) }
      })
    await setTheme(page, "light")
    await page.waitForTimeout(2200)
    expect(await lesen()).toEqual({ modus: "multiply", deckkraft: 1 })
    await setTheme(page, "dark")
    await page.waitForTimeout(100)
    expect(await lesen()).toEqual({ modus: "screen", deckkraft: 0.5 })
  })

  test("Maske: oben, unten und seitlich ausgeblendet", async ({ page }) => {
    await laden(page)
    const m = await page.locator("canvas[data-lichtband]").evaluate((c) => {
      const cs = getComputedStyle(c)
      return cs.maskImage || cs.webkitMaskImage
    })
    expect(m).toContain("linear-gradient")
    // Stopps oben/unten 28/60/88 %, seitlich 16/84 % (Prototyp); "to bottom" ist der Standard und wird normalisiert
    for (const stopp of ["28%", "60%", "88%", "16%", "84%", "to right"]) expect(m).toContain(stopp)
  })

  test("Takt entspricht dem Token (--motion-lichtband-bildintervall), Toleranz großzügig", async ({ page }) => {
    await laden(page)
    const intervall = await token(page, "--motion-lichtband-bildintervall")
    const erwartet = 1000 / intervall
    const a = await frames(page)
    await page.waitForTimeout(1000)
    const b = await frames(page)
    const fps = b - a
    expect(fps).toBeGreaterThan(erwartet * 0.5)
    expect(fps).toBeLessThan(erwartet * 1.4)
  })

  test("pausiert außerhalb des Viewports und läuft beim Zurückscrollen weiter", async ({ page }) => {
    await laden(page)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(500)
    const a = await frames(page)
    await page.waitForTimeout(600)
    expect(await frames(page)).toBe(a)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(600)
    expect(await frames(page)).toBeGreaterThan(a + 3)
  })

  test("pausiert bei verstecktem Tab (visibilitychange) und läuft danach weiter", async ({ page }) => {
    await laden(page)
    const verstecken = (hidden: boolean) =>
      page.evaluate((h) => {
        Object.defineProperty(document, "hidden", { configurable: true, get: () => h })
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (h ? "hidden" : "visible") })
        document.dispatchEvent(new Event("visibilitychange"))
      }, hidden)
    await verstecken(true)
    await page.waitForTimeout(200)
    const a = await frames(page)
    await page.waitForTimeout(600)
    expect(await frames(page)).toBe(a)
    await verstecken(false)
    await page.waitForTimeout(600)
    expect(await frames(page)).toBeGreaterThan(a + 3)
  })

  test("Scroll-Zusammenzug: translateY bis −40 px, scaleY bis 0.55", async ({ page }) => {
    await laden(page)
    const lesen = () =>
      page.locator("canvas[data-lichtband]").evaluate((c) => {
        const t = getComputedStyle(c).transform
        if (t === "none") return { y: 0, skala: 1 }
        const m = new DOMMatrix(t)
        return { y: m.m42, skala: m.d }
      })
    expect(await lesen()).toEqual({ y: 0, skala: 1 })
    const hoehe = await page.locator("[data-lichtband-huelle]").evaluate((el) => (el as HTMLElement).offsetHeight)
    await page.evaluate((h) => window.scrollTo(0, h / 2), hoehe)
    await page.waitForTimeout(300)
    const halb = await lesen()
    expect(halb.y).toBeLessThan(-1)
    expect(halb.y).toBeGreaterThan(-40)
    expect(halb.skala).toBeLessThan(1)
    expect(halb.skala).toBeGreaterThan(0.55)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(300)
    const voll = await lesen()
    expect(voll.y).toBeGreaterThanOrEqual(-40.001)
    expect(voll.skala).toBeGreaterThanOrEqual(0.549)
    expect(voll.y).toBeLessThan(-39)
  })

  test("Einblenden: Canvas bleibt bis zum ersten Frame unsichtbar und blendet dann über das Token ein", async ({ page }) => {
    await page.goto("/")
    await page.waitForFunction(() => !!window.__lichtband && window.__lichtband.frames >= 1)
    const dauer = await token(page, "--motion-lichtband-einblenden")
    expect(dauer).toBeGreaterThan(0)
    const info = await page.locator("canvas[data-lichtband]").evaluate((c) => {
      const a = c.getAnimations().find((x) => (x as CSSAnimation).animationName === undefined && !("transitionProperty" in x))
      return {
        anzahl: c.getAnimations().length,
        dauer: a ? Number(a.effect?.getTiming().duration) : null,
        fertig: c.hasAttribute("data-anim-fertig"),
      }
    })
    expect(info.fertig).toBe(true)
    // Kurz nach dem Start läuft die Einblendung noch (Deckkraft unter dem Endwert), am Ende steht sie auf dem Endwert
    if (info.anzahl > 0) expect(info.dauer).toBe(dauer)
    await page.waitForTimeout(dauer + 400)
    expect(await page.locator("canvas[data-lichtband]").evaluate((c) => c.getAnimations().length)).toBe(0)
    expect(await page.locator("canvas[data-lichtband]").evaluate((c) => parseFloat(getComputedStyle(c).opacity))).toBe(1)
  })

  test("reduzierte Bewegung: genau ein Frame, keine Schleife, kein Zusammenzug, kein Einblenden", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await laden(page)
    await page.waitForTimeout(1000)
    expect(await frames(page)).toBe(1)
    await page.evaluate(() => window.scrollTo(0, 300))
    await page.waitForTimeout(300)
    const r = await page.locator("canvas[data-lichtband]").evaluate((c) => ({
      transform: getComputedStyle(c).transform,
      deckkraft: parseFloat(getComputedStyle(c).opacity),
      animationen: c.getAnimations().length,
    }))
    expect(r.transform).toBe("none")
    expect(r.deckkraft).toBe(1)
    expect(r.animationen).toBe(0)
    expect(await frames(page)).toBe(1)
    // Themewechsel zeichnet neu (ein weiterer Frame, keine Schleife)
    await setTheme(page, "dark")
    await page.waitForTimeout(400)
    expect(await frames(page)).toBe(2)
    await page.waitForTimeout(400)
    expect(await frames(page)).toBe(2)
  })

  test("Themewechsel zur Laufzeit zeichnet sofort neu (Systemeinstellung)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" })
    await page.addInitScript(() => localStorage.removeItem("theme"))
    await laden(page)
    const hell = mittel((await probe(page))!)
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"))
    await page.waitForTimeout(150)
    expect(mittel((await probe(page))!)).toBeLessThan(hell - 40)
  })

  test("ohne WebGL: Canvas-2D-Rückfall zeichnet, Seite läuft fehlerfrei", async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, typ: string, ...rest: unknown[]) {
        if (/webgl/.test(typ)) return null
        return (orig as (...a: unknown[]) => unknown).call(this, typ, ...rest) as never
      } as typeof orig
    })
    await laden(page)
    const z = await zaehler(page)
    expect(z.kontexte).toBe(0)
    expect(z.frames).toBeGreaterThan(0)
    const p = await probe(page)
    expect(p).not.toBeNull()
    expect(new Set(p!).size).toBeGreaterThan(4)
    expect(await page.locator("[data-lichtband-huelle]").getAttribute("data-aktiv")).not.toBeNull()
    expect(fehler).toEqual([])
  })

  test("ohne jeden Kontext: statischer Verlauf bleibt stehen, kein Fehler", async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = (() => null) as never
    })
    await page.goto("/")
    await page.waitForSelector("body[data-bereit]")
    await page.waitForTimeout(500)
    const r = await page.locator("[data-lichtband-huelle]").evaluate((el) => ({
      bild: getComputedStyle(el, "::before").backgroundImage,
      deckkraft: parseFloat(getComputedStyle(el, "::before").opacity),
      aktiv: el.hasAttribute("data-aktiv"),
    }))
    expect(r.bild).toContain("gradient")
    expect(r.deckkraft).toBeGreaterThan(0)
    expect(r.aktiv).toBe(false)
    await expect(page.locator("h1")).toBeVisible()
    expect(fehler).toEqual([])
  })

  test("Kontextverlust: Fallback erscheint, Wiederherstellung zeichnet erneut, keine Fehler", async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await laden(page)
    const huelle = page.locator("[data-lichtband-huelle]")
    await expect(huelle).toHaveAttribute("data-aktiv", "")
    await page.evaluate(() => {
      const gl = document.querySelector<HTMLCanvasElement>("canvas[data-lichtband]")!.getContext("webgl")!
      const ext = gl.getExtension("WEBGL_lose_context")!
      ;(window as unknown as { __ext: typeof ext }).__ext = ext
      ext.loseContext()
    })
    await expect(huelle).not.toHaveAttribute("data-aktiv", "")
    const a = await frames(page)
    await page.waitForTimeout(400)
    expect(await frames(page)).toBe(a) // verloren: nichts zeichnen
    await page.evaluate(() => (window as unknown as { __ext: WEBGL_lose_context }).__ext.restoreContext())
    await expect(huelle).toHaveAttribute("data-aktiv", "")
    await page.waitForTimeout(400)
    expect(await frames(page)).toBeGreaterThan(a)
    expect(new Set((await probe(page))!).size).toBeGreaterThan(4)
    expect(fehler).toEqual([])
  })

  test("Client-Router: nach Hin- und Rückweg genau eine Schleife und ein Kontext", async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await laden(page)
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => document.querySelector<HTMLAnchorElement>('a[href="/blog"]')!.click())
      await page.waitForURL("**/blog")
      await page.waitForFunction(() => document.body.hasAttribute("data-bereit") && !!document.querySelector("main"))
      const dort = await zaehler(page)
      expect(dort.instanzen).toBe(0)
      expect(dort.kontexte).toBe(0)
      await page.evaluate(() => document.querySelector<HTMLAnchorElement>('a[href="/"]')!.click())
      await page.waitForURL((u) => u.pathname === "/")
      await page.waitForFunction(() => !!document.querySelector("canvas[data-lichtband]") && window.__lichtband!.instanzen === 1)
    }
    const z = await zaehler(page)
    expect(z.instanzen).toBe(1)
    expect(z.kontexte).toBe(1)
    // Takt nicht vervielfacht
    const intervall = await token(page, "--motion-lichtband-bildintervall")
    const a = await frames(page)
    await page.waitForTimeout(1000)
    expect((await frames(page)) - a).toBeLessThan((1000 / intervall) * 1.4)
    expect(fehler).toEqual([])
  })

  test("axe hell und dunkel, keine Konsolenfehler", async ({ page }) => {
    const fehler = fehlerSammeln(page)
    await laden(page)
    await page.waitForTimeout(500)
    for (const theme of ["light", "dark"] as const) {
      await setTheme(page, theme)
      await page.waitForTimeout(300)
      await warteAufRuhe(page)
      const r = await new AxeBuilder({ page }).analyze()
      expect(r.violations, theme).toEqual([])
    }
    expect(fehler).toEqual([])
  })
})

test.describe("Lichtband ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })
  test("statischer Verlauf sichtbar, Canvas aria-hidden, Inhalt vollständig", async ({ page }) => {
    await page.goto("/")
    const r = await page.locator("[data-lichtband-huelle]").evaluate((el) => ({
      bild: getComputedStyle(el, "::before").backgroundImage,
      deckkraft: parseFloat(getComputedStyle(el, "::before").opacity),
    }))
    expect(r.bild).toContain("gradient")
    expect(r.deckkraft).toBeGreaterThan(0)
    await expect(page.locator("canvas[data-lichtband]")).toHaveAttribute("aria-hidden", "true")
    await expect(page.locator("h1")).toBeVisible()
  })
})
