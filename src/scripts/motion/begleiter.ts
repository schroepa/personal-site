/**
 * „Ansehen“-Begleiter: ein Label, das dem Zeiger über Projektkarten ([data-begleiter]) folgt. Physik aus den Tokens
 * --motion-physik-begleiter-* (Steifigkeit 520 / Dämpfung 40 / Masse 0.7). Ein-/Ausblenden per CSS-Übergang
 * (--motion-dauer-sofort, --motion-easing-blenden, siehe neu-bewegung.css).
 *
 * Reine Dekoration (aria-hidden, pointer-events: none), nur bei pointer: fine und ohne reduzierte Bewegung (zeiger.ts,
 * live). Bei Tastaturfokus in der Karte (:focus-visible) bleibt er aus: der Link der Karte ist das echte Bedienelement;
 * er kommt erst wieder, wenn der Zeiger sich in der Karte bewegt. Das Element entsteht im Dokument erst mit dem
 * Aufbau und verschwindet mit dem Teardown vollständig.
 * Erste Position: sofort beim Zeiger (Prototyp v14), erst danach folgt die Feder.
 */
import { animate, motionValue } from "motion"
import { alle, zaehle } from "./einmal"
import { readPhysics } from "./tokens"
import { mitFeinemZeiger } from "./zeiger"

const TEXT = "Ansehen"

function anlegen(): () => void {
  const karten = alle("[data-begleiter]")
  if (karten.length === 0) return () => {}
  const physik = readPhysics("--motion-physik-begleiter")
  const el = document.createElement("div")
  el.className = "begleiter text-label"
  el.setAttribute("aria-hidden", "true")
  el.setAttribute("data-begleiter-folgt", "")
  el.textContent = TEXT
  document.body.append(el)

  const x = motionValue(0)
  const y = motionValue(0)
  const schreiben = () => {
    el.style.transform = `translate(${x.get()}px, ${y.get()}px)`
  }
  const offX = x.on("change", schreiben)
  const offY = y.on("change", schreiben)

  let sichtbar = false
  let tastatur = false
  const zeigen = (e: PointerEvent) => {
    if (sichtbar || tastatur) return
    sichtbar = true
    x.jump(e.clientX)
    y.jump(e.clientY)
    el.setAttribute("data-an", "")
  }
  const verstecken = () => {
    sichtbar = false
    el.removeAttribute("data-an")
  }

  const abmelden: Array<() => void> = []
  for (const karte of karten) {
    const beiEintritt = (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      zeigen(e)
    }
    const beiBewegung = (e: PointerEvent) => {
      if (e.pointerType === "touch") return
      // Mausbewegung in der Karte beendet den Tastaturmodus
      tastatur = false
      zeigen(e)
      animate(x, e.clientX, { type: "spring", ...physik })
      animate(y, e.clientY, { type: "spring", ...physik })
    }
    const beiFokus = (e: FocusEvent) => {
      if ((e.target as Element).matches(":focus-visible")) {
        tastatur = true
        verstecken()
      }
    }
    karte.addEventListener("pointerenter", beiEintritt)
    karte.addEventListener("pointermove", beiBewegung)
    karte.addEventListener("pointerleave", verstecken)
    karte.addEventListener("focusin", beiFokus)
    zaehle(4)
    abmelden.push(() => {
      karte.removeEventListener("pointerenter", beiEintritt)
      karte.removeEventListener("pointermove", beiBewegung)
      karte.removeEventListener("pointerleave", verstecken)
      karte.removeEventListener("focusin", beiFokus)
      zaehle(-4)
    })
  }

  return () => {
    abmelden.forEach((fn) => fn())
    offX()
    offY()
    x.stop()
    y.stop()
    el.remove()
  }
}

export function initBegleiter(): () => void {
  return mitFeinemZeiger(anlegen)
}
