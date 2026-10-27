/**
 * Galerie-Akkordeon: Streifen wechseln mit Feder statt Sprung. Aufbauend auf dem Zustand aus
 * galerie-akkordeon.ts (aria-current, Ereignis galerie-akkordeon:wechsel) und dem Fenster-Entwurf aus dem CSS:
 * das Bild behält immer die Breite des offenen Streifens (--galerie-offen), der Streifen gibt nur mehr oder
 * weniger davon frei.
 *
 * - Breiten: flex-grow der Streifen, Feder --motion-feder-akkordeon-* (750 ms / 0.08). Während der Bewegung
 *   steht flex-grow inline, danach wieder allein das CSS.
 * - Öffnendes Bild: --motion-feder-akkordeon-bild-auf-* (1000 ms / 0.1), gleitet zur Mitte, Sättigung → 1.
 * - Schließendes Bild: --motion-feder-akkordeon-bild-zu-* (800 ms / 0), wandert ±24 px (WEG_TOKEN), Sättigung → geschlossen.
 * Ruhezustand unter Bewegung: geschlossene Bilder entsättigt und seitlich versetzt (Prototyp v14), das offene neutral.
 * Reduzierte Bewegung und ohne JS: kein Aufruf der Bibliothek, das CSS schaltet sofort um (Task 5).
 * Im schmalen Wisch-Streifen (flex-grow 0 bei allen) macht das Modul nichts.
 */
import { WECHSEL } from "../galerie-akkordeon"
import { animate, motionValue, type AnimationPlaybackControls, type MotionValue } from "motion"
import { SAETTIGUNG_OFFEN, SAETTIGUNG_ZU, WEG_TOKEN } from "./formen"
import { zaehle } from "./einmal"
import { prefersReducedMotion, readLength, readSpring, readToken } from "./tokens"

function initEinzeln(wurzel: HTMLElement): () => void {
  const streifen = [...wurzel.querySelectorAll<HTMLElement>(":scope > a")]
  if (streifen.length === 0) return () => {}
  const bilder = streifen.map((s) => s.querySelector<HTMLImageElement>("img"))
  const breiten: Array<MotionValue<number>> = streifen.map((s) => motionValue(parseFloat(getComputedStyle(s).flexGrow) || 0))
  const bewegungen: Array<AnimationPlaybackControls | undefined> = []
  const bildBewegungen: Array<AnimationPlaybackControls | undefined> = []
  const abmelden: Array<() => void> = []

  breiten.forEach((w, i) => {
    const aus = w.on("change", (v) => streifen[i].style.setProperty("flex-grow", String(v)))
    abmelden.push(aus)
  })

  // Akkordeon-Modus: nur ab der Breite, bei der die Streifen wachsen (schmal: feste Karten, flex-grow 0)
  const akkordeon = () => streifen.some((s) => parseFloat(getComputedStyle(s).flexGrow) > 0)
  const aktiv = () => Number(wurzel.dataset.aktiv ?? 0)
  const gewicht = () => readToken("--galerie-gewicht", wurzel)

  const bildZiel = (i: number, nach: number) => {
    const weg = readLength(WEG_TOKEN)
    const offen = i === nach
    return {
      transform: `translateX(${offen ? 0 : i < nach ? -weg : weg}px)`,
      filter: `saturate(${offen ? SAETTIGUNG_OFFEN : SAETTIGUNG_ZU})`,
    }
  }

  const ruhezustand = () => {
    if (!akkordeon()) {
      bilder.forEach((b) => {
        b?.style.removeProperty("transform")
        b?.style.removeProperty("filter")
      })
      return
    }
    const nach = aktiv()
    bilder.forEach((b, i) => {
      if (!b) return
      const z = bildZiel(i, nach)
      b.style.transform = z.transform
      b.style.filter = z.filter
    })
  }
  ruhezustand()

  const beiWechsel = () => {
    if (!akkordeon()) return ruhezustand()
    const nach = aktiv()
    const g = gewicht()
    const federBreite = readSpring("--motion-feder-akkordeon")
    streifen.forEach((s, i) => {
      const ziel = i === nach ? g : 1
      s.style.setProperty("flex-grow", String(breiten[i].get()))
      bewegungen[i] = animate(breiten[i], ziel, {
        type: "spring",
        ...federBreite,
        onComplete: () => s.style.removeProperty("flex-grow"),
      })
      const bild = bilder[i]
      if (bild) {
        bildBewegungen[i] = animate(bild, bildZiel(i, nach), {
          type: "spring",
          ...readSpring(i === nach ? "--motion-feder-akkordeon-bild-auf" : "--motion-feder-akkordeon-bild-zu"),
        })
      }
    })
  }

  wurzel.addEventListener(WECHSEL, beiWechsel)
  window.addEventListener("resize", ruhezustand)
  zaehle(2)
  abmelden.push(() => {
    wurzel.removeEventListener(WECHSEL, beiWechsel)
    window.removeEventListener("resize", ruhezustand)
    zaehle(-2)
  })

  return () => {
    abmelden.forEach((fn) => fn())
    bewegungen.forEach((b) => b?.stop())
    bildBewegungen.forEach((b) => b?.stop())
    streifen.forEach((s) => s.style.removeProperty("flex-grow"))
    bilder.forEach((b) => {
      b?.style.removeProperty("transform")
      b?.style.removeProperty("filter")
    })
  }
}

export function initAkkordeon(): () => void {
  if (prefersReducedMotion()) return () => {}
  const abmelden = [...document.querySelectorAll<HTMLElement>("[data-galerie-akkordeon]")].map(initEinzeln)
  return () => abmelden.forEach((fn) => fn())
}
