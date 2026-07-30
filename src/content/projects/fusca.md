---
title: "Fussball Scouting — vom Spielfeldrand direkt in die Analyse"
description: "Eine mobile-first Scouting-App für den Amateur- und Jugendfußball: am Platz erfassen, offline arbeiten, zu Hause am Desktop auswerten."
coverImage: "/images/gallery/fusca/fusca-uebersicht.jpg"
date: 2026-07-30
tags: ["Astro", "React", "Supabase", "PWA", "Sports Tech"]
url: "https://fusca-sepia.vercel.app"
featured: true
---

Wer schon einmal am Spielfeldrand eines Jugend- oder Amateurspiels stand und versucht hat, eine Spielerbeobachtung strukturiert festzuhalten, kennt das Dilemma: Entweder man kritzelt Stichworte in ein Notizbuch, das später kaum noch jemand entziffert, oder man tippt in eine Excel-Tabelle, die für unterwegs nie gemacht war. Eine Lösung, die für beide Situationen taugt — den Moment am Platz und die Auswertung am Schreibtisch —, gab es für den Amateur- und Jugendbereich schlicht nicht. Die großen Scouting-Plattformen sind für Profivereine mit eigenem Analyseabteilungsbudget gebaut, alles darunter bleibt bei Zettel, WhatsApp-Sprachnachrichten oder einer selbstgebastelten Tabelle hängen. Also habe ich mir die Zielgruppe genauer angeschaut, für die es bislang nichts Passendes gab — Scouts im deutschen Amateur- und Jugendbereich — und ein Werkzeug gebaut, das genau für diesen Alltag gemacht ist: Fusca.

## Der Alltag eines Scouts

Scouting im Amateur- und Jugendbereich läuft in zwei sehr unterschiedlichen Situationen ab, die kaum unterschiedlicher sein könnten. Am Spielfeldrand zählt Geschwindigkeit: Ein Scout hat neunzig Minuten, oft schlechtes Netz, kalte Finger und keine Zeit, durch verschachtelte Menüs zu navigieren. Zu Hause, Stunden oder Tage später, zählt das Gegenteil: Ruhe, ein großer Bildschirm, der Wunsch, mehrere Berichte nebeneinander zu vergleichen, Kader zu pflegen und die eigene Einschätzung noch einmal in Textform nachzuschärfen.

![Mobile Erfassung eines Spielerberichts](/images/gallery/fusca/fusca-mobile-spielerbericht.jpg)

Die meisten Tools, die ich mir vor dem Bau von Fusca angesehen habe, entscheiden sich für eine der beiden Welten und behandeln die andere als Kompromiss — entweder eine mobile App, die am Desktop wie eine aufgeblasene Tabelle wirkt, oder ein Web-Dashboard, das auf dem Handy am Spielfeldrand zur Fummelarbeit wird. Fusca sollte kein Kompromiss sein, sondern beide Situationen als gleichwertige, eigenständige Arbeitsmodi ernst nehmen.

## Ein Werkzeug, zwei Arbeitsplätze

Die Grundidee ist deshalb einfach zu beschreiben, aber in der Umsetzung anspruchsvoll: eine einzige Codebasis, zwei komplett unterschiedliche Layouts. Auf dem Handy übernimmt eine Bottom-Navigation mit großen Touch-Zielen, kurze Formulare und ein Kamera-Zugriff für Fotos direkt aus dem Bericht heraus. Am Desktop erscheint stattdessen ein klassischer Sidebar-Arbeitsplatz mit Übersicht, Dashboard, Berichten, Spielerverwaltung und Import — mehr Fläche für Tabellen, Filter und Vergleiche.

![Übersicht am Desktop-Arbeitsplatz](/images/gallery/fusca/fusca-uebersicht.jpg)

Beide Ansichten greifen auf dieselben Komponenten, denselben Datenbestand und dieselbe Business-Logik zurück — der Unterschied ist reine Präsentationsschicht, keine getrennte App mit eigener Wartungslast, kein zweites Repository und keine zweite Release-Pipeline, die synchron gehalten werden müsste. Das war mir wichtig, weil Scouting-Workflows sich ständig zwischen beiden Geräten hin- und herbewegen: Ein Bericht wird am Platz begonnen und am Desktop fertig ausformuliert, ein Kader wird am Rechner importiert und am nächsten Spieltag mobil ergänzt. Die App muss diesen Wechsel unsichtbar machen, statt ihn spürbar zu machen.

## Das Bewertungsraster

Kernstück jeder Beobachtung ist ein einheitliches Bewertungsraster mit vier Kategorien — Technik, Taktik, Athletik und Mentalität —, jeweils auf einer Skala von eins bis zehn, ergänzt um eine manuell gesetzte Gesamtbewertung, eine klare Empfehlung ("Unbedingt beobachten" bis "Kein Potenzial") und Freitextfelder für Stärken, Schwächen und weitere Notizen.

![Spielerbericht mit Bewertungsraster](/images/gallery/fusca/fusca-spielerbericht.jpg)

Wichtig war mir dabei, dass sich das Raster erweitern lässt, ohne den Code anzufassen: Unter "Bewertungsfelder" kann jeder Scout eigene Kategorien ergänzen — etwa Kopfballstärke bei einem Innenverteidiger-Fokus — ohne dass sich das Standard-Raster für alle anderen ändert. Jeder Bericht lässt sich außerdem einem konkreten Anlass zuordnen: einem Spiel, einem Training oder einer sonstigen Beobachtung, wahlweise mit beobachteter Position, damit später klar bleibt, in welcher Rolle ein Spieler eingeschätzt wurde. Auch nachträgliches Bearbeiten ist kein Sonderfall, sondern ein vollwertiger Teil des Workflows — eine erste Einschätzung am Platz darf am Desktop noch einmal geschärft werden, ohne dass ein neuer Bericht angelegt werden müsste.

## Formationen, Phasen und Video im Kontext

Neben Spielerberichten gibt es eigenständige Teamberichte für Gegner- oder Eigenanalysen. Dabei lassen sich Formationen und Spielphasen getrennt nach Heim- und Gastmannschaft sowie nach offensivem und defensivem Verhalten festhalten — ein 4-3-3 im Ballbesitz sieht taktisch anders aus als dasselbe System beim Gegenpressing, und beides verdient eine eigene Notiz statt einer einzigen pauschalen Formationsangabe. Ergänzend lassen sich Video- beziehungsweise VEO-Links direkt am Spiel hinterlegen, inklusive Zeitmarken zu einzelnen Szenen. Bewusst verzichtet Fusca dabei auf einen Rohvideo-Upload: Das Tool soll Einschätzungen strukturieren und mit dem richtigen Zeitstempel verknüpfen, nicht zur eigenen Video-Plattform werden, die zusätzlichen Speicherplatz, Streaming-Infrastruktur und Rechteklärung nach sich ziehen würde.

## Offline zuerst, Sync danach

Die technisch anspruchsvollste Entscheidung war, Fusca konsequent offline-first zu bauen. Ein Sportplatz am Stadtrand hat selten verlässliches Netz, und eine App, die bei jedem Tastendruck auf eine Serverantwort wartet, ist am Spielfeldrand schlicht unbrauchbar.

![Vom Spielfeldrand zum fertigen Bericht](/images/gallery/fusca/fusca-ablauf.svg)

Jeder Bericht landet deshalb zuerst in einer lokalen IndexedDB-Datenbank über Dexie — die App bleibt vollständig bedienbar, unabhängig davon, ob gerade eine Verbindung besteht. Änderungen werden zusätzlich in eine Outbox-Warteschlange geschrieben, die jeden offenen Vorgang mit einem Status (wartend, wird synchronisiert, erledigt oder fehlgeschlagen) versieht. Sobald wieder eine Verbindung besteht, synchronisiert die Outbox automatisch mit Retry-Logik bei Fehlern, sichtbar über einen kleinen Indikator in der Sidebar (Desktop) beziehungsweise im Header (mobil). Als Progressive Web App lässt sich Fusca zudem auf dem Homescreen installieren, was am Platz einen schnelleren Start und die volle Bildschirmfläche ohne Browser-Chrome bringt.

## Privacy als Architekturprinzip

Scouting-Notizen sind naturgemäß sensibel — eine ehrliche Einschätzung über einen 16-jährigen Nachwuchsspieler soll nicht für jeden einsehbar sein, der Zugriff auf dieselbe Datenbank hat. Deshalb ist Datentrennung kein nachträglicher Zusatz, sondern von Anfang an in der Datenbank verankert: Jede Zeile in Supabase Postgres trägt eine `ownerScoutId`, und Row-Level-Security-Regeln sorgen dafür, dass jeder Scout ausschließlich seine eigenen Berichte, Spieler und Bewertungsfelder sehen und verändern kann — selbst bei einem gemeinsam genutzten Supabase-Projekt für einen ganzen Verein. Angemeldet wird sich wahlweise über Google-OAuth oder einen Magic Link, es gibt also kein zusätzliches Passwort, das verwaltet werden müsste.

Wer kein eigenes Supabase-Projekt betreiben möchte, kann Fusca auch vollständig lokal auf einem einzelnen Gerät nutzen — Erfassung, Kamera-Fotos und Export funktionieren dann genauso, nur der geräteübergreifende Sync und der Login entfallen. Das war mir wichtig, um die Einstiegshürde niedrig zu halten: Man muss keine Cloud-Infrastruktur aufsetzen, nur um Fusca einmal auszuprobieren.

Nach jedem Deployment müssen zusätzlich einige SQL-Skripte im Supabase-Projekt ausgeführt werden — für die Datentrennung pro Scout, für Formationen und Spielphasen, für Video-Zeitmarken und für die benutzerdefinierten Bewertungsfelder. Diese Trennung zwischen Anwendungscode und Datenbank-Migrationen ist bewusst explizit gehalten, statt automatisch im Hintergrund zu laufen: Bei einem Tool, das über Row-Level-Security persönliche Einschätzungen absichert, möchte ich lieber einen zusätzlichen manuellen Schritt beim Deployment in Kauf nehmen, als eine Sicherheitsregel durch eine automatische Migration versehentlich zu überschreiben.

## Kader importieren statt abtippen

Nichts ist mühsamer, als einen ganzen Jugendkader von Hand einzutippen, bevor überhaupt die erste Beobachtung erfasst werden kann. Deshalb bringt Fusca vier Import-Wege mit: Transfermarkt-Vereins- oder Jugendkader-URLs liefern Namen, Position und Geburtsdatum, fussball.de-Vereinsseiten funktionieren ähnlich, wobei gesperrte Kader auf eine reine Namensliste zurückfallen, TheSportsDB eignet sich für bekanntere Namen, und eine direkte API-Anbindung an fussball.de steht optional über einen eigenen Token zur Verfügung.

![Kader-Import aus externen Quellen](/images/gallery/fusca/fusca-import.jpg)

Jeder importierte Treffer wird vor der Übernahme in einer Tabelle angezeigt und lässt sich einzeln oder gesammelt bestätigen. Eine Deduplizierung sorgt dabei dafür, dass derselbe Spieler nicht doppelt angelegt wird, sobald er über zwei verschiedene Quellen oder mehrfach importiert wird — verglichen wird dabei pro Scout anhand der externen Quelle und ID, nicht global über die gesamte Datenbank, was wieder auf dasselbe Datentrennungsprinzip einzahlt.

Diese Import-Wege sind bewusst als Adapter gebaut, nicht als fest verdrahtete Sonderfälle: Jede Quelle bekommt ein eigenes kleines Modul, das eine gemeinsame Schnittstelle bedient, sodass eine weitere Quelle — etwa ein Verbandsportal oder ein Vereinsverwaltungssystem — sich ergänzen lässt, ohne die bestehenden drei anzufassen. Wo eine Quelle wie fussball.de aus rechtlichen oder technischen Gründen den Kaderzugriff sperrt, greift automatisch die einfachere Namensliste als Fallback, statt dass der Import komplett fehlschlägt.

## Design-Entscheidungen fürs Tempo

Am Spielfeldrand zählt jede Sekunde, deshalb sind viele kleine Entscheidungen in Fusca auf Tempo statt auf Vollständigkeit optimiert. Die Übersichtsseite zeigt direkt beim Öffnen große, gut treffbare Kacheln für die häufigsten nächsten Schritte — neuer Spielerbericht, neuer Teambericht, Dashboard, Import —, statt eine Navigation durchsuchen zu lassen. Der Dark Mode wird geräteweise gemerkt und persistiert, weil ein greller weißer Bildschirm in der Abenddämmerung am Spielfeldrand schlicht unangenehm ist und unnötig vom eigentlichen Spielgeschehen ablenkt. Und der Sync-Status ist an beiden Arbeitsplätzen permanent sichtbar — als kleiner Online/Offline-Indikator mit Sync-Button —, damit nie unklar bleibt, ob ein gerade erfasster Bericht schon in Sicherheit ist oder noch in der lokalen Warteschlange wartet. Genau dieses ständige, unaufdringliche Feedback ist es, was Vertrauen in ein Offline-first-Werkzeug schafft: Man muss der Synchronisation nicht blind glauben, sondern kann sie jederzeit mit einem Blick nachvollziehen.

## Technischer Unterbau

Fusca läuft auf Astro 7 mit React-Islands für alle interaktiven Bereiche, Tailwind CSS 4 fürs Styling und einer eigenen shadcn-Ausprägung namens "Fusca" als Komponentenbasis. Die Offline-Schicht besteht aus Dexie über IndexedDB sowie `@vite-pwa/astro` für die PWA-Fähigkeiten. Auf der Serverseite verwaltet Supabase gebündelt Postgres-Datenbank, Authentifizierung und Storage, während Drizzle ORM das Datenbankschema typsicher in TypeScript hält und über Migrationen versioniert. Der Export von Berichten läuft über jsPDF direkt im Browser, gehostet wird alles auf Vercel über die offizielle `@astrojs/vercel`-Integration.

![Eine Codebasis, zwei Arbeitsplätze](/images/gallery/fusca/fusca-architektur.svg)

Qualitätssicherung ist dabei kein nachträglicher Gedanke: Unit-Tests laufen über Vitest, ein Playwright-Smoke-Test deckt die wichtigsten End-to-End-Pfade ab, eine Content-Security-Policy und Rate-Limiting schützen die API-Routen, und eine GitHub-Actions-Pipeline führt all das bei jedem Push automatisch aus. Für ein Werkzeug, das mit sensiblen Personendaten über Minderjährige im Amateurfußball umgeht, war mir diese Ernsthaftigkeit bei Tests und Sicherheit wichtiger als ein zusätzliches Feature.

Die Wahl von Supabase statt eines selbstgehosteten Backends war dabei eine bewusste Abwägung: Ich wollte Authentifizierung, Datenbank und Objekt-Storage nicht drei separate Dienste betreiben und gegeneinander absichern müssen, sondern ein Paket, das Row-Level-Security als natives Postgres-Feature mitbringt statt als nachgebaute Zugriffsschicht in einer eigenen API. Drizzle ORM ergänzt das um typsichere Abfragen direkt aus dem TypeScript-Code heraus, sodass ein Tippfehler in einem Spaltennamen schon beim Kompilieren auffällt und nicht erst als Laufzeitfehler am Spielfeldrand.

## Vom Dashboard zur Entscheidung

Am Desktop laufen alle Fäden im Dashboard zusammen: Berichte lassen sich nach Spieler, Position, Zeitraum oder Bewertung filtern, mehrere Spieler direkt nebeneinander vergleichen, und Teams lassen sich für Gegner- oder Eigenanalysen bündeln. Die Spieler-Ansicht selbst ist mehr als eine Liste: Sie aggregiert alle Berichte zu einer Person über die Zeit, zeigt Notendurchschnitte je Kategorie und macht sichtbar, ob sich eine Einschätzung über mehrere Beobachtungen hinweg bestätigt oder ob ein einzelner Bericht ein Ausreißer war. Genau hier zeigt sich der Sinn der Zwei-Arbeitsplätze-Idee am deutlichsten: Die schnelle, fragmentarische Erfassung am Platz wird am Desktop zu einer zusammenhängenden Entscheidungsgrundlage — etwa dafür, welcher Spieler für ein Probetraining eingeladen wird oder wie sich ein gegnerisches Team taktisch am ehesten knacken lässt.

## Wo das Projekt heute steht

Fusca ist kein Prototyp mehr, sondern ein Werkzeug im aktiven Einsatz: Offline-Erfassung, Authentifizierung und Export sind ebenso abgeschlossen wie Import mit Deduplizierung pro Scout, die Outbox-Synchronisation samt Retry-Oberfläche, die strikte Datentrennung über Row-Level-Security, Formationen, VEO-Zeitmarken, benutzerdefinierte Bewertungsfelder sowie eine Einführung samt Hilfebereich, die sich jederzeit erneut aufrufen lässt. Auch das nachträgliche Bearbeiten bereits gespeicherter Berichte ist möglich, ebenso wie ein konsistentes Radien-System in der Oberfläche, das ich in einer eigenen Konventionen-Dokumentation im Repository festgehalten habe, damit visuelle Entscheidungen nicht bei jeder neuen Komponente neu verhandelt werden müssen.

Die In-App-Hilfe selbst ist dabei kein nachträglich hingeworfenes FAQ, sondern nach Themen sortiert: Erste Schritte, Datenschutz und Sichtbarkeit, Offline und Sync, der Unterschied zwischen mobiler und Desktop-Nutzung, Erfassung von Spieler- und Teamberichten, Bewertungsfelder, Formationen und Phasen, Video/VEO, Import, Auswertung im Dashboard und eine gesammelte FAQ-Sektion. Die First-Run-Einführung, die neue Nutzer beim allerersten Öffnen begrüßt, lässt sich jederzeit über die Hilfeseite erneut starten — praktisch für alle, die eine Funktion zum zweiten Mal erklärt haben möchten, ohne danach in einer Slack-Nachricht suchen zu müssen.

Was mich an Fusca am meisten freut, ist genau dieser Punkt: Es ist kein Nebenprojekt geblieben, das nur in der Theorie funktioniert, sondern ein Werkzeug, das den kompletten Weg von der ersten Beobachtung am Spielfeldrand bis zur fundierten Entscheidung im Trainerteam abbildet — offline beginnend, in der Cloud synchronisiert, und am Ende immer mit der eigenen Handschrift des Scouts, nicht mit einer anonymen Kennzahl. Genau wie bei [alterli](/projects/alterli) war mir auch hier wichtig, dass ein kleines, klar umrissenes Werkzeug einem echten, wiederkehrenden Alltagsproblem dient — nicht als Ausstellungsstück in einem Portfolio, sondern als Software, die tatsächlich an einem echten Spielfeldrand benutzt wird.
