// Rehype-Plugin für Markdown-Bilder: loading="lazy", decoding="async" und width/height (aus der Datei unter public/), damit der Browser
// vor dem Laden Platz reserviert (kein Layoutsprung) und Bilder unterhalb des ersten Bildschirms nicht sofort geladen werden.
// Nur lokale Bilder (/images/…); Bilder mit eigenen Angaben bleiben unverändert. `.prose img` setzt width:100% und height:auto,
// die Attribute dienen also nur dem Seitenverhältnis.
import { statSync } from "node:fs"
import { join, sep } from "node:path"
import sharp from "sharp"

const PUBLIC = join(process.cwd(), "public")

function istDatei(pfad) {
  try {
    return statSync(pfad).isFile()
  } catch {
    return false
  }
}

async function besuche(knoten, fn) {
  await fn(knoten)
  for (const kind of knoten.children ?? []) await besuche(kind, fn)
}

export function rehypeBilder() {
  return async (baum) => {
    await besuche(baum, async (k) => {
      if (k.type !== "element" || k.tagName !== "img") return
      const p = (k.properties ??= {})
      if (p.loading === undefined) p.loading = "lazy"
      if (p.decoding === undefined) p.decoding = "async"
      const src = typeof p.src === "string" ? p.src : ""
      if (p.width !== undefined || p.height !== undefined || !src.startsWith("/images/")) return
      let pfad
      try {
        pfad = decodeURIComponent(src.split("?")[0])
      } catch {
        return // kaputte %-Kodierung: Bild unverändert lassen, nie den Build brechen
      }
      const datei = join(PUBLIC, pfad)
      if (!datei.startsWith(PUBLIC + sep) || !istDatei(datei)) return
      let maße
      try {
        maße = await sharp(datei).metadata()
      } catch {
        return // keine lesbare Bilddatei: ohne Maße lassen
      }
      const { width, height } = maße
      if (width && height) {
        p.width = width
        p.height = height
      }
    })
  }
}
