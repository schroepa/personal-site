/**
 * Startet den Gradient-Generator auf dem vom Server gerenderten HTML (hydrateRoot), ohne Astro-Insel.
 * Grund: Eine Insel (client:load) bringt zwei Inline-Skripte von Astro mit (Insel-Laufzeit und Ladeanweisung).
 * Astro 5.18 könnte sie über `experimental.csp` per Hash freigeben (CSP als <meta>, Hashes je Build). Wir haben uns
 * stattdessen für null Inline-Skripte entschieden: strenger (kein Hash, der zur Astro-Version passen muss) und
 * unabhängig von einem experimentellen Feature; die CSP kommt als Header aus vercel.json.
 * Der Server rendert mit demselben identifierPrefix (GRADIENT_GENERATOR_ID_PRAEFIX), damit useId-Werte passen.
 * Läuft nach jedem Seitenwechsel des Client-Routers erneut und hängt sich vor dem Tausch wieder ab.
 */
import "./react-dev-vorlauf"
import { createElement } from "react"
import { hydrateRoot, type Root } from "react-dom/client"
import GradientGenerator from "@/components/GradientGenerator"
import { GRADIENT_GENERATOR_ID_PRAEFIX } from "./gradient-generator-praefix"

let wurzel: Root | null = null

function starten(): void {
  const ziel = document.querySelector<HTMLElement>("[data-gradient-generator-wurzel]")
  if (!ziel || wurzel) return
  wurzel = hydrateRoot(ziel, createElement(GradientGenerator), { identifierPrefix: GRADIENT_GENERATOR_ID_PRAEFIX })
}

function anhalten(): void {
  wurzel?.unmount()
  wurzel = null
}

export function initGradientGenerator(): void {
  starten()
  document.addEventListener("astro:page-load", starten)
  document.addEventListener("astro:before-swap", anhalten)
}
