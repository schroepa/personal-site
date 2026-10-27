# ptrckschrdtr.de

Persönliche Website von Patrick Schrödter: Portfolio, Blog, Lebenslauf und ein kleines Tool. Statisch gebaut mit Astro, ausgeliefert über Vercel.

## Stack

- **Astro 5** (statischer Export), **TypeScript**, React 19 nur noch für das Tool `/tools/gradient-generator`.
- **Vanilla CSS auf Figma-Tokens.** Alle Werte (Farben, Größen, Abstände, Dauern) kommen aus `src/styles/tokens.css`; Einstieg ist `src/styles/neu.css`, Komponenten nutzen Astro-Scoped-Styles. Kein Tailwind, keine Utility-Klassen, kein shadcn im neuen Layer (`tests/css-hygiene.test.mjs` prüft das).
- **Übergangsstand:** Tailwind 4, shadcn/Radix und die Legacy-Styles (`global.css`, `typography.css`, `animations.css`, `fonts.css`) sind noch im Repo, weil nur das Tool `gradient-generator` (`ToolLayout`, `GradientGenerator.tsx`, `src/components/ui/`) und die Seiten unter `og-render/` sie nutzen. Task 15b stellt beides auf Tokens um und entfernt Tailwind und shadcn.
- Bewegung mit `motion` und `lenis`, Schrift Geist (lokal), Lichtband als eigener WebGL-Shader (`src/scripts/lichtband.ts`).
- Tests: Playwright (E2E, axe) und `node:test`.

## Entwicklung

```bash
npm install      # installiert auch Chromium für Playwright und kopiert die Schriften
npm run dev
```

## Scripts

| Befehl | Beschreibung |
|---|---|
| `npm run dev` | Entwicklungsserver mit Hot Reload |
| `npm run build` | Produktions-Build nach `dist/` (siehe unten: `prebuild`, `postbuild`) |
| `npm run preview` | Lokale Vorschau des Builds |
| `npm run tokens` | Figma → `src/styles/tokens.css` (liest `design/figma-variables.json`; Herkunft und Aktualisierung in `design/README.md`) |
| `npm run test:scripts` | `node:test`: Skripte, `src/lib/**`, `tests/*.test.mjs` (Token-Export, Daten, Rechtstexte, CSS-Hygiene, Namens-Test, Typecheck der neuen Dateien) |
| `npm run test:e2e` / `npx playwright test` | E2E und axe-Prüfungen in drei Breiten (1440, 768, 390) |
| `npm test` | beides nacheinander |
| `npm run typecheck` | `astro check` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (ts, tsx, astro) |

### Playwright

Der Dev-Server der Tests läuft auf **Port 4322** (`playwright.config.ts`) und wird wiederverwendet, wenn dort schon einer läuft. Läuft auf 4322 etwas anderes, schlagen die Tests mit irreführenden Fehlern fehl: vorher `lsof -nP -iTCP:4322 -sTCP:LISTEN` prüfen. Die Tests, die `dist/` brauchen (`tests/build-hosts.test.mjs`, Fremdhost-Prüfung in `rechtliches.spec.ts`), laufen erst nach `npm run build`; in CI ist ein fehlendes `dist/` ein Fehler, lokal werden sie übersprungen.

Axe-Prüfungen auf animierten Seiten rufen vorher `warteAufRuhe(page)` (`tests/helpers.ts`) auf: sie warten, bis keine Animation mehr läuft und alle Einstiegs-Elemente im Auslösebereich `data-anim-fertig` tragen. Elemente werden nie vom Scan ausgenommen.

## Build

`npm run build` führt drei Schritte aus:

1. `prebuild`: `scripts/copy-fonts.mjs` kopiert Geist und Geist Mono aus `@fontsource/*` nach `public/fonts/`.
2. `astro build` nach `dist/`.
3. `postbuild`: `scripts/generate-cv-pdf.mjs` rendert `/cv` mit dem Print-Stylesheet (`src/styles/neu-print.css`) zu `dist/cv.pdf`; `scripts/generate-og-images.mjs` rendert die Seiten unter `/og-render/` zu den Vorschaubildern in `dist/images/og/`. Beide starten kurz einen Astro-Server und Chromium (auf Vercel `@sparticuz/chromium`).

Die Seiten unter `/og-render/` und `/prototypes/` sind `noindex` und stehen nicht in der Sitemap.

Hängt der Build, helfen frische Caches: `rm -rf dist .astro node_modules/.vite && npm install && npm run build`.

## Inhalte

Routen entstehen aus den Dateinamen (ohne `.md`): `mein-beitrag.md` wird zu `/blog/mein-beitrag`. Das Schema steht in `src/content/config.ts`.

**Blog** (`src/content/blog/*.md`): `title`, `description`, `date`, `tags` (optional), `coverImage` (optional), `draft: true` blendet den Beitrag aus (Liste, Sitemap, `llms.txt`). Lesezeit wird aus dem Text berechnet (`src/lib/reading-time.ts`).

**Projekte** (`src/content/projects/*.md`): `title`, `description`, `date`, `tags` (Achtung: `tags[0]` ist das Label der Karte und des Seitenkopfs), `coverImage`, `url`, `repo`, `featured` sowie die Felder des neuen Designs:

| Feld | Bedeutung |
|---|---|
| `wirkung` | Wirkungszeile der Karte, ein Satz (fehlt sie, gilt der erste Satz der Beschreibung) |
| `format` | Seitenverhältnis des Bildes in der Karte: `16x10` (Standard), `4x5`, `1x1` |
| `fakten` | genau drei Einträge `{ label, wert }` (Rolle, Jahr, Stack); macht das Projekt zur **Fallstudie** |
| `kennzahlen` | Liste `{ wert, label }` im Abschnitt „Ergebnis“ |
| `weitere` | `true`: erscheint in der Liste „Weitere Projekte“ statt im Bento „Ausgewählt“ |

**Regeln für Fallstudien** (Projekte mit `fakten`, geprüft beim Build durch `src/lib/fallstudie.ts`): Die ersten fünf `##`-Überschriften sind genau **Ausgangslage, Ansatz, Einblicke, Entscheidungen, Ergebnis**, in dieser Reihenfolge und ohne Einschub. Weitere `##`-Überschriften sind nur nach „Ergebnis“ erlaubt (ein Anhang). Fehlt ein Abschnitt oder stimmt die Reihenfolge nicht, bricht der Build mit einer Meldung ab. Die Vorlage ist Tintfield.

### Datendateien (`src/data/`)

Texte und Listen, die keine Markdown-Inhalte sind:

| Datei | Inhalt |
|---|---|
| `cv.ts` | Lebenslauf (`/cv`, PDF) |
| `ueber-mich.ts` | Texte von `/about` |
| `kontakt.ts` | Kontaktdaten, Texte „Wofür“ und „Ablauf“ |
| `digital-art.ts` | Kapitel und Bilder der Galerie |
| `liste.ts` | Typ der NummernListe |
| `rechtliches.ts` | Impressum, Datenschutzerklärung, Liste „Externe Ressourcen“ |

### Rechtstexte

Alles Rechtliche liegt in `src/data/rechtliches.ts` (nicht in den `.astro`-Dateien). Offene Stellen stehen als Marker `[[…]]` im Text: `[[ANSCHRIFT]]`, `[[STAND]]` und `[[PRÜFEN: …]]`. `offeneStellen()` listet sie; der Test „kein [[…]] mehr“ in `tests/e2e/rechtliches.spec.ts` ist bis zum Livegang `test.fixme`. Das ist keine Rechtsberatung, die Texte lässt Patrick prüfen. Der Name schreibt sich **Schrödter**; `tests/name.test.mjs` schlägt bei der alten Schreibweise (ohne „t“) außerhalb einer kleinen Ausnahmeliste an.

## Aufbau

- `src/pages/`: Routen (`blog/[slug].astro`, `projects/[slug].astro`, `llms*.txt.ts`, `tools/`, `prototypes/` für Bausteinseiten, `og-render/`)
- `src/layouts/`: `SiteLayout` (Basis), `ArtikelLayout`, `ProjektLayout`; `ToolLayout` nur für das Tool (bis 15b)
- `src/components/site/`: die Bausteine des neuen Designs (Seitenkopf, Abschnitt, Knopf, Projektkarte, Galerie-Akkordeon, Schriftfeld, …)
- `src/scripts/`: kleine Skripte je Komponente (`schriftfeld.ts`, `suche.ts`, `filter.ts`, …) und die Bewegung
- `src/lib/`: reine Funktionen mit `node:test` (Blog, Projekte, Filter, Fallstudie, JSON-LD, …)
- `src/styles/`: `tokens.css` (generiert, nicht von Hand ändern), `neu.css` (Einstieg), `neu-*.css`
- `design/`: Figma-Dump der Variablen. `docs/superpowers/`: Spec und Plan des Redesigns

### Bewegung

Architektur in vier Schichten, alle Werte aus den Figma-Tokens (Motion-Collection, Modi „Standard“ und „Reduziert“):

1. **Tokens** (`tokens.css`, `--motion-*`): Dauern, Easings, Verzögerungen.
2. **Leser** (`src/scripts/motion/tokens.ts`, `parse.mjs`, `formen.ts`): lesen die Tokens per `getComputedStyle`; ein fehlendes Token wirft mit seinem Namen. Verhaltenswerte, die nicht in Figma stehen, sind benannte Konstanten in `formen.ts`.
3. **Module** (ein Modul je Animation, z. B. `hero-woerter.ts`, `labels.ts`, `magnet.ts`, `akkordeon.ts`): Hilfen in `einmal.ts` (`revealOnce`, Start- und Endzustand über `data-anim` / `data-anim-fertig`).
4. **Registry** (`src/scripts/motion/index.ts`): Liste `MODULES`, jedes Modul einzeln abgesichert; `gate.ts` öffnet `html[data-motion]`, auch wenn ein Modul scheitert (Watchdog).

Ohne JavaScript sind alle Inhalte sichtbar (Startzustände setzt erst `html[data-motion]`). Bei `prefers-reduced-motion` gilt der Modus „Reduziert“: alle Dauern 0, kein Lenis, Endzustand sofort. Zeiger-Effekte nur bei `pointer: fine`.

## Go-live

Bevor die Seite auf `main` geht, gilt die Checkliste in `docs/superpowers/specs/2026-10-27-redesign-design.md`, Abschnitt 7 „Vor dem Livegang“ (Impressum nach § 5 DDG und § 18 Abs. 2 MStV, Name, Cookiebot und PostHog, Anschrift und Stand, Anrede). Vercel baut jeden Push auf `main` automatisch; Branch-Pushes erzeugen nur Previews.

## Deployment

Statischer Export (`output: 'static'` in `astro.config.mjs`), kanonische Domain als `site` gesetzt. Externe Hosts nur Cookiebot und PostHog; PostHog lädt erst nach Einwilligung in die Kategorie Statistik (`src/components/posthog.astro`). Das technische Datenschutz-Inventar steht in `docs/dsgvo-inventory.md`.
