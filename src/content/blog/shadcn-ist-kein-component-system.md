---
title: "shadcn/ui ist keine Component Library — und das ist der Punkt"
description: "Warum shadcn/ui absichtlich kein npm-Paket ist, sondern Copy-Paste-Code — und was das für Design Systems bedeutet."
date: 2026-07-07
tags: ["Tech", "Tooling", "Design Systems"]
coverImage: "/images/blog/blog-006.webp"
draft: false
---

Die häufigste Verwechslung, die ich bei Design Systems sehe: Leute installieren shadcn/ui wie eine Component Library und wundern sich, warum es sich anders verhält als Material UI oder Chakra. Es gibt keinen `npm install shadcn`. Es gibt `npx shadcn add button` — und danach liegt der komplette Quellcode des Buttons in deinem eigenen Repository, unter deiner Kontrolle, mit deinem Namen im Git-Blame.

Das ist kein Missing Feature. Das ist die ganze Idee.

## Der Unterschied zwischen Abhängigkeit und Besitz

Eine klassische Component Library ist ein Vertrag: Du bekommst fertige Komponenten, im Austausch gibst du Kontrolle über ihre Interna ab. Willst du, dass ein Button sich anders verhält als vorgesehen? Du wartest auf ein Feature-Request, forkst das Paket, oder wickelst dich in CSS-Overrides, die beim nächsten Major-Update wieder brechen. Ich habe das bei mehreren Projekten erlebt: ein Team entscheidet sich früh für eine Library, weil sie schnell startklar ist — und zwei Jahre später verbringt dasselbe Team mehr Zeit damit, gegen die Library zu arbeiten, als mit ihr.

shadcn/ui kehrt das Verhältnis um. Die Komponenten basieren auf Radix UI Primitives (für Verhalten, Fokus-Management und Barrierefreiheit) und Tailwind CSS (für Styling) — aber sobald du eine Komponente über die CLI hinzufügst, gehört sie dir. Kein Paket-Update kann sie unter dir wegziehen. Kein Versionskonflikt zwischen `shadcn@2.1` und deinem Custom-Styling entsteht, weil es keine Version gibt, gegen die du kämpfst. Der Code liegt in `src/components/ui/`, sichtbar, durchsuchbar, debugbar mit den normalen Werkzeugen, die du sowieso täglich nutzt.

Der Preis dafür ist real: Du bekommst keine automatischen Bugfixes. Wenn Radix UI eine Accessibility-Lücke schließt oder eine neue Browser-Eigenheit behebt, musst du die Komponente selbst aktualisieren — niemand pusht dir das per `npm update` ins Projekt. shadcn/ui verlagert Verantwortung von der Library zum Team. Das ist unbequem, aber ehrlich: Es ist genau die Verantwortung, die ein internes Design System sowieso tragen sollte, nur dass die meisten Teams sie sich bei einer externen Library ersparen wollten.

## Wie die CLI tatsächlich funktioniert

Was viele nicht verstehen: shadcn/ui hat gar keine Laufzeit-Bibliothek, die irgendwo im `node_modules`-Ordner liegt und importiert wird. Der `shadcn`-CLI-Befehl liest eine Registry-Definition (JSON-Dateien mit Component-Code, Dependencies und Styling-Regeln), generiert daraus lesbaren React-Code und schreibt ihn direkt in dein Projekt. Danach ist die CLI aus dem Spiel. Es gibt keinen Import von `shadcn` zur Laufzeit — nur deinen eigenen Code, der zufällig genauso aussieht wie das, was die CLI generiert hat.

Das bedeutet auch: Radix UI ist die einzige echte Laufzeit-Abhängigkeit, die bleibt. Radix liefert unstyled, aber vollständig barrierefreie Primitives — Dialog, Dropdown, Popover, Tabs — mit korrektem Fokus-Trapping, ARIA-Attributen und Keyboard-Navigation. Das ist der Teil, den man wirklich nicht selbst bauen will; Accessibility-Details bei Fokus-Reihenfolge oder Screenreader-Ankündigungen sind mühsam zu testen und leicht falsch zu machen. shadcn/ui delegiert genau diesen schwierigen Teil an eine spezialisierte Library und behält nur das Styling — die Tailwind-Klassen, die Varianten-Logik — als eigenen, editierbaren Code.

Für Varianten nutzt shadcn/ui typischerweise `class-variance-authority` (kurz CVA): eine kleine Utility, die Tailwind-Klassenkombinationen typsicher an Props bindet. Ein Button bekommt so `variant="destructive"` oder `size="sm"`, und CVA generiert daraus die richtige Klassenkombination — ohne dass du an zehn Stellen im Code bedingte Klassenlogik von Hand schreibst. Auch das ist Code, der bei dir liegt und den du erweitern kannst, sobald ein Produkt eine Variante braucht, die im Original nicht vorgesehen war.

## Warum das für Design Systems wichtig ist

Ich habe in den letzten Jahren mehrere Design Systems gebaut und gepflegt — bei DefShop, bei Oetker Digital, zuletzt bei A Eins Digital Innovation. Das wiederkehrende Muster: Teams starten mit einer externen Component Library, weil sie schnell loslegen wollen und die Library-Demo überzeugend aussieht. Nach 12–18 Monaten kollidiert die Library mit echten Produktanforderungen — ein Datepicker, der nicht das kann, was der Fachbereich braucht, ein Select ohne Multi-Select-Variante, ein Modal, das sich nicht animiert einbetten lässt, weil die Library eigene Portal-Logik erzwingt. Das Team beginnt, um die Library herumzubauen, statt mit ihr.

shadcn/ui löst das nicht magisch. Aber es verschiebt den Bruchpunkt. Weil du den Code von Anfang an besitzt, gibt es keinen Moment, in dem du "aus der Library ausbrechen" musst — du warst nie wirklich drin. Die Grenze zwischen "System-Komponente" und "Custom-Komponente" verschwimmt, weil beide im selben Repository, im selben Stil, mit denselben Tools entstehen. Ein Designer, der die Figma-Datei öffnet, und ein Entwickler, der die Codebase öffnet, schauen im Idealfall auf dieselbe Struktur — keine Übersetzungsschicht, kein "in der Library heißt das anders".

Das ist der eigentliche Design-System-Vorteil: nicht die Komponenten selbst, sondern dass Design-Entscheidungen — Tokens, Varianten, States — und Code in derselben Codebase leben, ohne Package-Boundary dazwischen. Wenn ich als Design Engineer an einem Design-Token arbeite (sagen wir, ein neuer `--radius-lg`-Wert), ändert sich das in derselben CSS-Datei, die auch die Komponenten-Styles enthält. Es gibt keinen Moment, in dem ich auf ein Package-Release warten muss, um die Änderung zu sehen.

## Der Vergleich mit klassischen Alternativen

Um den Unterschied greifbar zu machen, lohnt sich ein direkter Vergleich mit den Ansätzen, die ich in früheren Projekten genutzt habe.

**Material UI (MUI)** liefert fertige, stark opinionated Komponenten mit einem eigenen Theming-System (`createTheme`, `sx`-Prop). Das ist extrem produktiv für Prototypen — man bekommt in Stunden ein funktionierendes Interface. Der Haken zeigt sich später: MUIs visuelle Sprache ("Material Design") durchdringt die Komponenten so tief, dass ein wirklich eigenständiges Look-and-Feel viel CSS-Override-Arbeit erfordert. Ich habe Projekte gesehen, in denen am Ende mehr Zeit in das Zurückbauen von MUI-Defaults floss als in eigentliche Produktarbeit.

**Chakra UI** ist freundlicher zu individuellem Theming, bleibt aber ein echtes npm-Paket mit allem, was das mit sich bringt: Bundle-Size-Overhead für ungenutzte Features, Versions-Updates, die Breaking Changes einführen können, und eine Laufzeit-Abstraktion (das `ChakraProvider`-Context-System), die man verstehen muss, bevor man debuggen kann, warum eine Komponente sich anders verhält als erwartet.

**Headless UI** (von den Tailwind-Machern) verfolgt bereits eine ähnliche Philosophie wie Radix — unstyled, verhaltensfokussiert. Der Unterschied zu shadcn/ui: Headless UI bleibt ein installiertes Paket, dessen Komponenten du von außen stylst. shadcn/ui geht einen Schritt weiter und eliminiert die Paketgrenze komplett — der Code selbst wird zu deinem.

Der gemeinsame Nenner aller drei Alternativen: Sie sind Pakete, die du importierst. shadcn/ui ist ein Codegenerator, der einmalig läuft und dann verschwindet. Dieser Unterschied wirkt zunächst kosmetisch, verändert aber grundlegend, wie ein Team über "unsere Komponenten" vs. "die Library-Komponenten" denkt — weil es diese Unterscheidung gar nicht mehr gibt.

## Token-Integration in der Praxis

Ein Punkt, der bei der Design-System-Diskussion oft zu kurz kommt: Wie verbinden sich Design Tokens mit shadcn/ui-Komponenten konkret? Die Antwort liegt in der Tailwind-Konfiguration. shadcn/ui-Komponenten referenzieren keine Hex-Werte oder Pixel-Zahlen direkt im Component-Code — sie nutzen semantische Tailwind-Klassen wie `bg-primary`, `text-muted-foreground`, `rounded-lg`, die wiederum auf CSS Custom Properties zeigen (`--primary`, `--muted-foreground`, `--radius`).

Das bedeutet: Ein komplettes Rebranding — neue Farbpalette, andere Radien, anderer Schrift-Rhythmus — passiert an einer einzigen Stelle, in den CSS-Variablen-Definitionen, nicht in jeder einzelnen Komponente. Ich nutze dieses Prinzip auf dieser Website genauso wie in Produktarbeit: Ein Token wie `--foreground` ändert sich einmal, und jede Komponente, die `text-foreground` nutzt, zieht automatisch nach. Das ist der Moment, in dem Design Tokens und Component-Architektur wirklich zusammenspielen — nicht als zwei getrennte Systeme, sondern als eine durchgehende Kette von Entscheidung zu Pixel.

Für Teams, die mit Figma Variables arbeiten, entsteht hier eine zusätzliche Chance: Figma-Variablen und Tailwind-CSS-Variablen lassen sich strukturell aufeinander abbilden, wenn beide Seiten dieselbe Namenskonvention nutzen. Die Synchronisation bleibt zwar manuell — es gibt keine offizielle Live-Verbindung zwischen Figma und einer Codebase —, aber die Übersetzung wird mechanisch statt interpretativ: `primary` in Figma wird `--primary` im Code, ohne Rätselraten, welche Hex-Zahl gemeint war.

## Governance: Der unterschätzte Nachteil

Was in Erfolgsgeschichten über shadcn/ui selten erwähnt wird: Copy-Paste-Distribution hat einen echten Governance-Preis. Sobald eine Komponente in dein Repository kopiert ist, gibt es keine automatische Verbindung mehr zur Quelle. Findest du in sechs Monaten eine bessere Fokus-Handhabung für Dialoge, aktualisiert sich das nicht von selbst — du musst aktiv wissen, dass es ein Update gibt, und es manuell nachziehen.

Bei einem einzelnen Produkt ist das überschaubar. Bei zehn Produkten, die alle unabhängig voneinander dieselbe Button-Komponente kopiert haben, wird daraus ein echtes Problem: zehn leicht unterschiedliche Buttons, die im Laufe der Zeit auseinanderdriften, weil jedes Team seine Kopie individuell angepasst hat. Genau das Szenario, das ein zentrales Design System eigentlich verhindern soll.

Die pragmatische Lösung, die ich in der Praxis nutze: shadcn/ui als Fundament für ein internes Registry-Setup verwenden. Man definiert eigene Component-Definitionen (ähnlich der offiziellen Registry-Struktur), verteilt sie unternehmensintern über die gleiche CLI-Mechanik — aber mit einer eigenen, versionierten Quelle statt der offiziellen shadcn-Registry. Damit bekommt man das Beste aus beiden Welten: Code, der bei jedem Team lokal und editierbar liegt, aber trotzdem eine nachvollziehbare "letzte bekannte Version", gegen die man diffen kann.

## Die Kehrseite — und warum sie meistens akzeptabel ist

Für Unternehmen mit echtem Multi-Repo-Bedarf über viele unabhängige Teams hinweg ist eine klassische, versionierte Component Library oft trotzdem die richtige Wahl — mit allen Nachteilen, die das mit sich bringt, aber mit dem Vorteil zentraler Verteilung. Wer zehn Produktteams hat, die kaum koordiniert sind, profitiert von einem echten Package mit Versionsnummer und Änderungsprotokoll mehr, als von zehn unkoordinierten Kopien.

Aber für die meisten Teams, die ich kenne — ein Produkt, ein Repository, ein Design System, das mit dem Produkt mitwächst — ist das kein Nachteil. Es ist die ehrlichere Architektur: Design-Entscheidungen sind Code, der committed, reviewt und versioniert wird wie jeder andere Teil der Anwendung. Kein Abstraktionslayer, der vorgibt, mehr Stabilität zu bieten, als er tatsächlich hat. Kein `node_modules`-Ordner, der Verhalten versteckt, das man eigentlich verstehen müsste.

## Was das für meine eigene Arbeit bedeutet

shadcn/ui hat mir dabei geholfen, eine alte Design-System-Gewohnheit abzulegen: die Suche nach der einen perfekten, universellen Komponente, die für jeden denkbaren Anwendungsfall funktioniert. Diese Suche führt fast immer zu übermäßig konfigurierbaren Komponenten mit einem Dutzend Props, von denen die meisten nie genutzt werden — Komplexität, die niemand angefordert hat, aber jeder mit sich herumträgt.

Stattdessen baue ich heute Komponenten, die für genau dieses Produkt richtig sind — und die ich jederzeit ändern kann, ohne um Erlaubnis zu fragen, ohne ein Ticket bei einem Library-Maintainer aufzumachen, ohne auf ein Major-Release zu warten. Wenn ein Produkt in sechs Monaten andere Anforderungen hat, ändere ich die Komponente. Das ist keine Kompromisslösung — das ist, wie Design-System-Arbeit sich anfühlen sollte: nah am Produkt, nicht nah an einer fremden Roadmap.

Das gilt genauso für Testing und Wartung. Weil der Component-Code lokal liegt, kann ich Unit-Tests direkt gegen die tatsächliche Implementierung schreiben, statt gegen eine Blackbox, deren Interna ich nur aus der Dokumentation kenne. Ändert sich ein Edge Case — etwa wie ein Dropdown auf Escape reagiert, wenn gleichzeitig ein verschachteltes Modal offen ist — kann ich den Fix direkt im eigenen Code nachvollziehen und testen, statt einen Bugreport zu schreiben und auf einen Fremd-Release zu warten. Das beschleunigt nicht nur die Entwicklung, es verändert auch die Fehlerkultur im Team: Bugs in UI-Komponenten sind keine externen Ereignisse mehr, die man abwarten muss, sondern normale Codeänderungen, die im selben Pull-Request-Workflow laufen wie alles andere.

Am Ende ist das der eigentliche Kulturwandel, den shadcn/ui in Teams auslöst, die es richtig einsetzen: Die UI-Ebene hört auf, sich wie fremdes Territorium anzufühlen. Sie wird Teil der eigenen Codebase, mit derselben Sorgfalt behandelt wie Business-Logik oder API-Layer — nicht, weil eine Library das vorschreibt, sondern weil es keine Library mehr gibt, hinter der man sich verstecken könnte.
