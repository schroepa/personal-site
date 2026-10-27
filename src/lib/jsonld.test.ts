import { test } from "node:test"
import assert from "node:assert/strict"
import { jsonLd } from "./jsonld.ts"

test("jsonLd: ein Titel mit </script> kann das Skript nicht schließen", () => {
  const daten = { headline: "</script><script>alert(1)</script>" }
  const text = jsonLd(daten)
  assert.ok(!text.includes("<"))
  assert.ok(!text.includes("</script"))
  assert.deepEqual(JSON.parse(text), daten)
})

test("jsonLd: >, & und U+2028/2029 werden maskiert, Rundlauf bleibt gleich", () => {
  const daten = { a: "x > y & z", b: "zeile\u2028eins\u2029zwei", c: ["<!--", 1, null, true], d: { e: "ä ö ü „“" } }
  const text = jsonLd(daten)
  assert.ok(!/[<>&\u2028\u2029]/.test(text))
  assert.deepEqual(JSON.parse(text), daten)
})

test("jsonLd: gewöhnliche Daten bleiben lesbar (kein Umbau außer den Zeichen)", () => {
  assert.equal(jsonLd({ name: "Patrick Schröder", n: 1 }), '{"name":"Patrick Schröder","n":1}')
})

test("jsonLd: undefined auf oberster Ebene wirft einen klaren TypeError", () => {
  assert.throws(() => jsonLd(undefined), TypeError)
  assert.equal(jsonLd(null), "null")
})
