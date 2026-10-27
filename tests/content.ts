// Liest die Inhalte direkt aus src/content (eigene, einfache Frontmatter-Auswertung, unabhängig von der Seite).
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

export interface Eintrag {
  slug: string
  title: string
  date: string
  draft: boolean
  featured: boolean
  tags: string[]
}

export function lese(sammlung: "blog" | "projects"): Eintrag[] {
  const dir = join(process.cwd(), "src/content", sammlung)
  return readdirSync(dir)
    .filter((n) => n.endsWith(".md"))
    .map((n) => {
      const kopf = readFileSync(join(dir, n), "utf8").split("---")[1]
      const feld = (k: string) => kopf.match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1].trim().replace(/^"|"$/g, "").replace(/\\"/g, '"')
      return {
        slug: n.replace(/\.md$/, ""),
        title: feld("title") ?? "",
        date: feld("date") ?? "",
        draft: feld("draft") === "true",
        featured: feld("featured") === "true",
        tags: [...(feld("tags") ?? "").matchAll(/"([^"]+)"/g)].map((m) => m[1]),
      }
    })
}

const neuesteZuerst = (a: Eintrag, b: Eintrag) => b.date.localeCompare(a.date) || (a.slug < b.slug ? 1 : -1)

export const erwarteteProjekte = (anzahl: number) =>
  lese("projects").filter((p) => p.featured).sort(neuesteZuerst).slice(0, anzahl).map((p) => p.slug)

export const erwarteteGedanken = () =>
  lese("blog").filter((b) => !b.draft).sort(neuesteZuerst).slice(0, 3).map((b) => b.slug)

export const entwuerfe = () => lese("blog").filter((b) => b.draft).map((b) => b.slug)

/** Veröffentlichte Blogbeiträge, jüngste zuerst (wie die Seite sortiert). */
export const veroeffentlichteBeitraege = () => lese("blog").filter((b) => !b.draft).sort(neuesteZuerst)

export const jahrVon = (b: Eintrag) => Number(b.date.slice(0, 4))
