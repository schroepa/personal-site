---
title: "Warum \"Single Source of Truth\" meistens eine Lüge ist — und wie man es trotzdem hinbekommt"
description: "Jedes Design-System-Kickoff verspricht eine einzige Wahrheit. In der Praxis gibt es fast immer mindestens drei — und der Fehler ist, das zu leugnen, statt es zu managen."
date: 2026-07-13
tags: ["Design Systems"]
coverImage: "/images/blog/blog-014.webp"
draft: true
---

"Single Source of Truth" ist der Satz, mit dem praktisch jedes Design-System-Kickoff beginnt. Er steht auf der ersten Folie, meistens neben einem Diagramm mit Figma links, Code rechts und einem selbstbewussten Pfeil dazwischen. Er klingt nach einer technischen Garantie. Er ist meistens ein Versprechen, das niemand im Raum einlösen kann — nicht weil das Team inkompetent ist, sondern weil die Prämisse falsch ist. Es gibt in den allermeisten realen Design-System-Setups nicht eine Wahrheit. Es gibt mindestens drei: die in Figma, die im Code, und die, die gerade in den Köpfen der Menschen existiert, die beide bedienen. Wer das ignoriert, baut ein System, das auf dem Papier great aussieht und in der Praxis nach zwölf Monaten leise auseinanderdriftet, bis niemand mehr weiß, welche der drei Wahrheiten gerade gilt.

Ich sage das nicht, um zynisch zu sein. Ich sage es, weil die ehrliche Version — SSOT ist ein Ziel, keine Ausgangslage — der einzige Weg ist, tatsächlich näher an eine funktionierende Wahrheit heranzukommen. Die Teams, die am Ende die stabilsten Systeme haben, sind nicht die, die am lautesten "Single Source of Truth" auf die Roadmap geschrieben haben. Es sind die, die zugegeben haben, dass sie mehrere Quellen haben, und dann angefangen haben, die Übersetzung zwischen ihnen explizit zu managen, statt sie zu ignorieren.

## Die drei Wahrheiten, die in jedem realen Setup existieren

Fangen wir mit der Bestandsaufnahme an, die die meisten Kickoffs überspringen. In jedem Design-System-Setup, das ich in den letzten 15 Jahren gesehen habe — bei DefShop, bei Oetker Digital, bei A Eins Digital Innovation, und in der Freelance-Arbeit danach —, existieren strukturell drei parallele Wahrheiten, egal wie das Org-Chart aussieht.

**Wahrheit eins: Figma.** Hier leben die Design-Entscheidungen zuerst. Ein neuer Radius-Wert, eine neue Farbnuance, ein neuer Spacing-Schritt — sie entstehen als Figma Variable oder als visuelle Anpassung an einer Komponente, bevor irgendjemand Code anfasst. Figma ist chronologisch fast immer die erste Quelle.

**Wahrheit zwei: Der Code.** Hier leben die Werte, die tatsächlich ausgeliefert werden. CSS Custom Properties, Tailwind-Config, JSON-Token-Dateien — was auch immer die Pipeline ist, am Ende zählt nur, was im Browser landet. Der Code ist die Wahrheit, die der Nutzer sieht, egal was in Figma steht.

**Wahrheit drei: Die Köpfe der Menschen.** Das ist die unterschätzte dritte Quelle. Ein Senior-Entwickler weiß, dass `--space-4` "eigentlich" nicht mehr für neue Components verwendet werden soll, obwohl das nirgends dokumentiert ist. Eine Designerin weiß, dass die Rot-Variante in Figma veraltet ist und man stattdessen die neue Error-Farbe aus dem Slack-Thread von letzter Woche nehmen soll. Dieses Wissen ist real, es beeinflusst reale Entscheidungen — aber es existiert in keinem System, das versioniert, durchsucht oder auditiert werden kann. Es verschwindet, wenn die Person das Team verlässt.

Die Behauptung "wir haben eine Single Source of Truth" bedeutet in der Praxis fast immer: Wir ignorieren zwei dieser drei Wahrheiten in unserer Kommunikation, während sie technisch weiter existieren und munter auseinanderdriften.

## Warum die Lücke zwischen Figma und Code strukturell ist, nicht zufällig

Der Grund, warum ich das für ein strukturelles statt für ein Zufallsproblem halte: Es gibt schlicht keine offizielle Live-Verbindung zwischen einer Figma-Datei und einer Codebase. Figma Variables und CSS Custom Properties sind zwei vollständig unabhängige Datenmodelle, die zufällig ähnlich benannt werden können, aber niemals automatisch synchron bleiben, ohne dass jemand aktiv eine Brücke baut und pflegt.

Das ist kein Bug, den ein zukünftiges Figma-Update beheben wird. Es ist eine Konsequenz davon, dass Design-Werte und Code-Werte in unterschiedlichen Zeitzonen leben. Eine Designerin kann eine Figma Variable in fünf Sekunden anpassen, ohne einen Pull Request, ohne Code-Review, ohne Deploy. Ein Entwickler kann eine CSS-Variable ändern und sie sofort in einer Preview-Umgebung sehen, ohne dass Figma davon je erfährt. Beide Änderungen sind vollkommen legitim, beide passieren ständig, und keine der beiden Seiten hat einen Mechanismus, die andere automatisch zu benachrichtigen.

Ich habe das in einem konkreten, wiederkehrenden Muster erlebt, das ich mittlerweile in fast jedem Projekt sehe, das ich übernehme: `primary` in Figma und `--primary` im Code tragen denselben Namen, aber unterschiedliche Werte — weil vor drei Monaten jemand die Farbe in Figma leicht nachjustiert hat, um besser mit einem neuen Illustrationsstil zu harmonieren, ohne zu wissen, dass dieselbe Variable im Code an zwölf Stellen verwendet wird. Niemand hat gelogen. Niemand war nachlässig. Es gab einfach keinen Prozess, der diese Änderung sichtbar gemacht hätte, bevor ein Screenshot-Vergleich in einem QA-Durchlauf die Divergenz Wochen später aufdeckt.

## Der Unterschied zwischen "eine Wahrheit" und "eine kontrollierte Übersetzung"

Der Denkfehler, der SSOT zur Lüge macht, ist die Annahme, dass die Lösung darin besteht, eine der drei Wahrheiten zur einzig gültigen zu erklären und die anderen beiden zu eliminieren. Das funktioniert nicht, weil jede der drei Quellen eine reale Funktion erfüllt, die die anderen nicht ersetzen können. Figma ist der Ort, an dem visuelle Entscheidungen schnell iteriert werden, ohne Build-Pipeline. Code ist der Ort, an dem Werte tatsächlich ausgeliefert werden. Implizites Team-Wissen ist der Ort, an dem Ausnahmen, Migrationsstände und Übergangsregeln gespeichert werden, für die es (noch) keinen formalen Platz gibt.

Die realistische Alternative zu "eine Wahrheit" ist "eine kontrollierte, dokumentierte Übersetzung zwischen den Wahrheiten". Das bedeutet konkret drei Dinge, die ich in jedem Projekt versuche, so früh wie möglich zu etablieren:

**Eine explizite Namenskonvention, die in beide Richtungen mechanisch übersetzbar ist.** `primary` in Figma muss `--primary` im Code werden, nicht durch Interpretation, sondern durch eine feste Regel. Sobald diese Regel existiert, wird aus "welche Hex-Zahl war da nochmal gemeint" eine reine Nachschlage-Operation.

**Ein dokumentierter, versionierter Übersetzungsprozess statt eines informellen "wir schauen halt beide mal rein".** Im Idealfall ein Skript, das Figma-Variable-Exports automatisch in CSS Custom Properties überführt — nicht, weil das Skript magisch alle Probleme löst, sondern weil es den Übersetzungsschritt sichtbar und wiederholbar macht, statt ihn stillschweigend im Kopf einer einzelnen Person zu belassen.

**Eine explizite Konvention dafür, welche Quelle bei einem Konflikt gewinnt.** Wenn Figma und Code auseinanderlaufen — und das werden sie, garantiert —, muss vorher klar sein, ob Code führend ist (Figma wird nachgezogen) oder Figma führend ist (Code wird nachgezogen). Ohne diese Regel verwandelt sich jeder Konflikt in eine Diskussion, statt in einen Prozess-Schritt.

## Das implizite Wissen ist die gefährlichste der drei Wahrheiten

Von den drei Quellen ist die dritte — das Wissen in den Köpfen — die, die am wenigsten Aufmerksamkeit bekommt und am meisten Schaden anrichtet, wenn sie ignoriert wird. Figma-Drift und Code-Drift sind wenigstens sichtbar, sobald jemand hinschaut: ein Screenshot-Vergleich, ein Diff zwischen Token-Exporten, ein visueller Regressionstest. Implizites Wissen ist unsichtbar, bis es fehlt.

Ein konkretes Beispiel aus der Praxis: Ein Team entscheidet in einem Slack-Thread, dass `--space-6` ab sofort nicht mehr für neue Layouts verwendet werden soll, weil es zu einer inkonsistenten vertikalen Rhythmik in Formularen geführt hat — man einigt sich informell auf `--space-8` als neuen Standard für diesen Anwendungsfall. Diese Entscheidung ist real, sie beeinflusst reales Verhalten in Code-Reviews ("bitte nicht mehr space-6 hier"), aber sie existiert in keiner Token-Dokumentation, in keinem Styleguide, in keinem Figma-Kommentar. Sechs Monate später kommt ein neuer Entwickler ins Team, findet `--space-6` in der Token-Liste, hält es für gültig, weil nichts das Gegenteil sagt, und verwendet es in einer neuen Komponente. Niemand hat einen Fehler gemacht — die Information war einfach an keinem Ort gespeichert, der für neue Teammitglieder erreichbar war.

Der Grund, warum ich implizites Wissen als eigene, dritte "Wahrheit" behandle, statt es als Rand-Notiz abzutun: Es hat denselben Anspruch auf Gültigkeit wie Figma oder Code, aber keinen der beiden Mechanismen, die Gültigkeit normalerweise sichtbar machen — keine Versionierung, keine Historie, kein Ort, an dem man nachschauen kann, wer diese Entscheidung wann getroffen hat und warum. Die Lösung ist unspektakulär, aber wirksam: Jede informelle Entscheidung, die länger als eine Woche gelten soll, bekommt einen Eintrag an einem festen Ort — ein Deprecation-Kommentar direkt im Token-File, ein kurzer Absatz in der Design-System-Dokumentation, ein Tag in Figma selbst. Nicht, weil Dokumentation an sich heilig ist, sondern weil implizites Wissen sonst genau die Quelle ist, aus der die schleichendsten, am schwersten zu debuggenden Inkonsistenzen entstehen.

## Deprecation als der Test, an dem SSOT-Behauptungen scheitern

Der zuverlässigste Praxistest, den ich nutze, um zu prüfen, ob ein Team tatsächlich näher an SSOT ist oder nur behauptet, es zu sein: Was passiert, wenn ein Token deprecated wird? Die Antwort verrät sofort, wie viele echte Wahrheiten im System existieren.

In einem System mit tatsächlich kontrollierter Übersetzung läuft eine Deprecation so ab: Der Token wird im Code als deprecated markiert (bei CSS Custom Properties etwa über einen Kommentar mit Ablaufdatum, bei TypeScript-Token-Definitionen über ein `@deprecated`-JSDoc, das IDE-Warnungen auslöst), die entsprechende Figma Variable bekommt eine sichtbare Markierung oder wird in eine "Legacy"-Gruppe verschoben, und es gibt einen dokumentierten Ersatzwert, auf den neue Arbeit migrieren soll. Jede der drei Wahrheiten weiß vom selben Zustand.

In der Realität, die ich häufiger sehe: Der Token verschwindet leise aus neuen Figma-Komponenten, weil die Designerin, die ihn deprecated hat, es weiß — aber er bleibt im Code aktiv, weil niemand ein Ticket dafür angelegt hat, ihn zu entfernen. Sechs Monate später hat man zwei parallel gültige Spacing-Werte für denselben Zweck, von denen der eine "offiziell tot" ist, aber technisch weiterhin funktioniert und in älteren Komponenten verwendet wird. Genau dieser Zustand — technisch funktionsfähig, aber semantisch bedeutungslos — ist das Symptom, an dem man erkennt, dass die drei Wahrheiten bereits auseinandergelaufen sind, lange bevor es jemand als Problem benennt.

## Warum kleinere Teams das Problem eher verdrängen als lösen

Ein Einwand, den ich oft höre: "Wir sind ein kleines Team, wir brauchen diesen ganzen Übersetzungs-Overhead nicht, wir reden halt einfach miteinander." Das stimmt kurzfristig — und ist gleichzeitig der Grund, warum kleinere Teams das Problem seltener lösen und häufiger verdrängen. Bei drei Personen im selben Slack-Channel ist implizites Wissen tatsächlich fast so gut wie Dokumentation, weil der Kommunikationsweg kurz genug ist, dass Inkonsistenzen schnell auffallen und informell korrigiert werden.

Das Problem entsteht nicht durch Teamgröße direkt, sondern durch Personalwechsel und Zeit. Sobald eine einzige Person das Team verlässt, die "im Kopf" wusste, welche Tokens veraltet sind und warum, verschwindet dieses Wissen vollständig und lautlos — es gibt kein Commit, keine Löschmeldung, keinen Moment, in dem irgendjemand merkt, dass gerade Kontext verloren geht. Der pragmatische Mittelweg, den ich kleineren Teams empfehle, ist nicht vollständige SSOT-Tooling-Infrastruktur ab Tag eins, sondern ein sehr günstiger erster Schritt: ein einziges Markdown-File oder ein Notion-Dokument, das jede "wir haben uns entschieden, X nicht mehr zu verwenden"-Entscheidung in einem Satz festhält, mit Datum. Das kostet fünf Minuten pro Entscheidung und verhindert genau die Art von Wissensverlust, die später Wochen an Debugging kostet, wenn niemand mehr weiß, warum zwei Farbwerte für denselben Zweck existieren.

## Was das für Team-Struktur und Verantwortlichkeit bedeutet

Ein weiterer Grund, warum SSOT in der Praxis scheitert: Es gibt in den meisten Organisationen keine Person, deren explizite Verantwortung die Konsistenz zwischen den drei Wahrheiten ist. Design-Teams sind verantwortlich für Figma, Engineering-Teams sind verantwortlich für Code, und die Übersetzung dazwischen fällt in eine Verantwortungslücke, die niemand offiziell besetzt — sie wird informell von wem auch immer übernommen, der gerade zufällig beide Seiten versteht und sich gestört genug fühlt, um die Divergenz zu beheben.

Das ist genau die Lücke, die die Rolle des Design Engineers strukturell schließt — nicht als zusätzliche Schicht Bürokratie, sondern als explizite Besetzung einer Verantwortung, die sonst niemand trägt. Wenn eine Person (oder ein kleines, funktionsübergreifendes Team) explizit dafür verantwortlich ist, dass Figma Variables und Code-Tokens synchron bleiben, dass Deprecations in beiden Systemen gleichzeitig sichtbar werden, und dass informelle Team-Entscheidungen einen dauerhaften Ort bekommen — dann verschiebt sich SSOT von einer Behauptung auf einer Kickoff-Folie zu einer tatsächlich gepflegten Eigenschaft des Systems, die man mit dem Deprecation-Test oben regelmäßig überprüfen kann.

## Der Business Case: Warum diese Ehrlichkeit Geld spart, nicht kostet

Für Product Leadership klingt "wir haben keine echte Single Source of Truth, sondern drei Quellen, die wir aktiv synchronisieren" zunächst nach einem Rückschritt gegenüber der cleanen Kickoff-Folie. Das Gegenteil ist der Fall. Jede stillschweigend ignorierte Divergenz zwischen Figma, Code und Team-Wissen wird irgendwann sichtbar — meistens in Form eines QA-Bugs, eines Kundenfeedbacks über inkonsistente Farben zwischen zwei Produktbereichen, oder eines neuen Mitarbeiters, der Wochen braucht, um herauszufinden, welcher von drei ähnlich aussehenden Tokens der "richtige" ist. Diese Kosten sind real, sie tauchen nur später auf und werden selten dem ursprünglichen Versäumnis zugeordnet.

Ein Team, das den Übersetzungsprozess zwischen Figma und Code explizit macht — feste Namenskonvention, ein Skript oder zumindest ein dokumentierter manueller Schritt, eine klare Konfliktregel, ein Ort für informelle Entscheidungen —, reduziert genau die Art von Rework, die sonst als ungeplanter Aufwand in späteren Sprints auftaucht: der Tag, an dem jemand zwei Wochen investieren muss, um herauszufinden, warum der Checkout-Button in Produktion anders aussieht als in Figma, oder warum ein neuer Entwickler drei Varianten derselben Fehlerfarbe im Code findet und nicht weiß, welche aktuell ist. Das ist kein abstrakter Wartungsvorteil — es ist Zeit, die sonst als unsichtbarer Tax auf jede neue Feature-Entwicklung anfällt, weil jedes neue Stück UI erst durch die Unklarheit navigieren muss, bevor es gebaut werden kann.

Am Ende ist die ehrliche Version von "Single Source of Truth" kein Kompromiss, sondern die einzige Version, die tatsächlich hält, was die Kickoff-Folie verspricht. Nicht eine Wahrheit, die man behauptet — sondern drei Wahrheiten, deren Übersetzung man aktiv managt, dokumentiert und regelmäßig testet. Das ist weniger elegant als ein einzelner Pfeil auf einer Folie. Es ist der einzige Ansatz, der nach zwei Jahren noch stimmt.
