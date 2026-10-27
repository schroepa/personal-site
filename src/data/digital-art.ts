// Kapitel des Digital-Art-Akkordeons: eine Quelle für Startseite und Projekt-Übersicht.
// TODO: Platzhalterkapitel mit vorhandenen Bildern; echte Kapitel, Titel und Ziele (statt /projects/digital-art) stehen bei Patrick aus.
import type { Kapitel } from "../lib/galerie-akkordeon.ts"

export const DIGITAL_ART_KAPITEL: Kapitel[] = [
  { titel: "Digital Art – Lettering, Graffiti, Tags & Styles", bild: "/images/gallery/digital-graffiti/IMG_0094.webp" },
  { titel: "Lettering", bild: "/images/gallery/digital-graffiti/IMG_0128.webp" },
  { titel: "Skizzen", bild: "/images/gallery/digital-graffiti/IMG_0132.webp" },
  { titel: "Mode", bild: "/images/gallery/digital-graffiti/IMG_0133.webp" },
  { titel: "Archiv", bild: "/images/gallery/digital-graffiti/IMG_0138.webp" },
].map((k) => ({ ...k, href: "/projects/digital-art" }))
