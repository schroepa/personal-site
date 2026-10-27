import { test } from "node:test"
import assert from "node:assert/strict"
import { buildInitScript, buildPdfOptions } from "./cv-pdf-options.mjs"

test("buildPdfOptions: A4, Hintergründe, Ränder aus dem Skript (@page kann keine Tokens)", () => {
  const o = buildPdfOptions()
  assert.equal(o.format, "A4")
  assert.equal(o.printBackground, true)
  // @page deklariert nur size: A4; Format und Ränder bestimmt Playwright, deshalb nicht preferCSSPageSize
  assert.equal(o.preferCSSPageSize, false)
  for (const seite of ["top", "right", "bottom", "left"]) assert.match(o.margin[seite], /^\d+mm$/, seite)
})

test("buildInitScript: erzwingt das helle Theme vor dem ersten Paint und ist gültiges JavaScript", () => {
  const s = buildInitScript()
  assert.match(s, /localStorage\.setItem\(["']theme["'],\s*["']light["']\)/)
  assert.doesNotThrow(() => new Function(s))
  // Ausführung gegen ein Fake-Fenster setzt wirklich light
  const store = {}
  new Function("localStorage", s)({ setItem: (k, v) => (store[k] = v) })
  assert.equal(store.theme, "light")
})
