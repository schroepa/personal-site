// Sicherheits-Header für Vercel (statische Ausgabe, kein Adapter): erzeugt den `headers`-Block von vercel.json.
//
// Einzige Quelle für externe Hosts: src/data/externe-ressourcen.json (Feld `csp`: welche Direktiven der Host braucht).
// Alles andere ist hier festgelegt und in README „Sicherheits-Header & CSP“ begründet.
//
//   npm run headers           schreibt vercel.json neu (deterministisch)
//   npm run headers -- --check  prüft nur, ob vercel.json aktuell ist (Exit 1 bei Abweichung); läuft auch in `prebuild`,
//                               damit ein Vercel-Build mit veralteter vercel.json scheitert
//
// vercel.json ist eingecheckt; der Test scripts/build-vercel-headers.test.mjs vergleicht sie mit der Ausgabe hier.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

/** Direktiven, denen ein externer Host in externe-ressourcen.json zugeordnet werden darf. */
export const HOST_DIREKTIVEN = ["script-src", "style-src", "img-src", "font-src", "connect-src", "frame-src", "media-src"]

/**
 * Grundgerüst der CSP ohne externe Hosts. Reihenfolge = Reihenfolge im Header.
 *
 * - script-src 'self': keine Inline-Skripte (Kopf- und PostHog-Skript liegen als Dateien unter /js/), kein eval,
 *   keine Hashes, keine Nonces. Fremde Hosts kommen aus der JSON.
 * - style-src 'self' 'unsafe-inline': nötig für Cookiebot (uc.js fügt <style>-Elemente ohne Nonce ein; die
 *   Cookiebot-CSP-Doku verlangt `style-src 'self' 'unsafe-inline'`) und für eigene style="…"-Attribute
 *   (view-transition-name, --korn-*, --fuellung, React-Styles des Gradient-Generators im Server-HTML) sowie
 *   Astros kleine Inline-<style>-Blöcke. Ein Aufteilen in style-src-elem/-attr brächte nichts, beide bräuchten 'unsafe-inline'.
 * - img-src data:: Papierkorn und Generator-Korn nutzen SVG als data:-URL in CSS. Kein blob: (der PNG-Export
 *   nutzt die Blob-URL nur als Download-Link, das ist eine Navigation, kein Bild).
 * - worker-src 'self': keine Blob-Worker. PostHogs Sitzungsaufzeichnung bräuchte blob:, ist aber nicht
 *   eingerichtet und nicht in der Datenschutzerklärung beschrieben; sie bleibt damit auch technisch aus.
 * - frame-src: nur was die JSON nennt (Cookiebot-CDN-Iframe); ohne Eintrag 'none'.
 */
export const CSP_BASIS = [
  ["default-src", ["'self'"]],
  ["script-src", ["'self'"]],
  ["style-src", ["'self'", "'unsafe-inline'"]],
  ["img-src", ["'self'", "data:"]],
  ["font-src", ["'self'"]],
  ["connect-src", ["'self'"]],
  ["media-src", ["'self'"]],
  ["frame-src", []],
  ["worker-src", ["'self'"]],
  ["manifest-src", ["'self'"]],
  ["object-src", ["'none'"]],
  ["base-uri", ["'self'"]],
  ["form-action", ["'self'"]],
  ["frame-ancestors", ["'none'"]],
  ["upgrade-insecure-requests", null],
]

/**
 * HSTS ohne `preload`: preload ist eine Zusage an die Browser-Preload-Liste (alle Subdomains für immer nur HTTPS,
 * Rücknahme dauert Monate). Das entscheidet Patrick bewusst; dann hier `; preload` ergänzen und auf hstspreload.org eintragen.
 */
export const HSTS = "max-age=63072000; includeSubDomains"

/** Funktionen, die die Seite nicht nutzt (nur von Chromium erkannte Namen, sonst warnt die Konsole). */
export const PERMISSIONS_POLICY = [
  "accelerometer",
  "bluetooth",
  "browsing-topics",
  "camera",
  "display-capture",
  "geolocation",
  "gyroscope",
  "hid",
  "magnetometer",
  "microphone",
  "midi",
  "payment",
  "publickey-credentials-get",
  "serial",
  "usb",
  "xr-spatial-tracking",
]
  .map((f) => `${f}=()`)
  .join(", ")

/** Fingerprintete Dateien (Astro: Name enthält den Inhalts-Hash) dürfen für immer im Cache liegen. */
export const CACHE_IMMUTABLE = "public, max-age=31536000, immutable"
/**
 * Schriften unter /fonts/ haben feste Namen (scripts/copy-fonts.mjs kopiert sie aus @fontsource), sind also NICHT
 * fingerprintet. Daher kurz frisch (1 Tag) und eine Woche lang im Hintergrund erneuerbar statt immutable.
 */
export const CACHE_FONTS = "public, max-age=86400, stale-while-revalidate=604800"

/** Hosts je Direktive aus der JSON (https://, sortiert, ohne Doppelte). Wirft bei unbekannten Direktiven oder Schema-Fehlern. */
export function hostsJeDirektive(ressourcen) {
  const je = new Map(HOST_DIREKTIVEN.map((d) => [d, new Set()]))
  for (const r of ressourcen) {
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(r.host)) throw new Error(`Ungültiger Host (ohne Schema, Pfad, Wildcard): ${r.host}`)
    if (!Array.isArray(r.csp) || r.csp.length === 0) throw new Error(`${r.host}: Feld csp fehlt oder ist leer`)
    for (const d of r.csp) {
      if (!je.has(d)) throw new Error(`${r.host}: Direktive ${d} ist nicht erlaubt (erlaubt: ${HOST_DIREKTIVEN.join(", ")})`)
      je.get(d).add(`https://${r.host}`)
    }
  }
  return new Map([...je].map(([d, s]) => [d, [...s].sort()]))
}

/** Direktiven (Basis + Hosts) als geordnete Liste [name, quellen | null]. */
export function cspDirektiven(ressourcen) {
  const hosts = hostsJeDirektive(ressourcen)
  return CSP_BASIS.map(([name, quellen]) => {
    if (quellen === null) return [name, null]
    const alle = [...quellen, ...(hosts.get(name) ?? [])]
    return [name, alle.length ? alle : ["'none'"]]
  })
}

/** Direktiven als Header-Wert: `name q1 q2; name2 …` (Direktive ohne Quellen, z. B. upgrade-insecure-requests, allein). */
export function renderCsp(direktiven) {
  return direktiven.map(([name, quellen]) => (quellen === null ? name : [name, ...quellen].join(" "))).join("; ")
}

/**
 * Header-Regeln für vercel.json. Keine zwei Regeln setzen denselben Header für denselben Pfad
 * (Cache-Control steht nur in den speziellen Regeln), die Reihenfolge der Regeln ist daher egal.
 * @returns {{ source: string, headers: { key: string, value: string }[] }[]}
 */
export function buildHeaders(ressourcen) {
  return [
    {
      source: "/(.*)",
      headers: [
        { key: "Content-Security-Policy", value: renderCsp(cspDirektiven(ressourcen)) },
        { key: "Strict-Transport-Security", value: HSTS },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Permissions-Policy", value: PERMISSIONS_POLICY },
      ],
    },
    { source: "/_astro/(.*)", headers: [{ key: "Cache-Control", value: CACHE_IMMUTABLE }] },
    { source: "/fonts/(.*)", headers: [{ key: "Cache-Control", value: CACHE_FONTS }] },
  ]
}

/** Vollständige vercel.json als Text (2 Leerzeichen, Zeilenende am Schluss). URL-Verhalten (cleanUrls, trailingSlash) bleibt Vercel-Standard. */
export function renderVercelJson(ressourcen) {
  return `${JSON.stringify({ $schema: "https://openapi.vercel.sh/vercel.json", headers: buildHeaders(ressourcen) }, null, 2)}\n`
}

/** Gleicher JSON-Inhalt (Schlüsselreihenfolge zählt, Formatierung nicht); unlesbares JSON gilt als ungleich. */
export function gleicherInhalt(ist, soll) {
  try {
    return JSON.stringify(JSON.parse(ist)) === JSON.stringify(JSON.parse(soll))
  } catch {
    return false
  }
}

const wurzel = join(dirname(fileURLToPath(import.meta.url)), "..")
export const RESSOURCEN_PFAD = join(wurzel, "src/data/externe-ressourcen.json")
export const VERCEL_JSON_PFAD = join(wurzel, "vercel.json")

export function ladeRessourcen(pfad = RESSOURCEN_PFAD) {
  return JSON.parse(readFileSync(pfad, "utf8"))
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const soll = renderVercelJson(ladeRessourcen())
  if (process.argv.includes("--check")) {
    let ist = ""
    try {
      ist = readFileSync(VERCEL_JSON_PFAD, "utf8")
    } catch {
      /* fehlt */
    }
    // Inhalt statt Text vergleichen: Vercel schreibt vercel.json im Build-Container einzeilig um (gleicher Inhalt, andere Formatierung).
    if (!gleicherInhalt(ist, soll)) {
      // Diagnose: Node-Version und erste abweichende Zeile, damit Abweichungen im Build-Log nachvollziehbar sind.
      const a = ist.split("\n")
      const b = soll.split("\n")
      const i = a.findIndex((z, n) => z !== b[n])
      console.error(`Abweichung ab Zeile ${i + 1} (ist ${a.length} Zeilen, soll ${b.length}); Node ${process.version}`)
      console.error("vercel.json passt nicht zu src/data/externe-ressourcen.json bzw. scripts/build-vercel-headers.mjs. Beheben: `npm run headers` ausführen und vercel.json committen.")
      process.exit(1)
    }
    console.log("vercel.json ist aktuell.")
  } else {
    writeFileSync(VERCEL_JSON_PFAD, soll)
    console.log(`vercel.json geschrieben (${buildHeaders(ladeRessourcen()).length} Regeln).`)
  }
}
