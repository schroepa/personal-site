---
title: "alterli — Der ehrliche Altersvorsorge-Analyst"
description: "Riester, Rürup, Pension und das neue Altersvorsorgedepot 2027 — ehrlich verglichen, für jede Berufsgruppe, ganz ohne Server und ohne Verkaufsabsicht."
coverImage: "/images/gallery/alterli/alterli-hero.jpg"
date: 2026-07-30
tags: ["Astro", "React", "TypeScript", "FinTech", "Personal Finance"]
url: "https://alterli.vercel.app"
repo: "https://github.com/schroepa/Alterli"
featured: true
---

Jeder, der in Deutschland einmal versucht hat herauszufinden, wie viel Rente er eigentlich zu erwarten hat, kennt das Gefühl: Man landet auf der Website einer Versicherung, gibt drei Zahlen ein, und am Ende steht ein Ergebnis da, das verdächtig gut aussieht — direkt gefolgt von einem Beratungstermin-Button. Genau dieses Muster wollte ich mit alterli durchbrechen.

## Der blinde Fleck der Altersvorsorge

Fast jeder Altersvorsorge-Rechner im Netz gehört einer Versicherung, einer Bank oder einem Vergleichsportal, das an vermittelten Verträgen verdient. Das ist kein Vorwurf, sondern Geschäftsmodell — aber es bedeutet auch, dass ehrliche, nüchterne Zahlen selten das Ziel sind. Dazu kommt: Die meisten Rechner behandeln alle Nutzer gleich, dabei ist die Ausgangslage in Deutschland für kaum eine Berufsgruppe identisch. Angestellte in Vollzeit haben andere Riester-Fördersätze als Minijobber. Beamte bekommen eine Pension statt einer gesetzlichen Rente. TVöD-Angestellte im öffentlichen Dienst haben zusätzlich eine VBL-Zusatzversorgung. Selbstständige und Freiberufler ohne Versorgungswerk sind auf Rürup angewiesen, während Ärzte, Anwälte oder Architekten über ihr Versorgungswerk ganz eigenen Regeln folgen, die ein allgemeiner Rechner gar nicht seriös abbilden kann.

Und dann kam noch ein politisches Zeitfenster dazu: Ab 2027 löst das neue, ETF-basierte Altersvorsorgedepot schrittweise die klassische Riester-Rente ab. Wer aktuell einen Riester-Vertrag hat, steht plötzlich vor einer Entscheidung, die er nie aktiv treffen wollte — weiterführen, beitragsfrei stellen, wechseln oder kündigen — meist ohne die Datenlage, um sie zu treffen.

alterli ist meine Antwort darauf: ein kostenloser, werbefreier Analyst, der jede Berufsgruppe erkennt, ihre jeweilige Förderlogik korrekt anwendet und ehrlich sagt, wo eine Versorgungslücke klafft — bevor irgendjemand versucht, einem etwas zu verkaufen.

Der Name ist Programm: "alter" für die Altersvorsorge, "li" als Verkleinerungsform, die dem Ganzen bewusst die Schwere nimmt. Es geht nicht um ein weiteres Finanzprodukt, sondern um eine Perspektive — den eigenen zukünftigen Ich, in Zahlen, ohne Umwege.

![alterli Startseite](/images/gallery/alterli/alterli-hero.jpg)

## Ein Analyst, kein Verkäufer

Die Produktentscheidung, auf die ich am meisten stolz bin, ist eine, die auf den ersten Blick unauffällig wirkt: Nach dem Ausfüllen des Fragebogens zeigt alterli nicht sofort ein Dashboard mit zehn Kacheln und drei Diagrammen. Stattdessen erscheint zuerst ein einziger Satz — der "Ehrliche Moment":

> „Deine gesetzliche Rente: ca. 442 €/Monat. Riester kommt zusätzlich mit ca. 151 € dazu — Summe 593 €. Du zahlst 1.025 €/Jahr und bekommst 175 € Zulage; das Altersvorsorgedepot 2027 könnte schneller wachsen.“

Kein Score, kein Ampel-Icon, keine aufgeblasene Infografik — nur der Kernbefund, in normaler Sprache, direkt auf die eingegebenen Zahlen zugeschnitten. Das ist bewusst das Gegenteil dessen, was ein Versicherungsvertreter sagen würde, weil es weder beruhigt noch verkauft, sondern einfach informiert. Erst danach, auf Wunsch, öffnet sich das eigentliche Dashboard mit Einkommensbild, Versorgungslücke, Ampel-Indikator (grün/gelb/rot) und den Handlungsempfehlungen. Diese Reihenfolge — erst der ehrliche Satz, dann die Details — ist kein Zufall, sondern das ganze Produktversprechen in einer einzigen UX-Entscheidung.

![Sechs Features, ein Versprechen](/images/gallery/alterli/alterli-features.jpg)

## Sieben Fragen, eine Diagnose

Technisch ist alterli ein siebenstufiger Wizard, der Schritt für Schritt die Situation einer Person erfasst: Beschäftigungsart, Details zum Arbeitsverhältnis, Alter und Geschlecht (nur für die statistische Rentenbezugsdauer relevant), Einkommen, Lebenssituation (Partnerschaft, Kinder, Immobilie), bestehende Vorsorge (Riester-Vertrag, Laufzeit, Berufsunfähigkeitsversicherung) und schließlich das persönliche Rentenziel.

![Wizard: Beschäftigungsart wählen](/images/gallery/alterli/alterli-wizard-beschaeftigung.jpg)

Jede dieser Fragen hat eine Funktion in der späteren Berechnung — es gibt keine Frage zur Ausschmückung. Die Berufsgruppe entscheidet zum Beispiel, ob GRV (gesetzliche Rentenversicherung), Pension oder VBL die Basis bildet. Kinder nach 2008 erhöhen die Riester-Kinderzulage um 300 € pro Jahr. Eine bestehende Immobilie mit Eigennutzung kann über Wohn-Riester zu einer zusätzlichen Kapitalquelle werden. Und wer zu einem Versorgungswerk gehört — etwa als Arzt, Anwalt, Architekt oder Steuerberater — bekommt keine erzwungene Pseudo-Antwort, sondern einen ehrlichen "Soft Exit"-Hinweis, weil die Versorgungswerksregeln zu individuell sind, um sie seriös zu verallgemeinern.

![Wizard: Einkommen angeben](/images/gallery/alterli/alterli-wizard-einkommen.jpg)

Bewusst gering gehalten ist dagegen die Reibung beim Ausfüllen: Jeder Schritt zeigt genau eine Frage, der "Weiter"-Button bleibt so lange sichtbar deaktiviert, bis eine gültige Eingabe vorliegt, und unten links erinnert ein kleiner Hinweis "Keine Datenspeicherung" konstant daran, dass hier gerade nichts protokolliert wird. Das ist kein Cookie-Banner-Reflex, sondern eine bewusste Wiederholung des Kernversprechens an der Stelle, an der Nutzer typischerweise am skeptischsten sind — direkt bevor sie Bruttogehalt und Familienstand eintippen.

## Was-wäre-wenn: Leben ist kein Fixpunkt

![Wizard: das persönliche Rentenziel](/images/gallery/alterli/alterli-wizard-ziel.jpg)

Eine Analyse, die nur einen einzigen Zeitpunkt abbildet, wäre bei einem Thema wie Altersvorsorge unehrlich, weil sich Lebensumstände ständig ändern. Deshalb lässt sich das Ergebnis live durchspielen: Ein zusätzliches Kind erhöht sofort sichtbar die Riester-Zulage um 300 € im Jahr, eine angenommene Gehaltserhöhung verschiebt Grenzsteuersatz und Eigenbeitrag, eine Heirat mit Partner-Riester verdoppelt unter Umständen die Grundzulage, und eine Frühpension mit 63 statt 67 zieht sichtbare Abschläge auf die gesetzliche Rente nach sich. All das passiert ohne Neuladen der Seite und ohne erneutes Ausfüllen des Wizards — nur durch Verändern einzelner Parameter im bereits berechneten Ergebnis. Wer eine Entscheidung wie "lohnt sich ein zweites Kind vorsorgetechnisch" nie in Zahlen gesehen hat, bekommt hier zum ersten Mal ein Gefühl dafür, wie stark solche Weichenstellungen wirklich wirken.

## Was unter der Haube passiert

Der interessanteste Teil von alterli ist nicht die Oberfläche, sondern die reine Rechenlogik dahinter, die vollständig in zwei TypeScript-Dateien lebt: `calc.ts` und `riesterSzenarien.ts`. Die folgende Grafik zeigt den Weg von den Wizard-Eingaben bis zur fertigen Empfehlung:

![Entscheidungslogik hinter der Analyse](/images/gallery/alterli/alterli-logik-flow.svg)

Der erste Schritt, `getGruppe()`, übersetzt Haupt- und Untergruppe in ein Set boolescher Flags: `istBeamter`, `istTvoed`, `istSelbst`, `istVW`, `hatGRV`, `riesterMöglich`, `rürupSinnvoll`. Diese Flags steuern von da an jede weitere Verzweigung — sie entscheiden zum Beispiel, ob überhaupt eine Riester-Förderung greifen kann oder ob Rürup die sinnvollere Schiene ist.

Danach berechnet `calc()` das zu versteuernde Einkommen (bei Selbstständigen inklusive eines pauschalen Betriebsausgabenabzugs von 28 %), leitet daraus den persönlichen Grenzsteuersatz nach dem deutschen Stufentarif ab und bestimmt die Riester-Zulage: 175 € Grundzulage, plus 300 € pro Kind nach 2008, plus 175 € Partnerzulage, wenn beide Partner riestern. Aus der Differenz zwischen dem geforderten Mindesteigenbeitrag (4 % des Einkommens, gedeckelt bei 2.100 €) und der Zulage ergibt sich der tatsächliche Eigenbeitrag — und aus dem Grenzsteuersatz der zusätzliche Steuervorteil.

Parallel dazu wird die jeweilige Basisrente berechnet: für Beamte eine vereinfachte Pensionsformel auf Basis der Dienstjahre, für TVöD-Angestellte zusätzlich eine VBL-Zusatzversorgung, für alle anderen die gesetzliche Rente über ein Entgeltpunkte-Modell. Anschließend laufen drei unabhängige Kapitalprojektionen bis zum gewählten Renteneintrittsalter: der bestehende Riester-Vertrag mit realistisch niedriger Verzinsung von rund 1,2 % pro Jahr, das neue ETF-basierte Altersvorsorgedepot mit rund 5,5 % und ein freies ETF-Eigendepot ohne jede Förderung mit rund 7,2 %. Aus der Differenz zwischen Wunschrente und der Summe aus Basis- und Zusatzeinkommen entsteht die Versorgungslücke — visualisiert über eine simple Ampel: grün bei keiner Lücke, gelb unter 300 €, rot darüber.

Am Ende dieser Kette stehen vier Scores zwischen 0 und 100 — Förderung, Stabilität, Risiko und Nutzen —, die aus Familienstand, Immobilienbesitz, Berufsunfähigkeitsschutz und der Größe der Lücke gewichtet werden. Sie tauchen nirgends als nackte Zahl auf, sondern fließen in Text und Empfehlungen ein, damit sich niemand an einem abstrakten Punktewert festbeißt, den er nicht einordnen kann.

## Drei Wege, ein Vergleich

Für alle, die bereits einen Riester-Vertrag besitzen, rechnet `riesterSzenarien.ts` fünf konkrete Optionen durch: weiterführen wie bisher, beitragsfrei stellen (das Kapital wächst weiter, ohne dass neu eingezahlt wird), in das neue Altersvorsorgedepot 2027 wechseln, über Wohn-Riester das angesparte Kapital in die eigene Immobilie stecken, oder kündigen. Jede Option bekommt ein Endkapital, eine geschätzte Monatsrente, den Förderverlust und den möglichen Steuernachteil — und genau eine Option wird am Ende als Empfehlung markiert, nachvollziehbar aus den Zahlen abgeleitet, nicht aus einer Marketingregel.

Auf der Ergebnisseite lässt sich das Ganze auch visuell vergleichen: ein gestapeltes Balkendiagramm zeigt Basisrente plus Aufstockung im Verhältnis zur Wunschrente, ein zweites stellt Riester, Depot 2027, ETF-Eigendepot und die gesetzliche Rente direkt nebeneinander. Beide Diagramme laufen über Recharts und aktualisieren sich live, wenn im "Was-wäre-wenn"-Modus einzelne Parameter verändert werden — ein zusätzliches Kind, eine Gehaltserhöhung, eine Frühpension mit 63 statt 67.

## Zero Data als Architekturentscheidung

Die vielleicht ungewöhnlichste Entscheidung bei alterli ist eine rein technische: Es gibt keinen Server, der irgendetwas von den Eingaben sieht. Die folgende Grafik zeigt, warum das mehr ist als ein Marketingversprechen — es ist so gebaut:

![Architektur: kein Server im Spiel](/images/gallery/alterli/alterli-architektur.svg)

alterli ist ein Astro-Projekt mit `output: 'static'` — die Marketingseiten werden beim Build vollständig zu HTML und CSS vorgerendert, es gibt zur Laufzeit keinerlei Server-Rendering. Erst unter `/app` hydriert ein einzelnes React-Island namens `AlterliApp` und übernimmt die Interaktivität. Der komplette siebenstufige Wizard lebt ausschließlich im React-State (`useState`) dieser Komponente. Es gibt kein `localStorage`, kein Cookie, keinen Analytics-Snippet auf dieser Seite und erst recht keinen `fetch()`-Aufruf, der Eingaben irgendwohin schickt. `calc.ts` und `riesterSzenarien.ts` sind reine, synchrone Funktionen — sie nehmen ein Eingabe-Objekt entgegen und geben ein Ergebnis-Objekt zurück, komplett ohne Seiteneffekt. Ein Reload der Seite löscht die komplette Analyse; das ist kein Bug, sondern exakt das gewünschte Verhalten.

Das hat einen angenehmen Nebeneffekt für den Betrieb: Weil nichts als Server-Workload anfällt, lässt sich alterli auf Vercel als rein statisches Projekt hosten, ganz ohne Datenbank, ohne Backend-Kosten und ohne DSGVO-Fragen zur Datenspeicherung — weil schlicht nichts gespeichert wird.

Diese Entscheidung hat auch einen Preis, den ich bewusst in Kauf genommen habe: Es gibt keinen "Ergebnis teilen"-Link, kein Speichern über Geräte hinweg, keinen Login. Wer seine Analyse später noch einmal braucht, muss den Wizard erneut durchlaufen. Für ein Tool, dessen zentrales Versprechen "Zero Data" lautet, ist das kein Kompromiss, sondern die logische Konsequenz — jede Komfortfunktion, die Daten über eine einzelne Sitzung hinaus verfügbar machen würde, bräuchte zwangsläufig irgendeine Form von Speicherung.

## Für wen es (nicht) gedacht ist

Ein ehrliches Produkt muss auch ehrlich über seine Grenzen sein. Für Mitglieder eines berufsständischen Versorgungswerks — etwa Ärzte, Zahnärzte, Rechtsanwälte, Notare, Architekten, Ingenieure oder Steuerberater — zeigt alterli nach der Untergruppen-Auswahl bewusst einen "Soft Exit": einen Hinweis, dass die jeweilige Versorgungswerksordnung zu individuell ist, um sie in einem allgemeinen Tool seriös zu berechnen, statt eine Zahl vorzugaukeln, die falsch sein könnte. Diese Steuerung sitzt direkt in der Konfiguration der Untergruppen (`softExit: true`) und ist keine nachträgliche Einschränkung, sondern von Anfang an Teil des Datenmodells.

## Tech-Stack im Detail

Unter der Haube ist alterli bewusst schlank gehalten: Astro 4 als statisches Grundgerüst, ein einzelnes React-18-Island für die interaktive App, TypeScript durchgängig für Typsicherheit in der Berechnungslogik, Tailwind CSS für das Styling, shadcn/ui und Radix UI für zugängliche Basiskomponenten (Slider, Select, Tooltip, Sheet), Recharts für die Diagramme und ein dezenter Three.js-Hintergrund auf der Startseite für die Netzwerk-Grafik im Hero-Bereich. Das komplette Projekt baut zu statischem HTML/JS (`npm run build`, Output in `dist/`) und läuft auf Vercel praktisch ohne Konfiguration.

Diese Schlankheit ist eine bewusste Gegenreaktion zu vielen Finanz-Tools, die für eine einzige Berechnung ein komplettes Backend, eine Nutzerdatenbank und ein Analytics-Dashboard mitschleppen. alterli braucht nichts davon, weil die eigentliche Komplexität nicht in der Infrastruktur steckt, sondern in der Domänenlogik selbst — im deutschen Steuer- und Rentenrecht. Genau dort liegt auch der größte Wartungsaufwand: Steuerstufen, Freibeträge und Förderhöchstgrenzen ändern sich jährlich, und jede Änderung landet als kleiner, gut testbarer Patch in `calc.ts`, statt in einer verteilten Microservice-Landschaft gesucht werden zu müssen.

## Ausblick

alterli trägt aktuell bewusst das Label "v1 Alpha". Auf der Roadmap stehen unter anderem eine Open-Source-Veröffentlichung, eine englische Übersetzung und die kontinuierliche Pflege der Berechnungsgrundlagen, sobald sich Details zum Altersvorsorgedepot 2027 weiter konkretisieren — das Tool nennt dafür transparent ein Stand-Datum der zugrunde liegenden Annahmen. Beiträge in Form von Pull Requests sind ausdrücklich erwünscht, besonders bei der Verbesserung der Steuer- und Rentenlogik sowie bei zusätzlichen Berufsgruppen und Sonderfällen.

Am Ende ist alterli für mich der Beweis, dass ein Finanzprodukt nicht verkaufen muss, um nützlich zu sein. Manchmal reicht ein einziger ehrlicher Satz, der jemandem sagt, wo er wirklich steht.

Was mich an diesem Projekt am meisten begleitet hat, ist die Verantwortung, die in jeder einzelnen Formel steckt. Anders als bei einem Design-System oder einem Dashboard gibt es bei Steuer- und Rentenlogik kein "ungefähr richtig" — eine falsch übertragene Zulagenregel oder ein falscher Rundungsschritt hätte direkte Auswirkungen auf die Entscheidung eines echten Menschen. Deshalb ist jede Formel in `calc.ts` bewusst klein, benannt und isoliert gehalten, statt in einer großen, unübersichtlichen Funktion zu verschwinden — nicht aus Stilfrage, sondern damit sich jede einzelne Annahme später schnell wiederfinden, überprüfen und bei Bedarf korrigieren lässt, wenn sich Gesetzeslage oder Förderrichtlinien ändern. Genau dieser Anspruch an Nachvollziehbarkeit ist es, den ich mir von Finanz-Tools generell wünschen würde — und den ich mit alterli selbst einlösen wollte, statt nur einzufordern.
