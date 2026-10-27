import { expect, test, type Page } from "@playwright/test"

// Schriftfeld und Raster auf ECHTEN Seiten (Task 13, Nachtrag zu Task 11/12): Das Blatt wechselt mit
// [data-abschnitt], Hover über [data-objekt] zeigt „Spalte a–b · n von N“ und hebt dieselben Spalten hervor.
// Erwartungswerte kommen aus dem Markup und dem Layout der Seite, nie als feste Zahl.

async function laden(page: Page, url: string) {
  await page.goto(url)
  await page.waitForSelector("body[data-bereit]")
}

const blatt = (page: Page) => page.locator("[data-blatt-wert]").innerText()

/** Alle sichtbaren Elemente mit data-abschnitt in Dokumentreihenfolge (Name und Nummer wie im Schriftfeld). */
const abschnitte = (page: Page) =>
  page.evaluate(() => {
    const alle = [...document.querySelectorAll<HTMLElement>("[data-abschnitt]")]
    return alle.map((e, i) => ({ i, name: e.dataset.abschnitt ?? "", sichtbar: e.getBoundingClientRect().height > 0 }))
  })

for (const pfad of ["/", "/blog", "/projects", "/about"]) {
  test(`Blatt wechselt beim Scrollen mit den Abschnitten (${pfad})`, async ({ page }) => {
    await laden(page, pfad)
    const liste = await abschnitte(page)
    expect(liste.length).toBeGreaterThanOrEqual(3)
    // Seitenanfang: der erste Abschnitt
    await expect.poll(() => blatt(page)).toMatch(new RegExp(`^01/${String(liste.length).padStart(2, "0")} `))
    const gesehen = new Set<string>()
    for (const a of liste.filter((x) => x.sichtbar)) {
      await page.evaluate((i) => {
        const el = document.querySelectorAll<HTMLElement>("[data-abschnitt]")[i]
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 80)
      }, a.i)
      // Der Text stammt aus dem Markup: „NN/MM Name“, die Nummer zeigt auf genau das Element mit diesem Namen
      await expect
        .poll(async () => {
          const t = await blatt(page)
          const m = /^(\d{2})\/(\d{2}) (.+)$/.exec(t)
          if (!m) return "falsch: " + t
          const n = Number(m[1])
          return Number(m[2]) === liste.length && liste[n - 1]?.name === m[3] ? "ok" : "falsch: " + t
        })
        .toBe("ok")
      gesehen.add(await blatt(page))
    }
    // Es gab mehrere verschiedene Blätter, kein starrer Text
    expect(gesehen.size).toBeGreaterThanOrEqual(2)
    // Der Seitenname aus dem Layout („Einstieg“, „Übersicht“ …) ist nach dem ersten Wechsel durch Abschnittsnamen ersetzt
    for (const t of gesehen) expect(t).toMatch(/^\d{2}\/\d{2} /)
  })
}

/** Spalten des Rasters (sichtbare), ihre Ränder und welche gerade hervorgehoben sind. */
const rasterZustand = (page: Page) =>
  page.evaluate(() => {
    const spalten = [...document.querySelectorAll<HTMLElement>("[data-raster] .spalte")].filter((s) => s.getBoundingClientRect().height > 0)
    return {
      anzahl: spalten.length,
      an: spalten.map((s, i) => (s.hasAttribute("data-hover") ? i + 1 : 0)).filter(Boolean),
      raster: document.querySelector("[data-raster-wert]")!.textContent ?? "",
    }
  })

const erwarteteSpalten = (page: Page, selektor: string) =>
  page.locator(selektor).first().evaluate((el) => {
    const r = el.getBoundingClientRect()
    const nr = [...document.querySelectorAll<HTMLElement>("[data-raster] .spalte")]
      .filter((s) => s.getBoundingClientRect().height > 0)
      .map((s, i) => ({ c: s.getBoundingClientRect(), i: i + 1 }))
      .filter(({ c }) => c.right > r.left && c.left < r.right)
      .map(({ i }) => i)
    return { von: nr[0], bis: nr[nr.length - 1] }
  })

for (const [pfad, selektor] of [
  ["/", "#arbeit .projekt-karte"],
  ["/projects", "#ausgewaehlt .projekt-karte"],
  ["/blog", "#neu .artikel-zeile"],
] as const) {
  test(`Hover über ein Objekt: „Spalte a–b · n von N“ und dieselben Spalten im Raster (${pfad})`, async ({ page }) => {
    await laden(page, pfad)
    const objekt = page.locator(selektor).first()
    await expect(objekt).toHaveAttribute("data-objekt", "")
    await objekt.scrollIntoViewIfNeeded()
    await objekt.hover()
    const { anzahl } = await rasterZustand(page)
    const { von, bis } = await erwarteteSpalten(page, selektor)
    const soll = von === bis ? `Spalte ${von}` : `Spalte ${von}–${bis}`
    await expect.poll(async () => (await rasterZustand(page)).raster).toBe(`${soll} · ${bis - von + 1} von ${anzahl}`)
    const viewport = page.viewportSize()!.width
    // Breite → Spaltenzahl (Layout-Tokens: 12 / 8 / 4)
    expect(anzahl).toBe(viewport >= 1024 ? 12 : viewport >= 768 ? 8 : 4)
    // Hervorgehoben: genau die Spalten des Objekts
    const erwartet = Array.from({ length: bis - von + 1 }, (_, k) => von + k)
    await expect.poll(async () => (await rasterZustand(page)).an).toEqual(erwartet)
  })
}

test("Seitenkopf und Kontakt-Panel sind Objekte mit eigener Spaltenangabe", async ({ page }) => {
  await laden(page, "/about")
  for (const selektor of [".seitenkopf", "[data-kontakt]"]) {
    const o = page.locator(selektor).first()
    await expect(o).toHaveAttribute("data-objekt", "")
    await o.scrollIntoViewIfNeeded()
    await o.hover()
    const { anzahl } = await rasterZustand(page)
    const { von, bis } = await erwarteteSpalten(page, selektor)
    const soll = von === bis ? `Spalte ${von}` : `Spalte ${von}–${bis}`
    await expect.poll(async () => (await rasterZustand(page)).raster).toBe(`${soll} · ${bis - von + 1} von ${anzahl}`)
  }
})
