import { test } from "@playwright/test"
import { expectNoHorizontalOverflow } from "../helpers"

test("startseite lädt in jeder Breite ohne horizontalen Überlauf", async ({
  page,
}) => {
  await page.goto("/")
  await page.waitForLoadState("networkidle")
  await expectNoHorizontalOverflow(page)
})
