/**
 * Magnet-Knöpfe (Knopf primary/ghost, data-magnet): der Knopf folgt dem Zeiger ein kleines Stück und schnappt
 * mit Nachwippen zurück. Physik aus den Tokens: --motion-physik-magnet-* (Steifigkeit 380 / Dämpfung 24 / Masse 0.6)
 * beim Folgen, --motion-physik-magnet-zurueck-* (260 / 11 / 0.6) beim Zurückschnappen.
 *
 * Nur bei pointer: fine und ohne reduzierte Bewegung (zeiger.ts, live). Nur transform: das Layout bleibt unberührt.
 * Der Zug ist ein Bruchteil des Zeigerabstands zur Knopfmitte (MAGNET_ZUG_X/Y) und auf 7 × 5 px begrenzt
 * (MAGNET_MAX_X/Y, Figma „max. 7 × 5 px“, siehe formen.ts): der Zeiger bleibt dadurch immer auf dem Knopf, das
 * Klickziel wandert nicht unter ihm weg. Tastaturfokus und Touch lösen nichts aus.
 */
import { animate, motionValue } from "motion"
import { alle, zaehle } from "./einmal"
import { MAGNET_MAX_X, MAGNET_MAX_Y, MAGNET_RUHE_PX, MAGNET_ZUG_X, MAGNET_ZUG_Y } from "./formen"
import { readPhysics } from "./tokens"
import { mitFeinemZeiger } from "./zeiger"

const begrenze = (v: number, max: number) => Math.max(-max, Math.min(max, v))

function anlegen(): () => void {
  const knoepfe = alle("[data-magnet]")
  if (knoepfe.length === 0) return () => {}
  const folgen = readPhysics("--motion-physik-magnet")
  const zurueck = readPhysics("--motion-physik-magnet-zurueck")
  const abmelden: Array<() => void> = []

  for (const knopf of knoepfe) {
    const x = motionValue(0)
    const y = motionValue(0)
    const schreiben = () => {
      knopf.style.transform = `translate(${x.get()}px, ${y.get()}px)`
    }
    const ruhe = () => {
      if (Math.abs(x.get()) < MAGNET_RUHE_PX && Math.abs(y.get()) < MAGNET_RUHE_PX) knopf.style.removeProperty("transform")
    }
    const offX = x.on("change", schreiben)
    const offY = y.on("change", schreiben)

    const beiBewegung = (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      // Mitte ohne den aktuellen Versatz (sonst folgt der Knopf seiner eigenen Verschiebung)
      const r = knopf.getBoundingClientRect()
      const mx = r.left + r.width / 2 - x.get()
      const my = r.top + r.height / 2 - y.get()
      const zielX = begrenze((e.clientX - mx) * MAGNET_ZUG_X, MAGNET_MAX_X)
      const zielY = begrenze((e.clientY - my) * MAGNET_ZUG_Y, MAGNET_MAX_Y)
      animate(x, zielX, { type: "spring", ...folgen })
      animate(y, zielY, { type: "spring", ...folgen })
    }
    const beiVerlassen = () => {
      animate(x, 0, { type: "spring", ...zurueck, onComplete: ruhe })
      animate(y, 0, { type: "spring", ...zurueck, onComplete: ruhe })
    }
    knopf.addEventListener("pointermove", beiBewegung)
    knopf.addEventListener("pointerleave", beiVerlassen)
    zaehle(2)
    abmelden.push(() => {
      knopf.removeEventListener("pointermove", beiBewegung)
      knopf.removeEventListener("pointerleave", beiVerlassen)
      zaehle(-2)
      offX()
      offY()
      x.stop()
      y.stop()
      knopf.style.removeProperty("transform")
    })
  }
  return () => abmelden.forEach((fn) => fn())
}

export function initMagnet(): () => void {
  return mitFeinemZeiger(anlegen)
}
