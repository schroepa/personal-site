import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

// Cookiebot lädt asynchron (Performance, siehe SiteLayout.astro). Sicherstellen, dass das so bleibt und das PostHog-Gate
// auch auf CookiebotOnConsentReady hört, weil uc.js dann nach posthog.js eintreffen kann. Das Verhalten im Browser prüft csp.spec.ts.
const dist = join(process.cwd(), "dist")
const vorhanden = existsSync(join(dist, "index.html"))
if (!vorhanden && process.env.CI) throw new Error("dist/ fehlt: in CI vor test:scripts `npm run build` ausführen")
const grund = "dist/ fehlt: übersprungen (lokal)."

test("uc.js ist asynchron, steht im <head> und hat ein Preconnect", { skip: vorhanden ? false : grund }, () => {
  const html = readFileSync(join(dist, "index.html"), "utf8")
  const kopf = html.slice(0, html.indexOf("</head>"))
  const tag = kopf.match(/<script[^>]*id="Cookiebot"[^>]*>/)?.[0]
  assert.ok(tag, "Cookiebot-Skript im Kopf")
  assert.match(tag, /\sasync[\s>=]/)
  assert.match(tag, /src="https:\/\/consent\.cookiebot\.com\/uc\.js"/)
  assert.match(kopf, /<link rel="preconnect" href="https:\/\/consent\.cookiebot\.com"/)
})

test("PostHog-Gate hört auf ConsentReady, Accept und Decline und lädt nie ohne Statistik-Einwilligung", () => {
  const quelle = readFileSync(join(process.cwd(), "src/scripts/posthog-skript.ts"), "utf8")
  for (const e of ["CookiebotOnConsentReady", "CookiebotOnAccept", "CookiebotOnDecline"]) assert.ok(quelle.includes(e), e)
  // jeder initPostHog()-Aufruf steht hinter einer Prüfung von consent.statistics
  const aufrufe = [...quelle.matchAll(/initPostHog\(\)/g)].filter((m) => !quelle.slice(Math.max(0, m.index - 4), m.index).includes("on "))
  assert.ok(aufrufe.length >= 3)
  for (const m of aufrufe.slice(1)) assert.match(quelle.slice(m.index - 120, m.index), /consent\.statistics/)
})
