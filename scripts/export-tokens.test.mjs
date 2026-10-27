import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildTokens, buildTokensCss } from './export-tokens.mjs';

// ---- Fixture-Helfer ------------------------------------------------------
const v = (name, css, type, values) => ({
  name,
  codeSyntaxWeb: css === null ? null : `var(${css})`,
  type,
  values,
});
const col = (name, modes, variables) => ({
  name,
  modes: modes.map((m) => ({ id: m, name: m })),
  variables,
});
const dump = (...collections) => ({ collections });

/** Liefert den Inhalt des ersten Blocks, der mit `head` beginnt (flach, ohne verschachtelte Klammern). */
function block(css, head) {
  const start = css.indexOf(head);
  assert.notEqual(start, -1, `Block nicht gefunden: ${head}\n${css}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  return css.slice(open + 1, close);
}

// ---- Mapping --------------------------------------------------------------
test('mapt objekt/radius auf --objekt-radius (aus codeSyntaxWeb)', () => {
  const css = buildTokensCss(
    dump(
      col('Component', ['m'], [
        v('objekt/radius', '--objekt-radius', 'FLOAT', { m: { alias: '--global-radius-24' } }),
        v('card/radius', '--component-card-radius', 'FLOAT', { m: { alias: '--global-radius-28' } }),
      ]),
    ),
  );
  assert.match(css, /--objekt-radius: var\(--global-radius-24\);/);
  assert.match(css, /--component-card-radius: var\(--global-radius-28\);/);
  assert.doesNotMatch(css, /--component-objekt-radius/);
});

test('schreibt Header "GENERIERT – nicht von Hand ändern"', () => {
  const css = buildTokensCss(dump(col('Global', ['m'], [v('size/4', '--global-size-4', 'FLOAT', { m: 4 })])));
  assert.ok(css.startsWith('/* GENERIERT – nicht von Hand ändern'));
});

test('löst Alias auf var(--…) statt Wert auf', () => {
  const css = buildTokensCss(
    dump(
      col('Global', ['g'], [v('color/neutral/100', '--global-color-neutral-100', 'COLOR', { g: '#F4F2F0' })]),
      col('Theme', ['Light', 'Dark'], [
        v('surface/page', '--theme-surface-page', 'COLOR', {
          Light: { alias: '--global-color-neutral-100' },
          Dark: { alias: '--global-color-neutral-950' },
        }),
      ]),
    ),
  );
  assert.match(css, /--theme-surface-page: var\(--global-color-neutral-100\);/);
  assert.match(css, /--global-color-neutral-100: #F4F2F0;/);
});

// ---- Theme ------------------------------------------------------------------
test('schreibt Theme-Light unter :root und Dark unter data-theme und prefers-color-scheme', () => {
  const css = buildTokensCss(
    dump(
      col('Theme', ['Light', 'Dark'], [
        v('surface/page', '--theme-surface-page', 'COLOR', { Light: '#F4F2F0', Dark: '#24211F' }),
      ]),
    ),
  );
  assert.match(block(css, ':root {'), /--theme-surface-page: #F4F2F0;/);
  assert.match(block(css, ':root[data-theme="dark"] {'), /--theme-surface-page: #24211F;/);
  const media = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'));
  assert.match(media, /:root:not\(\[data-theme="light"\]\) \{\n\s+--theme-surface-page: #24211F;/);
});

// ---- Typography / Layout ----------------------------------------------------
const BREAKPOINT_MODES = [
  'Desktop Plus',
  'Desktop',
  'Tablet Landscape',
  'Tablet Portrait',
  'Mobile Landscape',
  'Mobile Portrait',
];

test('emittiert Layout je Breakpoint als min-width-Query', () => {
  const css = buildTokensCss(
    dump(
      col('Layout', BREAKPOINT_MODES, [
        v('layout/margin', '--layout-margin', 'FLOAT', {
          'Desktop Plus': 96,
          Desktop: 80,
          'Tablet Landscape': 48,
          'Tablet Portrait': 32,
          'Mobile Landscape': 32,
          'Mobile Portrait': 20,
        }),
      ]),
    ),
  );
  assert.match(block(css, ':root {'), /--layout-margin: 20px;/);
  assert.match(block(css, '@media (min-width: 768px)'), /--layout-margin: 32px;/);
  assert.match(block(css, '@media (min-width: 1024px)'), /--layout-margin: 48px;/);
  assert.match(block(css, '@media (min-width: 1440px)'), /--layout-margin: 80px;/);
  assert.match(block(css, '@media (min-width: 1920px)'), /--layout-margin: 96px;/);
});

test('Mobile Landscape ist Landscape-Query und steht zwischen 768 und 1024', () => {
  const css = buildTokensCss(
    dump(col('Layout', BREAKPOINT_MODES, [v('layout/columns', '--layout-columns', 'FLOAT', Object.fromEntries(BREAKPOINT_MODES.map((m, i) => [m, i])))])),
  );
  const ml = css.indexOf('@media (orientation: landscape) and (max-height: 500px)');
  assert.ok(ml > css.indexOf('@media (min-width: 768px)'));
  assert.ok(ml < css.indexOf('@media (min-width: 1024px)'));
  // Mobile Landscape (Index 4) -> 4, ohne Einheit
  assert.match(block(css, '@media (orientation: landscape)'), /--layout-columns: 4;/);
});

test('Queries sind aufsteigend sortiert (spätere gewinnen)', () => {
  const css = buildTokensCss(
    dump(col('Typography', BREAKPOINT_MODES, [v('text/body/size', '--text-body-size', 'FLOAT', Object.fromEntries(BREAKPOINT_MODES.map((m) => [m, 16])))])),
  );
  const order = ['(min-width: 768px)', '(orientation: landscape)', '(min-width: 1024px)', '(min-width: 1440px)', '(min-width: 1920px)'].map((q) => css.indexOf(q));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(order.every((i) => i > -1));
});

// ---- Motion ------------------------------------------------------------------
test('setzt Dauern unter prefers-reduced-motion auf 0ms', () => {
  const css = buildTokensCss(
    dump(
      col('Global', ['g'], [v('dauer/0', '--dauer-0', 'FLOAT', { g: 0 }), v('dauer/200', '--dauer-200', 'FLOAT', { g: 200 })]),
      col('Motion', ['Standard', 'Reduziert'], [
        v('dauer/sofort', '--motion-dauer-sofort', 'FLOAT', { Standard: { alias: '--dauer-200' }, Reduziert: { alias: '--dauer-0' } }),
        v('dauer/literal', '--motion-dauer-literal', 'FLOAT', { Standard: 300, Reduziert: 0 }),
      ]),
    ),
  );
  assert.match(css, /--dauer-0: 0ms;/);
  assert.match(css, /--dauer-200: 200ms;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\n  :root \{\n    --motion-dauer-sofort: var\(--dauer-0\);\n    --motion-dauer-literal: 0ms;/);
  assert.match(block(css, ':root {\n  --motion-dauer-sofort'), /--motion-dauer-sofort: var\(--dauer-200\);/);
});

// ---- Weight / Spacing --------------------------------------------------------
test('Weight Standard/Leicht/Kräftig und Spacing Default/Compact (echte Modusnamen)', () => {
  const weight = {
    name: 'Weight',
    modes: [
      { id: 'w0', name: 'Standard' },
      { id: 'w1', name: 'Leicht' },
      { id: 'w2', name: 'Kräftig' },
    ],
    variables: [v('text/h1/weight', '--text-h1-weight', 'STRING', { w0: { alias: '--font-weight-medium' }, w1: { alias: '--font-weight-regular' }, w2: { alias: '--font-weight-semibold' } })],
  };
  const spacing = {
    name: 'Spacing',
    modes: [
      { id: 's0', name: 'Default' },
      { id: 's1', name: 'Compact' },
    ],
    variables: [v('space/stack/block', '--space-stack-block', 'FLOAT', { s0: { alias: '--global-size-48' }, s1: { alias: '--global-size-32' } })],
  };
  const css = buildTokensCss(dump(weight, spacing));
  assert.match(block(css, ':root {\n  --text-h1-weight'), /--text-h1-weight: var\(--font-weight-medium\);/);
  assert.match(block(css, '[data-weight="leicht"]'), /--text-h1-weight: var\(--font-weight-regular\);/);
  assert.match(block(css, '[data-weight="kraeftig"]'), /--text-h1-weight: var\(--font-weight-semibold\);/);
  assert.match(block(css, '[data-spacing="compact"]'), /--space-stack-block: var\(--global-size-32\);/);
});

// ---- Werte / Einheiten --------------------------------------------------------
test('Einheiten: px, ms, einheitenlos, em, %, Boolean als 1/0, Farben unverändert', () => {
  const css = buildTokensCss(
    dump(
      col('Global', ['g'], [
        v('size/4', '--global-size-4', 'FLOAT', { g: 4 }),
        v('radius/full', '--global-radius-full', 'FLOAT', { g: 9999 }),
        v('font/letter-spacing/-0_5', '--global-font-letter-spacing-n0_5', 'FLOAT', { g: -0.5 }),
        v('dauer/350', '--dauer-350', 'FLOAT', { g: 350 }),
        v('federung/0_08', '--federung-0_08', 'FLOAT', { g: 0.08 }),
        v('physik/steifigkeit/380', '--physik-steifigkeit-380', 'FLOAT', { g: 380 }),
        v('font/scale/ratio', '--font-scale-ratio', 'FLOAT', { g: 1.25 }),
        v('font/line-height-ratio/body', '--font-line-height-ratio-body', 'FLOAT', { g: 1.55 }),
        v('font/tracking/display', '--font-tracking-display', 'FLOAT', { g: -0.03 }),
        v('white', '--white', 'COLOR', { g: '#FFFFFF' }),
        v('scrim', '--scrim', 'COLOR', { g: 'rgba(0, 0, 0, 0.5)' }),
        v('font/family/mono', '--global-font-family-mono', 'STRING', { g: 'Geist Mono' }),
        v('font/weight/semibold', '--font-weight-semibold', 'STRING', { g: 'SemiBold' }),
        v('font/weight/black', '--global-font-weight-black', 'STRING', { g: 'Black' }),
        v('easing/ausklingen', '--easing-ausklingen', 'STRING', { g: 'cubic-bezier(0.22, 1, 0.36, 1)' }),
        v('effekt/papierkorn-deckkraft', '--effekt-papierkorn-deckkraft', 'FLOAT', { g: 17 }),
        v('effekt/papierkorn-hell', '--effekt-papierkorn-hell', 'BOOLEAN', { g: true }),
        v('effekt/papierkorn-dunkel', '--effekt-papierkorn-dunkel', 'BOOLEAN', { g: false }),
      ]),
    ),
  );
  for (const line of [
    '--global-size-4: 4px;',
    '--global-radius-full: 9999px;',
    '--global-font-letter-spacing-n0_5: -0.5px;',
    '--dauer-350: 350ms;',
    '--federung-0_08: 0.08;',
    '--physik-steifigkeit-380: 380;',
    '--font-scale-ratio: 1.25;',
    '--font-line-height-ratio-body: 1.55;',
    '--font-tracking-display: -0.03em;',
    '--white: #FFFFFF;',
    '--scrim: rgba(0, 0, 0, 0.5);',
    '--global-font-family-mono: "Geist Mono";',
    '--font-weight-semibold: 600;',
    '--global-font-weight-black: 900;',
    '--easing-ausklingen: cubic-bezier(0.22, 1, 0.36, 1);',
    '--effekt-papierkorn-deckkraft: 17%;',
    '--effekt-papierkorn-hell: 1;',
    '--effekt-papierkorn-dunkel: 0;',
  ]) {
    assert.ok(css.includes(line), `fehlt: ${line}`);
  }
});

// ---- Ausschluss / Fehler ------------------------------------------------------
test('schließt Slides und Docs aus (auch ohne codeSyntaxWeb)', () => {
  const css = buildTokensCss(
    dump(
      col('Global', ['g'], [v('size/4', '--global-size-4', 'FLOAT', { g: 4 })]),
      col('Slides', ['m'], [v('slide/title', null, 'FLOAT', { m: 99 })]),
      col('Docs', ['m'], [v('doc/page', null, 'COLOR', { m: '#000000' })]),
    ),
  );
  assert.match(css, /--global-size-4: 4px;/);
  assert.doesNotMatch(css, /slide|99|doc-page|#000000/);
});

test('wirft bei Variable ohne codeSyntaxWeb', () => {
  assert.throws(
    () => buildTokensCss(dump(col('Global', ['g'], [v('size/oops', null, 'FLOAT', { g: 1 })]))),
    /size\/oops/,
  );
});

test('doppelte Property-Namen: erste gewinnt, Widerspruch als Warnung', () => {
  const { css, warnings } = buildTokens(
    dump(
      col('Theme', ['Light', 'Dark'], [
        v('text/on-danger', '--theme-text-on-danger', 'COLOR', { Light: '#111111', Dark: '#222222' }),
        v('text/primary', '--theme-text-on-danger', 'COLOR', { Light: '#333333', Dark: '#444444' }),
      ]),
    ),
  );
  assert.equal(css.match(/--theme-text-on-danger: #111111;/g).length, 1);
  assert.doesNotMatch(css, /#333333/);
  assert.equal(warnings.length >= 1, true);
  assert.match(warnings[0], /--theme-text-on-danger/);
});

test('identische Duplikate (Icon/Component) sind keine Warnung', () => {
  const { css, warnings } = buildTokens(
    dump(
      col('Icon', ['Default'], [v('icon/color', '--icon-color', 'COLOR', { Default: { alias: '--theme-text-default' } })]),
      col('Component', ['Default'], [v('icon/color', '--icon-color', 'COLOR', { Default: { alias: '--theme-text-default' } })]),
    ),
  );
  assert.equal(css.match(/--icon-color:/g).length, 1);
  assert.deepEqual(warnings, []);
});

test('Icon: nur Modus Default wird exportiert', () => {
  const css = buildTokensCss(
    dump(
      {
        name: 'Icon',
        modes: [
          { id: 'i0', name: 'Default' },
          { id: 'i1', name: 'Muted' },
        ],
        variables: [v('icon/color', '--icon-color', 'COLOR', { i0: { alias: '--theme-text-default' }, i1: { alias: '--theme-text-muted' } })],
      },
    ),
  );
  assert.match(css, /--icon-color: var\(--theme-text-default\);/);
  assert.doesNotMatch(css, /theme-text-muted/);
});

test('ist deterministisch', () => {
  const d = dump(col('Global', ['g'], [v('size/4', '--global-size-4', 'FLOAT', { g: 4 })]));
  assert.equal(buildTokensCss(d), buildTokensCss(d));
});

// ---- Integration gegen den echten Figma-Dump ----------------------------------
const real = JSON.parse(readFileSync(new URL('../design/figma-variables.json', import.meta.url), 'utf8'));

test('Dump: Variablenzahl je Collection stimmt, jede Variable hat codeSyntaxWeb', () => {
  const expected = { Theme: 44, Component: 786, Global: 316, Typography: 33, Icon: 1, Weight: 12, Spacing: 10, Layout: 10, Motion: 56 };
  const actual = Object.fromEntries(real.collections.map((c) => [c.name, c.variables.length]));
  assert.deepEqual(actual, expected);
  for (const c of real.collections) {
    for (const variable of c.variables) {
      assert.match(variable.codeSyntaxWeb ?? '', /^var\(--[\w-]+\)$/, `${c.name}/${variable.name}`);
    }
  }
});

test('Real: Theme-Farben, Global-Größen, Layout-Ränder, Objekt-Radien', () => {
  const { css } = buildTokens(real);
  assert.match(css, /--global-color-neutral-100: #F4F2F0;/);
  assert.match(css, /--global-color-neutral-950: #24211F;/);
  assert.match(css, /--global-size-4: 4px;/);
  // Theme: surface-page zeigt auf neutral-100 (Light) bzw. neutral-950 (Dark)
  assert.match(block(css, ':root {\n  --theme-surface-page'), /--theme-surface-page: var\(--global-color-neutral-100\);/);
  assert.match(block(css, ':root[data-theme="dark"] {'), /--theme-surface-page: var\(--global-color-neutral-950\);/);
  assert.match(block(css, '@media (prefers-color-scheme: dark)'), /--theme-surface-page: var\(--global-color-neutral-950\);/);
  // Objekt-Radien
  assert.match(css, /--objekt-radius: var\(--global-radius-24\);/);
  assert.match(css, /--objekt-radius-verschachtelt: var\(--global-radius-16\);/);
  assert.match(css, /--global-radius-24: 24px;/);
  assert.match(css, /--global-radius-16: 16px;/);
  // Layout-Margin je Breakpoint (Alias auf --global-size-N)
  const margin = (head) =>
    block(css, head).match(/--layout-margin: var\(--global-size-(\d+)\);/)[1];
  const layoutMedia = (q) => `${q} {\n  :root {\n    --layout-page-width`;
  assert.equal(margin(':root {\n  --layout-page-width'), '20');
  assert.equal(margin(layoutMedia('@media (min-width: 768px)')), '32');
  assert.equal(margin(layoutMedia('@media (min-width: 1024px)')), '48');
  assert.equal(margin(layoutMedia('@media (min-width: 1440px)')), '80');
  assert.equal(margin(layoutMedia('@media (min-width: 1920px)')), '96');
  assert.equal(margin(layoutMedia('@media (orientation: landscape) and (max-height: 500px)')), '32');
});

test('Real: Reduced-Motion-Block setzt Dauern auf var(--dauer-0), --dauer-0 ist 0ms', () => {
  const { css } = buildTokens(real);
  assert.match(css, /--dauer-0: 0ms;/);
  const start = css.indexOf('@media (prefers-reduced-motion: reduce)');
  assert.notEqual(start, -1);
  const reduced = css.slice(start, css.indexOf('\n}\n', start));
  const motionDurations = [...reduced.matchAll(/(--motion-[\w-]+): var\(--dauer-(\d+)\);/g)];
  assert.ok(motionDurations.length >= 30, `nur ${motionDurations.length} Dauern`);
  // einzige Ausnahme in Figma: lichtband/bildintervall bleibt 40ms
  for (const [, name, n] of motionDurations) {
    if (name === '--motion-lichtband-bildintervall') assert.equal(n, '40');
    else assert.equal(n, '0', name);
  }
});

test('Real: keine Slides/Docs-Tokens, bekannte Figma-Duplikate werden gemeldet', () => {
  const { css, warnings } = buildTokens(real);
  assert.doesNotMatch(css, /--slides-|--docs-/);
  assert.ok(warnings.some((w) => w.includes('--theme-text-on-danger')));
});
