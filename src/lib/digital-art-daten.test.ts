import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { DIGITAL_ART_KAPITEL } from "../data/digital-art.ts"
import { assertKapitel } from "./galerie-akkordeon.ts"

test("Digital-Art-Kapitel: gültig für das Akkordeon (1 bis 5)", () => {
  assert.doesNotThrow(() => assertKapitel(DIGITAL_ART_KAPITEL))
})

test("Digital-Art-Kapitel: Titel, Ziel mit Schrägstrich und vorhandene Bilder", () => {
  for (const k of DIGITAL_ART_KAPITEL) {
    assert.ok(k.titel.length > 0)
    assert.ok(k.href.startsWith("/"))
    assert.ok(existsSync(join(process.cwd(), "public", k.bild)), `Bild fehlt: ${k.bild}`)
  }
})
