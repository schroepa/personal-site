---
title: "Grainy Gradient Generator — Ein Tool, das ich für diese Seite gebaut habe"
description: "Warum ich einen eigenen Gradient-Generator entwickelt habe, wie er technisch funktioniert und was man damit machen kann."
date: 2026-05-07
tags: ["CSS", "Canvas API", "Tools", "Design"]
coverImage: "/images/blog/blog-image-1.png"
draft: false
---

Ich brauchte Cover-Bilder für Blog-Posts. Keine Fotos, keine Illustrationen — sondern abstrakte Farbverläufe, die zur Stimmung eines Texts passen und mit dem Design dieser Seite harmonieren.

Also habe ich ein Tool gebaut.

## Das Problem mit fertigen Lösungen

Es gibt unzählige Gradient-Generatoren im Web. Die meisten haben dasselbe Problem: Sie erzeugen Bilder, die überall gleich aussehen. Dieselben gesättigten Farbkombinationen, dasselbe Rendering, dasselbe ästhetisches Vokabular.

Ich wollte etwas anderes. Weiche Formen, gedämpfte Farben, Grain — und vollständige Kontrolle über jeden Parameter. Ohne Konto, ohne Export-Limit, ohne monatliches Abo.

Die Lösung: selbst bauen.

## Wie es funktioniert

Das Tool ist technisch unspektakulär — das ist das Schöne daran.

**Live-Vorschau: CSS radial-gradient + filter: blur()**

Vier überlagerte `<div>`-Elemente, jedes ein farbiger Kreis. Das Geheimniss ist `filter: blur()` — je mehr Unschärfe, desto weicher und größer wirkt der Farbbereich. Wenn sich mehrere unscharfe Kreise überlappen, entsteht der weiche Mesh-Effekt.

```css
.orb {
  position: absolute;
  border-radius: 50%;
  background: #C8906A;
  filter: blur(90px);
  opacity: 0.72;
}
```

Das Grain in der Vorschau ist ein SVG-Filter (`feTurbulence` + `fractalNoise`), der per CSS als Pseudo-Element über die Vorschau gelegt wird. Er wird dabei in kurzen Intervallen leicht verschoben — das erzeugt den Filmkorn-Effekt, den echtes Grain hat.

**Export: Canvas API + Pixel-Manipulation**

Hier wird es etwas technischer. Der CSS-Ansatz lässt sich nicht direkt exportieren — `filter: blur()` auf DOM-Elementen ergibt keine Pixel-Datei.

Für den Export rendere ich alles neu auf einem `<canvas>`-Element. Jeder Orb wird als radialer Gradient mit elliptischer Skalierung gezeichnet:

```javascript
ctx.filter = `blur(${blurRadius}px)`
ctx.globalAlpha = opacity

const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
grad.addColorStop(0,   'rgba(200,144,106,1)')
grad.addColorStop(0.6, 'rgba(200,144,106,0.4)')
grad.addColorStop(1,   'rgba(200,144,106,0)')

ctx.fillStyle = grad
ctx.fill()
```

Das Grain ist beim Export kein Filter — es sind echte Pixel-Werte. Nach dem Rendern der Orbs lese ich das `ImageData`-Array aus und addiere für jeden Pixel einen zufälligen Rauschwert:

```javascript
const noise = (Math.random() - 0.5) * grainAmplitude
data[i]     = Math.max(0, Math.min(255, data[i]     + noise)) // R
data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)) // G
data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)) // B
```

Das Ergebnis ist echter, statischer Grain direkt in den Pixeln des exportierten PNG — kein Overlay, kein Filter-Artefakt, keine Kompression.

## Warum nicht einfach Screenshot?

Screenshots sind abhängig von der Bildschirmauflösung und dem Browser-Zoom. Ein PNG-Export via Canvas ist auflösungsunabhängig — man wählt 2100×900 Pixel, bekommt genau das.

Außerdem: Screenshot-Tools führen manchmal Antialiasing-Artefakte ein. Der Canvas-Export ist pixelgenau.

## Das Tool ausprobieren

Der Generator läuft direkt auf dieser Seite — keine Installation, kein Login.

→ **[Gradient Generator öffnen](/tools/gradient-generator)**

Sechs Presets in der Rose/Mauve/Creme-Palette stehen bereit. Alle Parameter sind frei anpassbar: Farbe, Position, Größe, Weichheit und Deckkraft jedes Orbs, Hintergrundfarbe, Grain-Intensität. Export als PNG in verschiedenen Formaten — 21:9 für Blog-Cover, 16:9, 1:1, 9:16 für Stories.

`←` `→` wechselt zwischen den Presets.
