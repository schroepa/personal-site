/**
 * „Screens“ durchstreichen, „Systeme.“ erscheint (Prototyp v14, Figma schrift/streichen, ersatz, ersatz-verzoegerung).
 *
 * Barrierefreiheit: Die h1 trägt im Dokument nur den Endtext („Ich entwerfe Systeme. …“). „Screens“ gibt es
 * nicht im HTML, sondern nur als aria-hidden-Dekoration, die dieses Modul einfügt. Ohne JavaScript, bei
 * reduzierter Bewegung und bei Zurück/Vor erscheint „Screens“ gar nicht.
 *
 * Ablauf (alle Zeiten aus Tokens): „Screens“ steigt mit den anderen Hero-Wörtern ein, nach
 * --motion-schrift-ersatz-verzoegerung (1500 ms) zieht sich ein Strich darüber (--motion-schrift-streichen, 500 ms),
 * danach blenden „Screens“ nach oben aus und „Systeme.“ von unten ein (--motion-schrift-ersatz, 800 ms).
 * „Systeme.“ steht von Anfang an im Textfluss (unsichtbar) und reserviert den Platz, „Screens“ liegt darüber:
 * so verschiebt sich nichts (der Prototyp klappt die Breite zusammen und umbricht mobil kurz).
 *
 * Sauberes DOM: Tokens werden vor jeder DOM-Änderung gelesen; die Dekoration „Screens“ kommt erst unmittelbar
 * vor dem Start der Animationen ins Dokument. Wirft ein Schritt danach, wird sie wieder entfernt und nur der
 * Endtext („Systeme.“) bleibt (und der Fehler geht an initMotion). Das Teardown räumt genauso auf.
 */
import { animate } from "motion"
import { abbrechen, animationErlaubt, fertig } from "./einmal"
import { WEG_TOKEN } from "./formen"
import { msToSeconds } from "./parse.mjs"
import { readEasing, readLength, readToken } from "./tokens"

export function initDurchstreichen(): () => void {
  const ersatz = document.querySelector<HTMLElement>("[data-ersatz]")
  const neu = ersatz?.querySelector<HTMLElement>("[data-neu]")
  if (!ersatz || !neu) return () => {}
  const altText = ersatz.dataset.alt ?? ""
  if (!animationErlaubt() || altText === "") {
    fertig(neu)
    return () => {}
  }

  const verzoegerung = msToSeconds(readToken("--motion-schrift-ersatz-verzoegerung"))
  const streichen = msToSeconds(readToken("--motion-schrift-streichen"))
  const dauer = msToSeconds(readToken("--motion-schrift-ersatz"))
  const ease = readEasing("--motion-easing-standard")
  const weg = readLength(WEG_TOKEN)

  // Außen: Hero-Wort (steigt mit den anderen ein). Innen: das, was später ausblendet. Getrennt, damit sich
  // beide Animationen nicht in die Quere kommen.
  const alt = document.createElement("span")
  alt.className = "alt"
  alt.setAttribute("aria-hidden", "true")
  alt.setAttribute("data-anim", "wort")
  const inhalt = document.createElement("span")
  inhalt.className = "alt-inhalt"
  inhalt.textContent = altText
  const strich = document.createElement("span")
  strich.className = "strich"
  inhalt.append(strich)
  alt.append(inhalt)

  const ende = verzoegerung + streichen
  const steuerungen: Array<ReturnType<typeof animate>> = []
  const aufraeumen = () => {
    steuerungen.splice(0).forEach(abbrechen)
    alt.remove()
    fertig(neu)
  }
  try {
    // Erst jetzt ins Dokument: unmittelbar vor dem Start
    ersatz.prepend(alt)
    steuerungen.push(
      animate(strich, { transform: ["scaleX(0)", "scaleX(1)"] }, { duration: streichen, ease, delay: verzoegerung }),
      animate(
        inhalt,
        { opacity: [1, 0], transform: ["translateY(0px)", `translateY(${-weg}px)`] },
        { duration: dauer, ease, delay: ende }
      ),
      animate(
        neu,
        { opacity: [0, 1], transform: [`translateY(${weg}px)`, "translateY(0px)"] },
        { duration: dauer, ease, delay: ende }
      )
    )
  } catch (fehler) {
    aufraeumen()
    throw fehler
  }
  steuerungen[2].then(
    () =>
      requestAnimationFrame(() => {
        alt.remove()
        fertig(neu)
      }),
    () => {
      alt.remove()
      fertig(neu)
    }
  )

  return aufraeumen
}
