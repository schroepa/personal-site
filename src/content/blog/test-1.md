---
title: "Der Aufstieg des Design Engineers: Wie ich KI und shadcn nutze, um die Lücke zwischen Figma und Produktion zu schließen"
description: "Warum der Design Engineer die Brücke zwischen Figma und Code schließt — und wie man mit shadcn und KI-Workflows skalierbare Systeme baut."
date: 2026-04-09
tags: ["Design", "Typografie", "CSS"]
coverImage: "/images/blog/blog-image-4.png"
draft: false
---

In der klassischen Produktentwicklung gibt es oft eine unsichtbare Mauer: Auf der einen Seite steht das Design (Pixel, Vektoren, Figma-Files), auf der anderen das Engineering (React, Tailwind, Logik). Dazwischen liegt der „Handoff“ – ein Prozess, der oft mit Reibungsverlusten, Missverständnissen und „Das geht technisch so nicht“-Sätzen verbunden ist.

Nach 15 Jahren an dieser Schnittstelle sage ich: **Diese Mauer muss weg.**

Ich begreife mich nicht mehr nur als UI/UX Designer, sondern als **Design Engineer**. Mein Ziel ist es nicht, ein schönes Bild zu malen, sondern ein funktionierendes System zu bauen. Hier ist mein aktueller Stack und Workflow, mit dem ich diese Lücke schließe.

## 1. shadcn/ui: Design-Systeme, die "Developer-First" denken

Früher haben wir Monate damit verbracht, Buttons und Modals in Figma zu perfektionieren, nur um dann festzustellen, dass die Umsetzung im Code ganz anders aussieht.

Heute nutze ich **shadcn/ui**. Warum? Weil es kein starres Framework ist, sondern eine Sammlung von handwerklich perfekten Komponenten, die auf **Tailwind CSS** und **Radix UI** basieren.

- **Der Vorteil**: Wenn ich in Figma eine Komponente gestalte, weiß ich exakt, wie sie im Code aufgebaut ist.

- **Das Ergebnis**: Der Handoff ist kein Ratespiel mehr. Ich liefere Komponenten, die technisch bereits validiert sind.

## 2. KI als Hebel: Claude, Gemini und die CLI

KI ist für mich kein Ersatz für Kreativität, sondern ein **Effizienz-Boost** für die Umsetzung. Ich nutze LLMs (vor allem via CLI), um:

- **Rapid Prototyping**: Ich generiere funktionale Mockups direkt mit Tailwind-Code, um UX-Hypothesen in Minuten statt Stunden zu testen.

- **Code-Validierung**: „Wie würde ein Engineer diesen komplexen Filter-State in React lösen?“ – Die KI hilft mir, Design-Entscheidungen technisch zu untermauern.

- **Automatisierung**: Mit Tools wie n8n automatisiere ich repetitive Design-Ops, damit mehr Zeit für das eigentliche Problem-Solving bleibt.

## 3. Warum "In-Office" für Design Engineers entscheidend ist

Man kann Systeme remote planen, aber **Produkte baut man gemeinsam.** Als jemand, der 100 % Präsenz im Unternehmen liebt, weiß ich: Die besten Lösungen entstehen am Whiteboard oder beim schnellen Blick auf den Monitor des Sitznachbarn.

Wenn Design und Engineering im selben Raum sitzen und die gleiche Sprache (Code & Design-Tokens) sprechen, eliminieren wir das „Ping-Pong-Spiel“ der Abstimmungsschleifen.

## Fazit

Der moderne Product Designer muss unter die Haube schauen. Wer versteht, wie Tailwind, Git und KI-Workflows funktionieren, baut nicht nur schönere, sondern vor allem bessere Produkte.

Ich nenne es **„Hacking with Empathy“**. Es ist die Kunst, technisches Verständnis zu nutzen, um die bestmögliche Experience für den Nutzer zu bauen.
