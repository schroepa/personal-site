import { expect, test, type Page } from "@playwright/test"

// Nachträge zu Task 12 (Task 13, Teil A): Ausfallsicherung, Laufzeitwechsel der Systemeinstellung, Gate vor dem
// ersten Paint, Layoutverschiebung, Akkordeon ohne Sprung, Rasterspalte (Drossel, Live-Zeiger), Durchstreichen.
// Erwartungswerte kommen aus dem Dokument (Tokens, Markup), nicht als Zahl im Test.

async function laden(page: Page, url = "/") {
  await page.goto(url)
  await page.waitForSelector("body[data-bereit]")
}

const lebend = (page: Page) => page.evaluate(() => (window as unknown as { __motionLebend?: number }).__motionLebend)

test.describe("einmal.ts: fertigNach", () => {
  test("eine abgelehnte Animation lässt das Element nicht im Startzustand hängen", async ({ page }) => {
    await laden(page)
    const ergebnis = await page.evaluate(async () => {
      const m = await import("/src/scripts/motion/einmal.ts")
      const el = document.createElement("div")
      el.setAttribute("data-anim", "wort")
      el.style.opacity = "0"
      document.body.append(el)
      const abgelehnt = Promise.reject(new Error("Animation fehlgeschlagen"))
      m.fertigNach(abgelehnt, el)
      await new Promise((r) => setTimeout(r, 100))
      const r = { fertig: el.hasAttribute("data-anim-fertig"), opacity: el.style.opacity }
      el.remove()
      return r
    })
    expect(ergebnis).toEqual({ fertig: true, opacity: "" })
  })

  test("eine abgebrochene Animation (cancel) gibt ebenfalls frei", async ({ page }) => {
    await laden(page)
    const fertig = await page.evaluate(async () => {
      const m = await import("/src/scripts/motion/einmal.ts")
      const el = document.createElement("div")
      el.setAttribute("data-anim", "wort")
      document.body.append(el)
      // WAAPI: cancel() lehnt `finished` mit AbortError ab
      const s = el.animate({ opacity: [0, 1] }, { duration: 5000 })
      m.fertigNach(s.finished, el)
      s.cancel()
      await new Promise((r) => setTimeout(r, 100))
      const f = el.hasAttribute("data-anim-fertig")
      el.remove()
      return f
    })
    expect(fertig).toBe(true)
  })
})

test.describe("Ausfallsicherung und Systemeinstellung", () => {
  test("ein Modul, das wirft (defektes Token): Gate offen, alle Inhalte sichtbar, kein „Screens“ neben „Systeme.“", async ({ page }) => {
    const fehler: string[] = []
    page.on("console", (m) => m.type() === "error" && fehler.push(m.text()))
    await page.emulateMedia({ reducedMotion: "no-preference" })
    // Vor allen Seitenskripten: ein Token am Dokument kaputt setzen (hero-woerter liest die Wort-Feder)
    await page.addInitScript(() => {
      const stil = document.createElement("style")
      stil.textContent = ":root:root { --motion-feder-wort-dauer: kaputt; }"
      new MutationObserver((_, o) => {
        if (document.head) {
          document.head.append(stil)
          o.disconnect()
        }
      }).observe(document, { childList: true, subtree: true })
    })
    await laden(page)
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", /.*/)
    expect(fehler.join("\n")).toContain("--motion-feder-wort-dauer")
    // (die Dekoration „Screens“ ist ausgenommen, sie wird unten gesondert geprüft)
    const versteckt = await page.locator("[data-anim]").evaluateAll((l) =>
      l.filter((e) => !e.classList.contains("alt") && getComputedStyle(e).opacity !== "1").map((e) => e.className)
    )
    expect(versteckt).toEqual([])
    // die übrigen Module liefen weiter (Lenis), die Seite ist benutzbar
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    // „Screens“ (Dekoration) darf auch nach dem Scheitern nicht sichtbar neben dem Endtext stehen
    const sichtbar = await page.evaluate(() =>
      [...document.querySelectorAll(".ersatz .alt")].some((e) => getComputedStyle(e).display !== "none" && getComputedStyle(e).visibility !== "hidden")
    )
    expect(sichtbar).toBe(false)
    expect(await page.getByRole("heading", { level: 1 }).innerText()).toContain("Systeme.")
  })

  test("Systemeinstellung zur Laufzeit auf „reduzieren“: Animationen laufen nicht weiter, Endzustand, Gate zu", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await laden(page)
    // Der Hero läuft gerade (Wörter steigen auf, Rasterspalten bauen sich auf)
    expect(await page.locator("[data-anim]").evaluateAll((l) => l.some((e) => !e.hasAttribute("data-anim-fertig")))).toBe(true)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", /.*/)
    await expect
      .poll(() => page.locator("[data-anim]").evaluateAll((l) => l.every((e) => e.hasAttribute("data-anim-fertig"))))
      .toBe(true)
    // keine laufende Animation der Seite mehr (außer Browser-eigenen)
    await expect
      .poll(() =>
        page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running" && !(a as CSSAnimation).animationName?.startsWith("-ua-")).length)
      )
      .toBe(0)
    await expect(page.locator(".ersatz .alt")).toHaveCount(0)
    for (const el of await page.locator("[data-anim]").all()) await expect(el).toHaveCSS("opacity", "1")
    await expect(page.locator("[data-anim]").first()).not.toHaveAttribute("style", /opacity|transform/)
  })
})

test.describe("Gate vor dem ersten Paint", () => {
  async function zeitleiste(page: Page) {
    await page.addInitScript(() => {
      const w = window as unknown as { __gate: Array<{ t: number; da: boolean }>; __ersterFrame?: boolean; __dcl?: boolean }
      w.__gate = []
      // Der erste rAF-Rückruf läuft vor dem ersten Rendern des Dokuments
      requestAnimationFrame(() => (w.__ersterFrame = document.documentElement.hasAttribute("data-motion")))
      document.addEventListener("DOMContentLoaded", () => (w.__dcl = document.documentElement.hasAttribute("data-motion")))
      const beobachten = () => {
        const wurzel = document.documentElement
        w.__gate.push({ t: performance.now(), da: wurzel.hasAttribute("data-motion") })
        new MutationObserver(() => w.__gate.push({ t: performance.now(), da: wurzel.hasAttribute("data-motion") })).observe(wurzel, {
          attributes: true,
          attributeFilter: ["data-motion"],
        })
      }
      // Init-Skripte laufen, bevor <html> existiert
      if (document.documentElement) beobachten()
      else
        new MutationObserver((_, o) => {
          if (document.documentElement) {
            o.disconnect()
            beobachten()
          }
        }).observe(document, { childList: true })
    })
  }

  test("data-motion steht vor dem ersten Paint am Dokument", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await zeitleiste(page)
    await laden(page)
    const z = await page.evaluate(() => {
      const w = window as unknown as { __gate: Array<{ t: number; da: boolean }>; __ersterFrame?: boolean; __dcl?: boolean }
      return { gate: w.__gate, ersterFrame: w.__ersterFrame, dcl: w.__dcl }
    })
    // Schon beim ersten Eintrag (Skriptstart, noch ohne Kopf) kann es fehlen; spätestens vor dem ersten Frame und DOMContentLoaded steht es
    expect(z.gate.some((g) => g.da)).toBe(true)
    expect(z.ersterFrame).toBe(true)
    expect(z.dcl).toBe(true)
  })

  test("bei reduzierter Bewegung gibt es das Attribut nie", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await zeitleiste(page)
    await laden(page)
    await page.waitForTimeout(500)
    const gate = await page.evaluate(() => (window as unknown as { __gate: Array<{ da: boolean }> }).__gate)
    expect(gate.every((g) => !g.da)).toBe(true)
  })
})

test("Layoutverschiebung (CLS) von Hero und Signatur bleibt unter 0.01", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
  await page.addInitScript(() => {
    const w = window as unknown as { __cls: number }
    w.__cls = 0
    new PerformanceObserver((liste) => {
      for (const e of liste.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) if (!e.hadRecentInput) w.__cls += e.value
    }).observe({ type: "layout-shift", buffered: true })
  })
  await laden(page)
  // Hero läuft (Wörter, Durchstreichen), dann zur Signatur scrollen und sie laufen lassen
  await page.waitForTimeout(3500)
  await page.locator("[data-signatur]").scrollIntoViewIfNeeded()
  await page.waitForTimeout(3000)
  const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls)
  expect(cls).toBeLessThan(0.01)
})

test.describe("Galerie-Akkordeon", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name !== "desktop", "setzt die Breite selbst")
  })

  const streifen = (page: Page) => page.locator("#digital-art [data-galerie-akkordeon] > a")

  /** CSS-Zustand der Bilder (berechneter Stil) samt Inline-Resten. */
  const bildZustand = (page: Page) =>
    page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("#digital-art [data-galerie-akkordeon] img")].map((img) => {
        const s = getComputedStyle(img)
        return { filter: s.filter, transform: s.transform, inline: img.getAttribute("style") ?? "" }
      })
    )

  test("Init erzeugt keinen Sprung: berechnete Werte (Filter, Versatz) entsprechen dem reinen CSS-Zustand, nichts steht inline", async ({ browser }) => {
    const gate = async (ohneSkripte: boolean) => {
      const kontext = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" })
      const seite = await kontext.newPage()
      if (ohneSkripte) await seite.route("**/*", (r) => (r.request().resourceType() === "script" ? r.abort() : r.continue()))
      await seite.goto("/", { waitUntil: ohneSkripte ? "domcontentloaded" : "load" })
      if (!ohneSkripte) await seite.waitForSelector("body[data-bereit]")
      // der Watchdog (4 s) ist noch nicht abgelaufen; Zustand sofort lesen
      await expect(seite.locator("html")).toHaveAttribute("data-motion", ohneSkripte ? "" : /.*/).catch(() => {})
      const z = await bildZustand(seite)
      await kontext.close()
      return z
    }
    const nurCss = await gate(true)
    const mitJs = await gate(false)
    expect(mitJs.length).toBe(nurCss.length)
    expect(mitJs.every((b) => b.inline === "")).toBe(true)
    expect(mitJs.map((b) => [b.filter, b.transform])).toEqual(nurCss.map((b) => [b.filter, b.transform]))
    // und der Ruhezustand ist wirklich einer: geschlossene Bilder grau und versetzt
    expect(nurCss[1].filter).toBe("grayscale(1)")
    expect(nurCss[1].transform).not.toBe("none")
  })

  async function wechselProben(page: Page, nach: number) {
    await page.evaluate(() => {
      const w = window as unknown as { __g: number[] }
      w.__g = []
      const s = document.querySelectorAll<HTMLElement>("#digital-art [data-galerie-akkordeon] > a")
      const tick = () => {
        w.__g.push(parseFloat(getComputedStyle(s[3]).flexGrow))
        if (w.__g.length < 200) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await streifen(page).nth(nach).focus()
    await page.waitForTimeout(3200)
    return page.evaluate(() => (window as unknown as { __g: number[] }).__g)
  }

  test("Resize 390 → 1440 vor dem ersten Wechsel: Breite startet beim geschlossenen Wert, nicht bei 0", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await laden(page)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(300)
    await streifen(page).first().scrollIntoViewIfNeeded()
    const g = await wechselProben(page, 3)
    const geschlossen = 1
    // Streifen 3 war geschlossen (1) und öffnet: nie unter dem geschlossenen Wert, endet beim Gewicht
    expect(Math.min(...g)).toBeGreaterThan(geschlossen - 0.1)
    expect(Math.max(...g)).toBeGreaterThan(geschlossen + 1)
  })

  test("Resize 1440 → 390 → 1440: der nächste Wechsel animiert korrekt", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await laden(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(300)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(300)
    await streifen(page).first().scrollIntoViewIfNeeded()
    const g = await wechselProben(page, 3)
    expect(Math.min(...g)).toBeGreaterThan(0.9)
    expect(Math.max(...g)).toBeGreaterThan(2)
    // Endzustand: nur das CSS, kein Inline-Rest
    expect(await streifen(page).nth(3).evaluate((e) => (e as HTMLElement).style.flexGrow)).toBe("")
    expect((await bildZustand(page)).every((b) => b.inline === "")).toBe(true)
  })
})

test.describe("Rasterspalte", () => {
  test("Zeigerereignisse werden pro Frame gebündelt (rAF-Drossel)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await laden(page)
    const r = await page.evaluate(async () => {
      let aufrufe = 0
      const original = Element.prototype.getBoundingClientRect
      Element.prototype.getBoundingClientRect = function (this: Element) {
        aufrufe++
        return original.call(this)
      }
      aufrufe = 0
      for (let i = 0; i < 100; i++) document.body.dispatchEvent(new PointerEvent("pointermove", { clientX: 200 + i, clientY: 300, bubbles: true }))
      const synchron = aufrufe
      await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)))
      const nachFrame = aufrufe
      Element.prototype.getBoundingClientRect = original
      return { synchron, nachFrame }
    })
    expect(r.synchron).toBe(0)
    expect(r.nachFrame).toBeGreaterThan(0)
    // 100 Ereignisse, aber nur eine Auswertung: nicht 100-mal die Spaltenmaße
    expect(r.nachFrame).toBeLessThan(100)
  })

  test("(pointer: fine) gilt live: Wechsel legt die Hörer ab und wieder an, Teardown räumt vollständig auf", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await page.addInitScript(() => {
      const w = window as unknown as { __fein: { matches: boolean; hoerer: Array<(e: unknown) => void> } }
      w.__fein = { matches: true, hoerer: [] }
      const echt = window.matchMedia.bind(window)
      window.matchMedia = ((q: string) => {
        if (q.replace(/\s/g, "") !== "(pointer:fine)") return echt(q)
        const f = w.__fein
        return {
          get matches() {
            return f.matches
          },
          media: q,
          onchange: null,
          addEventListener: (_t: string, fn: (e: unknown) => void) => f.hoerer.push(fn),
          removeEventListener: (_t: string, fn: (e: unknown) => void) => {
            f.hoerer = f.hoerer.filter((h) => h !== fn)
          },
          addListener: () => {},
          removeListener: () => {},
          dispatchEvent: () => true,
        } as unknown as MediaQueryList
      }) as typeof window.matchMedia
    })
    await laden(page)
    const mitZeiger = await lebend(page)
    await page.mouse.move(300, 300)
    await page.mouse.move(310, 305)
    await expect.poll(() => page.locator("[data-raster] .spalte[data-hover]").count()).toBeGreaterThan(0)
    // Zeiger wird grob: Hörer ab, Hervorhebung weg
    await page.evaluate(() => {
      const f = (window as unknown as { __fein: { matches: boolean; hoerer: Array<(e: unknown) => void> } }).__fein
      f.matches = false
      f.hoerer.slice().forEach((h) => h({ matches: false }))
    })
    await expect.poll(() => page.locator("[data-raster] .spalte[data-hover]").count()).toBe(0)
    expect(await lebend(page)).toBeLessThan(mitZeiger!)
    await page.mouse.move(600, 320)
    await page.mouse.move(620, 330)
    await page.waitForTimeout(200)
    await expect(page.locator("[data-raster] .spalte[data-hover]")).toHaveCount(0)
    // und wieder fein: Hörer zurück
    await page.evaluate(() => {
      const f = (window as unknown as { __fein: { matches: boolean; hoerer: Array<(e: unknown) => void> } }).__fein
      f.matches = true
      f.hoerer.slice().forEach((h) => h({ matches: true }))
    })
    expect(await lebend(page)).toBe(mitZeiger)
    await page.mouse.move(200, 330)
    await page.mouse.move(210, 335)
    await expect.poll(() => page.locator("[data-raster] .spalte[data-hover]").count()).toBeGreaterThan(0)
  })
})

test.describe("Durchstreichen", () => {
  test("Teardown mitten im Ablauf (Seitenwechsel): kein „Screens“ im DOM, Endtext steht", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await laden(page)
    await expect(page.locator(".ersatz .alt")).toHaveCount(1)
    await page.evaluate(() => (window as unknown as { __alt: Element | null }).__alt = document.querySelector(".ersatz .alt"))
    const knopf = page.getByRole("button", { name: "Menü", exact: true })
    if (await knopf.isVisible()) await knopf.click()
    await page.getByRole("navigation", { name: "Hauptnavigation" }).locator('a[href="/blog"]').click()
    await page.waitForURL("**/blog")
    await page.waitForSelector("body[data-bereit]")
    // das alte Dokument ist ersetzt; die Dekoration hängt nirgends mehr (auch nicht abgelöst im Speicher am Dokument)
    expect(await page.evaluate(() => document.querySelectorAll(".alt").length)).toBe(0)
    const verwaist = await page.evaluate(() => (window as unknown as { __alt: Element | null }).__alt?.isConnected)
    expect(verwaist).toBeFalsy()
  })

  test("wirft ein Schritt nach dem Einfügen: die Dekoration wird entfernt, nur der Endtext bleibt, der Fehler wird gemeldet", async ({ page }) => {
    const fehler: string[] = []
    page.on("console", (m) => m.type() === "error" && fehler.push(m.text()))
    await page.emulateMedia({ reducedMotion: "no-preference" })
    // Schritt nach dem Einfügen scheitert: prepend am Ersatz-Wrapper fügt ein und wirft danach
    await page.addInitScript(() => {
      const original = Element.prototype.prepend
      Element.prototype.prepend = function (this: Element, ...a: Parameters<Element["prepend"]>) {
        original.apply(this, a)
        if (this.hasAttribute("data-ersatz")) throw new Error("Schritt nach dem Einfügen fehlgeschlagen")
      }
    })
    await laden(page)
    await expect.poll(() => fehler.join("\n")).toContain("initDurchstreichen")
    await expect(page.locator(".ersatz .alt")).toHaveCount(0)
    await expect(page.locator("[data-neu]")).toHaveCSS("opacity", "1")
    expect(await page.getByRole("heading", { level: 1 }).innerText()).toContain("Systeme.")
    expect(await page.locator("body").innerText()).not.toContain("Screens")
  })
})
