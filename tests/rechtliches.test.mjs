import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { KONTAKT_EMAIL } from "../src/data/kontakt.ts"
import {
  NAME,
  PLATZHALTER,
  EXTERNE_RESSOURCEN,
  IMPRESSUM,
  DATENSCHUTZ,
  volltext,
  offeneStellen,
} from "../src/data/rechtliches.ts"

test("rechtliches.ts: Name ist Schrödter, Platzhalter sind [[ANSCHRIFT]] und [[STAND]]", () => {
  assert.equal(NAME, "Patrick Schrödter")
  assert.equal(PLATZHALTER.anschrift, "[[ANSCHRIFT]]")
  assert.equal(PLATZHALTER.stand, "[[STAND]]")
})

test("EXTERNE_RESSOURCEN: Form, Cookiebot und PostHog sind enthalten", () => {
  assert.ok(Array.isArray(EXTERNE_RESSOURCEN) && EXTERNE_RESSOURCEN.length >= 2)
  for (const r of EXTERNE_RESSOURCEN) {
    assert.deepEqual(Object.keys(r).sort(), ["einwilligung", "host", "name", "zweck"])
    assert.match(r.host, /^[a-z0-9-]+(\.[a-z0-9-]+)+$/, `Host ohne Schema und Pfad: ${r.host}`)
    assert.ok(r.name && r.zweck)
    assert.equal(typeof r.einwilligung, "boolean")
  }
  const hosts = EXTERNE_RESSOURCEN.map((r) => r.host)
  assert.equal(new Set(hosts).size, hosts.length, "Hosts doppelt")
  assert.ok(hosts.includes("consent.cookiebot.com"))
  assert.ok(hosts.includes("consentcdn.cookiebot.com"))
  assert.ok(EXTERNE_RESSOURCEN.some((r) => r.name === "PostHog" && r.einwilligung === true))
  for (const r of EXTERNE_RESSOURCEN.filter((x) => x.name === "Cookiebot")) assert.equal(r.einwilligung, false)
})

test("EXTERNE_RESSOURCEN: PostHog-Host entspricht PUBLIC_POSTHOG_HOST (wenn .env vorhanden)", { skip: !existsSync(join(process.cwd(), ".env")) }, () => {
  const env = readFileSync(join(process.cwd(), ".env"), "utf8")
  const m = env.match(/^PUBLIC_POSTHOG_HOST=(.+)$/m)
  if (!m) return
  const host = new URL(m[1].trim()).host
  assert.ok(EXTERNE_RESSOURCEN.some((r) => r.name === "PostHog" && r.host === host), `PostHog-Host ${host} fehlt`)
})

test("Impressum: § 5 DDG und § 18 Abs. 2 MStV, kein TMG/RStV, ein Abschnitt je Pflichtangabe", () => {
  const text = volltext(IMPRESSUM)
  assert.match(text, /§ 5 DDG/)
  assert.match(text, /§ 18 Abs\. 2 MStV/)
  assert.doesNotMatch(text, /TMG|RStV/)
  assert.match(text, /Patrick Schrödter/)
  assert.doesNotMatch(text, /Schröder/)
  assert.deepEqual(
    IMPRESSUM.abschnitte.map((a) => a.label),
    ["Anbieter", "Kontakt", "Verantwortlich", "Haftung für Inhalte", "Haftung für Links", "Urheberrecht"]
  )
  assert.match(text, new RegExp(KONTAKT_EMAIL.replace(".", "\\.")))
})

test("Datenschutz: sieben Abschnitte 1 bis 7 in Figma-Reihenfolge", () => {
  assert.deepEqual(
    DATENSCHUTZ.abschnitte.map((a) => `${a.nummer} ${a.label}`),
    ["1 Verantwortlicher", "2 Hosting", "3 Cookies und Tracking", "4 Externe Ressourcen", "5 Deine Rechte", "6 Beschwerderecht", "7 Aktualität"]
  )
  const ids = DATENSCHUTZ.abschnitte.map((a) => a.id)
  assert.equal(new Set(ids).size, 7)
})

test("Datenschutz: nennt Cookiebot, PostHog, Einwilligung, Art. 6 Abs. 1 lit. a und jeden Host aus EXTERNE_RESSOURCEN", () => {
  const text = volltext(DATENSCHUTZ)
  for (const wort of ["Cookiebot", "PostHog", "Einwilligung", "Art. 6 Abs. 1 lit. a DSGVO", "Cookie-Einstellungen", "Vercel"]) {
    assert.ok(text.includes(wort), `fehlt: ${wort}`)
  }
  for (const r of EXTERNE_RESSOURCEN) assert.ok(text.includes(r.host), `Host fehlt im Datenschutztext: ${r.host}`)
  assert.doesNotMatch(text, /Schröder/)
  assert.doesNotMatch(text, /keine Cookies|kein Tracking/i, "alter, falscher Satz")
})

test("Datenschutz: Anrede durchgehend du (kein Sie/Ihr/Ihre als Anrede)", () => {
  const text = volltext(DATENSCHUTZ)
  assert.doesNotMatch(text, /\b(Sie|Ihre|Ihr|Ihnen|Ihrer|Ihrem|Ihren)\b/)
})

test("offeneStellen: findet [[…]] in beiden Seiten (Anschrift, Stand, PRÜFEN-Marker)", () => {
  const offen = offeneStellen()
  assert.ok(offen.includes("[[ANSCHRIFT]]"))
  assert.ok(offen.includes("[[STAND]]"))
  assert.ok(offen.some((s) => s.startsWith("[[PRÜFEN:")), "mindestens ein PRÜFEN-Marker erwartet")
  for (const s of offen) assert.match(s, /^\[\[[^\[\]]+\]\]$/)
})

test("hostEintrag: findet Hosts unabhängig von der Reihenfolge, fehlender Host wirft verständlich", async () => {
  const { hostEintrag } = await import("../src/data/rechtliches.ts")
  assert.equal(hostEintrag("imgsct.cookiebot.com"), "imgsct.cookiebot.com")
  assert.throws(() => hostEintrag("gibt-es-nicht.example"), /fehlt in src\/data\/externe-ressourcen\.json/)
})

test("imgsct.cookiebot.com: im Text nur belegte Aussage und PRÜFEN-Marker in offeneStellen()", () => {
  const text = volltext(DATENSCHUTZ)
  assert.ok(text.includes("Zusätzlich kann Cookiebot Bilder von imgsct.cookiebot.com laden."))
  assert.ok(!text.includes("Bilder des Banners"))
  assert.ok(offeneStellen().some((s) => s.includes("imgsct.cookiebot.com")))
})
