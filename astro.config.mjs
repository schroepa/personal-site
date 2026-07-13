// @ts-check

import { defineConfig } from "astro/config"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"

export default defineConfig({
  site: 'https://www.ptrckschrdtr.de',
  output: 'static',
  integrations: [
    react(),
    sitemap({
      // Rein interne Rendering-Hilfsseiten (noindex) — gehören nicht in die Sitemap
      filter: (page) =>
        !page.includes('/og-render/') &&
        !page.includes('/prototypes/') &&
        !/\/cv\/?$/.test(new URL(page).pathname),
    }),
  ],
})
