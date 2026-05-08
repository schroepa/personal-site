---
title: "Typografie ist das Interface"
description: "Warum gute Schriftsetzung nicht Dekoration ist, sondern Infrastruktur — und wie man sie im Web richtig umsetzt."
date: 2024-11-12
tags: ["Design", "Typografie", "CSS"]
coverImage: "/images/blog/blog-image-04.png"
draft: false
---

Es gibt einen Moment im Design-Prozess, der alles entscheidet — und er hat nichts mit Farbe, Layout oder Illustrationen zu tun. Es ist der Moment, in dem man die Schrift wählt und festlegt, wie sie sich verhält.

Typografie ist nicht Dekoration. Sie ist das Interface selbst.

## Lesbarkeit ist Respekt

Wenn Nutzer einen Text lesen, interagieren sie mit jedem einzelnen Buchstaben. Die Zeilenhöhe bestimmt, wie leicht das Auge zur nächsten Zeile springt. Der Zeilenabstand entscheidet, ob ein Text zum Lesen einlädt oder abstößt. Die Schriftgröße kommuniziert Hierarchie — noch bevor der Inhalt gelesen wurde.

Ein Interface mit schlechter Typografie signalisiert: *Wir haben nicht nachgedacht.* Es zwingt Nutzer, kognitive Arbeit zu leisten, die das Design hätte übernehmen sollen.

## Skalen, nicht Einzelgrößen

Der häufigste Fehler ist die willkürliche Festlegung von Schriftgrößen. "12px für Labels, 16px für Text, 24px für Überschriften" — ohne Relation, ohne System.

Ein durchdachtes Typografiystem arbeitet mit einer Skala. Die *Major Third* (Faktor 1.250) erzeugt Größensprünge, die harmonisch wirken, ohne dramatisch zu sein:

```
10.24px → 12.8px → 16px → 20px → 25px → 31.25px → 39px → 48.8px
```

Jeder Wert hat seinen Platz. Die Abstufungen kommunizieren Hierarchie von selbst.

## Variable Fonts ändern alles

Mit Variable Fonts ist font-weight keine diskrete Auswahl mehr, sondern ein Kontinuum. Statt `font-weight: 700` zu schreiben, kann man mit `font-weight: 420` arbeiten — und einen Ton treffen, der zwischen Regular und Medium liegt.

Das erlaubt subtile typografische Kontraste, die mit statischen Fonts schlicht nicht möglich sind. Ein Headline-Text bei 480 statt 500 wirkt weniger robust, mehr gelassen. Dieser Unterschied ist winzig — und macht alles aus.

## Zeilenbreite als Kompositionsmittel

Die optimale Zeilenlänge liegt zwischen 50 und 75 Zeichen. Das ist kein ästhetisches Diktat, sondern Physiologie: Das Auge verliert bei längeren Zeilen den Anfang der nächsten Zeile.

`max-width: 65ch` ist daher keine Einschränkung — es ist eine Entscheidung für den Leser.

Aber Zeilenbreite ist auch ein Kompositionsmittel. Kurze Zeilen erzeugen Spannung, Rhythmus, Emphase. Ein einzelner Satz auf der vollen Breite einer Seite ist eine Aussage — über Inhalt und Form gleichzeitig.

## Was Bewegung mit Schrift macht

Wenn Text ins Bild kommt — durch eine Animation, einen Übergang — verändert sich sein Gewicht. Buchstaben, die von unten ins Frame gleiten, wirken anders als solche, die einfach erscheinen.

Das ist keine Spielerei. Es ist eine weitere Schicht von Bedeutung, die Typografie tragen kann — wenn man ihr vertraut.
