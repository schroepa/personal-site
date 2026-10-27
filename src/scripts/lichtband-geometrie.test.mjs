import { test } from "node:test"
import assert from "node:assert/strict"
import { blobLayout, blobPosition, paletteFor, scrollZusammenzug, FLECKEN_ANZAHL } from "./lichtband-geometrie.ts"

const SEEDS = [0, 1, 7.5, 123.456, 999.999, 42, 1e-3, 500]

test("blobLayout: 4 Flecken, Bereiche laut Prototyp (x 8–92 %, y 30–58 %, Radius 22–52 %)", () => {
  for (const seed of SEEDS) {
    const flecken = blobLayout(seed)
    assert.equal(flecken.length, FLECKEN_ANZAHL)
    assert.equal(FLECKEN_ANZAHL, 4)
    flecken.forEach((f, i) => {
      assert.equal(f.i, i)
      assert.ok(f.x >= 0.08 && f.x <= 0.92, `x ${f.x} (seed ${seed})`)
      assert.ok(f.y >= 0.3 - 1e-9 && f.y <= 0.58 + 1e-9, `y ${f.y} (seed ${seed})`)
      assert.ok(f.r >= 0.22 && f.r <= 0.52, `r ${f.r} (seed ${seed})`)
      assert.ok(f.ph >= 0 && f.ph <= 6.28, `ph ${f.ph} (seed ${seed})`)
    })
  }
})

test("blobLayout: gleicher Startwert gleiches Layout, andere Startwerte andere", () => {
  assert.deepEqual(blobLayout(12.5), blobLayout(12.5))
  assert.notDeepEqual(blobLayout(12.5), blobLayout(13.5))
  assert.notDeepEqual(blobLayout(1), blobLayout(2))
})

test("blobLayout: Werte entsprechen der Formel des Prototyps (rnd(i) = frac(sin(seed + i·127.1)·43758.5453))", () => {
  const seed = 321.5
  const rnd = (i) => {
    const x = Math.sin(seed + i * 127.1) * 43758.5453
    return x - Math.floor(x)
  }
  const f = blobLayout(seed)
  for (let i = 0; i < 4; i++) {
    assert.equal(f[i].x, 0.08 + 0.84 * rnd(i * 3 + 1))
    assert.equal(f[i].y, 0.44 + (rnd(i * 3 + 2) - 0.5) * 0.28)
    assert.equal(f[i].r, 0.22 + 0.3 * rnd(i * 3 + 3))
    assert.equal(f[i].ph, rnd(i + 9) * 6.28)
  }
})

test("blobPosition: Drift höchstens ±5 % in x und ±3 % in y, Radius 0.55 · max(B, H)", () => {
  const w = 1440
  const h = 800
  for (const seed of SEEDS) {
    for (const f of blobLayout(seed)) {
      for (let t = 0; t < 2_000_000; t += 9_973) {
        const [x, y, r] = blobPosition(f, t, w, h)
        assert.ok(Math.abs(x / w - f.x) <= 0.05 + 1e-12, `dx ${x / w - f.x}`)
        assert.ok(Math.abs(y / h - f.y) <= 0.03 + 1e-12, `dy ${y / h - f.y}`)
        assert.equal(r, f.r * Math.max(w, h) * 0.55)
      }
    }
  }
})

test("blobPosition: bei t = 0 gilt sin(ph) bzw. cos(ph) als Auslenkung", () => {
  const f = { i: 0, x: 0.5, y: 0.4, r: 0.3, ph: 1 }
  const [x, y] = blobPosition(f, 0, 100, 100)
  assert.equal(x, (0.5 + Math.sin(1) * 0.05) * 100)
  assert.equal(y, (0.4 + Math.cos(1) * 0.03) * 100)
})

test("paletteFor: verbatim die Paletten des Prototyps", () => {
  assert.deepEqual(paletteFor(false), [
    [250, 199, 219, 0.85],
    [255, 209, 168, 0.9],
    [237, 173, 107, 0.45],
    [253, 242, 224, 0.9],
  ])
  assert.deepEqual(paletteFor(true), [
    [196, 104, 92, 0.55],
    [222, 140, 64, 0.6],
    [140, 82, 112, 0.45],
    [236, 178, 120, 0.4],
  ])
})

test("paletteFor: Rückgabe ist eine Kopie (Mutation verändert die Konstante nicht)", () => {
  paletteFor(false)[0][0] = 0
  assert.equal(paletteFor(false)[0][0], 250)
})

test("scrollZusammenzug: 0 bei Scrollstand 0, begrenzt auf −40 px und scaleY 0.55", () => {
  assert.deepEqual(scrollZusammenzug(0, 800), { y: -0, skala: 1 })
  const halb = scrollZusammenzug(400, 800)
  assert.equal(halb.y, -20)
  assert.ok(Math.abs(halb.skala - (1 - 0.5 * 0.45)) < 1e-12)
  const voll = scrollZusammenzug(5000, 800)
  assert.equal(voll.y, -40)
  assert.ok(Math.abs(voll.skala - 0.55) < 1e-12)
  // Negatives Scrollen (Gummiband) und Höhe 0 bleiben endlich
  assert.deepEqual(scrollZusammenzug(-50, 800), { y: -0, skala: 1 })
  assert.ok(Number.isFinite(scrollZusammenzug(10, 0).y))
})
