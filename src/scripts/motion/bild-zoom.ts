/**
 * Bild-Zoom bei Hover über Karten und Zeilen ([data-bild-zoom]): Dauer --motion-objekt-bild-zoom (1200 ms) und
 * --motion-easing-standard stehen als CSS-Übergang in neu-bewegung.css. Der Zoom-Faktor hat kein Token (Figma:
 * „leichter Zoom“, Prototyp v14: 1.03, siehe formen.ts BILD_ZOOM_FAKTOR) und kommt deshalb aus diesem Modul als
 * Custom Property --bild-zoom-faktor am Dokument. Nur bei pointer: fine und ohne reduzierte Bewegung (zeiger.ts):
 * sonst ist die Property nicht gesetzt, das CSS zoomt nicht. Keine Bild-Reveals.
 */
import { BILD_ZOOM_FAKTOR } from "./formen"
import { mitFeinemZeiger } from "./zeiger"

export function initBildZoom(): () => void {
  return mitFeinemZeiger(() => {
    document.documentElement.style.setProperty("--bild-zoom-faktor", String(BILD_ZOOM_FAKTOR))
    return () => document.documentElement.style.removeProperty("--bild-zoom-faktor")
  })
}
