// Lebenslauf: aus den Daten (src/data/cv.ts, die Quelle) werden die Listeneinträge der Seite /cv gebaut.
// Aufbau und Beschriftungen nach Figma „Lebenslauf“ (269:1326); Fakten stehen nur in cv.ts.
import type { CvData } from "../data/cv.ts"
import type { ListenEintrag } from "../data/liste.ts"

/** Kopf der Seite. Der Name (h1) und die Zeile darunter kommen aus cv.ts. */
export const CV_SEITE = {
  label: "CV 2026",
  pdfLabel: "PDF herunterladen",
  pdfHref: "/cv.pdf",
}

export const CV_ABSCHNITTE = [
  { id: "profil", label: "Profil" },
  { id: "erfahrung", label: "Erfahrung" },
  { id: "projekte", label: "Projekte" },
  { id: "kompetenzen", label: "Kompetenzen" },
  { id: "tech-stack", label: "Tech Stack" },
  { id: "ausbildung", label: "Ausbildung" },
  { id: "sprachen", label: "Sprachen" },
] as const

/** Bezeichnungen aus dem Entwurf (Deutsch: „Muttersprache“, Englisch: „C1“); für die übrigen Stufen steht „Level n von 5“. */
const BEZEICHNUNG: Record<number, string> = { 4: "C1", 5: "Muttersprache" }

/**
 * Sprachstufe 1 bis 5 als Text. `sichtbar` steht im Titel, `lesetext` („Level 4 von 5“) liest nur der Screenreader
 * dazu, wenn die sichtbare Bezeichnung die Stufe nicht selbst nennt.
 */
export function sprachStufe(level: number): { sichtbar: string; lesetext: string | undefined } {
  if (!Number.isInteger(level) || level < 1 || level > 5) throw new RangeError(`Sprachstufe muss 1 bis 5 sein, war ${level}`)
  const lesetext = `Level ${level} von 5`
  const bezeichnung = BEZEICHNUNG[level]
  return bezeichnung ? { sichtbar: bezeichnung, lesetext } : { sichtbar: lesetext, lesetext: undefined }
}

export interface CvEintraege {
  erfahrung: ListenEintrag[]
  projekte: ListenEintrag[]
  kompetenzen: ListenEintrag[]
  techStack: ListenEintrag[]
  ausbildung: ListenEintrag[]
  sprachen: ListenEintrag[]
}

const nummer = (i: number) => String(i + 1).padStart(2, "0")

export function cvEintraege(cv: CvData): CvEintraege {
  return {
    erfahrung: cv.experience.map((x) => ({
      nummer: x.period,
      titel: x.role,
      zusatz: `${x.company}, ${x.location}`,
      punkte: x.achievements,
    })),
    projekte: cv.projects.map((p) => ({ nummer: `${p.number} · ${p.category}`, titel: p.title, beschreibung: p.description })),
    kompetenzen: cv.coreCompetencies.map((c, i) => ({ nummer: nummer(i), titel: c.title, beschreibung: c.description })),
    techStack: cv.techStack.map((g) => ({ nummer: g.category, titel: g.items.join(", ") })),
    ausbildung: cv.education.map((e, i) => ({ nummer: nummer(i), titel: e.title, beschreibung: e.description })),
    sprachen: cv.languages.map((l) => {
      const { sichtbar, lesetext } = sprachStufe(l.level)
      return lesetext ? { nummer: l.name, titel: sichtbar, lesetext } : { nummer: l.name, titel: sichtbar }
    }),
  }
}
