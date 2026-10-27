// Impressum, Datenschutzerklärung und externe Ressourcen an einer Stelle (Figma „Rechtliches“ 243:24, Texte aus den Desktop-Screens).
//
// ACHTUNG Patrick, vor dem Livegang (Task 17):
//  - [[ANSCHRIFT]] und [[STAND]] durch die ladungsfähige Anschrift und den Stand der Erklärung ersetzen.
//  - Jede Stelle [[PRÜFEN: …]] klären und den Marker samt Text entfernen oder durch die Angabe ersetzen.
//    Das sind Aussagen, die sich nicht aus dem Code belegen lassen (Verträge, Speicherdauern, Rechtsgrundlagen).
//  - Rechtstexte bitte prüfen lassen; das ist keine Rechtsberatung.
// `offeneStellen()` listet alle verbliebenen [[…]]; der Test „kein [[…]] mehr“ (rechtliches.spec.ts) ist bis dahin test.fixme.
//
// Anrede: durchgehend „du“ (Arbeitsannahme, Entscheidung Sie/du offen).
import { KONTAKT_EMAIL } from "./kontakt.ts"
import externeRessourcen from "./externe-ressourcen.json" with { type: "json" }

export const NAME = "Patrick Schrödter"

/** Von Patrick einzutragen (siehe oben). */
export const PLATZHALTER = {
  anschrift: "[[ANSCHRIFT]]",
  stand: "[[STAND]]",
} as const

/**
 * Alle externen Hosts, von denen die Website Ressourcen lädt oder an die sie Daten sendet.
 * Einzige Quelle: src/data/externe-ressourcen.json. Daraus entstehen der Abschnitt „Externe Ressourcen“ der
 * Datenschutzerklärung (hier) und die CSP in vercel.json (scripts/build-vercel-headers.mjs liest das Feld `csp`,
 * also welche CSP-Direktiven den Host brauchen). Neuer Host: dort eintragen, dann `npm run headers`.
 * Belege: Cookiebot-Skript in src/layouts/SiteLayout.astro (`https://consent.cookiebot.com/uc.js`),
 * imgsct.cookiebot.com (nur img-src) aus der Cookiebot-CSP-Dokumentation (Stand 11.03.2025, siehe README „Sicherheits-Header & CSP“),
 * PostHog-Host in .env (`PUBLIC_POSTHOG_HOST`) und src/scripts/posthog-skript.ts (`api_host`, Bibliothek von `<host>/static/array.js`).
 * eu-assets.i.posthog.com: node_modules/posthog-js/lib/src/utils/request-router.js (Zeilen 64-70: Region EU aus api_host `eu.i.posthog.com`;
 * Zeilen 99-111: Ziel „assets“ ergibt `https://eu-assets.i.posthog.com`), genutzt von remote-config.js:38 und
 * entrypoints/external-scripts-loader.js:89-109 für Konfiguration und Erweiterungen. Gilt für die installierte Version (posthog-js 1.373.4);
 * das Snippet lädt array.js vom PostHog-Server, dessen Version kann abweichen, daher Netzwerk-Trace nach Einwilligung (siehe PRÜFEN im Text).
 */
export interface ExterneRessource {
  name: string
  host: string
  zweck: string
  /** true: wird erst nach Einwilligung geladen; false: immer (technisch für die Einwilligungsabfrage nötig) */
  einwilligung: boolean
}

// Nur die Felder für den Text; `csp` braucht allein der Header-Generator.
export const EXTERNE_RESSOURCEN: ExterneRessource[] = externeRessourcen.map(({ name, host, zweck, einwilligung }) => ({
  name,
  host,
  zweck,
  einwilligung,
}))

// ---------------------------------------------------------------------------------------------
// Inhalte

/** Text oder Link innerhalb eines Absatzes */
export type Teil = string | { text: string; href: string }

export type Block =
  | { typ: "absatz"; /** fetter Einstieg, z. B. „Cookiebot (Einwilligungsverwaltung).“ */ kopf?: string; teile: Teil[] }
  | { typ: "zeilen"; zeilen: Teil[][] }
  | { typ: "liste"; eintraege: Teil[] }

export interface RechtsAbschnitt {
  id: string
  label: string
  nummer?: string
  bloecke: Block[]
}

export interface RechtsSeite {
  label: string
  titel: string
  einleitung: string
  abschnitte: RechtsAbschnitt[]
}

const absatz = (...teile: Teil[]): Block => ({ typ: "absatz", teile })
const mail = (): Teil => ({ text: KONTAKT_EMAIL, href: `mailto:${KONTAKT_EMAIL}` })
const anbieterZeilen = (mitMail: boolean): Block => ({
  typ: "zeilen",
  zeilen: [[NAME], [PLATZHALTER.anschrift], ["Deutschland"], ...(mitMail ? [["E-Mail: ", mail()]] : [])],
})

export const IMPRESSUM: RechtsSeite = {
  label: "Rechtliches",
  titel: "Impressum",
  einleitung: "Angaben gemäß § 5 DDG.",
  abschnitte: [
    { id: "anbieter", label: "Anbieter", bloecke: [anbieterZeilen(false)] },
    { id: "kontakt", label: "Kontakt", bloecke: [absatz("E-Mail: ", mail())] },
    {
      id: "verantwortlich",
      label: "Verantwortlich",
      bloecke: [{ typ: "zeilen", zeilen: [["Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:"], [`${NAME}, Anschrift wie oben.`]] }],
    },
    {
      id: "haftung-fuer-inhalte",
      label: "Haftung für Inhalte",
      bloecke: [
        absatz(
          "Als Diensteanbieter bin ich für eigene Inhalte auf dieser Website nach den allgemeinen Gesetzen verantwortlich. Ich bin jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen."
        ),
        absatz(
          "Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben unberührt. Eine Haftung ist erst ab Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden entferne ich diese Inhalte umgehend."
        ),
      ],
    },
    {
      id: "haftung-fuer-links",
      label: "Haftung für Links",
      bloecke: [
        absatz(
          "Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte ich keinen Einfluss habe. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich."
        ),
      ],
    },
    {
      id: "urheberrecht",
      label: "Urheberrecht",
      bloecke: [
        absatz(
          "Die durch mich erstellten Inhalte und Werke auf dieser Website unterliegen dem deutschen Urheberrecht. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen meiner schriftlichen Zustimmung."
        ),
      ],
    },
  ],
}

/** Host aus EXTERNE_RESSOURCEN nachschlagen (unabhängig von der Reihenfolge der JSON); fehlt er, bricht der Build mit klarer Meldung ab. */
export function hostEintrag(host: string): string {
  const r = EXTERNE_RESSOURCEN.find((x) => x.host === host)
  if (!r) throw new Error(`Host ${host} fehlt in src/data/externe-ressourcen.json, wird aber im Datenschutztext genannt`)
  return r.host
}
const cookiebotSkript = hostEintrag("consent.cookiebot.com")
const cookiebotCdn = hostEintrag("consentcdn.cookiebot.com")
const cookiebotBilder = hostEintrag("imgsct.cookiebot.com")
const posthog = hostEintrag("eu.i.posthog.com")
const posthogAssets = hostEintrag("eu-assets.i.posthog.com")

export const DATENSCHUTZ: RechtsSeite = {
  label: "Rechtliches",
  titel: "Datenschutz",
  einleitung: `Stand: ${PLATZHALTER.stand}`,
  abschnitte: [
    {
      id: "verantwortlicher",
      label: "Verantwortlicher",
      nummer: "1",
      bloecke: [
        absatz("Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:"),
        anbieterZeilen(true),
      ],
    },
    {
      id: "hosting",
      label: "Hosting",
      nummer: "2",
      bloecke: [
        absatz(
          "Diese Website wird bei Vercel Inc. gehostet. [[PRÜFEN: Anschrift und Sitz des Anbieters (laut altem Text 440 N Barranca Ave #4133, Covina, CA 91723, USA), nicht aus dem Code belegbar]] Vercel ist der technische Betreiber der Server, auf denen diese Website läuft."
        ),
        absatz(
          "Beim Abruf werden serverseitig automatisch gespeichert: [[PRÜFEN: Umfang der Logdaten und Speicherdauer bei Vercel (Liste stammt aus dem alten Text), nicht aus dem Code belegbar]]"
        ),
        {
          typ: "liste",
          eintraege: [
            "IP-Adresse des anfragenden Geräts [[PRÜFEN: „anonymisiert“ laut altem Text, nicht belegt]]",
            "Datum und Uhrzeit des Zugriffs",
            "Name und URL der abgerufenen Datei",
            "Übertragene Datenmenge",
            "Browser-Typ und -Version",
            "Betriebssystem",
            "Referrer-URL",
          ],
        },
        absatz(
          "Die Verarbeitung ist technisch notwendig und erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am stabilen und sicheren Betrieb). [[PRÜFEN: Aussage „Vercel hat sich dem EU-US Data Privacy Framework angeschlossen“ aus dem alten Text, Zertifizierung nicht belegt]] Weitere Informationen: ",
          { text: "vercel.com/legal/privacy-policy", href: "https://vercel.com/legal/privacy-policy" }
        ),
      ],
    },
    {
      id: "cookies-und-tracking",
      label: "Cookies und Tracking",
      nummer: "3",
      bloecke: [
        absatz(
          "Diese Website fragt per Einwilligungsbanner, ob Cookies und ähnliche Techniken für die Reichweitenmessung eingesetzt werden dürfen. Ohne deine Einwilligung in die Kategorie Statistik wird die Reichweitenmessung nicht gestartet. [[PRÜFEN: § 25 TDDDG (Speichern von und Zugriff auf Informationen in der Endeinrichtung) für die Speicherung durch Cookiebot und PostHog im Browser berücksichtigen]]"
        ),
        {
          typ: "absatz",
          kopf: "Cookiebot (Einwilligungsverwaltung).",
          teile: [
            `Zweck: Einholen, Speichern und Nachweisen deiner Entscheidung. Bei jedem Seitenaufruf lädt dein Browser das Skript von ${cookiebotSkript}; weitere Dateien lädt es bei Bedarf von ${cookiebotCdn} nach. Zusätzlich kann Cookiebot Bilder von ${cookiebotBilder} laden. [[PRÜFEN: Zweck und Datenverarbeitung von imgsct.cookiebot.com bei Cookiebot erfragen bzw. prüfen (der Host steht nur in der CSP-Dokumentation von Cookiebot)]] Dabei erhält der Anbieter technisch bedingt deine IP-Adresse. Deine Entscheidung wird in deinem Browser gespeichert. [[PRÜFEN: Name und Speicherdauer des Cookiebot-Cookies (laut Anbieter „CookieConsent“, 12 Monate) und Umfang der zum Nachweis übermittelten Daten laut Cookiebot-Dokumentation]] [[PRÜFEN: Rechtsgrundlage für den Einsatz von Cookiebot (Art. 6 Abs. 1 lit. c oder f DSGVO, § 25 Abs. 2 TDDDG), Anbieter und Sitz, Drittlandübermittlung]]`,
          ],
        },
        {
          typ: "absatz",
          kopf: "PostHog (Reichweitenmessung).",
          teile: [
            `Zweck: Ich messe, welche Seiten aufgerufen werden. PostHog wird erst geladen, nachdem du in die Kategorie Statistik eingewilligt hast; ohne Einwilligung wird die Bibliothek nicht von ${posthog} geladen und es werden keine Daten an PostHog gesendet. Verwendet werden die EU-Endpunkte ${posthog} (Bibliothek und Datenübertragung) und ${posthogAssets} (vom Skript nachgeladene Erweiterungen und Konfiguration). Erfasst werden Seitenaufrufe, beim Laden einer Seite und bei jedem Seitenwechsel innerhalb der Website, nach den Standardeinstellungen der Bibliothek auch das Verlassen einer Seite, mit den technisch üblichen Angaben wie aufgerufener Adresse, Referrer, Browser und Gerät sowie deiner IP-Adresse beim Übertragen. Eigene, selbst definierte Ereignisse sendet die Website nicht. [[PRÜFEN: Code-Teil durch tests/e2e/rechtliches.spec.ts abgedeckt (kein posthog.capture im Code); zusätzlich per Netzwerk-Trace nach Einwilligung bestätigen, dass keine eigenen Ereignisse gesendet werden]] [[PRÜFEN: Hosts per Netzwerk-Trace nach Einwilligung bestätigen]] [[PRÜFEN: genaue Datenfelder und ob die IP-Adresse gespeichert wird (PostHog-Dokumentation, Projekteinstellungen)]] Die Bibliothek ist nicht auf Seitenaufrufe beschränkt, die automatische Erfassung von Klicks (Autocapture) ist im Code nicht abgeschaltet. [[PRÜFEN: ob Autocapture und Sitzungsaufzeichnung im PostHog-Projekt aktiv sind und welche Daten sie erfassen]] [[PRÜFEN: Speicherung im Browser (Cookie oder localStorage) mit Name und Laufzeit laut PostHog-Dokumentation für die verwendete Version]] Rechtsgrundlage ist deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO. [[PRÜFEN: Empfänger und Sitz des Anbieters, Auftragsverarbeitungsvertrag, Drittlandübermittlung trotz EU-Region]] [[PRÜFEN: Aufbewahrungsdauer der Ereignisdaten im PostHog-Projekt]]`,
          ],
        },
        {
          typ: "absatz",
          kopf: "Widerruf.",
          teile: [
            "Du kannst deine Einwilligung jederzeit mit Wirkung für die Zukunft ändern oder widerrufen: Über „Cookie-Einstellungen“ in der Fußzeile jeder Seite öffnest du den Dialog erneut. Widerrufst du die Einwilligung in die Kategorie Statistik, wird die Erfassung durch PostHog in deinem Browser beendet.",
          ],
        },
      ],
    },
    {
      id: "externe-ressourcen",
      label: "Externe Ressourcen",
      nummer: "4",
      bloecke: [
        absatz(
          "Schriften (Geist und Geist Mono) und alle Skripte dieser Website werden von der eigenen Domain ausgeliefert, nicht von Google Fonts oder einem anderen CDN. Externe Hosts sind nur diese: [[PRÜFEN: Code-Teil durch tests/e2e/rechtliches.spec.ts abgedeckt (keine anderen Hosts auf gebauten Seiten); zusätzlich per Netzwerk-Trace nach Einwilligung bestätigen]] [[PRÜFEN: Hosts per Netzwerk-Trace nach Einwilligung bestätigen]]"
        ),
        {
          typ: "liste",
          eintraege: EXTERNE_RESSOURCEN.map(
            (r): Teil =>
              `${r.name}, ${r.host}: ${r.zweck}; ${r.einwilligung ? "wird erst nach deiner Einwilligung geladen" : "wird immer geladen, weil die Einwilligungsabfrage es braucht"}.`
          ),
        },
      ],
    },
    {
      id: "deine-rechte",
      label: "Deine Rechte",
      nummer: "5",
      bloecke: [
        absatz(
          "Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Eine erteilte Einwilligung kannst du jederzeit mit Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3 DSGVO), siehe Abschnitt 3. Wende dich dazu an die oben genannte E-Mail-Adresse."
        ),
      ],
    },
    {
      id: "beschwerderecht",
      label: "Beschwerderecht",
      nummer: "6",
      bloecke: [
        absatz(
          "Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Die zuständige Behörde richtet sich nach deinem Wohnort. Eine Liste findest du unter ",
          { text: "bfdi.bund.de", href: "https://www.bfdi.bund.de/DE/Service/Anschriften/Laender/Laender-node.html" },
          "."
        ),
      ],
    },
    {
      id: "aktualitaet",
      label: "Aktualität",
      nummer: "7",
      bloecke: [
        absatz(
          `Diese Datenschutzerklärung hat den Stand ${PLATZHALTER.stand}. Durch die Weiterentwicklung der Website oder geänderte gesetzliche Vorgaben kann eine Anpassung notwendig werden.`
        ),
      ],
    },
  ],
}

// ---------------------------------------------------------------------------------------------
// Hilfen (Tests und Livegang-Prüfung)

const teilText = (t: Teil): string => (typeof t === "string" ? t : t.text)

function blockText(b: Block): string {
  if (b.typ === "absatz") return `${b.kopf ? `${b.kopf} ` : ""}${b.teile.map(teilText).join("")}`
  if (b.typ === "zeilen") return b.zeilen.map((z) => z.map(teilText).join("")).join("\n")
  return b.eintraege.map(teilText).join("\n")
}

/** Gesamter sichtbarer Text einer Seite (Kopf und alle Abschnitte), für Tests. */
export function volltext(seite: RechtsSeite): string {
  return [
    seite.label,
    seite.titel,
    seite.einleitung,
    ...seite.abschnitte.flatMap((a) => [`${a.nummer ?? ""} ${a.label}`, ...a.bloecke.map(blockText)]),
  ].join("\n")
}

/** Alle noch offenen Stellen [[…]] beider Seiten (Anschrift, Stand, PRÜFEN-Marker), in Reihenfolge, ohne Doppelte. */
export function offeneStellen(): string[] {
  const treffer = [IMPRESSUM, DATENSCHUTZ].flatMap((s) => volltext(s).match(/\[\[[^\]]+\]\]/g) ?? [])
  return [...new Set(treffer)]
}
