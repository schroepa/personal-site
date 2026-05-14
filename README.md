# ptrckschrdtr.de — persönliche Website

Statische Site von Patrick Schröder: Portfolio, Blog und kleine Tools. Gebaut mit **Astro 5**, **React 19**, **TypeScript**, **Tailwind CSS 4** und **shadcn/ui**.

## Voraussetzungen

- Node.js (LTS empfohlen)
- npm

## Lokale Entwicklung

```bash
npm install
npm run dev
```

Der Dev-Server startet unter der URL, die Astro in der Konsole ausgibt (üblicherweise `http://localhost:4321`).

## Scripts

| Befehl | Beschreibung |
|--------|----------------|
| `npm run dev` | Entwicklungsserver mit Hot Reload |
| `npm run build` | Produktions-Build nach `dist/` |
| `npm run preview` | Lokales Preview des Builds |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (TS, TSX, Astro) |
| `npm run typecheck` | `astro check` + TypeScript (`@astrojs/check` muss installiert sein) |

## Build dauert sehr lange oder bleibt bei „Building static entrypoints“ stehen

Typische Ursachen und was hier aktiv gemacht wird:

1. **Radix:** Das Meta-Paket `radix-ui` zieht beim Import **alle** Radix-Primitives in den Bundler. Die UI unter `src/components/ui/` nutzt deshalb nur noch gezielte **`@radix-ui/react-…`**-Pakete.

2. **Tailwind über PostCSS:** Statt `@tailwindcss/vite` läuft Tailwind 4 über **`@tailwindcss/postcss`** (`postcss.config.mjs`). Der Vite-Plugin-Pfad kann bei Astro in der Phase „Building static entrypoints“ hängen bleiben oder extrem langsam sein; PostCSS wird in der CSS-Pipeline verarbeitet und ist dafür oft stabiler.

Caches leeren und neu bauen:

```bash
rm -rf dist .astro node_modules/.vite && npm install && npm run build
```

## Inhalt

- **Blog:** Markdown unter `src/content/blog/` (Frontmatter siehe `src/content/config.ts`, Feld `draft: true` blendet Beiträge aus der öffentlichen Liste aus).
- **Projekte:** Markdown unter `src/content/projects/` (u. a. `featured` für die Startseite).

Routen entstehen aus den Dateinamen (ohne `.md`): z. B. `mein-beitrag.md` → `/blog/mein-beitrag`.

## Deployment

Die Site ist als **statischer Export** konfiguriert (`output: 'static'` in `astro.config.mjs`). `npm run build` erzeugt deploybare Dateien in `dist/`. Die kanonische Domain ist in der Astro-Config als `site` gesetzt.

## UI-Komponenten (shadcn)

Neue shadcn-Komponenten z. B. so hinzufügen:

```bash
npx shadcn@latest add button
```

Komponenten landen unter `src/components/ui/`.

## Projektstruktur (Kurz)

- `src/pages/` — Routen und dynamische Segmente (`blog/[slug].astro`, `projects/[slug].astro`)
- `src/layouts/` — `BaseLayout`, `PostLayout`, …
- `src/styles/` — globale CSS-Layer, Typo, Prose, Animationen
- `src/components/` — Astro- und React-Komponenten
