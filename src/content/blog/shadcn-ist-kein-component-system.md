---
title: "shadcn/ui ist keine Component Library — und das ist der Punkt"
description: "Warum shadcn/ui absichtlich kein npm-Paket ist, sondern Copy-Paste-Code — und was das für Design Systems bedeutet."
date: 2026-07-07
tags: ["Tech", "Tooling", "Design Systems"]
draft: true
---

Die häufigste Verwechslung, die ich bei Design Systems sehe: Leute installieren shadcn/ui wie eine Component Library und wundern sich, warum es sich anders verhält als Material UI oder Chakra. Es gibt keinen `npm install shadcn`. Es gibt `npx shadcn add button` — und danach liegt der komplette Quellcode des Buttons in deinem eigenen Repository, unter deiner Kontrolle, mit deinem Namen im Git-Blame.

Das ist kein Missing Feature. Das ist die ganze Idee.

## Der Unterschied zwischen Abhängigkeit und Besitz

Eine klassische Component Library ist ein Vertrag: Du bekommst fertige Komponenten, im Austausch gibst du Kontrolle über ihre Interna ab. Willst du, dass ein Button sich anders verhält als vorgesehen? Du wartest auf ein Feature-Request, forkst das Paket, oder wickelst dich in CSS-Overrides, die beim nächsten Major-Update wieder brechen.

shadcn/ui kehrt das um. Die Komponenten basieren auf Radix UI (für Verhalten und Barrierefreiheit) und Tailwind CSS (für Styling) — aber sobald du eine Komponente hinzufügst, gehört sie dir. Kein Paket-Update kann sie unter dir wegziehen. Kein Versionskonflikt zwischen `shadcn@2.1` und deinem Custom-Styling entsteht, weil es keine Version gibt, gegen die du kämpfst.

Der Preis dafür: Du bekommst keine automatischen Bugfixes. Wenn Radix UI eine Accessibility-Lücke schließt, musst du die Komponente selbst aktualisieren. shadcn/ui verlagert Verantwortung von der Library zum Team — genau wie ein echtes internes Design System das tun sollte.

## Warum das für Design Systems wichtig ist

Ich habe in den letzten Jahren mehrere Design Systems gebaut und gepflegt — bei DefShop, bei Oetker Digital, zuletzt bei A Eins. Das wiederkehrende Muster: Teams starten mit einer externen Component Library, weil sie schnell loslegen wollen. Nach 12–18 Monaten kollidiert die Library mit echten Produktanforderungen — ein Datepicker, der nicht das kann was der Fachbereich braucht, ein Select, das keine Multi-Select-Variante unterstützt. Das Team beginnt, um die Library herumzubauen, statt mit ihr.

shadcn/ui löst das nicht magisch. Aber es verschiebt den Bruchpunkt. Weil du den Code von Anfang an besitzt, gibt es keinen Moment, in dem du "aus der Library ausbrechen" musst — du warst nie wirklich drin. Die Grenze zwischen "System-Komponente" und "Custom-Komponente" verschwimmt, weil beide im selben Repository, im selben Stil, mit denselben Tools entstehen.

Das ist der eigentliche Design-System-Vorteil: nicht die Komponenten selbst, sondern dass Design-Entscheidungen (Tokens, Varianten, States) und Code in derselben Codebase leben, ohne Package-Boundary dazwischen.

## Die Kehrseite — und warum sie meistens akzeptabel ist

Copy-Paste-Distribution skaliert schlechter über viele Repositories hinweg. Hast du zehn Produkte, die denselben Button brauchen, hast du zehn Kopien — Änderungen musst du zehnmal ausrollen, nicht einmal per Package-Update. Für Unternehmen mit echtem Multi-Repo-Bedarf ist eine klassische, versionierte Component Library oft trotzdem die richtige Wahl.

Aber für die meisten Teams, die ich kenne — ein Produkt, ein Repository, ein Design System, das mit dem Produkt mitwächst — ist das kein Nachteil. Es ist die ehrlichere Architektur: Design-Entscheidungen sind Code, der committed, reviewt und versioniert wird wie jeder andere Teil der Anwendung. Kein Abstraktionslayer, der vorgibt, mehr Stabilität zu bieten, als er tatsächlich hat.

shadcn/ui hat mir dabei geholfen, eine alte Design-System-Gewohnheit abzulegen: die Suche nach der einen perfekten, universellen Komponente. Stattdessen baue ich Komponenten, die für genau dieses Produkt richtig sind — und die ich jederzeit ändern kann, ohne um Erlaubnis zu fragen.
