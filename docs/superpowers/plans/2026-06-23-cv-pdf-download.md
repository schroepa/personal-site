# CV-PDF-Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Einen echten, herunterladbaren CV im Design-Stil der Website unter `/cv.pdf` bereitstellen — automatisch bei jedem Build neu generiert, sodass die bestehenden „Lebenslauf ↓"-Links nicht mehr ins Leere laufen.

**Architecture:** Eine neue Astro-Seite (`src/pages/cv.astro`) rendert den CV als Zweispalten-Grid-Layout, gespeist aus einer zentralen Datenstruktur (`src/data/cv.ts`). Ein Node-Skript (`scripts/generate-cv-pdf.mjs`) startet nach jedem `npm run build` automatisch (via `postbuild`-Hook) einen kurzlebigen Astro-Preview-Server, rendert die Seite per Playwright/Chromium zu PDF und schreibt das Ergebnis nach `dist/cv.pdf`.

**Tech Stack:** Astro (Static Output), Playwright (Build-Time-PDF-Export), bestehende CSS Custom Properties aus `global.css`/`typography.css`.

---

## Dateistruktur

| Aktion | Datei | Zweck |
|---|---|---|
| Create | `src/data/cv.ts` | Zentrale CV-Inhaltsdaten (TypeScript, typisiert) |
| Create | `src/layouts/PrintLayout.astro` | Minimales Layout ohne Nav/Cursor/Footer/Analytics |
| Create | `src/pages/cv.astro` | Die CV-Seite (Zweispalten-Grid, Druck-CSS) |
| Create | `scripts/generate-cv-pdf.mjs` | Playwright-Skript: Preview-Server → PDF-Export |
| Modify | `package.json` | `playwright`-devDependency + `postbuild`-Skript |

---

### Task 1: CV-Datenstruktur erstellen

**Files:**
- Create: `src/data/cv.ts`

- [ ] **Schritt 1: Datei mit vollständigem Inhalt anlegen**

  ```typescript
  export interface CvExperience {
    period: string
    company: string
    role: string
    location: string
    achievements: string[]
  }

  export interface CvProject {
    number: string
    category: string
    title: string
    description: string
  }

  export interface CvCompetency {
    title: string
    description: string
  }

  export interface CvTechStackGroup {
    category: string
    items: string[]
  }

  export interface CvEducationEntry {
    title: string
    description: string
  }

  export interface CvLanguage {
    name: string
    level: number // 1-5
  }

  export interface CvData {
    name: string
    title: string
    metaLine: string
    contact: {
      city: string
      email: string
      website: string
      linkedin: string
      linkedinDisplay: string
    }
    languages: CvLanguage[]
    profile: string
    coreCompetencies: CvCompetency[]
    experience: CvExperience[]
    projects: CvProject[]
    techStack: CvTechStackGroup[]
    education: CvEducationEntry[]
    whyMe: string
  }

  export const cvData: CvData = {
    name: 'Patrick Schrödter',
    title: 'Senior Product Designer · Design Systems Expert · Design Engineer',
    metaLine: 'CV 2026 · Senior Product Designer',
    contact: {
      city: 'Berlin',
      email: 'schroepa1981@icloud.com',
      website: 'ptrckschrdtr.de',
      linkedin: 'https://www.linkedin.com/in/patrick-schr%C3%B6dter-085330119/',
      linkedinDisplay: 'linkedin.com/in/patrick-schroedter',
    },
    languages: [
      { name: 'Deutsch', level: 5 },
      { name: 'Englisch', level: 4 },
    ],
    profile:
      'Pragmatischer Product Design Lead mit über 15 Jahren Erfahrung an der Schnittstelle von Design und Engineering. Spezialisiert auf 0-to-1 Product Development, skalierbare Design-Systeme und AI-augmented Workflows. Als ehemaliger Systemadministrator entwickle ich Interfaces mit tiefem Verständnis für technische Machbarkeit und sauberen Code-Strukturen.',
    coreCompetencies: [
      {
        title: 'Design & Strategy',
        description: 'Product Design Lead, UI/UX, Rapid Prototyping, Brand Evolution, User Research.',
      },
      {
        title: 'Design Systems',
        description: 'Modulare Systeme als Single Source of Truth. shadcn/ui & Tailwind CSS in Production.',
      },
      {
        title: 'AI & Automation',
        description: 'Claude/Gemini CLI Integration, n8n Automation, Prompt Engineering für UI-Development.',
      },
      {
        title: 'Tech Stack',
        description: 'Figma (Expert), Git, HTML/CSS/JS, Proxmox, Docker, Laravel (Background).',
      },
    ],
    experience: [
      {
        period: '2025 — Heute',
        company: 'Freelance — SWT Stadtwerke Trier & Sander Gruppe',
        role: 'Product Design Lead · UI/UX & Digital Transformation',
        location: 'Berlin / Remote',
        achievements: [
          'Konzeption und Design eines interaktiven Solar-Beratungstools mit Live-Bedarfsermittlung und 10-Jahres-Planungssicherheit für Sales-Teams.',
          'Digitalisierung des B2B-Vertriebs: Ablösung von PowerPoint-Präsentationen durch ein dynamisches, Figma-basiertes Slide-System mit granularen Zugriffsrechten.',
          'Redesign der Corporate-Website auf modernem Astro-Frontend mit Grav-CMS-Anbindung.',
        ],
      },
      {
        period: '2022 — 2025',
        company: 'A Eins Digital Innovation',
        role: 'UX/UI Designer (Lead)',
        location: 'Wittlich',
        achievements: [
          'Konzeption und Design von Portazon — der ersten deutschsprachigen Super-App.',
          'Integration diverser Drittanbieter-Services in eine konsistente, holistische User Experience.',
          'Verantwortung für die visuelle Skalierbarkeit des gesamten digitalen Ökosystems.',
        ],
      },
      {
        period: '2019 — 2022',
        company: 'Oetker Digital',
        role: 'UX/UI Designer, Embedded in Dev-Team',
        location: 'Berlin',
        achievements: [
          'Explizites Staffing innerhalb eines Engineering-Teams zur Schließung der Lücke zwischen Design und Code.',
          'Validierung komplexer technischer Anforderungen durch funktionale Mockups.',
          'Optimierung des Handoff-Prozesses durch technische Dokumentation und Komponenten-Logik.',
        ],
      },
      {
        period: '2012 — 2019',
        company: 'DefShop',
        role: 'Senior UI/UX Designer (Lead)',
        location: 'Berlin',
        achievements: [
          'Gesamtverantwortung für drei umfangreiche Redesigns der E-Commerce-Plattform.',
          'Lead-Design für zwei native Apps (iOS & Android).',
          'Einführung und Pflege eines systemischen Design-Ansatzes zur Beschleunigung der Development-Zyklen.',
        ],
      },
    ],
    projects: [
      {
        number: '01',
        category: 'Design System',
        title: 'AI-First Design System',
        description:
          'Hybrides System auf Basis von shadcn/ui. Design-Tokens werden via KI-Workflows direkt in Tailwind-Code übersetzt — Figma und Repo bleiben synchron.',
      },
      {
        number: '02',
        category: 'Automation',
        title: 'Efficiency Hacking',
        description:
          'Asset-Management und Design-Audits automatisiert über n8n und Custom-LLM-Schnittstellen per CLI. Weniger Toil, mehr Craft.',
      },
      {
        number: '03',
        category: 'Digitalisierung',
        title: 'Project: Sales Automation',
        description:
          'Vom komplexen Excel-Sheet zum interaktiven Beratungs-Tool. UI-gestützte Solar-Planung für Endkunden.',
      },
      {
        number: '04',
        category: 'Ops',
        title: 'Homelab → Designstudio',
        description:
          'Eigener Proxmox/Docker-Stack als Sandbox für Agentic Workflows. Sysadmin-Hintergrund als designerische Superpower.',
      },
    ],
    techStack: [
      { category: 'Design', items: ['Figma Expert', 'Adobe Creative Suite', 'Affinity'] },
      { category: 'Code / Logik', items: ['HTML/CSS/JS', 'TailwindCSS', 'shadcn/ui', 'React Verständnis', 'Git', 'Astro'] },
      { category: 'AI / Ops', items: ['Claude CLI', 'Gemini CLI', 'n8n', 'Docker', 'Directus', 'Shopify', 'WordPress'] },
      { category: 'Methodik', items: ['Agile / Scrum', 'Lean Startup', '0-to-1 Product Ownership'] },
    ],
    education: [
      {
        title: 'Hintergrund',
        description:
          'Langjährige Erfahrung in Design & Webentwicklung. Hands-on nerdness als Basis für technische Empathie im Design.',
      },
      {
        title: 'Weiterbildung',
        description:
          'Kontinuierliche Forschung zu Generative Design & Agentic Workflows. Work in public, ship in public.',
      },
    ],
    whyMe:
      'Ich bin kein Pixel-Schieber. Ich baue Werkzeuge, Systeme und Produkte. Ich liebe die Geschwindigkeit von Startups und verstehe Design als Prozess der Optimierung — technologisch wie visuell. Als Designer in Founding-Teams bringe ich die Erfahrung mit, um Strukturen zu schaffen, und die Leidenschaft, um selbst im Code mit anzupacken.',
  }
  ```

- [ ] **Schritt 2: TypeScript-Check ausführen**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr && npx tsc --noEmit src/data/cv.ts --skipLibCheck --esModuleInterop 2>&1 | head -20
  ```

  Erwartetes Ergebnis: Keine Fehler (oder nur Modul-Auflösungshinweise, die für isolierte `tsc`-Aufrufe außerhalb des Astro-Kontexts normal sind — der eigentliche Typcheck erfolgt in Task 3 über `astro check`).

- [ ] **Schritt 3: Commit**

  ```bash
  git add src/data/cv.ts
  git commit -m "feat: CV-Datenstruktur mit vollständigen Lebenslauf-Inhalten"
  ```

---

### Task 2: Minimales Print-Layout erstellen

**Files:**
- Create: `src/layouts/PrintLayout.astro`

**Kontext:** Die bestehende `ToolLayout.astro` (siehe `src/layouts/ToolLayout.astro`) ist die schlankste vorhandene Layout-Variante, enthält aber noch `CustomCursor` und `ViewTransitions`. Für den CV-Druck brauchen wir noch weniger — keine Interaktivität, kein Cursor, keine Transitions, dafür `noindex` damit die HTML-Version nicht in Suchmaschinen landet.

- [ ] **Schritt 1: Datei erstellen**

  ```astro
  ---
  import "@/styles/global.css"
  import "@/styles/typography.css"

  interface Props {
    title?: string
    description?: string
  }

  const {
    title = "CV — Patrick Schröder",
    description = "Lebenslauf von Patrick Schröder, Senior Product Designer.",
  } = Astro.props
  ---

  <!doctype html>
  <html lang="de">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content={description} />
      <meta name="robots" content="noindex, nofollow" />
      <meta name="generator" content={Astro.generator} />
      <title>{title}</title>
    </head>
    <body class="bg-background text-foreground antialiased">
      <slot />
    </body>
  </html>
  ```

- [ ] **Schritt 2: Build-Check**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr && npx astro check 2>&1 | tail -20
  ```

  Erwartetes Ergebnis: Keine neuen Fehler durch `PrintLayout.astro` (die Datei wird noch von niemandem importiert, daher nur Syntax-relevant).

- [ ] **Schritt 3: Commit**

  ```bash
  git add src/layouts/PrintLayout.astro
  git commit -m "feat: PrintLayout — minimales Layout ohne Nav/Cursor/Analytics für CV-Druck"
  ```

---

### Task 3: CV-Seite mit Zweispalten-Grid-Layout

**Files:**
- Create: `src/pages/cv.astro`

**Kontext:** Layout-Entscheidung aus der Spec (`docs/superpowers/specs/2026-06-23-cv-pdf-download-design.md`): asymmetrisches Zweispalten-Grid, linke Spalte (~30%) mit Portrait/Kontakt/Sprachen/Tech-Stack wiederholt sich auf Seite 2, rechte Spalte enthält den Hauptinhalt. Trennlinie zwischen den Spalten: `color-mix(in oklch, var(--foreground) 12%, transparent)` — exakt der Wert, der bereits überall auf der Website für Trennlinien verwendet wird (siehe z. B. `src/pages/projects/index.astro`).

- [ ] **Schritt 1: Datei mit vollständigem Inhalt erstellen**

  ```astro
  ---
  import PrintLayout from '@/layouts/PrintLayout.astro'
  import { cvData } from '@/data/cv'
  ---

  <PrintLayout title="CV — Patrick Schröder" description="Lebenslauf von Patrick Schröder, Senior Product Designer & Design Engineer.">
    <div class="cv-page">

      <!-- ── Seite 1 ──────────────────────────────────────────────────── -->
      <div class="cv-sheet">
        <aside class="cv-sidebar">
          <img
            src="/images/portrait.webp"
            alt=""
            class="cv-portrait"
            decoding="async"
          />

          <div class="cv-sidebar-block">
            <span class="cv-label">Kontakt</span>
            <p class="cv-sidebar-text">
              {cvData.contact.city}<br />
              {cvData.contact.email}<br />
              {cvData.contact.website}<br />
              {cvData.contact.linkedinDisplay}
            </p>
          </div>

          <div class="cv-sidebar-block">
            <span class="cv-label">Sprachen</span>
            <ul class="cv-lang-list">
              {cvData.languages.map((lang) => (
                <li>
                  <span>{lang.name}</span>
                  <span class="cv-dots" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span class:list={['cv-dot', i < lang.level && 'cv-dot--filled']}></span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div class="cv-sidebar-block">
            <span class="cv-label">Tech-Stack</span>
            {cvData.techStack.map((group) => (
              <p class="cv-sidebar-text">
                <strong>{group.category}:</strong> {group.items.join(', ')}
              </p>
            ))}
          </div>
        </aside>

        <main class="cv-main">
          <span class="cv-meta">{cvData.metaLine}</span>
          <h1 class="cv-name">{cvData.name}</h1>
          <p class="cv-title">{cvData.title}</p>

          <section class="cv-section">
            <span class="cv-label">Profil</span>
            <p class="cv-body-text">{cvData.profile}</p>
          </section>

          <section class="cv-section">
            <span class="cv-label">Kernkompetenzen</span>
            <div class="cv-competency-grid">
              {cvData.coreCompetencies.map((c) => (
                <div class="cv-competency">
                  <strong class="cv-competency-title">{c.title}</strong>
                  <p class="cv-competency-desc">{c.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section class="cv-section">
            <span class="cv-label">Berufliche Stationen</span>
            {cvData.experience.map((exp) => (
              <div class="cv-experience">
                <div class="cv-experience-head">
                  <span class="cv-experience-period">{exp.period}</span>
                  <span class="cv-experience-company">{exp.company}</span>
                </div>
                <span class="cv-experience-role">{exp.role} · {exp.location}</span>
                <ul class="cv-achievements">
                  {exp.achievements.map((a) => <li>{a}</li>)}
                </ul>
              </div>
            ))}
          </section>
        </main>
      </div>

      <!-- ── Seite 2 ──────────────────────────────────────────────────── -->
      <div class="cv-sheet cv-sheet--page2">
        <aside class="cv-sidebar">
          <img
            src="/images/portrait.webp"
            alt=""
            class="cv-portrait"
            decoding="async"
          />

          <div class="cv-sidebar-block">
            <span class="cv-label">Kontakt</span>
            <p class="cv-sidebar-text">
              {cvData.contact.city}<br />
              {cvData.contact.email}<br />
              {cvData.contact.website}<br />
              {cvData.contact.linkedinDisplay}
            </p>
          </div>

          <div class="cv-sidebar-block">
            <span class="cv-label">Tech-Stack</span>
            {cvData.techStack.map((group) => (
              <p class="cv-sidebar-text">
                <strong>{group.category}:</strong> {group.items.join(', ')}
              </p>
            ))}
          </div>
        </aside>

        <main class="cv-main">
          <section class="cv-section">
            <span class="cv-label">Selected Projects</span>
            <div class="cv-project-grid">
              {cvData.projects.map((p) => (
                <div class="cv-project">
                  <span class="cv-project-meta">{p.number} · {p.category}</span>
                  <strong class="cv-project-title">{p.title}</strong>
                  <p class="cv-project-desc">{p.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section class="cv-section">
            <span class="cv-label">Ausbildung &amp; Background</span>
            <div class="cv-competency-grid">
              {cvData.education.map((e) => (
                <div class="cv-competency">
                  <strong class="cv-competency-title">{e.title}</strong>
                  <p class="cv-competency-desc">{e.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section class="cv-section">
            <span class="cv-label">Warum ich?</span>
            <p class="cv-body-text">{cvData.whyMe}</p>
          </section>
        </main>
      </div>

    </div>
  </PrintLayout>

  <style>
    /* ── A4-Seiten ────────────────────────────────────────────────────── */
    @page {
      size: A4;
      margin: 0;
    }

    .cv-page {
      display: flex;
      flex-direction: column;
    }

    .cv-sheet {
      display: grid;
      grid-template-columns: 210px 1fr;
      gap: 32px;
      width: 210mm;
      min-height: 297mm;
      padding: 20mm 16mm;
      box-sizing: border-box;
      break-after: page;
    }

    .cv-sheet--page2 {
      break-after: auto;
    }

    /* ── Sidebar ──────────────────────────────────────────────────────── */
    .cv-sidebar {
      border-right: 1px solid color-mix(in oklch, var(--foreground) 12%, transparent);
      padding-right: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .cv-portrait {
      width: 100%;
      aspect-ratio: 3 / 4;
      object-fit: cover;
      object-position: center top;
      display: block;
    }

    .cv-sidebar-block {
      display: flex;
      flex-direction: column;
      gap: 6px;
      break-inside: avoid;
    }

    .cv-sidebar-text {
      font-size: 9px;
      line-height: var(--leading-normal);
      color: var(--muted-foreground);
      margin: 0;
    }

    .cv-sidebar-text strong {
      color: var(--foreground);
      font-weight: 500;
    }

    .cv-lang-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .cv-lang-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9px;
      color: var(--foreground);
    }

    .cv-dots {
      display: inline-flex;
      gap: 3px;
    }

    .cv-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: color-mix(in oklch, var(--foreground) 15%, transparent);
      display: inline-block;
    }

    .cv-dot--filled {
      background: var(--foreground);
    }

    /* ── Hauptspalte ──────────────────────────────────────────────────── */
    .cv-main {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .cv-meta {
      font-size: 8px;
      letter-spacing: var(--tracking-wide);
      text-transform: uppercase;
      color: var(--muted-foreground);
    }

    .cv-name {
      font-size: 26px;
      font-weight: 500;
      letter-spacing: var(--tracking-tight);
      line-height: var(--leading-tight);
      margin: 2px 0 0;
    }

    .cv-title {
      font-size: 11px;
      color: var(--muted-foreground);
      margin: 0;
    }

    .cv-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      break-inside: avoid;
    }

    .cv-label {
      font-size: 8px;
      letter-spacing: var(--tracking-wide);
      text-transform: uppercase;
      color: var(--muted-foreground);
      font-weight: 500;
    }

    .cv-body-text {
      font-size: 10px;
      line-height: var(--leading-normal);
      color: var(--foreground);
      margin: 0;
    }

    /* ── Kernkompetenzen / Ausbildung Grid ────────────────────────────── */
    .cv-competency-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .cv-competency {
      break-inside: avoid;
    }

    .cv-competency-title {
      font-size: 10px;
      font-weight: 500;
      color: var(--foreground);
      display: block;
      margin-bottom: 3px;
    }

    .cv-competency-desc {
      font-size: 9px;
      line-height: var(--leading-normal);
      color: var(--muted-foreground);
      margin: 0;
    }

    /* ── Berufserfahrung ──────────────────────────────────────────────── */
    .cv-experience {
      break-inside: avoid;
      padding-bottom: 12px;
      border-bottom: 1px solid color-mix(in oklch, var(--foreground) 8%, transparent);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .cv-experience:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .cv-experience-head {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .cv-experience-period {
      font-size: 9px;
      color: var(--muted-foreground);
      font-variant-numeric: tabular-nums;
    }

    .cv-experience-company {
      font-size: 11px;
      font-weight: 500;
      color: var(--foreground);
    }

    .cv-experience-role {
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: var(--tracking-wide);
      color: var(--muted-foreground);
    }

    .cv-achievements {
      list-style: none;
      margin: 4px 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .cv-achievements li {
      position: relative;
      padding-left: 12px;
      font-size: 9.5px;
      line-height: var(--leading-normal);
      color: var(--foreground);
    }

    .cv-achievements li::before {
      content: '—';
      position: absolute;
      left: 0;
      color: color-mix(in oklch, var(--foreground) 30%, transparent);
    }

    /* ── Projekte ─────────────────────────────────────────────────────── */
    .cv-project-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .cv-project {
      break-inside: avoid;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .cv-project-meta {
      font-size: 8px;
      letter-spacing: var(--tracking-wide);
      text-transform: uppercase;
      color: var(--muted-foreground);
    }

    .cv-project-title {
      font-size: 10px;
      font-weight: 500;
      color: var(--foreground);
    }

    .cv-project-desc {
      font-size: 9px;
      line-height: var(--leading-normal);
      color: var(--muted-foreground);
      margin: 0;
    }
  </style>
  ```

- [ ] **Schritt 2: Build-Check**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr && npm run build 2>&1 | tail -20
  ```

  Erwartetes Ergebnis: `[build] Complete!`, neue Route `dist/cv/index.html` wird erzeugt.

- [ ] **Schritt 3: Visuelle Kontrolle im Browser**

  ```bash
  npx astro preview --port 4322 &
  sleep 2
  open http://localhost:4322/cv
  ```

  Prüfen: Zweispaltiges Layout auf beiden Seiten sichtbar, Portrait lädt, keine Überlappungen, Trennlinie zwischen den Spalten sichtbar. Danach den Preview-Server wieder beenden:

  ```bash
  kill %1
  ```

- [ ] **Schritt 4: Commit**

  ```bash
  git add src/pages/cv.astro
  git commit -m "feat: CV-Seite mit Zweispalten-Grid-Layout (Seite 1: Profil/Werdegang, Seite 2: Projekte/Ausbildung)"
  ```

---

### Task 4: Playwright-PDF-Export-Skript

**Files:**
- Create: `scripts/generate-cv-pdf.mjs`
- Modify: `package.json`

- [ ] **Schritt 1: Playwright als devDependency installieren**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr
  npm install --save-dev playwright
  npx playwright install chromium
  ```

  Erwartetes Ergebnis: `playwright` erscheint in `package.json` unter `devDependencies`, Chromium-Binary wird heruntergeladen.

- [ ] **Schritt 2: `scripts/`-Verzeichnis anlegen falls nicht vorhanden**

  ```bash
  mkdir -p scripts
  ```

- [ ] **Schritt 3: Generierungs-Skript erstellen**

  ```javascript
  // scripts/generate-cv-pdf.mjs
  import { chromium } from 'playwright'
  import { spawn } from 'node:child_process'
  import { setTimeout as sleep } from 'node:timers/promises'
  import { fileURLToPath } from 'node:url'
  import path from 'node:path'

  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const projectRoot = path.resolve(__dirname, '..')
  const PORT = 4323
  const BASE_URL = `http://localhost:${PORT}`
  const OUTPUT_PATH = path.join(projectRoot, 'dist', 'cv.pdf')

  async function waitForServer(url, timeoutMs = 15000) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      try {
        const res = await fetch(url)
        if (res.ok) return true
      } catch {
        // Server noch nicht bereit — weiter warten
      }
      await sleep(300)
    }
    throw new Error(`Preview-Server unter ${url} antwortete nicht innerhalb von ${timeoutMs}ms`)
  }

  async function main() {
    console.log('[cv-pdf] Starte Preview-Server …')
    const previewProcess = spawn(
      'npx',
      ['astro', 'preview', '--port', String(PORT)],
      { cwd: projectRoot, stdio: 'pipe' }
    )

    previewProcess.stderr.on('data', (chunk) => {
      process.stderr.write(`[astro preview] ${chunk}`)
    })

    try {
      await waitForServer(`${BASE_URL}/cv`)
      console.log('[cv-pdf] Preview-Server bereit. Rendere PDF …')

      const browser = await chromium.launch()
      const page = await browser.newPage()
      await page.goto(`${BASE_URL}/cv`, { waitUntil: 'networkidle' })
      await page.emulateMedia({ media: 'print' })
      await page.pdf({
        path: OUTPUT_PATH,
        printBackground: true,
        preferCSSPageSize: true,
      })
      await browser.close()

      console.log(`[cv-pdf] PDF geschrieben nach ${OUTPUT_PATH}`)
    } finally {
      previewProcess.kill()
    }
  }

  main().catch((err) => {
    console.error('[cv-pdf] Fehler:', err)
    process.exit(1)
  })
  ```

- [ ] **Schritt 4: Skript manuell testen (nach vorherigem Build)**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr
  npm run build
  node scripts/generate-cv-pdf.mjs
  ```

  Erwartetes Ergebnis: Konsolen-Ausgabe `[cv-pdf] PDF geschrieben nach .../dist/cv.pdf`, Datei existiert:

  ```bash
  ls -la dist/cv.pdf
  ```

  Datei sollte > 0 Bytes sein (realistisch: 100–500 KB wegen eingebettetem Portrait-Bild).

- [ ] **Schritt 5: PDF visuell prüfen**

  ```bash
  open dist/cv.pdf
  ```

  Prüfen: 2 Seiten, A4-Format, Zweispalten-Layout korrekt, keine abgeschnittenen Texte, Portrait sichtbar, Farben stimmen mit der Website überein (warmes Schwarz auf Weiß, keine Standard-Schwarz/Weiß-Druckfarben).

- [ ] **Schritt 6: Commit**

  ```bash
  git add scripts/generate-cv-pdf.mjs package.json package-lock.json
  git commit -m "feat: Playwright-Skript für CV-PDF-Export (Preview-Server → PDF)"
  ```

---

### Task 5: Build-Pipeline verdrahten

**Files:**
- Modify: `package.json`

**Kontext:** npm führt ein `postbuild`-Skript automatisch nach `npm run build` aus — das ist die eingebaute npm-Lifecycle-Konvention, kein Astro-spezifisches Feature. Vercel ruft beim Deploy `npm run build` auf, wodurch `postbuild` automatisch mitläuft, ohne die Vercel-Konfiguration anfassen zu müssen.

- [ ] **Schritt 1: `postbuild`-Skript in `package.json` ergänzen**

  Den bestehenden `"scripts"`-Block erweitern:

  ```json
  {
    "scripts": {
      "dev": "astro dev",
      "build": "NODE_OPTIONS=--max-old-space-size=8192 astro build",
      "postbuild": "node scripts/generate-cv-pdf.mjs",
      "preview": "astro preview",
      "astro": "astro",
      "lint": "eslint .",
      "format": "prettier --write \"**/*.{ts,tsx,astro}\"",
      "typecheck": "astro check"
    }
  }
  ```

- [ ] **Schritt 2: Vollständige Pipeline end-to-end testen**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr
  rm -f dist/cv.pdf
  npm run build 2>&1 | tail -30
  ```

  Erwartetes Ergebnis: Zuerst der normale Astro-Build-Output (`[build] Complete!`), danach automatisch die `[cv-pdf]`-Log-Zeilen aus Task 4, Schritt 3–4. Am Ende:

  ```bash
  ls -la dist/cv.pdf
  ```

  Datei muss existieren und aktuell sein (Timestamp nach Build-Start).

- [ ] **Schritt 3: Bestehende Lebenslauf-Links stichprobenartig prüfen**

  ```bash
  grep -n 'href="/cv.pdf"' dist/index.html dist/about/index.html
  ```

  Erwartetes Ergebnis: Beide Dateien enthalten weiterhin `href="/cv.pdf"` — keine Code-Änderung an `index.astro`/`about.astro` nötig, der Link zeigt jetzt einfach auf eine real existierende Datei.

- [ ] **Schritt 4: Commit + Push**

  ```bash
  git add package.json
  git commit -m "feat: postbuild-Hook generiert cv.pdf automatisch bei jedem Build"
  git push origin main
  ```

---

## Verifikation nach Deployment

Nach dem Vercel-Deploy auf `ptrckschrdtr.de` prüfen:

1. **`https://ptrckschrdtr.de/cv.pdf`** direkt aufrufen — PDF muss laden, 2 Seiten, korrektes Layout
2. **„Lebenslauf ↓"-Link** auf Homepage (Kontakt-Sektion) und About-Seite (CTA-Sektion) anklicken — muss die PDF öffnen/downloaden, kein 404 mehr
3. **`https://ptrckschrdtr.de/cv`** (HTML-Version) — sollte im Browser lesbar sein, aber `noindex` im Meta-Tag haben (Quelltext prüfen: `<meta name="robots" content="noindex, nofollow" />`)
4. Vercel-Build-Log prüfen: `[cv-pdf] PDF geschrieben nach .../dist/cv.pdf` muss im Deployment-Log erscheinen — falls nicht, ist der Playwright-Chromium-Download im Vercel-Build-Environment fehlgeschlagen (siehe Troubleshooting unten)

### Troubleshooting: Playwright auf Vercel

Vercels Build-Environment installiert `devDependencies` automatisch, aber Playwright braucht zusätzlich den Chromium-Binary-Download (`npx playwright install chromium`), der nicht automatisch über `npm install` läuft. Falls der Vercel-Build fehlschlägt, folgenden Schritt in `package.json` ergänzen:

```json
{
  "scripts": {
    "postinstall": "playwright install chromium --with-deps"
  }
}
```

Das ist bewusst NICHT Teil von Task 5, da es nur bei einem tatsächlichen Vercel-Build-Fehler nötig ist — lokal ist Chromium durch Task 4/Schritt 1 bereits vorhanden. Falls dieser Fall eintritt, als zusätzlichen Fix-Commit nachziehen.
