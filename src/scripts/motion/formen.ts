/**
 * Bewegungswerte ohne eigenes Figma-Token. Dauer, Feder, Versatz, Easing und Gewicht kommen immer aus den
 * Tokens (tokens.css); hier stehen nur die Stellen, an denen die Übergabe keinen Token-Wert nennt.
 * Jeder Eintrag nennt, woher er stammt.
 */

/** Token für Wege in Pixeln: Versatz der Hero-Wörter, des Ersatzworts und der Signatur-Zeilen (±24 px; die Akkordeon-Bilder tragen ihren Versatz im CSS). */
export const WEG_TOKEN = "--global-size-24"

/** Dauer „500 ms nach der Zeile“ (Figma schrift/gewicht: Gewicht wächst 500 ms nach der Zeile). Vorhandenes Dauer-Token. */
export const GEWICHT_NACH_ZEILE_TOKEN = "--dauer-500"

/** Gewichtsachse der Signatur: Start (Geist variabel, Extralight). Das Ende ist das Gewicht aus dem Textstil. */
export const GEWICHT_START_TOKEN = "--font-weight-extralight"

/** Anfangs-Sperrung der Labels (Figma schrift/sperrung: „ziehen sich von 0.6em Sperrung zusammen“). */
export const SPERRUNG_START = "0.6em"
