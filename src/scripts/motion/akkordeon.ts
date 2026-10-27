/**
 * Galerie-Akkordeon: Streifen wechseln mit Feder statt Sprung. Aufbauend auf dem Zustand aus
 * galerie-akkordeon.ts (aria-current, Ereignis galerie-akkordeon:wechsel) und dem Fenster-Entwurf aus dem CSS:
 * das Bild behält immer die Breite des offenen Streifens (--galerie-offen), der Streifen gibt nur mehr oder
 * weniger davon frei.
 *
 * Das CSS besitzt den Ruhezustand (Breite, Graustufe, seitlicher Versatz des geschlossenen Bildes, siehe
 * GalerieAkkordeon.astro und neu-bewegung.css). Dieses Modul schreibt im Ruhezustand NICHTS inline: beim Init
 * gibt es deshalb keinen Sprung. Es animiert nur den Weg vom alten zum neuen CSS-Zustand und räumt danach auf.
 *
 * - Breiten: flex-grow der Streifen, Feder --motion-feder-akkordeon-* (750 ms / 0.08).
 * - Öffnendes Bild: --motion-feder-akkordeon-bild-auf-* (1000 ms / 0.1), gleitet zur Mitte, Graustufe → 0.
 * - Schließendes Bild: --motion-feder-akkordeon-bild-zu-* (800 ms / 0), wandert seitlich, Graustufe → CSS-Wert.
 * Alle Start- und Zielwerte werden aus dem berechneten Stil gelesen, nie aus Zahlen im Code.
 * Nach einem Resize (auch über den Umbruch bei 768 px) werden die gemerkten Ruhewerte neu gelesen.
 * Reduzierte Bewegung und ohne JS: kein Aufruf der Bibliothek, das CSS schaltet sofort um (Task 5).
 * Im schmalen Wisch-Streifen (flex-grow 0 bei allen) macht das Modul nichts.
 */
import { WECHSEL } from "../galerie-akkordeon"
import { animate, motionValue, type AnimationPlaybackControls } from "motion"
import { zaehle } from "./einmal"
import { prefersReducedMotion, readSpring, readToken } from "./tokens"

interface Bildwert {
  /** Graustufe 0–1 (filter: grayscale) */
  grau: number
  /** seitlicher Versatz in px (transform: translateX) */
  x: number
}

interface Lauf {
  steuerung: AnimationPlaybackControls
  jetzt: Bildwert
}

/** Liest Graustufe und Versatz aus dem berechneten Stil (ohne Inline-Werte: der CSS-Zustand). */
function liesBild(b: HTMLElement): Bildwert {
  const stil = getComputedStyle(b)
  const g = /grayscale\(\s*([\d.]+)(%?)\s*\)/.exec(stil.filter)
  const grau = g ? parseFloat(g[1]) / (g[2] ? 100 : 1) : 0
  const x = stil.transform === "none" ? 0 : new DOMMatrix(stil.transform).m41
  return { grau, x }
}

const begrenze = (v: number) => Math.min(1, Math.max(0, v))

function initEinzeln(wurzel: HTMLElement): () => void {
  const streifen = [...wurzel.querySelectorAll<HTMLElement>(":scope > a")]
  if (streifen.length === 0) return () => {}
  const bilder = streifen.map((s) => s.querySelector<HTMLImageElement>("img"))

  // Gemerkte Ruhewerte (CSS-Zustand) und laufende Bewegungen je Streifen
  const ruheBreite: number[] = []
  const ruheBild: Array<Bildwert | undefined> = []
  const breiteLauf: Array<{ steuerung: AnimationPlaybackControls; jetzt: number } | undefined> = []
  const bildLauf: Array<Lauf | undefined> = []
  let veraltet = false
  let rafId = 0

  const wachstum = (s: HTMLElement) => parseFloat(getComputedStyle(s).flexGrow) || 0
  /** Akkordeon-Modus: nur ab der Breite, bei der die Streifen wachsen (schmal: feste Karten, flex-grow 0) */
  const akkordeon = () => streifen.some((s) => wachstum(s) > 0)
  const laeuft = () => breiteLauf.some(Boolean) || bildLauf.some(Boolean)

  /** Ruhewerte neu lesen: beim Init und nach jedem Resize (ein Breitenwechsel ändert den CSS-Zustand). */
  const lesen = () => {
    veraltet = false
    streifen.forEach((s, i) => {
      ruheBreite[i] = wachstum(s)
      const b = bilder[i]
      ruheBild[i] = b ? liesBild(b) : undefined
    })
  }
  lesen()

  const beiResize = () => {
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      // Während einer Bewegung stehen Inline-Werte: nach deren Ende neu lesen
      if (laeuft()) veraltet = true
      else lesen()
    })
  }

  const fertigGelaufen = () => {
    if (!laeuft() && veraltet) lesen()
  }

  const anwenden = (b: HTMLElement, w: Bildwert) => {
    b.style.filter = `grayscale(${begrenze(w.grau)})`
    b.style.transform = `translateX(${w.x}px)`
  }

  const aufraeumenBild = (b: HTMLElement | null) => {
    b?.style.removeProperty("filter")
    b?.style.removeProperty("transform")
  }

  const aktiv = () => Number(wurzel.dataset.aktiv ?? 0)
  const gewicht = () => readToken("--galerie-gewicht", wurzel)

  const beiWechsel = () => {
    if (!akkordeon()) {
      streifen.forEach((s) => s.style.removeProperty("flex-grow"))
      bilder.forEach(aufraeumenBild)
      return
    }
    const nach = aktiv()
    const g = gewicht()
    const federBreite = readSpring("--motion-feder-akkordeon")
    streifen.forEach((s, i) => {
      // Breite: Start = laufender Wert oder gemerkter Ruhewert, Ziel = Wert des neuen CSS-Zustands
      const von = breiteLauf[i]?.jetzt ?? ruheBreite[i]
      breiteLauf[i]?.steuerung.stop()
      const ziel = i === nach ? g : 1
      const mv = motionValue(von)
      const eintrag = { steuerung: undefined as unknown as AnimationPlaybackControls, jetzt: von }
      mv.on("change", (v) => {
        eintrag.jetzt = v
        s.style.setProperty("flex-grow", String(v))
      })
      s.style.setProperty("flex-grow", String(von))
      eintrag.steuerung = animate(mv, ziel, {
        type: "spring",
        ...federBreite,
        onComplete: () => {
          s.style.removeProperty("flex-grow")
          breiteLauf[i] = undefined
          ruheBreite[i] = wachstum(s)
          fertigGelaufen()
        },
      })
      breiteLauf[i] = eintrag

      // Bild: das CSS hat schon umgeschaltet; Zielwert lesen, dann vom alten Wert dorthin gleiten
      const bild = bilder[i]
      if (!bild) return
      const vonBild = bildLauf[i]?.jetzt ?? ruheBild[i] ?? liesBild(bild)
      bildLauf[i]?.steuerung.stop()
      aufraeumenBild(bild)
      const zielBild = liesBild(bild)
      anwenden(bild, vonBild)
      const p = motionValue(0)
      const lauf: Lauf = { steuerung: undefined as unknown as AnimationPlaybackControls, jetzt: vonBild }
      p.on("change", (t) => {
        lauf.jetzt = { grau: vonBild.grau + (zielBild.grau - vonBild.grau) * t, x: vonBild.x + (zielBild.x - vonBild.x) * t }
        anwenden(bild, lauf.jetzt)
      })
      lauf.steuerung = animate(p, 1, {
        type: "spring",
        ...readSpring(i === nach ? "--motion-feder-akkordeon-bild-auf" : "--motion-feder-akkordeon-bild-zu"),
        onComplete: () => {
          aufraeumenBild(bild)
          bildLauf[i] = undefined
          ruheBild[i] = liesBild(bild)
          fertigGelaufen()
        },
      })
      bildLauf[i] = lauf
    })
  }

  wurzel.addEventListener(WECHSEL, beiWechsel)
  window.addEventListener("resize", beiResize)
  zaehle(2)

  return () => {
    wurzel.removeEventListener(WECHSEL, beiWechsel)
    window.removeEventListener("resize", beiResize)
    cancelAnimationFrame(rafId)
    zaehle(-2)
    breiteLauf.forEach((b) => b?.steuerung.stop())
    bildLauf.forEach((b) => b?.steuerung.stop())
    streifen.forEach((s) => s.style.removeProperty("flex-grow"))
    bilder.forEach(aufraeumenBild)
  }
}

export function initAkkordeon(): () => void {
  if (prefersReducedMotion()) return () => {}
  const abmelden = [...document.querySelectorAll<HTMLElement>("[data-galerie-akkordeon]")].map(initEinzeln)
  return () => abmelden.forEach((fn) => fn())
}
