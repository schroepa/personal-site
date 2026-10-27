import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { aufloesen, erstelleServer, headerFuer, sourceZuRegex } from "./helpers/serve-dist.mjs"

test("sourceZuRegex: die in vercel.json genutzten Muster", () => {
  const alle = sourceZuRegex("/(.*)")
  for (const p of ["/", "/blog", "/blog/", "/_astro/a.js", "/cv.pdf"]) assert.ok(alle.test(p), p)
  const astro = sourceZuRegex("/_astro/(.*)")
  assert.ok(astro.test("/_astro/index.CdJzaNS0.js"))
  assert.ok(!astro.test("/_astrox/a.js"))
  assert.ok(!astro.test("/x/_astro/a.js"))
  const fonts = sourceZuRegex("/fonts/(.*)")
  assert.ok(fonts.test("/fonts/geist-latin.woff2"))
  assert.ok(!fonts.test("/fonts"))
  // Punkte sind wörtlich
  assert.ok(sourceZuRegex("/cv.pdf").test("/cv.pdf"))
  assert.ok(!sourceZuRegex("/cv.pdf").test("/cvXpdf"))
})

test("sourceZuRegex: nicht unterstützte Syntax wirft statt still anders zu passen", () => {
  for (const s of ["/:pfad*", "/blog/:slug", "/(.*)?", "/a{b}", "blog", "/(.*"]) assert.throws(() => sourceZuRegex(s), s)
})

test("headerFuer: alle passenden Regeln, spätere überschreiben gleichnamige", () => {
  const regeln = [
    { source: "/(.*)", headers: [{ key: "A", value: "1" }, { key: "X", value: "alt" }] },
    { source: "/_astro/(.*)", headers: [{ key: "x", value: "neu" }] },
  ]
  assert.deepEqual(headerFuer(regeln, "/blog"), [{ key: "A", value: "1" }, { key: "X", value: "alt" }])
  assert.deepEqual(headerFuer(regeln, "/_astro/a.js"), [{ key: "A", value: "1" }, { key: "x", value: "neu" }])
})

function beispielDist() {
  const d = mkdtempSync(join(tmpdir(), "serve-dist-"))
  mkdirSync(join(d, "blog", "artikel"), { recursive: true })
  writeFileSync(join(d, "index.html"), "start")
  writeFileSync(join(d, "404.html"), "fehlt")
  writeFileSync(join(d, "blog", "index.html"), "blog")
  writeFileSync(join(d, "blog", "artikel", "index.html"), "artikel")
  writeFileSync(join(d, "cv.pdf"), "%PDF")
  writeFileSync(join(d, "geheim.txt"), "x")
  return d
}

test("aufloesen: wie Vercel ohne cleanUrls und mit trailingSlash undefined", () => {
  const d = beispielDist()
  const rel = (p) => {
    const r = aufloesen(d, p)
    return [r.datei.slice(d.length), r.status]
  }
  assert.deepEqual(rel("/"), ["/index.html", 200])
  assert.deepEqual(rel("/blog"), ["/blog/index.html", 200])
  assert.deepEqual(rel("/blog/"), ["/blog/index.html", 200])
  assert.deepEqual(rel("/blog/artikel"), ["/blog/artikel/index.html", 200])
  assert.deepEqual(rel("/cv.pdf"), ["/cv.pdf", 200])
  assert.deepEqual(rel("/gibt-es-nicht"), ["/404.html", 404])
  assert.deepEqual(rel("/404"), ["/404.html", 404])
  assert.deepEqual(rel("/cv.pdf/"), ["/404.html", 404])
  // kein Ausbruch aus dist/
  assert.deepEqual(rel("/../../etc/passwd"), ["/404.html", 404])
  assert.deepEqual(rel("/%2e%2e/%2e%2e/etc/passwd"), ["/404.html", 404])
  assert.deepEqual(rel("/%E0%A4%A"), ["/404.html", 404])
})

test("Server: Status, Content-Type und Header aus den Regeln", async () => {
  const d = beispielDist()
  const regeln = [
    { source: "/(.*)", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }] },
    { source: "/_astro/(.*)", headers: [{ key: "Cache-Control", value: "immutable" }] },
  ]
  const server = erstelleServer({ dist: d, regeln })
  await new Promise((r) => server.listen(0, "127.0.0.1", r))
  const basis = `http://127.0.0.1:${server.address().port}`
  try {
    const pdf = await fetch(`${basis}/cv.pdf`)
    assert.equal(pdf.status, 200)
    assert.equal(pdf.headers.get("content-type"), "application/pdf")
    assert.equal(pdf.headers.get("x-content-type-options"), "nosniff")
    assert.equal(pdf.headers.get("cache-control"), null)
    const fehlt = await fetch(`${basis}/nichts`)
    assert.equal(fehlt.status, 404)
    assert.equal(await fehlt.text(), "fehlt")
    assert.equal(fehlt.headers.get("x-content-type-options"), "nosniff")
    assert.equal((await fetch(`${basis}/blog`)).headers.get("content-type"), "text/html; charset=utf-8")
  } finally {
    server.close()
  }
  assert.equal(readFileSync(join(d, "index.html"), "utf8"), "start")
})
