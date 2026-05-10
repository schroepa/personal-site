# Corner-Navigation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Den fixen Header-Balken durch eine dezentrale Corner-Navigation ersetzen — Logo oben links, Nav-Links oben rechts, kein Hamburger-Menü, kein Overlay.

**Architecture:** Einzige Datei: `src/layouts/BaseLayout.astro`. Der komplette `<header>`-Block (Zeilen ~143–188), das Full-Screen-Overlay (~190–208), der `initHamburger()`-Aufruf im Script-Block und der gesamte Hamburger/Overlay-CSS-Block (~288–405) werden entfernt. An ihrer Stelle kommen zwei `position: fixed`-Elemente: `.corner-logo` (oben links) und `.corner-nav` (oben rechts). Kein JS nötig. Alle Content-Seiten mit `pt-32` werden auf `pt-24` reduziert.

**Tech Stack:** Astro, Tailwind v4, CSS Custom Properties. Kein JS für die Navigation.

---

## Dateistruktur

| Aktion | Datei | Zweck |
|---|---|---|
| Modify | `src/layouts/BaseLayout.astro` | Header → Corner-Nav, Overlay + Hamburger-JS entfernen |
| Modify | `src/pages/index.astro` | `pt-32` → `pt-24` |
| Modify | `src/pages/about.astro` | `pt-32` → `pt-24` |
| Modify | `src/pages/blog/index.astro` | `pt-32` → `pt-24` |
| Modify | `src/pages/projects/index.astro` | `pt-32` → `pt-24` |
| Modify | `src/pages/impressum.astro` | `pt-32` → `pt-24` |
| Modify | `src/pages/datenschutz.astro` | `pt-32` → `pt-24` |

---

### Task 1: Corner-Navigation in BaseLayout.astro implementieren

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Schritt 1: Header-Block und Overlay entfernen**

  Den gesamten `<header>...</header>` Block (inklusive des Full-Screen-Overlays `<div id="nav-overlay">...</div>`) aus dem `<body>` entfernen und durch die neue Corner-Nav-Struktur ersetzen.

  Der **alte Block** (alles zwischen `<!-- Header -->` und `<!-- Main content -->`) wird vollständig ersetzt durch:

  ```html
  <!-- ── Corner: Logo oben links ──────────────────────────────────── -->
  <div class="corner-logo">
    <a
      href="/"
      class="corner-logo-link"
      data-magnetic
      data-cursor="link"
      aria-label="Startseite"
    >
      PTRCKSCHRDTR
    </a>
  </div>

  <!-- ── Corner: Navigation oben rechts ──────────────────────────── -->
  <nav class="corner-nav" aria-label="Hauptnavigation">
    {navLinks.map((link) => (
      <a
        href={link.href}
        class="corner-nav-link"
        data-cursor="link"
      >
        {link.label}
      </a>
    ))}
  </nav>
  ```

- [ ] **Schritt 2: `initHamburger()`-Aufruf aus dem Script-Block entfernen**

  Im `<script>`-Block in BaseLayout.astro den Aufruf `initHamburger()` sowie die gesamte `function initHamburger() { ... }` Funktion entfernen.

  Der Script-Block soll danach so aussehen:

  ```ts
  import { initMagneticButtons } from "@/scripts/magnetic"
  import { initTextReveal } from "@/scripts/textReveal"
  import { initScrollAnimations } from "@/scripts/scrollAnimations"

  document.addEventListener("astro:page-load", () => {
    initMagneticButtons()
    initTextReveal()
    initScrollAnimations()
  })
  ```

- [ ] **Schritt 3: Hamburger- und Overlay-CSS entfernen, Corner-Nav-CSS hinzufügen**

  Im `<style>`-Block in BaseLayout.astro den gesamten alten CSS-Inhalt (Hamburger Icon, Full-Screen Overlay, `@media (max-width: 767px)` Regel für `.nav-toggle`) entfernen und durch den folgenden CSS ersetzen:

  ```css
  /* ── Corner-Logo: oben links ─────────────────────────────────────────── */
  .corner-logo {
    position: fixed;
    top: 2rem;
    left: 2.5rem;
    z-index: 60;
  }

  .corner-logo-link {
    font-size: var(--text-sm);
    font-weight: 500;
    letter-spacing: var(--tracking-wide);
    color: var(--foreground);
    text-decoration: none;
    transition: opacity 200ms ease;
  }

  .corner-logo-link:hover {
    opacity: 0.5;
  }

  /* ── Corner-Nav: oben rechts ─────────────────────────────────────────── */
  .corner-nav {
    position: fixed;
    top: 2rem;
    right: 2.5rem;
    z-index: 60;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 2rem;
  }

  .corner-nav-link {
    font-size: var(--text-sm);
    color: var(--muted-foreground);
    text-decoration: none;
    transition: color 200ms ease;
  }

  .corner-nav-link:hover {
    color: var(--foreground);
  }

  /* ── Mobile: kompakter, gestapelt ───────────────────────────────────── */
  @media (max-width: 640px) {
    .corner-logo {
      top: 1.5rem;
      left: 1.5rem;
    }

    .corner-nav {
      top: 1.5rem;
      right: 1.5rem;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.375rem;
    }

    .corner-nav-link {
      font-size: var(--text-xs);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .corner-logo-link,
    .corner-nav-link {
      transition: none;
    }
  }
  ```

- [ ] **Schritt 4: Build-Check**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr && npm run build 2>&1 | tail -8
  ```

  Erwartetes Ergebnis: `[build] Complete!` ohne Fehler.

- [ ] **Schritt 5: Commit**

  ```bash
  git add src/layouts/BaseLayout.astro
  git commit -m "feat: Corner-Navigation — Header-Balken entfernt, Logo oben links, Nav oben rechts"
  ```

---

### Task 2: Top-Padding auf Content-Seiten anpassen

**Files:**
- Modify: `src/pages/index.astro` (Zeile ~38: `pt-32` → `pt-24`)
- Modify: `src/pages/about.astro` (Zeile ~15: `pt-32` → `pt-24`)
- Modify: `src/pages/blog/index.astro` (Zeile ~15: `pt-32` → `pt-24`)
- Modify: `src/pages/projects/index.astro` (Zeile ~19: `pt-32` → `pt-24`)
- Modify: `src/pages/impressum.astro` (Zeile ~9: `pt-32` → `pt-24`)
- Modify: `src/pages/datenschutz.astro` (Zeile ~9: `pt-32` → `pt-24`)

Hintergrund: `pt-32` (128px) war nötig um den ~72px hohen fixen Header-Balken freizuhalten. Die neue Corner-Nav ist kein Balken — sie nimmt nur ~50px ein (2rem top + Texthöhe). `pt-24` (96px) gibt 46px Luft unter der Corner-Nav. Das entspricht dem Ma-Prinzip (intentioneller Leerraum, aber nicht übermäßig).

- [ ] **Schritt 1: Alle 6 Seiten per sed aktualisieren**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr
  
  sed -i '' 's/pt-32/pt-24/g' \
    src/pages/index.astro \
    src/pages/about.astro \
    src/pages/blog/index.astro \
    src/pages/projects/index.astro \
    src/pages/impressum.astro \
    src/pages/datenschutz.astro
  ```

- [ ] **Schritt 2: Verifikation — kein pt-32 übrig auf Content-Seiten**

  ```bash
  grep -rn "pt-32" src/pages/ --include="*.astro"
  ```

  Erwartetes Ergebnis: Keine Ausgabe (oder nur Treffer in PostLayout-basierten Seiten, die kein pt-32 direkt verwenden).

- [ ] **Schritt 3: Build-Check**

  ```bash
  npm run build 2>&1 | tail -5
  ```

  Erwartetes Ergebnis: `[build] Complete!`

- [ ] **Schritt 4: Commit + Push**

  ```bash
  git add src/pages/index.astro src/pages/about.astro src/pages/blog/index.astro \
    src/pages/projects/index.astro src/pages/impressum.astro src/pages/datenschutz.astro
  git commit -m "fix: pt-32 → pt-24 auf Content-Seiten (keine feste Header-Bar mehr)"
  git push origin main
  ```
