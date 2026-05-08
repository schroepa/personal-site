---
title: "Grainy Gradient Generator"
description: "Ein browserbasiertes Tool zum Erstellen und Exportieren körniger Mesh-Gradienten — gebaut für diese Site, kostenlos für alle."
date: 2026-05-07
tags: ["React", "Canvas API", "CSS", "Tool"]
featured: true
url: "https://ptrckschrdtr.de/tools/gradient-generator"
---

Ich brauchte Cover-Bilder für Blog-Posts. Keine Fotos, keine Stock-Illustrationen — sondern abstrakte, weiche Farbverläufe die zur Stimmung eines Texts passen und mit dem Design dieser Seite harmonieren.

Also habe ich ein Tool gebaut.

## Was es kann

Sechs Presets in einer gedämpften Rose-Mauve-Creme-Palette dienen als Ausgangspunkt. Alle Parameter sind frei editierbar:

- **Vier unabhängige Orbs** — Farbe, Position, Größe, Weichheit und Deckkraft pro Orb
- **Hintergrundfarbe** und **Grain-Intensität** global steuerbar
- **PNG-Export** in fünf Formaten (21:9 für Blog-Cover, 16:9, 3:2, 1:1, 9:16)
- Funktioniert auf Desktop und Mobil

## Wie es gebaut ist

Die Live-Vorschau nutzt CSS `filter: blur()` auf absolut positionierten `<div>`-Elementen. Der Effekt ist rein CSS — kein Canvas, kein WebGL in der Vorschau.

Der Export dagegen rendert alles auf einem `<canvas>`-Element neu, weil CSS-Filter nicht pixelgenau exportierbar sind. Das Grain wird dabei direkt in die Pixel-Daten geschrieben — echter, statischer Filmkorn statt eines Overlay-Filters.

Die Controls nutzen shadcn/ui (Slider, Sheet, Accordion) und React für State-Management.
