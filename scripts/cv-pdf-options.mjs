// Kleine, testbare Teile von generate-cv-pdf.mjs.

/**
 * Optionen für page.pdf(). Die Ränder stehen hier und nicht im CSS: in @page gibt es keine Tokens
 * (var() wird dort nicht aufgelöst), das Stylesheet deklariert deshalb nur `@page { size: A4 }`.
 * Format und Ränder bestimmt Playwright, daher preferCSSPageSize: false.
 */
export function buildPdfOptions() {
  return {
    format: "A4",
    printBackground: true,
    preferCSSPageSize: false,
    margin: { top: "18mm", right: "16mm", bottom: "18mm", left: "16mm" },
  }
}

/** Läuft vor jedem Skript der Seite: das PDF wird immer im hellen Theme gedruckt. */
export function buildInitScript() {
  return `try { localStorage.setItem("theme", "light") } catch (e) {}`
}
