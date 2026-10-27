import { expect, type Page } from "@playwright/test"

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
