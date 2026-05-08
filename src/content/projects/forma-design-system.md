---
title: "Forma Design System"
description: "Ein komponentenbasiertes Design System für eine Enterprise-SaaS-Plattform — von der Token-Architektur bis zur Dokumentation."
coverImage: "/images/gallery/bg-design-system-sander.png"
date: 2024-10-01
tags: ["Design Systems", "Figma", "React", "TypeScript"]
featured: true
repo: "https://github.com"
---

Forma ist das Design System, das ich für eine mittelgroße SaaS-Plattform mit drei Produkten und einem Team von zwölf Designern und Entwicklern aufgebaut habe.

## Ausgangslage

Drei Produkte, drei Codebasen, dreimal ähnlich aussehende Buttons — aber keiner davon identisch. Das war die Ausgangslage: technische Schulden in Designform.

Das Ziel war kein *Styleguide*, der in einem Wiki veraltet. Gefragt war ein lebendiges System, das in den täglichen Workflow integriert ist.

## Token-Architektur

Forma arbeitet mit drei Token-Ebenen:

1. **Primitive Tokens** — Rohe Werte ohne Kontext: `color.grey.900`, `spacing.4`
2. **Semantic Tokens** — Bedeutungstragende Referenzen: `color.foreground`, `spacing.content`
3. **Component Tokens** — Komponentenspezifisch: `button.padding.horizontal`

Diese Hierarchie macht Theming trivial: Ein neues Thema überschreibt nur die semantische Ebene — die Primitives und Komponenten bleiben unberührt.

## Komponenten-Bibliothek

Die Komponentenbibliothek umfasst 60+ Komponenten in React mit TypeScript. Jede Komponente folgt dem gleichen Muster:

- Eingekapselte Logik, keine externen Abhängigkeiten
- Zugänglichkeit nach WCAG 2.1 AA als Grundanforderung
- Variants über `class-variance-authority`, nicht über Prop-Drilling
- Vollständige Storybook-Dokumentation mit Interaction Tests

## Figma-Synchronisation

Das entscheidende Feature: Tokens werden via Style Dictionary aus einer einzigen JSON-Datei generiert — sowohl für CSS Custom Properties als auch für Figma Variables. Design und Code sind nie mehr als einen Commit auseinander.

## Ergebnis

Nach sechs Monaten: 40% weniger Design-Review-Kommentare, drei neue Features in Rekordzeit gebaut, kein "warum sieht dieser Button anders aus" mehr in Retros.

Das war der Moment, in dem ein System aufhört, Aufwand zu sein — und anfängt, Geschwindigkeit zu bedeuten.
