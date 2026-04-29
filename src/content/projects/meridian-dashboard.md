---
title: "Meridian — Analytics Dashboard"
description: "Redesign eines komplexen Daten-Dashboards mit Fokus auf kognitive Last, Informationshierarchie und Echtzeit-Interaktion."
date: 2024-07-15
tags: ["UI Design", "Data Visualization", "React", "Recharts"]
featured: true
---

Meridian ist ein Analytics-Dashboard für ein Logistikunternehmen, das Echtzeitdaten aus 200+ Standorten aggregiert und visualisiert.

## Das Problem mit Dashboards

Die meisten Dashboards haben dasselbe Problem: Sie zeigen alles auf einmal. Jedes Diagramm, jede Zahl, jede Statustabelle in einem einzigen, erschlagenden Bildschirm.

Das ist kein Informationsdesign — das ist Informationsvermeidung.

## Hierarchie als Designentscheidung

Der erste Schritt war eine Inventur der Daten: Was entscheidet der Nutzer auf Basis dieses Dashboards, und *wie schnell* muss er das können?

Das ergab drei Ebenen:

**Kritisch** — Informationen, die sofortiges Handeln erfordern. Diese kommen immer first, prominent, unübersehbar.

**Operativ** — Tägliche Metriken und Trends. Lesbar auf einen Blick, nicht im Weg.

**Analytisch** — Historische Daten, Drilldowns, Exporte. Verfügbar, aber nicht im Vordergrund.

## Visuelle Sprache

Das bestehende Dashboard arbeitete mit 14 verschiedenen Charttypen. Meridian verwendet drei: Liniendiagramm, Balkendiagramm, Status-Indikator. Konsequenz statt Vollständigkeit.

Farbe hat eine einzige semantische Funktion: Status. Grün bedeutet in Ordnung, Gelb bedeutet Aufmerksamkeit, Rot bedeutet Eingreifen. Keine Farbe wird für ästhetische Zwecke verwendet.

## Echtzeit ohne Lärm

Echtzeit-Updates waren die größte technische Herausforderung — nicht wegen der Datenmenge, sondern wegen der Wahrnehmung. Ein Dashboard, das sich ständig sichtbar verändert, ist kognitiv erschöpfend.

Die Lösung: Updates werden gesammelt und alle 15 Sekunden in einer einzigen, sanften Transition angezeigt. Kritische Alerts kommen sofort. Alles andere wartet.

## Ergebnis

Nutzertests zeigten eine Reduktion der Zeit bis zur korrekten Entscheidung um 34%. Die wichtigere Zahl: Die mittlere Onboarding-Zeit für neue Mitarbeiter sank von drei Wochen auf fünf Tage.

Ein gutes Dashboard macht seinen Nutzer nicht smarter — es macht das Richtige einfacher.
