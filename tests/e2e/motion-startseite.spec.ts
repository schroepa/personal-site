import AxeBuilder from "@axe-core/playwright"
import { warteAufRuhe } from "../helpers"
import { expect, test, type Page } from "@playwright/test"
import { MOTION_WATCHDOG_MS } from "../../src/scripts/motion/gate"

// Startseiten-Animationen (Task 12). Erwartungswerte kommen aus den Tokens der Seite (getComputedStyle),
// nie als Zahl im Test; nur Verhaltenswerte (Toleranzen, Wartezeiten) stehen hier.
const FINAL = "Ich entwerfe Systeme. Ich baue sie auch."
const TOLERANZ_MS = 120

declare global {
  interface Window {
    __motionLebend?: number
    __proben?: Array<{ t: number; alt: boolean; strich: number; neu: number }>
  }
}

/** Wartet, bis die Startseite nach einem Router-Wechsel im Dokument steht und verdrahtet ist (body[data-bereit] gibt es kurz auch am alten Body). */
const startseiteDa = (page: Page) =>
  page.waitForFunction(() => !!document.querySelector("#einstieg") && document.body.hasAttribute("data-bereit"))

async function laden(page: Page, url = "/") {
  await page.goto(url)
  await page.waitForSelector("body[data-bereit]")
}

/** Token (ms oder Zahl) aus dem Dokument. */
const token = (page: Page, name: string) =>
  page.evaluate((n) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n)), name)

/** Zeichnet pro Frame den Zustand von „Screens“ (Strich) und „Systeme.“ auf. */
async function probenAufzeichnen(page: Page) {
  await page.addInitScript(() => {
    window.__proben = []
    const tick = () => {
      const alt = document.querySelector(".ersatz .alt")
      const strich = alt?.querySelector(".strich")
      const neu = document.querySelector("[data-neu]")
      const skala = strich ? parseFloat(getComputedStyle(strich).transform.replace(/^matrix\(/, "")) : NaN
      window.__proben!.push({
        t: performance.now(),
        alt: !!alt,
        strich: Number.isFinite(skala) ? skala : 0,
        neu: neu ? parseFloat(getComputedStyle(neu).opacity) : -1,
      })
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

/** Laufende Animationen der Seite, ohne die Überblendung des Browsers beim Router-Wechsel (-ua-view-transition-*). */
const laufendeAnimationen = (page: Page) =>
  page.evaluate(
    () => document.getAnimations().filter((a) => a.playState === "running" && !(a as CSSAnimation).animationName?.startsWith("-ua-")).length
  )

test.describe("ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("ohne JS: Hero zeigt nur den Endtext, Signatur und alle Abschnitte sind sichtbar", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", /.*/)
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(FINAL)
    expect(await page.locator("body").innerText()).not.toContain("Screens")
    for (const id of ["ueber-mich", "arbeit", "digital-art", "gedanken", "kontakt"]) {
      await expect(page.locator(`#${id}`)).toBeVisible()
    }
    await expect(page.locator(".text-signatur")).toBeVisible()
    for (const el of await page.locator("[data-anim]").all()) {
      await expect(el).toHaveCSS("opacity", "1")
      await expect(el).toHaveCSS("visibility", "visible")
    }
    for (const el of await page.locator("[data-anim='linie']").all()) await expect(el).toHaveCSS("transform", "none")
  })
})

test.describe("reduzierte Bewegung", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
  })

  test("reduced motion: sofort Endzustand, kein data-motion, keine laufende Animation, kein „Screens“", async ({ page }) => {
    await laden(page)
    await page.waitForTimeout(100)
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", /.*/)
    expect(await laufendeAnimationen(page)).toBe(0)
    const unsichtbar = await page.evaluate(() =>
      [...document.querySelectorAll("[data-anim]")].filter((e) => parseFloat(getComputedStyle(e).opacity) < 1).length
    )
    expect(unsichtbar).toBe(0)
    await expect(page.locator(".ersatz .alt")).toHaveCount(0)
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(FINAL)
    // Akkordeon: Wechsel ist sofort fertig, ohne Inline-Werte der Bewegung
    if ((page.viewportSize()?.width ?? 0) >= 768) {
      const streifen = page.locator("#digital-art [data-galerie-akkordeon] > a")
      await streifen.nth(3).focus()
      const r = await page.evaluate(() => {
        const s = [...document.querySelectorAll<HTMLElement>("#digital-art [data-galerie-akkordeon] > a")]
        return { grow: s.map((e) => getComputedStyle(e).flexGrow), inline: s.map((e) => e.style.flexGrow), filter: s.map((e) => e.querySelector("img")!.style.filter) }
      })
      expect(r.grow).toEqual(["1", "1", "1", "8", "1"])
      expect(r.inline.every((v) => v === "")).toBe(true)
      expect(r.filter.every((v) => v === "")).toBe(true)
    }
  })
})

test.describe("mit Bewegung", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" })
  })

  test("data-motion ist gesetzt; Hero-Wörter steigen nacheinander ein und enden im Endzustand", async ({ page }) => {
    await laden(page)
    await expect(page.locator("html")).toHaveAttribute("data-motion", "")
    const start = await page.evaluate(() =>
      [...document.querySelectorAll("[data-anim='wort']")].map((e) => parseFloat(getComputedStyle(e).opacity))
    )
    expect(start.length).toBeGreaterThanOrEqual(6)
    expect(Math.min(...start)).toBeLessThan(1)
    await expect
      .poll(() => page.evaluate(() => [...document.querySelectorAll("[data-anim='wort']")].every((e) => e.hasAttribute("data-anim-fertig") && getComputedStyle(e).opacity === "1")), { timeout: 8000 })
      .toBe(true)
  })

  test("Wörter: Versatz und Feder kommen aus den Tokens (WAAPI-Verzögerung = Versatz je Wort)", async ({ page }) => {
    await laden(page)
    const versatz = await token(page, "--motion-versatz-wort")
    const dauer = await token(page, "--motion-feder-wort-dauer")
    const r = await page.evaluate(() =>
      [...document.querySelectorAll("[data-anim='wort']")].map((e) => {
        const a = e.getAnimations()[0]
        const t = a?.effect?.getTiming()
        return { delay: Number(t?.delay ?? NaN), dauer: Number(t?.duration ?? NaN) }
      })
    )
    const delays = r.map((x) => x.delay).filter(Number.isFinite)
    expect(delays.length).toBeGreaterThanOrEqual(6)
    for (let i = 1; i < delays.length; i++) expect(Math.abs(delays[i] - delays[i - 1] - versatz)).toBeLessThan(2)
    expect(r.every((x) => x.dauer > 0 && x.dauer >= dauer * 0.5)).toBe(true)
  })

  test("„Screens“ erscheint, wird nach der Token-Verzögerung durchgestrichen und durch „Systeme.“ ersetzt; h1-Name bleibt konstant", async ({ page }) => {
    await probenAufzeichnen(page)
    await laden(page)
    const h1 = page.getByRole("heading", { level: 1 })
    const verz = await token(page, "--motion-schrift-ersatz-verzoegerung")
    const streichen = await token(page, "--motion-schrift-streichen")
    const ersatz = await token(page, "--motion-schrift-ersatz")
    await expect(h1).toHaveAccessibleName(FINAL)
    await expect(page.locator(".ersatz .alt")).toHaveText("Screens")
    // Phasen durchlaufen und jedes Mal den Namen prüfen
    await page.waitForTimeout(verz * 0.5)
    await expect(h1).toHaveAccessibleName(FINAL)
    await page.waitForTimeout(verz * 0.5 + streichen * 0.5)
    await expect(h1).toHaveAccessibleName(FINAL)
    await expect.poll(() => page.locator(".ersatz .alt").count(), { timeout: 8000 }).toBe(0)
    await expect(h1).toHaveAccessibleName(FINAL)
    await expect(page.locator("[data-neu]")).toHaveCSS("opacity", "1")
    expect(await page.locator("body").innerText()).not.toContain("Screens")

    const proben = (await page.evaluate(() => window.__proben))!
    const t0 = proben.find((p) => p.alt)!.t
    const striche = proben.find((p) => p.alt && p.strich > 0.02)!.t - t0
    const neuAn = proben.find((p) => p.neu > 0.02)!.t - t0
    const altWeg = proben.find((p) => p.t > t0 && !p.alt)!.t - t0
    expect(striche).toBeGreaterThanOrEqual(verz - TOLERANZ_MS)
    expect(striche).toBeLessThan(verz + 400)
    expect(neuAn).toBeGreaterThanOrEqual(verz + streichen - TOLERANZ_MS)
    expect(altWeg).toBeGreaterThanOrEqual(verz + streichen + ersatz * 0.8)
    // vor dem Ersetzen ist „Systeme.“ unsichtbar (es reserviert nur den Platz)
    expect(proben.filter((p) => p.t - t0 < verz - 200).every((p) => p.neu <= 0.001)).toBe(true)
  })

  test("Raster baut Spalten nacheinander auf (Versatz je Spalte aus dem Token), danach Endzustand", async ({ page }) => {
    await laden(page)
    const versatz = await token(page, "--motion-versatz-spalte")
    const r = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("[data-raster] .spalte")]
        .filter((s) => s.getBoundingClientRect().height > 0)
        .map((s) => Number(s.getAnimations()[0]?.effect?.getTiming().delay ?? NaN))
    )
    expect(r.length).toBeGreaterThanOrEqual(4)
    expect(r.every(Number.isFinite)).toBe(true)
    expect(r[r.length - 1] - r[0]).toBeGreaterThanOrEqual((r.length - 1) * versatz - 1)
    for (let i = 1; i < r.length; i++) expect(Math.abs(r[i] - r[i - 1] - versatz)).toBeLessThan(2)
    await expect
      .poll(() => page.evaluate(() => [...document.querySelectorAll("[data-raster] .spalte")].every((s) => s.hasAttribute("data-anim-fertig"))), { timeout: 8000 })
      .toBe(true)
  })

  test("Hover über eine Rasterspalte setzt data-hover; nach Verlassen löst es sich und die Feder klingt aus", async ({ page }) => {
    await laden(page)
    await expect
      .poll(() => page.evaluate(() => [...document.querySelectorAll("[data-raster] .spalte")].every((s) => s.hasAttribute("data-anim-fertig"))), { timeout: 8000 })
      .toBe(true)
    const mitte = await page.evaluate(() => {
      const s = [...document.querySelectorAll<HTMLElement>("[data-raster] .spalte")].filter((e) => e.getBoundingClientRect().height > 0)
      const r = s[1].getBoundingClientRect()
      return { x: r.left + r.width / 2, y: 300 }
    })
    await page.mouse.move(mitte.x, mitte.y)
    await expect.poll(() => page.locator("[data-raster] .spalte[data-hover]").count()).toBe(1)
    const an = () => page.evaluate(() => parseFloat(getComputedStyle(document.querySelector("[data-raster] .spalte[data-hover]")!).getPropertyValue("--spalte-an") || "0"))
    await expect.poll(an, { timeout: 4000 }).toBeGreaterThan(0.95)
    await page.mouse.move(2, 2)
    await expect.poll(() => page.locator("[data-raster] .spalte[data-hover]").count()).toBe(0)
    await expect
      .poll(() => page.evaluate(() => Math.max(...[...document.querySelectorAll("[data-raster] .spalte")].map((s) => parseFloat(getComputedStyle(s).getPropertyValue("--spalte-an") || "0")))), { timeout: 6000 })
      .toBeLessThan(0.02)
  })

  test("Hover über ein Objekt hebt dessen Spalten hervor (gleiche Spalten wie das Schriftfeld)", async ({ page }) => {
    await laden(page)
    // Die Karte trägt data-objekt im echten Markup (ProjektKarte)
    const karte = page.locator("#arbeit .projekt-karte").first()
    await expect(karte).toHaveAttribute("data-objekt", "")
    const spannweite = await karte.evaluate((e) => {
      const r = e.getBoundingClientRect()
      return [...document.querySelectorAll<HTMLElement>("[data-raster] .spalte")].filter((s) => {
        const c = s.getBoundingClientRect()
        return c.height > 0 && c.right > r.left && c.left < r.right
      }).length
    })
    await karte.scrollIntoViewIfNeeded()
    await karte.hover()
    await expect.poll(() => page.locator("[data-raster] .spalte[data-hover]").count()).toBeGreaterThanOrEqual(Math.min(spannweite, 2))
  })

  test.describe("grober Zeiger", () => {
    test.use({ hasTouch: true, isMobile: true })
    test("pointer: coarse: kein Hover-Effekt auf dem Raster", async ({ page }) => {
      await laden(page)
      expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true)
      await page.mouse.move(100, 300)
      await page.mouse.move(150, 320)
      await page.waitForTimeout(300)
      await expect(page.locator("[data-raster] .spalte[data-hover]")).toHaveCount(0)
    })
  })

  test("Elemente unter dem sichtbaren Bereich animieren einmal beim Hineinscrollen, nicht erneut", async ({ page }) => {
    await laden(page)
    const ziel = page.locator("#gedanken [data-anim='linie']")
    await expect(ziel).not.toHaveAttribute("data-anim-fertig", /.*/)
    await expect(ziel).toHaveCSS("transform", "matrix(0, 0, 0, 1, 0, 0)")
    expect(await ziel.evaluate((e) => e.getAnimations().length)).toBe(0)
    await ziel.evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - innerHeight * 0.5))
    await expect.poll(() => ziel.evaluate((e) => e.getAnimations().length), { timeout: 4000 }).toBeGreaterThan(0)
    await expect(ziel).toHaveAttribute("data-anim-fertig", "", { timeout: 8000 })
    await expect(ziel).toHaveCSS("transform", "none")
    // zweites Scrollen: weg und zurück ändert nichts
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(200)
    await ziel.evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - innerHeight * 0.5))
    await page.waitForTimeout(400)
    expect(await ziel.evaluate((e) => e.getAnimations().length)).toBe(0)
    await expect(ziel).toHaveCSS("transform", "none")
  })

  test("Signatur: Zeilen nur einmal, Endzustand ohne Inline-Reste (Gewicht aus dem Token-Endwert)", async ({ page }) => {
    await laden(page)
    const zeilen = page.locator(".text-signatur [data-anim='zeile']")
    await expect(zeilen).toHaveCount(3)
    const unterhalb = await zeilen.first().evaluate((e) => e.getBoundingClientRect().top > innerHeight * 0.85)
    if (unterhalb) {
      await expect(zeilen.first()).toHaveCSS("opacity", "0")
      await zeilen.first().evaluate((e) => window.scrollTo(0, e.getBoundingClientRect().top + scrollY - innerHeight * 0.5))
      await expect.poll(() => zeilen.first().evaluate((e) => getComputedStyle(e).fontWeight), { timeout: 3000 }).not.toBe("900")
    }
    await expect.poll(() => zeilen.evaluateAll((l) => l.every((e) => e.hasAttribute("data-anim-fertig"))), { timeout: 10000 }).toBe(true)
    for (const z of await zeilen.all()) {
      await expect(z).toHaveCSS("font-weight", "900")
      await expect(z).toHaveCSS("opacity", "1")
    }
  })

  test("Anker-Sprung: übersprungene Abschnitte erscheinen sofort im Endzustand", async ({ page }) => {
    await laden(page, "/#kontakt")
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500)
    // Poll-Fenster 8 s: zustandsbasierte Prüfung, die bei langsamer CI/Last dem Sprung hinterherläuft (3 s war zu knapp)
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            [...document.querySelectorAll("[data-anim]")]
              .filter((e) => e.getBoundingClientRect().bottom < 0)
              .every((e) => e.hasAttribute("data-anim-fertig") && e.getAnimations().length === 0 && getComputedStyle(e).opacity === "1")
          ),
        { timeout: 8000 }
      )
      .toBe(true)
    for (const el of await page.locator("[data-anim='linie']").all()) {
      const oben = await el.evaluate((e) => e.getBoundingClientRect().bottom < 0)
      if (oben) await expect(el).toHaveCSS("transform", "none")
    }
  })

  test("Akkordeon: Streifen wechseln mit Feder, das Bild behält die Breite des offenen Fensters, Graustufe kommt aus dem CSS-Zustand", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 768, "schmal ist das Akkordeon ein Wisch-Streifen")
    await laden(page)
    const streifen = page.locator("#digital-art [data-galerie-akkordeon] > a")
    await streifen.first().scrollIntoViewIfNeeded()
    // Ruhezustand gehört dem CSS: keine Inline-Werte; geschlossene Bilder grau und versetzt, das offene neutral
    const ruhe = await page.evaluate(() => {
      const s = [...document.querySelectorAll<HTMLElement>("#digital-art [data-galerie-akkordeon] > a")]
      return s.map((e) => {
        const img = e.querySelector("img")!
        return { inline: img.getAttribute("style") ?? "", filter: getComputedStyle(img).filter, x: new DOMMatrix(getComputedStyle(img).transform).m41 }
      })
    })
    expect(ruhe.every((r) => r.inline === "")).toBe(true)
    expect(ruhe[0].filter).toMatch(/^grayscale\(0\)$|^none$/)
    expect(ruhe[1].filter).toBe("grayscale(1)")
    expect(ruhe[0].x).toBe(0)
    expect(Math.abs(ruhe[1].x)).toBeGreaterThan(1)
    await page.evaluate(() => {
      const w = window as unknown as { __akk: Array<{ g0: number; g3: number; b3: number; f3: number; x3: number; breit: number }> }
      w.__akk = []
      const s = [...document.querySelectorAll<HTMLElement>("#digital-art [data-galerie-akkordeon] > a")]
      const wurzel = s[0].parentElement!
      const tick = () => {
        const img = s[3].querySelector("img")!
        const m = /grayscale\(([\d.]+)\)/.exec(getComputedStyle(img).filter)
        w.__akk.push({
          g0: parseFloat(getComputedStyle(s[0]).flexGrow),
          g3: parseFloat(getComputedStyle(s[3]).flexGrow),
          b3: img.getBoundingClientRect().width,
          f3: m ? parseFloat(m[1]) : NaN,
          x3: new DOMMatrix(getComputedStyle(img).transform).m41,
          breit: parseFloat(getComputedStyle(wurzel).getPropertyValue("--galerie-offen")) || 0,
        })
        if (w.__akk.length < 400) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await streifen.nth(3).focus()
    await expect(streifen.nth(3)).toHaveAttribute("aria-current", "true")
    await expect
      .poll(() => page.evaluate(() => [...document.querySelectorAll<HTMLElement>("#digital-art [data-galerie-akkordeon] > a")].map((e) => e.style.flexGrow).join("")), { timeout: 6000 })
      .toBe("")
    // die Bildfedern (länger als die Breite) ausklingen lassen
    await page.waitForTimeout(2500)
    const proben = await page.evaluate(() => (window as unknown as { __akk: Array<{ g0: number; g3: number; b3: number; f3: number; x3: number }> }).__akk)
    const gewicht = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector("[data-galerie-akkordeon]")!).getPropertyValue("--galerie-gewicht")))
    // Breite läuft durch Zwischenwerte (Feder), nicht in einem Sprung
    expect(proben.some((p) => p.g0 > 1.3 && p.g0 < gewicht - 0.3)).toBe(true)
    expect(proben.some((p) => p.g3 > 1.3 && p.g3 < gewicht - 0.3)).toBe(true)
    // Fenster: Bildbreite bleibt in jedem Frame gleich der Breite des offenen Streifens
    const b = proben.map((p) => p.b3)
    expect(Math.max(...b) - Math.min(...b)).toBeLessThan(1.5)
    // Graustufe des öffnenden Bildes wandert von der geschlossenen Stufe (1) zu 0, das Bild gleitet zur Mitte
    expect(proben[0].f3).toBeGreaterThan(0.5)
    expect(proben[proben.length - 1].f3).toBeCloseTo(0, 2)
    expect(proben.some((p) => p.f3 < proben[0].f3 - 0.05 && p.f3 > 0.02)).toBe(true)
    expect(Math.abs(proben[0].x3)).toBeGreaterThan(1)
    expect(Math.abs(proben[proben.length - 1].x3)).toBeLessThan(0.5)
    // Endzustand: nur noch das CSS (kein Inline-flex-grow), offener Streifen 3
    expect(await streifen.nth(3).evaluate((e) => getComputedStyle(e).flexGrow)).toBe(String(gewicht))
  })

  test("Watchdog: scheitert das Bündel, wird der Inhalt nach der Wartezeit sichtbar", async ({ page }) => {
    test.setTimeout(MOTION_WATCHDOG_MS + 30_000)
    await page.route("**/*", (route) => (route.request().resourceType() === "script" ? route.abort() : route.continue()))
    await page.goto("/", { waitUntil: "domcontentloaded" })
    await expect(page.locator("html")).toHaveAttribute("data-motion", "")
    await expect(page.locator("[data-anim='wort']").first()).toHaveCSS("opacity", "0")
    await page.waitForTimeout(MOTION_WATCHDOG_MS + 500)
    await expect(page.locator("html")).not.toHaveAttribute("data-motion", /.*/)
    await expect(page.locator("[data-anim='wort']").first()).toHaveCSS("opacity", "1")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    for (const el of await page.locator("[data-anim]").all()) await expect(el).toHaveCSS("opacity", "1")
    expect(await page.locator("body").innerText()).not.toContain("Screens")
  })

  test("Client-Router: nach Hin- und Rückweg keine doppelten Beobachter oder Hörer; Rückkehr per Zurück zeigt den Endzustand", async ({ page }) => {
    await laden(page)
    const lebend = () => page.evaluate(() => window.__motionLebend)
    const zuerst = await lebend()
    expect(zuerst).toBeGreaterThan(0)
    let nachZurueck: number | undefined
    for (let i = 0; i < 3; i++) {
      const knopf = page.getByRole("button", { name: "Menü", exact: true })
      if (await knopf.isVisible()) await knopf.click()
      await page.getByRole("navigation", { name: "Hauptnavigation" }).locator('a[href="/blog"]').click()
      await page.waitForURL("**/blog")
      await page.waitForSelector("body[data-bereit]")
      await page.goBack()
      await page.waitForURL((u) => u.pathname === "/")
      await startseiteDa(page)
      // Zurück: Wiederherstellung, kein erneuter Ablauf
      expect(await page.evaluate(() => [...document.querySelectorAll("[data-anim]")].every((e) => e.hasAttribute("data-anim-fertig")))).toBe(true)
      expect(await laufendeAnimationen(page)).toBe(0)
      await expect(page.locator(".ersatz .alt")).toHaveCount(0)
      // Wiederherstellung legt keine Beobachter für Scroll-Animationen an; mehr als beim ersten Zurück darf es nie werden
      nachZurueck ??= await lebend()
      expect(await lebend()).toBe(nachZurueck)
      expect(nachZurueck).toBeLessThanOrEqual(zuerst!)
    }
    // frische Ankunft über den Logo-Link: Hero läuft wieder
    const knopf = page.getByRole("button", { name: "Menü", exact: true })
    if (await knopf.isVisible()) await knopf.click()
    await page.getByRole("navigation", { name: "Hauptnavigation" }).locator('a[href="/blog"]').click()
    await page.waitForURL("**/blog")
    await page.waitForSelector("body[data-bereit]")
    if (await knopf.isVisible()) await knopf.click()
    await page.locator("header a.logo").click()
    await page.waitForURL((u) => u.pathname === "/")
    await startseiteDa(page)
    await expect.poll(() => page.locator("[data-anim='wort']").evaluateAll((l) => l.some((e) => !e.hasAttribute("data-anim-fertig"))), { timeout: 2000 }).toBe(true)
    await expect.poll(() => page.locator("[data-anim='wort']").evaluateAll((l) => l.every((e) => e.hasAttribute("data-anim-fertig"))), { timeout: 8000 }).toBe(true)
    expect(await lebend()).toBe(zuerst)
  })

  test("Axe unbeeinträchtigt, keine Konsolenfehler", async ({ page }) => {
    const fehler: string[] = []
    page.on("console", (m) => m.type() === "error" && fehler.push(m.text()))
    page.on("pageerror", (e) => fehler.push(e.message))
    await laden(page)
    await warteAufRuhe(page)
    const r = await new AxeBuilder({ page }).analyze()
    expect(r.violations).toEqual([])
    expect(fehler.filter((f) => !/cookiebot|ERR_|Failed to load resource/i.test(f))).toEqual([])
  })
})
