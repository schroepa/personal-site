// Markdown zu HTML außerhalb der Content-Collection-Pipeline (für Abschnitte der Fallstudie, die einzeln gesetzt werden).
// Nutzt denselben Prozessor wie Astro (@astrojs/markdown-remark) mit dessen Standardeinstellungen.
import { createMarkdownProcessor, type MarkdownProcessor } from "@astrojs/markdown-remark"

let prozessor: Promise<MarkdownProcessor> | undefined

export async function markdownZuHtml(markdown: string): Promise<string> {
  prozessor ??= createMarkdownProcessor()
  return (await (await prozessor).render(markdown)).code
}
