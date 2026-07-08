---
title: "Warum Tailwind v4 die Art verändert, wie ich über Design Tokens denke"
description: "Tailwind v4 hat die JavaScript-Config abgeschafft und Design Tokens direkt in CSS verlegt — eine Architekturentscheidung, die mehr verändert als nur Syntax."
date: 2026-07-08
tags: ["Tech", "Tooling"]
coverImage: "/images/blog/blog-008.webp"
draft: true
---

Als Tailwind v4 die `tailwind.config.js` abgeschafft hat, haben viele Leute in meiner Timeline das als kosmetische Änderung abgetan. Neue Syntax, gleiche Idee, nächstes Update. Das ist falsch, und zwar auf eine Art, die für jeden relevant ist, der Design Systems baut. Tailwind v4 hat nicht die Syntax geändert, mit der man Tokens definiert — es hat verändert, *wo Tokens leben* und *wann sie existieren*. Das ist ein Architektur-Statement, kein Facelift.

Ich habe diese Seite selbst mit Tailwind v4 gebaut und schreibe in [Wie ich diese Seite gebaut habe](/blog/diese-seite-bauen) bereits, dass mich das anfangs skeptisch gemacht hat. Seitdem habe ich genug Zeit mit `@theme` verbracht, um zu verstehen, warum die alte JS-Config eigentlich nie die richtige Idee war — nur eben die einzige, die wir hatten.

## Das eigentliche Problem der JS-Config

In Tailwind v3 lebten Design Tokens in `tailwind.config.js`, einem JavaScript-Objekt mit verschachtelten `colors`, `spacing`, `fontSize`-Keys. Das fühlte sich praktisch an — Autocomplete, TypeScript-Typen, Kommentare, alles was JavaScript kann. Aber es hatte einen strukturellen Defekt: Diese Werte existierten nur zur Build-Zeit. Der Tailwind-Compiler las die Config, generierte daraus statische Utility-Klassen wie `.text-primary { color: #1a1a2e }`, und danach war die Config verschwunden. Zur Laufzeit im Browser gab es keine Spur mehr von `colors.primary` — nur eine fest einkompilierte Hex-Zahl in einer CSS-Regel.

Das klingt nach einem Detail, ist aber der Grund, warum Design-Token-Arbeit in Tailwind-v3-Projekten sich immer wie zwei getrennte Welten anfühlte. Wollte ich zur Laufzeit einen Wert ändern — Theme-Switching, Nutzer-Personalisierung, ein A/B-Test mit anderer Akzentfarbe — musste ich zusätzlich manuell CSS Custom Properties definieren und die Tailwind-Config *auf diese* Properties verweisen lassen (`primary: 'var(--color-primary)'`). Das war möglich, aber niemand hat es standardmäßig gemacht, weil es zusätzlicher Aufwand war, der sich wie eine Krücke anfühlte, nicht wie das vorgesehene Modell. Die Config und das Runtime-CSS waren zwei separate Systeme, die man manuell verdrahten musste.

## Was `@theme` tatsächlich ändert

Tailwind v4 dreht das um. Es gibt keine `tailwind.config.js` mehr für Design Tokens — stattdessen definiert man sie direkt im Stylesheet, mit der `@theme`-Direktive:

```css
@theme {
  --color-primary: oklch(0.55 0.18 250);
  --color-surface: oklch(0.98 0.01 250);
  --spacing-page: 5rem;
  --font-display: 'Geist', sans-serif;
  --radius-lg: 0.75rem;
}
```

Der entscheidende Unterschied: Diese Werte sind keine Build-Zeit-Konstanten mehr, die in Utility-Klassen einkompiliert werden und danach verschwinden. Sie sind waschechte CSS Custom Properties, die im finalen Stylesheet als `:root { --color-primary: oklch(...); ... }` landen und zur Laufzeit im Browser existieren. Tailwind generiert aus `--color-primary` automatisch die Utility `bg-primary`, `text-primary`, `border-primary` — aber die Utility ist jetzt ein dünner Wrapper um eine echte Variable, nicht die Variable selbst.

Das bedeutet konkret: Ich kann `--color-primary` in den DevTools live editieren und sehe die Änderung sofort in jeder Komponente, die `bg-primary` nutzt — ohne Rebuild. Ich kann sie per JavaScript zur Laufzeit umschreiben (`document.documentElement.style.setProperty('--color-primary', newValue)`) für Theme-Switching, ohne eine einzige Zeile Tailwind-Config anzufassen. Ich kann sie in einer Media Query oder einem Container Query überschreiben, um kontextabhängige Werte zu bekommen. Nichts davon war in v3 unmöglich — aber es war ein Sonderfall, für den man extra Infrastruktur bauen musste. In v4 ist es der Standardfall, weil jeder Token by default eine CSS-Variable ist.

## Warum das mehr als Syntax-Zucker ist

Der Punkt, den die meisten übersehen: Eine JS-Config und ein CSS-Custom-Property sind nicht einfach zwei Schreibweisen für dasselbe. Sie haben fundamental unterschiedliche Lebenszyklen. Ein JS-Objekt existiert im Build-Prozess (Node.js, zur Compile-Zeit), ein CSS Custom Property existiert im gerenderten Dokument (Browser, zur Laufzeit). Das ist der Unterschied zwischen einer Konstante und einer Variable im eigentlichen Wortsinn.

Design Tokens sind konzeptionell aber genau das: Variablen. Ein Farbwert wie `--color-primary` soll sich je nach Theme (Light/Dark), Kontext (eingebettetes Widget vs. Hauptseite) oder sogar Nutzerpräferenz ändern können, ohne dass jede Komponente, die ihn nutzt, davon weiß oder neu kompiliert werden muss. Das ist exakt die Eigenschaft von CSS Custom Properties — sie propagieren durch die Kaskade und werden von jedem Kind-Element neu aufgelöst, ohne dass sich an der Verwendung etwas ändern muss. Eine JS-Konstante hat diese Eigenschaft nicht. Sie ist bereits aufgelöst, bevor der Browser das Dokument überhaupt sieht.

Tailwind v3 hat Design Tokens wie Konstanten behandelt und musste dann Variablen simulieren. Tailwind v4 behandelt sie von Anfang an wie das, was sie sind. Das ist der Architekturunterschied, der hinter der neuen Syntax steckt — und der Grund, warum ich das nicht als Facelift, sondern als Korrektur eines konzeptionellen Fehlers sehe.

## OKLCH und der Farbraum als Token-Entscheidung

Ein zweiter, oft übersehener Aspekt: Tailwinds Standard-Farbpalette in v4 nutzt `oklch()` statt Hex oder RGB. Das ist keine kosmetische Wahl. OKLCH ist ein perzeptuell uniformer Farbraum — der Abstand zwischen zwei Farbwerten im OKLCH-Raum entspricht näherungsweise dem Abstand, den ein menschliches Auge tatsächlich wahrnimmt. Bei RGB oder HSL stimmt das nicht: Zwei Farben mit demselben Hue-Abstand können völlig unterschiedlich stark wahrgenommene Helligkeitssprünge haben.

Für Design-Token-Arbeit heißt das etwas sehr Konkretes. Wenn ich zehn Abstufungen einer Akzentfarbe generieren will (`primary-50` bis `primary-900`), kann ich in OKLCH die Lightness-Komponente linear interpolieren und bekomme tatsächlich gleichmäßig wirkende Abstufungen. In HSL führt dieselbe lineare Interpolation zu Stufen, die in der Mitte der Skala optisch zu dicht und an den Rändern zu weit auseinander liegen — ein Problem, das jeder kennt, der schon einmal eine Farbskala von Hand in HSL gebaut hat und sich gewundert hat, warum sie trotz "korrekter" Zahlen ungleichmäßig aussieht.

`color-mix()` in CSS baut direkt darauf auf und wird in Tailwind v4 intern für Opacity-Modifier genutzt (`bg-primary/50` generiert `color-mix(in oklab, var(--color-primary) 50%, transparent)` statt einer separaten RGBA-Berechnung). Das bedeutet, Farbmischungen respektieren den Farbraum, in dem der Token ursprünglich definiert wurde, statt über eine verlustbehaftete Zwischenkonvertierung zu laufen. Für ein Design System mit Dutzenden Farbtoken und noch mehr Opacity-Varianten ist das kein Nice-to-have, das ist der Unterschied zwischen konsistenten und leicht schiefen Abstufungen über die gesamte Palette hinweg.

## Der Vergleich mit anderen Token-Architekturen

Um das einzuordnen, lohnt sich ein Blick auf die Alternativen, mit denen ich in früheren Projekten gearbeitet habe.

**Style Dictionary** (Amazon) verfolgt den Ansatz "Tokens als JSON, Plattform-Output generiert". Man definiert Tokens einmal in einer plattformneutralen JSON-Struktur und lässt Transformer daraus CSS, iOS-Swift-Konstanten, Android-XML oder eben Tailwind-Config generieren. Das ist mächtig für Multi-Plattform-Teams — dieselbe Quelle speist Web, iOS und Android. Der Preis: eine zusätzliche Build-Pipeline, ein zusätzliches Tool, ein zusätzlicher Transformationsschritt, bevor ein Token überhaupt in CSS ankommt. Für ein reines Web-Projekt ist das oft Overhead, den man sich mit Tailwinds `@theme` komplett spart, weil CSS Custom Properties bereits die plattformneutrale Zwischenschicht sind, die Style Dictionary erst künstlich herstellen muss.

**CSS-in-JS mit Theming** (styled-components' `ThemeProvider`, Emotion) löst das Laufzeit-Problem anders: Der Theme lebt als JavaScript-Objekt im React-Context, Komponenten lesen daraus zur Render-Zeit. Das funktioniert, kostet aber echten Laufzeit-Overhead — jede Komponente, die Theme-Werte nutzt, braucht Zugriff auf den Context, und Theme-Switches lösen React-Re-Renders in der gesamten Baumstruktur aus, die den Context konsumiert. Tailwind v4s Ansatz mit nativen CSS-Variablen kostet dagegen keine JavaScript-Laufzeit: Ein Theme-Switch ist ein einziges `setProperty()`, das der Browser nativ über die Kaskade propagiert, ohne dass eine einzige React-Komponente neu rendert.

**Figma Variables**, die ich im Artikel über [shadcn/ui](/blog/shadcn-ist-kein-component-system) bereits erwähnt habe, mappen strukturell erstaunlich sauber auf `@theme`-Variablen, wenn beide Seiten dieselbe Namenskonvention nutzen. Eine Figma-Variable `color/primary` wird `--color-primary` im Code — mechanisch, nicht interpretativ. Das war mit der alten JS-Config genauso möglich, aber die zusätzliche Übersetzungsebene (JS-Objekt → generierte Klasse) bedeutete, dass ein Designer, der die Werte im DevTools inspizieren wollte, nie den Rohwert sah, sondern nur das kompilierte Endergebnis. Mit `@theme` sieht ein Designer, der `getComputedStyle()` in den DevTools nutzt, exakt denselben Variablennamen, der auch in der Figma-Datei steht.

## Container Queries und der zweite stille Shift

Parallel zur Token-Architektur hat Tailwind v4 auch Container Queries first-class gemacht (`@container`, `@sm:`, `@lg:` als Container-Varianten statt nur Viewport-Varianten). Das hängt mit Design Tokens enger zusammen, als es zunächst wirkt: Ein Token wie `--spacing-card-padding` soll sich im Idealfall nicht danach richten, wie breit der Viewport ist, sondern wie breit der Container ist, in dem die Komponente gerade sitzt. Eine Karte in einer dreispaltigen Grid-Anordnung braucht anderes Padding als dieselbe Karte im Vollbreite-Modus — unabhängig von der Bildschirmgröße des Nutzers.

Vor Container Queries war das nur mit JavaScript-ResizeObservern lösbar, was für ein reines Styling-Problem unverhältnismäßig viel Komplexität war. Jetzt lässt sich das direkt in CSS ausdrücken, und weil Tailwind v4 dieselbe `@theme`-Variable in unterschiedlichen Container-Kontexten überschreiben kann, wird die Komponente selbst kontextbewusst, ohne dass die aufrufende Seite irgendetwas über den internen Aufbau der Komponente wissen muss. Das ist die Art von Entkopplung, die ein Design System eigentlich immer wollte, aber technisch bisher nicht sauber umsetzen konnte.

## Die Kehrseite: Browser-Support und Migrationsaufwand

Nichts davon ist kostenlos. Tailwind v4 nutzt intern moderne CSS-Features — Cascade Layers (`@layer`), `color-mix()`, `@property`, moderne Farbräume — die einen Mindest-Browser-Support voraussetzen: Safari 16.4+, Chrome 111+, Firefox 128+. Für Produkte mit relevantem Anteil älterer Browser (bestimmte Enterprise-Kontexte, ältere Android-WebViews) ist das ein echtes Ausschlusskriterium, kein Detail. Ich habe das bei keinem meiner aktuellen Projekte als Problem erlebt, aber ich würde es bei jedem Enterprise-Redesign vorab explizit prüfen, bevor ich v4 vorschlage — die Browser-Matrix ist hier eine harte Voraussetzung, kein Nice-to-have.

Die Migration selbst ist außerdem nicht trivial, sobald ein Projekt Custom-Plugins oder eine komplexe `tailwind.config.js` mit JavaScript-Logik (dynamisch generierte Farbskalen, bedingte Utility-Generierung) hatte. Das offizielle Upgrade-Tool (`npx @tailwindcss/upgrade`) automatisiert den Großteil der mechanischen Übersetzung, aber alles, was in der alten Config *Logik* statt reiner Daten war, muss man von Hand in CSS-Äquivalente übersetzen — und CSS hat nicht dieselben Kontrollstrukturen wie JavaScript. Eine Farbskala, die in v3 mit einer `for`-Schleife über HSL-Stufen generiert wurde, muss in v4 entweder von Hand ausgeschrieben oder über ein Build-Tool vorgeneriert werden, bevor sie in `@theme` landet. Das ist kein Rückschritt, aber es ist ein anderer Denkmodus, an den man sich gewöhnen muss: CSS als deklarative Zielsprache, nicht als Kompilat einer imperativen Config.

## Was das für meine eigene Design-System-Arbeit bedeutet

Auf dieser Seite nutze ich exakt dieses Modell für das Typografiesystem: Acht Schriftgrößen als `--text-*`-Variablen, direkt in `@theme` definiert, ohne Umweg über eine JS-Datei. Wenn ich eine Größe anpasse, ändert sich das an einer einzigen Stelle, und jede Komponente, die `text-lg` oder eine semantische Klasse wie `.t-h1` nutzt, zieht automatisch nach — nicht weil ein Build-Schritt neu läuft, sondern weil es dieselbe CSS-Variable ist, die überall referenziert wird.

Für Design-System-Arbeit im Allgemeinen ziehe ich daraus eine klare Konsequenz: Ich würde heute kein neues Projekt mehr mit Tokens in einer JavaScript-Config aufsetzen, wenn CSS Custom Properties dieselbe Aufgabe nativ, ohne Übersetzungsschicht und mit Laufzeit-Flexibilität übernehmen können. Das ist keine Tailwind-spezifische Empfehlung — es gilt für jedes Token-System, das man von Grund auf baut, unabhängig davon, ob am Ende Tailwind, Vanilla-CSS oder ein anderes Utility-Framework zum Einsatz kommt. Die JS-Config war ein Workaround für eine Zeit, in der CSS noch keine Variablen hatte. Diese Zeit ist seit `:root { --custom-property }` und breiter Browser-Unterstützung vorbei, und Tailwind v4 ist einfach das erste große Framework, das diese Konsequenz konsequent bis in seine Architektur durchgezogen hat, statt Custom Properties nur als Zusatzfeature neben einer weiterhin JS-zentrierten Config anzubieten.

Das Ergebnis ist ein System, in dem Design Tokens genau da leben, wo sie gebraucht werden — im Browser, zur Laufzeit, inspizierbar mit denselben DevTools, die man ohnehin täglich offen hat. Kein Übersetzungsverlust zwischen Build-Zeit-Konstante und Laufzeit-Variable. Das ist die Art von Architekturentscheidung, die man erst merkt, wenn man sie nicht mehr hat — und genau deshalb wird sie so oft als bloße Syntaxänderung abgetan.
