# ptrckschrdtr.de — Design Styleguide

**Status:** Living document  
**Letzte Aktualisierung:** 2026-05-10  
**Grundprinzip:** Schweizer Typografie. Hierarchie durch Abstand und Schrift — nicht durch Farbe, Rahmen oder dekorative Elemente.

---

## 1. Philosophie

### Schweizer Typografie (Swiss International Typographic Style)

Dieses Projekt folgt konsequent den Prinzipien des Schweizer Stils:

- **Keine dekorativen Borders.** Trennlinien existieren nur als strukturelle 1px-Linien mit 8% Opacity.
- **Keine Karten.** Cards mit Hintergrundfarbe, Schatten oder Rahmen sind verboten. Inhalte stehen direkt auf dem Hintergrund.
- **Keine Pills und Badges mit Hintergrund.** Tags und Labels sind plain text — uppercase, klein, letter-spaced.
- **Hierarchie durch Typografie.** Größe, Gewicht, Farbe (foreground vs. muted-foreground) und Abstand schaffen Struktur.
- **Bilder als visuelle Anker.** Fotos und Illustrationen ersetzen dekorative Gestaltung. Sie sind immer full-width innerhalb ihres Containers — nie in Thumbnails eingezwängt (außer in der Artikel-Navigation, wo 16:9 gilt).
- **Bewegung mit Zurückhaltung.** Animationen unterstützen den Inhalt, lenken nicht ab. Subtil, physikalisch, zielgerichtet.

---

## 2. Farben

Alle Farben kommen aus CSS Custom Properties — keine hardcodierten Hex-Werte.

### System-Tokens (shadcn/ui-basiert)

| Token | Verwendung |
|---|---|
| `var(--background)` | Seitenhintergrund |
| `var(--foreground)` | Primärer Text, Icons |
| `var(--muted-foreground)` | Sekundärer Text, Labels, Meta |
| `var(--muted)` | Sehr subtile Flächen (Platzhalter-Hintergründe) |
| `var(--card)` | Identisch mit `--background` — Cards sind unsichtbar |
| `var(--border)` | Strukturlinien (sparsam verwenden) |

### Mesh-Gradient-Tokens

| Token | Verwendung |
|---|---|
| `var(--mesh-warm)` | Warmer Orb im HeroMesh + Cover-Placeholdern |
| `var(--mesh-cool)` | Kühler Orb — Ergänzung zu `--mesh-warm` |

### Trennlinie

```css
border-top: 1px solid color-mix(in oklch, var(--foreground) 8%, transparent);
```

Diese Formel wird überall einheitlich verwendet: Blog-Liste, Timeline, Footer-Divider.

---

## 3. Typografie

**Font:** Geist Variable (Sans) + Geist Mono (Code)  
**Bezug:** `@fontsource-variable/geist` (npm, kein CDN)

### Klassen-System

```
t-hero      — Headline auf Startseite / großes Statement
t-h1        — Artikel-Titel
t-h2        — Abschnittsüberschriften
t-h3        — Sub-Überschriften
t-lead      — Einleitungstext (etwas größer als body)
t-body      — Fließtext
t-small     — Metadaten, Caption
t-label     — Section-Label (UPPERCASE, letter-spaced)
t-prose     — Markdown-Content-Block
```

### Skalierung (Major Third — 1.25)

```
--text-xs:   0.75rem   (12px)
--text-sm:   0.875rem  (14px)
--text-base: 1rem      (16px)
--text-md:   1.125rem  (18px)
--text-lg:   1.25rem   (20px)
--text-xl:   1.5625rem (25px)
--text-2xl:  1.953rem  (31px)
--text-3xl:  2.441rem  (39px)
--text-4xl:  3.052rem  (49px)
--text-5xl:  3.815rem  (61px)
```

### Grundregeln

- Headlines: `font-weight: 500` — nie 700 oder bold
- Fließtext: `font-weight: 400`, `line-height: var(--leading-loose)` (1.75)
- Labels: immer `text-transform: uppercase; letter-spacing: var(--tracking-wide)`
- Muted Text (`--muted-foreground`) für alle sekundären Informationen

---

## 4. Spacing & Layout

**Max-Width-System:**

| Klasse | Verwendung |
|---|---|
| `max-w-5xl` (64rem) | Haupt-Container — Navigation, Artikel, Seitencontainer |
| `max-w-2xl` (42rem) | Text-Inhalt — Artikel-Body, About-Narrativ |
| `max-w-none` | Bilder, die aus dem Text-Container ausbrechen |

**Seiten-Padding:** `px-6` (24px) auf allen Seiten konsistent.

**Vertikaler Rhythmus:**

- Section-Gap: `pb-20` (5rem) zwischen Haupt-Abschnitten
- Element-Gap: `mb-8` (2rem) zwischen Textblöcken
- Label-zu-Inhalt: `mb-4` oder `mb-10` je nach Größe des Abschnitts

---

## 5. Interaktive Elemente

### Links

```css
/* Standard-Link im Fließtext */
color: var(--foreground);
text-decoration: underline;
text-decoration-color: var(--border);
text-underline-offset: 3px;
transition: text-decoration-color 200ms ease;

/* Hover */
text-decoration-color: var(--foreground);
```

### Navigation-Links (Header)

```css
color: var(--muted-foreground);
transition: color 200ms ease;

/* Hover */
color: var(--foreground);
```

### Tertiary Links (Footer, Meta)

```css
/* Icon + Text inline, kein Rahmen, kein Hintergrund */
color: var(--muted-foreground);
transition: color 200ms ease;

/* Hover */
color: var(--foreground);
```

**Verboten:** `border: 1px solid` auf Links. `background: var(--card)` auf Links. `border-radius` auf Link-Containern.

### Primärer Button (CTA)

Der einzige echte Button mit Hintergrund ist der primäre CTA (`<Button>` aus shadcn/ui). Er hat:
- `background: var(--foreground)`, `color: var(--background)`
- `data-magnetic` für den Magneteffekt
- Nur auf About-Seite und expliziten CTA-Bereichen

---

## 6. Bilder & Medien

### Inline-Bilder in Artikeln

```css
/* Bricht aus max-w-2xl auf volle max-w-5xl aus */
.article-prose > p:has(> img:only-child) {
  max-width: none;
}
.article-prose img {
  width: 100%;
  height: auto;
  display: block;
}
```

**Kein `object-fit: cover` auf Inline-Bildern.** Bilder zeigen sich in natürlichen Proportionen.

### Cover-Bilder (Artikel/Projekte)

```css
height: 55vh;
min-height: 300px;
max-height: 600px;
object-fit: cover;
object-position: center;
```

### Prev/Next-Thumbnails

```css
aspect-ratio: 16 / 9;
object-fit: cover;
/* Kein border-radius, kein border */
```

### Portrait (About-Seite)

```css
aspect-ratio: 3 / 4;
object-fit: cover;
object-position: center top;
```

---

## 7. Tags & Labels

### Richtig — Plain Text

```html
<span class="pn-tag">DESIGN</span>
```

```css
.pn-tag {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--muted-foreground);
  /* Kein background, kein border, kein border-radius */
}
```

### Verboten

```css
/* NICHT verwenden: */
background: var(--muted);
border: 1px solid var(--border);
border-radius: 0.25rem;
padding: 0.125rem 0.5rem;
```

Die einzige Ausnahme sind `<Badge>` aus shadcn/ui in der Artikel-Header-Zeile (Datum + Lesezeit-Zeile) — dort sind sie akzeptiert, weil sie semantisch Metadaten kennzeichnen.

---

## 8. Animationen

### Grundprinzipien

- Easing: immer `cubic-bezier(0.16, 1, 0.3, 1)` (schnell rein, sanft raus — Spring-Feeling)
- Dauer: 200–500ms je nach Komplexität
- `prefers-reduced-motion: reduce` immer respektieren: alle Transitions auf `none !important`

### System-Animationen

| Animation | Verwendung |
|---|---|
| Text Reveal (Wörter/Zeilen) | Page-Hero, Artikel-Titel |
| Scroll Reveal (fade + translateY) | Abschnitte beim Einblenden |
| Magnetischer Effekt | Primäre CTAs, Nav-Logo |
| HeroMesh (fließende Orbs) | Startseite Hero |
| Cover-Placeholder (driftende Orbs) | Artikel ohne Cover-Bild |
| Hamburger-Morph (→ X) | Mobile Navigation |

### Hover-States

```css
/* Erlaubt: */
opacity: 0.6–0.7;        /* sanftes Ausblenden */
color: var(--foreground); /* Farbwechsel */
transform: scale(1.03);  /* subtiles Zoom auf Bilder */

/* Verboten: */
transform: translateY(-2px); /* Card-Lift-Effekt — nicht Swiss */
box-shadow: ...;             /* generell verboten */
```

---

## 9. Komponenten-Inventar

| Komponente | Datei | Beschreibung |
|---|---|---|
| `CustomCursor` | `src/components/astro/CustomCursor.astro` | Eigener Cursor, `transition:persist` |
| `HeroMesh` | `src/components/astro/HeroMesh.astro` | Fließende Gradient-Orbs im Hero |
| `GrainOverlay` | `src/components/astro/GrainOverlay.astro` | Globale Grain-Textur |
| `BaselineGrid` | `src/components/astro/BaselineGrid.astro` | Dev-Hilfsgitter (unsichtbar in Prod) |
| `ReadingProgress` | `src/components/astro/ReadingProgress.astro` | Lese-Fortschrittsbalken oben |
| `Lightbox` | `src/components/astro/Lightbox.astro` | Galerie-Dialog für Artikel-Bilder |
| `ArticleFooter` | `src/components/astro/ArticleFooter.astro` | KI-Links, Share, Prev/Next |
| `GradientGenerator` | `src/components/GradientGenerator.tsx` | Interaktives Tool (React Island) |

---

## 10. Do's und Don'ts

### Do

- Bilder voll ausbluten lassen (full-width innerhalb des Containers)
- Abstand als Hierarchiemittel nutzen: mehr Luft = wichtiger
- `--muted-foreground` für alles Sekundäre
- Trennlinien: nur die 8%-opacity-Formel
- Beim Hover: Opacity oder Farbwechsel
- `data-cursor="link"` auf alle klickbaren Elemente setzen

### Don't

- **Keine Cards** (Hintergrund + Border + Radius = Card)
- **Keine Schatten** (`box-shadow: none` ist globale Regel)
- **Keine Borders auf interaktiven Elementen** (Buttons, Links, Tags)
- **Keine Pill-Badges** auf Content-Tags
- **Keine Google Fonts** (nur Geist via npm)
- **Kein `transform: translateY()`** als Hover-Effekt (außer bei initialen Animationen)
- **Kein `font-weight: 700`** — Maximum ist 500 (medium)
- **Kein Hardcoding von Farben** — immer CSS Custom Properties

---

## 11. Dateistruktur (relevant)

```
src/
├── layouts/
│   ├── BaseLayout.astro      # Globales Layout, Nav, Footer
│   └── PostLayout.astro      # Artikel/Projekt-Layout mit Cover
├── components/
│   ├── astro/
│   │   ├── ArticleFooter.astro
│   │   ├── CustomCursor.astro
│   │   ├── HeroMesh.astro
│   │   ├── Lightbox.astro
│   │   └── ReadingProgress.astro
│   └── GradientGenerator.tsx
├── styles/
│   ├── global.css            # Tokens, Reset, Card-Override
│   ├── typography.css        # t-* Klassen
│   ├── animations.css        # Keyframes, Reveal-Animationen
│   └── prose.css             # Markdown + article-prose Layout
├── pages/
│   ├── index.astro
│   ├── about.astro
│   ├── blog/
│   └── projects/
public/
├── images/
│   ├── portrait.jpg
│   └── gallery/
└── fonts/                    # Geist Pixel (wenn vorhanden)
```
