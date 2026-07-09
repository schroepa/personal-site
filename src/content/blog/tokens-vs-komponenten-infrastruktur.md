---
title: "Tokens vs. Komponenten: Wo ein Design System aufhört, Design zu sein"
description: "Design Tokens sind Infrastruktur, keine Design-Entscheidung — und solange Teams das ignorieren, bauen sie fragile Systeme."
date: 2026-07-09
tags: ["Design Systems"]
coverImage: "/images/blog/blog-011.webp"
draft: true
---

Es gibt einen Satz, den ich in Design-System-Workshops immer wieder höre: "Lass uns erstmal die Komponenten bauen, die Tokens machen wir danach." Dieser Satz ist der zuverlässigste Indikator dafür, dass ein Design System in zwölf Monaten neu geschrieben werden muss. Nicht weil die Komponenten schlecht sind. Sondern weil die Reihenfolge falsch ist — und die Reihenfolge verrät, dass niemand im Raum verstanden hat, dass Tokens keine Design-Entscheidung sind. Sie sind Infrastruktur. Und Infrastruktur baut man zuerst, nicht nachträglich.

Diese Unterscheidung klingt nach Semantik-Klugscheißerei. Ist sie nicht. Sie hat direkte Konsequenzen dafür, ob ein Design System in fünf Jahren noch existiert oder ob es zu der Sache wird, die jedes Team kennt: dem Ordner mit 40 Komponenten, den niemand mehr anfasst, weil niemand mehr weiß, welche Regel hinter welcher Farbe steckt.

## Was "Infrastruktur" hier konkret bedeutet

Infrastruktur, im technischen Sinn, ist alles, wovon andere Dinge abhängen, das selbst aber austauschbar bleiben soll, ohne dass die abhängigen Dinge kaputtgehen. Ein Stromnetz ist Infrastruktur. Die Geräte, die daran hängen, sind es nicht. Du kannst den Toaster gegen einen anderen tauschen, ohne die Steckdose neu zu verlegen — aber nur, weil die Steckdose eine stabile, dokumentierte Schnittstelle ist (230V, Schuko-Norm), nicht weil sie zufällig passt.

Design Tokens sind exakt das für ein Interface. `--color-primary`, `--space-4`, `--radius-md`, `--font-weight-medium` — das sind keine Designentscheidungen im engeren Sinn. Sie sind die Schnittstellen-Definition, auf die sich jede Komponente verlassen können muss, ohne zu wissen, welchen konkreten Wert sie gerade hat. Eine Button-Komponente, die `border-radius: var(--radius-md)` schreibt, trifft keine Design-Entscheidung über Eckenradien. Sie deklariert eine Abhängigkeit. Die Design-Entscheidung — ist `--radius-md` 4px oder 8px oder 12px — passiert an einer anderen Stelle, in einer anderen Verantwortlichkeit, zu einem anderen Zeitpunkt.

Der Kategorienfehler, den fast jedes Team macht, ist, Tokens wie Komponenten-Details zu behandeln: als etwas, das man "beim Bauen der Komponente mit festlegt". Das Resultat sind Codebasen, in denen `border-radius: 8px` fünfzehnmal wörtlich im Component-Code auftaucht, weil jede Komponente ihre eigene, lokale Design-Entscheidung getroffen hat — die zufällig überall gleich aussieht, bis sie es eines Tages nicht mehr tut, weil eine Komponente vergessen wurde.

## Die zwei Fehlerrichtungen, die ich in der Praxis sehe

Ich habe in den letzten 15 Jahren Design Systems aus beiden Enden aufgebaut — als Entscheider bei DefShop, als eingebetteter Designer im Dev-Team bei Oetker Digital, als Lead bei A Eins Digital Innovation. Über alle drei Stationen hinweg gibt es zwei Fehlerrichtungen, die strukturell identisch sind, auch wenn sie aus entgegengesetzten Richtungen kommen.

**Fehlerrichtung eins: Komponenten ohne Tokens.** Design-Teams, die visuell exzellente Komponenten bauen — in Figma sieht alles konsistent aus —, aber jede Komponente referenziert ihre Werte hart. Ein Card-Component hat `padding: 24px`, ein Modal hat `padding: 24px`, ein Toast hat `padding: 20px`, weil "20 hat sich hier besser angefühlt". Auf den ersten Blick: kein Unterschied. Sechs Monate später, wenn das Produkt-Team beschließt, den Spacing-Rhythmus insgesamt kompakter zu machen, gibt es keinen einzigen Hebel, an dem man drehen kann. Man muss jede Komponente einzeln durchsuchen, hoffen, dass man alle 24px-Stellen findet, die tatsächlich "Card-Padding" meinen, und nicht zufällig eine 24px-Stelle erwischt, die etwas völlig anderes war.

**Fehlerrichtung zwei: Tokens ohne Governance.** Das ist die subtilere Variante, weil sie aussieht wie Erfolg. Ein Team führt Tokens ein — `--space-1` bis `--space-12`, eine ordentliche Skala, sauber in Figma Variables gepflegt. Aber es gibt keine Regel, wer neue Tokens hinzufügen darf, und keine Regel, wann ein neuer Wert gerechtfertigt ist. Nach einem Jahr hat die Skala 34 Spacing-Werte, weil jeder Designer, der einen Pixel-Wert brauchte, der nicht exakt passte, einfach einen neuen Token angelegt hat. Die Tokens existieren, aber sie erfüllen ihre Infrastruktur-Funktion nicht mehr — eine Schnittstelle mit 34 Varianten ist keine Schnittstelle, sie ist eine Excel-Tabelle mit Zwischenschritt.

Beide Fehler haben dieselbe Wurzel: Niemand hat Tokens als das behandelt, was sie sind — ein System mit eigenen Regeln, eigener Versionierung, eigener Verantwortlichkeit, getrennt von den Komponenten, die sie konsumieren.

Ein konkretes Szenario aus der Praxis, das ich mehrfach so oder ähnlich erlebt habe: Ein E-Commerce-Team führt einen neuen Sale-Banner ein, mit einem kräftigen Rot als Aufmerksamkeits-Farbe. Weil es keinen Token wie `--color-alert` gibt, schreibt der Entwickler `#e0393e` direkt in den Component-Code. Zwei Monate später soll dasselbe Rot auch für Fehlermeldungen im Checkout gelten — Marketing und Produkt haben sich auf eine einheitliche "Achtung"-Farbe geeinigt. Ein zweiter Entwickler, der die Fehlermeldung baut, kennt den Banner-Code nicht, tippt die Hex-Zahl aus dem Figma-File ab und trifft dabei knapp daneben: `#e1393e`. Beide Stellen sehen auf den ersten Blick identisch aus. Erst ein Screenshot-Vergleich in einem späteren QA-Durchlauf deckt den Unterschied auf — und niemand kann mehr sagen, welcher der beiden Werte der "richtige" war, weil keiner von beiden je als Entscheidung dokumentiert wurde. Mit einem einzigen `--color-alert`-Token wäre diese Divergenz strukturell unmöglich gewesen, nicht nur unwahrscheinlich.

## Warum "Single Source of Truth" ohne Tokens eine leere Behauptung ist

Jedes Design-System-Deck hat die Folie mit "Single Source of Truth". Fast keines hält, was die Folie verspricht, weil Single Source of Truth eine technische Eigenschaft ist, keine Marketing-Aussage. Es bedeutet konkret: Es gibt genau einen Ort, an dem ein Wert definiert ist, und jeder andere Ort, der diesen Wert nutzt, referenziert ihn, statt ihn zu duplizieren.

Das ist mit Komponenten allein unmöglich zu erreichen, weil Komponenten per Definition viele sind. Sobald du zehn Button-Varianten hast und die Primärfarbe soll sich ändern, brauchst du zehn synchronisierte Änderungen — es sei denn, keine der zehn Komponenten kennt die Farbe direkt. Sie kennen nur den Namen eines Tokens, und der Token kennt den Wert. Das ist der einzige Mechanismus, der "einmal ändern, überall wirksam" tatsächlich einlöst, statt es nur zu behaupten.

Bei meiner Arbeit an dieser Website nutze ich genau dieses Prinzip radikal konsequent: Ein Wert wie `--foreground` wird an exakt einer Stelle in der CSS definiert. Jede Komponente, die `text-foreground` als Tailwind-Klasse verwendet, zieht automatisch nach, wenn sich der Wert ändert — unabhängig davon, ob die Komponente ein Button, eine Card oder ein Blog-Post-Layout ist. Es gibt keinen Moment, in dem ich zehn Dateien durchsuchen muss, um sicherzugehen, dass ich nichts übersehen habe.

## Tailwind v4 und die stille Bestätigung dieser Trennung

Tailwind v4 hat, ohne es explizit so zu benennen, die Tokens-als-Infrastruktur-Idee in die Werkzeuglandschaft eingebaut. Mit der `@theme`-Direktive definierst du Design Tokens direkt als CSS Custom Properties in einer zentralen Stylesheet-Datei:

```css
@theme {
  --color-primary: oklch(0.55 0.18 250);
  --radius-md: 0.5rem;
  --spacing-card: 1.5rem;
}
```

Jede Utility-Klasse, die Tailwind daraus generiert (`bg-primary`, `rounded-md`, `p-card`), ist nichts anderes als ein benannter Zugriffspfad auf genau diese eine Quelle. Es gibt keine JavaScript-Konfigurationsdatei mehr, die zur Build-Zeit interpretiert und dann als statische Werte in den Output geschrieben wird — die Custom Properties bleiben zur Laufzeit im Browser lebendig. Das bedeutet: Ein Theme-Wechsel, ein A/B-Test mit anderer Primärfarbe, ein Dark-Mode-Toggle — all das kann passieren, ohne den CSS-Output neu zu bauen, weil der Browser selbst die Variable neu auflöst.

Das ist der technische Beweis für die Trennung, über die ich hier schreibe: Tailwind v4 zwingt dich nicht dazu, Tokens von Komponenten zu trennen, aber es belohnt es massiv. Wer weiterhin `bg-[#3b82f6]` statt `bg-primary` schreibt, bekommt trotzdem ein funktionierendes Interface — aber verzichtet auf genau den Hebel, der das System zu einem System macht statt zu einer Ansammlung von Screens, die zufällig gleich aussehen.

## Wo die Grenze zwischen Design und Infrastruktur wirklich verläuft

Die praktische Frage, die ich Design-System-Teams stelle, wenn sie unsicher sind, ob etwas ein Token oder eine Komponenten-Entscheidung ist: "Wenn sich dieser Wert morgen ändert — wie viele Dateien muss ich anfassen, damit das Produkt wieder konsistent aussieht?"

Ist die Antwort "eine" — die Token-Definition —, hast du Infrastruktur richtig gebaut. Ist die Antwort "so viele, wie ich finden kann", hast du eine Design-Entscheidung, die sich als System tarnt.

Diese Grenze verläuft nicht entlang von "abstrakt vs. konkret", wie viele Teams instinktiv annehmen. Ein Component-Prop wie `variant="destructive"` ist sehr konkret und trotzdem korrekt in der Komponenten-Schicht angesiedelt — weil er eine Entscheidung darüber trifft, WELCHES Aussehen in einem bestimmten Kontext gilt, nicht WAS dieses Aussehen konkret bedeutet. Die Trennung verläuft entlang von Verantwortlichkeit: Tokens definieren, was ein Wert bedeutet. Komponenten definieren, wann welcher Wert angewendet wird. Beides sind Design-Entscheidungen — aber sie gehören in unterschiedliche Schichten, mit unterschiedlicher Änderungsfrequenz und unterschiedlicher Governance.

Ein hilfreiches Gedankenexperiment: Tokens sollten sich seltener ändern als Komponenten. Wenn dein Team ständig neue Tokens anlegt, mit derselben Häufigkeit, mit der es neue Komponenten baut, hast du keine Infrastruktur — du hast eine zweite Komponenten-Schicht mit einem anderen Namen. Echte Infrastruktur ist träge, fast schon konservativ. Ein gutes Spacing-System hat vielleicht acht bis zwölf Werte, über Jahre stabil. Eine Komponenten-Bibliothek wächst dagegen kontinuierlich, weil neue Produktanforderungen neue Komponenten brauchen. Diese unterschiedliche Änderungsgeschwindigkeit ist selbst ein Signal dafür, welche Schicht du gerade anschaust.

## Der Versionierungs-Test

Ein weiterer Praxistest, den ich nutze: Kannst du Tokens und Komponenten unabhängig voneinander versionieren? Wenn eine Design-Token-Datei ihre eigene Versionsnummer hat — sagen wir, ein Semver-Schema, bei dem ein Patch-Release einen Farbwert leicht nachjustiert, ein Minor-Release neue Tokens ergänzt, ein Major-Release bestehende Token-Namen umbenennt oder entfernt — dann hast du bewiesen, dass die Trennung real ist. Komponenten können gegen eine bestimmte Token-Major-Version entwickelt werden, unabhängig davon, wie oft sich die Komponenten-Bibliothek selbst verändert.

Die meisten Teams, die ich kenne, können diesen Test nicht bestehen, weil Tokens und Komponenten im selben Package, im selben Release-Zyklus, mit derselben Versionsnummer ausgeliefert werden. Das ist nicht per se falsch — für kleinere Teams mit einem einzigen Produkt ist die zusätzliche Versionierungs-Komplexität oft unnötiger Overhead. Aber sobald mehrere Produkte oder mehrere Repositories dasselbe Design System konsumieren, wird die fehlende Trennung schmerzhaft: Ein Produkt will die neuen Komponenten, aber noch nicht das neue Farbschema. Ohne getrennte Versionierung ist das schlicht nicht möglich, ohne Komponenten zu forken.

## Figma Variables als Parallel-Beweis

Das gleiche Muster zeigt sich, wenn man auf die Design-Seite schaut, nicht nur auf Code. Figma Variables wurden bewusst als eigenständiges Konzept neben Components eingeführt — nicht als Property von Components. Eine Figma-Variable kann an Fill, Stroke, Corner Radius, Spacing, Text-Eigenschaften gebunden werden, über beliebig viele Components hinweg, mit Modes für Light/Dark oder Brand-Varianten. Das ist Figma, das dieselbe Architektur-Entscheidung trifft wie Tailwind v4: Werte gehören in eine eigene, zentrale Schicht, Components binden sich daran, statt Werte zu besitzen.

Der Bruch, den ich in nahezu jedem Projekt sehe, das ich übernehme: Figma Variables und Code-Tokens laufen als zwei komplett getrennte Systeme, die manuell synchron gehalten werden müssen, weil es keine offizielle Live-Verbindung zwischen Figma und einer Codebase gibt. `primary` in Figma und `--primary` im Code sind zwei unabhängige Wahrheiten, die zufällig denselben Namen tragen — bis jemand eine der beiden Seiten ändert, ohne die andere zu informieren. Das ist kein Argument gegen die Tokens-als-Infrastruktur-Idee, es ist ein Argument dafür, die Synchronisation selbst als Teil der Infrastruktur zu behandeln: eine klare Namenskonvention, ein dokumentierter Übersetzungsprozess, im Idealfall ein Skript, das Figma-Variable-Exports in CSS-Custom-Properties überführt, statt darauf zu vertrauen, dass zwei Menschen an zwei Orten dasselbe im Kopf haben.

## Was das für Entscheidungen über Ressourcen bedeutet

Für Product Leadership übersetzt sich diese technische Unterscheidung in eine sehr konkrete Budget-Frage: Wo investiere ich zuerst, wenn ich ein Design System aufbauen lasse? Die intuitive Antwort — "zeig mir schnell sichtbare Komponenten" — führt genau in die Falle, die ich oben beschrieben habe. Ein Team, das zuerst zwanzig Komponenten baut und die Token-Schicht "später nachzieht", produziert in der Zwischenzeit zwanzig kleine, unabhängige Design-Entscheidungen, die später mühsam vereinheitlicht werden müssen — mit echtem Entwicklungsaufwand, der in keinem ursprünglichen Sprint eingeplant war.

Die günstigere Reihenfolge ist unintuitiv, aber budgetär eindeutig: Tokens zuerst, auch wenn sie in der ersten Demo langweilig aussehen, weil es noch keine Components gibt, die sie sichtbar machen. Der Return kommt später, aber er kommt zuverlässig — jedes Rebranding, jeder Dark-Mode-Rollout, jeder A/B-Test an visuellen Grundwerten wird dann zu einer Änderung an einer Stelle statt zu einem Cross-Team-Projekt mit eigenem Sprint, eigenem QA-Durchlauf und eigenem Risiko, eine der zwanzig Komponenten zu vergessen. Das ist der Unterschied zwischen einem Design System, das mit dem Produkt mitwächst, und einem, das nach zwei Jahren an sein eigenes Gewicht kollabiert.

Am Ende ist die Trennung zwischen Tokens und Komponenten keine akademische Fußnote für Design-System-Puristen. Sie ist die Entscheidung, die darüber bestimmt, ob "Design System" in eurem Unternehmen eine Infrastruktur-Investition ist, die sich über Jahre auszahlt, oder ein hübsches Wort für einen Components-Ordner, der irgendwann so teuer wird, umzubauen, dass niemand es mehr anfasst.
