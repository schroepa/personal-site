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
