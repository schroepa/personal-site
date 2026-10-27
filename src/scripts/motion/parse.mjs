/**
 * Reine Parser für Token-Werte aus getComputedStyle (läuft auch unter node:test, deshalb .mjs).
 * Zeiten kommen als „750ms“ oder „1.4s“, Federung und Physik einheitenlos.
 */

const ZAHL = /^([+-]?(?:\d+\.?\d*|\.\d+))(ms|s)?$/i

/**
 * Wandelt einen Token-Rohwert in eine Zahl. Zeiten werden zu Millisekunden, einheitenlose Werte bleiben.
 * Ein führendes „+“ ist erlaubt, negative Werte bleiben negativ. Leer, Text und fremde Einheiten (px …) werfen.
 * @param {string} raw
 * @returns {number}
 */
export function parseToken(raw) {
  if (typeof raw !== "string") throw new Error(`Token-Wert ist kein Text: ${String(raw)}`)
  const text = raw.trim()
  if (text === "") throw new Error("Token-Wert ist leer (Token fehlt oder ist nicht gesetzt)")
  const m = ZAHL.exec(text)
  if (!m) throw new Error(`Token-Wert nicht lesbar: „${text}“ (erwartet Zahl, ms oder s)`)
  const zahl = Number(m[1])
  return m[2]?.toLowerCase() === "s" ? zahl * 1000 : zahl
}

/**
 * Millisekunden in Sekunden (Motion-Federn erwarten visualDuration in Sekunden).
 * @param {number} ms
 * @returns {number}
 */
export function msToSeconds(ms) {
  return ms / 1000
}

/**
 * Länge in Pixeln aus einem Token wie „24px“ (Größen-Tokens aus tokens.css). Andere Einheiten werfen.
 * @param {string} raw
 * @returns {number}
 */
export function parseLength(raw) {
  if (typeof raw !== "string") throw new Error(`Token-Wert ist kein Text: ${String(raw)}`)
  const text = raw.trim()
  if (text === "") throw new Error("Token-Wert ist leer (Token fehlt oder ist nicht gesetzt)")
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+))px$/i.exec(text)
  if (!m) throw new Error(`Token-Wert nicht lesbar: „${text}“ (erwartet Pixel, z. B. 24px)`)
  return Number(m[1])
}

/**
 * Easing aus einem Token: „cubic-bezier(a, b, c, d)“ wird zu [a, b, c, d] (Motion-Format),
 * ein Schlüsselwort (z. B. „ease“) bleibt als Text.
 * @param {string} raw
 * @returns {[number, number, number, number] | string}
 */
export function parseEasing(raw) {
  if (typeof raw !== "string") throw new Error(`Token-Wert ist kein Text: ${String(raw)}`)
  const text = raw.trim()
  if (text === "") throw new Error("Token-Wert ist leer (Token fehlt oder ist nicht gesetzt)")
  const m = /^cubic-bezier\(\s*([^,]+),([^,]+),([^,]+),([^)]+)\)$/i.exec(text)
  if (m) {
    const zahlen = m.slice(1, 5).map((s) => Number(s.trim()))
    if (zahlen.some((n) => !Number.isFinite(n))) throw new Error(`Easing nicht lesbar: „${text}“`)
    return /** @type {[number, number, number, number]} */ (zahlen)
  }
  if (/^[a-z-]+$/i.test(text)) return text
  throw new Error(`Easing nicht lesbar: „${text}“`)
}
