/**
 * Knopf „Cookie-Einstellungen“ der Fußzeile: öffnet den Cookiebot-Dialog erneut (`Cookiebot.renew()`).
 * Ohne geladenes Cookiebot (blockiert, offline) passiert nichts. Kein Inline-Handler, damit eine strenge CSP reicht.
 * Gibt den Teardown zurück.
 */
type CookiebotFenster = Window & { Cookiebot?: { renew?: () => void } }

export function initCookieEinstellungen(): () => void {
  const abmelden: Array<() => void> = []
  document.querySelectorAll<HTMLElement>("[data-cookie-einstellungen]").forEach((knopf) => {
    const onKlick = () => (window as CookiebotFenster).Cookiebot?.renew?.()
    knopf.addEventListener("click", onKlick)
    abmelden.push(() => knopf.removeEventListener("click", onKlick))
  })
  return () => abmelden.forEach((fn) => fn())
}
