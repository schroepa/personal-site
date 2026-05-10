# Homepage Scroll-Snap + SectionIndicator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Die Startseite in 4 Scroll-Snap-Sections (100dvh) unterteilen — INTRO, ARBEIT, GEDANKEN, KONTAKT — mit einem typografischen Seiten-Indikator (rechte Viewport-Kante, fix positioniert) der aktive Section zeigt und Navigation ermöglicht.

**Architecture:** Ein neues `SectionIndicator.astro` erhält die Section-Definitionen als Props und rendert einen `<nav>` mit `<button>`-Elementen. JS: `IntersectionObserver` auf dem Scroll-Container detektiert die aktive Section. Die Startseite (`index.astro`) wird komplett neu strukturiert: ein `.scroll-container` mit `scroll-snap-type: y mandatory` enthält 4 `.snap-section` Elemente. `SectionIndicator` wird innerhalb des Slots in `index.astro` eingebunden (position: fixed). `prefers-reduced-motion`: Scroll-Snap deaktiviert, normaler Dokumentenfluss. Scroll-Hint in Section 01 mit subtiler Pfeil-Animation.

**Tech Stack:** Astro, Vanilla JS (IntersectionObserver), CSS scroll-snap, `100dvh`, CSS Custom Properties.

**Sequenz:** Plan 1 (Farben) und Plan 2 (Grid) müssen VOR diesem Plan ausgeführt sein.

---

## Dateistruktur

| Aktion | Datei | Zweck |
|---|---|---|
| Create | `src/components/astro/SectionIndicator.astro` | Fixe Seiten-Navigation |
| Modify | `src/pages/index.astro` | 4 Scroll-Snap-Sections + SectionIndicator |

---

### Task 1: SectionIndicator-Komponente erstellen

**Files:**
- Create: `src/components/astro/SectionIndicator.astro`

- [ ] **Schritt 1: Datei erstellen**

  ```astro
  ---
  interface Section {
    id: string    // entspricht der id des <section>-Elements
    label: string // Anzeige-Label, z.B. "Intro"
  }

  interface Props {
    sections: Section[]
  }

  const { sections } = Astro.props
  ---

  <nav
    class="section-indicator"
    id="section-indicator"
    aria-label="Seitennavigation"
  >
    {sections.map((section, i) => (
      <button
        class="si-item"
        data-target={section.id}
        aria-label={`Springe zu: ${section.label}`}
        aria-current={i === 0 ? "true" : undefined}
        type="button"
      >
        <span class="si-label">{section.label}</span>
        <span class="si-line" aria-hidden="true"></span>
        <span class="si-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
      </button>
    ))}
  </nav>

  <style>
    /* ── Container: fixed, rechte Kante, vertikal zentriert ───────────────── */
    .section-indicator {
      position: fixed;
      right: 2rem;
      top: 50%;
      transform: translateY(-50%);
      z-index: 55;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
      /* Nur auf breiten Screens — auf Mobile/Tablet ist kein Platz */
    }

    /* Ab 1024px anzeigen */
    @media (max-width: 1023px) {
      .section-indicator {
        display: none;
      }
    }

    /* ── Item: Button mit Label + Linie + Nummer ───────────────────────────── */
    .si-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      background: none;
      border: none;
      padding: 0.25rem 0;
      cursor: pointer;
      /* Label links, Linie mitte, Nummer rechts */
    }

    .si-item:focus-visible {
      outline: 2px solid var(--foreground);
      outline-offset: 4px;
      border-radius: 2px;
    }

    /* ── Nummer ────────────────────────────────────────────────────────────── */
    .si-num {
      font-size: var(--text-xs);
      letter-spacing: var(--tracking-wide);
      font-variant-numeric: tabular-nums;
      color: var(--foreground);
      opacity: 0.25;
      transition: opacity 200ms ease;
      min-width: 1.5rem;
      text-align: right;
    }

    /* ── Linie ─────────────────────────────────────────────────────────────── */
    .si-line {
      display: block;
      height: 1px;
      width: 16px;
      background: var(--foreground);
      opacity: 0.2;
      transition: width 250ms ease, opacity 250ms ease;
    }

    /* ── Label ─────────────────────────────────────────────────────────────── */
    .si-label {
      font-size: var(--text-xs);
      letter-spacing: var(--tracking-wide);
      text-transform: uppercase;
      color: var(--foreground);
      opacity: 0;
      transform: translateX(6px);
      transition:
        opacity 200ms ease,
        transform 200ms ease;
      white-space: nowrap;
    }

    /* ── Aktiv-Zustand ─────────────────────────────────────────────────────── */
    .si-item[aria-current="true"] .si-num   { opacity: 1; }
    .si-item[aria-current="true"] .si-line  { width: 28px; opacity: 0.9; }
    .si-item[aria-current="true"] .si-label { opacity: 0.9; transform: translateX(0); }

    /* ── Hover-Zustand ─────────────────────────────────────────────────────── */
    .si-item:hover .si-num   { opacity: 0.7; }
    .si-item:hover .si-line  { width: 22px; opacity: 0.5; }
    .si-item:hover .si-label { opacity: 0.5; transform: translateX(0); }

    @media (prefers-reduced-motion: reduce) {
      .si-num, .si-line, .si-label { transition: none; }
    }
  </style>

  <script>
    function initSectionIndicator() {
      const indicator = document.getElementById('section-indicator')
      if (!indicator) return

      const scrollContainer = document.querySelector<HTMLElement>('.scroll-container')
      if (!scrollContainer) return

      const buttons = indicator.querySelectorAll<HTMLButtonElement>('.si-item')

      // Aktive Section setzen
      function setActive(sectionId: string) {
        buttons.forEach((btn) => {
          const isActive = btn.dataset.target === sectionId
          btn.setAttribute('aria-current', isActive ? 'true' : 'false')
        })
      }

      // IntersectionObserver: welche Section ist sichtbar?
      const sections = Array.from(
        scrollContainer.querySelectorAll<HTMLElement>('.snap-section')
      )

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActive(entry.target.id)
            }
          })
        },
        {
          root: scrollContainer,
          threshold: 0.5, // Section muss zu 50% sichtbar sein
        }
      )

      sections.forEach((section) => observer.observe(section))

      // Button-Klick: Scroll zur Section
      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetId = btn.dataset.target
          if (!targetId) return
          const target = document.getElementById(targetId)
          target?.scrollIntoView({ behavior: 'smooth' })
        })
      })
    }

    document.addEventListener('astro:page-load', initSectionIndicator)
  </script>
  ```

- [ ] **Schritt 2: Build-Check**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr && npm run build 2>&1 | tail -5
  ```

  Erwartetes Ergebnis: `[build] Complete!` (Komponente wird noch nicht verwendet, kein Fehler).

- [ ] **Schritt 3: Commit**

  ```bash
  git add src/components/astro/SectionIndicator.astro
  git commit -m "feat: SectionIndicator — typografischer Seiten-Indikator, rechte Viewport-Kante"
  ```

---

### Task 2: Homepage mit 4 Scroll-Snap-Sections aufbauen

**Files:**
- Modify: `src/pages/index.astro`

**Wichtig vor der Implementierung:** Zuerst die aktuelle `src/pages/index.astro` lesen um bestehende Imports und Content-Strukturen zu kennen. Die HeroMesh-Komponente bleibt in Section 01.

- [ ] **Schritt 1: Aktuelle `index.astro` lesen**

  ```bash
  cat /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr/src/pages/index.astro
  ```

- [ ] **Schritt 2: `index.astro` komplett ersetzen**

  Die Datei erhält folgenden vollständigen Inhalt:

  ```astro
  ---
  import BaseLayout from '@/layouts/BaseLayout.astro'
  import HeroMesh from '@/components/astro/HeroMesh.astro'
  import SectionIndicator from '@/components/astro/SectionIndicator.astro'
  import { getCollection } from 'astro:content'

  // Projekte: Featured zuerst, dann nach Datum, max 3
  const allProjects = await getCollection('projects')
  const featuredProjects = allProjects
    .sort((a, b) => {
      if (a.data.featured && !b.data.featured) return -1
      if (!a.data.featured && b.data.featured) return 1
      return b.data.date.getTime() - a.data.date.getTime()
    })
    .slice(0, 3)

  // Blog: neueste zuerst, max 3
  const allPosts = await getCollection('blog')
  const latestPosts = allPosts
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, 3)

  const getYear = (date: Date) =>
    new Intl.DateTimeFormat('de-DE', { year: 'numeric' }).format(date)

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)

  const homeSections = [
    { id: 'section-intro',    label: 'Intro' },
    { id: 'section-arbeit',   label: 'Arbeit' },
    { id: 'section-gedanken', label: 'Gedanken' },
    { id: 'section-kontakt',  label: 'Kontakt' },
  ]
  ---

  <BaseLayout
    title="Patrick Schröder — UI Designer & Developer"
    description="Design Engineer aus Berlin. Aufgewachsen mit Spraydosen, groß geworden mit Code."
  >

    <!-- Section Indicator: fix rechts, nur Desktop -->
    <SectionIndicator sections={homeSections} />

    <!-- ── Scroll-Snap-Container ──────────────────────────────────────── -->
    <div class="scroll-container" id="scroll-container">

      <!-- ── Section 01: INTRO ─────────────────────────────────────────── -->
      <section id="section-intro" class="snap-section intro-section">
        <HeroMesh />

        <div class="page-grid snap-content intro-content">

          <!-- Label oben links -->
          <span class="t-label text-muted-foreground intro-eyebrow">
            Design Engineer — Berlin
          </span>

          <!-- Hauptaussage: positioniert im unteren Drittel -->
          <div class="intro-statement">
            <h1 class="t-hero intro-heading" data-reveal="words">
              Aufgewachsen<br>mit Spraydosen.<br>Groß geworden<br>mit Code.
            </h1>
          </div>

          <!-- Scroll-Hint -->
          <div class="scroll-hint" aria-hidden="true">
            <span class="scroll-hint-text">Scroll</span>
            <span class="scroll-hint-arrow">↓</span>
          </div>

        </div>
      </section>

      <!-- ── Section 02: ARBEIT ─────────────────────────────────────────── -->
      <section id="section-arbeit" class="snap-section arbeit-section">
        <div class="page-grid snap-content arbeit-content">

          <div class="section-label-row">
            <span class="t-label text-muted-foreground">Ausgewählte Arbeit</span>
            <a href="/projects" class="section-all-link t-label" data-cursor="link">
              Alle Projekte →
            </a>
          </div>

          <!-- Projekt-Textliste (konsistent mit /projects) -->
          <ol class="home-list" aria-label="Ausgewählte Projekte">
            {featuredProjects.map((project, i) => {
              const slug = project.id.replace(/\.md$/, '')
              const coverSrc = project.data.coverImage ?? undefined
              const num = String(i + 1).padStart(2, '0')
              const year = getYear(project.data.date)
              return (
                <li>
                  <a
                    href={`/projects/${slug}`}
                    class="home-list-item"
                    data-cursor="link"
                    data-preview={coverSrc}
                  >
                    <span class="home-list-num" aria-hidden="true">{num}</span>
                    <span class="home-list-title">{project.data.title}</span>
                    <time class="home-list-year" datetime={project.data.date.toISOString()}>
                      {year}
                    </time>
                  </a>
                </li>
              )
            })}
          </ol>

          <!-- Hover-Preview (identisch mit /projects) -->
          <div id="home-project-preview" class="home-preview" aria-hidden="true">
            <img id="home-preview-img" src="" alt="" loading="lazy" decoding="async" />
          </div>

        </div>
      </section>

      <!-- ── Section 03: GEDANKEN ──────────────────────────────────────── -->
      <section id="section-gedanken" class="snap-section gedanken-section">
        <div class="page-grid snap-content gedanken-content">

          <div class="section-label-row">
            <span class="t-label text-muted-foreground">Gedanken</span>
            <a href="/blog" class="section-all-link t-label" data-cursor="link">
              Alle Artikel →
            </a>
          </div>

          <!-- Blog-Textliste -->
          <ol class="home-list" aria-label="Neueste Artikel">
            {latestPosts.map((post, i) => {
              const slug = post.id.replace(/\.md$/, '')
              const num = String(i + 1).padStart(2, '0')
              return (
                <li>
                  <a
                    href={`/blog/${slug}`}
                    class="home-list-item"
                    data-cursor="link"
                  >
                    <span class="home-list-num" aria-hidden="true">{num}</span>
                    <span class="home-list-title">{post.data.title}</span>
                    <time class="home-list-year" datetime={post.data.date.toISOString()}>
                      {formatDate(post.data.date)}
                    </time>
                  </a>
                </li>
              )
            })}
          </ol>

        </div>
      </section>

      <!-- ── Section 04: KONTAKT ──────────────────────────────────────── -->
      <section id="section-kontakt" class="snap-section kontakt-section">
        <div class="page-grid snap-content kontakt-content">

          <div class="kontakt-body">
            <p class="t-label text-muted-foreground mb-8">Kontakt</p>
            <h2 class="t-hero kontakt-heading" data-reveal="words">
              Lass uns<br>reden.
            </h2>
            <a
              href="mailto:kontakt@ptrckschrdtr.de"
              class="kontakt-email"
              data-cursor="link"
              data-magnetic
            >
              kontakt@ptrckschrdtr.de
            </a>
            <div class="kontakt-secondary">
              <a
                href="/cv.pdf"
                target="_blank"
                rel="noopener noreferrer"
                class="t-small text-muted-foreground"
                data-cursor="link"
              >
                Lebenslauf ↓
              </a>
              <span class="t-small text-muted-foreground" aria-hidden="true">·</span>
              <a href="/projects" class="t-small text-muted-foreground" data-cursor="link">
                Projekte ansehen
              </a>
            </div>
          </div>

        </div>
      </section>

    </div><!-- /.scroll-container -->

  </BaseLayout>

  <style>
    /* ── Scroll-Container: nimmt den Platz von <main> ein ────────────────── */
    .scroll-container {
      height: 100dvh;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
      overscroll-behavior: none;
      /* Scrollbar verstecken (visuell) */
      scrollbar-width: none;
    }
    .scroll-container::-webkit-scrollbar { display: none; }

    /* body darf nicht mitscrollen */
    :global(body:has(.scroll-container)) {
      overflow: hidden;
    }

    /* ── Einzelne Section ────────────────────────────────────────────────── */
    .snap-section {
      height: 100dvh;
      scroll-snap-align: start;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Content-Wrapper: nimmt volle Höhe, flexbox für Positionierung */
    .snap-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
    }

    /* ─── Section 01: INTRO ──────────────────────────────────────────────── */
    .intro-content {
      justify-content: flex-end;  /* Inhalt im unteren Bereich */
      padding-bottom: 5rem;
    }

    .intro-eyebrow {
      position: absolute;
      top: 7rem; /* unter der Corner-Nav */
      left: var(--grid-pad);
    }

    .intro-statement {
      max-width: 90vw; /* Headline darf breit sein */
    }

    .intro-heading {
      line-height: 0.95;  /* sehr eng für dramatischen Effekt */
    }

    /* ── Scroll-Hint ─────────────────────────────────────────────────────── */
    .scroll-hint {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 3rem;
      font-size: var(--text-xs);
      letter-spacing: var(--tracking-wide);
      text-transform: uppercase;
      color: var(--muted-foreground);
      opacity: 0.55;
    }

    .scroll-hint-arrow {
      display: inline-block;
      animation: bounce-down 2.5s ease-in-out infinite;
    }

    @keyframes bounce-down {
      0%, 100% { transform: translateY(0); }
      50%       { transform: translateY(5px); }
    }

    /* ─── Sections 02–04: gemeinsame Layout-Logik ───────────────────────── */
    .arbeit-content,
    .gedanken-content,
    .kontakt-content {
      justify-content: center;
    }

    /* Label-Zeile: Section-Titel links, "Alle →" rechts */
    .section-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2.5rem;
      border-bottom: 1px solid color-mix(in oklch, var(--foreground) 12%, transparent);
      padding-bottom: 1rem;
    }

    .section-all-link {
      color: var(--muted-foreground);
      text-decoration: none;
      transition: color 200ms ease;
    }
    .section-all-link:hover { color: var(--foreground); }

    /* ─── Textliste (identisches System wie /projects) ───────────────────── */
    .home-list {
      list-style: none;
      padding: 0;
      margin: 0;
      max-width: var(--text-max); /* 800px, linksbündig */
    }

    .home-list-item {
      display: grid;
      grid-template-columns: 2.5rem 1fr auto;
      align-items: baseline;
      gap: 1.5rem;
      padding: 1.125rem 0;
      border-bottom: 1px solid color-mix(in oklch, var(--foreground) 12%, transparent);
      text-decoration: none;
      color: var(--foreground);
      transition: opacity 250ms ease;
    }

    .home-list-item:first-child { border-top: 1px solid color-mix(in oklch, var(--foreground) 12%, transparent); }
    .home-list-item:hover { opacity: 0.4; }

    .home-list:has(.home-list-item:hover) .home-list-item:not(:hover) { opacity: 0.25; }

    .home-list-num {
      font-size: var(--text-xs);
      letter-spacing: var(--tracking-wide);
      color: var(--muted-foreground);
      font-variant-numeric: tabular-nums;
    }

    .home-list-title {
      font-size: var(--text-base);
      font-weight: 500;
      letter-spacing: var(--tracking-snug);
    }

    .home-list-year {
      font-size: var(--text-xs);
      letter-spacing: var(--tracking-wide);
      color: var(--muted-foreground);
      white-space: nowrap;
    }

    .home-list-item:focus-visible {
      outline: 2px solid var(--foreground);
      outline-offset: 2px;
    }

    /* ─── Hover-Preview (nur für Projekte in Section 02) ────────────────── */
    .home-preview {
      position: fixed;
      right: 10%;
      top: 50%;
      transform: translateY(-50%);
      width: clamp(200px, 22vw, 380px);
      aspect-ratio: 4 / 3;
      z-index: 50;
      pointer-events: none;
      opacity: 0;
      overflow: hidden;
      transition: opacity 300ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .home-preview.is-visible { opacity: 1; }
    .home-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }

    @media (hover: none), (max-width: 900px) {
      .home-preview { display: none; }
      .home-list-item:hover,
      .home-list:has(.home-list-item:hover) .home-list-item:not(:hover) { opacity: 1; }
    }

    /* ─── Section 04: KONTAKT ────────────────────────────────────────────── */
    .kontakt-heading {
      line-height: 0.95;
      margin-bottom: 2.5rem;
    }

    .kontakt-email {
      display: inline-block;
      font-size: clamp(1.25rem, 2.5vw, 2rem);
      font-weight: 500;
      letter-spacing: var(--tracking-snug);
      color: var(--foreground);
      text-decoration: none;
      border-bottom: 1px solid color-mix(in oklch, var(--foreground) 25%, transparent);
      padding-bottom: 0.25rem;
      transition: border-color 200ms ease, opacity 200ms ease;
      margin-bottom: 2rem;
    }
    .kontakt-email:hover {
      border-color: var(--foreground);
      opacity: 0.7;
    }

    .kontakt-secondary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }
    .kontakt-secondary a {
      color: var(--muted-foreground);
      text-decoration: none;
      transition: color 200ms ease;
    }
    .kontakt-secondary a:hover { color: var(--foreground); }

    /* ─── prefers-reduced-motion: Scroll-Snap deaktivieren ─────────────── */
    @media (prefers-reduced-motion: reduce) {
      .scroll-container {
        scroll-snap-type: none;
        height: auto;
        overflow-y: visible;
      }

      :global(body:has(.scroll-container)) {
        overflow: visible;
      }

      .snap-section {
        height: auto;
        min-height: 80vh;
        scroll-snap-align: none;
      }

      .scroll-hint-arrow { animation: none; }
    }

    /* ─── Mobile: kleinere Abstände ─────────────────────────────────────── */
    @media (max-width: 640px) {
      .intro-eyebrow { top: 5rem; }
      .intro-content { padding-bottom: 3rem; }
      .kontakt-email { font-size: 1.25rem; }
    }
  </style>

  <script>
    function initHomePage() {
      // Hover-Preview für Projekte in Section 02
      const preview = document.getElementById('home-project-preview') as HTMLElement | null
      const previewImg = document.getElementById('home-preview-img') as HTMLImageElement | null

      if (preview && previewImg && window.matchMedia('(hover: hover)').matches && window.matchMedia('(min-width: 901px)').matches) {
        let switchTimer: ReturnType<typeof setTimeout> | null = null
        const lines = document.querySelectorAll<HTMLAnchorElement>('[data-preview]')

        lines.forEach((line) => {
          if (line.dataset.previewInit) return
          line.dataset.previewInit = '1'

          line.addEventListener('mouseenter', () => {
            const src = line.dataset.preview
            if (!src) return
            clearTimeout(switchTimer ?? undefined)
            if (previewImg.getAttribute('src') !== src) {
              preview.classList.remove('is-visible')
              switchTimer = setTimeout(() => {
                previewImg.src = src
                preview.classList.add('is-visible')
                switchTimer = null
              }, 80)
            } else {
              preview.classList.add('is-visible')
            }
          })

          line.addEventListener('mouseleave', () => {
            clearTimeout(switchTimer ?? undefined)
            switchTimer = null
            preview.classList.remove('is-visible')
          })
        })
      }
    }

    document.addEventListener('astro:page-load', initHomePage)
  </script>
  ```

- [ ] **Schritt 3: Build-Check**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr && npm run build 2>&1 | tail -8
  ```

  Erwartetes Ergebnis: `[build] Complete!` ohne TypeScript-Fehler.

  Häufige Fehler und Lösungen:
  - `post.data.date` nicht vorhanden: `post.data.pubDate` probieren oder die Blog-Collection-Schema-Datei lesen
  - `blog`-Collection leer: sicherstellen dass `getCollection('blog')` die richtige Collection-ID verwendet (ggf. `posts` statt `blog`)
  - TypeScript-Fehler bei `coverImage`: `project.data.coverImage ?? undefined` verwenden

- [ ] **Schritt 4: Commit**

  ```bash
  git add src/pages/index.astro
  git commit -m "feat: Homepage Scroll-Snap — 4 Sections (Intro/Arbeit/Gedanken/Kontakt), 100dvh, Scroll-Hint"
  ```

---

### Task 3: SectionIndicator integrieren + Scroll-Hint animieren

**Files:**
- Modify: `src/pages/index.astro` (falls Integration in Task 2 noch fehlt)
- Verify: `src/components/astro/SectionIndicator.astro`

- [ ] **Schritt 1: Sicherstellen dass SectionIndicator korrekt im Slot eingebunden ist**

  In `index.astro` muss `<SectionIndicator sections={homeSections} />` AUSSERHALB des `.scroll-container` aber innerhalb des BaseLayout-Slots stehen. Das ist in Task 2 bereits enthalten. Prüfe:

  ```bash
  grep -n "SectionIndicator" /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr/src/pages/index.astro
  ```

  Erwartetes Ergebnis: Zeile mit `import SectionIndicator` und Zeile mit `<SectionIndicator sections={homeSections} />`.

- [ ] **Schritt 2: Manuelle Verifikation im Browser**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr && npm run dev
  ```

  Prüfen:
  1. Section-Indikator sichtbar rechts (Desktop)
  2. Scroll-Snap funktioniert (Section rastet ein)
  3. Indikator zeigt aktive Section (Nummer + Linie + Label)
  4. Klick auf Indikator-Button scrollt zur Section
  5. Scroll-Hint-Pfeil animiert in Section 01
  6. Hover-Preview in Section 02 funktioniert
  7. Mobile (< 640px): kein Indikator, normales Scroll-Snap

- [ ] **Schritt 3: Finaler Build + Push**

  ```bash
  npm run build 2>&1 | tail -5
  git add src/pages/index.astro src/components/astro/SectionIndicator.astro
  git commit -m "feat: SectionIndicator integriert — Navigation zwischen Scroll-Snap-Sections"
  git push origin main
  ```

---

## Verifikation nach Deployment

Auf ptrckschrdtr.de prüfen:

1. **Section 01 Intro** — HeroMesh im Hintergrund, großes t-hero Heading unten, Scroll-Hint
2. **Section 02 Arbeit** — 3 Featured Projekte als Textliste, Hover-Preview rechts
3. **Section 03 Gedanken** — 3 neueste Artikel als Textliste  
4. **Section 04 Kontakt** — großes Heading + klickbare E-Mail
5. **SectionIndicator** — aktive Section hervorgehoben, Klick scrollt zur Section
6. **Mobile** — Scroll-Snap funktioniert, kein SectionIndicator sichtbar
7. **prefers-reduced-motion** — normaler Dokumentenfluss ohne Snap
