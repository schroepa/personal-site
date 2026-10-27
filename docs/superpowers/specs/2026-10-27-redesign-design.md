# Redesign ptrckschrdtr.de – Design-Dokument

Stand: 2026-10-27 · Autor: Patrick Schrödter (mit Claude) · Status: Entwurf zur Freigabe

Quellen: Figma-Datei [ptrckschrdtr-Design](https://www.figma.com/design/7EQ8Ujy720sQuGCWpLyADN/ptrckschrdtr-Design) (Dateischlüssel `7EQ8Ujy720sQuGCWpLyADN`), Übergabe-Datei „ptrckschrdtr.de Redesign – Übergabe.md“ (27.10.2026), Prototyp Startseite v14, Repo `schroepa/personal-site`.

## 1. Absicht

Die persönliche Seite wird vom aktuellen, effektreichen Stand (HeroMesh, Custom Cursor, Fluid-Text-Distort, Liquid-Toggle) auf das in Figma fertig gestaltete System umgestellt: ruhig, präzise, sichtbares Raster, Papierkorn, eine einzige Farbfläche (orange Kontakt-Panel). Leitsatz: „Form follows function“; Vorbilder Kenya Hara und Naoto Fukasawa.

Warum jetzt: Das Design ist als System (Tokens, 13 neue Komponenten, 11 Screens in 3 Breiten) abgeschlossen. Der Code weicht davon ab und enthält Rechts- und Datenschutz-Altlasten, die vor einem Livegang bereinigt werden müssen.

Erfolg heißt:
- Jede Seite stimmt in Desktop (1440), Tablet (768) und Mobil (390) mit den Figma-Screens überein.
- Alle Werte kommen aus den Figma-Tokens; keine hart gesetzten Farben, Größen oder Dauern.
- Text-Kontraste ≥ 4.5:1, volle Tastaturbedienung, `prefers-reduced-motion` respektiert.
- Keine externen Ressourcen zur Laufzeit; Datenschutz und Impressum stimmen mit dem tatsächlichen Verhalten überein.

## 2. Ziele, Nicht-Ziele, Anti-Ziele

**Ziele**
- Umsetzung aller 11 Screens (Startseite, Blog-Übersicht, Artikel, Projekt-Übersicht, Fallstudie, Über mich, Lebenslauf, Kontakt, Impressum, Datenschutz, 404).
- Token-Pipeline Figma → CSS Custom Properties mit den hinterlegten Code-Syntax-Namen.
- Bewegung mit `motion` 14.1 und `lenis` 1.3, gesteuert über Motion-Tokens.
- Ein gemeinsamer Livegang nach Freigabe der Vercel-Preview.

**Nicht-Ziele**
- Kein Backend, keine Datenbank, kein Kontaktformular (Kontakt bleibt E-Mail, Adresse kopieren, LinkedIn).
- Keine neuen Inhalte über das hinaus, was die Übergabe als offen listet; Platzhalter blockieren den Start nicht.
- Kein Umbau des Content-Modells (`src/content`, `src/data/cv.ts`) über das Nötige hinaus.
- Keine Code-Layers-Pipeline in Figma (Beta; Teamzugehörigkeit der Datei ungeklärt).

**Anti-Ziele (Fehlschlag, auch wenn es technisch läuft)**
- Dekoration, die das Design nicht vorsieht (Bild-Reveals, Cursor-Effekte, Rahmen um Karten).
- Animation, die ohne `prefers-reduced-motion`-Weiche läuft.
- Ein Livegang mit falschem Impressum, falschem Namen oder undokumentiertem Tracking.
- Verlorene bestehende Inhalte (Blogposts, Projekte, CV).

## 3. Rahmenbedingungen

- **Stack (bleibt):** Astro 5, React 19, TypeScript, Tailwind CSS 4 (über `@tailwindcss/postcss`, nicht über das Vite-Plugin, siehe README), shadcn/ui, statischer Export (`output: 'static'`).
- **Schriften:** Geist variabel (100–900) und Geist Mono, lokal ausgeliefert. Die bisherige PP Editorial New entfällt, sofern das Design sie nicht verwendet.
- **Bibliotheken neu:** `motion`, `lenis` (npm, gebündelt, kein CDN).
- **Hosting:** Vercel (bestätigt von Patrick, 2026-10-27).
- **Arbeitsstand:** Auf `main` liegen uncommittete Änderungen an `src/components/LiquidToggle.tsx` und `src/components/SearchPalette.tsx` sowie ungetrackte Dateien. Sie werden nicht angefasst; die Arbeit läuft in einem eigenen Worktree.
- **Build:** `prebuild`/`postbuild` erzeugen Fonts, CV-PDF und OG-Images per Playwright. Das bleibt, die CV-PDF wird aus der neuen Webseite erzeugt (offener Punkt der Übergabe).

## 4. Entscheidungen (von Patrick getroffen)

- Eigener Branch in einem Git-Worktree, **ein gemeinsamer Livegang** nach Vercel-Preview-Abnahme (kein seitenweiser Rollout).
- Der Plan liegt als Design-Dokument im Repo (dieses Dokument).
- Die Übergabe-Datei ist die verbindliche Quelle für Tokens, Komponenten, Seiten, Bewegung und Atmosphäre. Archivierte Figma-Seiten (Seitenvorlagen-alt, Startseite-Ruhe, Startseite-Test-verworfen) gelten nicht.

## 5. Vorgehen in Phasen

Phasen 0–3 laufen nacheinander. Ab Phase 4 können Seiten parallel entstehen. Bewegung (5) und Atmosphäre (6) kommen bewusst nach den statischen Seiten: Die Seite muss ohne sie vollständig funktionieren.

| # | Phase | Ergebnis | Fertig, wenn |
|---|---|---|---|
| 0 | Absicherung | Branch `redesign` im Worktree; Baseline von Build, Lighthouse und Screenshots der alten Seite | `npm run build` und `npm run typecheck` laufen, Baseline abgelegt |
| 1 | Tokens | `src/styles/tokens.css` mit Global, Theme (hell/dunkel), Typography und Layout je Breakpoint, Weight, Spacing, Motion (auf 0 bei Reduziert), Component; Anbindung an Tailwind `@theme` | Stichproben (`--surface-page`, `--text-body-size`, `--layout-margin`, `--motion-feder-akkordeon-dauer`) stimmen mit Figma überein |
| 2 | Fundament | Neues `BaseLayout`: Papierkorn, Raster, site-head, `<main>`, site-footer, Schriftfeld; Geist lokal; Skip-Link, Fokusrahmen 2 px / 3 px Abstand; Theme-Umschalter | Leere Seite zeigt Ebenen in beiden Themes korrekt |
| 3 | Komponenten | `seitenkopf`, `abschnitt`, `projekt-karte`, `artikel-zeile`, `inhaltsverzeichnis`, `faktenzeile`, `galerie-akkordeon`, `kontakt-panel`, `schriftfeld`, `layout-raster`, `papierkorn`, `lichtband` (Hülle), `layout-anzeige` als Astro-Komponenten, ohne Animation | Jede Komponente rendert in allen Varianten laut Figma-Komponentenseite |
| 4 | Seiten | Reihenfolge: Startseite, Blog + Artikel, Projekte + Fallstudie, Über mich, Lebenslauf, Kontakt (`/kontakt` neu), Impressum + Datenschutz, 404 | Pixelnahe Übereinstimmung in 3 Breiten, Inhalte aus `src/content` und `cv.ts` |
| 5 | Bewegung | Ein Modul pro Animation, liest Motion-Tokens per `getComputedStyle`; Lenis; View Transition Projektkarte → Fallstudie; Zeiger-Effekte nur bei `pointer: fine` | Werte aus der Bewegungstabelle der Übergabe eingehalten; Reduziert = Endzustand sofort, kein Lenis |
| 6 | Atmosphäre | Lichtband als WebGL-Shader (4 Gauß-Flecken, Dithering, 25 fps, Maske 16 %), pausiert außerhalb des Viewports; Papierkorn per SVG `feTurbulence` | Beide Paletten (hell/dunkel) wie in der Übergabe; kein Layout-Shift |
| 7 | Inhalt und Recht | Fünf Punkte aus Abschnitt 7; Testinhalte aufräumen | Checkliste in Abschnitt 7 abgehakt |
| 8 | QA | Playwright-Screenshots in 3 Breiten gegen Figma, Kontrastprüfung, Tastaturtest, Lighthouse, Reduced-Motion-Lauf | Keine offenen A11y-Fehler, Lighthouse nicht schlechter als Baseline |
| 9 | Livegang | Vercel-Preview, Abnahme, Redirects, OG-Images, Sicherheits-Header, Sitemap (inkl. `/kontakt`), Merge nach `main` | Preview abgenommen, Produktion deployt |

## 6. Architektur-Notizen

- **Tokens:** Figma-Variable `objekt/radius` wird zu `--objekt-radius`. Theme unter `:root` und `[data-theme=dark]` bzw. `prefers-color-scheme`. Typography und Layout als Media Queries für die sechs Breakpoints (1920, 1440, 1024, 768, 844, 390). Alles auf dem 4-px-Raster.
- **Ecken:** Verschachtelte Radien (24 / 8 / 16, groß 32, klein 4) plus `corner-shape: squircle`. Overlays liegen im selben Bildrahmen und werden mit ihm beschnitten.
- **Seitenstruktur:** Abschnitte als `<section aria-labelledby>` mit dem Label als `<h2>`; genau eine `<h1>` pro Seite.
- **Interaktion:** Kleine Skripte ohne Framework; React nur dort, wo es heute schon gebraucht wird (z. B. Suche). Animationen lesen ihre Werte aus den Tokens, damit Figma und Code nicht auseinanderlaufen.
- **Bewegungsregeln:** Scroll-Animationen laufen einmal und nur für Elemente unter dem sichtbaren Bereich; übersprungene Elemente erscheinen trotzdem. Keine Bild-Reveals. Akkordeon: feste Bildbreite, 90 ms Hover-Absicht, Pfeiltasten.
- **Sicherheit:** Content-Security-Policy, HSTS, Referrer-Policy und `X-Content-Type-Options` über `vercel.json`. Eigene Ressourcen (Fonts, `motion`, `lenis`) kommen lokal; erlaubt sind zusätzlich nur die Hosts von Cookiebot und PostHog. PostHog läuft erst nach Einwilligung.

## 7. Vor dem Livegang (Pflicht)

Rechtliche Punkte bitte prüfen lassen; das ist keine Rechtsberatung.

- [ ] Impressum: § 5 DDG und § 18 Abs. 2 MStV statt § 5 TMG und § 55 RStV
- [ ] Name im Repo: „Schrödter“ statt „Schröder“ (Impressum, Datenschutz, Seitentitel, Footer, `llms.txt`, Meta)
- [ ] PostHog und Cookiebot bleiben (Entscheidung Patrick, 2026-10-27). Die Datenschutzerklärung beschreibt beides vollständig (Zweck, Daten, Rechtsgrundlage, Einwilligung, Speicherdauer, Empfänger/Drittland). PostHog lädt erst nach Einwilligung über Cookiebot. Das Cookiebot-Skript ist eine externe Ressource und wird in „Externe Ressourcen“ aufgeführt; die CSP erlaubt nur dessen Hosts. Das Cookiebot-Widget wird weiterhin über dem Theme-Toggle ausgeblendet, das neue Layout muss Banner und Schriftfeld überlappungsfrei halten.
- [ ] Motion, Lenis, Geist lokal gebündelt (Abschnitt „Externe Ressourcen“ stimmt dann)
- [ ] Ladungsfähige Anschrift und Stand der Datenschutzerklärung eingetragen
- [ ] Anrede der Datenschutzerklärung (Sie) gegenüber dem Rest der Seite (du): noch nicht entschieden. Arbeitsannahme: durchgehend „du“, bis Patrick anders entscheidet.

## 8. Meine Annahmen (bitte beim Lesen prüfen)

- Die alten Effekte (HeroMesh, CustomCursor, Fluid-Distort, LiquidToggle, SectionIndicator, BaselineGrid, GrainOverlay) entfallen, weil die Übergabe sie nicht vorsieht. Entfernt wird erst in Phase 7, nachdem die neuen Seiten stehen.
- Die ⌘K-Suche (`SearchPalette`) bleibt und wird an die neuen Tokens angepasst. Sie steht nicht in der Übergabe.
- `tools/gradient-generator`, `prototypes/` und `og-render/` bleiben bestehen und werden nur auf die neuen Tokens umgestellt, sofern sie das Layout nutzen.
- Testinhalte (`test-1.md`, `test-2.md`, `sample-art-project.md`) werden vor dem Livegang entfernt oder als `draft` markiert.
- Offene Gestaltungspunkte laufen mit Platzhaltern: Handschrift-Tag (SVG), echte Galerie-Kapitel und Bilder, Fallstudien für ProMan, alterli und Fusca (Tintfield dient als Vorlage), Texte „Wofür“ und „Ablauf“ auf `/kontakt`.
- Lesezeit wird aus dem Text berechnet (`src/lib/reading-time.ts` existiert); Themenfilter in Blog und Projekten sind clientseitig.

## 9. Risiken

- **Tailwind 4 über PostCSS** statt Vite-Plugin (Build-Hänger laut README): Token-Anbindung zuerst in einem kleinen Test absichern.
- **Lichtband-Shader** kostet Leistung auf schwachen Geräten: 25 fps, pausiert außerhalb des Viewports, bei Reduziert statisches Bild.
- **View Transitions** und `lenis` können sich beim Seitenwechsel stören: früh zusammen testen.
- **Figma-Daten sind die Quelle:** Wenn sich Variablen in Figma ändern, muss `tokens.css` neu erzeugt werden. Das Exportskript wird deshalb als Skript im Repo abgelegt, nicht von Hand gepflegt.

## 10. Offen für den Umsetzer

- Wahl des Exportwegs für die Tokens (Figma-MCP `get_variable_defs` oder Skript über die Figma-API), solange das Ergebnis die Code-Syntax-Namen exakt abbildet.
- Dateiaufteilung von `tokens.css`, Reihenfolge und Namen der Motion-Module.
- Technische Umsetzung des Papierkorns (SVG-Filter vs. vorgerendertes PNG), solange das Erscheinungsbild der Übergabe entspricht.
- Details der Sicherheits-Header in `vercel.json` (konkrete CSP-Hosts für Cookiebot und PostHog aus dem tatsächlichen Netzwerkverkehr ableiten).
