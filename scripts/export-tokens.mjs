#!/usr/bin/env node
/**
 * Token-Export: Figma-Variablen (design/figma-variables.json) -> CSS Custom Properties.
 *
 * Aufruf: node scripts/export-tokens.mjs design/figma-variables.json src/styles/tokens.css
 *         (oder: npm run tokens)
 *
 * Eingabe ist ein `FigmaDump` (siehe Typ unten); Aliase stehen als { alias: '--css-name-des-ziels' }.
 *
 * ENTSCHEIDUNGEN / REGELN
 * - Property-Name = codeSyntaxWeb ohne `var(` und `)`. Fehlt codeSyntaxWeb, wirft das Skript
 *   (Ausnahme: die feste Ausschlussliste EXCLUDED_COLLECTIONS: Slides, Docs).
 * - Aliase werden zu `var(--ziel)`, nie zum aufgelösten Wert.
 * - Doppelte Property-Namen (Figma-Copy-Paste in codeSyntaxWeb): die erste Variable gewinnt, weitere mit
 *   abweichendem Wert werden als Warnung gemeldet (identische Duplikate, z. B. icon/color in Icon und
 *   Component, werden still übersprungen).
 * - Modus -> CSS (siehe PLANS):
 *   Theme       Light = :root; Dark = :root[data-theme="dark"] und
 *               @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }.
 *   Typography/Layout
 *               Mobile Portrait (390) ist der Standard (:root). Die übrigen Modi als Media-Queries,
 *               aufsteigend sortiert, damit spätere (größere/spezifischere) gewinnen:
 *               Tablet Portrait (min-width: 768px), Mobile Landscape (844)
 *               (orientation: landscape) and (max-height: 500px)  <- ENTSCHEIDUNG: steht direkt nach 768
 *               und vor 1024, damit Phones im Querformat (< 1024 breit) die Landscape-Werte bekommen,
 *               breite, aber niedrige Desktop-Fenster (>= 1024) aber weiter die Desktop-Werte;
 *               Tablet Landscape (min-width: 1024px), Desktop (min-width: 1440px),
 *               Desktop Plus (min-width: 1920px). Jeder Block enthält ALLE Variablen der Collection
 *               (kein Diffing), damit die Kaskade unabhängig von der Reihenfolge stimmt.
 *   Weight      Standard = :root; Leicht = [data-weight="leicht"]; Kräftig = [data-weight="kraeftig"].
 *   Spacing     Default = :root; Compact = [data-spacing="compact"].
 *   Motion      Standard = :root; Reduziert = @media (prefers-reduced-motion: reduce) { :root }
 *               (Werte aus Figma; dort zeigen die Dauern auf --dauer-0 = 0ms).
 *   Icon        ENTSCHEIDUNG: nur Modus Default (:root), die übrigen Modi (On-primary ...) entfallen.
 *   Global/Component (ein Modus) = :root.
 * - Werte:
 *   COLOR    Hex #RRGGBB bzw. rgba(r, g, b, a) so, wie im Dump; Figma-NaN-Farben stehen dort als `transparent`.
 *   BOOLEAN  1 / 0.
 *   STRING   unverändert; Ausnahmen: Schriftfamilien (Name enthält font-family) werden in "…" gesetzt,
 *            Schriftgewichte (Name enthält font-weight) als Zahl (Thin 100 ... Black 900).
 *   FLOAT    Einheit nach dem Property-Namen (ersten passende Regel gewinnt, siehe unitFor):
 *              ms         Segment `dauer` (--dauer-350, --motion-dauer-*)
 *              %          `deckkraft` (Figma-Opacity-Variablen liegen auf einer 0-100-Skala)
 *              em         `tracking` (--font-tracking-*; relative Laufweite)
 *              einheiten- Segmente `federung` (bounce), `physik` (Steifigkeit/Dämpfung/Masse/Glättung),
 *              los        `ratio` (Skalen- und Zeilenhöhen-Verhältnisse), `columns`
 *              px         alles andere: Größen, Radien, Rahmen, Schriftgrößen, Zeilenhöhen, Laufweiten
 *                         (--global-font-letter-spacing-*), Breakpoints, Skalenstufen
 *            Aliase (var(--…)) bekommen nie eine Einheit; sie erben sie vom Ziel.
 *
 * @typedef {{ collections: { name: string, modes: { id: string, name: string }[],
 *   variables: { name: string, codeSyntaxWeb: string | null, type: 'COLOR'|'FLOAT'|'STRING'|'BOOLEAN',
 *   values: Record<string, string | number | boolean | { alias: string }> }[] }[] }} FigmaDump
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** Feste Ausschlussliste: haben kein codeSyntax.WEB und sind nicht Teil der Website. */
export const EXCLUDED_COLLECTIONS = ['Slides', 'Docs'];

/** Ausgabereihenfolge der Collections (lesbar: Basis zuerst, Komponenten zuletzt). */
const ORDER = ['Global', 'Theme', 'Typography', 'Weight', 'Spacing', 'Layout', 'Motion', 'Icon', 'Component'];

const ROOT = ':root';
const BREAKPOINT_PLAN = [
  { mode: 'Mobile Portrait', selector: ROOT },
  { mode: 'Tablet Portrait', media: '(min-width: 768px)', selector: ROOT },
  { mode: 'Mobile Landscape', media: '(orientation: landscape) and (max-height: 500px)', selector: ROOT },
  { mode: 'Tablet Landscape', media: '(min-width: 1024px)', selector: ROOT },
  { mode: 'Desktop', media: '(min-width: 1440px)', selector: ROOT },
  { mode: 'Desktop Plus', media: '(min-width: 1920px)', selector: ROOT },
];

/** Modus-Plan je Collection. Eintrag ohne `media` = direkte Regel; Reihenfolge = Ausgabereihenfolge. */
const PLANS = {
  Theme: [
    { mode: 'Light', selector: ROOT },
    { mode: 'Dark', media: '(prefers-color-scheme: dark)', selector: ':root:not([data-theme="light"])' },
    { mode: 'Dark', selector: ':root[data-theme="dark"]' },
  ],
  Typography: BREAKPOINT_PLAN,
  Layout: BREAKPOINT_PLAN,
  Weight: [
    { mode: 'Standard', selector: ROOT },
    { mode: 'Leicht', selector: '[data-weight="leicht"]' },
    { mode: 'Kräftig', selector: '[data-weight="kraeftig"]' },
  ],
  Spacing: [
    { mode: 'Default', selector: ROOT },
    { mode: 'Compact', selector: '[data-spacing="compact"]' },
  ],
  Motion: [
    { mode: 'Standard', selector: ROOT },
    { mode: 'Reduziert', media: '(prefers-reduced-motion: reduce)', selector: ROOT },
  ],
  Icon: [{ mode: 'Default', selector: ROOT }],
};

const FONT_WEIGHTS = {
  thin: 100,
  extralight: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

const HEADER = `/* GENERIERT – nicht von Hand ändern.
 * Quelle: design/figma-variables.json (Figma-Datei 7EQ8Ujy720sQuGCWpLyADN).
 * Neu erzeugen mit: npm run tokens
 * Regeln für Modi, Breakpoints und Einheiten: scripts/export-tokens.mjs */
`;

/** `var(--x)` -> `--x`. */
function propName(variable, collectionName) {
  const syntax = variable.codeSyntaxWeb;
  if (!syntax) {
    throw new Error(`Variable "${variable.name}" (Collection "${collectionName}") hat kein codeSyntaxWeb`);
  }
  const m = /^var\((--[^)\s]+)\)$/.exec(syntax.trim());
  if (!m) {
    throw new Error(`Variable "${variable.name}" (Collection "${collectionName}"): ungültiges codeSyntaxWeb "${syntax}"`);
  }
  return m[1];
}

/** Einheit für ein FLOAT-Literal, entschieden am Property-Namen. */
function unitFor(prop) {
  const segments = prop.replace(/^--/, '').split('-');
  if (segments.includes('dauer')) return 'ms';
  if (segments.includes('deckkraft')) return '%';
  if (segments.includes('tracking')) return 'em';
  if (['federung', 'physik', 'ratio', 'columns'].some((s) => segments.includes(s))) return '';
  return 'px';
}

function formatValue(variable, prop, value) {
  if (value !== null && typeof value === 'object' && 'alias' in value) return `var(${value.alias})`;
  switch (variable.type) {
    case 'BOOLEAN':
      return value ? '1' : '0';
    case 'FLOAT':
      return `${value}${unitFor(prop)}`;
    case 'STRING': {
      if (prop.includes('font-weight')) {
        const w = FONT_WEIGHTS[String(value).toLowerCase()];
        if (w === undefined) throw new Error(`${prop}: unbekanntes Schriftgewicht "${value}"`);
        return String(w);
      }
      if (prop.includes('font-family')) return `"${value}"`;
      return String(value);
    }
    default:
      return String(value);
  }
}

function planFor(collection) {
  if (PLANS[collection.name]) return PLANS[collection.name];
  if (collection.modes.length === 1) return [{ mode: collection.modes[0].name, selector: ROOT }];
  throw new Error(`Keine Modus-Zuordnung für Collection "${collection.name}" (${collection.modes.length} Modi)`);
}

function orderIndex(name) {
  const i = ORDER.indexOf(name);
  return i === -1 ? ORDER.length : i;
}

/**
 * @param {FigmaDump} dump
 * @returns {{ css: string, warnings: string[] }}
 */
export function buildTokens(dump) {
  const warnings = new Set();
  const seen = new Map(); // `${contextKey}|${prop}` -> Wert
  const out = [HEADER];

  const collections = dump.collections
    .filter((c) => !EXCLUDED_COLLECTIONS.includes(c.name))
    .map((c, i) => ({ c, i }))
    .sort((a, b) => orderIndex(a.c.name) - orderIndex(b.c.name) || a.i - b.i)
    .map(({ c }) => c);

  for (const collection of collections) {
    const plan = planFor(collection);
    const blocks = [];
    for (const entry of plan) {
      const mode = collection.modes.find((m) => m.name === entry.mode);
      if (!mode) {
        throw new Error(`Collection "${collection.name}": Modus "${entry.mode}" fehlt`);
      }
      const contextKey = `${entry.media ?? ''}|${entry.selector}`;
      const decls = [];
      for (const variable of collection.variables) {
        const prop = propName(variable, collection.name);
        if (!(mode.id in variable.values)) {
          throw new Error(`Variable "${variable.name}" (Collection "${collection.name}") hat keinen Wert für Modus "${mode.name}"`);
        }
        const value = formatValue(variable, prop, variable.values[mode.id]);
        const key = `${contextKey}|${prop}`;
        if (seen.has(key)) {
          if (seen.get(key) !== value) {
            warnings.add(
              `${prop}: doppelt vergeben (Variable "${variable.name}", Collection "${collection.name}", Modus "${mode.name}"); behalte ${seen.get(key)}, verwerfe ${value}`,
            );
          }
          continue;
        }
        seen.set(key, value);
        decls.push([prop, value]);
      }
      blocks.push({ entry, mode, decls });
    }

    out.push(`\n/* ${collection.name} */`);
    for (const { entry, mode, decls } of blocks) {
      if (decls.length === 0) continue;
      if (plan.length > 1) out.push(`/* ${collection.name} · ${mode.name} */`);
      if (entry.media) {
        out.push(`@media ${entry.media} {\n  ${entry.selector} {`);
        for (const [p, v] of decls) out.push(`    ${p}: ${v};`);
        out.push('  }\n}');
      } else {
        out.push(`${entry.selector} {`);
        for (const [p, v] of decls) out.push(`  ${p}: ${v};`);
        out.push('}');
      }
    }
  }

  return { css: `${out.join('\n')}\n`, warnings: [...warnings] };
}

/** @param {FigmaDump} dump */
export function buildTokensCss(dump) {
  return buildTokens(dump).css;
}

// ---- CLI -------------------------------------------------------------------
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [input, output] = process.argv.slice(2);
  if (!input || !output) {
    console.error('Aufruf: node scripts/export-tokens.mjs <figma-variables.json> <tokens.css>');
    process.exit(2);
  }
  const { css, warnings } = buildTokens(JSON.parse(readFileSync(input, 'utf8')));
  writeFileSync(output, css);
  for (const w of warnings) console.warn(`WARNUNG ${w}`);
  console.log(`${output} geschrieben (${css.split('\n').length - 1} Zeilen, ${warnings.length} Warnungen)`);
}
