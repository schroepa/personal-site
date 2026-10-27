import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { BILD_ZOOM_FAKTOR, MAGNET_MAX_X, MAGNET_MAX_Y, SPERRUNG_START } from "../../src/scripts/motion/formen"

// Seitenübergreifende Bewegung (Task 13): Labels, Magnet-Knöpfe, „Ansehen“-Begleiter, Tag-Wischen, Bild-Zoom,
// Raster-Umbau, Signatur-Hover und die View Transition Projektkarte → Fallstudie.
// Erwartungswerte kommen aus den Tokens der Seite (getComputedStyle); nur Verhaltenswerte stehen hier.
const TOLERANZ_MS = 200

declare global {
  interface Window {
    __motionLebend?: number
    __lp?: Array<{ t: number; lesen: string | null; deko: string | null; ls: string; ws: string; text: string }>
    __vt?: Promise<unknown>
  }
}

async function laden(page: Page, url = "/") {
  await page.goto(url)
  await page.waitForSelector("body[data-bereit]")
}

const token = (page: Page, name: string) =>
  page.evaluate((n) => parseFloat(getComputedStyle(document.documentElement).getPropertyValue(n)), name)

const lebend = (page: Page) => page.evaluate(() => window.__motionLebend)

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" })
})

const nurDesktop = (info: { project: { name: string } }) => test.skip(info.project.name !== "desktop", "Zeigerverhalten: Desktop-Zeiger")

// ---------------------------------------------------------------------------------------------------------- Labels

/** Zeichnet pro Frame den Zustand eines Labels auf (Scramble-Knoten, Text, Sperrung). */
async function labelAufzeichnen(page: Page, selektor: string) {
  await page.evaluate((sel) => {
    window.__lp = []
    const el = document.querySelector<HTMLElement>(sel)!
    const tick = () => {
      const lesen = el.querySelector(":scope > .nur-vorlesen")
      const deko = lesen ? (lesen.nextElementSibling as HTMLElement | null) : null
      window.__lp!.push({
        t: performance.now(),
        lesen: lesen?.textContent ?? null,
        deko: deko?.textContent ?? null,
        ls: getComputedStyle(el).letterSpacing,
        ws: el.style.whiteSpace,
        text: el.textContent ?? "",
      })
      if (window.__lp!.length < 400) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, selektor)
}

test.describe("Labels", () => {
  test("Abschnitts-Label scrambled und endet im Originaltext; Sperrung 0.6em → normal in der Token-Dauer", async ({ page }) => {
    await laden(page)
    const label = page.locator("#digital-art h2")
    const original = await label.evaluate((e) => e.textContent!.replace(/\s+/g, " ").trim())
    expect(original).toContain("Digital Art")
    await labelAufzeichnen(page, "#digital-art h2")
    await label.scrollIntoViewIfNeeded()
    await page.waitForTimeout(2600)
    const proben = (await page.evaluate(() => window.__lp))!
    const laufend = proben.filter((p) => p.lesen !== null)
    expect(laufend.length).toBeGreaterThan(5)
    // Scramble: Zwischenstände weichen vom Original ab, haben aber dieselbe Länge
    const abweichend = laufend.filter((p) => p.deko !== original.replace(/\s+/g, " "))
    expect(abweichend.length).toBeGreaterThan(2)
    for (const p of laufend) expect(p.deko!.length).toBe(original.length)
    // Leerzeichen und Pfeil bleiben stehen
    expect(abweichend[0].deko![0]).toBe(original[0])
    // Endet im Originaltext: Knoten zurück, kein Scramble-Rest, kein Inline-Rest
    const ende = await label.evaluate((e) => ({ text: e.textContent!.replace(/\s+/g, " ").trim(), lesen: e.querySelectorAll(".nur-vorlesen").length, style: e.getAttribute("style") ?? "", fertig: e.hasAttribute("data-anim-fertig") }))
    expect(ende).toEqual({ text: original, lesen: 0, style: "", fertig: true })
    // Dauer des Scrambles = Token (Zeit zwischen erstem und letztem Zwischenstand)
    const scramble = await token(page, "--motion-schrift-scramble")
    const dauer = laufend.filter((p) => p.deko !== original)[laufend.filter((p) => p.deko !== original).length - 1].t - laufend[0].t
    expect(Math.abs(dauer - scramble)).toBeLessThan(TOLERANZ_MS + 100)
    // Sperrung: Start 0.6em der Schriftgröße, Ende die Sperrung des Textstils
    const groesse = await label.evaluate((e) => parseFloat(getComputedStyle(e).fontSize))
    const startPx = parseFloat(laufend[0].ls)
    const faktor = parseFloat(SPERRUNG_START)
    expect(startPx).toBeGreaterThan(groesse * faktor * 0.7)
    expect(startPx).toBeLessThanOrEqual(groesse * faktor + 0.5)
    const sperrDauer = await token(page, "--motion-schrift-sperrung")
    // (Die Kurve klingt aus: gemessen wird, bis der Rest unter 0.01 px fällt)
    const mitSperrung = proben.filter((p) => parseFloat(p.ls) > parseFloat(proben[proben.length - 1].ls) + 0.01)
    const sperrMs = mitSperrung[mitSperrung.length - 1].t - laufend[0].t
    expect(sperrMs).toBeGreaterThan(sperrDauer * 0.6)
    expect(sperrMs).toBeLessThan(sperrDauer + TOLERANZ_MS)
    expect(parseFloat(proben[proben.length - 1].ls)).toBeLessThan(groesse * 0.1)
    // Zeilenumbruch war während der Animation aus
    expect(laufend[0].ws).toBe("nowrap")
  })

  test("Label-Text bleibt für Screenreader unverändert (Überschriftenname konstant, Scramble aria-hidden)", async ({ page }) => {
    await laden(page)
    const label = page.locator("#digital-art h2")
    const name = "04 Digital Art"
    await expect(page.getByRole("heading", { level: 2, name, exact: true })).toHaveCount(1)
    await labelAufzeichnen(page, "#digital-art h2")
    await label.scrollIntoViewIfNeeded()
    // Während der Animation: Name immer derselbe
    let gesehenLaufend = false
    for (let i = 0; i < 12; i++) {
      await expect(page.getByRole("heading", { level: 2, name, exact: true })).toHaveCount(1)
      gesehenLaufend ||= (await label.locator(".nur-vorlesen").count()) > 0
      await page.waitForTimeout(80)
    }
    expect(gesehenLaufend).toBe(true)
    const proben = (await page.evaluate(() => window.__lp))!.filter((p) => p.lesen !== null)
    // Der versteckte Echttext ist in jedem Frame der Originaltext ohne Pfeil, die Scramble-Fassung ist aria-hidden
    expect(new Set(proben.map((p) => p.lesen))).toEqual(new Set([name]))
    await page.waitForTimeout(1800)
    await expect(page.getByRole("heading", { level: 2, name, exact: true })).toHaveCount(1)
    expect(await label.evaluate((e) => [...e.children].map((c) => c.getAttribute("aria-hidden")))).toEqual(["true"])
  })

  test("Hero-Kicker läuft sofort (Scramble und Sperrung), Name und Endtext bleiben", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __k: Array<{ lesen: boolean; deko: string }> }
      w.__k = []
      const tick = () => {
        const k = document.querySelector("[data-anim='kicker']")
        const lesen = k?.querySelector(":scope > .nur-vorlesen")
        if (lesen) w.__k.push({ lesen: true, deko: (lesen.nextElementSibling as HTMLElement).textContent! })
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await laden(page)
    const kicker = page.locator("[data-anim='kicker']")
    const original = "→ Design Engineer → Berlin"
    await expect.poll(() => kicker.evaluate((e) => e.hasAttribute("data-anim-fertig") && !e.querySelector(".nur-vorlesen") && !e.getAttribute("style")), { timeout: 5000 }).toBe(true)
    expect((await kicker.innerText()).replace(/\s+/g, " ")).toBe(original.toUpperCase().replace("→", "→"))
    const k = await page.evaluate(() => (window as unknown as { __k: Array<{ deko: string }> }).__k)
    expect(k.length).toBeGreaterThan(3)
    expect(k.some((p) => p.deko !== original)).toBe(true)
  })

  test.describe("ohne Bewegung", () => {
    test("reduced motion: Labels stehen sofort im Endzustand, ohne Scramble-Knoten", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" })
      await laden(page)
      await expect(page.locator("html")).not.toHaveAttribute("data-motion", /.*/)
      for (const l of await page.locator("[data-anim='label'], [data-anim='kicker']").all()) {
        await expect(l).toHaveCSS("opacity", "1")
        expect(await l.locator(".nur-vorlesen").count()).toBe(0)
        expect(await l.evaluate((e) => e.getAttribute("style") ?? "")).toBe("")
      }
    })
  })
})

test.describe("Labels ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })
  test("ohne JS: alle Labels sichtbar im Endtext", async ({ page }) => {
    await page.goto("/")
    for (const l of await page.locator("[data-anim='label'], [data-anim='kicker']").all()) {
      await expect(l).toHaveCSS("opacity", "1")
      await expect(l).toHaveCSS("letter-spacing", /^(?!.*7\.2px).*$/)
    }
    await expect(page.locator("#digital-art h2")).toContainText("Digital Art")
  })
})

// ---------------------------------------------------------------------------------------------------------- Magnet

test.describe("Magnet", () => {
  test.beforeEach(({}, info) => nurDesktop(info))

  const knopf = (page: Page) => page.locator("#ueber-mich [data-magnet]").first()

  test("der Knopf folgt dem Zeiger (begrenzt auf 7 × 5 px), kommt zurück, verschiebt kein Layout und bleibt unter dem Zeiger", async ({ page }) => {
    await laden(page)
    const k = knopf(page)
    await k.scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    const vorher = await page.evaluate(() => {
      const b = document.querySelector<HTMLElement>("#ueber-mich [data-magnet]")!
      const p = b.parentElement!.getBoundingClientRect()
      const g = b.nextElementSibling?.getBoundingClientRect()
      return { offset: [b.offsetLeft, b.offsetTop], eltern: [p.x, p.y, p.width, p.height], geschwister: g ? [g.x, g.y] : null, ruhe: b.getBoundingClientRect().toJSON() }
    })
    const box = (await k.boundingBox())!
    // Zeiger rechts unterhalb der Mitte (innerhalb der Pillenform): der Zug zeigt nach rechts unten
    const zx = box.x + box.width - 16
    const zy = box.y + box.height / 2 + 6
    await page.mouse.move(zx - 20, zy - 8)
    await page.mouse.move(zx, zy, { steps: 4 })
    await page.waitForTimeout(700)
    const wahrend = await page.evaluate(() => {
      const b = document.querySelector<HTMLElement>("#ueber-mich [data-magnet]")!
      const m = new DOMMatrix(getComputedStyle(b).transform)
      const p = b.parentElement!.getBoundingClientRect()
      const g = b.nextElementSibling?.getBoundingClientRect()
      return { x: m.m41, y: m.m42, offset: [b.offsetLeft, b.offsetTop], eltern: [p.x, p.y, p.width, p.height], geschwister: g ? [g.x, g.y] : null }
    })
    expect(wahrend.x).toBeGreaterThan(1)
    expect(wahrend.y).toBeGreaterThan(0.5)
    expect(wahrend.x).toBeLessThanOrEqual(MAGNET_MAX_X + 0.01)
    expect(wahrend.y).toBeLessThanOrEqual(MAGNET_MAX_Y + 0.01)
    // Kein Layoutversatz: Offset, Eltern und Geschwister unverändert
    expect(wahrend.offset).toEqual(vorher.offset)
    expect(wahrend.eltern).toEqual(vorher.eltern)
    expect(wahrend.geschwister).toEqual(vorher.geschwister)
    // Das Klickziel bleibt unter dem Zeiger
    expect(await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest("[data-magnet]"), [zx, zy])).toBe(true)
    // Zeiger geht: schnappt zurück (Transformation am Ende entfernt)
    await page.mouse.move(2, 2)
    await expect.poll(() => k.evaluate((e) => (e as HTMLElement).style.transform), { timeout: 6000 }).toBe("")
    const nachher = await k.evaluate((e) => e.getBoundingClientRect().toJSON())
    expect(nachher).toEqual(vorher.ruhe)
  })

  test("das Zurückschnappen schwingt nach (Zurück-Physik ist weicher gedämpft als das Folgen)", async ({ page }) => {
    await laden(page)
    const k = knopf(page)
    await k.scrollIntoViewIfNeeded()
    await page.waitForTimeout(500)
    const box = (await k.boundingBox())!
    await page.mouse.move(box.x + box.width - 18, box.y + box.height / 2 + 6)
    await page.mouse.move(box.x + box.width - 16, box.y + box.height / 2 + 6, { steps: 3 })
    await page.waitForTimeout(600)
    await page.evaluate(() => {
      const w = window as unknown as { __mx: number[] }
      w.__mx = []
      const b = document.querySelector<HTMLElement>("#ueber-mich [data-magnet]")!
      const tick = () => {
        w.__mx.push(new DOMMatrix(getComputedStyle(b).transform).m41)
        if (w.__mx.length < 150) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await page.mouse.move(2, 2)
    await page.waitForTimeout(2800)
    const x = await page.evaluate(() => (window as unknown as { __mx: number[] }).__mx)
    // Zwischen Start (positiv) und Ruhe (0) schwingt der Knopf über 0 hinaus (negativ)
    expect(Math.max(...x)).toBeGreaterThan(1)
    expect(Math.min(...x)).toBeLessThan(-0.05)
    expect(Math.abs(x[x.length - 1])).toBeLessThan(0.05)
  })

  test("reduced motion: kein Magnet", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await laden(page)
    const k = knopf(page)
    await k.scrollIntoViewIfNeeded()
    const box = (await k.boundingBox())!
    await page.mouse.move(box.x + box.width - 18, box.y + box.height / 2 + 6)
    await page.mouse.move(box.x + box.width - 16, box.y + box.height / 2 + 6, { steps: 3 })
    await page.waitForTimeout(400)
    expect(await k.evaluate((e) => (e as HTMLElement).style.transform)).toBe("")
  })

  test.describe("grober Zeiger", () => {
    test.use({ hasTouch: true, isMobile: true })
    test("pointer: coarse: kein Magnet, keine Hörer", async ({ page }) => {
      await laden(page)
      expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true)
      const k = knopf(page)
      await k.scrollIntoViewIfNeeded()
      const box = (await k.boundingBox())!
      await page.mouse.move(box.x + box.width - 3, box.y + box.height - 3)
      await page.mouse.move(box.x + box.width - 2, box.y + box.height - 2, { steps: 3 })
      await page.waitForTimeout(400)
      expect(await k.evaluate((e) => (e as HTMLElement).style.transform)).toBe("")
    })
  })
})

// ---------------------------------------------------------------------------------------------------- Begleiter

test.describe("„Ansehen“-Begleiter", () => {
  test.beforeEach(({}, info) => nurDesktop(info))

  const karte = (page: Page) => page.locator("#arbeit .projekt-karte").first()

  test("folgt dem Zeiger über der Karte (aria-hidden, ohne Zeigerziel), verschwindet beim Verlassen", async ({ page }) => {
    await laden(page)
    const k = karte(page)
    await k.scrollIntoViewIfNeeded()
    await expect(page.locator(".begleiter")).toHaveCount(1)
    const b = page.locator(".begleiter")
    await expect(b).toHaveAttribute("aria-hidden", "true")
    await expect(b).toHaveCSS("pointer-events", "none")
    await expect(b).not.toHaveAttribute("data-an", /.*/)
    const box = (await k.boundingBox())!
    await page.mouse.move(box.x + 60, box.y + 60)
    await page.mouse.move(box.x + 80, box.y + 70)
    await expect(b).toHaveAttribute("data-an", "")
    const mitte = async () => {
      const r = (await b.boundingBox())!
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
    }
    // erste Position: sofort am Zeiger (Feder startet dort), danach folgt sie dem Zeiger
    await expect.poll(async () => Math.abs((await mitte()).x - (box.x + 80))).toBeLessThan(4)
    await page.mouse.move(box.x + 300, box.y + 150, { steps: 6 })
    await expect.poll(async () => Math.abs((await mitte()).x - (box.x + 300)) + Math.abs((await mitte()).y - (box.y + 150)), { timeout: 4000 }).toBeLessThan(4)
    expect((await b.innerText()).toLowerCase()).toContain("ansehen")
    // Der Begleiter ist keine Tab-Stelle und kein Link
    expect(await b.evaluate((e) => e.tabIndex)).toBe(-1)
    await page.mouse.move(2, 2)
    await expect(b).not.toHaveAttribute("data-an", /.*/)
  })

  test("bei Tastaturfokus auf dem Link der Karte bleibt er aus; Mausbewegung in der Karte bringt ihn zurück", async ({ page }) => {
    await laden(page)
    const k = karte(page)
    await k.scrollIntoViewIfNeeded()
    const b = page.locator(".begleiter")
    const box = (await k.boundingBox())!
    await page.mouse.move(box.x + 60, box.y + 60)
    await page.mouse.move(box.x + 80, box.y + 70)
    await expect(b).toHaveAttribute("data-an", "")
    // Tastatur: Fokus auf den Titel-Link der Karte (Tab-Folge, :focus-visible)
    await k.locator("a").first().focus()
    await page.keyboard.press("Shift+Tab")
    await page.keyboard.press("Tab")
    await expect(k.locator("a").first()).toBeFocused()
    await expect(b).not.toHaveAttribute("data-an", /.*/)
    await page.mouse.move(box.x + 120, box.y + 90, { steps: 3 })
    await expect(b).toHaveAttribute("data-an", "")
  })

  test("reduced motion: es gibt keinen Begleiter", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await laden(page)
    await expect(page.locator(".begleiter")).toHaveCount(0)
  })

  test.describe("grober Zeiger", () => {
    test.use({ hasTouch: true, isMobile: true })
    test("pointer: coarse: kein Begleiter im Dokument", async ({ page }) => {
      await laden(page)
      await expect(page.locator(".begleiter")).toHaveCount(0)
    })
  })

  test("Seitenwechsel: nie mehr als ein Begleiter, nach dem Wegnavigieren keiner, bei Rückkehr wieder genau einer", async ({ page }) => {
    await laden(page)
    await expect(page.locator(".begleiter")).toHaveCount(1)
    for (let i = 0; i < 3; i++) {
      await page.getByRole("navigation", { name: "Hauptnavigation" }).locator('a[href="/blog"]').click()
      await page.waitForURL("**/blog")
      await page.waitForSelector("body[data-bereit]")
      await expect(page.locator(".begleiter")).toHaveCount(0)
      await page.locator("header a.logo").click()
      await page.waitForURL((u) => u.pathname === "/")
      await page.waitForFunction(() => !!document.querySelector("#einstieg") && document.body.hasAttribute("data-bereit"))
      await expect(page.locator(".begleiter")).toHaveCount(1)
    }
  })
})

// ---------------------------------------------------------------------------------------------------- Tag-Wischen

test.describe("Tag-Wischen", () => {
  const url = "/prototypes/komponenten"

  test("Maske wischt über die Token-Dauer mit der Öffnen-Kurve auf und endet vollständig sichtbar", async ({ page }) => {
    await laden(page, url)
    const tag = page.locator("[data-kontakt] [data-tag]")
    await expect(tag).toHaveAttribute("data-anim", "tag")
    // Startzustand: eingeklappt (vor dem Hineinscrollen)
    await expect(tag).not.toHaveAttribute("data-anim-fertig", /.*/)
    expect(await tag.evaluate((e) => getComputedStyle(e).clipPath)).toMatch(/inset\(0px 100% 0px 0px\)/)
    await page.evaluate(() => {
      const w = window as unknown as { __cp: number[] }
      w.__cp = []
      const t = document.querySelector("[data-kontakt] [data-tag]")!
      const tick = () => {
        const m = /inset\(\S+ (\S+)%/.exec(getComputedStyle(t).clipPath)
        w.__cp.push(m ? parseFloat(m[1]) : 0)
        if (w.__cp.length < 600) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await page.locator("[data-kontakt]").scrollIntoViewIfNeeded()
    await expect.poll(() => tag.evaluate((e) => e.getAnimations().length), { timeout: 3000 }).toBeGreaterThan(0)
    const timing = await tag.evaluate((e) => {
      const a = e.getAnimations()[0]
      return { dauer: a.effect!.getTiming().duration, easing: a.effect!.getTiming().easing }
    })
    const dauer = await token(page, "--motion-dauer-sehr-lang")
    expect(timing.dauer).toBe(dauer)
    const kurve = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--motion-easing-oeffnen").trim())
    const zahlen = (s: string) => (s.match(/-?\d*\.?\d+/g) ?? []).map(Number)
    expect(zahlen(String(timing.easing))).toEqual(zahlen(kurve))
    await page.waitForTimeout(dauer + 800)
    const cp = await page.evaluate(() => (window as unknown as { __cp: number[] }).__cp)
    // läuft durch Zwischenwerte von 100 % zu 0 % (rechter Beschnitt)
    expect(Math.max(...cp)).toBeGreaterThan(95)
    expect(cp.some((v) => v > 10 && v < 90)).toBe(true)
    expect(cp[cp.length - 1]).toBe(0)
    // Endzustand: freigegeben, keine Inline-Reste, keine Maske
    await expect(tag).toHaveAttribute("data-anim-fertig", "")
    expect(await tag.evaluate((e) => (e as HTMLElement).getAttribute("style") ?? "")).toBe("")
    expect(await tag.evaluate((e) => getComputedStyle(e).clipPath)).toBe("none")
  })

  test("reduced motion: Tag steht sofort voll da", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await laden(page, url)
    const tag = page.locator("[data-kontakt] [data-tag]")
    expect(await tag.evaluate((e) => getComputedStyle(e).clipPath)).toBe("none")
    await expect(tag.locator("svg")).toBeVisible()
  })

  test.describe("ohne JavaScript", () => {
    test.use({ javaScriptEnabled: false })
    test("ohne JS: Tag voll sichtbar", async ({ page }) => {
      await page.goto(url)
      expect(await page.locator("[data-kontakt] [data-tag]").evaluate((e) => getComputedStyle(e).clipPath)).toBe("none")
      await expect(page.locator("[data-kontakt] [data-tag] svg")).toBeVisible()
    })
  })
})

// ------------------------------------------------------------------------------------------- Bild-Zoom und Signatur

test.describe("Hover-Effekte", () => {
  test.beforeEach(({}, info) => nurDesktop(info))

  test("Bild-Zoom: leichter Zoom bei Hover mit Token-Dauer und -Kurve; Kein Zoom bei reduced motion", async ({ page }) => {
    await laden(page)
    const k = page.locator("#arbeit .projekt-karte").first()
    await k.scrollIntoViewIfNeeded()
    const img = k.locator("img")
    const dauer = await token(page, "--motion-objekt-bild-zoom")
    expect(await img.evaluate((e) => getComputedStyle(e).transitionDuration)).toBe(`${dauer / 1000}s`)
    expect(await img.evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).a)).toBe(1)
    const box = (await k.boundingBox())!
    await page.mouse.move(box.x + 40, box.y + 40)
    await page.mouse.move(box.x + 60, box.y + 50)
    await page.waitForTimeout(dauer + 400)
    expect(await img.evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).a)).toBeCloseTo(BILD_ZOOM_FAKTOR, 3)
    await page.mouse.move(2, 2)
    await page.waitForTimeout(dauer + 400)
    expect(await img.evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).a)).toBeCloseTo(1, 3)
    // Kein Bild-Reveal: das Bild trägt keinen Startzustand
    expect(await img.evaluate((e) => e.closest("[data-anim]"))).toBeNull()
  })

  test("Bild-Zoom: unter reduced motion bleibt das Bild stehen", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await laden(page)
    const k = page.locator("#arbeit .projekt-karte").first()
    await k.scrollIntoViewIfNeeded()
    const box = (await k.boundingBox())!
    await page.mouse.move(box.x + 40, box.y + 40)
    await page.mouse.move(box.x + 60, box.y + 50)
    await page.waitForTimeout(300)
    expect(await k.locator("img").evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).a)).toBe(1)
    expect(await page.evaluate(() => document.documentElement.style.getPropertyValue("--bild-zoom-faktor"))).toBe("")
  })

  test("Signatur: Hover macht die Zeile leicht (Token-Gewicht), Verlassen bringt das Gewicht zurück", async ({ page }) => {
    await laden(page)
    const zeile = page.locator("[data-signatur] [data-anim='zeile']").first()
    await zeile.scrollIntoViewIfNeeded()
    await expect(zeile).toHaveAttribute("data-anim-fertig", "", { timeout: 8000 })
    const ruhe = await zeile.evaluate((e) => parseFloat(getComputedStyle(e).fontWeight))
    const leicht = await token(page, "--font-weight-light")
    const dauer = await token(page, "--motion-schrift-gewicht-hover")
    const box = (await zeile.boundingBox())!
    await page.mouse.move(box.x + 5, box.y + box.height / 2)
    await page.mouse.move(box.x + 20, box.y + box.height / 2)
    await page.waitForTimeout(dauer + 300)
    expect(await zeile.evaluate((e) => parseFloat(getComputedStyle(e).fontWeight))).toBe(leicht)
    await page.mouse.move(2, 2)
    await page.waitForTimeout(dauer + 400)
    expect(await zeile.evaluate((e) => parseFloat(getComputedStyle(e).fontWeight))).toBe(ruhe)
    expect(await zeile.evaluate((e) => (e as HTMLElement).style.fontWeight)).toBe("")
  })

  test("Raster-Umbau: beim Wechsel der Spaltenzahl blendet das Raster in der Token-Dauer ein", async ({ page }) => {
    await laden(page)
    await page.waitForTimeout(2200)
    const vorher = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--layout-columns").trim())
    await page.evaluate(() => {
      const w = window as unknown as { __um: Array<{ d: number | string; e: string; o: string }> }
      w.__um = []
      const r = document.querySelector("[data-raster]")!
      const tick = () => {
        for (const a of r.getAnimations()) w.__um.push({ d: a.effect!.getTiming().duration as number, e: String(a.effect!.getTiming().easing), o: getComputedStyle(r).opacity })
        if (w.__um.length < 300) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await page.setViewportSize({ width: 900, height: 900 })
    await page.waitForTimeout(900)
    const nachher = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--layout-columns").trim())
    expect(nachher).not.toBe(vorher)
    const um = await page.evaluate(() => (window as unknown as { __um: Array<{ d: number; e: string; o: string }> }).__um)
    const dauer = await token(page, "--motion-raster-umbau")
    expect(um.length).toBeGreaterThan(0)
    expect(um[0].d).toBe(dauer)
    expect(um[0].e).toBe("ease")
    expect(await page.locator("[data-raster]").evaluate((e) => getComputedStyle(e).opacity)).toBe("1")
    expect(await page.locator("[data-raster]").evaluate((e) => (e as HTMLElement).style.opacity)).toBe("")
  })
})

// ------------------------------------------------------------------------------------------------ View Transition

test.describe("View Transition Projektkarte → Fallstudie", () => {
  test.beforeEach(({}, info) => nurDesktop(info))

  /** Merkt sich die erste View Transition des Dokuments (Router ruft document.startViewTransition). */
  async function vtMerken(page: Page) {
    await page.addInitScript(() => {
      const w = window as unknown as { __vt: Array<unknown>; __vtAnim: Array<{ ziel: string; dauer: number; easing: string }> }
      w.__vt = []
      w.__vtAnim = []
      const original = document.startViewTransition?.bind(document)
      if (!original) return
      document.startViewTransition = ((cb: () => void) => {
        const t = original(cb)
        w.__vt.push(t)
        t.ready
          .then(() => {
            for (const a of document.getAnimations()) {
              const eff = a.effect as KeyframeEffect
              const ziel = (eff.pseudoElement ?? "") as string
              if (ziel.startsWith("::view-transition"))
                w.__vtAnim.push({ ziel, dauer: eff.getComputedTiming().duration as number, easing: String(eff.getTiming().easing) })
            }
          })
          .catch(() => {})
        return t
      }) as typeof document.startViewTransition
    })
  }

  const ersteKarte = (page: Page) => page.locator("#arbeit .projekt-karte").first()

  test("Karte und Titelbild der Fallstudie tragen denselben view-transition-name und die Klasse; Dauer = Token", async ({ page }) => {
    await vtMerken(page)
    await laden(page)
    const k = ersteKarte(page)
    await k.scrollIntoViewIfNeeded()
    const vor = await k.locator("[data-bild]").evaluate((e) => ({ name: getComputedStyle(e).viewTransitionName, klasse: getComputedStyle(e).getPropertyValue("view-transition-class") }))
    expect(vor.name).toMatch(/^projekt-bild-./)
    expect(vor.klasse).toBe("projekt-bild")
    const href = (await k.locator("a").first().getAttribute("href"))!
    await k.locator("a").first().click()
    await page.waitForURL(`**${href}`)
    await page.waitForSelector("body[data-bereit]")
    const nach = await page.locator("[data-titelbild] .bild").evaluate((e) => ({ name: getComputedStyle(e).viewTransitionName, klasse: getComputedStyle(e).getPropertyValue("view-transition-class") }))
    expect(nach).toEqual(vor)
    // Übergang lief mit der Token-Dauer (Pseudoelement der Gruppe des Bildes)
    const dauer = await token(page, "--motion-objekt-uebergang")
    const anim = await page.evaluate(() => (window as unknown as { __vtAnim: Array<{ ziel: string; dauer: number }> }).__vtAnim)
    const gruppe = anim.filter((a) => a.ziel === `::view-transition-group(${vor.name})`)
    expect(gruppe.length).toBeGreaterThan(0)
    expect(gruppe.every((a) => a.dauer === dauer)).toBe(true)
    // Lenis + Übergang: die Fallstudie beginnt oben, genau eine Lenis-Instanz
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    expect(await page.evaluate(() => (window as unknown as { __lenisCount?: number }).__lenisCount)).toBe(1)
  })

  test("Zurück-Taste: Übergang in Gegenrichtung, Scrollposition und genau eine Lenis-Instanz", async ({ page }) => {
    await vtMerken(page)
    await laden(page)
    const k = ersteKarte(page)
    await k.scrollIntoViewIfNeeded()
    await page.evaluate(() => window.scrollBy(0, 40))
    await page.waitForTimeout(300)
    const y = await page.evaluate(() => window.scrollY)
    const name = await k.locator("[data-bild]").evaluate((e) => getComputedStyle(e).viewTransitionName)
    await k.locator("a").first().click()
    await page.waitForURL("**/projects/**")
    await page.waitForSelector("body[data-bereit]")
    await page.evaluate(() => ((window as unknown as { __vtAnim: unknown[] }).__vtAnim.length = 0))
    await page.goBack()
    await page.waitForURL((u) => u.pathname === "/")
    await page.waitForFunction(() => !!document.querySelector("#einstieg") && document.body.hasAttribute("data-bereit"))
    const anim = await page.evaluate(() => (window as unknown as { __vtAnim: Array<{ ziel: string; dauer: number }> }).__vtAnim)
    const dauer = await token(page, "--motion-objekt-uebergang")
    const gruppe = anim.filter((a) => a.ziel === `::view-transition-group(${name})`)
    expect(gruppe.length).toBeGreaterThan(0)
    expect(gruppe.every((a) => a.dauer === dauer)).toBe(true)
    await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 4000 }).toBeGreaterThan(y - 120)
    expect(await page.evaluate(() => (window as unknown as { __lenisCount?: number }).__lenisCount)).toBe(1)
    await expect(ersteKarte(page)).toBeVisible()
  })

  test("reduced motion: keine Übergangsanimation (Dauer 0)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await vtMerken(page)
    await laden(page)
    const k = ersteKarte(page)
    await k.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--motion-objekt-uebergang").trim())).toBe("0ms")
    await k.locator("a").first().click()
    await page.waitForURL("**/projects/**")
    await page.waitForSelector("body[data-bereit]")
    const anim = await page.evaluate(() => (window as unknown as { __vtAnim: Array<{ ziel: string; dauer: number }> }).__vtAnim)
    // Falls der Router überhaupt eine Transition startet: jede Animation des Bildes und der Seite hat Dauer 0
    const relevant = anim.filter((a) => a.ziel.includes("projekt-bild") || a.ziel.includes("(root)"))
    expect(relevant.map((a) => `${a.ziel}=${a.dauer}`).filter((t) => !t.endsWith("=0"))).toEqual([])
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })
})

// ------------------------------------------------------------------------------ Seitenwechsel, CLS, Axe, Konsole

test.describe("Robustheit", () => {
  test("Hin- und Rückweg über den Router lässt keine zusätzlichen Hörer oder Beobachter zurück", async ({ page }) => {
    await laden(page, "/projects")
    const erste = await lebend(page)
    expect(erste).toBeGreaterThan(0)
    for (let i = 0; i < 3; i++) {
      const knopf = page.getByRole("button", { name: "Menü", exact: true })
      if (await knopf.isVisible()) await knopf.click()
      await page.getByRole("navigation", { name: "Hauptnavigation" }).locator('a[href="/about"]').click()
      await page.waitForURL("**/about")
      await page.waitForSelector("body[data-bereit]")
      if (await knopf.isVisible()) await knopf.click()
      await page.getByRole("navigation", { name: "Hauptnavigation" }).locator('a[href="/projects"]').click()
      await page.waitForURL("**/projects")
      await page.waitForFunction(() => !!document.querySelector("[data-filter-root]") && document.body.hasAttribute("data-bereit"))
      expect(await lebend(page)).toBe(erste)
    }
  })

  test("Layoutverschiebung (CLS) beim Durchscrollen der Startseite bleibt unter 0.01", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number }
      w.__cls = 0
      new PerformanceObserver((liste) => {
        for (const e of liste.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) if (!e.hadRecentInput) w.__cls += e.value
      }).observe({ type: "layout-shift", buffered: true })
    })
    await laden(page)
    const hoehe = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y < hoehe; y += 500) {
      await page.evaluate((v) => window.scrollTo(0, v), y)
      await page.waitForTimeout(250)
    }
    await page.waitForTimeout(2200)
    expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.01)
  })

  for (const url of ["/", "/projects", "/prototypes/komponenten"]) {
    test(`Axe ohne Verstöße, keine Konsolenfehler (${url})`, async ({ page }) => {
      const fehler: string[] = []
      page.on("console", (m) => m.type() === "error" && fehler.push(m.text()))
      page.on("pageerror", (e) => fehler.push(e.message))
      await laden(page, url)
      // mitten in der Label-Animation prüfen: aria-hidden-Scramble darf Axe nicht stören
      await page.locator("h2").nth(2).scrollIntoViewIfNeeded()
      await page.waitForTimeout(200)
      const r = await new AxeBuilder({ page }).analyze()
      expect(r.violations).toEqual([])
      expect(fehler.filter((f) => !/cookiebot|ERR_|Failed to load resource/i.test(f))).toEqual([])
    })
  }
})
