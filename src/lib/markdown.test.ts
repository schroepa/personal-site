import { test } from "node:test"
import assert from "node:assert/strict"
import { markdownZuHtml } from "./markdown.ts"

test("markdownZuHtml: Absatz, Zwischentitel mit ID, Link", async () => {
  const html = await markdownZuHtml("### Größe & Ziel\n\nText mit [Link](/x).\n")
  assert.match(html, /<h3 id="größe--ziel">Größe &#x26; Ziel<\/h3>/)
  assert.match(html, /<a href="\/x">Link<\/a>/)
})

test("markdownZuHtml: Codeblock wird wie bei Astro mit Shiki gesetzt", async () => {
  const html = await markdownZuHtml("```css\n:root { --a: 1; }\n```\n")
  assert.match(html, /<pre class="astro-code/)
  assert.match(html, /--a/)
})

test("markdownZuHtml: Bild mit Titel behält den Titel (Meta für Einblicke)", async () => {
  const html = await markdownZuHtml('![Alt](/a.jpg "Generator")\n')
  assert.match(html, /<img src="\/a\.jpg" alt="Alt" title="Generator">/)
})
