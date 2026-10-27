import { test } from "node:test"
import assert from "node:assert/strict"
import { assertKapitel } from "./galerie-akkordeon.ts"

const kapitel = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ titel: `Kapitel ${i + 1}`, bild: `/bild-${i + 1}.webp`, href: `/k/${i + 1}` }))

test("assertKapitel: 1 bis 5 Kapitel sind gültig", () => {
  for (const n of [1, 2, 3, 4, 5]) assert.doesNotThrow(() => assertKapitel(kapitel(n)))
})

test("assertKapitel: 0 Kapitel schlagen mit klarer Meldung fehl", () => {
  assert.throws(() => assertKapitel([]), /GalerieAkkordeon.*1 bis 5.*0/)
})

test("assertKapitel: 6 Kapitel schlagen mit klarer Meldung fehl", () => {
  assert.throws(() => assertKapitel(kapitel(6)), /GalerieAkkordeon.*1 bis 5.*6/)
})

test("assertKapitel: kein Array schlägt fehl", () => {
  assert.throws(() => assertKapitel(undefined as never), /GalerieAkkordeon/)
})
