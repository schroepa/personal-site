# Blog-Rotationsplan

**Status:** Living document — wird vom täglichen Cron-Task gelesen und aktualisiert.
**Zweck:** Steuert, worüber der automatisierte Blog-Task jeden Tag schreibt.

---

## Rotationslogik

5-Tage-Zyklus, wiederholt sich endlos. Jeder Tag hat eine feste Pillar-Zuordnung:

| Wochentag im Zyklus | Pillar |
|---|---|
| Tag 1 | Design Systems |
| Tag 2 | Design-Themen mit Dev-Background |
| Tag 3 | Tech (Paper Design, Figma, shadcn, Tooling) |
| Tag 4 | UX Design |
| Tag 5 | UX Writing |

**Wie der Task die Pillar für heute bestimmt:** Zähle die bereits veröffentlichten (nicht-draft) Blog-Posts in `src/content/blog/`, die aus diesem Rotationsplan stammen (erkennbar an den Tags — siehe Pillar-Tag-Zuordnung unten). `(Anzahl % 5) + 1` ergibt den Zyklus-Tag, daraus die Pillar für den nächsten Post.

**Pillar → Tags-Zuordnung** (für die Zählung und für die Frontmatter des neuen Posts):
- Design Systems → `["Design Systems"]`
- Design-Themen mit Dev-Background → `["Design", "Development"]`
- Tech → `["Tech", "Tooling"]`
- UX Design → `["UX Design"]`
- UX Writing → `["UX Writing"]`

---

## Themen-Backlog pro Pillar

Jeder Pillar hat eine Liste konkreter Themen-Ideen. Der Task wählt beim Schreiben das erste **nicht abgehakte** Thema der jeweiligen Pillar, schreibt den Post darüber, hakt es danach ab (`- [x]`). Ist eine Pillar-Liste komplett abgehakt, denkt sich der Task ein neues, zur Pillar passendes Thema aus und ergänzt es unten in der Liste (abgehakt), damit die Historie vollständig bleibt.

### Design Systems

- [ ] Tokens vs. Komponenten: Wo ein Design System aufhört, Design zu sein, und anfängt, Infrastruktur zu sein
- [ ] Warum "Single Source of Truth" meistens eine Lüge ist — und wie man es trotzdem hinbekommt
- [ ] Versionierung von Design Systems: Was Semver für Komponenten wirklich bedeutet
- [ ] Der Unterschied zwischen einem Style Guide und einem Design System — und warum die meisten Teams nur Ersteres haben
- [ ] Dark Mode ist kein Feature, es ist ein Architektur-Test für dein Design System
- [ ] Warum Design-System-Dokumentation meistens ungelesen verstaubt — und was stattdessen funktioniert
- [ ] Component Variants: Wann eine Variante ein neues Component werden sollte
- [ ] Was passiert, wenn Design Systems altern — Migration, Deprecation, technische Schuld im Design

### Design-Themen mit Dev-Background

- [ ] Warum ich als Designer nie wieder ohne Browser-DevTools arbeiten will
- [ ] CSS Grid hat meine Art, Layouts zu denken, permanent verändert
- [ ] Was mir 15 Jahre Sysadmin-Denken über gutes Interface-Design beigebracht haben
- [ ] Der Unterschied zwischen "sieht fertig aus" und "ist production-ready" — eine Designer-Perspektive
- [ ] Warum Designer, die Git verstehen, bessere Entscheidungen treffen
- [ ] Pixel-Perfect ist tot — was Entwickler und Designer heute stattdessen brauchen
- [ ] Wie man als Designer lernt, in States statt in Screens zu denken
- [ ] Warum ich Figma-Auto-Layout wie CSS Flexbox behandle — und was das für meine Files bedeutet

### Tech (Paper Design, Figma, shadcn, Tooling)

- [x] shadcn/ui ist keine Component Library — es ist ein Copy-Paste-Design-System, und das ist der Punkt
- [ ] Warum Tailwind v4 die Art verändert, wie ich über Design Tokens denke
- [ ] Figma Variables vs. Code-Tokens: Wo die Synchronisation bricht
- [ ] Was Shader-basierte Hintergründe (Paper Design & Co.) für Interface-Design bedeuten
- [ ] Astro Islands aus Design-Sicht: Warum Partial Hydration auch eine UX-Entscheidung ist
- [ ] Mein Workflow: Von Figma-Prototyp zu produktivem Code in unter einem Tag
- [ ] Warum ich AI-Coding-Tools (Claude, Gemini CLI) wie einen Pair-Programming-Partner behandle, nicht wie ein Orakel
- [ ] Die unterschätzte Kraft von CSS `color-mix()` für Design-Systeme

### UX Design

- [ ] Warum "intuitiv" das gefährlichste Wort im UX-Vokabular ist
- [ ] Leerraum ist keine Verschwendung — eine Verteidigung des Ma-Prinzips im Interface-Design
- [ ] Onboarding-Flows, die niemand braucht: Wann weniger Führung mehr Vertrauen schafft
- [ ] Warum ich Nutzerfluss-Diagramme vor Wireframes zeichne
- [ ] Der Unterschied zwischen Usability und Loyalität — und warum UX beides nicht verwechseln darf
- [ ] Fehler-States sind die ehrlichste UX deines Produkts
- [ ] Wie viel Kontrolle brauchen Nutzer wirklich? Eine Gegenposition zu "mehr Optionen = besser"
- [ ] Was Grafitti mich über visuelle Hierarchie gelehrt hat, bevor ich wusste, was UX ist

### UX Writing

- [ ] Warum ein Button-Label wichtiger ist als seine Farbe
- [ ] Fehlermeldungen, die niemanden beschämen — ein Leitfaden
- [ ] Microcopy ist Produktstrategie, keine Nachbearbeitung
- [ ] Wie man Leere-Zustände (Empty States) schreibt, die nicht traurig wirken
- [ ] Der Unterschied zwischen "Sind Sie sicher?" und einem Interface, das Vertrauen verdient
- [ ] Warum ich CTA-Texte laut vorlese, bevor ich sie freigebe
- [ ] Ton und Stimme in Design Systems: Warum UX Writing auch Tokens braucht
- [ ] Wann Humor in UX Writing funktioniert — und wann er ein Produkt sabotiert

---

## Veröffentlichungs-Log

Wird vom Cron-Task nach jedem Post ergänzt (Datum, Titel, Pillar) — dient der Rotationszählung als Fallback, falls die Tag-basierte Zählung aus `src/content/blog/` uneindeutig ist.

| Datum | Pillar | Titel | Slug |
|---|---|---|---|
| 2026-07-07 | Tech | shadcn/ui ist keine Component Library — und das ist der Punkt | shadcn-ist-kein-component-system |
