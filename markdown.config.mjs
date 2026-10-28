// Gemeinsame Markdown-Einstellungen (Shiki, Plugins): astro.config.mjs reicht sie an Astro weiter,
// src/lib/markdown.ts an den eigenen Prozessor für die Fallstudie. Hier ändern, dann gelten sie überall.
/** @type {import("astro").AstroUserConfig["markdown"]} */
import { rehypeBilder } from "./src/lib/rehype-bilder.mjs"

export const markdownConfig = { rehypePlugins: [rehypeBilder] }
