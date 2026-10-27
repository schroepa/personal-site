/**
 * Labels („→ 03 Arbeit“, Seitenkopf-Labels, Kontakt-Label, Hero-Kicker): Zeichen-Scramble wie eine Anzeigetafel
 * (--motion-schrift-scramble: 650 ms, endet im Originaltext) und Sperrung, die sich von 0.6em auf die Sperrung des
 * Textstils zusammenzieht (--motion-schrift-sperrung: 1200 ms, --motion-easing-standard).
 *
 * Läuft einmal, wenn das Label von unten in den Sichtbereich kommt (revealOnce); der Kicker im Hero steht beim Laden
 * im Sichtbereich und läuft sofort. Schon sichtbare oder übersprungene Labels stehen im Endzustand.
 *
 * Barrierefreiheit: Der zugängliche Text ändert sich nie. Während der Animation steht der echte Text (ohne die
 * aria-hidden-Pfeile) in einem visuell versteckten Knoten (.nur-vorlesen), die gescrambelte Fassung in einem
 * aria-hidden-Span. Danach kommen die ursprünglichen Knoten unverändert zurück. Zeilenumbruch ist während der
 * Animation aus (white-space: nowrap), damit die breite Sperrung das Layout darunter nicht verschiebt.
 */
import { animate } from "motion"
import { abbrechen, alle, animationErlaubt, fertig, fertigNach, revealOnce, unterhalb, zeigen } from "./einmal"
import { SCRAMBLE_TAKT_MS, SCRAMBLE_ZEICHEN, SPERRUNG_START } from "./formen"
import { msToSeconds } from "./parse.mjs"
import { readEasing, readToken } from "./tokens"

const BUCHSTABE_ODER_ZIFFER = /[\p{L}\p{N}]/u

const zufall = () => SCRAMBLE_ZEICHEN[Math.floor(Math.random() * SCRAMBLE_ZEICHEN.length)]

/** Text, den Hilfstechnik liest: alle Knoten außer den aria-hidden-Elementen (Pfeile). */
function zugaenglicherText(knoten: ChildNode[]): string {
  return knoten
    .filter((n) => !(n instanceof Element && n.getAttribute("aria-hidden") === "true"))
    .map((n) => n.textContent ?? "")
    .join("")
    .replace(/\s+/g, " ")
    .trim()
}

/** Scrambelt den Text bis `fortschritt` (0–1) von links aufgelöst ist; der Rest sind zufällige Zeichen. */
function scrambleText(ziel: string, fortschritt: number, wuerfel: string[]): string {
  const aufgeloest = Math.floor(ziel.length * fortschritt)
  let aus = ""
  for (let i = 0; i < ziel.length; i++) {
    aus += i < aufgeloest || !BUCHSTABE_ODER_ZIFFER.test(ziel[i]) ? ziel[i] : (wuerfel[i] ??= zufall())
  }
  return aus
}

/** Anteil der freien Breite, den die Sperrung höchstens füllt (Sicherheitsabstand für Zeichen, die breiter würfeln). */
const BREITE_SPIELRAUM = 0.9

/** Start-Sperrung in px: 0.6em, begrenzt auf das, was die Box hergibt. Mindestens die Sperrung des Textstils. */
function startSperrung(el: HTMLElement, deko: HTMLElement, zeichen: number, stil: CSSStyleDeclaration): number {
  const wunsch = parseFloat(SPERRUNG_START) * parseFloat(stil.fontSize)
  const normal = parseFloat(stil.letterSpacing) || 0
  const frei = el.clientWidth - parseFloat(stil.paddingLeft) - parseFloat(stil.paddingRight)
  const text = deko.getBoundingClientRect().width
  if (zeichen === 0 || !(frei > 0)) return normal
  const zusatz = (frei * BREITE_SPIELRAUM - text) / zeichen
  return Math.max(normal, Math.min(wunsch, normal + zusatz))
}

/** Lässt ein Label laufen. Gibt das Aufräumen zurück (Originalknoten zurück, Animationen stoppen). */
function laufen(el: HTMLElement): () => void {
  const scrambleDauer = msToSeconds(readToken("--motion-schrift-scramble"))
  const sperrDauer = msToSeconds(readToken("--motion-schrift-sperrung"))
  const ease = readEasing("--motion-easing-standard")
  const stil = getComputedStyle(el)
  const sperrEnde = stil.letterSpacing

  const original = [...el.childNodes]
  const sichtbarerText = (el.textContent ?? "").replace(/\s+/g, " ").trim()
  const lesen = document.createElement("span")
  lesen.className = "nur-vorlesen"
  lesen.textContent = zugaenglicherText(original)
  const deko = document.createElement("span")
  deko.setAttribute("aria-hidden", "true")
  deko.textContent = sichtbarerText

  const steuerungen: Array<ReturnType<typeof animate>> = []
  let wiederhergestellt = false
  const zurueck = () => {
    if (wiederhergestellt) return
    wiederhergestellt = true
    el.replaceChildren(...original)
  }

  try {
    el.replaceChildren(lesen, deko)
    el.style.whiteSpace = "nowrap"
    // Motion rechnet em und px nicht ineinander um (0.6em → 0.4px liefe von 0.6 px): Start in px umrechnen. Die Sperrung
    // wächst nur so weit, wie der Text in die Box passt: breiter würde das Label sein Gitter aufweiten und den Inhalt darunter
    // verschieben (schmale Breiten: schwächerer Effekt statt Layoutsprung).
    const sperrStart = `${startSperrung(el, deko, sichtbarerText.length, stil)}px`
    zeigen(el)
    const wuerfel: string[] = []
    let letzterWurf = -Infinity
    const scramble = animate(0, 1, {
      duration: scrambleDauer,
      ease: "linear",
      onUpdate: (p: number) => {
        const jetzt = performance.now()
        if (jetzt - letzterWurf >= SCRAMBLE_TAKT_MS) {
          letzterWurf = jetzt
          wuerfel.length = 0
        }
        deko.textContent = scrambleText(sichtbarerText, p, wuerfel)
      },
    })
    const sperrung = animate(
      el,
      { letterSpacing: [sperrStart, sperrEnde === "normal" ? "0px" : sperrEnde] },
      { duration: sperrDauer, ease }
    )
    steuerungen.push(scramble, sperrung)
    scramble.then(zurueck, zurueck)
    fertigNach(sperrung, el)
  } catch (fehler) {
    steuerungen.forEach(abbrechen)
    zurueck()
    fertig(el)
    throw fehler
  }

  return () => {
    steuerungen.forEach(abbrechen)
    zurueck()
    fertig(el)
  }
}

export function initLabels(): () => void {
  const labels = alle("[data-anim='label'], [data-anim='kicker']")
  if (labels.length === 0) return () => {}
  if (!animationErlaubt()) {
    fertig(...labels)
    return () => {}
  }
  const aufraeumen: Array<() => void> = []
  for (const el of labels) {
    // Hero-Kicker: steht beim Laden im Sichtbereich und läuft sofort; alle anderen nur von unten kommend
    if (el.dataset.anim === "kicker") {
      aufraeumen.push(laufen(el))
      continue
    }
    if (!unterhalb(el)) {
      fertig(el)
      continue
    }
    aufraeumen.push(
      revealOnce(el, (uebersprungen) => {
        if (uebersprungen || !animationErlaubt()) return fertig(el)
        aufraeumen.push(laufen(el))
      })
    )
  }
  return () => aufraeumen.forEach((fn) => fn())
}
