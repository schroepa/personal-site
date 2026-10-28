import { defineConfig, devices } from "@playwright/test"

const PORT = 4322
/** Statischer Server für dist/ mit den Headern aus vercel.json (tests/helpers/serve-dist.mjs), nur für das Projekt „csp“ */
const DIST_PORT = 4323
/** Die CSP-Prüfung läuft gegen den Build, nicht gegen den Dev-Server */
const CSP_SPEC = /csp\.spec\.ts$/
/** Kleiner Rauchtest für Firefox und WebKit (`npm run test:cross-browser`); in den Chromium-Projekten deckt ihn der Rest der Suite ab */
const CROSS_SPEC = /cross-browser\.spec\.ts$/
/** Firefox und WebKit nur auf Wunsch (Browser vorher: `npx playwright install firefox webkit`), nicht im Standardlauf */
const CROSS_BROWSER = Boolean(process.env.CROSS_BROWSER)

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      testIgnore: [CSP_SPEC, CROSS_SPEC],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "tablet",
      testIgnore: [CSP_SPEC, CROSS_SPEC],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "mobile",
      testIgnore: [CSP_SPEC, CROSS_SPEC],
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
    ...(CROSS_BROWSER
      ? [
          { name: "firefox", testMatch: CROSS_SPEC, use: { ...devices["Desktop Firefox"], viewport: { width: 1440, height: 900 } } },
          { name: "webkit", testMatch: CROSS_SPEC, use: { ...devices["Desktop Safari"], viewport: { width: 1440, height: 900 } } },
        ]
      : []),
    {
      // Sicherheits-Header und CSP gegen dist/ (vorher `npm run build`); nur Desktop-Breite
      name: "csp",
      testMatch: CSP_SPEC,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        baseURL: `http://127.0.0.1:${DIST_PORT}`,
      },
    },
  ],
  webServer: [
    {
      command: `npm run dev -- --port ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      // startet auch ohne dist/ (dann überspringt csp.spec.ts lokal bzw. scheitert in CI)
      command: `node tests/helpers/serve-dist.mjs --port ${DIST_PORT}`,
      port: DIST_PORT,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
})
