import { expect, type Page } from "@playwright/test"
import { EINTRITT_ANTEIL } from "../src/scripts/motion/einmal"

export const ROUTES: string[] = [
  "/",
  "/blog",
  "/projects",
  "/about",
  "/cv",
  "/kontakt",
  "/impressum",
  "/datenschutz",
  "/404",
]

export async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
}

export async function expectSingleH1(page: Page): Promise<void> {
  await expect(page.locator("h1")).toHaveCount(1)
}

export async function setTheme(
  page: Page,
  theme: "light" | "dark"
): Promise<void> {
  await page.evaluate((value) => {
    document.documentElement.setAttribute("data-theme", value)
    localStorage.setItem("theme", value)
  }, theme)
}

/**
 * Wartet, bis die Seite „ruhig“ ist: keine laufenden Web-Animationen/Transitions
 * und keine Einstiegs-Elemente im Auslösebereich (oberste 85 % des Sichtbereichs) mehr, die auf data-anim-fertig warten.
 * (Elemente unterhalb des Sichtbereichs warten bewusst auf den Scroll und sind per CSS unsichtbar.)
 * Axe berechnet Farbkontraste sonst auf halbtransparenten Wörtern mitten in der Animation.
 * Bei „Bewegung reduzieren“ ist der Endzustand sofort da, dann kehrt die Funktion sofort zurück.
 * Es werden bewusst keine Elemente vom Scan ausgenommen.
 */
export async function warteAufRuhe(page: Page, timeout = 15_000): Promise<void> {
  const reduziert = await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)
  if (reduziert) return
  try {
    await page.waitForFunction(
      (anteil) => {
        const imBild = (e: Element) => {
          const r = e.getBoundingClientRect()
          return r.bottom > 0 && r.top < innerHeight * (1 - anteil)
        }
        return (
          document.getAnimations().length === 0 &&
          Array.from(document.querySelectorAll("[data-anim]:not([data-anim-fertig])")).every((e) => !imBild(e))
        )
      },
      EINTRITT_ANTEIL,
      { timeout }
    )
  } catch {
    const stand = await page.evaluate((anteil) => ({
      animationen: document.getAnimations().length,
      offen: Array.from(document.querySelectorAll("[data-anim]:not([data-anim-fertig])"))
        .filter((e) => {
          const r = e.getBoundingClientRect()
          return r.bottom > 0 && r.top < innerHeight * (1 - anteil)
        })
        .slice(0, 5)
        .map((e) => e.getAttribute("data-anim") + ":" + (e.textContent ?? "").trim().slice(0, 20)),
    }), EINTRITT_ANTEIL)
    throw new Error(
      `warteAufRuhe: Seite nach ${timeout} ms nicht ruhig (${stand.animationen} laufende Animationen, offene data-anim-Elemente: ${JSON.stringify(stand.offen)})`
    )
  }
}
