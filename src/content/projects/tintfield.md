---
title: "Tintfield — Farbskalen, die einfach funktionieren"
description: "Eine Farbe rein, eine komplette, kontrastsichere Skala raus, im System, das du ohnehin nutzt: Tailwind, Radix, Material und mehr. Ohne Einstellungen, ohne Anmeldung."
coverImage: "/images/gallery/tintfield/tintfield-hero.jpg"
date: 2026-09-24
tags: ["Tool", "Astro", "React", "TypeScript", "OKLCH", "Design Systems"]
url: "https://tintfield.ptrckschrdtr.de"
repo: "https://github.com/schroepa/Color-Ramp-Generator-"
featured: true
wirkung: "Eine Farbe rein, eine kontrastsichere Skala raus, für Tailwind, Radix und Material."
format: "4x5"
fakten:
  - label: "Rolle"
    wert: "Konzept, Design, Code"
  - label: "Jahr"
    wert: "2026"
  - label: "Stack"
    wert: "Astro, React, TypeScript, OKLCH"
kennzahlen:
  - wert: "1"
    label: "Farbe rein"
  - wert: "6"
    label: "Skalen-Systeme"
  - wert: "0"
    label: "Einstellungen"
---

## Ausgangslage

Wer schon einmal eine Markenfarbe in ein Design System übersetzen musste, kennt das Spiel: Hex-Wert in einen Generator, elf Abstufungen zurück, und erst später merkt man, dass Stufe 400 und 500 kaum zu unterscheiden sind und die Markenfarbe irgendwo zwischen zwei Stufen hängt.

Text auf Weiß ist bei Teal ab 600 lesbar, bei Orange aber erst ab 700. Tintfield ist mein Versuch, genau diese Nacharbeit überflüssig zu machen.

## Ansatz

### Kontrast statt Helligkeit

Die meisten Generatoren verteilen die Helligkeit gleichmäßig über die Skala. Tintfield verteilt stattdessen den **Kontrast**: jede Stufe ist klar unterscheidbar, die Farbe landet auf ihrer natürlichen Stufe, und gleiche Stufen bestehen dieselben Prüfungen.

Gerechnet wird im OKLCH-Farbraum mit [culori](https://culorijs.org/), weil wahrgenommene Helligkeit dort deutlich gleichmäßiger abgebildet wird als in HSL.

## Einblicke

![Der Generator mit zwei Skalen](/images/gallery/tintfield/tintfield-app.jpg "Generator")

### Mehrere Skalen nebeneinander

Basisstufe pro Farbe überschreiben, Ergebnisse in Vorschau und Kontrastansicht prüfen. Alles im Browser, ohne Account.

## Entscheidungen

### Spricht dein System

Presets für Tailwind 50–950, Radix 1–12, Material 3, Ant Design, Carbon und Open Color. Man arbeitet mit den Stufennamen, die im Projekt ohnehin existieren.

### Export ohne Umweg

Tailwind v4 (`@theme`), Tailwind v3, CSS Custom Properties oder Design Tokens, jeweils für Light und Dark.

### Ein Projekt, zwei Teile

Marketing-Site und App sind ein Astro-Projekt mit React-Islands. Die Farbmathematik ist mit Vitest abgesichert.

## Ergebnis

Die Skalen sind auch die Grundlage für das Theming in [ProMan](/projects/proman). Als Nächstes kommt ein Figma-Plugin, das die Skalen als Variables mit Light- und Dark-Modus anlegt.
