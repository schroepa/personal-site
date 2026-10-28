# ptrckschrdtr.de

Persönliche Website von Patrick Schrödter: Portfolio, Blog, Lebenslauf und ein kleines Tool. Statisch gebaut mit Astro, ausgeliefert über Vercel.

## Stack

- **Astro 5** (statischer Export), **TypeScript**, React 19 nur noch für das Tool `/tools/gradient-generator`.
- **Vanilla CSS auf Figma-Tokens.** Alle Werte (Farben, Größen, Abstände, Dauern) kommen aus `src/styles/tokens.css`; Einstieg ist `src/styles/neu.css`, Komponenten nutzen Astro-Scoped-Styles. Kein Tailwind, keine Utility-Klassen, kein shadcn im neuen Layer (`tests/css-hygiene.test.mjs` prüft das).
- **Kein Tailwind, kein shadcn, kein Radix** (auch nicht als Abhängigkeit; `tests/no-tailwind.test.mjs` und die CSS-Hygiene-Tests halten das fest). Der Gradient-Generator unter `/tools/gradient-generator` nutzt native Bedienelemente (`input[type=range]`, `details`/`summary`, `input[type=color]`, `select`) mit eigenem CSS in `src/components/gradient-generator.css` auf denselben Tokens; React übernimmt dort nur die Zustandslogik (Presets, Regler, PNG-Export). Ohne JavaScript zeigt die Seite einen Hinweis statt des Werkzeugs.
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
| `npm run headers` | `src/data/externe-ressourcen.json` → `vercel.json` (Sicherheits-Header, CSP); `-- --check` prüft nur |
| `npm run test:scripts` | `node:test`: Skripte, `src/lib/**`, `tests/*.test.mjs` (Token-Export, Daten, Rechtstexte, CSS-Hygiene, Namens-Test, Typecheck der neuen Dateien) |
| `npm run test:e2e` / `npx playwright test` | E2E und axe-Prüfungen in drei Breiten (1440, 768, 390), dazu das Projekt `csp` gegen `dist/` |
| `npm test` | beides nacheinander |
| `npm run typecheck` | `astro check` |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (ts, tsx, astro) |

### Playwright

Der Dev-Server der Tests läuft auf **Port 4322** (`playwright.config.ts`) und wird wiederverwendet, wenn dort schon einer läuft. Läuft auf 4322 etwas anderes, schlagen die Tests mit irreführenden Fehlern fehl: vorher `lsof -nP -iTCP:4322 -sTCP:LISTEN` prüfen. Die Tests, die `dist/` brauchen (`tests/build-hosts.test.mjs`, `tests/build-csp.test.mjs`, Fremdhost-Prüfung in `rechtliches.spec.ts`, Projekt `csp`), laufen erst nach `npm run build`; in CI ist ein fehlendes `dist/` ein Fehler, lokal werden sie übersprungen. Sie schützen nur, wenn CI vorher baut. Das Projekt `csp` startet zusätzlich `tests/helpers/serve-dist.mjs` auf **Port 4323** (siehe „Sicherheits-Header & CSP“).

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
- `src/layouts/`: `SiteLayout` (Basis, auch für das Tool), `ArtikelLayout`, `ProjektLayout`
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

Statischer Export (`output: 'static'` in `astro.config.mjs`), kanonische Domain als `site` gesetzt. Externe Hosts nur Cookiebot und PostHog; PostHog lädt erst nach Einwilligung in die Kategorie Statistik (`src/scripts/posthog-skript.ts`, ausgeliefert als `/js/posthog.js`). Das technische Datenschutz-Inventar steht in `docs/dsgvo-inventory.md`.

## Sicherheits-Header & CSP

**Wo:** `vercel.json` (eingecheckt, **generiert**, nicht von Hand ändern). Quelle der externen Hosts ist allein `src/data/externe-ressourcen.json`: je Host Name, Zweck, Einwilligung und das Feld `csp` (welche Direktiven er braucht). Daraus entstehen der Abschnitt „Externe Ressourcen“ der Datenschutzerklärung (`src/data/rechtliches.ts`) und die CSP (`scripts/build-vercel-headers.mjs`). Neuer Host oder neue Direktive: JSON ändern, `npm run headers`, committen. `scripts/build-vercel-headers.test.mjs` schlägt fehl, wenn `vercel.json` nicht zur Ausgabe des Generators passt.

**Header für alle Pfade:** `Content-Security-Policy` (erzwingend), `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`, `Permissions-Policy` (Kamera, Mikrofon, Standort, Zahlung, USB und weitere ungenutzte Funktionen aus). `Cache-Control: public, max-age=31536000, immutable` nur für `/_astro/*` (Dateinamen mit Inhalts-Hash); `/fonts/*` hat feste Namen und bekommt deshalb nur `max-age=86400, stale-while-revalidate=604800`. HTML und `/js/*` behalten Vercels Standard (immer neu prüfen). URL-Verhalten bleibt Vercel-Standard (kein `cleanUrls`, kein `trailingSlash`): `/blog` und `/blog/` liefern dieselbe Seite wie bisher.

**Keine Inline-Skripte:** `script-src` erlaubt nur `'self'` und die Cookiebot- und PostHog-Hosts, ohne `'unsafe-inline'`, `'unsafe-eval'`, Hash oder Nonce. Deshalb liegen das Kopf-Skript (Theme vor dem ersten Paint, `data-js`, Bewegungs-Gate mit Watchdog; `src/scripts/kopf-skript.ts` → `/js/kopf.js`, blockierend im `<head>`) und das PostHog-Snippet (`src/scripts/posthog-skript.ts` → `/js/posthog.js`) als Dateien vor, und der Gradient-Generator wird ohne Astro-Insel hydriert (`src/scripts/gradient-generator-start.ts`), weil Inseln Inline-Skripte mitbringen. Also kein `client:*`, keine `onclick`-Attribute und kein ausführbares `<script is:inline>` (auch nicht per `set:html`): `tests/build-csp.test.mjs` prüft das im Build. JSON in `<script type="application/json">` bzw. `application/ld+json` ist erlaubt (wird nicht ausgeführt).

**Styles:** `style-src 'self' 'unsafe-inline'`. Cookiebot fügt `<style>`-Elemente ohne Nonce ein (die Cookiebot-CSP-Doku verlangt genau das), die Seite selbst nutzt `style`-Attribute (z. B. `view-transition-name`, Papierkorn, Generator) und Astro bettet kleine CSS-Dateien inline ein.

**Prüfen:**

```sh
npm run build                              # dist/ muss frisch sein
npx playwright test --project=csp          # startet tests/helpers/serve-dist.mjs (Port 4323) mit den Headern aus vercel.json
node tests/helpers/serve-dist.mjs          # dasselbe von Hand: http://127.0.0.1:4323
```

`tests/e2e/csp.spec.ts` lädt jede Route in hell und dunkel und verlangt null CSP-Verletzungen und null Konsolenfehler, prüft PostHog mit und ohne Einwilligung, Lichtband, PNG-Export, Suche, Gate und Watchdog sowie Gegenproben (Inline-Skript, Handler, `eval`, fremdes Skript, Einbetten in einen Rahmen werden blockiert). Cookiebot und PostHog werden dabei **nie** echt geladen: `uc.js` ist ein Nachbau, alle PostHog-Endpunkte sind gestubbt, unbekannte Hosts werden abgebrochen.

**Vor dem Livegang auf der Vercel-Preview von Hand prüfen** `[[PRÜFEN]]` (offline nicht belegbar): echtes Cookiebot-Banner erscheint, Akzeptieren und Ablehnen funktionieren, „Cookie-Einstellungen“ öffnet es wieder; nach Zustimmung lädt PostHog (Netzwerk-Tab: nur `eu.i.posthog.com` und `eu-assets.i.posthog.com`); in der Konsole keine Meldung „Refused to …“ bzw. „Content Security Policy“; Antwort-Header per `curl -sI https://<preview>/` und auf `/_astro/…`, `/cv.pdf`, einer 404. Lädt Cookiebot Dateien von einem weiteren Host (z. B. Zusatzfunktionen aus dem Cookiebot-Konto), ihn mit Beleg in die JSON eintragen. `imgsct.cookiebot.com` steht nur laut Cookiebot-Doku drin; taucht er auf der Preview nie auf, kann er wieder raus. PostHog-Sitzungsaufzeichnung und Toolbar sind durch die CSP ausgeschlossen (bräuchten `blob:`-Worker bzw. `eu.posthog.com`).

**Bekannte Grenze (PostHog-Config als Skript):** Host-Allowlists erlauben jedes Skript dieser Hosts, also auch das, was ein beliebiges PostHog-Projekt unter `https://eu-assets.i.posthog.com/array/<token>/config.js` ausliefert. Ein Angreifer mit eigenem PostHog-Projekt könnte darüber Code nachladen, **wenn** er HTML in die Seite einschleusen könnte. Auf dieser statischen Seite ohne Nutzereingaben im HTML ist das ein geringes Risiko; enger ginge es nur mit Nonce/`strict-dynamic` (braucht eine Edge-Funktion) oder mit selbst ausgelieferter PostHog-Bibliothek.

**Zusätzlich auf der Preview prüfen:** `/cv.pdf` in Chrome, Firefox und Safari öffnen (die CSP inklusive `object-src 'none'` gilt auch für die PDF-Antwort; bricht ein eingebauter Viewer, `/cv.pdf` in `scripts/build-vercel-headers.mjs` von der CSP ausnehmen); Umleitung Apex → `www` und die Header der automatisch ausgelieferten 404-Seite; `curl -sI https://ptrckschrdtr.de/` und `curl -sI https://www.ptrckschrdtr.de/` auf HSTS mit `includeSubDomains` (gilt dann für alle Subdomains, auch solche ohne HTTPS).

**Warum keine Hashes:** Astro 5.18 kann Inline-Skripte über `experimental.csp` per Hash freigeben (CSP als `<meta>`). Wir verzichten bewusst darauf: null Inline-Skripte sind strenger, unabhängig von Astro-Version und experimentellem Feature, und die CSP bleibt ein Header (eine `<meta>`-CSP kann kein `frame-ancestors`).

**HSTS-Preload:** bewusst **nicht** gesetzt. `preload` plus Eintrag auf hstspreload.org bindet die Domain samt aller Subdomains dauerhaft an HTTPS (Rücknahme dauert Monate). Wer das will: in `scripts/build-vercel-headers.mjs` (`HSTS`) `; preload` ergänzen, `npm run headers`, dann eintragen.

