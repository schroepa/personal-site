# Project-Index Hover-Reveal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Projektübersicht von einem Bild-Grid in ein reines Text-Verzeichnis (Nummer · Titel · Jahr) umbauen. Projekt-Cover-Bilder sind im Ruhezustand unsichtbar und erscheinen nur beim Hover über einem Projektnamen an einer fest definierten Raster-Position.

**Architecture:** Einzige Datei: `src/pages/projects/index.astro`. Das 2-Spalten-Grid wird durch eine single-column Textliste ersetzt. Ein verstecktes `<div id="project-preview">` (position: fixed, rechte Hälfte des Viewports, vertikale Mitte) wird über Vanilla JS per `mouseenter`/`mouseleave` auf den `.project-line`-Elementen ein- und ausgeblendet. Auf Touch-Geräten (`@media (hover: none)`) ist der Preview-Block nicht sichtbar.

**Tech Stack:** Astro, CSS Custom Properties, Vanilla JS (kein Framework).

---

## Dateistruktur

| Aktion | Datei | Zweck |
|---|---|---|
| Modify | `src/pages/projects/index.astro` | Kompletter Umbau: Grid → Textliste + Hover-Preview |

---

### Task 1: Textliste + Hover-Preview implementieren

**Files:**
- Modify: `src/pages/projects/index.astro`

- [ ] **Schritt 1: Kompletten Inhalt von `src/pages/projects/index.astro` ersetzen**

  Die Datei erhält folgenden vollständigen neuen Inhalt:

  ```astro
  ---
  import BaseLayout from '@/layouts/BaseLayout.astro';
  import { getCollection } from 'astro:content';

  const allProjects = await getCollection('projects');
  const sorted = allProjects.sort((a, b) => {
    if (a.data.featured && !b.data.featured) return -1;
    if (!a.data.featured && b.data.featured) return 1;
    return b.data.date.getTime() - a.data.date.getTime();
  });

  const getYear = (date: Date) =>
    new Intl.DateTimeFormat('de-DE', { year: 'numeric' }).format(date);
  ---

  <BaseLayout
    title="Projekte — Patrick Schröder"
    description="Ausgewählte Arbeiten aus Design und Entwicklung."
  >
    <div class="px-6 pt-24 pb-32">
      <div class="max-w-5xl mx-auto">

        <header class="projects-header">
          <h1 class="t-h1 mb-4" data-reveal="lines">Projekte</h1>
          <p class="t-lead text-muted-foreground max-w-2xl">
            Ausgewählte Arbeiten aus den Bereichen Interface Design,
            Frontend-Entwicklung und Design-Systems.
          </p>
        </header>

        <!-- ── Textverzeichnis ─────────────────────────────────────── -->
        <ol class="project-index" aria-label="Projektliste">
          {sorted.map((project, i) => {
            const slug = project.id.replace(/\.md$/, '')
            const href = `/projects/${slug}`
            const coverSrc = project.data.coverImage ?? null
            const num = String(i + 1).padStart(2, '0')
            const year = getYear(project.data.date)

            return (
              <li class="project-item">
                <a
                  href={href}
                  class="project-line"
                  data-cursor="link"
                  data-preview={coverSrc}
                  aria-label={project.data.title}
                >
                  <span class="project-num" aria-hidden="true">{num}</span>
                  <span class="project-name">{project.data.title}</span>
                  <time class="project-year" datetime={project.data.date.toISOString()}>
                    {year}
                  </time>
                </a>
              </li>
            )
          })}
        </ol>

      </div>
    </div>

    <!-- ── Hover-Preview: fest positioniert, rechte Seite ────────── -->
    <div id="project-preview" class="project-preview" aria-hidden="true">
      <img id="project-preview-img" src="" alt="" loading="lazy" decoding="async" />
    </div>
  </BaseLayout>

  <style>
    /* ── Header ──────────────────────────────────────────────────────── */
    .projects-header {
      margin-bottom: 4rem;
    }

    /* ── Index-Liste ─────────────────────────────────────────────────── */
    .project-index {
      list-style: none;
      padding: 0;
      margin: 0;
      border-top: 1px solid color-mix(in oklch, var(--foreground) 12%, transparent);
    }

    .project-item {
      /* Kein eigenes padding — link übernimmt die gesamte Fläche */
    }

    /* ── Zeile: Nummer | Titel | Jahr ────────────────────────────────── */
    .project-line {
      display: grid;
      grid-template-columns: 2.5rem 1fr auto;
      align-items: baseline;
      gap: 1.5rem;
      padding: 1.25rem 0;
      text-decoration: none;
      color: var(--foreground);
      border-bottom: 1px solid color-mix(in oklch, var(--foreground) 12%, transparent);
      transition: opacity 250ms ease;
    }

    /* Hover: Zeile tritt zurück */
    .project-line:hover {
      opacity: 0.4;
    }

    /* Wenn irgendeine Zeile gehovered wird: alle anderen Zeilen zurücktreten */
    .project-index:has(.project-line:hover) .project-line:not(:hover) {
      opacity: 0.25;
    }

    /* ── Nummer ──────────────────────────────────────────────────────── */
    .project-num {
      font-size: var(--text-xs);
      letter-spacing: var(--tracking-wide);
      color: var(--muted-foreground);
      font-variant-numeric: tabular-nums;
      padding-top: 0.1em; /* optische Ausrichtung an Baseline */
    }

    /* ── Titel ───────────────────────────────────────────────────────── */
    .project-name {
      font-size: var(--text-base);
      font-weight: 500;
      letter-spacing: var(--tracking-snug);
      line-height: var(--leading-snug);
    }

    /* ── Jahr ────────────────────────────────────────────────────────── */
    .project-year {
      font-size: var(--text-xs);
      letter-spacing: var(--tracking-wide);
      color: var(--muted-foreground);
      text-transform: uppercase;
      white-space: nowrap;
    }

    /* ── Hover-Preview: fixed, rechte Viewport-Hälfte ────────────────── */
    .project-preview {
      position: fixed;
      right: 7%;
      top: 50%;
      transform: translateY(-50%);
      width: clamp(240px, 26vw, 420px);
      aspect-ratio: 4 / 3;
      z-index: 50;
      pointer-events: none;
      opacity: 0;
      transition: opacity 300ms cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
    }

    .project-preview.is-visible {
      opacity: 1;
    }

    .project-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* Touch-Geräte: kein Hover-Preview */
    @media (hover: none) {
      .project-preview {
        display: none;
      }

      /* Auf Touch: kein opacity-Effekt auf hover */
      .project-line:hover,
      .project-index:has(.project-line:hover) .project-line:not(:hover) {
        opacity: 1;
      }
    }

    /* Schmale Viewports: Preview nimmt zu viel Platz weg */
    @media (max-width: 900px) {
      .project-preview {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .project-line,
      .project-preview {
        transition: none;
      }
    }
  </style>

  <script>
    function initProjectPreview() {
      const preview = document.getElementById('project-preview') as HTMLElement | null
      const previewImg = document.getElementById('project-preview-img') as HTMLImageElement | null

      if (!preview || !previewImg) return

      // Nur auf Geräten mit Hover-Unterstützung
      if (!window.matchMedia('(hover: hover)').matches) return
      if (!window.matchMedia('(min-width: 901px)').matches) return

      const lines = document.querySelectorAll<HTMLAnchorElement>('[data-preview]')

      lines.forEach((line) => {
        line.addEventListener('mouseenter', () => {
          const src = line.dataset.preview
          if (!src) return

          // Bild nur wechseln wenn src sich ändert (verhindert Flackern)
          if (previewImg.getAttribute('src') !== src) {
            preview.classList.remove('is-visible')
            // Kurze Verzögerung: altes Bild ausfaden, neues einblenden
            setTimeout(() => {
              previewImg.src = src
              preview.classList.add('is-visible')
            }, 80)
          } else {
            preview.classList.add('is-visible')
          }
        })

        line.addEventListener('mouseleave', () => {
          preview.classList.remove('is-visible')
        })
      })
    }

    document.addEventListener('astro:page-load', initProjectPreview)
  </script>
  ```

- [ ] **Schritt 2: Build-Check**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr && npm run build 2>&1 | tail -8
  ```

  Erwartetes Ergebnis: `[build] Complete!` ohne TypeScript-Fehler.

  Wenn TypeScript-Fehler: `project.data.coverImage` ist optional. Falls der Typ-Fehler auf `?? null` weist: `const coverSrc = project.data.coverImage ?? ''` und im Template `data-preview={coverSrc || undefined}` verwenden.

- [ ] **Schritt 3: Commit + Push**

  ```bash
  git add src/pages/projects/index.astro
  git commit -m "feat: Project-Index als Textverzeichnis mit Hover-Preview (Ma-Prinzip)"
  git push origin main
  ```

---

## Verifikation nach Deployment

Auf ptrckschrdtr.de/projects prüfen:

1. **Textliste sichtbar** — keine Bilder im Ruhezustand
2. **Hover-Preview** — Bild erscheint rechts beim Mouseover über Projektnamen
3. **Nicht-gehover Zeilen** — werden subtil zurückgedrängt (opacity 0.25)
4. **Keine Preview auf Mobile** — auf Touch-Geräten nur Textliste
5. **Projektlinks** — klickbar, führen zur Projektseite
