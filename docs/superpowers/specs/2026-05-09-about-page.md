# About-Seite — Design Spec

**Datum:** 2026-05-09
**Status:** Approved

---

## Ziel

Eine About-Seite die gleichzeitig für Freelance-Anfragen (A), Festanstellungen (B) und Community/Netzwerk (C) funktioniert — ohne für eine Gruppe optimiert zu sein. Lösung: authentische Identität statt Zielgruppenansprache. Besucher selektieren sich selbst.

---

## Entscheidungen

| Frage | Entscheidung |
|---|---|
| Portrait | Halbseitig (50% Desktop), volle Breite auf Mobile |
| Ton | Nah, direkt, erste Person, Haltung zeigen |
| Sysadmin-Background | Nicht erwähnen |
| Graffiti-Geschichte | Prominent — visuelles Fundament, nicht Hobby |
| Nerd-Seite | Explizit als Stärke positionieren |
| A Eins Position | Lead Design & Digital Transformation |
| CTA | Primär: Kontakt, Sekundär: CV-PDF + Projekte |

---

## Seitenstruktur

### 1 — Hero: Portrait + Opening

**Desktop:** 2-Spalten-Grid (50/50)
- Links: Portrait-Foto (halbseitig, leicht beschnitten, hohe Qualität)
- Rechts: Name, Titel, Opening-Statement

**Mobile:** Gestapelt — Portrait volle Breite, dann Text

**Opening-Statement:**
```
Ich bin Patrick. Design Engineer aus Berlin —
aufgewachsen mit Spraydosen, groß geworden mit Code.
```

---

### 2 — Narrative (3 Absätze)

**Absatz 1 — Visuelles Fundament:**
Graffiti-Hintergrund als Ursprung des visuellen Denkens. Komposition, Farbe, Typografie — nicht aus dem Lehrbuch, sondern von der Wand. Das prägt bis heute.

**Absatz 2 — Design Engineer:**
Die Überzeugung dass Design und Code keine getrennten Disziplinen sind. Sprache der Entwickler sprechen, Design Systems bauen die im Code leben, nicht in Statics.

**Absatz 3 — Die Nerd-Seite:**
Proxmox-Homelab, n8n-Workflows, Claude/Gemini CLI — nicht als Freizeit, sondern als Methode. Wer versteht wie Systeme funktionieren, baut bessere Interfaces für sie.

**Breite:** `max-w-2xl` (konsistent mit Artikeln)

---

### 3 — Werdegang (Timeline)

Typografisch, kein CV. Nur 4 Stationen, keine Lücken, keine exakten Daten erzwungen.

```
A Eins              Lead Design & Digital Transformation
Oetker Digital      Corporate Innovation
DefShop             High-Growth E-Commerce
Graffiti / Straße   Visuelles Fundament
```

Format: Label-Klasse (t-label, uppercase) für Firma/Kontext, t-body für Beschreibung. Trennlinie zwischen Einträgen (konsistent mit Blog-Liste, 8% opacity).

---

### 4 — Womit ich arbeite

Zwei Spalten, plain text, keine Cards, keine Badges.

```
Design & Product          Engineering & Automation
────────────────          ───────────────────────
Figma                     Astro, React, TypeScript
Design Systems            shadcn/ui, Tailwind CSS v4
shadcn/ui                 n8n
Tailwind CSS              Claude / Gemini CLI
                          Proxmox Homelab
```

---

### 5 — CTA-Block

```
[ Projekt anfragen ]          ← primärer Button (data-magnetic)

Lebenslauf ↓   ·   Projekte ansehen
```

Lebenslauf: Link auf `/cv.pdf` (PDF in `public/` ablegen, Placeholder bis Datei vorhanden)
Projekte: Link auf `/projects`

---

## Technische Details

**Datei:** `src/pages/about.astro`
**Layout:** `BaseLayout.astro` (nicht PostLayout — keine Cover-Wrap nötig)
**Portrait:** `public/images/portrait.jpg` (oder `.webp`) — Placeholder-Fallback mit Mesh-Gradient wenn nicht vorhanden
**Navigationslink:** "Über" als vierter Link in `BaseLayout.astro` NavLinks

### Navigation-Update

In `BaseLayout.astro` navLinks ergänzen:
```ts
{ href: "/about", label: "Über" }
```

### JSON-LD Update

In `BaseLayout.astro` personSchema ergänzen:
```ts
sameAs: [
  "https://ptrckschrdtr.de/about"
]
```

---

## Constraints

- Keine Cards, keine Borders (konsistent mit No-Outline-System)
- Alle Farben aus shadcn CSS-Variablen
- Graffiti-Bild: eines aus `public/images/gallery/digital-graffiti/`
- Portrait: wenn nicht vorhanden → Mesh-Gradient-Fallback (wie Cover-Placeholder)
- `prefers-reduced-motion` respektieren
- Responsive: Portrait volle Breite auf Mobile (< 768px)
