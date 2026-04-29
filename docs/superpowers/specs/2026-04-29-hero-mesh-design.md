# Hero Flowing Mesh — Design Spec

**Datum:** 2026-04-29  
**Status:** Approved  

---

## Ziel

Den Hero der Startseite mit einem subtilen animierten Hintergrundeffekt aufwerten — vergleichbar mit dem Gemini-Effekt auf google.com/gemini, aber monochromer, ruhiger und direkt im bestehenden OKLCH-Farbsystem verankert.

---

## Entscheidungen (aus Brainstorming)

| Frage | Entscheidung |
|---|---|
| Effekt-Typ | Flowing Mesh (mehrere überlagerte Radial-Gradienten) |
| Cursor-Einfluss | Ja — träger Lerp, verschiebt Schwerpunkt |
| Farbstrategie | Zwei neue Mesh-Tokens (Option B) |
| Autonome Animation | Ja — läuft immer, unabhängig vom Cursor |

---

## Neue Farbtokens

Additiv in `src/styles/global.css`, unterhalb der bestehenden `:root`- und `.dark`-Blöcke:

```css
:root {
  --mesh-warm: oklch(0.88 0.04 75);   /* gedämpftes Sandgelb */
  --mesh-cool: oklch(0.88 0.03 145);  /* gedämpftes Salbeigrün */
}

.dark {
  --mesh-warm: oklch(0.28 0.04 75);
  --mesh-cool: oklch(0.28 0.03 145);
}
```

Beide Tokens haben bewusst niedrige Chroma-Werte (0.03–0.04). Im Kontext des weißen Hintergrunds (`oklch(1 0 0)`) wirken sie als lebendige Wärme ohne bunt zu sein.

---

## Komponente: `src/components/astro/HeroMesh.astro`

### Markup-Struktur

```html
<div class="mesh-container" aria-hidden="true">
  <div class="mesh-orb orb-1"></div>
  <div class="mesh-orb orb-2"></div>
  <div class="mesh-orb orb-3"></div>
  <div class="mesh-orb orb-4"></div>
</div>
```

### CSS

**Container:**
- `position: absolute; inset: 0; overflow: hidden; z-index: 0`
- `filter: blur(40px)` — ein einziger blur-Call auf dem Container statt vier
- `opacity: var(--mesh-opacity, 0.35)`
- `pointer-events: none`
- `will-change: transform` für GPU-Compositing

**Orbs:** Jeder Orb ist ein `position: absolute`-Element mit einem `background: radial-gradient(ellipse ...)`. Die vier Orbs verwenden abwechselnd `--mesh-warm` und `--mesh-cool` mit unterschiedlichen Ellipsen-Formen und Ausgangspositionen:

| Orb | Farbe | Startposition | Größe |
|-----|-------|---------------|-------|
| 1 | warm | 15% 20% | 55% × 45% |
| 2 | cool | 85% 15% | 45% × 55% |
| 3 | warm | 65% 88% | 60% × 40% |
| 4 | cool | 25% 75% | 40% × 60% |

**Autonome Animationen:** Jeder Orb hat eine eigene `@keyframes`-Animation mit unterschiedlichen Laufzeiten und `animation-delay`-Werten, sodass die Orbs nie synchronisieren:

| Orb | Dauer | Delay |
|-----|-------|-------|
| 1 | 18s | 0s |
| 2 | 22s | −5s |
| 3 | 16s | −8s |
| 4 | 20s | −12s |

Alle `animation-timing-function: ease-in-out`, `animation-iteration-count: infinite`, `animation-direction: alternate`.

Jede Keyframe-Animation bewegt den Orb auf einer kleinen elliptischen Bahn (~8–12% Versatz in X/Y), ergänzt durch leichte Rotation (~±4°) und Skalierung (~0.95–1.05).

**Cursor-Offset:** Der Container bekommt zwei CSS Custom Properties `--mesh-offset-x` und `--mesh-offset-y` (in Prozent), die per JS gesetzt werden. Jeder Orb addiert diese zu seiner natürlichen `translate()`-Animation via `calc()`.

### JavaScript

Ein `pointermove`-Listener auf der Hero-`<section>` (nicht auf `window`, damit der Effekt nur im Hero aktiv ist):

```
pointermove → normalisierte Position (0..1) → targetX/Y in %
RAF-Loop → lerp(current, target, 0.035) → CSS Custom Properties setzen
```

- Max. Offset: ±6% in X, ±4% in Y
- Lerp-Faktor 0.035 — sehr träge, wirkt schwer/organisch
- Bei `mouseleave` auf der Section: target zurück auf (0, 0)
- Kein `pointermove` auf Touch-Devices (Guard: `window.matchMedia('(pointer: fine)')`)

### prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  .mesh-container {
    animation: none;
    opacity: 0.15; /* statischer, kaum sichtbarer Hintergrund */
  }
  .mesh-orb { animation: none; }
}
```

JS-Listener wird nur initialisiert wenn `prefers-reduced-motion` nicht gesetzt.

---

## Integration in `index.astro`

1. `<HeroMesh />` als **erstes Kind** der Hero-`<section>` einfügen
2. Hero-`<section>` bekommt `position: relative` (hat es bereits implizit durch `relative` class)
3. Innerer Content-`<div>` bekommt `position: relative; z-index: 1` um über dem Mesh zu liegen

Keine weiteren Dateien werden geändert.

---

## Constraints

- Kein Canvas, kein WebGL, keine externen Libraries
- Ausschließlich CSS Custom Properties aus dem bestehenden System + die zwei neuen Mesh-Tokens
- Keine hardcodierten Hex- oder RGB-Werte
- `aria-hidden="true"` auf dem gesamten Mesh-Container
- Build muss sauber bleiben (`npm run build` ohne Fehler)
