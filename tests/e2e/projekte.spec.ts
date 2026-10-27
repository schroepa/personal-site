import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { erwarteteProjekte, erwarteteWeitere, lese } from "../content"
import { expectNoHorizontalOverflow, expectSingleH1, setTheme } from "../helpers"

const UEBERSICHT = "/projects"
const TINTFIELD = "/projects/tintfield"
const BENTO = 4
const LANGES_WORT = "Donaudampfschifffahrtsgesellschaftskapitaensmuetzenherstellungsfabrikationsunternehmen" // 80 Zeichen, ohne Trennstelle
const projekte = lese("projects")
const ROUTEN = projekte.map((p) => `/projects/${p.slug}`)
// Projekte ohne Fakten (einfache Seiten): alle außer Tintfield, solange nur Tintfield Fakten trägt
const MIT_FAKTEN = ["tintfield"]
const EINFACH = projekte.filter((p) => !MIT_FAKTEN.includes(p.slug))
const PFLICHT = ["Ausgangslage", "Ansatz", "Einblicke", "Entscheidungen", "Ergebnis"]

/** Reihenfolge der Fallstudie: älteste zuerst, das nächstjüngere folgt, am Ende zyklisch das älteste */
function erwartetNaechstes(slug: string) {
  const chrono = [...projekte].sort((a, b) => a.date.localeCompare(b.date) || (a.slug < b.slug ? -1 : 1))
  const i = chrono.findIndex((p) => p.slug === slug)
  return chrono.length < 2 ? null : chrono[(i + 1) % chrono.length].slug
}

async function laden(page: Page, url = UEBERSICHT) {
  await page.goto(url)
  await page.waitForSelector("body[data-bereit]")
}

const sichtbareSlugs = (page: Page) =>
  page.locator("[data-eintrag]").evaluateAll((els) =>
    els.filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => e.getAttribute("data-slug")!)
  )

const chip = (page: Page, name: string) =>
  name === "Alle" ? page.locator("[data-filter-chips] button:not([data-tag])") : page.locator(`[data-filter-chips] button[data-tag="${name}"]`)

test.describe("Projekt-Übersicht", () => {
  test("Seitenkopf: eine h1, Label „Arbeit“, kein Überlauf", async ({ page }) => {
    await laden(page)
    await expectSingleH1(page)
    await expect(page.locator("main h1")).toHaveText("Werkzeuge, Systeme und Produkte.")
    await expect(page.locator(".seitenkopf .label")).toContainText("Arbeit")
    await expectNoHorizontalOverflow(page)
  })

  test("Übersicht trennt Ausgewählt und Weitere", async ({ page }) => {
    await laden(page)
    const ausgewaehlt = await page.locator("#ausgewaehlt [data-eintrag]").evaluateAll((els) => els.map((e) => e.getAttribute("data-slug")))
    const weitere = await page.locator("#weitere-projekte [data-eintrag]").evaluateAll((els) => els.map((e) => e.getAttribute("data-slug")))
    expect(ausgewaehlt).toEqual(erwarteteProjekte(BENTO))
    expect(ausgewaehlt).toHaveLength(BENTO)
    expect(weitere).toEqual(erwarteteWeitere(BENTO))
    expect(weitere.length).toBeGreaterThan(0)
    // jedes Projekt genau einmal, nichts doppelt, nichts fehlt
    expect([...ausgewaehlt, ...weitere].sort()).toEqual(projekte.map((p) => p.slug).sort())
    // Ausgewählt: Karten mit h3-Link zur Fallstudie; Weitere: Zeilen mit h3-Link
    for (const s of ausgewaehlt) await expect(page.locator(`#ausgewaehlt [data-slug="${s}"] h3 > a`)).toHaveAttribute("href", `/projects/${s}`)
    for (const s of weitere) await expect(page.locator(`#weitere-projekte [data-slug="${s}"] h3 > a`)).toHaveAttribute("href", `/projects/${s}`)
    await expect(page.locator("#ausgewaehlt .projekt-karte")).toHaveCount(BENTO)
    const labels = await page.locator("main section[id] > h2").evaluateAll((els) => els.map((e) => e.textContent!.replace(/\s+/g, " ").trim()))
    expect(labels).toEqual(["→ Ausgewählt", "→ Weitere Projekte", "→ Digital Art"])
  })

  test("Karten nutzen Format und Wirkung aus dem Schema", async ({ page }) => {
    await laden(page)
    const karten = await page.locator("#ausgewaehlt [data-eintrag]").evaluateAll((els) =>
      els.map((e) => ({ slug: e.getAttribute("data-slug"), format: [...e.querySelector(".projekt-karte")!.classList].find((c) => c.startsWith("format-")), wirkung: e.querySelector(".wirkung")!.textContent }))
    )
    const tint = karten.find((k) => k.slug === "tintfield")!
    expect(tint.format).toBe("format-4x5")
    expect(tint.wirkung).toBe("Eine Farbe rein, eine kontrastsichere Skala raus, für Tailwind, Radix und Material.")
  })

  test("Reihenfolge: Seitenkopf, Ausgewählt, Weitere, Digital Art, Kontakt", async ({ page }) => {
    await laden(page)
    const ok = await page.evaluate(() => {
      const sel = [".seitenkopf", "#ausgewaehlt", "#weitere-projekte", "#digital-art", "[data-kontakt]"]
      const els = sel.map((s) => document.querySelector(s)!)
      return els.every((e, i) => i === 0 || !!(els[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING))
    })
    expect(ok).toBe(true)
    await expect(page.locator("#digital-art [data-galerie-akkordeon]")).toHaveCount(1)
  })

  test("Themenfilter: Chips nur für Schlagwörter ab zwei Projekten, Alle vorgewählt", async ({ page }) => {
    await laden(page)
    const zaehler = new Map<string, number>()
    for (const p of projekte) for (const t of new Set(p.tags)) zaehler.set(t, (zaehler.get(t) ?? 0) + 1)
    const erwartet = [...zaehler].filter(([, n]) => n >= 2).map(([t]) => t)
    await expect(page.locator("[data-filter-chips] button")).toHaveCount(erwartet.length + 1)
    await expect(chip(page, "Alle")).toHaveAttribute("aria-pressed", "true")
    for (const t of erwartet) await expect(chip(page, t)).toHaveAttribute("aria-pressed", "false")
  })

  test("Filter blendet aus und ein; Abschnitt ohne Treffer verschwindet samt Überschrift; Ansage zählt Projekte", async ({ page }) => {
    await laden(page)
    await chip(page, "Tool").click()
    const erwartet = projekte.filter((p) => p.tags.includes("Tool")).map((p) => p.slug)
    expect((await sichtbareSlugs(page)).sort()).toEqual(erwartet.sort())
    await expect(page.getByRole("status").filter({ hasText: /Projekt/ })).toHaveText(erwartet.length === 1 ? "1 Projekt" : `${erwartet.length} Projekte`)
    const gruppen = await page.locator("[data-gruppe]").evaluateAll((els) =>
      els.map((g) => ({
        id: g.querySelector("section")!.id,
        sichtbar: (g as HTMLElement).offsetParent !== null,
        eintraege: [...g.querySelectorAll("[data-eintrag]")].filter((e) => (e as HTMLElement).offsetParent !== null).length,
      }))
    )
    for (const g of gruppen) expect(g.sichtbar, g.id).toBe(g.eintraege > 0)
    // Digital Art und Kontakt bleiben immer
    await expect(page.locator("#digital-art")).toBeVisible()
    await chip(page, "Alle").click()
    expect((await sichtbareSlugs(page)).length).toBe(projekte.length)
  })

  test("Filter ohne Treffer zeigt Hinweis", async ({ page }) => {
    await laden(page)
    await page.locator("[data-filter-chips]").evaluate((el) => {
      const b = document.createElement("button")
      b.type = "button"
      b.setAttribute("data-tag", "Gibt es nicht")
      b.setAttribute("aria-pressed", "false")
      b.textContent = "Gibt es nicht"
      el.appendChild(b)
    })
    await chip(page, "Gibt es nicht").click()
    await expect(page.getByRole("status").filter({ hasText: "Keine Projekte zu diesem Thema." })).toBeVisible()
    expect(await sichtbareSlugs(page)).toEqual([])
    await expect(page.locator("[data-gruppe]:visible")).toHaveCount(0)
    await chip(page, "Alle").click()
    await expect(page.locator("[data-filter-leer]")).toHaveText("")
    expect((await sichtbareSlugs(page)).length).toBe(projekte.length)
  })

  test("Client-Router: nach Hin- und Rückweg filtert ein Klick genau einmal", async ({ page }) => {
    await laden(page)
    await page.locator("#ausgewaehlt h3 a").first().click()
    await page.waitForURL("**/projects/*")
    await page.goBack()
    await page.waitForSelector("body[data-bereit]")
    await page.waitForSelector("[data-filter-chips] button")
    await chip(page, "React").click()
    await expect(chip(page, "React")).toHaveAttribute("aria-pressed", "true")
    await chip(page, "React").click()
    await expect(chip(page, "Alle")).toHaveAttribute("aria-pressed", "true")
  })

  test("lange zusammengesetzte Titel laufen nicht über", async ({ page }) => {
    await laden(page)
    await page.locator("#ausgewaehlt h3 a").first().evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await page.locator("#weitere-projekte h3 a").first().evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await page.locator("#weitere-projekte .beschreibung").first().evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await page.locator("main h1").evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await expectNoHorizontalOverflow(page)
  })

  test("Weitere Projekte: Zeile aus Meta, Titel und Beschreibung, ab Tablet nebeneinander", async ({ page }) => {
    await laden(page)
    const z = await page.locator("#weitere-projekte .eintrag").first().evaluate((el) => {
      const b = (s: string) => el.querySelector(s)!.getBoundingClientRect()
      return { meta: b(".meta"), titel: b(".titel"), text: b(".beschreibung") }
    })
    if ((page.viewportSize()?.width ?? 0) >= 768) {
      expect(z.titel.left).toBeGreaterThan(z.meta.right - 1)
      expect(z.text.left).toBeGreaterThan(z.titel.right - 1)
      expect(Math.abs(z.meta.top - z.titel.top)).toBeLessThan(2)
    } else {
      expect(z.titel.top).toBeGreaterThanOrEqual(z.meta.bottom - 1)
      expect(z.text.top).toBeGreaterThanOrEqual(z.titel.bottom - 1)
    }
  })

  test("axe hell und dunkel", async ({ page }) => {
    await laden(page)
    for (const theme of ["light", "dark"] as const) {
      await setTheme(page, theme)
      const result = await new AxeBuilder({ page }).analyze()
      expect(result.violations, theme).toEqual([])
    }
  })
})

test.describe("Projekt-Übersicht ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("alle Projekte und Gruppen sichtbar, Chips versteckt", async ({ page }) => {
    await page.goto(UEBERSICHT)
    expect((await sichtbareSlugs(page)).length).toBe(projekte.length)
    await expect(page.locator("[data-gruppe]:visible")).toHaveCount(2)
    await expect(page.locator("[data-filter-chips]")).toBeHidden()
    await expect(page.locator("[data-filter-leer]")).toHaveText("")
    await expect(page.locator("#digital-art a").first()).toBeVisible()
    await expectSingleH1(page)
    await expectNoHorizontalOverflow(page)
  })

  test("Fallstudie Tintfield ist vollständig lesbar", async ({ page }) => {
    await page.goto(TINTFIELD)
    await expectSingleH1(page)
    await expect(page.locator("[data-kennzahlen] li")).toHaveCount(3)
    for (const a of PFLICHT) await expect(page.locator(`main section h2`, { hasText: a })).toBeVisible()
    await expect(page.locator("[data-naechstes] a")).toBeVisible()
  })
})

test.describe("Fallstudie Tintfield", () => {
  test("Fallstudie Tintfield zeigt Faktenzeile mit 3 Fakten und Aktionen", async ({ page }) => {
    await laden(page, TINTFIELD)
    await expectSingleH1(page)
    await expect(page.locator("main h1")).toHaveText("Tintfield")
    await expect(page.locator(".seitenkopf .label")).toContainText("Tool · 2026")
    const fakten = await page.locator(".faktenzeile .fakt").evaluateAll((els) => els.map((e) => [e.querySelector("dt")!.textContent, e.querySelector("dd")!.textContent]))
    expect(fakten).toEqual([
      ["Rolle", "Konzept, Design, Code"],
      ["Jahr", "2026"],
      ["Stack", "Astro, React, TypeScript, OKLCH"],
    ])
    const aktionen = page.locator(".faktenzeile .aktionen a")
    await expect(aktionen).toHaveCount(2)
    await expect(aktionen.nth(0)).toHaveAttribute("href", "https://tintfield.ptrckschrdtr.de")
    await expect(aktionen.nth(1)).toHaveAttribute("href", /github\.com/)
    await expectNoHorizontalOverflow(page)
  })

  test("externe Links in neuem Tab tragen rel=noopener", async ({ page }) => {
    await laden(page, TINTFIELD)
    const extern = await page.locator("main a[target='_blank']").evaluateAll((els) => els.map((e) => e.getAttribute("rel")))
    expect(extern.length).toBeGreaterThan(0)
    for (const rel of extern) expect(rel).toContain("noopener")
  })

  test("fünf Abschnitte in Reihenfolge, danach Nächstes Projekt und Kontakt", async ({ page }) => {
    await laden(page, TINTFIELD)
    const labels = await page.locator("main > section > h2").evaluateAll((els) => els.map((e) => e.textContent!.replace(/\s+/g, " ").trim()))
    expect(labels).toEqual([...PFLICHT.map((a) => `→ ${a}`), "→ Nächstes Projekt"])
    const ordnung = await page.evaluate(() => {
      const sel = [".seitenkopf", "[data-titelbild]", "#ausgangslage", "#ansatz", "#einblicke", "#entscheidungen", "#ergebnis", "#naechstes-projekt", "[data-kontakt]"]
      const els = sel.map((s) => document.querySelector(s)!)
      return els.every((e, i) => i === 0 || !!(els[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING))
    })
    expect(ordnung).toBe(true)
    // Überschriftenfolge ohne Sprung
    const ebenen = await page.locator("main h1, main h2, main h3").evaluateAll((els) => els.map((e) => Number(e.tagName[1])))
    ebenen.reduce((vorher, jetzt) => {
      expect(jetzt - vorher).toBeLessThanOrEqual(1)
      return jetzt
    }, 0)
    await expect(page.locator("#entscheidungen h3")).toHaveCount(3)
    await expect(page.locator("#einblicke img")).toHaveCount(1)
  })

  test("Kennzahlen stehen in text/h1", async ({ page }) => {
    await laden(page, TINTFIELD)
    const r = await page.evaluate(() => {
      const sonde = document.createElement("span")
      sonde.className = "text-h1"
      document.body.appendChild(sonde)
      const h1 = getComputedStyle(sonde).fontSize
      sonde.remove()
      return { h1, zahlen: [...document.querySelectorAll("[data-kennzahlen] .zahl")].map((e) => [e.textContent, getComputedStyle(e).fontSize]), bez: [...document.querySelectorAll("[data-kennzahlen] .bezeichnung")].map((e) => e.textContent) }
    })
    expect(r.zahlen.map((z) => z[0])).toEqual(["1", "6", "0"])
    expect(r.bez).toEqual(["Farbe rein", "Skalen-Systeme", "Einstellungen"])
    for (const z of r.zahlen) expect(z[1]).toBe(r.h1)
    // Kennzahlen stehen im Abschnitt Ergebnis
    await expect(page.locator("#ergebnis [data-kennzahlen]")).toHaveCount(1)
  })

  test("Nächstes Projekt verlinkt auf das nächstjüngere und nie auf sich selbst", async ({ page }) => {
    await laden(page, TINTFIELD)
    const erwartet = erwartetNaechstes("tintfield")!
    expect(erwartet).not.toBe("tintfield")
    const link = page.locator("#naechstes-projekt a")
    await expect(link).toHaveCount(1)
    await expect(link).toHaveAttribute("href", `/projects/${erwartet}`)
    await expect(link).toHaveAccessibleName(/^Fallstudie ansehen/)
    await expect(page.locator("#naechstes-projekt h3")).toBeVisible()
  })

  test("Nächstes Projekt ist zyklisch: jedes Projekt wird genau einmal besucht", async ({ page }) => {
    // Kette über die Seiten mit Fallstudien-Block; einfache Seiten haben keinen Block, die Kette folgt daher der erwarteten Reihenfolge
    const gesehen = new Set<string>()
    let aktuell = "tintfield"
    for (let i = 0; i < projekte.length; i++) {
      gesehen.add(aktuell)
      aktuell = erwartetNaechstes(aktuell)!
    }
    expect(gesehen.size).toBe(projekte.length)
    expect(aktuell).toBe("tintfield")
  })

  test("Titelbild hat denselben view-transition-name wie die Karte", async ({ page }) => {
    await laden(page)
    const karte = await page.locator('#ausgewaehlt [data-slug="tintfield"] [data-bild]').evaluate((el) => getComputedStyle(el).viewTransitionName)
    expect(karte).toBe("projekt-bild-tintfield")
    await laden(page, TINTFIELD)
    const bild = await page.locator("[data-titelbild] .bild").evaluate((el) => getComputedStyle(el).viewTransitionName)
    expect(bild).toBe(karte)
    // Namen sind auf der Seite eindeutig
    const namen = await page.evaluate(() => [...document.querySelectorAll("*")].map((e) => getComputedStyle(e).viewTransitionName).filter((n) => n !== "none"))
    expect(new Set(namen).size).toBe(namen.length)
  })

  test("Titelbild: dekorativ, Höhe 240 / 480 / 720", async ({ page }) => {
    await laden(page, TINTFIELD)
    await expect(page.locator("[data-titelbild] img")).toHaveAttribute("alt", "")
    const h = await page.locator("[data-titelbild] .bild").evaluate((el) => el.getBoundingClientRect().height)
    const b = page.viewportSize()!.width
    expect(h).toBeCloseTo(b < 768 ? 240 : b < 1024 ? 480 : 720, 0)
  })

  test("lange Titel und Fakten laufen nicht über", async ({ page }) => {
    await laden(page, TINTFIELD)
    await page.locator("main h1").evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await page.locator(".faktenzeile dd").first().evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await page.locator("[data-kennzahlen] .zahl").first().evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await page.locator("[data-kennzahlen] .bezeichnung").first().evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await page.locator("#naechstes-projekt h3").evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await page.locator("#ansatz .prose p").first().evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await expectNoHorizontalOverflow(page)
  })

  test("axe hell und dunkel", async ({ page }) => {
    await laden(page, TINTFIELD)
    for (const theme of ["light", "dark"] as const) {
      await setTheme(page, theme)
      const result = await new AxeBuilder({ page }).analyze()
      expect(result.violations, theme).toEqual([])
    }
  })
})

test.describe("Projekte ohne Fakten (einfache Seiten)", () => {
  test("Projekt ohne fakten rendert als einfache Seite ohne Faktenzeile und Nächstes", async ({ page }) => {
    for (const p of EINFACH.slice(0, 3)) {
      await laden(page, `/projects/${p.slug}`)
      await expectSingleH1(page)
      await expect(page.locator(".faktenzeile")).toHaveCount(0)
      await expect(page.locator("#naechstes-projekt")).toHaveCount(0)
      await expect(page.locator("[data-titelbild]")).toHaveCount(1)
      await expect(page.locator("[data-prose] p").first()).toBeVisible()
      await expect(page.locator("[data-kontakt]")).toHaveCount(1)
      await expect(page.locator("[data-kennzahlen]")).toHaveCount(0)
    }
  })

  test("alle Projektrouten: 200, eine h1, keine JavaScript-Fehler, kein Überlauf", async ({ page }) => {
    const fehler: string[] = []
    page.on("pageerror", (e) => fehler.push(e.message))
    page.on("console", (m) => m.type() === "error" && !/Failed to load resource|favicon/.test(m.text()) && fehler.push(m.text()))
    for (const route of ROUTEN) {
      const res = await page.goto(route)
      expect(res?.status(), route).toBe(200)
      await page.waitForSelector("body[data-bereit]")
      await expect(page.locator("h1"), route).toHaveCount(1)
      await expectNoHorizontalOverflow(page)
    }
    expect(fehler).toEqual([])
  })

  test("lange Titel laufen auf einfachen Seiten nicht über", async ({ page }) => {
    await laden(page, `/projects/${EINFACH[0].slug}`)
    await page.locator("main h1").evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await expectNoHorizontalOverflow(page)
  })

  test("axe hell und dunkel auf einer einfachen Seite", async ({ page }) => {
    await laden(page, `/projects/${EINFACH[0].slug}`)
    for (const theme of ["light", "dark"] as const) {
      await setTheme(page, theme)
      const result = await new AxeBuilder({ page }).analyze()
      expect(result.violations, theme).toEqual([])
    }
  })
})
