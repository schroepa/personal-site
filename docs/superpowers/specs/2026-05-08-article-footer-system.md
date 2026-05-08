# Artikel-Abschluss-System — Design Spec

**Datum:** 2026-05-08
**Status:** Approved

---

## Ziel

Artikel- und Projektseiten mit einem kohärenten Abschluss-System ausstatten, das Leser im Kosmos der Site hält, technische Kompetenz signalisiert und organische Reichweite ermöglicht — ohne die editorial-minimalistische Ästhetik der Site zu brechen.

---

## Entscheidungen (aus Brainstorming)

| Frage | Entscheidung |
|---|---|
| Share-Buttons | Kein klassisches Share-Bar — nur „Link kopieren" + LinkedIn |
| AI-Dienste | Claude, ChatGPT, Perplexity — kein Gemini |
| AI-Link-Konzept | Pre-filled Prompts, öffnen in neuem Tab |
| Prev/Next | Minimalist mit Thumbnail, Titel, Beschreibung, Tags |
| Lesezeit | Immer, überall — Posts und Projekte, Cards und Detailseiten |
| Reihenfolge Abschluss | AI → Teilen → Prev/Next (bewusst: Tiefe vor Reichweite) |
| Geltungsbereich AI+Share | Nur Artikel/Projekt-Detailseiten, nicht global |

---

## 1 — Lesezeit-Utility

**Datei:** `src/lib/reading-time.ts`

```ts
export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}
```

200 Wörter/Minute, mindestens 1 Minute. Gibt eine `number` zurück.

**Verwendung:**
- `PostLayout.astro`: im Header, inline mit Datum `7. Mai 2026 · 4 min`
- `blog/index.astro`, `projects/index.astro`, `index.astro`: in Cards, gleiche Zeile wie Datum

---

## 2 — ArticleFooter-Komponente

**Datei:** `src/components/astro/ArticleFooter.astro`

### Props

```ts
interface Props {
  title: string
  slug: string
  collection: 'blog' | 'projects'
  prev?: { slug: string; title: string; description: string; tags: string[]; coverImage?: string }
  next?: { slug: string; title: string; description: string; tags: string[]; coverImage?: string }
}
```

### Layout (Desktop)

```
─── Trennlinie ──────────────────────────────────────────────

MIT KI ERKUNDEN                                    t-label uppercase

"Diesen Beitrag mit einer KI weiterdenken —"      t-small text-muted

  [✦ Claude]   [⊕ ChatGPT]   [⊙ Perplexity]      Icon + Label, horizontal

─── Trennlinie ──────────────────────────────────────────────

  [🔗 Link kopieren]      [in LinkedIn]             t-small

─── Trennlinie ──────────────────────────────────────────────

  [← Vorheriger Post]          [Nächster Post →]   zwei Cards

─────────────────────────────────────────────────────────────
```

### AI-Link-URLs

```
Claude:     https://claude.ai/new?q=Erkläre%20mir%20mehr%20zu%20diesem%20Artikel%3A%20%22[title]%22%20%E2%80%94%20[fullURL]
ChatGPT:    https://chatgpt.com/?q=Erkläre%20mir%20mehr%20zu%20diesem%20Artikel%3A%20%22[title]%22%20%E2%80%94%20[fullURL]
Perplexity: https://www.perplexity.ai/search?q=[title]%20[domain]
```

`fullURL` = `https://ptrckschrdtr.de/blog/[slug]` (oder `/projects/[slug]`)

### Share-Logik

**Link kopieren:** `navigator.clipboard.writeText(window.location.href)` — Button-Text wechselt für 2s zu „Kopiert ✓"

**LinkedIn:** `https://www.linkedin.com/sharing/share-offsite/?url=[encoded fullURL]`

### Prev/Next Card

```
┌──────────────────────────────────────────────┐
│ ← VORHERIGER / NÄCHSTER →      t-label dim   │
│                                              │
│ [thumbnail 16:9 oder Mesh-Fallback]          │
│                                              │
│ Titel                          t-h3          │
│ Beschreibung (max 2 Zeilen)    t-small muted │
│ [Tag] [Tag]                    Badge         │
└──────────────────────────────────────────────┘
```

- Desktop: zwei Cards nebeneinander (`grid grid-cols-2 gap-6`)
- Mobile: gestapelt, Prev oben, Next unten
- Hover: `translateY(-2px)`, Border-Farbe aufhellen
- Fehlt prev oder next: Card-Slot leer (kein Fehler)

---

## 3 — Anpassungen an bestehenden Dateien

### `src/layouts/PostLayout.astro`

1. `readingTime(body)` importieren und berechnen
2. Header-Zeile: `{formattedDate} · {minutes} min` + Tags
3. `<ArticleFooter>` unter `.prose`-Block einbinden
4. Prev/Next: kommen als Props von der Seite

### `src/pages/blog/[slug].astro`

1. Alle Posts sortiert laden
2. Index des aktuellen Posts finden
3. `prev = posts[index - 1]`, `next = posts[index + 1]`
4. Als Props an `PostLayout` übergeben

### `src/pages/projects/[slug].astro`

Gleiche Logik wie Blog.

### `src/pages/blog/index.astro`

Lesezeit in Card-Zeile: `{formatDate(post.data.date)} · {readingTime(post.body ?? '')} min`

### `src/pages/projects/index.astro`

Gleich.

### `src/pages/index.astro`

Latest-Posts-Cards: Lesezeit in der Datum-Zeile.

---

## 4 — Icons

SVG-Icons inline (kein CDN, keine externen Requests):

- **Claude:** Anthropic-Stern (✦ stilisiert)
- **ChatGPT:** OpenAI-Spirale
- **Perplexity:** Perplexity-Symbol
- **Link:** Einfaches Link-Icon
- **LinkedIn:** `in`-Icon

Alle Icons: 16×16px, `currentColor`, via `aria-label` zugänglich.

---

## 5 — Accessibility

- AI-Link-Buttons: `aria-label="Beitrag mit Claude erkunden (öffnet externen Link)"`
- Prev/Next: `aria-label="Vorheriger Beitrag: [Titel]"` / `"Nächster Beitrag: [Titel]"`
- „Link kopieren": Status-Änderung per `aria-live="polite"`
- Alle externen Links: `target="_blank" rel="noopener noreferrer"`

---

## 6 — Constraints

- Keine externen Tracking-Skripte durch Share-Buttons
- Keine Social-Media-SDKs — nur native URLs
- `prefers-reduced-motion`: Hover-Transitions deaktiviert
- Farben ausschließlich aus shadcn CSS-Variablen
