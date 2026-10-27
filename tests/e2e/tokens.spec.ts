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

const KLASSEN = [...STILE, "prose"] as const

for (const stil of KLASSEN) {
  test(`.text-${stil}: Größe, Zeilenhöhe, Laufweite, Gewicht entsprechen den Tokens`, async ({
    page,
  }) => {
    await page.goto(URL)
    const r = await page.evaluate((s) => {
      const stilToken = s === "prose" ? "body" : s
      const weightToken = s === "mono" ? "code" : stilToken
      const el = document.querySelector(`#t-${s}`) as HTMLElement
      const cs = getComputedStyle(el)
      const root = getComputedStyle(document.documentElement)
      // Token-Wert als CSS-Wert auf eine Sonde setzen und gegen den berechneten Wert prüfen
      const resolve = (prop: string, token: string) => {
        const value = root.getPropertyValue(token).trim()
        const probe = document.createElement("span")
        document.body.appendChild(probe)
        probe.style.setProperty(prop, value)
        const out = { value, computed: getComputedStyle(probe).getPropertyValue(prop) }
        probe.remove()
        return out
      }
      return {
        size: { ...resolve("font-size", `--text-${stilToken}-size`), actual: cs.fontSize },
        lh: { ...resolve("line-height", `--text-${stilToken}-line-height`), actual: cs.lineHeight },
        ls: { ...resolve("letter-spacing", `--text-${stilToken}-letter-spacing`), actual: cs.letterSpacing },
        w: { ...resolve("font-weight", `--text-${weightToken}-weight`), actual: cs.fontWeight },
        transform: cs.textTransform,
        numeric: cs.fontVariantNumeric,
        family: cs.fontFamily,
      }
    }, stil)
    for (const k of ["size", "lh", "ls", "w"] as const) {
      expect(r[k].value, `${k} token`).not.toBe("")
      expect(r[k].actual, k).toBe(r[k].computed)
    }
    if (stil === "signatur") expect(r.w.actual).toBe("900")
    if (stil === "label") expect(r.transform).toBe("uppercase")
    if (stil === "mono") {
      expect(r.numeric).toContain("tabular-nums")
      expect(r.family).toContain("Geist Mono")
    } else {
      expect(r.family).toContain("Geist")
      expect(r.family).not.toContain("Mono")
    }
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
    1920: { signatur: "72px", hero: "56px" },
  } as const
  for (const w of [390, 1440, 1920] as const) {
    await page.setViewportSize({ width: w, height: 900 })
    for (const s of ["signatur", "hero"] as const) {
      const { actual, token } = await read(s)
      expect(actual).toBe(token)
      expect(actual).toBe(expected[w][s])
    }
  }
})

test("Fokusring: 2px solid, Offset 4px (--global-size-4), Farbe aus --theme-border-focus", async ({
  page,
}) => {
  await page.goto(URL)
  await page.focus("#focus-probe")
  await page.keyboard.press("Shift+Tab")
  await page.keyboard.press("Tab")
  const o = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    const cs = getComputedStyle(el)
    const probe = document.createElement("span")
    document.body.appendChild(probe)
    probe.style.color = getComputedStyle(document.documentElement)
      .getPropertyValue("--theme-border-focus")
      .trim()
    const token = getComputedStyle(probe).color
    probe.remove()
    return {
      id: el.id,
      focusVisible: el.matches(":focus-visible"),
      w: cs.outlineWidth,
      s: cs.outlineStyle,
      off: cs.outlineOffset,
      color: cs.outlineColor,
      token,
    }
  })
  expect(o.id).toBe("focus-probe")
  expect(o.focusVisible).toBe(true)
  expect(o.w).toBe("2px")
  expect(o.s).toBe("solid")
  expect(o.off).toBe("4px")
  expect(o.color).toBe(o.token)
})

test("alte Seite rendert weiter mit Tailwind: kein data-site, Hintergrund = --background", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ colorScheme: "light" })
  const page = await ctx.newPage()
  await page.goto("/")
  const r = await page.evaluate(() => {
    const probe = document.createElement("span")
    document.body.appendChild(probe)
    probe.style.color = getComputedStyle(document.documentElement)
      .getPropertyValue("--background")
      .trim()
    const expected = getComputedStyle(probe).color
    probe.remove()
    return {
      site: document.body.getAttribute("data-site"),
      bg: getComputedStyle(document.body).backgroundColor,
      expected,
      tw: getComputedStyle(document.documentElement).getPropertyValue("--tw-border-style").trim(),
    }
  })
  expect(r.site).toBeNull()
  expect(r.bg).not.toBe("rgb(244, 242, 240)")
  expect(r.bg).toBe(r.expected)
  await ctx.close()
})

test("neue Testseite lädt kein Tailwind", async ({ page }) => {
  await page.goto(URL)
  const r = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement)
    const twVars: string[] = []
    for (let i = 0; i < rootStyle.length; i++) {
      if (rootStyle[i].startsWith("--tw-")) twVars.push(rootStyle[i])
    }
    let text = ""
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules)) text += rule.cssText
      } catch {}
    }
    const inline = Array.from(document.querySelectorAll("style"))
      .map((n) => n.textContent)
      .join("")
    return { twVars, hasBanner: /tailwindcss/i.test(text + inline) }
  })
  expect(r.twVars).toEqual([])
  expect(r.hasBanner).toBe(false)
})
