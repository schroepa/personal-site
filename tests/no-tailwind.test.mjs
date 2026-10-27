import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"

// Seit Task 15b gibt es kein Tailwind, kein shadcn und kein Radix mehr (Entscheidung Patrick: nur Figma-Tokens, handgeschriebenes CSS).
const root = process.cwd()

const VERBOTENE_PAKETE = [/tailwind/i, /shadcn/i, /@radix-ui/i, /tw-animate/i, /class-variance-authority/i, /tailwind-merge/i]

test("package.json (Abhängigkeiten, Dev-Abhängigkeiten, Skripte) enthält kein Tailwind, shadcn, Radix, CVA", () => {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"))
  const felder = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.optionalDependencies, ...pkg.peerDependencies }
  const treffer = []
  for (const [name, version] of Object.entries(felder)) {
    for (const re of VERBOTENE_PAKETE) if (re.test(name) || re.test(String(version))) treffer.push(`Paket ${name}`)
  }
  for (const [name, befehl] of Object.entries(pkg.scripts ?? {})) {
    for (const re of VERBOTENE_PAKETE) if (re.test(String(befehl))) treffer.push(`Skript ${name}: ${befehl}`)
  }
  assert.deepEqual(treffer, [])
})

function sammeln(dir, ok) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) return sammeln(p, ok)
    return ok(p) ? [p] : []
  })
}

/**
 * Ausnahmen (klein, mit Grund). Alles unter diesen Pfaden darf das WORT „Tailwind“ enthalten, nie aber die Syntax unten:
 * - src/content/: veröffentlichte Artikel und Projekttexte, die über Tailwind (u. a. TintField) schreiben
 * - src/data/: Lebenslauf und „Über mich“ nennen Tailwind CSS und shadcn/ui als Fähigkeit
 * - src/pages/index.astro: Leistungstext der Startseite nennt dieselben Fähigkeiten
 * Außerdem erlaubt: der Halbsatz „kein Tailwind“ (Kommentare, die nur das Verbot festhalten).
 */
const WORT_ERLAUBT = ["src/content/", "src/data/", "src/pages/index.astro"]

const CODE = /\.(css|astro|ts|tsx|mjs|js|json)$/
const dateien = [
  ...sammeln(join(root, "src"), (p) => CODE.test(p) || p.endsWith(".md")),
  ...sammeln(join(root, "scripts"), (p) => CODE.test(p)),
  ...["astro.config.mjs", "tsconfig.json", "eslint.config.js", ".prettierrc", "playwright.config.ts", "markdown.config.mjs"]
    .map((n) => join(root, n))
    .filter(existsSync),
]

test("keine Tailwind-Syntax (@apply, @tailwind, @import \"tailwindcss\") in src/, scripts/ und Konfigurationen", () => {
  const treffer = []
  for (const f of dateien) {
    const text = readFileSync(f, "utf8")
    // Artikeltexte dürfen die Syntax erwähnen (Fließtext/Codebeispiele); Code und Styles nicht
    if (f.includes("/src/content/")) continue
    if (/@apply\b|@tailwind\b|@import\s+["']tailwindcss/.test(text)) treffer.push(relative(root, f))
  }
  assert.deepEqual(treffer, [])
})

test("kein Wort „tailwind“ in Code, Styles und Konfigurationen (Ausnahmen: Inhalte, siehe Kommentar)", () => {
  const treffer = []
  for (const f of dateien) {
    const rel = relative(root, f)
    if (WORT_ERLAUBT.some((a) => rel.startsWith(a))) continue
    const text = readFileSync(f, "utf8").replace(/kein Tailwind/gi, "")
    if (/tailwind/i.test(text)) treffer.push(rel)
  }
  assert.deepEqual(treffer, [])
  assert.ok(WORT_ERLAUBT.length <= 3, "Ausnahmeliste klein halten")
})

test("die Tailwind-Dateien sind weg (global.css, components.json, postcss.config.mjs, ui/, lib/utils.ts)", () => {
  for (const p of ["src/styles/global.css", "src/styles/typography.css", "src/styles/animations.css", "src/styles/fonts.css", "components.json", "postcss.config.mjs", "src/components/ui", "src/lib/utils.ts", "src/layouts/ToolLayout.astro"]) {
    assert.ok(!existsSync(join(root, p)), `${p} sollte nicht mehr existieren`)
  }
})

// Gebautes dist/: wie die anderen Build-Tests in CI Pflicht, lokal übersprungen
const dist = join(root, "dist")
const vorhanden = existsSync(dist)
if (!vorhanden && process.env.CI) throw new Error("dist/ fehlt: in CI vor test:scripts `npm run build` ausführen")
const grund = "dist/ fehlt: übersprungen (lokal). Zum Prüfen erst `npm run build`, in CI ist das Pflicht."

test("gebautes CSS (alle Routen) enthält weder Tailwind-Banner noch --tw-* Eigenschaften", { skip: vorhanden ? false : grund }, () => {
  const css = sammeln(dist, (p) => p.endsWith(".css"))
  const html = sammeln(dist, (p) => p.endsWith(".html"))
  assert.ok(css.length > 0, "dist/_astro/*.css erwartet")
  assert.ok(html.length > 5, "gebaute Seiten erwartet")
  const treffer = []
  const pruefen = (name, text) => {
    if (/\/\*!\s*tailwindcss/i.test(text)) treffer.push(`${name}: Tailwind-Banner`)
    if (/--tw-[a-z]/.test(text)) treffer.push(`${name}: --tw-*`)
  }
  for (const f of css) pruefen(relative(dist, f), readFileSync(f, "utf8"))
  for (const f of html) {
    // Inline-<style>-Blöcke der Seiten
    const styles = [...readFileSync(f, "utf8").matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n")
    pruefen(relative(dist, f), styles)
  }
  assert.deepEqual(treffer, [])
})
