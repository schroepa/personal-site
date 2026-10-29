import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import {
  buildHeaders,
  cspDirektiven,
  gleicherInhalt,
  HOST_DIREKTIVEN,
  ladeRessourcen,
  renderCsp,
  renderVercelJson,
  VERCEL_JSON_PFAD,
} from "./build-vercel-headers.mjs"
import { EXTERNE_RESSOURCEN } from "../src/data/rechtliches.ts"

const ressourcen = ladeRessourcen()
const regeln = buildHeaders(ressourcen)
const alle = regeln.find((r) => r.source === "/(.*)")
const header = (name) => alle.headers.find((h) => h.key === name)?.value
const csp = header("Content-Security-Policy")
/** CSP-Wert → Map Direktive → Quellen */
const parse = (wert) => new Map(wert.split(";").map((t) => t.trim().split(/\s+/)).map(([n, ...q]) => [n, q]))
const direktiven = parse(csp)

test("JSON: Form je Eintrag, csp nur mit erlaubten Direktiven, Hosts eindeutig", () => {
  assert.ok(ressourcen.length >= 4)
  for (const r of ressourcen) {
    assert.deepEqual(Object.keys(r).sort(), ["csp", "einwilligung", "host", "name", "zweck"])
    assert.ok(r.csp.length > 0, r.host)
    for (const d of r.csp) assert.ok(HOST_DIREKTIVEN.includes(d), `${r.host}: ${d}`)
  }
  assert.equal(new Set(ressourcen.map((r) => r.host)).size, ressourcen.length)
})

test("rechtliches.ts liest dieselbe JSON (Datenschutztext und CSP aus einer Quelle)", () => {
  assert.deepEqual(
    EXTERNE_RESSOURCEN.map((r) => r.host),
    ressourcen.map((r) => r.host)
  )
})

test("jeder externe Host steht genau einmal in jeder Direktive, die er braucht, und in keiner anderen", () => {
  for (const r of ressourcen) {
    const quelle = `https://${r.host}`
    for (const d of HOST_DIREKTIVEN) {
      const n = (direktiven.get(d) ?? []).filter((q) => q === quelle).length
      assert.equal(n, r.csp.includes(d) ? 1 : 0, `${r.host} in ${d}`)
    }
  }
  // und kein Host ohne Eintrag in der JSON
  const bekannt = new Set(ressourcen.map((r) => `https://${r.host}`))
  for (const [d, quellen] of direktiven) for (const q of quellen) if (/^https?:/.test(q)) assert.ok(bekannt.has(q), `${d}: ${q}`)
})

test("script-src: nur 'self' und die Hosts, kein *, data:, blob:, unsafe-*, Nonce oder Hash", () => {
  const s = direktiven.get("script-src")
  assert.equal(s[0], "'self'")
  for (const q of s) {
    assert.ok(!q.includes("*"), q)
    assert.ok(!/^(data|blob|http):/.test(q), q)
    assert.ok(!/unsafe|nonce-|sha\d+-|strict-dynamic/.test(q), q)
  }
  assert.deepEqual(s.slice(1), [
    "https://consent.cookiebot.com",
    "https://consentcdn.cookiebot.com",
    "https://eu-assets.i.posthog.com",
    "https://eu.i.posthog.com",
  ])
})

test("keine Wildcards und kein http: irgendwo in der CSP", () => {
  for (const [d, quellen] of direktiven) for (const q of quellen) assert.ok(!q.includes("*") && !q.startsWith("http:"), `${d}: ${q}`)
})

test("feste Direktiven: frame-ancestors none, object-src none, base-uri self, form-action self, default-src self, upgrade", () => {
  assert.deepEqual(direktiven.get("default-src"), ["'self'"])
  assert.deepEqual(direktiven.get("frame-ancestors"), ["'none'"])
  assert.deepEqual(direktiven.get("object-src"), ["'none'"])
  assert.deepEqual(direktiven.get("base-uri"), ["'self'"])
  assert.deepEqual(direktiven.get("form-action"), ["'self'"])
  assert.deepEqual(direktiven.get("worker-src"), ["'self'"])
  assert.deepEqual(direktiven.get("manifest-src"), ["'self'"])
  assert.deepEqual(direktiven.get("font-src"), ["'self'"])
  assert.deepEqual(direktiven.get("media-src"), ["'self'"])
  assert.deepEqual(direktiven.get("img-src"), ["'self'", "data:", "https://imgsct.cookiebot.com"])
  assert.deepEqual(direktiven.get("style-src"), ["'self'", "'unsafe-inline'"])
  assert.deepEqual(direktiven.get("frame-src"), ["https://consentcdn.cookiebot.com"])
  assert.deepEqual(direktiven.get("upgrade-insecure-requests"), [])
  assert.ok(!direktiven.has("script-src-elem") && !direktiven.has("style-src-elem"), "-elem würde script-src/style-src überschreiben")
})

test("die vollständige CSP (Wortlaut)", () => {
  assert.equal(
    csp,
    "default-src 'self'; script-src 'self' https://consent.cookiebot.com https://consentcdn.cookiebot.com https://eu-assets.i.posthog.com https://eu.i.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://imgsct.cookiebot.com; font-src 'self'; connect-src 'self' https://consent.cookiebot.com https://consentcdn.cookiebot.com https://eu-assets.i.posthog.com https://eu.i.posthog.com; media-src 'self'; frame-src https://consentcdn.cookiebot.com; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"
  )
})

test("übrige Header: Namen und Werte exakt", () => {
  assert.deepEqual(
    alle.headers.map((h) => h.key),
    [
      "Content-Security-Policy",
      "Strict-Transport-Security",
      "Referrer-Policy",
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Cross-Origin-Opener-Policy",
      "Permissions-Policy",
    ]
  )
  assert.equal(header("Strict-Transport-Security"), "max-age=63072000; includeSubDomains")
  assert.equal(header("Referrer-Policy"), "strict-origin-when-cross-origin")
  assert.equal(header("X-Content-Type-Options"), "nosniff")
  assert.equal(header("X-Frame-Options"), "DENY")
  assert.equal(header("Cross-Origin-Opener-Policy"), "same-origin")
  const pp = header("Permissions-Policy")
  for (const f of ["camera", "microphone", "geolocation", "payment", "usb"]) assert.match(pp, new RegExp(`(^|, )${f}=\\(\\)`))
  // genutzte Funktionen bleiben erlaubt: Vollbild (Videos), Autoplay, Zwischenablage (Adresse kopieren)
  for (const f of ["fullscreen", "autoplay", "clipboard-write"]) assert.ok(!pp.includes(f), f)
})

test("Cache-Control nur für fingerprintete Dateien (immutable) und Schriften (kurz, ohne immutable)", () => {
  assert.deepEqual(
    regeln.map((r) => r.source),
    ["/(.*)", "/_astro/(.*)", "/fonts/(.*)"]
  )
  assert.deepEqual(regeln[1].headers, [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }])
  assert.deepEqual(regeln[2].headers, [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }])
  assert.ok(!alle.headers.some((h) => h.key === "Cache-Control"), "kein Cache-Control für alle Pfade (HTML bleibt frisch)")
  // die speziellen Regeln überschneiden sich nicht mit der allgemeinen (Reihenfolge der Regeln ist damit egal)
  const allgemein = new Set(alle.headers.map((h) => h.key))
  for (const r of regeln.slice(1)) for (const h of r.headers) assert.ok(!allgemein.has(h.key), `${r.source}: ${h.key}`)
})

test("renderCsp: Reihenfolge bleibt, Direktive ohne Quellen steht allein", () => {
  assert.equal(
    renderCsp([
      ["a", ["x", "y"]],
      ["b", null],
      ["c", ["'none'"]],
    ]),
    "a x y; b; c 'none'"
  )
})

test("cspDirektiven: unbekannte Direktive, Wildcard-Host und fehlendes csp werfen", () => {
  const basis = { name: "X", zweck: "z", einwilligung: false }
  assert.throws(() => cspDirektiven([{ ...basis, host: "a.example", csp: ["script-src-elem"] }]), /nicht erlaubt/)
  assert.throws(() => cspDirektiven([{ ...basis, host: "*.example.com", csp: ["img-src"] }]), /Ungültiger Host/)
  assert.throws(() => cspDirektiven([{ ...basis, host: "https://a.example", csp: ["img-src"] }]), /Ungültiger Host/)
  assert.throws(() => cspDirektiven([{ ...basis, host: "a.example", csp: [] }]), /leer/)
  // ohne Hosts ist frame-src 'none' statt leer
  assert.deepEqual(new Map(cspDirektiven([])).get("frame-src"), ["'none'"])
})

test("deterministisch: zweimal gleiche Ausgabe, unabhängig von der Reihenfolge der JSON", () => {
  assert.equal(renderVercelJson(ressourcen), renderVercelJson(ressourcen))
  assert.equal(renderVercelJson([...ressourcen].reverse()), renderVercelJson(ressourcen))
})

test("vercel.json auf der Platte entspricht dem Generator (sonst `npm run headers`)", () => {
  const ist = readFileSync(VERCEL_JSON_PFAD, "utf8")
  assert.equal(ist, renderVercelJson(ressourcen))
  const json = JSON.parse(ist)
  // URL-Verhalten bleibt Vercel-Standard (Astro: build.format directory, trailingSlash ignore)
  assert.deepEqual(Object.keys(json).sort(), ["$schema", "headers"])
})

test("gleicherInhalt: Formatierung egal (Vercel schreibt einzeilig um), Inhalt und Reihenfolge zählen", () => {
  const soll = renderVercelJson(ladeRessourcen())
  assert.equal(gleicherInhalt(JSON.stringify(JSON.parse(soll)), soll), true)
  assert.equal(gleicherInhalt(soll.replace("DENY", "SAMEORIGIN"), soll), false)
  assert.equal(gleicherInhalt("", soll), false)
  assert.equal(gleicherInhalt("{kaputt", soll), false)
})
