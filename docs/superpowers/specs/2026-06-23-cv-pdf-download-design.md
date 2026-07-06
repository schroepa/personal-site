# CV-PDF-Download — Design Spec

**Datum:** 2026-06-23
**Status:** Approved

---

## Ziel

Der bestehende „Lebenslauf ↓"-Link auf Homepage und About-Seite zeigt aktuell auf eine nicht existierende `/cv.pdf` (404). Unternehmen, die die Seite im Rahmen einer Bewerbung besuchen, sollen einen echten, herunterladbaren Lebenslauf im Design-Stil der Website bekommen — automatisch aktuell bei jedem Deploy, ohne manuellen PDF-Export.

---

## Entscheidungen

| Frage | Entscheidung |
|---|---|
| PDF-Erzeugung | Build-Time-Generierung via Playwright (nicht client-seitiger Druckdialog) |
| Seitenlänge | Flexibel, Inhalt bestimmt die Länge (erwartet: 2 Seiten) |
| Foto | Ja, `/images/portrait.webp` einbinden |
| Sektionsumfang | Alle Sektionen aus dem Original-CV übernehmen, nur im neuen Design-Stil |
| Layout | Asymmetrisches Zweispalten-Grid (Option B) |
| Kontaktdaten | Nur Stadt (Berlin) + E-Mail + Website-Link. Keine private Adresse, keine Telefonnummer |
| Sysadmin-Erwähnung | Erlaubt im CV-PDF (eigenständiges Bewerbungsdokument), NICHT auf der Website selbst |

---

## Architektur

### Build-Pipeline

1. `npm run build` läuft wie gewohnt (Astro static build → `dist/`)
2. `postbuild`-npm-Skript triggert automatisch danach: `node scripts/generate-cv-pdf.mjs`
3. Das Skript:
   - Startet einen kurzlebigen Astro-Preview-Server gegen `dist/`
   - Wartet bis der Server erreichbar ist
   - Öffnet `http://localhost:<port>/cv` per Playwright/Chromium
   - Ruft `page.emulateMedia({ media: 'print' })` auf
   - Exportiert als PDF (A4, `printBackground: true`, Margins über `@page`-CSS gesteuert statt Playwright-Optionen)
   - Schreibt die Datei nach `dist/cv.pdf`
   - Beendet den Preview-Server-Prozess
4. Vercel deployt `dist/` inklusive der frisch generierten `cv.pdf` — kein manueller Schritt nötig

### Neue Dependency

- `playwright` als devDependency (nur für den Build-Prozess relevant, kein Einfluss auf Bundle-Größe oder Live-Performance der Seite)

### Neue Dateien

| Datei | Zweck |
|---|---|
| `src/layouts/PrintLayout.astro` | Schlankes Layout ohne Nav, Cursor, Footer, Analytics — nur für den CV-Druck |
| `src/pages/cv.astro` | Die CV-Seite selbst, rendert `cvData` im Zweispalten-Grid |
| `src/data/cv.ts` | Einzige Inhaltsquelle für den CV: Profil, Kernkompetenzen, Werdegang, Projekte, Tech-Stack, Ausbildung, „Warum ich" |
| `scripts/generate-cv-pdf.mjs` | Node-Skript: Preview-Server starten, Playwright rendern, PDF exportieren, Server beenden |

### Bestehende Dateien (unverändert)

Die „Lebenslauf ↓"-Links in `src/pages/index.astro` und `src/pages/about.astro` zeigen bereits auf `/cv.pdf` — keine Änderung nötig, sobald die Datei durch den Build-Prozess real existiert.

---

## Layout: Asymmetrisches Zweispalten-Grid

Keine dunklen Flächen, keine Cards — nur eine dünne `color-mix(in oklch, var(--foreground) 12%, transparent)`-Trennlinie zwischen den Spalten, identisch zur restlichen Website-Sprache.

### Seite 1

**Linke Spalte (~30% Breite):**
- Portrait (`/images/portrait.webp`)
- Kontakt: Berlin · E-Mail · ptrckschrdtr.de · LinkedIn
- Tech-Stack-Liste (kompakt, plain text)

**Rechte Spalte (breit):**
- Name, Titel-Zeile („Senior Product Designer · Design Systems Expert · Design Engineer")
- Profil (Fließtext-Absatz, darf die Sysadmin-Vergangenheit als Stärke erwähnen)
- Kernkompetenzen (2×2 oder Liste: Design & Strategy, Design Systems, AI & Automation, Tech Stack)
- Berufliche Stationen: Zeitraum, Firma, Rolle, Achievement-Bullets — chronologisch absteigend (neueste zuerst, umgekehrt zur About-Seite die aufsteigend nach Bedeutung sortiert war — CVs lesen sich klassisch neueste-zuerst)

### Seite 2

**Linke Spalte:** identisch wiederholt (Portrait, Kontakt, Tech-Stack) — Kontaktdaten bleiben beim Blättern sichtbar

**Rechte Spalte:**
- Selected Projects (2×2-Kachelraster: AI-First Design System, Efficiency Hacking, Sales Automation, Homelab → Designstudio)
- Ausbildung & Background
- „Warum ich" (kurzer Schluss-Absatz)

---

## Datenstruktur (`src/data/cv.ts`)

```ts
export interface CvExperience {
  period: string        // "2025 — Heute"
  company: string
  role: string
  location: string
  achievements: string[]
}

export interface CvProject {
  number: string         // "01"
  category: string       // "Design System"
  title: string
  description: string
}

export interface CvData {
  name: string
  title: string
  metaLine: string        // "CV 2026 · Senior Product Designer"
  contact: {
    city: string           // "Berlin" — KEINE vollständige Adresse
    email: string
    website: string
    linkedin: string
  }
  profile: string           // Fließtext-Absatz, darf Sysadmin-Hintergrund erwähnen
  coreCompetencies: { title: string; description: string }[]
  experience: CvExperience[]   // neueste zuerst
  projects: CvProject[]
  techStack: { category: string; items: string[] }[]
  education: { title: string; description: string }[]
  whyMe: string
}
```

Inhalte werden 1:1 aus dem hochgeladenen Original-CV übernommen, mit folgenden Korrekturen:
- Zeitraum A Eins Digital Innovation: `2022 — 2025` (Tippfehler `204` im Original korrigiert)
- Kontaktdaten reduziert auf Stadt + E-Mail + Website + LinkedIn (keine Straße, keine Telefonnummer)

---

## Technische Print-Details

- **Seitenformat:** A4, `@page { size: A4; margin: 0; }` — Innenabstand wird über Padding im Layout-Container gesteuert, nicht über Playwright-Margin-Optionen (präzisere, konsistentere Kontrolle)
- **Seitenumbrüche:** Jeder Werdegang-Eintrag und jede Projekt-Kachel erhält `break-inside: avoid`, damit kein Eintrag mitten im Text auf die nächste Seite umbricht
- **SEO:** `<meta name="robots" content="noindex" />` auf `/cv.astro` — die HTML-Version soll nicht in Suchmaschinen erscheinen, nur `/cv.pdf` ist der öffentliche Download-Pfad
- **Schrift:** Gleiche Geist-Variable-Einbindung wie der Rest der Seite (über bestehenden CDN-Import in `global.css`) — funktioniert im Playwright-Kontext, da der Vercel-Build-Sandbox Internetzugriff hat
- **Farben:** Ausschließlich bestehende CSS-Variablen (`--foreground`, `--muted-foreground`, `--background`) — keine neuen Farbwerte

---

## Was sich NICHT ändert

- Die About-Seiten-Werdegang-Sektion bleibt wie sie ist (kürzere, erzählerische Version, kein Sysadmin-Erwähnung, aufsteigend sortiert)
- Keine Änderung an `BaseLayout.astro`, Navigation, oder anderen bestehenden Seiten
- Bestehende „Lebenslauf ↓"-Links brauchen keine Code-Änderung
