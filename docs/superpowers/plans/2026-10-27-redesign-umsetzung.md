# Redesign ptrckschrdtr.de Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Astro-Seite ptrckschrdtr.de auf das fertige Figma-Design (11 Screens × 3 Breiten) umstellen und gemeinsam live bringen.

**Architecture:** Figma-Variablen werden per Skript zu `src/styles/tokens.css` (Custom Properties mit den hinterlegten Code-Syntax-Namen). Ein neues `SiteLayout` plus 13 Astro-Komponenten ersetzen `BaseLayout`/`PostLayout` seitenweise auf dem Branch `redesign`; Bewegung kommt zuletzt als progressive Verbesserung (`motion`, `lenis`), die ihre Werte per `getComputedStyle` aus den Tokens liest.

**Tech Stack:** Astro 5 (statisch), React 19 (nur Suche), TypeScript, Tailwind CSS 4 über `@tailwindcss/postcss`, Geist lokal, `motion` 14.1, `lenis` 1.3, Playwright Test + axe (E2E), `node:test` (Skripte), Vercel.

**Spec:** `docs/superpowers/specs/2026-10-27-redesign-design.md` (Quellen dort: Figma `7EQ8Ujy720sQuGCWpLyADN`, Übergabe-Datei vom 27.10.2026).

## Global Constraints

- Branch `redesign` im Worktree `~/dev/personal-site-redesign` (außerhalb von iCloud); `main` wird erst beim Livegang berührt. Vercel baut jeden Push auf `main` automatisch, Branch-Pushes erzeugen nur Previews.
- Kein Push und kein Merge ohne ausdrückliches Ja von Patrick im Chat.
- Commit-Nachrichten enden mit `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Keine hart gesetzten Farben, Größen oder Dauern in Komponenten: nur `var(--…)` aus `tokens.css`. Die CSS-Namen sind die in Figma hinterlegten Code-Syntax-Namen (WEB), exakt wie in `tokens.css`; in der Figma-Datei tragen sie den Collection-Präfix (z. B. `var(--theme-surface-page)`, `var(--global-size-4)`, `var(--component-input-spacing-x)`; Typography/Weight/Spacing/Layout/Motion ohne Präfix, z. B. `--text-body-size`). Wo dieses Dokument kürzere Namen wie `--surface-page` oder `--objekt-radius` nennt, gilt der tatsächliche Name aus `tokens.css`.
- Breakpoints (Breite/Spalten/Rand/Spaltenabstand/Abschnittsabstand): 1920/12/96/32/128 · 1440/12/80/24/96 · 1024/12/48/24/80 · 768/8/32/24/64 · 844/8/32/16/48 · 390/4/20/16/48. 4-px-Raster.
- Hell: `surface/page` #F4F2F0, `surface/secondary` #EEAD6B, `text/default` #5F5853, `text/muted` #6C645E. Dunkel: `surface/page` #24211F, `surface/secondary` #E69840, `text/muted` #A29A94. `text/on-secondary` neutral/950 in beiden Modi.
- Radien: `objekt/radius` 24, `objekt/innenabstand` 8, `objekt/radius-verschachtelt` 16, `objekt/radius-gross` 32, `objekt/radius-klein` 4; zusätzlich `corner-shape: squircle`.
- Schrift: Geist variabel 100–900 + Geist Mono, lokal. Fließtext 17 px (mobil 16). Eine `<h1>` pro Seite. Fokusrahmen 2 px, 3 px Abstand.
- Text-Kontrast ≥ 4.5:1 in beiden Themes. `prefers-reduced-motion`: Motion-Modus „Reduziert“, alle Dauern 0, kein Lenis, Endzustand sofort.
- Keine Bild-Reveals. Zeiger-Effekte nur bei `pointer: fine`. Scroll-Animationen laufen einmal und nur für Elemente unter dem sichtbaren Bereich.
- Keine CDN-Skripte für eigene Bibliotheken. Externe Hosts nur Cookiebot und PostHog, PostHog erst nach Statistik-Einwilligung.
- Rechtstexte: § 5 DDG und § 18 Abs. 2 MStV; Name „Schrödter“. (Keine Rechtsberatung, Patrick lässt prüfen.)
- Anrede: durchgehend „du“ (Arbeitsannahme, Entscheidung Patrick offen).

## Review Focus

Eingaben und Zustände, die das Spec nicht ausdrücklich nennt und die am ehesten wehtun:

1. **Ohne JavaScript:** Alle Inhalte sichtbar, kein Element bleibt bei `opacity: 0` (Animationen setzen Startzustände nur per JS). → Task 3, 12.
2. **Cookiebot abgelehnt oder blockiert:** Seite funktioniert, PostHog lädt nicht, Banner überdeckt das Schriftfeld nicht. → Task 3, 16.
3. **Theme-Flackern:** Gespeichertes oder System-Theme gilt vor dem ersten Paint, kein Hell-Blitz im Dunkelmodus. → Task 3.
4. **Überlauf bei langen deutschen Titeln:** Kein horizontaler Scroll in 390/768/1440 auf jeder Route. → Task 4, 6–10.
5. **Navigation per Client-Router:** Skripte starten nach jedem Seitenwechsel neu, ohne doppelte Listener oder zweite Lenis-Instanz. → Task 11, 13.

Zusätzlich je Task: leere oder sehr kurze Collections (Blog mit <2 Beiträgen, Filter ohne Treffer, 404 mit weniger als zwei Artikeln) → Task 7, 8, 10.

---

## File Structure

| Datei | Verantwortung |
|---|---|
| `design/figma-variables.json` | Eingefrorener Export der Figma-Variablen (Quelle für Tokens) |
| `scripts/export-tokens.mjs` | `buildTokensCss(dump)` + CLI → `src/styles/tokens.css` |
| `src/styles/tokens.css` | Generiert, nicht von Hand ändern |
| `src/styles/global.css` | Tailwind-Import, `@theme`-Bindung an Tokens, Reset, Fokus |
| `src/layouts/SiteLayout.astro` | Neues Basislayout (löst `BaseLayout.astro` ab) |
| `src/components/site/*.astro` | Die 13 Bausteine + SiteHead/SiteFooter |
| `src/scripts/*.ts` | Kleine Skripte je Komponente (Schriftfeld, Akkordeon, Inhaltsverzeichnis, Filter) |
| `src/scripts/motion/*.ts` | Token-Leser, Lenis, ein Modul je Animation, `initMotion()` |
| `src/scripts/lichtband.ts` | WebGL-Shader |
| `tests/helpers.ts`, `tests/e2e/*.spec.ts` | Playwright-Tests |
| `scripts/export-tokens.test.mjs` | `node:test` für den Token-Export |
| `vercel.json` | Sicherheits-Header inkl. CSP |

---

### Task 0: Worktree, Test-Rahmen, Baseline

**Files:**
- Create: `playwright.config.ts`, `tests/helpers.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `package.json` (devDependencies, scripts `test`, `test:e2e`, `test:scripts`), `.gitignore` (`.baseline/`, `test-results/`, `playwright-report/`)

**Interfaces:**
- Produces: `tests/helpers.ts` exportiert `expectNoHorizontalOverflow(page: Page): Promise<void>`, `expectSingleH1(page: Page): Promise<void>`, `setTheme(page: Page, theme: 'light' | 'dark'): Promise<void>` (setzt `data-theme` auf `<html>` und `localStorage.theme`), `ROUTES: string[]` (alle statischen Routen des Specs).
- Playwright-Projekte: `desktop` 1440×900, `tablet` 768×1024, `mobile` 390×844; `webServer` startet `npm run dev -- --port 4322`.

- [ ] **Step 1: Worktree anlegen.** Patrick muss vorher `LiquidToggle.tsx` und `SearchPalette.tsx` auf `main` committen oder stashen (der Worktree startet vom letzten Commit). Dann: `git worktree add ~/dev/personal-site-redesign -b redesign`, `.env` aus dem Hauptordner kopieren, `npm install`.
- [ ] **Step 2: Baseline der alten Seite.** `npm run build` und `npm run typecheck` laufen lassen, Ergebnis notieren. Mit dem Skript-Einzeiler `node -e` (Playwright) je Route in 3 Breiten Screenshots nach `.baseline/` und einmal `npx lighthouse http://localhost:4321 --output json --output-path .baseline/lighthouse.json` ablegen. Expected: Build grün; fehlt `typecheck`-Grün, im Commit vermerken, nicht beheben.
- [ ] **Step 3: Write the failing test.** `tests/e2e/smoke.spec.ts`: Test `startseite lädt in jeder Breite ohne horizontalen Überlauf` ruft `expectNoHorizontalOverflow` auf `/`.
- [ ] **Step 4: Rahmen installieren.** `npm i -D @playwright/test@1.61.1 @axe-core/playwright`; `playwright.config.ts` mit den drei Projekten; Helfer in `tests/helpers.ts`. `ROUTES = ['/', '/blog', '/projects', '/about', '/cv', '/kontakt', '/impressum', '/datenschutz', '/404']`.
- [ ] **Step 5: Run.** `npx playwright test tests/e2e/smoke.spec.ts`. Expected: PASS auf der alten Seite (belegt, dass der Rahmen läuft).
- [ ] **Step 6: Commit** `chore: Testrahmen (Playwright, axe) und Baseline`.

---

### Task 1: Token-Export Figma → CSS

**Files:**
- Create: `design/figma-variables.json`, `scripts/export-tokens.mjs`, `scripts/export-tokens.test.mjs`, `src/styles/tokens.css` (generiert)
- Modify: `package.json` (script `tokens`: `node scripts/export-tokens.mjs design/figma-variables.json src/styles/tokens.css`)

**Korrektur nach Figma-Prüfung (2026-10-27, bindend für diesen Task):**
- Export nur für die Collections Theme (44 Variablen, Modi Light/Dark), Component (786, Default), Global (316, Value), Typography (33, 6 Modi), Icon (1), Weight (12, Standard/Leicht/Kräftig), Spacing (10, Default/Compact), Layout (10, 6 Modi), Motion (56, Standard/Reduziert). Die Collections „Slides“ (15) und „Docs“ (7) haben kein Code-Syntax-WEB und werden **nicht** exportiert (feste Ausschlussliste im Skript). Icon: nur der Modus Default (**Entscheidung**, Rest YAGNI).
- `codeSyntaxWeb` ist der volle String `var(--…)`; das Skript entfernt `var(` und `)` und verwendet den Namen als Custom-Property-Namen. `alias` im Dump enthält den **CSS-Namen des Ziels** (z. B. `--global-size-16`), nicht den Figma-Variablennamen.
- BOOLEAN-Variablen werden als `1`/`0` ausgegeben. Weight-Modi Leicht/Kräftig unter `[data-weight="leicht"]` / `[data-weight="kraeftig"]`; Spacing Compact unter `[data-spacing="compact"]`.
- Akzeptanzprüfung für Step 1: Variablenzahl je Collection im Dump stimmt mit den Zahlen oben überein.
- Tests prüfen das Mapping an echten Namen (`var(--theme-surface-page)` → `--theme-surface-page`), nicht an `--surface-page`.

**Interfaces:**
- Produces: `buildTokensCss(dump: FigmaDump): string` mit
  `FigmaDump = { collections: { name: string; modes: { id: string; name: string }[]; variables: { name: string; codeSyntaxWeb: string | null; type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'; values: Record<string, string | number | boolean | { alias: string }> }[] }[] }` (`alias` = Variablenname, `values` nach Modus-ID).
- Modus → CSS: Theme `Light` = `:root`, `Dark` = `:root[data-theme="dark"]` und `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`. Typography/Layout: kleinster Modus (Mobile Portrait 390) als Standard, `@media (min-width: 768px | 1024px | 1440px | 1920px)`; Mobile Landscape 844 als `(orientation: landscape) and (max-height: 500px)` (**meine Entscheidung**, im Header des Skripts dokumentieren). Motion `Reduziert`: unter `@media (prefers-reduced-motion: reduce)` alle Dauer-Tokens `0ms`.

- [ ] **Step 1: Variablen aus Figma holen.** Skill `figma:figma-use` laden, dann per `use_figma` (Datei `7EQ8Ujy720sQuGCWpLyADN`, nur lesend) `figma.variables.getLocalVariableCollectionsAsync()` auslesen und im Format `FigmaDump` nach `design/figma-variables.json` schreiben. Verifikation: Collections Global, Theme, Typography, Weight, Layout, Spacing, Motion, Component sind vorhanden; jede Variable hat `codeSyntaxWeb`.
- [ ] **Step 2: Write the failing tests** in `scripts/export-tokens.test.mjs` (`node:test`): `mapt objekt/radius auf --objekt-radius` (aus `codeSyntaxWeb`); `schreibt Theme-Light unter :root und Dark unter data-theme und prefers-color-scheme`; `löst Alias auf var(--…) statt Wert auf`; `emittiert Layout je Breakpoint als min-width-Query`; `setzt Dauern unter prefers-reduced-motion auf 0ms`; `wirft bei Variable ohne codeSyntaxWeb`.
- [ ] **Step 3: Run** `node --test scripts/export-tokens.test.mjs`. Expected: FAIL, `buildTokensCss` fehlt.
- [ ] **Step 4: Implement `buildTokensCss(dump)` in `scripts/export-tokens.mjs`** plus CLI-Zweig (liest Datei, schreibt Ausgabe mit Kommentar „GENERIERT – nicht von Hand ändern“). Farben als Hex/rgba, Floats in px (Größen, Radien, Schriftgrößen) bzw. ms (Dauern) bzw. einheitenlos (Federung, Gewicht).
- [ ] **Step 5: Run** Tests, dann `npm run tokens`. Expected: PASS; `tokens.css` enthält `--surface-page: #F4F2F0`, im Dark-Block `#24211F`, `--objekt-radius: 24px`, `--objekt-radius-verschachtelt: 16px`, `--layout-margin` je Breakpoint (20/32/48/80/96).
- [ ] **Step 6: Commit** `feat: Token-Export aus Figma-Variablen`.

---

### Task 2: Tailwind-Bindung, Schrift, globale Basis

**Files:**
- Modify: `src/styles/global.css`, `src/styles/fonts.css`, `src/styles/typography.css`, `scripts/copy-fonts.mjs`
- Test: `tests/e2e/tokens.spec.ts`

**Interfaces:**
- Consumes: `tokens.css` (Task 1).
- Produces: Tailwind-Utilities über `@theme inline`, die auf Tokens zeigen (`--color-surface-page: var(--surface-page)` etc.); Klassen `.text-hero`, `.text-signatur`, `.text-h1`…`.text-label`, `.text-mono` entsprechend der Typografie-Tabelle der Übergabe (Größe/Zeilenhöhe/Laufweite/Gewicht aus `--text-<stil>-size` etc.).

- [ ] **Step 1: Failing test** `tests/e2e/tokens.spec.ts`: `hell: body-Hintergrund ist #F4F2F0`, `dunkel: body-Hintergrund ist #24211F`, `Fließtext 17px auf 1440, 16px auf 390`, `--objekt-radius ist 24px`. Zuerst gegen eine Testseite `/prototypes/tokens` (noindex) mit `<p class="text-body">`.
- [ ] **Step 2: Run.** Expected: FAIL (alte Farben).
- [ ] **Step 3: `global.css` neu aufbauen:** `@import "./tokens.css"` vor Tailwind, `@theme inline` nur noch mit Token-Bindungen, `--font-sans: 'Geist Variable'`, `--font-mono: 'Geist Mono'`; Reset; `:focus-visible { outline: 2px solid var(--border-focus, currentColor); outline-offset: 3px }` (Tokenname aus `tokens.css` übernehmen). PP Editorial New entfernen (`fonts.css`, `copy-fonts.mjs`, `public/fonts/editorial-*`), Geist-Preload bleibt.
- [ ] **Step 4: Run** Tests. Expected: PASS. `npm run build` muss grün bleiben.
- [ ] **Step 5: Commit** `feat: Tokens an Tailwind gebunden, Geist als einzige Schrift`.

---

### Task 3: SiteLayout mit Fundament-Ebenen

**Files:**
- Create: `src/layouts/SiteLayout.astro`, `src/components/site/Papierkorn.astro`, `LayoutRaster.astro`, `Schriftfeld.astro`, `SiteHead.astro`, `SiteFooter.astro`, `ThemeToggle.astro`, `src/scripts/schriftfeld.ts`, `src/scripts/theme.ts`
- Test: `tests/e2e/layout.spec.ts`

**Interfaces:**
- Produces: `SiteLayout` Props `{ title: string; description?: string; canonical?: string; ogImage?: string; blatt: string }` (`blatt` = Name der Seite für das Schriftfeld). Slot `default` landet in `<main id="inhalt">`. `initSchriftfeld(): () => void` (Teardown). `theme.ts` exportiert `applyStoredTheme(): void`, läuft **inline im `<head>`** vor dem ersten Paint.
- Ebenen (alle `aria-hidden="true"`, dekorativ): `Papierkorn` (SVG `feTurbulence` fractalNoise, baseFrequency 0.68, numOctaves 4, Deckkraft `--effekt-papierkorn-deckkraft`), `LayoutRaster` (12 Spaltenelemente mit gepunkteten Kanten 2 px Punkt / 8 px Abstand, Anzahl sichtbarer Spalten folgt `--layout-columns`), `Schriftfeld` (fest unten, 16 px + `env(safe-area-inset-bottom)`; zeigt Blatt, Raster-Hover „Spalte a–b · n von N“, Ortszeit Europe/Berlin).
- Übernommen aus `BaseLayout.astro` unverändert in der Funktion: Cookiebot-Skript zuerst, `PostHog`-Einbindung (`@/components/posthog.astro`), `<ClientRouter />` statt `<ViewTransitions />` (Astro 5), Skip-Link, Footer-Link „Cookie-Einstellungen“ (`Cookiebot.renew()`), `SearchPalette`.

- [ ] **Step 1: Failing tests** in `layout.spec.ts` (je Projekt desktop/tablet/mobile) auf `/prototypes/layout` (Seite mit `SiteLayout`, Text, noindex): `hat Skip-Link als erstes fokussierbares Element`, `genau eine h1`, `Landmarks banner, main, contentinfo`, `Ebenen Papierkorn, Raster, Schriftfeld sind aria-hidden und liegen unter dem Inhalt`, `Schriftfeld klebt unten (bottom 16px)`, `dunkel: kein Hell-Blitz` (mit `addInitScript` Theme dark setzen und `document.documentElement.dataset.theme` beim ersten `DOMContentLoaded` prüfen), `Inhalt sichtbar mit JavaScript aus` (`javaScriptEnabled: false` ⇒ `main` hat Text sichtbar), `axe: keine Verstöße in hell und dunkel`, `Cookiebot blockiert: Seite lädt, window.posthog ist undefined` (Route `https://consent.cookiebot.com/**` abbrechen), `kein horizontaler Überlauf`.
- [ ] **Step 2: Run.** Expected: FAIL (Layout fehlt).
- [ ] **Step 3: Implement** `SiteLayout.astro` und die Ebenen-Komponenten; `theme.ts` als Inline-Skript (liest `localStorage.theme`, sonst `prefers-color-scheme`, setzt `data-theme` vor dem Paint). `SiteHead`/`SiteFooter` nach Figma-Seiten `Site-Head`/`Site-Footer` (Navigation: Start, Über, Blog, Projekte; ⌘K-Suche; Theme-Toggle ersetzt `LiquidToggle`).
- [ ] **Step 4: Cookiebot-Banner und Schriftfeld überlappungsfrei halten:** Banner-Offset per CSS-Regel auf `#CybotCookiebotDialog` (bottom: Schriftfeldhöhe + 16 px); mit einem Test `Banner überdeckt Schriftfeld nicht` absichern (Dialog ankündigen/mocken, Bounding Boxes vergleichen).
- [ ] **Step 5: Run** Tests. Expected: PASS.
- [ ] **Step 6: Commit** `feat: SiteLayout mit Papierkorn, Raster, Schriftfeld`.

---

### Task 4: Inhalts-Komponenten

**Files:**
- Create in `src/components/site/`: `Seitenkopf.astro`, `Abschnitt.astro`, `KontaktPanel.astro`, `ProjektKarte.astro`, `ArtikelZeile.astro`, `Inhaltsverzeichnis.astro`, `Faktenzeile.astro`; `src/scripts/inhaltsverzeichnis.ts`; Galerie-Seite `src/pages/prototypes/komponenten.astro` (noindex, rendert jede Variante); Test `tests/e2e/komponenten.spec.ts`

**Interfaces (Props, Slots):**
- `Seitenkopf`: `{ art: 'seite' | 'artikel'; label: string; titel: string; einleitung?: string }`, Slot `zusatz`. Rendert die einzige `<h1>`.
- `Abschnitt`: `{ id: string; label: string; nummer?: string; layout?: 'links' | 'oben' }`, Slot `default`. `<section aria-labelledby>`; Label als `<h2>` im Format „→ 03 Arbeit“. `links` = 3 Spalten Label + 9 Spalten Inhalt; ab 768 px immer `oben`; Fließtext max. 7 der 9 Spalten.
- `KontaktPanel`: `{ label?: string; titel?: string; text?: string; email: string }`. Fläche `--surface-secondary`, Text `--text-on-secondary`, E-Mail in `text/h1`; Kopierknopf mit `aria-live="polite"`-Meldung (Skript `kopieren.ts` mit `copyEmail(el: HTMLElement): Promise<void>`).
- `ProjektKarte`: `{ format: '16x10' | '4x5' | '1x1'; meta: string; titel: string; wirkung: string; bild?: string; href: string; slug: string }`; randlos, `view-transition-name: projekt-bild-<slug>` am Bild.
- `ArtikelZeile`: `{ groesse: 'gross' | 'klein'; meta: string; titel: string; auszug?: string; href: string }`.
- `Inhaltsverzeichnis`: `{ eintraege: { id: string; text: string }[] }`; `initInhaltsverzeichnis(): () => void` markiert den aktiven Eintrag (`aria-current="true"`).
- `Faktenzeile`: `{ fakten: [Fakt, Fakt, Fakt]; aktionen?: { label: string; href: string }[] }`, `Fakt = { label: string; wert: string }`.

- [ ] **Step 1: Failing tests** auf `/prototypes/komponenten`: je Komponente Computed-Style-Assertions mit Spec-Werten (`ProjektKarte` Radius 24 px und Bildradius 16 px bei 8 px Innenabstand; `KontaktPanel` Hintergrund #EEAD6B hell / #E69840 dunkel, Textfarbe neutral/950; `Abschnitt links` Label-Spalte = 3 von 12 Spalten bei 1440), `Abschnitt oben ab 768`, `Inhaltsverzeichnis: Tab-Reihenfolge und aria-current beim Scrollen`, `KontaktPanel: Klick auf Kopieren füllt aria-live-Bereich` (Clipboard-Berechtigung gewähren), `lange Titel („Datenschutzerklärungsüberarbeitung…“, 80 Zeichen) laufen nicht über (kein horizontaler Überlauf in 390)`, axe in hell/dunkel.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement** die Komponenten; Maße ausschließlich über Tokens (`--projekt-karte-radius` usw. aus der Component-Collection). Referenz je Komponente: gleichnamige Figma-Seite (Verwendung, Varianten, Barrierefreiheit).
- [ ] **Step 4: Run** Tests. Expected: PASS.
- [ ] **Step 5: Commit** `feat: Inhaltskomponenten (Seitenkopf, Abschnitt, Karten, Kontakt-Panel)`.

---

### Task 5: Galerie-Akkordeon

**Files:**
- Create: `src/components/site/GalerieAkkordeon.astro`, `src/scripts/galerie-akkordeon.ts`
- Modify: `src/pages/prototypes/komponenten.astro`
- Test: `tests/e2e/galerie-akkordeon.spec.ts`

**Interfaces:**
- Produces: `GalerieAkkordeon` Props `{ kapitel: { titel: string; bild: string; href: string }[] }` (1–5, sonst Build-Fehler mit klarer Meldung). `initGalerieAkkordeon(root: HTMLElement): () => void`. Zustand `data-aktiv="<index>"`; Breiten steuert CSS (`flex-grow`) über `--galerie-aktiv`; Animation folgt in Task 12, hier springt der Zustand sofort.

- [ ] **Step 1: Failing tests:** `Hover 90 ms bleibt aktiv erst nach Absicht` (Maus 40 ms drüber ⇒ unverändert; 120 ms ⇒ aktiv), `Pfeil links/rechts wechselt aktiv, Home/End springt`, `Fokus-Reihenfolge Tab nur auf aktivem Streifen`, `Bild hat feste Breite des offenen Streifens (kein Verzerren)`, `mit 1 Kapitel kein Fehler`, `mit 6 Kapiteln schlägt der Build fehl` (Komponenten-Funktion `assertKapitel(kapitel)` als reine Funktion testen).
- [ ] **Step 2: Run** (FAIL), **Step 3: Implement** (Roving-Tabindex, `role="group"`, Streifen als `<a>`), **Step 4: Run** (PASS).
- [ ] **Step 5: Commit** `feat: Galerie-Akkordeon`.

---

### Task 6: Startseite

**Files:**
- Modify: `src/pages/index.astro` (ersetzt den alten Inhalt; die alte Fassung vorher nach `docs/archiv/index-alt.astro` kopieren, Löschung in Task 15)
- Test: `tests/e2e/startseite.spec.ts`

**Interfaces:**
- Consumes: `SiteLayout`, `Abschnitt`, `ProjektKarte`, `ArtikelZeile`, `GalerieAkkordeon`, `KontaktPanel`, `Lichtband` (Hülle: `<canvas data-lichtband aria-hidden>` mit statischem Farbverlauf als Fallback; Shader folgt in Task 14).
- Aufbau: Einstieg mit Lichtband · `02 Über mich` (Signatur „Design Engineer. Berlin. 15+ Jahre.“ als einziger `text/signatur` auf der Seite) · `03 Arbeit` (Bento aus Projekten mit `featured: true`) · `04 Digital Art` (Akkordeon, Platzhalterkapitel bis echte Bilder vorliegen) · `05 Gedanken` (1 große + 2 kleine `ArtikelZeile`, jüngste Nicht-Drafts) · `06 Kontakt` (`KontaktPanel`).

- [ ] **Step 1: Failing tests:** `Reihenfolge der Abschnitte 02–06`, `genau eine h1`, `Signatur kommt genau einmal vor`, `Bento zeigt nur featured-Projekte`, `Gedanken: 1 groß + 2 klein, Drafts fehlen`, `mit nur einem veröffentlichten Beitrag erscheint 1 große Zeile ohne Fehler`, `mit JavaScript aus sind alle Abschnitte sichtbar`, kein Überlauf, axe hell/dunkel.
- [ ] **Step 2: Run** (FAIL). **Step 3: Implement** `index.astro` mit `getCollection('blog'|'projects')`, Sortierung nach `date` absteigend. **Step 4: Run** (PASS).
- [ ] **Step 5: Vergleich mit Figma:** Screenshot von Startseite in 1440/768/390 neben `get_screenshot` der Figma-Screens (Seite „Startseite“, Knoten 237:154) legen; Abweichungen > 4 px bei Abständen oder falscher Token-Einsatz werden behoben.
- [ ] **Step 6: Commit** `feat: Startseite im neuen Design`.

---

### Task 7: Blog-Übersicht und Artikel

**Files:**
- Create: `src/layouts/ArtikelLayout.astro` (löst `PostLayout.astro` ab), `src/scripts/filter.ts`
- Modify: `src/pages/blog/index.astro`, `src/pages/blog/[slug].astro`, `src/styles/prose.css` (auf Tokens)
- Test: `tests/e2e/blog.spec.ts`

**Interfaces:**
- Produces: `filterByTag<T extends { tags?: string[] }>(items: T[], tag: string | null): T[]` in `src/lib/filter.ts` (reine Funktion, `null` = alle); `initFilter(root: HTMLElement): () => void` blendet Einträge per `hidden` aus und zeigt bei 0 Treffern den Text „Keine Beiträge zu diesem Thema.“ (`role="status"`).
- Übersicht: Seitenkopf mit Themenfiltern · `Neu` (1 große `ArtikelZeile`) · Artikel nach Jahren gruppiert (absteigend) · `KontaktPanel`. Artikel: `Seitenkopf art="artikel"` · Titelbild (`coverImage`, sonst `cover-image.ts`) · Text über 7 Spalten + `Inhaltsverzeichnis` aus den `h2` · Weiterlesen (2 `ArtikelZeile`, ohne den aktuellen Beitrag) · `KontaktPanel`. Lesezeit aus `src/lib/reading-time.ts`.

- [ ] **Step 1: Failing tests:** `filterByTag` (Unit via `node:test` in `src/lib/filter.test.mjs`): `null liefert alle`, `unbekannter Tag liefert []`, `Reihenfolge bleibt`. E2E: `Jahresgruppen absteigend`, `Filter blendet aus und meldet bei 0 Treffern`, `Drafts erscheinen nicht`, `Artikel: Inhaltsverzeichnis listet jedes h2 und springt zum Anker`, `Weiterlesen enthält den aktuellen Artikel nicht und hat bei nur einem anderen Beitrag genau eine Zeile`, `Textspalte ist ≤ 7 von 9 Spalten breit`, kein Überlauf (lange Titel), axe.
- [ ] **Step 2: Run** (FAIL). **Step 3: Implement.** **Step 4: Run** (PASS).
- [ ] **Step 5: Commit** `feat: Blog und Artikel im neuen Design`.

---

### Task 8: Projekt-Übersicht und Fallstudie

**Files:**
- Modify: `src/content/config.ts`, `src/pages/projects/index.astro`, `src/pages/projects/[slug].astro`, `src/content/projects/tintfield.md` (Vorlage)
- Test: `tests/e2e/projekte.spec.ts`

**Interfaces:**
- Schema-Erweiterung `projects` (alle optional, Defaults): `wirkung: z.string().optional()` (ein Satz), `format: z.enum(['16x10','4x5','1x1']).default('16x10')`, `fakten: z.array(z.object({ label: z.string(), wert: z.string() })).length(3).optional()`, `kennzahlen: z.array(z.object({ wert: z.string(), label: z.string() })).optional()`, `weitere: z.boolean().default(false)` (Liste „Weitere Projekte“). Fallstudien-Gliederung über Markdown-`h2` in dieser Reihenfolge: `Ausgangslage`, `Ansatz`, `Einblicke`, `Entscheidungen`, `Ergebnis`.
- `assertFallstudie(headings: string[]): void` in `src/lib/fallstudie.ts` wirft, wenn Pflicht-Überschriften oder Reihenfolge fehlen (nur für Projekte mit `fakten`).
- Übersicht: Seitenkopf mit Filtern (`filterByTag`) · `Ausgewählt` (Bento, `featured`) · `Weitere Projekte` (Liste) · `Digital Art` (Akkordeon) · `KontaktPanel`. Fallstudie: Seitenkopf + `Faktenzeile` · Titelbild · die fünf Abschnitte · `Ergebnis` mit Kennzahlen · `Nächstes Projekt` · `KontaktPanel`.

- [ ] **Step 1: Failing tests:** Unit `assertFallstudie` (`ok bei vollständiger Reihenfolge`, `wirft bei fehlendem Ergebnis`, `wirft bei vertauschter Reihenfolge`); E2E: `Übersicht trennt Ausgewählt und Weitere`, `Filter ohne Treffer zeigt Hinweis`, `Fallstudie Tintfield zeigt Faktenzeile mit 3 Fakten`, `Nächstes Projekt verlinkt zyklisch und nie auf sich selbst (auch bei nur einem Projekt: Abschnitt entfällt)`, `Projekt ohne fakten rendert als einfache Seite ohne Fehler`, Kennzahlen in `text/h1`, kein Überlauf, axe.
- [ ] **Step 2: Run** (FAIL). **Step 3: Implement**; `tintfield.md` mit Fakten, Kennzahlen und den fünf Abschnitten füllen (Texte aus bestehendem Inhalt, fehlende Abschnitte mit `<!-- TODO Patrick -->` markieren, nicht erfinden). ProMan, alterli, Fusca bleiben einfache Seiten, bis Texte vorliegen. **Step 4: Run** (PASS).
- [ ] **Step 5: Commit** `feat: Projekte und Fallstudie im neuen Design`.

---

### Task 9: Über mich, Lebenslauf, Kontakt

**Files:**
- Modify: `src/pages/about.astro`, `src/pages/cv.astro`, `src/layouts/PrintLayout.astro`
- Create: `src/pages/kontakt.astro`
- Test: `tests/e2e/seiten.spec.ts`

**Interfaces:**
- Consumes: `src/data/cv.ts`. Produces: Route `/kontakt` (in Sitemap, nicht noindex).
- Aufbau: Über mich: Seitenkopf · Haltung · Kompetenzen · Stationen · Werkzeuge · `KontaktPanel`, **kein Foto**. Lebenslauf: Seitenkopf mit PDF-Link `/cv.pdf` · Profil · Erfahrung · Projekte · Kompetenzen · Tech Stack · Ausbildung · Sprachen. Kontakt: Seitenkopf mit E-Mail, „Adresse kopieren“, LinkedIn · `Wofür` · `Ablauf` · `Daten`; **kein Formular**; Texte „Wofür“ und „Ablauf“ als Vorschläge aus der Übergabe, in einer Datei `src/data/kontakt.ts` gebündelt, damit Patrick sie freigeben kann.

- [ ] **Step 1: Failing tests:** `/kontakt` existiert, hat genau eine h1, kein `<form>`; `Kopieren meldet per aria-live`; `/about` enthält kein `<img>` im Hauptbereich; `/cv` listet alle Einträge aus `cv.ts` (Anzahl Erfahrungen stimmt); `PDF-Link zeigt auf /cv.pdf`; `Sitemap enthält /kontakt` (nach Build); kein Überlauf, axe.
- [ ] **Step 2: Run** (FAIL). **Step 3: Implement.** `PrintLayout` und `generate-cv-pdf.mjs` auf die neuen Tokens/Typografie umstellen, PDF weiterhin im `postbuild`. **Step 4: Run** (PASS). **Step 5: Commit** `feat: Über mich, Lebenslauf und Kontakt`.

---

### Task 10: Impressum, Datenschutz, 404

**Files:**
- Modify: `src/pages/impressum.astro`, `src/pages/datenschutz.astro`, `src/pages/404.astro`
- Create: `src/data/rechtliches.ts`
- Test: `tests/e2e/rechtliches.spec.ts`

**Interfaces:**
- `rechtliches.ts` exportiert `EXTERNE_RESSOURCEN: { name: string; host: string; zweck: string; einwilligung: boolean }[]` mit mindestens Cookiebot (`consent.cookiebot.com`, `consentcdn.cookiebot.com`) und PostHog (Host aus `PUBLIC_POSTHOG_HOST`); Quelle für den Datenschutz-Abschnitt „Externe Ressourcen“ **und** für die CSP in Task 16.
- Impressum: je Pflichtangabe ein `Abschnitt`; Rechtsgrundlagen § 5 DDG und § 18 Abs. 2 MStV; Name „Patrick Schrödter“; Anschrift als Platzhalter `[[ANSCHRIFT]]`, Stand als `[[STAND]]` (Patrick trägt ein, der Test erinnert daran). Datenschutz: sieben nummerierte Abschnitte; Abschnitt 3 beschreibt **Cookiebot** (Zweck Einwilligungsverwaltung, Daten, Speicherdauer) und **PostHog** (Zweck Reichweitenmessung, Daten, Rechtsgrundlage Einwilligung Art. 6 Abs. 1 lit. a DSGVO, Empfänger/Drittland laut Vertrag, Widerruf über „Cookie-Einstellungen“). 404: Seitenkopf mit drei Wegen · die zwei neuesten Artikel.

- [ ] **Step 1: Failing tests:** `Impressum nennt § 5 DDG und § 18 Abs. 2 MStV und nicht TMG/RStV`, `Name ist überall Schrödter (kein „Schröder“ in /impressum, /datenschutz, title)`, `Datenschutz nennt Cookiebot und PostHog und Einwilligung`, `jeder Host aus EXTERNE_RESSOURCEN steht im Datenschutztext`, `Datenschutz hat 7 nummerierte Abschnitte`, `404 zeigt zwei Artikel und bei nur einem Artikel einen`, `Platzhalter [[ANSCHRIFT]]/[[STAND]] sind gesetzt` (als **erwartet rot** markiert: `test.fixme` mit Hinweis, wird in Task 17 scharf), kein Überlauf, axe.
- [ ] **Step 2: Run** (FAIL). **Step 3: Implement** (Texte aus der bestehenden Datenschutzerklärung übernehmen, Anrede „du“, dann Abschnitt 3 ergänzen). **Step 4: Run** (PASS). **Step 5: Commit** `feat: Rechtliches und 404, Tracking dokumentiert`.

---

### Task 11: Bewegungs-Infrastruktur

**Files:**
- Create: `src/scripts/motion/tokens.ts`, `src/scripts/motion/lenis.ts`, `src/scripts/motion/index.ts`, `src/scripts/motion/tokens.test.mjs` (läuft mit `node --test` über `tsx`-freies Duplikat: Parser als reine Funktion in `src/scripts/motion/parse.mjs`)
- Modify: `package.json` (`motion@14.1`, `lenis@1.3` per `npm i`), `src/layouts/SiteLayout.astro`
- Test: `tests/e2e/motion-infra.spec.ts`

**Interfaces:**
- Produces: `parseToken(raw: string): number` (`"750ms"` → 750, `"0.08"` → 0.08, `"1.4s"` → 1400, leer → wirft); `readToken(name: string, el?: Element): number` (liest `getComputedStyle(el ?? document.documentElement).getPropertyValue(name)`); `readSpring(prefix: string): { visualDuration: number; bounce: number }` (visualDuration in Sekunden; liest `<prefix>-dauer` und `<prefix>-federung`, **Namen gegen `tokens.css` prüfen**); `prefersReducedMotion(): boolean`; `initLenis(): () => void` (lerp aus `--motion-scroll-glaettung`, Standard 0.085; bei Reduziert und bei `pointer: coarse`-Geräten mit nativem Scrollen: No-op); `initMotion(): () => void` ruft alle Module auf und gibt gesammelten Teardown zurück; Aufruf auf `astro:page-load`, Teardown auf `astro:before-swap`.

- [ ] **Step 1: Failing tests:** Unit `parseToken` (`ms`, `s`, einheitenlos, leer wirft). E2E: `reduced motion: Lenis nicht aktiv (html hat kein .lenis)`, `normal: html.lenis vorhanden`, `nach 5 Client-Router-Navigationen existiert genau eine Lenis-Instanz` (zählt `document.querySelectorAll('html.lenis')` bzw. über Test-Hook `window.__lenisCount`), `Dauern sind unter reduced motion 0`.
- [ ] **Step 2: Run** (FAIL). **Step 3: Implement.** **Step 4: Run** (PASS). **Step 5: Commit** `feat: Bewegungs-Infrastruktur (Token-Leser, Lenis)`.

---

### Task 12: Startseiten-Animationen

**Files:**
- Create in `src/scripts/motion/`: `raster-aufbau.ts`, `raster-spalte.ts`, `hero-woerter.ts`, `signatur.ts`, `abschnittslinie.ts`, `akkordeon.ts`, `durchstreichen.ts`
- Modify: `src/scripts/motion/index.ts`, `src/scripts/galerie-akkordeon.ts`
- Test: `tests/e2e/motion-startseite.spec.ts`

**Interfaces:** Jedes Modul exportiert `init<Name>(): () => void`. Werte (Token-Namen aus `tokens.css`, hier die Figma-Namen):
- Raster beim Laden 1400 ms, Versatz 40 ms je Spalte (`raster/aufbau`, `versatz/spalte`); Spalte unter dem Zeiger Feder 450 ms ein / 1300 ms aus (`feder/spalte-ein`, `feder/spalte-aus`), nur `pointer: fine`.
- Hero-Wörter Feder 900 ms / 0.12, Versatz 70 ms; Signatur-Zeilen Feder 1000 ms / 0.14, Versatz 120 ms, Gewicht 200 → 900 in 1400 ms; Abschnittslinie Feder 1100 ms / 0.
- Akkordeon Breite Feder 750 ms / 0.08; Bild öffnet Feder 1000 ms / 0.1, Sättigung 0.3 → 1; Bild schließt Feder 800 ms / 0, ±24 px versetzt.
- „Screens“ durchstreichen 500 ms nach 1500 ms Start, „Systeme.“ 800 ms.
- Startzustände (`opacity: 0` usw.) setzt **nur JS** (Klasse `html.js-motion`), nie CSS allein.

- [ ] **Step 1: Failing tests:** `ohne JS: Hero und Signatur sichtbar`, `reduced motion: sofort Endzustand (kein Element mit opacity < 1 nach 100 ms)`, `Raster baut 12 Spalten auf, letzte Spalte beginnt ≥ 440 ms nach der ersten`, `Hover über Spalte setzt data-hover und löst sich nach Verlassen`, `kein Hover-Effekt bei pointer: coarse`, `Elemente über dem sichtbaren Bereich werden nicht animiert, per Anker-Sprung übersprungene erscheinen trotzdem`, `Animation läuft pro Element einmal (zweites Scrollen ändert nichts)`.
- [ ] **Step 2: Run** (FAIL). **Step 3: Implement**, Werte ausschließlich über `readSpring`/`readToken`. **Step 4: Run** (PASS). **Step 5: Commit** `feat: Startseiten-Animationen`.

---

### Task 13: Seitenübergreifende Bewegung und View Transitions

**Files:**
- Create in `src/scripts/motion/`: `labels.ts` (Zeichen-Scramble 650 ms, Sperrung 0.6em → normal 1200 ms), `magnet.ts` (Steifigkeit 380, Dämpfung 24, Masse 0.6; zurück 260 / 11), `begleiter.ts` („Ansehen“: 520 / 40 / 0.7), `tag-wischen.ts` (1600 ms, `easing/oeffnen`), `scroll-einmal.ts`
- Modify: `src/components/site/ProjektKarte.astro`, `src/layouts/SiteLayout.astro` (View-Transition-Dauer 600 ms über `--objekt-uebergang-dauer`), `src/scripts/motion/index.ts`
- Test: `tests/e2e/motion-seiten.spec.ts`

**Interfaces:** `init<Name>(root?: ParentNode): () => void`; `scroll-einmal` exportiert `revealOnce(el: Element, run: () => void): void` (nur Elemente unter dem Viewport, sonst sofort Endzustand).

- [ ] **Step 1: Failing tests:** `Label scrambled und endet im Originaltext`, `Label-Text bleibt für Screenreader unverändert (aria-label oder visuell versteckter Originaltext)`, `Magnet nur bei pointer: fine`, `Projektkarte → Fallstudie: Bild hat gleichen view-transition-name auf beiden Seiten`, `Rücksprung per Zurück-Taste startet Skripte neu ohne doppelte Listener` (Zähler `window.__listenerCount`-Hook im Dev-Modus), `reduced motion: keine Übergangsanimation`.
- [ ] **Step 2: Run** (FAIL). **Step 3: Implement.** **Step 4: Run** (PASS). **Step 5: Commit** `feat: Bewegung für Labels, Buttons, View Transitions`.

---

### Task 14: Lichtband (WebGL)

**Files:**
- Create: `src/scripts/lichtband.ts`
- Modify: `src/components/site/Lichtband.astro`
- Test: `tests/e2e/lichtband.spec.ts`

**Interfaces:**
- Produces: `initLichtband(canvas: HTMLCanvasElement): () => void`. Shader: 4 Gauß-Flecken `exp(−2.6·d²/r²)`, Zufallsstartwert je Besuch, langsames Driften, Dithering ±1.5/255, 25 fps, CSS-Maske oben/unten/seitlich 16 %. Paletten (RGBA) hell: 250 199 219 .85 · 255 209 168 .9 · 237 173 107 .45 · 253 242 224 .9; dunkel: 196 104 92 .55 · 222 140 64 .6 · 140 82 112 .45 · 236 178 120 .4. Hell `mix-blend-mode: multiply`, dunkel `screen`; Deckkraft über `--effekt-lichtband-deckkraft` (100 % / 50 %). Pausiert per `IntersectionObserver` außerhalb des Viewports; bei Reduziert und ohne WebGL: statisches CSS-Verlauf-Fallback (kein Fehler).

- [ ] **Step 1: Failing tests:** `Canvas ist aria-hidden und hat Fallback-Verlauf ohne WebGL` (WebGL per `--disable-gpu`/Init-Script deaktivieren), `Teardown stoppt requestAnimationFrame` (Hook), `pausiert außerhalb des Viewports` (nach Scrollen keine neuen Frames), `reduced motion: ein Frame, keine Schleife`, `Palette wechselt mit Theme`, `kein Layout-Shift (CLS-Messung < 0.01)`.
- [ ] **Step 2: Run** (FAIL). **Step 3: Implement** (Fragment-Shader als String im Modul, Farben als Uniforms aus den Paletten oben, weil Figma-Shader keine Variablen binden). **Step 4: Run** (PASS). **Step 5: Commit** `feat: Lichtband-Shader`.

---

### Task 15: Aufräumen und Namen

**Files:**
- Delete: `src/layouts/BaseLayout.astro`, `PostLayout.astro`, `main.astro`, `src/components/astro/{CustomCursor,HeroMesh,GrainOverlay,BaselineGrid,SectionIndicator}.astro`, `src/components/LiquidToggle.tsx`, `src/scripts/{pixelTextHover,textReveal,scrollTextReveal,scrollAnimations}.ts`, `docs/archiv/index-alt.astro` nach Abnahme, Testinhalte `src/content/blog/test-1.md`, `test-2.md`, `src/content/projects/sample-art-project.md`
- Modify: `ToolLayout.astro`, `src/pages/tools/gradient-generator.astro`, `src/pages/prototypes/*`, `src/pages/og-render/*` (auf `SiteLayout`/Tokens), `src/pages/llms*.txt.ts`, `astro.config.mjs`, `package.json`
- Test: `tests/e2e/aufraeumen.spec.ts`

- [ ] **Step 1: Failing tests:** `Repo enthält kein „Schröder“ außer in zitierten Quellen` (`node:test` mit `git grep -n "Schröder\b"`; Ausnahmenliste in der Testdatei), `kein Import von BaseLayout/PostLayout`, `kein PP Editorial New in dist`, `alle Routen aus ROUTES liefern 200 und haben ein title mit „Schrödter“ oder Seitentitel`, `Sitemap enthält /kontakt, nicht /prototypes oder /og-render`, `tools/gradient-generator läuft mit SiteLayout und hat genau eine h1`.
- [ ] **Step 2: Run** (FAIL). **Step 3: Entfernen und umstellen**, `ToolLayout` auf Tokens, Namen korrigieren (Impressum, Datenschutz, Seitentitel, Footer, `llms.txt`, Meta, `site.webmanifest`, `README.md`). `npm run build && npm run typecheck && npm run lint` grün. **Step 4: Run** (PASS). **Step 5: Commit** `refactor: alte Layouts und Effekte entfernt, Name korrigiert`.

---

### Task 16: Sicherheits-Header (CSP) und Tracking-Verhalten

**Files:**
- Create: `vercel.json`, `scripts/build-vercel-headers.mjs`, `scripts/build-vercel-headers.test.mjs`
- Test: `tests/e2e/csp.spec.ts`

**Interfaces:**
- Consumes: `EXTERNE_RESSOURCEN` aus `src/data/rechtliches.ts` (nach `.mjs`-Spiegel oder Import über `tsx`-freien JSON-Export `src/data/externe-ressourcen.json`, **meine Entscheidung**: JSON als einzige Quelle, `rechtliches.ts` liest es).
- Produces: `buildHeaders(hosts: string[]): { source: string; headers: { key: string; value: string }[] }[]`. Header: `Content-Security-Policy` (`default-src 'self'`; `script-src 'self' 'unsafe-inline'` + Hosts [Inline-Skripte stammen aus Astro, Theme, Cookiebot-Snippet; Nonces sind auf einer statischen Seite nicht ohne Hash-Pipeline möglich, Hash-Variante als spätere Verschärfung]; `img-src 'self' data: blob:` + Hosts; `connect-src 'self'` + Hosts; `frame-ancestors 'none'`; `base-uri 'self'`; `form-action 'self'`), `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.

- [ ] **Step 1: Failing tests:** Unit `buildHeaders`: `enthält jeden Host genau einmal`, `frame-ancestors none`, `kein * als Quelle`. E2E (gegen `astro preview` mit Headern über einen kleinen Proxy oder Meta-Äquivalent im Test): `keine CSP-Verletzungen in der Konsole auf allen ROUTES`, `ohne Einwilligung: keine Anfrage an den PostHog-Host`, `nach Statistik-Einwilligung (Cookiebot-Mock): PostHog init`.
- [ ] **Step 2: Run** (FAIL). **Step 3: Implement**; erlaubte Hosts durch echten Netzwerkverkehr im Preview prüfen (`read_network_requests`) und die JSON-Liste ergänzen. **Step 4: Run** (PASS). **Step 5: Commit** `feat: Sicherheits-Header und Tracking-Prüfung`.

---

### Task 17: QA-Durchlauf

**Files:**
- Create: `tests/e2e/qa-alle-routen.spec.ts`, `scripts/qa-kontaktbogen.mjs`
- Modify: `tests/e2e/rechtliches.spec.ts` (`fixme` → scharf)

- [ ] **Step 1: Vollständiger Lauf:** `npm run build`, dann `tests/e2e/qa-alle-routen.spec.ts` über `ROUTES` × {desktop, tablet, mobile} × {hell, dunkel} × {normal, reduced motion}: axe ohne Verstöße, kein horizontaler Überlauf, eine h1, Tab-Durchlauf erreicht jedes interaktive Element mit sichtbarem Fokus, Kontrast-Paare der Übergabe (6.3:1 / 14.3:1 / 5.2:1 / 8.3:1 / 7.0:1 hell) aus berechneten Farben nachgerechnet.
- [ ] **Step 2: Kontaktbogen** `node scripts/qa-kontaktbogen.mjs` erzeugt je Seite eine HTML-Übersicht Code-Screenshot neben Figma-Screenshot (`get_screenshot` je Screen), 3 Breiten. Patrick sichtet.
- [ ] **Step 3: Lighthouse** gegen `npm run preview`; Performance, Accessibility und Best Practices nicht schlechter als `.baseline/lighthouse.json`.
- [ ] **Step 4: Platzhalter scharf stellen:** `[[ANSCHRIFT]]` und `[[STAND]]` von Patrick eintragen lassen; Test aus `fixme` nehmen.
- [ ] **Step 5: Commit** `test: QA-Lauf über alle Routen`.

---

### Task 18: Preview, Abnahme, Livegang

**Files:** keine Codeänderung außer Korrekturen aus der Abnahme.

- [ ] **Step 1: Push des Branches** `redesign` (nach Ja von Patrick). Vercel erzeugt eine Preview-URL; mit `vercel:status` bzw. Vercel-MCP prüfen, dass der Build grün ist und `PUBLIC_POSTHOG_*` in der Preview-Umgebung gesetzt sind.
- [ ] **Step 2: Abnahme in der Preview:** Checkliste aus Spec Abschnitt 7 abhaken (DDG/MStV, Name, Tracking dokumentiert, lokale Bündelung, Anschrift/Stand, Anrede). Rechtstexte lässt Patrick prüfen.
- [ ] **Step 3: Routen-Check:** alle Routen der Produktion bleiben gleich; neu ist nur `/kontakt`, daher sind keine Redirects nötig. Alte Blog-/Projekt-Slugs unverändert lassen (Test: Slug-Liste vor/nach identisch).
- [ ] **Step 4: Livegang nach ausdrücklichem Ja:** Pull Request `redesign` → `main`, Merge (Vercel deployt Produktion), danach `/`, `/kontakt`, `/blog`, `/impressum` in Produktion öffnen, CSP-Konsole prüfen, `get_runtime_errors` der Vercel-MCP für die ersten Minuten sichten.
- [ ] **Step 5: Worktree aufräumen** (`git worktree remove`), `docs/archiv/` löschen.

---

## Self-Review

- **Spec-Abdeckung:** Phasen 0–9 des Specs → Tasks 0 (Absicherung), 1–2 (Tokens), 3 (Fundament), 4–5 (Komponenten), 6–10 (Seiten), 11–13 (Bewegung), 14 (Atmosphäre), 10/15 (Inhalt und Recht), 16 (Sicherheit), 17 (QA), 18 (Livegang). Pflichtliste Abschnitt 7: DDG/MStV → Task 10; Name → Task 10, 15; PostHog/Cookiebot dokumentiert → Task 10, 16; lokale Bündelung → Task 11, 15; Anschrift/Stand → Task 10, 17; Anrede → Global Constraints.
- **Bekannte Lücken, bewusst offen:** Handschrift-Tag (SVG), echte Galerie-Bilder, Fallstudien für ProMan/alterli/Fusca laufen als Platzhalter (Spec Abschnitt 8). Hash-basierte CSP statt `'unsafe-inline'` ist eine spätere Verschärfung.
- **Meine Entscheidungen im Plan** (Patrick bitte prüfen): Landscape-Mobil-Query in Task 1; JSON als Quelle der externen Ressourcen in Task 16; Datei `src/data/kontakt.ts` für freizugebende Texte; `SiteLayout` neben `BaseLayout` statt Umbau; Playwright Test + axe als Testrahmen.
