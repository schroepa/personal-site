// Hilfen für Build-Prüfungen: welche Hosts lädt eine gebaute Seite? (genutzt von build-hosts.test.mjs und rechtliches.spec.ts)
import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"

export function htmlDateien(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) return htmlDateien(p)
    return n.endsWith(".html") ? [p] : []
  })
}

/** Alle Hosts, von denen die Seite Ressourcen lädt (Attribute src, srcset, href außer <a>, action, Inline-Skripte und -Styles, url()). */
export function fremdeHosts(html: string): Set<string> {
  const hosts = new Set<string>()
  const merke = (u: string) => {
    const m = u.trim().match(/^(?:https?:)?\/\/([^/?#:"'\s)]+)/i)
    if (m) hosts.add(m[1].toLowerCase())
  }
  const ohneLd = html.replace(/<script[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, "")
  for (const tag of ohneLd.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const name = tag[1].toLowerCase()
    if (name === "a") continue
    for (const a of tag[2].matchAll(/\s(src|href|action|poster|data|srcset|imagesrcset)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi)) {
      const wert = a[3] ?? a[4] ?? a[5] ?? ""
      if (/srcset/i.test(a[1])) wert.split(",").forEach((s) => merke(s.trim().split(/\s+/)[0]))
      else merke(wert)
    }
  }
  for (const m of ohneLd.matchAll(/url\(\s*["']?([^)"']+)/g)) merke(m[1])
  for (const m of ohneLd.matchAll(/<(?:script|style)\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/(?:script|style)>/g)) {
    for (const u of m[1].matchAll(/https?:\/\/([a-zA-Z0-9.-]+)/g)) hosts.add(u[1].toLowerCase())
  }
  return hosts
}

