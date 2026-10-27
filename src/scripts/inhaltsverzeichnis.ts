/**
 * Inhaltsverzeichnis: der Eintrag, dessen Zwischentitel zuletzt die Lesezeile (oberes Drittel) passiert hat,
 * bekommt aria-current="true". IntersectionObserver löst die Neuberechnung aus; am Seitenende gilt der letzte Eintrag.
 */
const LESEZEILE = 0.3

export function initInhaltsverzeichnis(): () => void {
  const abmelden: Array<() => void> = []

  document.querySelectorAll<HTMLElement>("[data-inhaltsverzeichnis]").forEach((nav) => {
    const links = [...nav.querySelectorAll<HTMLAnchorElement>("a[href^='#']")]
    const paare = links
      .map((link) => ({ link, ziel: document.getElementById(decodeURIComponent(link.hash.slice(1))) }))
      .filter((p): p is { link: HTMLAnchorElement; ziel: HTMLElement } => p.ziel !== null)
    if (paare.length === 0) return

    const setzen = () => {
      const linie = window.innerHeight * LESEZEILE
      const amEnde = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      let aktiv = paare[0]
      if (amEnde) {
        aktiv = paare[paare.length - 1]
      } else {
        for (const paar of paare) {
          if (paar.ziel.getBoundingClientRect().top <= linie) aktiv = paar
        }
      }
      for (const { link } of paare) {
        if (link === aktiv.link) link.setAttribute("aria-current", "true")
        else link.removeAttribute("aria-current")
      }
    }

    // Die Zwischentitel selbst und der Seitenrand lösen die Neuberechnung aus
    const beobachter = new IntersectionObserver(setzen, { rootMargin: `0px 0px -${(1 - LESEZEILE) * 100}% 0px` })
    paare.forEach(({ ziel }) => beobachter.observe(ziel))
    window.addEventListener("scroll", setzen, { passive: true })
    window.addEventListener("resize", setzen)
    window.addEventListener("hashchange", setzen)
    setzen()

    abmelden.push(() => {
      beobachter.disconnect()
      window.removeEventListener("scroll", setzen)
      window.removeEventListener("resize", setzen)
      window.removeEventListener("hashchange", setzen)
    })
  })

  return () => abmelden.forEach((fn) => fn())
}
