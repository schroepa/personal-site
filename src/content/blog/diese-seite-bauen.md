---
title: "Wie ich diese Seite gebaut habe — und warum so"
description: "Tech Stack, Typografie, Micro-Interactions: Die Entscheidungen hinter ptrckschrdtr.de, Schicht für Schicht erklärt."
date: 2026-05-07
tags: ["Astro", "Design Systems", "UI Design", "CSS"]
draft: false
---

Jede persönliche Website ist ein Statement. Nicht über sich selbst — das wäre zu einfach. Sondern darüber, wie man denkt. Welche Kompromisse man eingeht und welche nicht. Wo man Aufwand investiert, den niemand sofort sieht.

Diese Seite ist mein Statement. Ich erkläre, was drin steckt.

## Der Stack — und warum er kein Zufall ist

Die meisten persönlichen Sites entstehen so: Man nimmt das Framework, das man gerade am meisten verwendet, wirft ein paar Komponenten rein und nennt es fertig. Das ist legitim. Es ist nur keine Entscheidung.

Ich habe mich für **Astro** entschieden, weil es die einzige Antwort auf eine simple Frage ist: Wie baue ich eine Website, die fast kein JavaScript ausliefert, aber trotzdem interaktive Komponenten haben kann?

Astro rendert alles statisch. Nur was wirklich client-seitig sein muss, wird als JavaScript mitgeschickt — und auch dann nur wenn es sichtbar ist (`client:visible`). Das Ergebnis ist eine Site die sich anfühlt wie eine native App, aber lädt wie ein HTML-Dokument aus 2003.

**React** kommt nur für shadcn/ui zum Einsatz. Nicht für Seiten, nicht für Routing, nicht für State. Nur für Komponenten. Das ist die richtige Abstraktionsebene.

**Tailwind v4** hat mich anfangs skeptisch gemacht — keine `tailwind.config.js` mehr, alles in CSS. Aber genau das ist das Feature. Design Tokens leben dort wo sie hingehören: in der Stylesheet-Datei, nicht in einer JavaScript-Konfiguration. Mit `@theme` ist die Wahrheit eine einzige Datei.

**shadcn/ui** ist kein Komponenten-Framework. Es ist ein Ausgangspunkt. Die Komponenten werden in den eigenen Code kopiert und können dann beliebig angepasst werden. Kein verschachteltes `node_modules`, keine Breaking Changes durch Updates, kein Vendor Lock-in. Das ist das Modell, das ich für Design Systems schon lange propagiere — und hier lebt es es auch in der eigenen Website.

## Geist — die einzige richtige Wahl

Geist ist Vercels eigene Schrift. Variable Font, monochrom in seiner Anmutung, technisch und warm gleichzeitig. Sie passt zu einer Site über Interface Design auf eine Art, die schwer zu erklären ist — man muss sie einfach nebeneinander sehen.

Entscheidend: kein Google Fonts, kein CDN. Geist läuft aus dem npm-Paket, lokal. Kein Request an externe Server, keine DSGVO-Grauzone, keine Latenz. Das ist kein Aufwand — das ist die richtige Entscheidung.

## Das Typografie-System

Die meisten Sites haben Schriftgrößen. Diese Site hat ein **Typografiessystem**.

Acht Größen nach der *Major Third*-Skala (Faktor 1.250), als CSS Custom Properties definiert:

```css
--text-xs:   0.64rem;  /*  10.24px */
--text-sm:   0.8rem;   /*  12.8px  */
--text-base: 1rem;     /*  16px    */
--text-md:   1.25rem;  /*  20px    */
--text-lg:   1.563rem; /*  25px    */
--text-xl:   1.953rem; /*  31.25px */
--text-2xl:  2.441rem; /*  39px    */
--text-3xl:  3.052rem; /*  48.8px  */
```

Dazu semantische Klassen — `.t-hero`, `.t-h1`, `.t-lead`, `.t-body` — die Größe, Zeilenhöhe, Laufweite und Gewicht in einem bündeln. Kein Zusammenstückeln von Utility-Klassen für jede Überschrift. Eine Klasse, ein Ton.

Das ist der Unterschied zwischen einem Stylesheet und einem System.

## Micro-Interactions — die Schicht die man spürt

Ich glaube nicht an Animation um der Animation willen. Jede Bewegung auf dieser Site hat eine Funktion.

**Custom Cursor:** Zwei Elemente — ein kleiner Dot der sofort folgt, ein Ring der mit einem Lerp-Faktor von 0.12 nachläuft. Der Lag macht ihn lebendig. Hover-States kommunizieren semantische Information: ein anderer Cursor auf Links als auf Buttons als auf Text. Das ist kein Effekt — das ist Feedback.

**Magnetic Buttons:** Buttons die sich leicht in Richtung des Cursors bewegen, mit max. 12px Versatz. Das innere Label bewegt sich mit halber Intensität — ein subtiler Tiefeneffekt der suggeriert, dass hier mehrere Schichten liegen. Niemand bemerkt es bewusst. Alle bemerken, dass sich etwas *richtig* anfühlt.

**Text Reveal:** Überschriften die Wort für Wort von unten einlaufen. Keine Fade-Ins, keine simple Opacity-Animation. Jedes Wort hat einen eigenen Overflow-Container — der Effekt ist sauber, ohne Antialiasing-Artefakte. Staggering von 55ms pro Wort macht den Unterschied zwischen Mechanik und Rhythmus.

Alle Animationen respektieren `prefers-reduced-motion`. Das ist kein optionales Feature — es ist Voraussetzung.

## Der Hero-Hintergrund

Die Inspiration war das Gemini-Feature auf google.com — fließende Farbfelder die sich langsam ineinander bewegen. Ich wollte dasselbe, aber in meinem Farbsystem: kein Blau, kein Lila, kein Gradient-Overkill.

Das Ergebnis: vier Orbs in einem `blur(80px)`-Container. Zwei in einem gedämpften Sandgelb (`oklch(0.88 0.04 75)`), zwei in einem dezenten Salbeigrün (`oklch(0.88 0.03 145)`). Jeder Orb läuft mit einer eigenen Keyframe-Animation in unterschiedlichen Zykluslängen — sie synchronisieren sich nie. Das Muster ist immer frisch.

Der Cursor verschiebt den gesamten Mesh leicht in seine Richtung — mit einem Lerp-Faktor von 0.035, also sehr träge. Es fühlt sich an wie ein schweres Objekt das angezogen wird, nie wie ein Spotlight das folgt.

Kein Canvas. Kein WebGL. Reines CSS und 30 Zeilen JavaScript.

## Was ich beim nächsten Mal anders machen würde

Nichts am Stack. Der hat sich bewährt.

Aber ich würde früher anfangen, echte Inhalte zu schreiben. Design ohne Inhalt ist Dekoration — man merkt erst im echten Text, ob das Prose-Styling funktioniert, ob die Zeilenlänge stimmt, ob die Hierarchie trägt. Placeholder-Content lügt.

Diese Site lebt jetzt. Daran ändert sich was.
