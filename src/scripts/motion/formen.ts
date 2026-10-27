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

/**
 * Zeichenvorrat des Scrambles (Anzeigetafel). Prototyp v14: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·'. Kein Token.
 * Gescrambelt werden nur Buchstaben und Ziffern des sichtbaren Textes; Leerzeichen, Pfeile und Trenner bleiben stehen.
 */
export const SCRAMBLE_ZEICHEN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/·"
/**
 * Takt, in dem der Scramble die noch nicht aufgelösten Zeichen neu würfelt (ms). Verhaltenswert, kein Gestaltungswert:
 * 25 Bilder pro Sekunde (wie lichtband/bildintervall) lesen sich wie eine Anzeigetafel, jedes Bild (60 Hz) flimmerte.
 */
export const SCRAMBLE_TAKT_MS = 40

/**
 * Magnet-Knöpfe: Anteil des Zeigerabstands zur Knopfmitte, um den der Knopf dem Zeiger folgt (Prototyp v14: x 0.22, y 0.3),
 * und der Höchstzug in px (Figma motion „physik/magnet“: „max. 7 × 5 px“). Beides ohne Token. Der Zug ist kleiner als
 * der Abstand, der Zeiger bleibt also immer auf dem Knopf (Klickziel wandert nicht unter dem Zeiger weg).
 */
export const MAGNET_ZUG_X = 0.22
export const MAGNET_ZUG_Y = 0.3
export const MAGNET_MAX_X = 7
export const MAGNET_MAX_Y = 5

/** Schwellwert, unter dem ein Magnet-Versatz als Ruhe gilt (px); danach wird die Inline-Transformation entfernt. */
export const MAGNET_RUHE_PX = 0.01

/** Zoom-Faktor der Bilder beim Hover über Karten/Zeilen. Figma: „leichter Zoom“ ohne Wert, Prototyp v14: scale(1.03). */
export const BILD_ZOOM_FAKTOR = 1.03

/** Gewicht der Signatur beim Hover: Token --font-weight-light (Figma schrift/gewicht-hover: „wird bei Hover leicht (300)“). */
export const GEWICHT_HOVER_TOKEN = "--font-weight-light"

/**
 * Lichtband (Prototyp v14, docs/reference/atmosphaere.js): beim Scrollen zieht sich das Band zusammen. Weg nach oben
 * bis 40 px (translateY −40 px) und Stauchung bis scaleY 0.55 (= 1 − 0.45). Beides ohne Figma-Token.
 */
export const LICHTBAND_ZUG_MAX_PX = 40
export const LICHTBAND_SKALA_MIN = 0.55
