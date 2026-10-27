import { test } from "@playwright/test"
import { expectNoHorizontalOverflow } from "../helpers"

test("alte Seite (/about) lädt in jeder Breite ohne horizontalen Überlauf", async ({
  page,
}) => {
  await page.goto("/about")
  await page.waitForLoadState("networkidle")
  await expectNoHorizontalOverflow(page)
})
