// Inhalte der Seite /about („Über mich“), Text aus Figma 269:2 (Desktop 269:524). Hier bearbeiten.
import type { ListenEintrag } from "./liste.ts"

export const UEBER_MICH = {
  label: "Über mich",
  titel: "Design Engineer aus Berlin.",
  einleitung:
    "Seit über 15 Jahren an der Schnittstelle von Design und Engineering. Als ehemaliger Systemadministrator denke ich Interfaces von der technischen Machbarkeit her.",
}

export const HALTUNG: string[] = [
  "Ich bin kein Pixel-Schieber. Ich baue Werkzeuge, Systeme und Produkte. Ich liebe die Geschwindigkeit von Startups und verstehe Design als Prozess der Optimierung, technologisch wie visuell.",
  "Als Designer in Founding-Teams bringe ich die Erfahrung mit, um Strukturen zu schaffen, und die Leidenschaft, um selbst im Code mit anzupacken.",
]

export const KOMPETENZEN: ListenEintrag[] = [
  {
    nummer: "01",
    titel: "Design & Strategy",
    beschreibung: "Product Design Lead, UI/UX, Rapid Prototyping, Brand Evolution, User Research.",
  },
  {
    nummer: "02",
    titel: "Design Systems",
    beschreibung: "Modulare Systeme als Single Source of Truth. shadcn/ui und Tailwind CSS in Produktion.",
  },
  {
    nummer: "03",
    titel: "AI & Automation",
    beschreibung: "Claude- und Gemini-CLI, n8n-Automatisierung, Prompt Engineering für UI-Entwicklung.",
  },
  {
    nummer: "04",
    titel: "Tech Stack",
    beschreibung: "Figma (Expert), Git, HTML/CSS/JS, Proxmox, Docker, Laravel (Background).",
  },
]

// „nummer“ ist hier der Zeitraum (Meta-Spalte der Liste)
export const STATIONEN: ListenEintrag[] = [
  {
    nummer: "2025 – heute",
    titel: "Product Design Lead",
    beschreibung:
      "Freelance für SWT Stadtwerke Trier und Sander Gruppe, Berlin / Remote. Solar-Beratungstool, Figma-basiertes Slide-System, Corporate-Website auf Astro.",
  },
  {
    nummer: "2022 – 2025",
    titel: "UX/UI Designer (Lead)",
    beschreibung: "A Eins Digital Innovation, Wittlich. Portazon, die erste deutschsprachige Super-App.",
  },
  {
    nummer: "2019 – 2022",
    titel: "UX/UI Designer",
    beschreibung: "Oetker Digital, Berlin. Im Engineering-Team, um die Lücke zwischen Design und Code zu schließen.",
  },
  {
    nummer: "2012 – 2019",
    titel: "Senior UI/UX Designer (Lead)",
    beschreibung: "DefShop, Berlin. Drei Redesigns der E-Commerce-Plattform, zwei native Apps.",
  },
]

// „nummer“ ist hier die Kategorie (Meta-Spalte), „titel“ die Aufzählung der Werkzeuge
export const WERKZEUGE: ListenEintrag[] = [
  { nummer: "Design", titel: "Figma Expert, Adobe Creative Suite, Affinity" },
  { nummer: "Code", titel: "HTML/CSS/JS, Tailwind CSS, shadcn/ui, React, Git, Astro" },
  { nummer: "AI und Ops", titel: "Claude CLI, Gemini CLI, n8n, Docker, Directus, Shopify, WordPress" },
  { nummer: "Methodik", titel: "Agile/Scrum, Lean Startup, 0-to-1 Product Ownership" },
]
