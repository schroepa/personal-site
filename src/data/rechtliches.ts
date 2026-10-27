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

export const NAME = "Patrick Schrödter"

/** Von Patrick einzutragen (siehe oben). */
export const PLATZHALTER = {
  anschrift: "[[ANSCHRIFT]]",
  stand: "[[STAND]]",
} as const

/**
 * Alle externen Hosts, von denen die Website Ressourcen lädt oder an die sie Daten sendet.
 * Quelle für den Abschnitt „Externe Ressourcen“ der Datenschutzerklärung und (Task 16) für die CSP.
 * Belege: Cookiebot-Skript in src/layouts/SiteLayout.astro (`https://consent.cookiebot.com/uc.js`),
 * PostHog-Host in .env (`PUBLIC_POSTHOG_HOST`) und src/components/posthog.astro (`api_host`, Bibliothek von `<host>/static/array.js`).
 */
export interface ExterneRessource {
  name: string
  host: string
  zweck: string
  /** true: wird erst nach Einwilligung geladen; false: immer (technisch für die Einwilligungsabfrage nötig) */
  einwilligung: boolean
}

export const EXTERNE_RESSOURCEN: ExterneRessource[] = [
  {
    name: "Cookiebot",
    host: "consent.cookiebot.com",
    zweck: "Einwilligungsverwaltung: Skript und Banner, Abfrage und Nachweis deiner Entscheidung",
    einwilligung: false,
  },
  {
    name: "Cookiebot",
    host: "consentcdn.cookiebot.com",
    zweck: "Einwilligungsverwaltung: vom Cookiebot-Skript nachgeladene Dateien",
    einwilligung: false,
  },
  {
    name: "PostHog",
    host: "eu.i.posthog.com",
    zweck: "Reichweitenmessung (Seitenaufrufe), EU-Endpunkt",
    einwilligung: true,
  },
]

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

const cookiebot = EXTERNE_RESSOURCEN.filter((r) => r.name === "Cookiebot").map((r) => r.host)
const posthog = EXTERNE_RESSOURCEN.find((r) => r.name === "PostHog")!.host

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
          "Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA gehostet. Vercel ist der technische Betreiber der Server, auf denen diese Website läuft."
        ),
        absatz("Beim Abruf werden serverseitig automatisch gespeichert:"),
        {
          typ: "liste",
          eintraege: [
            "IP-Adresse des anfragenden Geräts (anonymisiert)",
            "Datum und Uhrzeit des Zugriffs",
            "Name und URL der abgerufenen Datei",
            "Übertragene Datenmenge",
            "Browser-Typ und -Version",
            "Betriebssystem",
            "Referrer-URL",
          ],
        },
        absatz(
          "Die Verarbeitung ist technisch notwendig und erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse am stabilen und sicheren Betrieb). Vercel hat sich dem EU-US Data Privacy Framework angeschlossen. Weitere Informationen: ",
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
          "Diese Website fragt per Einwilligungsbanner, ob Cookies und ähnliche Techniken für die Reichweitenmessung eingesetzt werden dürfen. Ohne deine Einwilligung in die Kategorie Statistik wird die Reichweitenmessung nicht gestartet."
        ),
        {
          typ: "absatz",
          kopf: "Cookiebot (Einwilligungsverwaltung).",
          teile: [
            `Zweck: Einholen, Speichern und Nachweisen deiner Entscheidung. Bei jedem Seitenaufruf lädt dein Browser das Skript von ${cookiebot[0]}; weitere Dateien lädt es bei Bedarf von ${cookiebot[1]} nach. Dabei erhält der Anbieter technisch bedingt deine IP-Adresse. Deine Entscheidung wird in deinem Browser gespeichert. [[PRÜFEN: Name und Speicherdauer des Cookiebot-Cookies (laut Anbieter „CookieConsent“, 12 Monate) und Umfang der zum Nachweis übermittelten Daten laut Cookiebot-Dokumentation]] [[PRÜFEN: Rechtsgrundlage für den Einsatz von Cookiebot (Art. 6 Abs. 1 lit. c oder f DSGVO, § 25 Abs. 2 TDDDG), Anbieter und Sitz, Drittlandübermittlung]]`,
          ],
        },
        {
          typ: "absatz",
          kopf: "PostHog (Reichweitenmessung).",
          teile: [
            `Zweck: Ich messe, welche Seiten aufgerufen werden. PostHog wird erst geladen, nachdem du in die Kategorie Statistik eingewilligt hast; ohne Einwilligung wird die Bibliothek nicht von ${posthog} geladen und es werden keine Daten an PostHog gesendet. Verwendet wird der EU-Endpunkt ${posthog}. Erfasst werden Seitenaufrufe, beim Laden einer Seite und bei jedem Seitenwechsel innerhalb der Website, mit den technisch üblichen Angaben wie aufgerufener Adresse, Referrer, Browser und Gerät sowie deiner IP-Adresse beim Übertragen. Eigene, selbst definierte Ereignisse sendet die Website nicht. [[PRÜFEN: genaue Datenfelder und ob die IP-Adresse gespeichert wird (PostHog-Dokumentation, Projekteinstellungen)]] Die Bibliothek ist nicht auf Seitenaufrufe beschränkt, die automatische Erfassung von Klicks (Autocapture) ist im Code nicht abgeschaltet. [[PRÜFEN: ob Autocapture und Sitzungsaufzeichnung im PostHog-Projekt aktiv sind und welche Daten sie erfassen]] [[PRÜFEN: Speicherung im Browser (Cookie oder localStorage) mit Name und Laufzeit laut PostHog-Dokumentation für die verwendete Version]] Rechtsgrundlage ist deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO. [[PRÜFEN: Empfänger und Sitz des Anbieters, Auftragsverarbeitungsvertrag, Drittlandübermittlung trotz EU-Region]] [[PRÜFEN: Aufbewahrungsdauer der Ereignisdaten im PostHog-Projekt]]`,
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
          "Schriften (Geist und Geist Mono) und alle Skripte dieser Website werden von der eigenen Domain ausgeliefert, nicht von Google Fonts oder einem anderen CDN. Externe Hosts sind nur diese:"
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
