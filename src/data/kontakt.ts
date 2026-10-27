// Kontaktdaten und alle Texte der Seite /kontakt an einer Stelle.
// ACHTUNG Patrick: Die Texte unter WOFUER, ABLAUF und DATEN sind Vorschläge aus der Übergabe (Figma 270:2),
// von Patrick freizugeben. Änderungen hier wirken direkt auf der Seite.
import type { ListenEintrag } from "./liste.ts"

export const KONTAKT_EMAIL = "kontakt@ptrckschrdtr.de"
// TODO Patrick: Figma zeigt patrick@ptrckschrdtr.de und linkedin.com/in/patrick-schroedter; hier steht die
// bisherige Adresse bzw. das Profil aus cv.ts. Bitte bestätigen.
export const LINKEDIN_URL = "https://www.linkedin.com/in/patrick-schr%C3%B6dter-085330119/"
export const LINKEDIN_ANZEIGE = "linkedin.com/in/patrick-schroedter"

export const KONTAKT_SEITE = {
  label: "Kontakt",
  titel: "Lass uns reden.",
  einleitung: "Schreib mir ein paar Zeilen zu deinem Vorhaben. Ich antworte in der Regel innerhalb von zwei Werktagen.",
}

// Vorschläge, von Patrick freizugeben
export const WOFUER: ListenEintrag[] = [
  {
    nummer: "Freelance",
    titel: "Product Design Lead",
    beschreibung: "Von der ersten Idee bis zum Prototyp im Code, als Teil deines Teams.",
  },
  {
    nummer: "Design Systems",
    titel: "Aufbau und Pflege",
    beschreibung: "Tokens, Komponenten und Dokumentation, Figma und Code synchron.",
  },
  {
    nummer: "Beratung",
    titel: "Workflows mit KI",
    beschreibung: "Automatisierung mit n8n, Claude und Figma, die Routinearbeit spart.",
  },
]

// Vorschläge, von Patrick freizugeben
export const ABLAUF: ListenEintrag[] = [
  { nummer: "01", titel: "Kennenlernen", beschreibung: "30 Minuten per Video, unverbindlich." },
  { nummer: "02", titel: "Angebot", beschreibung: "Klarer Umfang, Festpreis oder Tagessatz." },
  { nummer: "03", titel: "Arbeit", beschreibung: "Kurze Schleifen, sichtbarer Fortschritt in Figma und im Repo." },
]

// Vorschlag, von Patrick freizugeben (Name: Schreibweise aus Figma)
export const DATEN = {
  name: "Patrick Schrödter · Berlin",
  email: KONTAKT_EMAIL,
  linkedin: { url: LINKEDIN_URL, anzeige: LINKEDIN_ANZEIGE },
}
