import { expect, test, type Download, type Locator, type Page } from "@playwright/test"

// Verhalten des Grainy Gradient Generators (Task 15b). Diese Tests wurden VOR dem Umbau gegen die alte
// Seite (shadcn/Radix) geschrieben und nur über Rollen, Texte und Computed Styles formuliert,
// damit sie nach der Umstellung auf native Regler unverändert gelten.

const URL = "/tools/gradient-generator"

async function laden(page: Page) {
  await page.goto(URL)
  await expect(page.getByRole("button", { name: "Rosé Dawn" }).first()).toBeVisible()
  // Hydriert: React hängt seine Props an die DOM-Knoten (der Server rendert die Knöpfe schon vorher, Klicks davor gingen verloren)
  await page.waitForFunction(() => [...document.querySelectorAll("button")].some((b) => Object.keys(b).some((k) => k.startsWith("__reactProps"))))
}

/** Wert eines Reglers: Radix setzt aria-valuenow, ein natives Eingabefeld hat .value. */
const wert = (loc: Locator) =>
  loc.evaluate((e) => Number(e.getAttribute("aria-valuenow") ?? (e as HTMLInputElement).value))

/** Die Farbkugeln der Vorschau: aria-hidden, inline gesetzter Weichzeichner. */
const kugeln = (page: Page) => page.locator('[aria-hidden="true"][style*="blur("]')

async function hintergrundDerVorschau(page: Page) {
  return kugeln(page).first().evaluate((e) => getComputedStyle(e.parentElement!).backgroundColor)
}

async function kornDeckkraft(page: Page) {
  return page.evaluate(() => {
    const k = [...document.querySelectorAll("div")].find((d) => getComputedStyle(d).mixBlendMode === "overlay")
    return k ? Number(getComputedStyle(k).opacity) : null
  })
}

test.describe("Gradient-Generator: Verhalten", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) < 768, "Seitenleiste erst ab 768; Mobil siehe unten")

  test("Startzustand: Preset Rosé Dawn, vier Kugeln, Korn 10 %", async ({ page }) => {
    await laden(page)
    await expect(kugeln(page)).toHaveCount(4)
    expect(await hintergrundDerVorschau(page)).toBe("rgb(245, 237, 232)")
    expect(await kornDeckkraft(page)).toBeCloseTo(0.1, 2)
  })

  test("Preset wechseln ändert Hintergrund, Kugelfarbe und Korn", async ({ page }) => {
    await laden(page)
    await page.getByRole("button", { name: "Pale Plum" }).first().click()
    // Pale Plum: bg #ECE8F2, erste Kugel #9880B8, Korn 10
    await expect.poll(() => hintergrundDerVorschau(page)).toBe("rgb(236, 232, 242)")
    await expect(kugeln(page).first()).toHaveCSS("background-color", "rgb(152, 128, 184)")
    // Fig & Cream hat Korn 12
    await page.getByRole("button", { name: "Fig & Cream" }).first().click()
    await expect.poll(() => kornDeckkraft(page)).toBeCloseTo(0.12, 2)
  })

  test("Regler (Korn) ändert die Vorschau, auch per Tastatur", async ({ page }) => {
    await laden(page)
    const korn = page.getByRole("slider").last()
    expect(await wert(korn)).toBe(10)
    await korn.focus()
    await page.keyboard.press("ArrowRight")
    await page.keyboard.press("ArrowRight")
    await expect.poll(() => kornDeckkraft(page)).toBeCloseTo(0.12, 2)
    await page.keyboard.press("Home")
    await expect.poll(() => kornDeckkraft(page)).toBeCloseTo(0, 2)
  })

  test("Orb-Regler verändern Weichheit und Position der Kugel", async ({ page }) => {
    await laden(page)
    await page.getByText("Orb 1", { exact: true }).first().click()
    const regler = page.getByRole("slider")
    // Reihenfolge im Orb: Deckkraft, Weichheit, X, Y, Breite, Höhe, danach Korn
    await expect(regler).toHaveCount(7)
    const kugel = kugeln(page).first()
    await expect(kugel).toHaveCSS("filter", "blur(90px)")
    await regler.nth(1).focus()
    await page.keyboard.press("ArrowRight")
    await expect(kugel).toHaveCSS("filter", "blur(91px)")
    await regler.nth(2).focus()
    await page.keyboard.press("End")
    const links = await kugel.evaluate((e) => (e as HTMLElement).style.left)
    expect(links).toBe("130%")
    await regler.nth(0).focus()
    await page.keyboard.press("Home")
    await expect.poll(() => kugel.evaluate((e) => getComputedStyle(e).opacity)).toBe("0")
  })

  test("Farbwähler ändert die Kugelfarbe", async ({ page }) => {
    await laden(page)
    await page.getByText("Orb 1", { exact: true }).first().click()
    const farbe = page.locator('input[type="color"]').first()
    await farbe.fill("#112233")
    await expect(kugeln(page).first()).toHaveCSS("background-color", "rgb(17, 34, 51)")
  })

  test("Export: lädt ein PNG in der gewählten Größe herunter", async ({ page }) => {
    await laden(page)
    const download = page.waitForEvent("download")
    await page.getByRole("button", { name: /PNG/ }).first().click()
    const d = await download
    expect(d.suggestedFilename()).toBe("gradient-rosé-dawn-2100x900.png")
    const png = await bytes(d)
    expect(png.subarray(1, 4).toString()).toBe("PNG")
    expect({ w: png.readUInt32BE(16), h: png.readUInt32BE(20) }).toEqual({ w: 2100, h: 900 })
  })

  test("Export: andere Größe und anderes Preset", async ({ page }) => {
    await laden(page)
    await page.getByRole("button", { name: "Dusty Mauve" }).first().click()
    await page.getByRole("combobox").first().selectOption({ label: "1:1" })
    const download = page.waitForEvent("download")
    await page.getByRole("button", { name: /PNG/ }).first().click()
    const d = await download
    expect(d.suggestedFilename()).toBe("gradient-dusty-mauve-1200x1200.png")
    const png = await bytes(d)
    expect({ w: png.readUInt32BE(16), h: png.readUInt32BE(20) }).toEqual({ w: 1200, h: 1200 })
  })
})

async function bytes(d: Download) {
  const stream = await d.createReadStream()
  const chunks: Buffer[] = []
  for await (const c of stream!) chunks.push(Buffer.from(c as Buffer))
  return Buffer.concat(chunks)
}

test.describe("Gradient-Generator: schmale Ansicht", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 1440) >= 768, "nur Mobil")

  test("Regler liegen im Dialog hinter „Controls“", async ({ page }) => {
    await laden(page)
    await page.getByRole("button", { name: "Controls" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole("slider").last()).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
  })

  test("Preset und Export gehen auch mobil", async ({ page }) => {
    await laden(page)
    await page.getByRole("button", { name: "Pale Plum" }).first().click()
    await expect.poll(() => hintergrundDerVorschau(page)).toBe("rgb(236, 232, 242)")
    const download = page.waitForEvent("download")
    await page.getByRole("button", { name: /PNG/ }).first().click()
    const png = await bytes(await download)
    expect({ w: png.readUInt32BE(16), h: png.readUInt32BE(20) }).toEqual({ w: 2100, h: 900 })
  })
})
