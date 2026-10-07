---
title: "Tintfield — Farbskalen, die einfach funktionieren"
description: "Eine Farbe rein, eine komplette, kontrastsichere Skala raus — im System, das du ohnehin nutzt: Tailwind, Radix, Material und mehr. Ohne Einstellungen, ohne Anmeldung."
coverImage: "/images/gallery/tintfield/tintfield-hero.jpg"
date: 2026-09-24
tags: ["Astro", "React", "TypeScript", "OKLCH", "Design Systems", "Tool"]
url: "https://tintfield.ptrckschrdtr.de"
repo: "https://github.com/schroepa/Color-Ramp-Generator-"
featured: true
---

Wer schon einmal eine Markenfarbe in ein Design System übersetzen musste, kennt das Spiel: Man wirft den Hex-Wert in einen Generator, bekommt elf Abstufungen zurück — und merkt erst später, dass Stufe 400 und 500 kaum zu unterscheiden sind, die Markenfarbe irgendwo zwischen zwei Stufen hängt und Text auf Weiß bei Teal ab 600 lesbar ist, bei Orange aber erst ab 700. Tintfield ist mein Versuch, genau diese Nacharbeit überflüssig zu machen.

![Tintfield Startseite](/images/gallery/tintfield/tintfield-hero.jpg)

## Kontrast statt Helligkeit

Die meisten Generatoren verteilen die Helligkeit gleichmäßig über die Skala. Das klingt logisch, führt aber zu Stufen, die sich je nach Farbton unterschiedlich verhalten. Tintfield verteilt stattdessen den **Kontrast**. Das Ergebnis:

- **Jede Stufe ist klar unterscheidbar** — keine zwei Töne, die optisch zusammenfallen.
- **Deine Farbe landet auf ihrer natürlichen Stufe** — ein dunkles Teal sitzt auf 700, ein helleres Orange auf 600, statt zwangsweise auf 500.
- **Gleiche Stufe, gleicher Kontrast** — Teal 600 und Orange 600 bestehen dieselben Prüfungen. Damit lässt sich eine einzige Regel für die ganze Palette schreiben, etwa: Text auf Weiß ab 600.

Gerechnet wird im OKLCH-Farbraum mit [culori](https://culorijs.org/), weil wahrgenommene Helligkeit dort deutlich gleichmäßiger abgebildet wird als in HSL.

## Spricht dein System

Tintfield bringt Presets für die gängigen Skalen-Konventionen mit — Tailwinds 50–950, Radix' 1–12, Material-3-Töne, Ant Design, Carbon und Open Color. Man arbeitet also mit den Stufennamen, die im eigenen Projekt ohnehin schon existieren, statt sie hinterher umzumappen.

![Der Generator mit zwei Skalen](/images/gallery/tintfield/tintfield-app.jpg)

## Von der Farbe zum Code in drei Schritten

1. **Farbe wählen** — Hex einfügen oder mit einem der Beispiele starten.
2. **System wählen** — Tailwind, Radix, Material und weitere.
3. **Exportieren** — als Tailwind v4 (`@theme`), Tailwind v3, CSS Custom Properties oder Design Tokens, jeweils für Light und Dark.

Im Generator selbst lassen sich mehrere Skalen nebeneinander anlegen, die Basisstufe pro Farbe überschreiben und die Ergebnisse in einer Vorschau- und einer Kontrastansicht prüfen. Alles läuft im Browser, ohne Account und ohne Limits.

## Wie es gebaut ist

Marketing-Site und App sind ein gemeinsames Astro-Projekt mit React-Islands für die interaktiven Teile, gestylt mit Tailwind CSS und shadcn/ui-artigen Primitives. Die Landingpage gibt es auf Englisch und Deutsch. Die Farbmathematik ist mit Vitest abgesichert.

Die Skalen sind übrigens auch die Grundlage für das Theming in [ProMan](/projects/proman) — dort lassen sich die 12-stufigen Neutral- und Brand-Skalen direkt gegen Tintfield-Presets austauschen.

## Was als Nächstes kommt

Ein **Figma-Plugin**, das die Skalen als Figma Variables inklusive Light- und Dark-Mode anlegt — ändert man die Ausgangsfarbe, ziehen alle Variablen mit.
