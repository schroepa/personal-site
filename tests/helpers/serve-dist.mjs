// Kleiner statischer Server für dist/ ohne Abhängigkeiten, der sich für die Tests wie Vercel verhält:
//  - Antwort-Header aus vercel.json (`headers[].source`, die hier genutzte Teilmenge von path-to-regexp),
//  - Auflösung wie Vercel ohne cleanUrls und mit trailingSlash undefined: /blog und /blog/ liefern blog/index.html
//    ohne Umleitung, unbekannte Pfade 404 mit 404.html.
// Damit lässt sich die CSP im echten Browser prüfen, ohne auf Vercel zu deployen (tests/e2e/csp.spec.ts).
//
//   node tests/helpers/serve-dist.mjs [--port 4323] [--dist dist]
import { createServer } from "node:http"
import { existsSync, readFileSync, statSync } from "node:fs"
import { extname, join, normalize, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { brotliCompressSync, gzipSync } from "node:zlib"

export const TYPEN = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
}

/**
 * `source` aus vercel.json als RegExp. Unterstützt die genutzte Teilmenge von path-to-regexp:
 * wörtliche Pfadteile und Regex-Gruppen in Klammern, z. B. `/(.*)`, `/_astro/(.*)`. Benannte Parameter (`:name`)
 * und Modifikatoren werden abgelehnt, damit ein neues Muster nicht stillschweigend anders passt als auf Vercel.
 */
export function sourceZuRegex(source) {
  if (!source.startsWith("/")) throw new Error(`source muss mit / beginnen: ${source}`)
  let muster = ""
  let i = 0
  while (i < source.length) {
    const c = source[i]
    if (c === "(") {
      let tiefe = 0
      let j = i
      for (; j < source.length; j++) {
        if (source[j] === "(") tiefe++
        else if (source[j] === ")" && --tiefe === 0) break
      }
      if (tiefe !== 0) throw new Error(`Klammer nicht geschlossen: ${source}`)
      muster += source.slice(i, j + 1)
      i = j + 1
      if (/[?*+]/.test(source[i] ?? "")) throw new Error(`Modifikator nach Gruppe nicht unterstützt: ${source}`)
      continue
    }
    if (c === ":" || c === "*" || c === "?" || c === "+" || c === "{" || c === "}") throw new Error(`Nicht unterstützt in source: ${c} (${source})`)
    muster += c.replace(/[.\\^$|[\]]/g, "\\$&")
    i++
  }
  return new RegExp(`^${muster}$`)
}

/** Header für einen Pfad: alle passenden Regeln in Reihenfolge, spätere überschreiben gleichnamige (wie Vercel). */
export function headerFuer(regeln, pfad) {
  const raus = new Map()
  for (const r of regeln) {
    if (!sourceZuRegex(r.source).test(pfad)) continue
    for (const h of r.headers) raus.set(h.key.toLowerCase(), { key: h.key, value: h.value })
  }
  return [...raus.values()]
}

/** Datei für einen Pfad wie Vercel (ohne cleanUrls, trailingSlash undefined). Liefert { datei, status }. */
export function aufloesen(dist, pfad) {
  let roh
  try {
    roh = decodeURIComponent(pfad)
  } catch {
    return { datei: join(dist, "404.html"), status: 404 }
  }
  const rel = normalize(roh).replace(/^([/\\])+/, "")
  const fehlt = { datei: join(dist, "404.html"), status: 404 }
  if (rel.split(/[/\\]/).includes("..")) return fehlt
  const kandidaten = roh.endsWith("/") ? [join(dist, rel, "index.html")] : [join(dist, rel), join(dist, rel, "index.html")]
  for (const k of kandidaten) {
    if (!k.startsWith(dist + sep) && k !== dist) continue
    if (existsSync(k) && statSync(k).isFile()) return { datei: k, status: 200 }
  }
  return fehlt
}

const KOMPRIMIERBAR = new Set([".html", ".js", ".mjs", ".css", ".json", ".webmanifest", ".xml", ".txt", ".svg"])

/**
 * `compress: true` komprimiert Text-Antworten (br, sonst gzip) wie Vercel es in der Produktion tut. Nur für Lab-Messungen
 * (scripts/lighthouse.mjs, `--compress`); die Header-/CSP-Tests laufen unkomprimiert.
 */
export function erstelleServer({ dist, regeln, compress = false }) {
  const cache = new Map()
  return createServer((req, res) => {
    const pfad = new URL(req.url ?? "/", "http://localhost").pathname
    const { datei, status } = aufloesen(dist, pfad)
    let inhalt = existsSync(datei) ? readFileSync(datei) : Buffer.from("Not Found")
    res.statusCode = status
    res.setHeader("Content-Type", TYPEN[extname(datei)] ?? "application/octet-stream")
    for (const h of headerFuer(regeln, pfad)) res.setHeader(h.key, h.value)
    if (compress && KOMPRIMIERBAR.has(extname(datei))) {
      const akzeptiert = String(req.headers["accept-encoding"] ?? "")
      const art = /\bbr\b/.test(akzeptiert) ? "br" : /\bgzip\b/.test(akzeptiert) ? "gzip" : null
      if (art) {
        const key = `${art}:${datei}`
        if (!cache.has(key)) cache.set(key, art === "br" ? brotliCompressSync(inhalt) : gzipSync(inhalt))
        inhalt = cache.get(key)
        res.setHeader("Content-Encoding", art)
        res.setHeader("Vary", "Accept-Encoding")
      }
    }
    res.setHeader("Content-Length", inhalt.length)
    res.end(req.method === "HEAD" ? undefined : inhalt)
  })
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg = (name, standard) => {
    const i = process.argv.indexOf(`--${name}`)
    return i > 0 ? process.argv[i + 1] : standard
  }
  const wurzel = join(fileURLToPath(new URL("../..", import.meta.url)))
  const dist = join(wurzel, arg("dist", "dist"))
  const port = Number(arg("port", "4323"))
  const regeln = JSON.parse(readFileSync(join(wurzel, "vercel.json"), "utf8")).headers ?? []
  erstelleServer({ dist: dist.replace(/[/\\]$/, ""), regeln, compress: process.argv.includes("--compress") }).listen(port, "127.0.0.1", () =>
    console.log(`dist/ mit Headern aus vercel.json auf http://127.0.0.1:${port}${existsSync(dist) ? "" : " (dist/ fehlt!)"}`)
  )
}
