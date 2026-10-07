---
title: "ProMan — Local-First Projektmanagement"
description: "Kanban, Liste, Gantt, Kalender und Docs in einer App — gespeichert als Markdown in einem Ordner auf deiner Festplatte. Kein Backend, keine Telemetrie, Obsidian-kompatibel."
coverImage: "/images/gallery/proman/proman-board.jpg"
date: 2026-10-07
tags: ["TypeScript", "Vite", "Local-First", "Design Systems", "Accessibility"]
url: "https://proman.ptrckschrdtr.de"
repo: "https://github.com/schroepa/pro-man"
featured: true
---

Projektmanagement-Tools gibt es wie Sand am Meer — fast alle haben eines gemeinsam: Die Daten liegen auf fremden Servern, in einem Format, das man ohne das Tool kaum noch lesen kann. Für ein kleines Team oder die eigene Freelance-Arbeit ist das oft mehr Abhängigkeit als nötig. ProMan dreht das um: Die Quelle der Wahrheit ist ein ganz normaler Ordner voller Markdown-Dateien.

![ProMan Kanban-Board](/images/gallery/proman/proman-board.jpg)

## Ein Ordner als Datenbank

Über die File System Access API verbindet man ProMan mit einem lokalen Ordner — dem Vault. Jede Aufgabe wird zu einer lesbaren Markdown-Datei mit kompaktem Frontmatter, `# Titel` und Beschreibung. Kunden, Projekte und Personen liegen in einer `clients.json`, Dokumente als `DOC-*.md`, Anhänge in einem eigenen Unterordner.

```
mein-vault/
  clients.json
  tasks/ACM-WEB-1.md
  tasks/archive/
  docs/DOC-*.md
  attachments/
```

Das hat ein paar angenehme Nebeneffekte: Der Vault lässt sich in Obsidian öffnen, mit Git versionieren oder einfach im Finder durchsuchen. Gelöscht wird nichts — erledigte und entfernte Aufgaben wandern ins Archiv. Ohne verbundenen Ordner fällt ProMan auf `localStorage` zurück, inklusive Beispieldaten zum Ausprobieren.

Kleine Teams können denselben Vault auf einem NAS oder SMB-Share verbinden. Statt eines Sync-Servers gibt es „Soft Concurrency": Man wählt beim Start „Ich bin …", ProMan erkennt fremde Änderungen über einen Content-Digest, warnt mit einem Banner und schreibt atomar, damit nichts überschrieben wird.

## Fünf Blickwinkel auf dieselben Aufgaben

![Dashboard: Was braucht Aufmerksamkeit?](/images/gallery/proman/proman-dashboard.jpg)

- **Übersicht** — Startseite mit Fokus-KPIs: offen, dringend/überfällig, diese Woche fällig, in Arbeit.
- **Kanban** — Drag & Drop per Maus *und* Tastatur, Subtasks inline, Issue-Keys wie `ACM-WEB-12`.
- **Liste** — Sortierung, Mehrfachauswahl, Bulk-Änderungen, CSV-Import/-Export und ICS-Export.
- **Gantt** — Balken verschieben, Start und Ende ziehen, Abhängigkeiten sichtbar.
- **Kalender & Docs** — Monatsraster nach Fälligkeit, dazu Markdown-Dokumente mit Wikilinks und Hierarchie.

![Gantt-Timeline mit Abhängigkeiten](/images/gallery/proman/proman-gantt.jpg)

Dazu kommen eigene Kundenseiten mit Stammdaten, Kontakten und Projekten, eine ⌘K-Command-Palette, Undo/Redo, wiederkehrende Aufgaben, Zeiterfassung und ein paar bewusst strenge Domänenregeln: Eine Aufgabe kann nicht erledigt werden, solange Subtasks offen sind, und zirkuläre Abhängigkeiten werden beim Speichern blockiert.

## Ohne UI-Library, mit eigenem Design System

ProMan ist bewusst in Vanilla TypeScript mit Vite gebaut — kein React, kein Tailwind, kein shadcn. Alles läuft über ein eigenes Token-System:

- **Primitives** — 12-stufige Neutral- und Brand-Skalen, austauschbar über Presets aus [Tintfield](/projects/tintfield).
- **Semantische Surfaces** — `canvas` → `sidebar` → `surface` → `elevated`. Hierarchie entsteht über Flächen und Elevation statt über Rahmen („Zero-Border").
- **Typografie** — Geist und Geist Mono, self-hosted als Variable Fonts.
- **Formen** — Squircles und konzentrische Radien.

Light und Dark Mode, Deutsch und Englisch sowie eine PWA-App-Shell sind von Anfang an dabei.

## Barrierefreiheit und Tests als Vertrag

Accessibility ist nicht nachträglich drangeschraubt: Skip-Link, `aria-live`-Announcer, Tastatur-Drag-&-Drop auf dem Board, eigene Selects nach dem Listbox-Pattern und respektiertes `prefers-reduced-motion`. Abgesichert wird das mit Vitest, happy-dom und axe-core — neben klassischen Unit-Tests gibt es eigene **Design-Integritäts-** und **UX-Vertrags-Tests**, die etwa prüfen, dass keine nativen `<select>` in die Produkt-UI rutschen oder Kontraste stimmen. Die CI läuft bei jedem Push.

Während der Entwicklung habe ich außerdem zwei strukturierte UX-Audits durchgeführt — einmal den Weg vom ersten Start bis zur produktiven Nutzung, einmal die komplette App inklusive Mobile — und die Findings direkt in die Roadmap übernommen.
