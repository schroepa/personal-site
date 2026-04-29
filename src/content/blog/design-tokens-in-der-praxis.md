---
title: "Design Tokens: Vom Konzept zur Praxis"
description: "Wie Design Tokens ein System kohärent halten — und warum CSS custom properties die beste Implementierung dafür sind."
date: 2024-09-03
tags: ["Design Systems", "CSS", "Tooling"]
draft: false
---

Design Tokens sind das Gedächtnis eines Design Systems. Sie speichern die Entscheidungen, die ein Interface zur Einheit machen: Farben, Abstände, Schriftgrößen, Radii, Schatten.

Das klingt banal. Ist es nicht.

## Das Problem vor Tokens

Stell dir vor, du hast ein Interface mit 47 verschiedenen Grautönen. Keiner davon ist absichtlich falsch — es sind die aufgesummierten Zufälligkeiten eines Systems, das ohne Vokabular gebaut wurde.

Das ist das Standard-Szenario ohne Design Tokens. Jeder Entwickler greift nach dem Grau, das *ungefähr* stimmt. Jeder Designer verwendet die Farbe, die im Kontext richtig aussieht. Das Ergebnis ist eine schleichende Inkohärenz — schwer zu sehen im Detail, offensichtlich im Ganzen.

## CSS Custom Properties als Token-Layer

Die eleganteste Implementierung von Design Tokens im Web sind CSS Custom Properties. Kein Build-Step, kein Tooling-Overhead — nur Variablen, die überall verfügbar sind.

```css
:root {
  --color-foreground: oklch(0.153 0.006 107.1);
  --color-muted: oklch(0.966 0.005 106.5);
  --radius-base: 0.45rem;
}
```

Der Vorteil gegenüber Sass-Variablen oder JavaScript-Konstanten: CSS Custom Properties sind zur Laufzeit veränderbar. Das ist die Basis für Theming, Dark Mode, User Preferences — ohne einen einzigen Rebuild.

## Semantische Tokens: Die zweite Schicht

Primitive Tokens — `--blue-500`, `--spacing-4` — beschreiben, *was* ein Wert ist. Semantische Tokens beschreiben, *wofür* er verwendet wird.

```css
:root {
  /* Primitives */
  --grey-900: oklch(0.153 0.006 107.1);

  /* Semantics */
  --color-foreground: var(--grey-900);
  --color-text-muted: var(--grey-500);
}
```

Diese Trennung ist entscheidend: Wenn sich eine Entscheidung ändert — "Überschriften sollen jetzt dunkelblau statt fast-schwarz sein" — ändert man einen Token, und das Interface folgt überall.

## Tokens in Tailwind v4

Tailwind v4 macht Design Tokens zur nativen Wahrheit. Der `@theme`-Block ist direkt an CSS Custom Properties gebunden:

```css
@theme {
  --color-background: oklch(1 0 0);
  --font-sans: 'Geist Variable', sans-serif;
}
```

Tailwind generiert daraus Utility-Klassen: `bg-background`, `text-foreground`, `font-sans`. Die Wahrheit liegt im CSS, nicht in einer JavaScript-Konfigurationsdatei.

Das ist der richtige Weg.

## Wann Tokens zu weit gehen

Es gibt einen Punkt, an dem Token-Systeme zu abstrakt werden. Wenn jeder Wert ein Token ist, verliert man die Orientierung. `--border-radius-card-inner-subtle` ist kein Token mehr — es ist ein Kommentar im falschen Format.

Ein gutes Token-System ist sparsam. Es benennt nur, was sich wiederholt und was sich ändern könnte. Alles andere ist lokale Entscheidung — und sollte es bleiben.
