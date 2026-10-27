// Markdown zu HTML außerhalb der Content-Collection-Pipeline (für Abschnitte der Fallstudie, die einzeln gesetzt werden).
// Gleicher Prozessor und gleiche `markdown`-Einstellungen aus markdown.config.mjs wie bei Seiten, die Astro selbst rendert
// (Blog, einfache Projektseiten): Shiki, Überschriften-IDs und alle Plugins stimmen überein.
import { createMarkdownProcessor, type MarkdownProcessor } from "@astrojs/markdown-remark"
import { markdownConfig } from "../../markdown.config.mjs"

let prozessor: Promise<MarkdownProcessor> | undefined

export async function markdownZuHtml(markdown: string): Promise<string> {
  prozessor ??= createMarkdownProcessor((markdownConfig ?? {}) as Parameters<typeof createMarkdownProcessor>[0])
  return (await (await prozessor).render(markdown)).code
}
