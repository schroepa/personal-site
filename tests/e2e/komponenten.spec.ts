import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { expectNoHorizontalOverflow, setTheme } from "../helpers"

const URL = "/prototypes/komponenten"

async function laden(page: Page) {
  await page.goto(URL)
  await page.waitForSelector("body[data-bereit]")
}

/** Token über eine Sonde auflösen: der Browser rechnet var(--token) in den berechneten Wert um. */
async function token(page: Page, prop: string, name: string): Promise<string> {
  return page.evaluate(
    ([p, n]) => {
      const sonde = document.createElement("div")
      sonde.style.setProperty(p, `var(${n})`)
      document.body.appendChild(sonde)
      const wert = getComputedStyle(sonde).getPropertyValue(p)
      sonde.remove()
      return wert
    },
    [prop, name]
  )
}

const stil = (page: Page, selector: string, prop: string) =>
  page.locator(selector).first().evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop)

const breite = (page: Page) => page.viewportSize()!.width

/** Spaltenspuren (px) und Abstand eines Grids. */
async function spuren(page: Page, selector: string) {
  return page.locator(selector).first().evaluate((el) => {
    const cs = getComputedStyle(el)
    return {
      spuren: cs.gridTemplateColumns.split(" ").map(parseFloat),
      abstand: parseFloat(cs.columnGap),
      links: el.getBoundingClientRect().left,
    }
  })
}

const box = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width }
  })

test.describe("Abschnitt", () => {
  test("Semantik: section[aria-labelledby], h2 „03 Arbeit“, Pfeil dekorativ", async ({ page }) => {
    await laden(page)
    const sektion = page.locator("section#karten")
    const labelId = await sektion.getAttribute("aria-labelledby")
    expect(labelId).toBeTruthy()
    const h2 = page.locator(`h2#${labelId}`)
    await expect(h2).toHaveCount(1)
    await expect(sektion.getByRole("heading", { level: 2, name: /^03 Arbeit$/i })).toBeVisible()
    await expect(h2.locator("[aria-hidden='true']")).toHaveText(/→/)
  })

  test("links: Label 3 von 12 Spalten ab 1024, darunter über dem Inhalt", async ({ page }) => {
    await laden(page)
    const raster = await spuren(page, "#abschnitt-links")
    const label = await box(page, "#abschnitt-links h2")
    const inhalt = await box(page, "#abschnitt-links [data-inhalt]")
    if (breite(page) >= 1024) {
      expect(raster.spuren).toHaveLength(12)
      const dreiSpalten = raster.spuren.slice(0, 3).reduce((a, b) => a + b, 0) + 2 * raster.abstand
      expect(label.width).toBeCloseTo(dreiSpalten, 0)
      // Inhalt beginnt in Spalte 4 und liegt auf Höhe des Labels
      const spalte4 = raster.links + raster.spuren.slice(0, 3).reduce((a, b) => a + b, 0) + 3 * raster.abstand
      expect(inhalt.left).toBeCloseTo(spalte4, 0)
      expect(Math.abs(inhalt.top - label.top)).toBeLessThan(2)
    } else {
      expect(inhalt.top).toBeGreaterThanOrEqual(label.bottom)
      expect(inhalt.left).toBeCloseTo(label.left, 0)
    }
  })

  test("oben: Label über dem Inhalt in jeder Breite", async ({ page }) => {
    await laden(page)
    const label = await box(page, "#abschnitt-oben h2")
    const inhalt = await box(page, "#abschnitt-oben [data-inhalt]")
    expect(inhalt.top).toBeGreaterThanOrEqual(label.bottom)
    expect(inhalt.left).toBeCloseTo(label.left, 0)
    const sektion = await box(page, "#abschnitt-oben")
    expect(inhalt.width).toBeCloseTo(sektion.width, 0)
  })

  test("Fließtext höchstens 7 der 9 Inhaltsspalten (links, 1440)", async ({ page }) => {
    test.skip(breite(page) < 1024, "nur im Layout links")
    await laden(page)
    const raster = await spuren(page, "#abschnitt-links")
    const absatz = await box(page, "#abschnitt-links [data-inhalt] > p")
    const siebenSpalten = raster.spuren.slice(0, 7).reduce((a, b) => a + b, 0) + 6 * raster.abstand
    expect(absatz.width).toBeLessThanOrEqual(siebenSpalten + 1)
  })

  test("Werte aus Tokens: Linie, Abstand, Label-Farbe", async ({ page }) => {
    await laden(page)
    expect(await stil(page, "#abschnitt-oben", "row-gap")).toBe(await token(page, "row-gap", "--abschnitt-abstand"))
    expect(await stil(page, "#abschnitt-oben", "padding-bottom")).toBe(
      await token(page, "padding-bottom", "--abschnitt-abstand-unten")
    )
    expect(await stil(page, "#abschnitt-oben h2", "color")).toBe(await token(page, "color", "--abschnitt-label-farbe"))
    expect(await stil(page, "#abschnitt-oben [data-linie]", "background-color")).toBe(
      await token(page, "background-color", "--abschnitt-linie-farbe")
    )
    expect(await stil(page, "#abschnitt-oben [data-linie]", "height")).toBe(
      await token(page, "height", "--abschnitt-linie-staerke")
    )
  })
})

test.describe("Seitenkopf", () => {
  test("rendert die h1, Label darüber, Zusatz-Slot", async ({ page }) => {
    await laden(page)
    const kopf = page.locator(".seitenkopf").first()
    await expect(kopf.locator("h1")).toHaveCount(1)
    await expect(kopf.locator("[data-zusatz]")).toHaveCount(1)
    const label = await box(page, ".seitenkopf [data-label]")
    const titel = await box(page, ".seitenkopf h1")
    expect(titel.top).toBeGreaterThan(label.bottom)
    // Titel nutzt text/hero, Artikel-Titel text/h1
    expect(await stil(page, ".seitenkopf h1", "font-size")).toBe(await token(page, "font-size", "--text-hero-size"))
    expect(await stil(page, ".seitenkopf-artikel h1", "font-size")).toBe(await token(page, "font-size", "--text-h1-size"))
  })

  test("Titel über 9 Spalten ab 1024", async ({ page }) => {
    test.skip(breite(page) < 1024)
    await laden(page)
    const raster = await spuren(page, ".seitenkopf [data-aussage]")
    const titel = await box(page, ".seitenkopf h1")
    const neun = raster.spuren.slice(0, 9).reduce((a, b) => a + b, 0) + 8 * raster.abstand
    expect(titel.width).toBeLessThanOrEqual(neun + 1)
  })
})

test.describe("KontaktPanel", () => {
  for (const [theme, rgb] of [
    ["light", "rgb(238, 173, 107)"],
    ["dark", "rgb(230, 152, 64)"],
  ] as const) {
    test(`${theme}: Fläche ${rgb}, Text neutral/950 (Token-Wert)`, async ({ page }) => {
      await laden(page)
      await setTheme(page, theme)
      expect(await stil(page, ".kontakt-panel", "background-color")).toBe(rgb)
      const text = await token(page, "color", "--theme-text-on-secondary")
      expect(text).toBe("rgb(36, 33, 31)")
      expect(await stil(page, ".kontakt-panel", "color")).toBe(text)
      expect(await stil(page, ".kontakt-panel [data-email]", "color")).toBe(text)
    })
  }

  test("Radius, Innenabstand und E-Mail in text/h1 aus Tokens", async ({ page }) => {
    await laden(page)
    expect(await stil(page, ".kontakt-panel", "border-top-left-radius")).toBe("32px")
    expect(await stil(page, ".kontakt-panel", "border-top-left-radius")).toBe(
      await token(page, "border-top-left-radius", "--kontakt-panel-radius")
    )
    const gross = breite(page) >= 768
    const px = await token(page, "padding-left", gross ? "--kontakt-panel-innenabstand-x" : "--kontakt-panel-innenabstand-mobil-x")
    const py = await token(page, "padding-top", gross ? "--kontakt-panel-innenabstand-y" : "--kontakt-panel-innenabstand-mobil-y")
    expect(await stil(page, ".kontakt-panel", "padding-left")).toBe(px)
    expect(await stil(page, ".kontakt-panel", "padding-top")).toBe(py)
    expect(await stil(page, ".kontakt-panel [data-email]", "font-size")).toBe(await token(page, "font-size", "--text-h1-size"))
  })

  test("Semantik: section[aria-labelledby] auf den Titel, ohne Tag kein Platzhalter", async ({ page }) => {
    await laden(page)
    const id = await page.locator(".kontakt-panel").getAttribute("aria-labelledby")
    await expect(page.locator(`h2#${id}`)).toHaveText("Lass uns reden.")
    await expect(page.locator(".kontakt-panel [data-tag]")).toHaveCount(0)
  })

  test("Klick auf Kopieren füllt den aria-live-Bereich und legt die Adresse ab", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])
    await laden(page)
    const live = page.locator(".kontakt-panel [aria-live='polite']")
    await expect(live).toHaveText("")
    await page.getByRole("button", { name: "Adresse kopieren" }).click()
    await expect(live).toContainText("kopiert")
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("patrick@ptrckschrdtr.de")
  })

  test("Fehlerfall: Meldung mit Hinweis, Text ist markiert", async ({ page }) => {
    await laden(page)
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("blockiert")) },
      })
    })
    await page.getByRole("button", { name: "Adresse kopieren" }).click()
    await expect(page.locator(".kontakt-panel [aria-live='polite']")).toContainText("nicht möglich")
    expect(await page.evaluate(() => window.getSelection()?.toString().trim())).toBe("patrick@ptrckschrdtr.de")
  })
})

test.describe("ProjektKarte", () => {
  test("verschachtelte Radien: Karte 24, Bild 16, Innenabstand 8", async ({ page }) => {
    await laden(page)
    expect(await stil(page, ".projekt-karte", "border-top-left-radius")).toBe("24px")
    expect(await stil(page, ".projekt-karte", "border-top-left-radius")).toBe(
      await token(page, "border-top-left-radius", "--projekt-karte-radius")
    )
    expect(await stil(page, ".projekt-karte [data-bild]", "border-top-left-radius")).toBe("16px")
    expect(await stil(page, ".projekt-karte [data-bild]", "border-top-left-radius")).toBe(
      await token(page, "border-top-left-radius", "--projekt-karte-bild-radius")
    )
    expect(await stil(page, ".projekt-karte", "padding-top")).toBe("8px")
    expect(await stil(page, ".projekt-karte", "padding-top")).toBe(await token(page, "padding-top", "--projekt-karte-innenabstand"))
    expect(await stil(page, ".projekt-karte", "background-color")).toBe(
      await token(page, "background-color", "--projekt-karte-flaeche")
    )
  })

  test("Formate: Seitenverhältnis 16:10, 4:5, 1:1", async ({ page }) => {
    await laden(page)
    const verhaeltnisse = await page.locator(".projekt-karte [data-bild]").evaluateAll((els) =>
      els.slice(0, 3).map((el) => {
        const r = el.getBoundingClientRect()
        return r.width / r.height
      })
    )
    expect(verhaeltnisse[0]).toBeCloseTo(16 / 10, 1)
    expect(verhaeltnisse[1]).toBeCloseTo(4 / 5, 1)
    expect(verhaeltnisse[2]).toBeCloseTo(1, 1)
  })

  test("ein Linkziel pro Karte, Titel h3, Bild-Transition-Name", async ({ page }) => {
    await laden(page)
    const karten = page.locator(".projekt-karte")
    const anzahl = await karten.count()
    expect(anzahl).toBeGreaterThanOrEqual(3)
    for (let i = 0; i < anzahl; i++) {
      await expect(karten.nth(i).locator("a")).toHaveCount(1)
      await expect(karten.nth(i).locator("h3 > a")).toHaveCount(1)
    }
    const name = await stil(page, ".projekt-karte [data-bild]", "view-transition-name")
    expect(name).toMatch(/^projekt-bild-[a-z0-9-]+$/)
    // die ganze Karte ist klickbar
    await karten.first().scrollIntoViewIfNeeded()
    const k = await box(page, ".projekt-karte")
    await page.mouse.move(k.left + k.width / 2, k.top + 20)
    const treffer = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest("a")?.getAttribute("href"),
      [k.left + k.width / 2, k.top + 20]
    )
    expect(treffer).toBeTruthy()
  })
})

test.describe("ArtikelZeile", () => {
  test("Titel ist der Link (h3 > a), Bild dekorativ, ganze Zeile klickbar", async ({ page }) => {
    await laden(page)
    const zeilen = page.locator(".artikel-zeile")
    expect(await zeilen.count()).toBeGreaterThanOrEqual(3)
    await expect(zeilen.first().locator("h3 > a")).toHaveCount(1)
    await expect(zeilen.first().locator("a")).toHaveCount(1)
    await zeilen.first().scrollIntoViewIfNeeded()
    const z = await box(page, ".artikel-zeile")
    const href = await page.evaluate(
      ([x, y]) => document.elementFromPoint(x, y)?.closest("a")?.getAttribute("href"),
      [z.left + 10, z.top + 10]
    )
    expect(href).toBeTruthy()
  })

  test("Bildradien und Höhen aus Tokens (groß 24, klein 16)", async ({ page }) => {
    await laden(page)
    expect(await stil(page, ".artikel-zeile-gross [data-bild]", "border-top-left-radius")).toBe(
      await token(page, "border-top-left-radius", "--artikel-zeile-bild-radius-gross")
    )
    expect(await stil(page, ".artikel-zeile-klein [data-bild]", "border-top-left-radius")).toBe(
      await token(page, "border-top-left-radius", "--artikel-zeile-bild-radius-klein")
    )
    const hoehe = breite(page) >= 768 ? "--artikel-zeile-bild-hoehe-gross" : "--artikel-zeile-bild-hoehe-mobil"
    expect(await stil(page, ".artikel-zeile-gross [data-bild]", "height")).toBe(await token(page, "height", hoehe))
  })

  test("groß: Bild links, Text rechts ab 768", async ({ page }) => {
    test.skip(breite(page) < 768)
    await laden(page)
    const bild = await box(page, ".artikel-zeile-gross [data-bild]")
    const text = await box(page, ".artikel-zeile-gross [data-text]")
    expect(text.left).toBeGreaterThanOrEqual(bild.right)
  })
})

test.describe("Inhaltsverzeichnis", () => {
  test("nav[aria-label=Inhalt] mit Linkliste, Ziele ≥ 24 px hoch", async ({ page }) => {
    await laden(page)
    const nav = page.getByRole("navigation", { name: "Inhalt" })
    await expect(nav).toBeVisible()
    const links = nav.getByRole("link")
    expect(await links.count()).toBeGreaterThanOrEqual(3)
    for (const h of await links.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height))) {
      expect(h).toBeGreaterThanOrEqual(24)
    }
  })

  test("aria-current folgt dem Scrollen und der Sprungmarke", async ({ page }) => {
    await laden(page)
    const nav = page.getByRole("navigation", { name: "Inhalt" })
    const links = nav.getByRole("link")
    // Genau ein Eintrag ist aktuell
    await expect(nav.locator("[aria-current='true']")).toHaveCount(1)
    await page.locator("#verz-zwei").scrollIntoViewIfNeeded()
    await page.evaluate(() => {
      const ziel = document.getElementById("verz-zwei")!
      window.scrollTo(0, ziel.getBoundingClientRect().top + window.scrollY)
    })
    await expect(links.nth(1)).toHaveAttribute("aria-current", "true")
    await expect(nav.locator("[aria-current='true']")).toHaveCount(1)
    await page.evaluate(() => {
      const ziel = document.getElementById("verz-drei")!
      window.scrollTo(0, ziel.getBoundingClientRect().top + window.scrollY)
    })
    await expect(links.nth(2)).toHaveAttribute("aria-current", "true")
    await expect(links.nth(1)).not.toHaveAttribute("aria-current", "true")
  })

  test("Tab-Reihenfolge der Einträge folgt der Dokumentreihenfolge", async ({ page }) => {
    await laden(page)
    const links = page.getByRole("navigation", { name: "Inhalt" }).getByRole("link")
    await links.first().focus()
    const erwartet = await links.evaluateAll((els) => els.map((el) => el.getAttribute("href")))
    for (let i = 1; i < erwartet.length; i++) {
      await page.keyboard.press("Tab")
      expect(await page.evaluate(() => document.activeElement?.getAttribute("href"))).toBe(erwartet[i])
    }
  })
})

test.describe("Faktenzeile", () => {
  test("dl mit dt/dd, drei Fakten, externe Aktion in neuem Tab mit Hinweis", async ({ page }) => {
    await laden(page)
    const dl = page.locator(".faktenzeile dl").first()
    await expect(dl.locator("dt")).toHaveCount(3)
    await expect(dl.locator("dd")).toHaveCount(3)
    const extern = page.locator(".faktenzeile").first().getByRole("link", { name: /Live ansehen/ })
    await expect(extern).toHaveAttribute("target", "_blank")
    await expect(extern).toHaveAttribute("rel", /noopener/)
    expect(await extern.getAttribute("aria-label")).toMatch(/neuem Tab/)
  })

  test("drei Fakten à 3 von 12 Spalten ab 1024", async ({ page }) => {
    test.skip(breite(page) < 1024)
    await laden(page)
    const raster = await spuren(page, ".faktenzeile")
    const fakt = await box(page, ".faktenzeile dl > div:nth-child(2)")
    const dreiSpalten = raster.spuren.slice(0, 3).reduce((a, b) => a + b, 0) + 2 * raster.abstand
    expect(fakt.width).toBeCloseTo(dreiSpalten, 0)
    expect(fakt.left).toBeCloseTo(raster.links + dreiSpalten + raster.abstand, 0)
  })
})

test.describe("Galerie gesamt", () => {
  test("lange deutsche Titel: kein horizontaler Überlauf", async ({ page }) => {
    await laden(page)
    const lang = await page.locator("#lang-kopf, #lang").evaluateAll((els) => els.map((e) => e.textContent).join(" "))
    expect(lang).toMatch(/Datenschutzerklärungsüberarbeitung\S{40,}/)
    await expectNoHorizontalOverflow(page)
    const ueberlauf = await page.locator("#lang-kopf *, #lang *").evaluateAll((els) =>
      els
        .filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).display !== "inline")
        .map((el) => `${el.tagName}.${el.className}`)
    )
    expect(ueberlauf).toEqual([])
  })

  test("Tab-Reihenfolge der Inhalte folgt der Dokumentreihenfolge", async ({ page }) => {
    await laden(page)
    // Roving-Tabindex (Galerie-Akkordeon): Streifen mit tabindex=-1 sind nicht per Tab erreichbar
    const ziele = "main a[href]:not([tabindex='-1']), main button"
    const erwartet = await page.locator(ziele).evaluateAll((els) => els.map((el, i) => (el.setAttribute("data-tab", String(i)), i)))
    expect(erwartet.length).toBeGreaterThan(10)
    await page.locator(ziele).first().focus()
    for (let i = 1; i < erwartet.length; i++) {
      await page.keyboard.press("Tab")
      expect(await page.evaluate(() => document.activeElement?.getAttribute("data-tab"))).toBe(String(i))
    }
  })

  for (const theme of ["light", "dark"] as const) {
    test(`axe ohne Verstöße (${theme})`, async ({ page }) => {
      await laden(page)
      await setTheme(page, theme)
      const ergebnis = await new AxeBuilder({ page }).analyze()
      expect(ergebnis.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
    })
  }
})

test.describe("ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("alle Komponenten sichtbar, nichts bei opacity 0", async ({ page }) => {
    await page.goto(URL)
    for (const selector of [
      ".seitenkopf h1",
      "#abschnitt-links h2",
      ".projekt-karte",
      ".artikel-zeile",
      ".kontakt-panel",
      "nav.inhaltsverzeichnis",
      ".faktenzeile dl",
    ]) {
      await expect(page.locator(selector).first()).toBeVisible()
    }
    const versteckt = await page.evaluate(() =>
      [...document.querySelectorAll("main *")].filter((el) => getComputedStyle(el).opacity === "0").length
    )
    expect(versteckt).toBe(0)
  })
})
