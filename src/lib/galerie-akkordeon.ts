export interface Kapitel {
  titel: string
  bild: string
  href: string
}

export const KAPITEL_MIN = 1
export const KAPITEL_MAX = 5

/** Prüft die Kapitelliste zur Build-Zeit; wirft mit klarer Meldung, wenn sie nicht 1 bis 5 Einträge hat. */
export function assertKapitel(kapitel: readonly Kapitel[]): void {
  if (!Array.isArray(kapitel)) {
    throw new Error("GalerieAkkordeon: `kapitel` muss eine Liste mit 1 bis 5 Einträgen sein.")
  }
  if (kapitel.length < KAPITEL_MIN || kapitel.length > KAPITEL_MAX) {
    throw new Error(
      `GalerieAkkordeon: erwartet 1 bis ${KAPITEL_MAX} Kapitel, erhalten ${kapitel.length}. ` +
        `Das Layout (Spalten 8fr/1fr) ist nur für 1 bis ${KAPITEL_MAX} Streifen entworfen.`
    )
  }
}
