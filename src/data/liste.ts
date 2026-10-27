// Eintrag der NummernListe (Figma „liste“): Nummer oder Meta, Titel, Beschreibung.
export interface ListenEintrag {
  nummer?: string
  titel: string
  beschreibung?: string
  /** Zeile über der Beschreibung (Lebenslauf: Firma, Ort) */
  zusatz?: string
  /** Aufzählung unter der Beschreibung (Lebenslauf: Stationen) */
  punkte?: string[]
  /** Nur für Screenreader, hängt hinter dem Titel (Lebenslauf: „Level 4 von 5“) */
  lesetext?: string
}
