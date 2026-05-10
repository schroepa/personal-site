# Vollbreiten-Grid-Layout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `max-w-5xl mx-auto` sitewide durch ein echtes Vollbreiten-Grid ersetzen — `100vw` mit `clamp()`-basiertem Padding, Fließtext auf maximal 800px begrenzt, aber linksbündig (nicht zentriert).

**Architecture:** Ein neues `--grid-pad` CSS-Token definiert konsistentes horizontales Padding über alle Breakpoints. `.page-grid` ersetzt die bisherigen `px-6`-Container ohne Max-Width. `.prose-col` begrenzt Fließtext auf 800px — linksbündig, kein `margin: auto`. Bilder und Überschriften können über 800px hinausgehen. Es werden 8 Seiten und 2 Layouts angepasst — keine neuen Dateien.

**Tech Stack:** CSS Custom Properties, `clamp()`, Tailwind v4 (für verbleibende Utility-Klassen).

**Grid-Prinzip:**
```
--grid-pad: clamp(20px, 5vw, 96px)

320px:  pad=20px  → content=280px
768px:  pad=38px  → content=692px
1280px: pad=64px  → content=1152px  (Fließtext: max 800px, Ma rechts: ~352px)
1920px: pad=96px  → content=1728px  (Fließtext: max 800px, Ma rechts: ~928px)
```

---

## Dateistruktur

| Aktion | Datei | Zweck |
|---|---|---|
| Modify | `src/styles/global.css` | `--grid-pad`, `.page-grid`, `.prose-col` |
| Modify | `src/layouts/BaseLayout.astro` | Footer-Container |
| Modify | `src/layouts/PostLayout.astro` | Artikel-Container |
| Modify | `src/pages/index.astro` | Hero-Section |
| Modify | `src/pages/about.astro` | Alle Sections |
| Modify | `src/pages/blog/index.astro` | Liste |
| Modify | `src/pages/projects/index.astro` | Index + Preview |
| Modify | `src/pages/impressum.astro` | Text |
| Modify | `src/pages/datenschutz.astro` | Text |

---

### Task 1: Grid-CSS-Variablen und Utility-Klassen

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Schritt 1: Grid-Tokens am Ende von `:root` (Typografie-Block) ergänzen**

  Im zweiten `:root { }` Block (der mit `--text-xs`, `--text-sm` etc.) folgende Zeilen am Ende hinzufügen:

  ```css
  /* ── Grid-System ─────────────────────────────────────────────────── */
  --grid-pad: clamp(20px, 5vw, 96px);  /* horizontales Padding, viewport-relativ */
  --text-max: 800px;                    /* max. Zeilenlänge für Fließtext */
  ```

- [ ] **Schritt 2: Globale Layout-Klassen hinzufügen**

  Am Ende von `global.css`, nach dem letzten bestehenden Block, hinzufügen:

  ```css
  /* ─── Layout-Utilities ──────────────────────────────────────────────────── */

  /* Vollbreiten-Container: 100vw mit konsistentem Padding */
  .page-grid {
    width: 100%;
    padding-left: var(--grid-pad);
    padding-right: var(--grid-pad);
  }

  /* Fließtext-Spalte: max 800px, linksbündig (KEIN margin: auto) */
  .prose-col {
    max-width: var(--text-max);
  }

  /* Weite Spalte: z.B. für Artikel-Bilder, Tabellen, Projekte-Listen */
  .wide-col {
    max-width: min(100%, 1200px);
  }
  ```

- [ ] **Schritt 3: Build-Check**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr && npm run build 2>&1 | tail -5
  ```

  Erwartetes Ergebnis: `[build] Complete!`

- [ ] **Schritt 4: Commit**

  ```bash
  git add src/styles/global.css
  git commit -m "feat: Grid-System — --grid-pad clamp(), .page-grid, .prose-col Utilities"
  ```

---

### Task 2: Layouts anpassen (BaseLayout Footer + PostLayout)

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/layouts/PostLayout.astro`

- [ ] **Schritt 1: BaseLayout.astro — Footer-Container anpassen**

  Im Footer (aktuell `<footer class="mt-24 px-6 py-12">`):

  ```html
  <!-- Vorher: -->
  <footer class="mt-24 px-6 py-12">
    <div class="mx-auto flex max-w-5xl items-center justify-between gap-8 flex-wrap">

  <!-- Nachher: -->
  <footer class="mt-24 py-12 page-grid">
    <div class="flex items-center justify-between gap-8 flex-wrap">
  ```

  Das `px-6` fällt weg (`.page-grid` übernimmt das Padding). Das innere `max-w-5xl mx-auto` wird zum einfachen `flex`-Container.

- [ ] **Schritt 2: PostLayout.astro — Artikel-Container anpassen**

  Im PostLayout.astro den Content-Container ändern:

  ```html
  <!-- Vorher: -->
  <div class="mx-auto max-w-5xl px-6">

  <!-- Nachher: -->
  <div class="page-grid">
  ```

  Im PostLayout.astro die `article-header`-CSS-Klasse anpassen (in `<style>`):

  ```css
  /* Vorher: */
  .article-header {
    max-width: 42rem;
    margin-bottom: 3rem;
    padding-top: 0.5rem;
  }

  /* Nachher: */
  .article-header {
    max-width: var(--text-max);   /* 800px statt 42rem=672px */
    margin-bottom: 3rem;
    padding-top: 0.5rem;
  }
  ```

  Im PostLayout.astro die `article-prose`-Begrenzung in `prose.css` berücksichtigen: dort ist `.article-prose > p, h1, h2...` auf `42rem` begrenzt. Diese Zeile in `prose.css` auf `var(--text-max)` ändern:

  In `src/styles/prose.css`:
  ```css
  /* Vorher: */
  .article-prose > p,
  .article-prose > h1,
  .article-prose > h2,
  .article-prose > h3,
  .article-prose > h4,
  .article-prose > ul,
  .article-prose > ol,
  .article-prose > blockquote,
  .article-prose > pre,
  .article-prose > hr,
  .article-prose > table {
    max-width: 42rem;
  }

  /* Nachher: */
  .article-prose > p,
  .article-prose > h1,
  .article-prose > h2,
  .article-prose > h3,
  .article-prose > h4,
  .article-prose > ul,
  .article-prose > ol,
  .article-prose > blockquote,
  .article-prose > pre,
  .article-prose > hr,
  .article-prose > table {
    max-width: var(--text-max);  /* 800px */
  }
  ```

- [ ] **Schritt 3: Build-Check**

  ```bash
  npm run build 2>&1 | tail -5
  ```

  Erwartetes Ergebnis: `[build] Complete!`

- [ ] **Schritt 4: Commit**

  ```bash
  git add src/layouts/BaseLayout.astro src/layouts/PostLayout.astro src/styles/prose.css
  git commit -m "feat: Layouts auf .page-grid umgestellt — kein max-w-5xl mx-auto mehr"
  ```

---

### Task 3: Content-Seiten auf Vollbreiten-Grid umstellen

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/about.astro`
- Modify: `src/pages/blog/index.astro`
- Modify: `src/pages/projects/index.astro`
- Modify: `src/pages/impressum.astro`
- Modify: `src/pages/datenschutz.astro`

In jeder Datei müssen folgende Muster ersetzt werden:

**Muster A** — Äußerer Container mit px-6 + inneres max-w:
```html
<!-- Vorher: -->
<div class="px-6 pt-24 pb-32">
  <div class="max-w-5xl mx-auto">
    ...
  </div>
</div>

<!-- Nachher: -->
<div class="page-grid pt-24 pb-32">
  ...
</div>
```

**Muster B** — Fließtext-Blöcke (Absätze, Lead-Texte):
```html
<!-- Vorher: -->
<p class="t-lead text-muted-foreground">...</p>

<!-- Nachher: -->
<p class="t-lead text-muted-foreground prose-col">...</p>
```

**Muster C** — max-w-2xl auf Text-Divs:
```html
<!-- Vorher: -->
<div class="max-w-2xl">...</div>

<!-- Nachher: -->
<div class="prose-col">...</div>
```

- [ ] **Schritt 1: `src/pages/index.astro` anpassen**

  Hero-Section: `px-6 pt-32 pb-24` → `page-grid pt-24 pb-24` (pt-32 wurde bereits auf pt-24 geändert).
  Inneres `max-w-5xl mx-auto` entfernen falls vorhanden.
  Lead-Texte: `.prose-col` ergänzen.

- [ ] **Schritt 2: `src/pages/about.astro` anpassen**

  Äußerer Wrapper: `mx-auto max-w-5xl px-6 pt-32 pb-20` → `page-grid pt-24 pb-20` (ggf. pt-24 schon gesetzt).
  Alle inneren `max-w-2xl` → `prose-col`.
  Alle Section-Wrapper: `mx-auto max-w-5xl px-6 pb-20` → `page-grid pb-20`.

- [ ] **Schritt 3: `src/pages/blog/index.astro` anpassen**

  ```html
  <!-- Vorher: -->
  <div class="px-6 pt-24 pb-24">
    <div class="max-w-5xl mx-auto">

  <!-- Nachher: -->
  <div class="page-grid pt-24 pb-24">
  ```

  Header-Text `t-lead`: `class="prose-col"` ergänzen.

- [ ] **Schritt 4: `src/pages/projects/index.astro` anpassen**

  ```html
  <!-- Vorher: -->
  <div class="px-6 pt-24 pb-32">
    <div class="max-w-5xl mx-auto">

  <!-- Nachher: -->
  <div class="page-grid pt-24 pb-32">
  ```

  Header-Lead: `class="prose-col"` ergänzen.

- [ ] **Schritt 5: `src/pages/impressum.astro` und `src/pages/datenschutz.astro` anpassen**

  Beide haben ähnliche Struktur. Äußerer Container + inneres max-w → `.page-grid`. Fließtext-Blöcke → `.prose-col`.

- [ ] **Schritt 6: Build-Check**

  ```bash
  npm run build 2>&1 | tail -5
  ```

  Erwartetes Ergebnis: `[build] Complete!` — alle Seiten bauen ohne Fehler.

- [ ] **Schritt 7: Commit + Push**

  ```bash
  git add src/pages/index.astro src/pages/about.astro src/pages/blog/index.astro \
    src/pages/projects/index.astro src/pages/impressum.astro src/pages/datenschutz.astro
  git commit -m "feat: Vollbreiten-Grid sitewide — max-w-5xl entfernt, .page-grid + .prose-col"
  git push origin main
  ```
