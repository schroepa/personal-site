import { expect, test } from "@playwright/test"
import { setTheme } from "../helpers"

const URL = "/prototypes/tokens"

const STILE = [
  "signatur",
  "hero",
  "h1",
  "h2",
  "h3",
  "lead",
  "body",
  "small",
  "label",
  "mono",
] as const

test("hell: body-Hintergrund ist #F4F2F0", async ({ page }) => {
  await page.goto(URL)
  await setTheme(page, "light")
  const bg = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor
  )
  expect(bg).toBe("rgb(244, 242, 240)")
})

test("dunkel: body-Hintergrund ist #24211F", async ({ page }) => {
  await page.goto(URL)
  await setTheme(page, "dark")
  const bg = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor
  )
  expect(bg).toBe("rgb(36, 33, 31)")
})

test("Fließtext 16px auf 390 und 1440, 17px ab 1920", async ({ page }) => {
  await page.goto(URL)
  const size = () =>
    page.evaluate(
      () => getComputedStyle(document.querySelector("#t-body")!).fontSize
    )
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await size()).toBe("16px")
  await page.setViewportSize({ width: 1440, height: 900 })
  expect(await size()).toBe("16px")
  await page.setViewportSize({ width: 1920, height: 1080 })
  expect(await size()).toBe("17px")
})

test("--objekt-radius ist 24px", async ({ page }) => {
  await page.goto(URL)
  const r = await page.evaluate(() =>
    getComputedStyle(document.documentElement)
      .getPropertyValue("--objekt-radius")
      .trim()
  )
  expect(r).toBe("24px")
  const br = await page.evaluate(
    () => getComputedStyle(document.querySelector("#objekt")!).borderTopLeftRadius
  )
  expect(br).toBe("24px")
})

for (const stil of STILE) {
  test(`.text-${stil}: Schriftgröße entspricht --text-${stil}-size`, async ({
    page,
  }) => {
    await page.goto(URL)
    const { actual, token, weight } = await page.evaluate((s) => {
      const el = document.querySelector(`#t-${s}`)!
      return {
        actual: getComputedStyle(el).fontSize,
        token: getComputedStyle(document.documentElement)
          .getPropertyValue(`--text-${s}-size`)
          .trim(),
        weight: getComputedStyle(el).fontWeight,
      }
    }, stil)
    expect(token).toMatch(/^\d+(\.\d+)?px$/)
    expect(actual).toBe(token)
    if (stil === "signatur") expect(weight).toBe("900")
  })
}

test("Signatur und Hero: Größe folgt Token auf Mobile und Desktop", async ({
  page,
}) => {
  await page.goto(URL)
  const read = (s: string) =>
    page.evaluate((id) => {
      const el = document.querySelector(`#t-${id}`)!
      return {
        actual: getComputedStyle(el).fontSize,
        token: getComputedStyle(document.documentElement)
          .getPropertyValue(`--text-${id}-size`)
          .trim(),
      }
    }, s)
  const expected = {
    390: { signatur: "40px", hero: "36px" },
    1440: { signatur: "64px", hero: "48px" },
  } as const
  for (const w of [390, 1440] as const) {
    await page.setViewportSize({ width: w, height: 900 })
    for (const s of ["signatur", "hero"] as const) {
      const { actual, token } = await read(s)
      expect(actual).toBe(token)
      expect(actual).toBe(expected[w][s])
    }
  }
})

test("Fokusring nutzt --theme-border-focus", async ({ page }) => {
  await page.goto(URL)
  await page.keyboard.press("Tab")
  const o = await page.evaluate(() => {
    const cs = getComputedStyle(document.querySelector("#focus-probe")!)
    return { w: cs.outlineWidth, s: cs.outlineStyle }
  })
  expect(o).toEqual({ w: "2px", s: "solid" })
})
