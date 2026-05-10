# ptrckschrdtr.de — Design Styleguide

**Status:** Living document  
**Letzte Aktualisierung:** 2026-05-10  

---

## Kernphilosophie

**Eine radikale Symbiose aus drei Strömungen:**

1. **Schweizer Typografie** — Präzision, Raster, Sachlichkeit. Typografie als primäres Gestaltungsmittel.
2. **Japanisches Design (Ma / 間)** — Leerraum ist kein Hintergrund, sondern das bestimmende Element. 70–80 % des Bildschirms bleiben intentionell leer.
3. **Extremer Minimalismus** — Jedes UI-Element muss eine klare Funktion erfüllen. Gibt es keine Funktion, wird es entfernt.

> **Leitfrage:** Ist dieses Element notwendig — oder decorativ?  
> Wenn dekorativ: entfernen.

---

## Implementierungsstatus

Das Projekt befindet sich in einem kontrollierten Übergang. Nicht alle Prinzipien sind bereits vollständig umgesetzt. Diese Tabelle zeigt den aktuellen Stand:

| Prinzip | Status | Nächster Schritt |
|---|---|---|
| Keine Cards / Borders auf Content | ✅ Umgesetzt | — |
| Tags als plain text | ✅ Umgesetzt | — |
| Linksbündig überall | ✅ Umgesetzt | — |
| Monochrome UI (kein Farb-UI) | ⚠️ Teilweise | HeroMesh → neutral grau |
| Präzise Trennlinien | ⚠️ Optimiert | 12% statt 8% Opacity |
| Corner-Navigation | 🔜 Geplant | Nächste Iteration |
| Project-Index Hover-Reveal | 🔜 Geplant | Nächste Iteration |
| Hero: Typografischer Fokus, leere Mitte | 🔜 Geplant | Nächste Iteration |
| Cursor: technisches Kreuz / Punkt | 🔜 Geplant | Nächste Iteration |

---

## 1. Raum & Layout (Ma)

### Grundprinzip

Der Leerraum ist das wichtigste Gestaltungselement — nicht Filler, nicht Fehler, sondern Aussage.

- **Richtwert:** 70–80 % des Viewports intentionell leer
- **Raster:** Unsichtbares 12-Spalten-Grid als striktes Fundament. `max-w-5xl` mit `px-6` entspricht dem Raster.
- **Asymmetrie:** Inhalte werden nicht zentriert, sondern an exakt berechneten Rasterpunkten platziert. Die Mitte des Bildschirms darf leer sein — das ist Absicht, nicht Fehler.

### Max-Width-System

| Klasse | Rem | Verwendung |
|---|---|---|
| `max-w-5xl` | 64rem | Haupt-Container, Navigation |
| `max-w-2xl` | 42rem | Fließtext, Narrativ-Blöcke |
| `max-w-none` | — | Bilder die aus dem Text ausbrechen |

**Seiten-Padding:** `px-6` (24px) konsistent auf allen Seiten.

**Vertikaler Rhythmus:** `pb-20` (5rem) zwischen Hauptabschnitten, `mb-8` (2rem) zwischen Textblöcken.

---

## 2. Typografie (Die Bildsprache)

Da auf dekorative Elemente verzichtet wird, übernimmt die Schrift die visuelle Führung.

### Schriftart

**Geist Variable** (Sans) + **Geist Mono** (Code)  
Bezug: `@fontsource-variable/geist` (npm — kein CDN, keine Google Fonts)

Geist ist eine geometrische Grotesk, verwandt mit Helvetica Now / Suisse Int'l — passend zur Schweizer Typografietradition.

### Größenkontrast — Das Kernprinzip

Extreme Skalierung schafft visuelle Hierarchie ohne dekorative Elemente:

```
Hero-Headline:   3.052rem (49px) → gigantisch, dominant
Body-Text:       1.000rem (16px) → feingliedrig, präzise
Label (CAPS):    0.640rem (10px) → Metaebene, zurückhaltend

Ratio Hero:Body = 3:1 — das ist die Mindest-Spreizung
```

### Klassen-System

```
t-hero      Hero-Headline (Startseite, großes Statement)
t-h1        Artikel-Titel
t-h2        Abschnittsüberschriften
t-h3        Sub-Überschriften
t-lead      Einleitungstext (leicht größer als body)
t-body      Fließtext
t-small     Metadaten, Caption
t-label     Section-Label — UPPERCASE, letter-spaced, klein
t-mono      Code und technische Notation
t-prose     Markdown-Content-Block
```

### Gewicht

- Headlines: `font-weight: 500` — präzise, nicht schwerfällig
- Fließtext: `font-weight: 400`
- **Kein `font-weight: 700`** — bold wirkt dekorativ, nicht sachlich

### Ausrichtung — Die absolute Regel

**Ausnahmslos linksbündig.** Kein Blocksatz. Kein zentrierter Text. Keine rechts-ausgerichteten Elemente in normalen Content-Kontexten.

```css
/* Richtig: */
text-align: left;

/* Verboten: */
text-align: center;
text-align: right;   /* Ausnahme nur: RTL-Kontexte */
text-align: justify;
```

### Formatierung im Fließtext

- Kein `<strong>` / `<b>` im Fließtext (kein Bold)
- Kein `<em>` / `<i>` im Fließtext (kein Kursiv)
- Struktur entsteht durch: Absatzabstände, Einzüge, Laufweite (letter-spacing)

---

## 3. Farbe (Radikale Reduktion)

### Grundprinzip

**Das UI ist monochrom. Farbe kommt ausschließlich aus den Projekt- und Artikelbildern.**

Die Benutzeroberfläche bleibt neutral, damit die Inhalte (Bilder) die visuelle Bühne bekommen.

### System-Tokens

| Token | Beschreibung |
|---|---|
| `var(--background)` | Klares Weiß / subtiles Off-White (Papier-Anmutung) |
| `var(--foreground)` | Tiefes Schwarz / extrem dunkles Grau (~#111) |
| `var(--muted-foreground)` | Sekundärer Text — mittleres Grau |
| `var(--muted)` | Sehr subtile Flächen, Platzhalter-Hintergründe |
| `var(--card)` | Identisch mit `--background` — Cards sind unsichtbar |
| `var(--border)` | Strukturlinien — sparsam |

### Trennlinien — Präzise Lexikon-Ästhetik

```css
/* Standard-Trennlinie — "Shoji-Wand": präzise, klar, nicht dekorativ */
border-top: 1px solid color-mix(in oklch, var(--foreground) 12%, transparent);
```

12% Opacity: erkennbar präzise (Lexikon-Ästhetik), nicht schwer. Einheitlich überall.

### HeroMesh — Übergangsregel

Der HeroMesh verwendet aktuell `--mesh-warm` und `--mesh-cool` (farbige Töne). Das widerspricht dem monochromen Prinzip.

**Übergangsplan:**
- Jetzt: neutralisiert auf subtile Grautöne (`--mesh-warm → --mesh-subtle`, nahezu achromatisch)
- Langfristig: HeroMesh wird durch rein typografische Hero-Sektion ersetzt

```css
/* Ziel: */
--mesh-subtle: oklch(0.92 0.005 100);  /* fast neutral, leicht warm */
```

### Was erlaubt ist

```css
/* Farbe ist IMMER und NUR in diesen Kontexten erlaubt: */
- Projekt-Cover-Bilder und Artikel-Fotos
- Cover-Placeholder (abgeleitet aus --mesh-* Tokens)
- Text-Selektion (foreground on background — invertiert)
```

### Was verboten ist

```css
/* Keine hardcodierten Farben im UI: */
color: #0066cc;           /* verboten */
background: #f5f5f0;      /* verboten — immer var(--background) */
border-color: #ddd;       /* verboten — immer color-mix() mit var(--foreground) */
```

---

## 4. UI-Elemente & Interaktion

### Navigation — Aktuell vs. Ziel

**Aktuell (Übergangszustand):**  
Fester Header-Balken oben. Für Desktop: Logo links, Nav-Links rechts.

**Ziel (nächste Iteration):**  
Dezentrale Corner-Navigation. Nav-Punkte als reine Text-Links an den Viewport-Rändern. Kein klassischer Header-Balken, kein Hamburger-Menü.

```
Ecke oben links:    PTRCKSCHRDTR (Logo / Home)
Ecke oben rechts:   Start  Über  Blog  Projekte  (plain text, vertikal oder horizontal)
Ecke unten rechts:  Impressum  Datenschutz
```

**Mobile:** Beibehaltung einer einfachen, zugänglichen Lösung — kein Hamburger-Menü nach Möglichkeit.

### Links

```css
/* Fließtext-Link */
color: var(--foreground);
text-decoration: underline;
text-decoration-color: color-mix(in oklch, var(--foreground) 25%, transparent);
text-underline-offset: 3px;
transition: text-decoration-color 200ms ease;

/* Hover: Linie wird sichtbarer */
text-decoration-color: var(--foreground);
```

```css
/* Navigation / tertiary links — kein underline */
color: var(--muted-foreground);
transition: color 200ms ease;

/* Hover */
color: var(--foreground);
```

### Hover-States — Was erlaubt ist

```css
/* Erlaubt: */
opacity: 0.6;                        /* sanftes Zurücktreten */
color: var(--foreground);            /* Aktivierung durch Farbwechsel */
transform: scale(1.02–1.04);        /* nur auf Bilder */
text-decoration-color: transparent → visible;  /* auf Links */

/* Verboten: */
transform: translateY(-2px);        /* Card-Lift = dekorativ */
box-shadow: ...;                    /* generell verboten */
border-color: transparent → visible; /* Borders nicht als Hover-Signal */
background: var(--muted);           /* Hintergrund-Reveal auf Hover = Card-Verhalten */
```

### Primärer CTA-Button

Der einzige echte Button mit sichtbarem Hintergrund. Verwendet nur auf About-Seite und expliziten CTA-Bereichen.

```html
<Button data-magnetic data-cursor="button">Projekt anfragen</Button>
```

- Hintergrund: `var(--foreground)`, Text: `var(--background)`
- `data-magnetic` für physikalischen Magneteffekt beim Hover
- **Nicht verwenden** für Navigation, Share-Links, AI-Links

### Cursor

**Aktuell:** Custom circle cursor mit lerp-Bewegung.

**Ziel:** Technisches Kreuz (+) oder minimaler schwarzer Punkt. Kleine Größe, präzise — keine großen Hover-Expansionen.

```css
/* Ziel-Ästhetik: */
cursor: crosshair;

/* Oder custom: */
width: 6px; height: 6px;
border: 1px solid var(--foreground);
border-radius: 0;  /* Kein Kreis — technisches Kreuz */
```

---

## 5. Bilder & Medien

### Grundregel

Bilder sind die **einzige Farbquelle** der Website. Sie werden entsprechend als visuelle Ankerpunkte behandelt — prominent platziert, nie in Thumbnails eingezwängt (außer in der Artikel-Navigation).

### Inline-Bilder in Artikeln

```css
/* Bricht aus max-w-2xl auf volle max-w-5xl aus */
.article-prose > p:has(> img:only-child) { max-width: none; }
.article-prose img {
  width: 100%;
  height: auto;    /* Natürliche Proportionen — kein object-fit:cover */
  display: block;
}
```

### Cover-Bilder (Artikel/Projekte)

```css
height: 55vh;          /* Explizite Höhe — kein aspect-ratio */
min-height: 300px;
max-height: 600px;
object-fit: cover;
object-position: center;
```

### Projekt-Index — Ziel (nächste Iteration)

```
Ruhezustand:  Textliste (Nummer · Titel · Jahr) — kein Bild sichtbar
Hover:        Bild erscheint an fest definierter Raster-Position im Hintergrund
              fade-in 300ms, position: fixed oder absolute im Grid
```

Bilder im Ruhezustand sind unsichtbar. Das Bild taucht erst beim Mauskontakt auf — das Verborgene als Interaktionsprinzip.

### Prev/Next-Thumbnails (Artikel-Footer)

```css
aspect-ratio: 16 / 9;
object-fit: cover;
/* Kein border-radius, kein border, kein rounded */
```

### Portrait (About-Seite)

```css
aspect-ratio: 3 / 4;
object-fit: cover;
object-position: center top;
```

---

## 6. Tags & Labels

### Richtig — Plain Text

```html
<span class="tag">DESIGN</span>
```

```css
.tag {
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--muted-foreground);
  /* Kein background, kein border, kein border-radius, kein padding */
}
```

### Ausnahme: shadcn Badge im Artikel-Header

`<Badge variant="secondary">` ist nur in der Header-Zeile (Datum + Lesezeit) erlaubt — dort semantisch korrekt als Metadaten-Marker.

---

## 7. Seitenarchitektur — Aktuell vs. Ziel

### Startseite

**Aktuell:** HeroMesh + zentrierter Text + Projekte-Teaser  
**Ziel:**
- Wenige, stark typografische Worte (Disziplin / Fokus / Präzision)
- Name in kleiner Laufweite in einer Ecke
- Mitte des Bildschirms: leer — intentionell
- Kein Vorstellungsbild, kein Foto

### Projektübersicht

**Aktuell:** Grid mit sichtbaren Cover-Bildern  
**Ziel:** Textbasiertes Verzeichnis
```
01    Forma Design System      2025
02    Gradient Generator       2024
03    Meridian Dashboard       2024
```
Bild erscheint erst beim Hover über dem Projektnamen.

### Artikel-Footer

**Aktuell:** ✅ Swiss-konform nach letztem Refactor  
Prev/Next typografisch, keine Cards, no Borders.

### About-Seite

**Aktuell:** Portrait + Narrativ + Timeline + Tools + CTA  
**Ziel (langfristig):**
- Lebenslauf und Fähigkeiten als strenge technische Tabellen
- Kontakt: eine einfache, klickbare E-Mail-Adresse am Seitenende
- Kein visuell aufbereiteter "About"-Block

---

## 8. Animationen

### Grundprinzipien

- **Keine fliegenden Elemente.** Keine Slide-ins von links, rechts oder unten.
- **Nur:** Weiche Einblendungen (opacity 0→1) + minimale Y-Bewegung beim Reveal (max 12px)
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` — sanftes Ausklingen
- **Dauer:** 200–400ms — nicht länger
- `prefers-reduced-motion: reduce` überall respektieren

### Was erlaubt ist

```css
/* Text Reveal: Wörter/Zeilen einblenden */
opacity: 0 → 1;
transform: translateY(8px) → translateY(0);  /* max 8-12px */

/* Scroll Reveal: Abschnitte */
opacity: 0 → 1;
transform: translateY(16px) → translateY(0);

/* Image Hover: subtiles Zoom */
transform: scale(1.03);
```

### Was verboten ist

```css
/* Kein Card-Lift */
transform: translateY(-4px);   /* dekorativ, nicht Swiss */

/* Keine Spring-Animationen mit zu viel Bewegung */
/* Keine Rotation, Flip, Scale > 1.05 auf UI-Elementen */
/* Keine bounce Easings auf Content */
```

---

## 9. Komponenteninventar

| Komponente | Datei | Status |
|---|---|---|
| `CustomCursor` | `src/components/astro/CustomCursor.astro` | ⚠️ Wird überarbeitet → technisches Kreuz |
| `HeroMesh` | `src/components/astro/HeroMesh.astro` | ⚠️ Neutralisiert → wird langfristig ersetzt |
| `GrainOverlay` | `src/components/astro/GrainOverlay.astro` | ✅ Bleibt |
| `ReadingProgress` | `src/components/astro/ReadingProgress.astro` | ✅ Funktional, bleibt |
| `Lightbox` | `src/components/astro/Lightbox.astro` | ✅ Bleibt |
| `ArticleFooter` | `src/components/astro/ArticleFooter.astro` | ✅ Swiss-konform |
| `GradientGenerator` | `src/components/GradientGenerator.tsx` | ✅ Bleibt als Tool |

---

## 10. Do's und Don'ts

### Do

- **Leerraum bewusst einsetzen.** Eine leere Mitte ist Aussage, kein Fehler.
- **Bilder als einzige Farbquelle** behandeln — UI bleibt monochrom.
- **Linksbündig.** Immer. Ausnahmslos.
- **Trennlinien** nur: `1px solid color-mix(in oklch, var(--foreground) 12%, transparent)`
- **Hover:** opacity oder Farbwechsel — nie Card-Lift, nie Border-Reveal
- `data-cursor="link"` auf alle klickbaren Elemente
- Bilder volle Breite ihres Containers ausbluten lassen
- Abstand als Hierarchiemittel: mehr Luft = wichtiger

### Don't

- ❌ **Keine Cards** (Hintergrund + Border = Card)
- ❌ **Keine Schatten** (`box-shadow`)
- ❌ **Keine Borders auf interaktiven Elementen** (Links, Tags, Buttons)
- ❌ **Kein zentrierter Text** — `text-align: center` ist verboten
- ❌ **Kein `font-weight: 700`** — Maximum ist 500
- ❌ **Keine Farb-Tokens** im UI außer `--foreground`, `--background`, `--muted*`, `--border`
- ❌ **Keine Google Fonts / CDN-Fonts** — nur Geist via npm
- ❌ **Kein `transform: translateY(-Xpx)`** als Hover-Effekt
- ❌ **Kein Bold/Italic im Fließtext** — Struktur entsteht durch Abstand
- ❌ **Keine rechts-ausgerichteten Inhalte** in normalen Content-Kontexten

---

## 11. Dateistruktur

```
src/
├── layouts/
│   ├── BaseLayout.astro       Globales Layout, Nav, Footer
│   └── PostLayout.astro       Artikel/Projekt-Layout mit Cover
├── components/
│   ├── astro/
│   │   ├── ArticleFooter.astro
│   │   ├── CustomCursor.astro
│   │   ├── HeroMesh.astro
│   │   ├── Lightbox.astro
│   │   └── ReadingProgress.astro
│   └── GradientGenerator.tsx
├── styles/
│   ├── global.css             Tokens, Reset, Card-Override
│   ├── typography.css         t-* Klassen
│   ├── animations.css         Keyframes, Reveal-Animationen
│   └── prose.css              Markdown + article-prose Layout
├── pages/
│   ├── index.astro
│   ├── about.astro
│   ├── blog/
│   └── projects/
docs/
├── styleguide.md              Dieses Dokument
└── superpowers/
    ├── plans/                 Implementierungspläne
    └── specs/                 Design-Specs
public/
├── images/
│   ├── portrait.jpg
│   └── gallery/
└── fonts/
```
