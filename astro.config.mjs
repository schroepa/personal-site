// @ts-check

import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import { markdownConfig } from "./markdown.config.mjs"

export default defineConfig({
  site: 'https://www.ptrckschrdtr.de',
  output: 'static',
  markdown: markdownConfig,
  vite: {
    // Der Gradient-Generator wird ohne Astro-Insel hydriert (CSP, Task 16) und importiert react-dom/client direkt.
    // Ohne Vorab-Bündelung entdeckt der Dev-Server das erst beim ersten Aufruf, bündelt neu und lädt die Seite neu;
    // parallel laufende Tests bekommen dabei zwei React-Kopien und hydrieren nie.
    optimizeDeps: { include: ["react", "react-dom/client"] },
  },
  integrations: [
    react(),
    sitemap({
      // Rein interne Rendering-Hilfsseiten (noindex) — gehören nicht in die Sitemap
      filter: (page) =>
        !page.includes('/og-render/') &&
        !page.includes('/prototypes/'),
    }),
  ],
})
