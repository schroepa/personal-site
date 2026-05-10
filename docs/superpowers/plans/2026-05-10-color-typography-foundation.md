# Farb- und Typografie-Fundament — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das Farbsystem von shadcn-Standard (grünliche Hue 107) auf eine warme, druckähnliche Palette (Hue 75) umstellen und die Headline-Typografie auf `clamp()` umstellen, damit sie auf allen Viewport-Größen proportional skaliert.

**Architecture:** Zwei Dateien: `global.css` erhält neue OKLCH-Farbwerte (Warm-Near-Black statt Digital-Black) sowie Grid-CSS-Variablen. `typography.css` erhält `clamp()`-basierte Headline-Größen. Body-Text bleibt bei fixen Werten (Lesbarkeit). Kein JS.

**Tech Stack:** CSS Custom Properties, OKLCH Farbraum, CSS `clamp()`.

**Farbphilosophie:**
- Hintergrund: `oklch(1 0 0)` = reines Weiß (Papier)
- Schrift: `oklch(0.15 0.005 75)` = warmes Tief-Dunkel (~#211F1D), 16:1 Kontrast gegen Weiß (WCAG AAA)
- Hue 75° = Richtung Druckfarbe/Tinte, kein digitaler Blau- oder Grünstich

---

## Dateistruktur

| Aktion | Datei | Zweck |
|---|---|---|
| Modify | `src/styles/global.css` | Farbsystem neu, Grid-Variablen |
| Modify | `src/styles/typography.css` | Headline-Skala mit `clamp()` |

---

### Task 1: Farbsystem auf warme Palette umstellen

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Schritt 1: `:root`-Farbwerte ersetzen**

  Den kompletten `:root { }` Farbblock (NICHT den zweiten `:root {}` mit den Text-Tokens) durch folgenden Inhalt ersetzen:

  ```css
  :root {
      /* ── Warm Near-Black Palette ─────────────────────────────────────── */
      /* Hintergrund: reines Weiß */
      --background: oklch(1 0 0);
      /* Schrift: warmes Tief-Dunkel, ~#211F1D, 16:1 Kontrast */
      --foreground: oklch(0.15 0.005 75);

      /* Cards: identisch mit background — Cards sind unsichtbar */
      --card: oklch(1 0 0);
      --card-foreground: oklch(0.15 0.005 75);
      --popover: oklch(1 0 0);
      --popover-foreground: oklch(0.15 0.005 75);

      /* Primary: etwas dunkler als foreground, für Buttons */
      --primary: oklch(0.18 0.006 75);
      --primary-foreground: oklch(1 0 0);

      /* Secondary / Muted: sehr helles Warm-Grau */
      --secondary: oklch(0.96 0.003 75);
      --secondary-foreground: oklch(0.15 0.005 75);
      --muted: oklch(0.96 0.003 75);
      /* Sekundärer Text: mittleres Warm-Grau */
      --muted-foreground: oklch(0.50 0.007 75);

      /* Accent */
      --accent: oklch(0.96 0.003 75);
      --accent-foreground: oklch(0.15 0.005 75);

      /* Destructive: unverändert */
      --destructive: oklch(0.577 0.245 27.325);

      /* Border / Input: sehr subtil, gleiche Warmton-Richtung */
      --border: oklch(0.90 0.004 75);
      --input: oklch(0.90 0.004 75);
      --ring: oklch(0.70 0.005 75);

      /* Charts: Warm-Grau-Skala */
      --chart-1: oklch(0.90 0.004 75);
      --chart-2: oklch(0.50 0.007 75);
      --chart-3: oklch(0.40 0.006 75);
      --chart-4: oklch(0.30 0.005 75);
      --chart-5: oklch(0.22 0.005 75);

      --radius: 0.45rem;

      /* Sidebar: identische Palette */
      --sidebar: oklch(0.96 0.003 75);
      --sidebar-foreground: oklch(0.15 0.005 75);
      --sidebar-primary: oklch(0.18 0.006 75);
      --sidebar-primary-foreground: oklch(1 0 0);
      --sidebar-accent: oklch(0.96 0.003 75);
      --sidebar-accent-foreground: oklch(0.15 0.005 75);
      --sidebar-border: oklch(0.90 0.004 75);
      --sidebar-ring: oklch(0.70 0.005 75);
  }
  ```

- [ ] **Schritt 2: `.dark` Farbwerte anpassen**

  Den `.dark { }` Block durch folgenden Inhalt ersetzen:

  ```css
  .dark {
      --background: oklch(0.14 0.004 75);
      --foreground: oklch(0.97 0.003 75);
      --card: oklch(0.18 0.005 75);
      --card-foreground: oklch(0.97 0.003 75);
      --popover: oklch(0.18 0.005 75);
      --popover-foreground: oklch(0.97 0.003 75);
      --primary: oklch(0.92 0.004 75);
      --primary-foreground: oklch(0.18 0.005 75);
      --secondary: oklch(0.24 0.005 75);
      --secondary-foreground: oklch(0.97 0.003 75);
      --muted: oklch(0.24 0.005 75);
      --muted-foreground: oklch(0.65 0.006 75);
      --accent: oklch(0.24 0.005 75);
      --accent-foreground: oklch(0.97 0.003 75);
      --destructive: oklch(0.704 0.191 22.216);
      --border: oklch(1 0 0 / 10%);
      --input: oklch(1 0 0 / 15%);
      --ring: oklch(0.60 0.005 75);
      --chart-1: oklch(0.88 0.004 75);
      --chart-2: oklch(0.65 0.006 75);
      --chart-3: oklch(0.50 0.007 75);
      --chart-4: oklch(0.35 0.005 75);
      --chart-5: oklch(0.25 0.005 75);
      --sidebar: oklch(0.18 0.005 75);
      --sidebar-foreground: oklch(0.97 0.003 75);
      --sidebar-primary: oklch(0.488 0.243 264.376);
      --sidebar-primary-foreground: oklch(0.97 0.003 75);
      --sidebar-accent: oklch(0.24 0.005 75);
      --sidebar-accent-foreground: oklch(0.97 0.003 75);
      --sidebar-border: oklch(1 0 0 / 10%);
      --sidebar-ring: oklch(0.60 0.005 75);
  }
  ```

- [ ] **Schritt 3: Mesh-Tokens in Warmton anpassen**

  Den Mesh-Block aktualisieren (bisher neutralisiert, jetzt konsistent mit neuem Warmton):

  ```css
  /* ─── Mesh Color Tokens ──────────────────────────────────────────────────── */
  /* Monochrom-Prinzip: kaum Chroma, gleiche Warmton-Richtung wie Farbsystem */
  :root {
    --mesh-warm: oklch(0.91 0.005 75);
    --mesh-cool: oklch(0.88 0.004 90);
  }

  .dark {
    --mesh-warm: oklch(0.22 0.005 75);
    --mesh-cool: oklch(0.20 0.004 90);
  }
  ```

- [ ] **Schritt 4: Build-Check**

  ```bash
  cd /Users/ptrck/Documents/personal-site-ptrckschrdtr/personal-site-ptrckschrdtr && npm run build 2>&1 | tail -5
  ```

  Erwartetes Ergebnis: `[build] Complete!`

- [ ] **Schritt 5: Commit**

  ```bash
  git add src/styles/global.css
  git commit -m "feat: Farbsystem — warme Tief-Dunkel-Palette (Hue 75, ~#211F1D) statt digitalem Grünstich"
  ```

---

### Task 2: Headline-Typografie mit `clamp()` skalieren

**Files:**
- Modify: `src/styles/typography.css`

Kontext: Body-Text (`t-body`, `t-small`, `t-label`) bleibt bei fixen Werten (Lesbarkeit). Nur Display-Klassen (`t-hero`, `t-h1`, `t-h2`, `t-h3`) werden mit `clamp()` viewport-relativ.

`clamp(MIN, VAL, MAX)`:
- `t-hero`: auf 1280px = 89.6px, auf 1920px = 134px (gekappt bei 9rem = 144px)
- `t-h1`: auf 1280px = 57.6px, auf 1920px = 86.4px (gekappt bei 5rem = 80px)

- [ ] **Schritt 1: `typography.css` komplett ersetzen**

  ```css
  /* ─── Semantic Typography Classes ─────────────────────────────────────────── */

  /* ── Display: clamp() — skaliert proportional mit dem Viewport ─────────────── */

  .t-hero {
    /* Mobile ~49px → Desktop 1280px ~90px → Wide 1920px 144px */
    font-size: clamp(3.052rem, 7vw, 9rem);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-tight);
    font-weight: 500;
  }

  .t-h1 {
    /* Mobile ~39px → Desktop 1280px ~58px → Wide 1920px 80px */
    font-size: clamp(2.441rem, 4.5vw, 5rem);
    line-height: var(--leading-tight);
    letter-spacing: var(--tracking-tight);
    font-weight: 500;
  }

  .t-h2 {
    /* Mobile ~31px → Desktop 1280px ~40px → Wide 1920px 48px */
    font-size: clamp(1.953rem, 3vw, 3rem);
    line-height: var(--leading-snug);
    letter-spacing: var(--tracking-snug);
    font-weight: 500;
  }

  .t-h3 {
    /* Mobile ~25px → Desktop 1280px ~29px → Wide 1920px 36px */
    font-size: clamp(1.563rem, 2.2vw, 2.25rem);
    line-height: var(--leading-snug);
    letter-spacing: var(--tracking-normal);
    font-weight: 500;
  }

  /* ── Text: fix — Lesbarkeit hat Vorrang vor Skalierung ─────────────────────── */

  .t-lead {
    /* Leicht größer als body, max. 20px */
    font-size: clamp(1.125rem, 1.2vw, 1.25rem);
    line-height: var(--leading-normal);
    letter-spacing: var(--tracking-normal);
    font-weight: 400;
  }

  .t-body {
    font-size: 1rem;
    line-height: var(--leading-normal);
    font-weight: 400;
  }

  .t-small {
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
    font-weight: 400;
  }

  .t-label {
    font-size: var(--text-xs);
    line-height: var(--leading-normal);
    letter-spacing: var(--tracking-wide);
    font-weight: 500;
    text-transform: uppercase;
  }

  .t-mono {
    font-size: var(--text-sm);
    font-family: var(--font-mono);
    line-height: var(--leading-normal);
  }

  .t-prose {
    max-width: 65ch;
    font-size: 1rem;
    line-height: var(--leading-loose);
  }
  ```

- [ ] **Schritt 2: Build-Check**

  ```bash
  npm run build 2>&1 | tail -5
  ```

  Erwartetes Ergebnis: `[build] Complete!`

- [ ] **Schritt 3: Commit + Push**

  ```bash
  git add src/styles/typography.css
  git commit -m "feat: Headline-Typografie mit clamp() — viewport-proportionale Skalierung"
  git push origin main
  ```
