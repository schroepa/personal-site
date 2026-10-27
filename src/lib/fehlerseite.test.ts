import { test } from "node:test"
import assert from "node:assert/strict"
import { zuletztGeschrieben } from "./fehlerseite.ts"

const b = (id: string, date: string, draft = false) => ({ id, data: { date: new Date(date), draft } })

test("zuletztGeschrieben: die zwei neuesten veröffentlichten, Entwürfe ausgenommen", () => {
  const liste = [b("a.md", "2026-01-01"), b("b.md", "2026-03-01"), b("c.md", "2026-05-01", true), b("d.md", "2026-02-01")]
  assert.deepEqual(zuletztGeschrieben(liste).map((x: { id: string }) => x.id), ["b.md", "d.md"])
})

test("zuletztGeschrieben: weniger als zwei Beiträge zeigt, was da ist; keine ergibt eine leere Liste", () => {
  assert.deepEqual(zuletztGeschrieben([b("a.md", "2026-01-01"), b("x.md", "2026-02-01", true)]).map((x: { id: string }) => x.id), ["a.md"])
  assert.deepEqual(zuletztGeschrieben([]), [])
  assert.deepEqual(zuletztGeschrieben([b("x.md", "2026-02-01", true)]), [])
})

test("zuletztGeschrieben: Anzahl einstellbar, Gleichstand nach Kennung absteigend", () => {
  const liste = [b("a.md", "2026-01-01"), b("b.md", "2026-01-01"), b("c.md", "2026-01-01")]
  assert.deepEqual(zuletztGeschrieben(liste, 3).map((x: { id: string }) => x.id), ["c.md", "b.md", "a.md"])
  assert.deepEqual(zuletztGeschrieben(liste, 0), [])
})
