import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { htmlDateien } from "./fremde-hosts.ts"

// Prüft gebautes HTML (dist/) gegen die Annahmen der CSP (script-src ohne 'unsafe-inline', ohne Hash, ohne Nonce):
// kein ausführbares Inline-Skript, keine Inline-Handler, keine javascript:-Adressen. JSON-Daten (application/json,
// application/ld+json) werden nicht ausgeführt und fallen nicht unter die CSP.
const dist = join(process.cwd(), "dist")
const vorhanden = existsSync(dist)
if (!vorhanden && process.env.CI) throw new Error("dist/ fehlt: in CI vor test:scripts `npm run build` ausführen")
const grund = "dist/ fehlt: übersprungen (lokal). Zum Prüfen erst `npm run build`, in CI ist das Pflicht."

/** Script-Typen, die der Browser nicht ausführt */
const DATEN_TYPEN = new Set(["application/json", "application/ld+json"])

/** Alle Tags mit Attributen (Text in <pre>/<code> ist escaped und taucht hier nicht auf) */
const tags = (html) => [...html.matchAll(/<([a-zA-Z][\w-]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g)].map((m) => ({ name: m[1].toLowerCase(), attrs: m[2] }))
const attr = (attrs, name) => attrs.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"))?.slice(1).find((v) => v !== undefined)

export function inlineProbleme(html) {
  const probleme = []
  for (const m of html.matchAll(/<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script>/gi)) {
    const typ = (attr(m[1], "type") ?? "").toLowerCase()
    if (attr(m[1], "src") !== undefined || DATEN_TYPEN.has(typ)) continue
    probleme.push(`Inline-Skript (${typ || "classic"}): ${m[2].trim().slice(0, 60)}`)
  }
  for (const t of tags(html)) {
    for (const h of t.attrs.matchAll(/\s(on[a-z]+)\s*=/gi)) probleme.push(`Inline-Handler ${h[1]} an <${t.name}>`)
    for (const a of ["href", "src", "action", "formaction"]) if (/^\s*javascript:/i.test(attr(t.attrs, a) ?? "")) probleme.push(`javascript:-Adresse in <${t.name} ${a}>`)
  }
  return probleme
}

test("inlineProbleme: erkennt Inline-Skripte, Handler und javascript:, lässt JSON und src-Skripte durch", () => {
  const html = `<script src="/a.js"></script><script type="module" src="/_astro/b.js"></script>
    <script type="application/ld+json">{"a":1}</script><script type="application/json">[]</script>
    <script>alert(1)</script><script type="module">import "x"</script>
    <button onclick="x()">k</button><a href="javascript:void 0">l</a><p>onclick= im Text</p>`
  assert.deepEqual(inlineProbleme(html), [
    "Inline-Skript (classic): alert(1)",
    "Inline-Skript (module): import \"x\"",
    "Inline-Handler onclick an <button>",
    "javascript:-Adresse in <a href>",
  ])
})

test("gebaute Seiten: keine ausführbaren Inline-Skripte, keine Inline-Handler, kein javascript:", { skip: vorhanden ? false : grund }, () => {
  const dateien = htmlDateien(dist)
  assert.ok(dateien.length > 20, `zu wenige Seiten in dist/: ${dateien.length}`)
  const probleme = dateien.flatMap((d) => inlineProbleme(readFileSync(d, "utf8")).map((p) => `${d.slice(dist.length)}: ${p}`))
  assert.deepEqual(probleme, [])
})

test("gebaute Seiten des neuen Layers binden Kopf- und PostHog-Skript als Datei ein, das Kopf-Skript blockierend im <head>", { skip: vorhanden ? false : grund }, () => {
  assert.deepEqual(readdirSync(join(dist, "js")).sort(), ["kopf.js", "posthog.js"])
  for (const datei of htmlDateien(dist).filter((p) => /data-schriftfeld/.test(readFileSync(p, "utf8")))) {
    const kopf = readFileSync(datei, "utf8").split("</head>")[0]
    const skripte = [...kopf.matchAll(/<script\b([^>]*)>/g)].map((m) => m[1])
    const k = skripte.find((a) => attr(a, "src") === "/js/kopf.js")
    assert.ok(k, `${datei}: /js/kopf.js fehlt im <head>`)
    assert.ok(!/\s(async|defer)\b/.test(k) && !/type="module"/.test(k), `${datei}: Kopf-Skript muss blockierend sein`)
    assert.ok(skripte.some((a) => attr(a, "src") === "/js/posthog.js"), `${datei}: /js/posthog.js fehlt`)
    // Reihenfolge wie bisher: Cookiebot zuerst, dann das Kopf-Skript
    assert.equal(attr(skripte[0], "id"), "Cookiebot", datei)
  }
})

test("gebaute Seiten: jedes <script src> ist eigene Domain oder ein Host aus script-src von vercel.json", { skip: vorhanden ? false : grund }, async () => {
  const { buildHeaders, ladeRessourcen } = await import("../scripts/build-vercel-headers.mjs")
  const csp = buildHeaders(ladeRessourcen())[0].headers.find((h) => h.key === "Content-Security-Policy").value
  const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src ")).split(" ").slice(1)
  const probleme = []
  for (const datei of htmlDateien(dist)) {
    for (const m of readFileSync(datei, "utf8").matchAll(/<script\b([^>]*)>/g)) {
      const src = attr(m[1], "src")
      if (src === undefined || src.startsWith("/")) continue
      const origin = new URL(src).origin
      if (!scriptSrc.includes(origin)) probleme.push(`${datei.slice(dist.length)}: ${src}`)
    }
  }
  assert.deepEqual(probleme, [])
})
