import { test } from "node:test"
import assert from "node:assert/strict"
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

/** Breakpoint-Bedingungen, in denen Literale erlaubt sind (exakt wie in tokens.css). */
export const ALLOWED_MEDIA = [
  "(min-width: 768px)",
  "(min-width: 1024px)",
  "(min-width: 1440px)",
  "(min-width: 1920px)",
  "(orientation: landscape) and (max-height: 500px)",
]

const normMedia = (s) => s.replace(/\s+/g, " ").trim()

/**
 * Prüft CSS auf Literalwerte. Neue Seiten dürfen nur Figma-Tokens nutzen.
 * Erlaubt: 0, 1, 100%, auto, fr, none, inherit; calc() nur mit var()-Operanden.
 * @param {string} text
 * @returns {{ line: number, rule: string, snippet: string }[]}
 */
export function scanCss(text) {
  const findings = []
  // Kommentare und url()-Inhalte neutralisieren, Zeilen erhalten
  const cleaned = text
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/url\([^)]*\)/g, (m) => m.replace(/[^\n]/g, " "))
  // Erlaubte @media-Bedingungen (Breakpoints) neutralisieren; alles andere wird weiter geprüft
  const cleanedMedia = cleaned.replace(/@media([^{]*)\{/g, (m, prelude) =>
    ALLOWED_MEDIA.includes(normMedia(prelude)) ? "@media" + prelude.replace(/[^\n]/g, " ") + "{" : m
  )
  const rules = [
    ["hex-color", /#[0-9a-fA-F]{3,8}\b/g],
    ["color-function", /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/g],
    ["unit-literal", /(?<![\w.#-])-?\d*\.?\d+(?:px|rem|em|ms|s|vh|vw|pt|ch|deg)\b/g],
    ["apply", /@apply\b/g],
    ["tailwind", /tailwind/gi],
  ]
  cleanedMedia.split("\n").forEach((lineText, i) => {
    for (const [rule, re] of rules) {
      re.lastIndex = 0
      let m
      while ((m = re.exec(lineText))) {
        findings.push({ line: i + 1, rule, snippet: lineText.trim() })
      }
    }
    // calc(): jeder Operand außer var() und 0/1 ist verboten
    for (const m of lineText.matchAll(/calc\(([^;]*)\)/g)) {
      const inner = m[1].replace(/var\([^)]*\)/g, "")
      if (/\d*\.?\d+%?/.test(inner.replace(/\b[01]\b/g, ""))) {
        findings.push({ line: i + 1, rule: "calc-literal", snippet: lineText.trim() })
      }
    }
  })
  return findings
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

function collect(dir, match) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return collect(p, match)
    return match(name) ? [p] : []
  })
}

function styleBlocks(astro) {
  return [...astro.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => ({
    offset: astro.slice(0, m.index).split("\n").length,
    css: m[1],
  }))
}

test("scanCss: findet verbotene Literale", () => {
  const rules = (css) => scanCss(css).map((f) => f.rule)
  assert.deepEqual(rules("a { color: #fff; }"), ["hex-color"])
  assert.deepEqual(rules("a { color: rgb(0 0 0); }"), ["color-function"])
  assert.deepEqual(rules("a { color: oklch(1 0 0); }"), ["color-function"])
  assert.deepEqual(rules("a { margin: 12px; }"), ["unit-literal"])
  assert.deepEqual(rules("a { transition: opacity 200ms; }"), ["unit-literal"])
  assert.deepEqual(rules("a { margin: 1.5rem; }"), ["unit-literal"])
  assert.deepEqual(rules("a { @apply p-4; }"), ["apply"])
  assert.deepEqual(rules('@import "tailwindcss";'), ["tailwind"])
  assert.deepEqual(rules("a { width: calc(var(--a) * 2); }"), ["calc-literal"])
})

test("scanCss: erlaubt Tokens und strukturelle Werte", () => {
  const ok = `
    /* 12px #fff in Kommentar */
    a { margin: 0; flex: 1; width: 100%; height: auto; grid-template-columns: 1fr 1fr; }
    a { padding: var(--global-size-8); color: var(--theme-text-default); display: none; }
    a { width: calc(var(--a) + var(--b)); width: calc(var(--a) * 1); }
    @font-face { src: url("/fonts/geist-latin.woff2") format("woff2"); font-weight: 100 900; }
  `
  assert.deepEqual(scanCss(ok), [])
})

test("scanCss: Literale nur in erlaubten @media-Bedingungen", () => {
  const rules = (css) => scanCss(css).map((f) => f.rule)
  for (const c of ALLOWED_MEDIA) {
    assert.deepEqual(rules(`@media ${c} { a { margin: 0; } }`), [], c)
  }
  assert.deepEqual(rules("@media (min-width:  768px)\n{ a { margin: 0; } }"), [])
  assert.deepEqual(rules("@media (min-width: 700px) { a { margin: 0; } }"), ["unit-literal"])
  assert.deepEqual(rules("@media (max-width: 767px) { a { margin: 0; } }"), ["unit-literal"])
  // Die Erlaubnis gilt nur für die Bedingung, nicht für den Rumpf
  assert.deepEqual(rules("@media (min-width: 768px) { a { margin: 12px; } }"), ["unit-literal"])
  assert.deepEqual(rules("@media (prefers-reduced-motion: reduce) { a { margin: 0; } }"), [])
})

test("scanCss: meldet Zeilennummern", () => {
  const f = scanCss("a {\n  color: #abc;\n}")
  assert.equal(f[0].line, 2)
})

test("neue Styles (neu*.css, components/site) enthalten keine Literalwerte", () => {
  const files = [
    ...collect(join(root, "src/styles"), (n) => /^neu.*\.css$/.test(n)),
  ]
  assert.ok(files.length >= 2, "neu.css und neu-fonts.css erwartet")
  const problems = []
  for (const file of files) {
    for (const f of scanCss(readFileSync(file, "utf8"))) {
      problems.push(`${file}:${f.line} [${f.rule}] ${f.snippet}`)
    }
  }
  const astroFiles = [
    ...collect(join(root, "src/components/site"), (n) => n.endsWith(".astro")),
    join(root, "src/layouts/SiteLayout.astro"),
    join(root, "src/layouts/ArtikelLayout.astro"),
    join(root, "src/pages/index.astro"),
    ...collect(join(root, "src/pages/blog"), (n) => n.endsWith(".astro")),
  ]
  assert.ok(astroFiles.length >= 8, "Layout und Site-Komponenten erwartet")
  assert.ok(astroFiles.some((f) => f.endsWith("ArtikelLayout.astro")) && existsSync(join(root, "src/styles/neu-prose.css")), "ArtikelLayout und neu-prose.css erwartet")
  for (const file of astroFiles) {
    for (const b of styleBlocks(readFileSync(file, "utf8"))) {
      for (const f of scanCss(b.css)) {
        problems.push(`${file}:${b.offset + f.line} [${f.rule}] ${f.snippet}`)
      }
    }
  }
  assert.deepEqual(problems, [])
})

function mediaConditions(css) {
  return [...css.matchAll(/@media([^{]*)\{/g)].map((m) => normMedia(m[1]))
}

test("@media-Bedingungen der Komponenten stammen alle aus tokens.css", () => {
  const known = new Set(mediaConditions(readFileSync(join(root, "src/styles/tokens.css"), "utf8")))
  assert.ok(known.has("(min-width: 768px)"), "tokens.css sollte Breakpoints enthalten")
  const used = []
  for (const file of collect(join(root, "src/styles"), (n) => /^neu.*\.css$/.test(n))) {
    for (const c of mediaConditions(readFileSync(file, "utf8"))) used.push([file, c])
  }
  const astroFiles = [
    ...collect(join(root, "src/components/site"), (n) => n.endsWith(".astro")),
    join(root, "src/layouts/SiteLayout.astro"),
    join(root, "src/layouts/ArtikelLayout.astro"),
    join(root, "src/pages/index.astro"),
    ...collect(join(root, "src/pages/blog"), (n) => n.endsWith(".astro")),
  ]
  for (const file of astroFiles) {
    for (const b of styleBlocks(readFileSync(file, "utf8"))) {
      for (const c of mediaConditions(b.css)) used.push([file, c])
    }
  }
  const unknown = used.filter(([, c]) => !known.has(c)).map(([f, c]) => `${f}: ${c}`)
  assert.deepEqual(unknown, [])
})
