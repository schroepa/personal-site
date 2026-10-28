import { test } from "node:test"
import assert from "node:assert/strict"
import { markdownConfig } from "../markdown.config.mjs"
import { createMarkdownProcessor } from "@astrojs/markdown-remark"

test("Markdown-Bilder bekommen loading=lazy, decoding=async und width/height aus der Datei", async () => {
  const p = await createMarkdownProcessor(markdownConfig)
  const { code } = await p.render("![Board](/images/gallery/proman/proman-board.jpg)\n\n![extern](https://example.com/x.png)")
  const lokal = code.match(/<img[^>]*proman-board[^>]*>/)[0]
  assert.match(lokal, /loading="lazy"/)
  assert.match(lokal, /decoding="async"/)
  assert.match(lokal, /width="\d+"/)
  assert.match(lokal, /height="\d+"/)
  const extern = code.match(/<img[^>]*example\.com[^>]*>/)[0]
  assert.match(extern, /loading="lazy"/)
  assert.doesNotMatch(extern, /width=/)
})

test("Randfälle: kaputte %-Kodierung, Verzeichnis, Pfad aus public/ heraus, fehlende Datei, Bild mit eigenen Maßen", async () => {
  const p = await createMarkdownProcessor(markdownConfig)
  const bild = async (md) => (await p.render(md)).code.match(/<img[^>]*>/)[0]
  const kaputt = await bild("![x](/images/%E0%A4%A.jpg)")
  assert.match(kaputt, /loading="lazy"/)
  assert.doesNotMatch(kaputt, /width=/)
  const verzeichnis = await bild("![x](/images/gallery)")
  assert.doesNotMatch(verzeichnis, /width=/)
  const heraus = await bild("![x](/images/../../package.json)")
  assert.doesNotMatch(heraus, /width=/)
  const fehlt = await bild("![x](/images/gibt-es-nicht.jpg)")
  assert.doesNotMatch(fehlt, /width=/)
  const textDatei = await bild("![x](/robots.txt)")
  assert.doesNotMatch(textDatei, /width=/)
  const eigene = (await p.render('<img src="/images/gallery/proman/proman-board.jpg" width="10" height="5" loading="eager">')).code
  assert.match(eigene, /width="10"/)
  assert.match(eigene, /loading="eager"/)
})
