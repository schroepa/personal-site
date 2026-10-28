// Gemeinsame Helfer der QA-Specs (tests/e2e/qa-*.spec.ts, tests/e2e/cross-browser.spec.ts).
import type { BrowserContext, Page } from "@playwright/test"
import { ROUTES } from "../helpers"

export interface QaSeite {
  name: string
  url: string
}

/** Alle statischen Routen plus Werkzeug, ein Artikel (Code und h2), eine Fallstudie, eine einfache Projektseite. */
export const QA_SEITEN: QaSeite[] = [
  ...ROUTES.map((url) => ({ name: url === "/" ? "start" : url.slice(1), url })),
  { name: "tool", url: "/tools/gradient-generator" },
  { name: "artikel", url: "/blog/design-tokens-in-der-praxis" },
  { name: "fallstudie", url: "/projects/tintfield" },
  { name: "projekt", url: "/projects/proman" },
]

export const THEMES = ["light", "dark"] as const
export const BEWEGUNG = ["normal", "reduziert"] as const
export type Theme = (typeof THEMES)[number]
export type Bewegung = (typeof BEWEGUNG)[number]

/**
 * Bekannter Drittanbieter-Stub: Cookiebot (uc.js) wird durch ein leeres Skript ersetzt, alle anderen fremden Hosts
 * abgebrochen. So bleibt die Konsole ohne Netzwerk-Rauschen und es gehen nie Daten an Dritte.
 */
export async function stubExterne(context: BrowserContext): Promise<void> {
  await context.route(
    (url) => url.hostname !== "127.0.0.1" && url.hostname !== "localhost",
    (route) => {
      const url = new URL(route.request().url())
      if (url.hostname === "consent.cookiebot.com" && url.pathname === "/uc.js")
        return route.fulfill({ status: 200, contentType: "text/javascript", body: "" })
      return route.abort()
    }
  )
}

/**
 * Vom Browser selbst erzeugte Hinweise, kein Fehler der Seite (jeweils mit Beleg):
 *  - „GL Driver Message … GPU stall due to ReadPixels“: Software-GL (SwiftShader) im Headless-Chromium meldet Leistungshinweise zu WebGL-Zugriffen;
 *    betrifft nur Lichtband/Werkzeug-Canvas ohne GPU, auf echter GPU und im Build (csp.spec: null Fehler) nicht relevant.
 *  - „[transitions]: all view transition animations … prefers-reduced-motion“: Chromium-Hinweis, dass @view-transition bei reduzierter Bewegung
 *    wie vorgesehen aus ist.
 */
export const BEKANNTE_MELDUNGEN = [/GL Driver Message \(OpenGL, Performance/, /\[transitions\]: all view transition animations/]

export interface Konsole {
  eintraege: string[]
}

/** Sammelt Konsolenfehler, Warnungen und Seitenfehler (abgebrochene Fremd-Anfragen sind kein Fehler der Seite). */
export function sammleKonsole(page: Page): Konsole {
  const k: Konsole = { eintraege: [] }
  page.on("console", (m) => {
    if (m.type() !== "error" && m.type() !== "warning") return
    const text = m.text()
    if (BEKANNTE_MELDUNGEN.some((re) => re.test(text))) return
    if (/ERR_FAILED|net::ERR_/.test(text) && /cookiebot|posthog/i.test(m.location().url + text)) return
    k.eintraege.push(`${m.type()}: ${text}`)
  })
  page.on("pageerror", (e) => k.eintraege.push(`pageerror: ${e.message}`))
  return k
}

/** Theme und Bewegung setzen, bevor die Seite läuft (Kopf-Skript liest localStorage.theme und die Medienabfrage). */
export async function vorbereiten(page: Page, theme: Theme, bewegung: Bewegung): Promise<void> {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("theme", t)
    } catch {
      /* ohne Speicher gilt das System-Theme */
    }
  }, theme)
  await page.emulateMedia({ colorScheme: theme, reducedMotion: bewegung === "reduziert" ? "reduce" : "no-preference" })
}

export async function ladeSeite(page: Page, url: string): Promise<void> {
  const res = await page.goto(url)
  if (!res) throw new Error(`Keine Antwort für ${url}`)
  await page.waitForSelector("body[data-bereit]", { timeout: 20_000 })
}

// ------------------------------------------------------------------------------------------------
// Kontrast (WCAG 2.x)

export type Rgb = [number, number, number]

const lin = (c: number) => {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
export const leuchtdichte = ([r, g, b]: Rgb) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
export function kontrast(a: Rgb, b: Rgb): number {
  const [hell, dunkel] = [leuchtdichte(a), leuchtdichte(b)].sort((x, y) => y - x)
  return (hell + 0.05) / (dunkel + 0.05)
}

/** Löst CSS-Farben (auch var(--token)) im Browser über ein Canvas zu RGB auf. Nur für deckende Farben gedacht. */
export async function farbenAufloesen(page: Page, ausdruecke: string[]): Promise<Rgb[]> {
  return page.evaluate((liste) => {
    const probe = document.createElement("div")
    probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none"
    document.body.appendChild(probe)
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!
    const aus = liste.map((ausdruck) => {
      probe.style.color = ""
      probe.style.color = ausdruck
      const berechnet = getComputedStyle(probe).color
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = "#000"
      ctx.fillStyle = berechnet
      ctx.fillRect(0, 0, 1, 1)
      const d = ctx.getImageData(0, 0, 1, 1).data
      return [d[0], d[1], d[2]] as [number, number, number]
    })
    probe.remove()
    return aus
  }, ausdruecke)
}

/** Kontrast-Paare der Übergabe (Vordergrund, Hintergrund, Sollwert hell, Sollwert dunkel). */
export const TOKEN_PAARE: Array<{ name: string; fg: string; bg: string; hell: number; dunkel: number }> = [
  { name: "text-default auf surface-page", fg: "var(--theme-text-default)", bg: "var(--theme-surface-page)", hell: 6.3, dunkel: 14.8 },
  { name: "text-strong auf surface-page", fg: "var(--theme-text-strong)", bg: "var(--theme-surface-page)", hell: 14.3, dunkel: 14.8 },
  { name: "text-muted auf surface-page", fg: "var(--theme-text-muted)", bg: "var(--theme-surface-page)", hell: 5.2, dunkel: 5.8 },
  { name: "text-on-secondary auf surface-secondary", fg: "var(--theme-text-on-secondary)", bg: "var(--theme-surface-secondary)", hell: 8.3, dunkel: 6.8 },
  { name: "text-default auf surface-container", fg: "var(--theme-text-default)", bg: "var(--theme-surface-container)", hell: 7.0, dunkel: 13.0 },
]

// ------------------------------------------------------------------------------------------------
// Seitenstruktur

/** Überschriften in Dokumentreihenfolge (nur sichtbare), als Ebenen 1-6. */
export async function ueberschriftsEbenen(page: Page): Promise<number[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"))
      .filter((h) => (h as HTMLElement).checkVisibility({ visibilityProperty: true }))
      .map((h) => Number(h.tagName[1]))
  )
}

/** Gibt Meldungen zurück: erste Ebene muss 1 sein, danach darf es höchstens eine Ebene tiefer gehen. */
export function ebenenFehler(ebenen: number[]): string[] {
  const f: string[] = []
  if (ebenen[0] !== 1) f.push(`erste Überschrift ist h${ebenen[0]}`)
  for (let i = 1; i < ebenen.length; i++) if (ebenen[i] > ebenen[i - 1] + 1) f.push(`Sprung h${ebenen[i - 1]} → h${ebenen[i]} (Position ${i})`)
  return f
}

export interface FokusProbe {
  tag: string
  name: string
  sichtbar: boolean
  outlineStyle: string
  outlineBreite: number
  outlineFarbe: string
  boxShadow: string
  hintergrund: string
}

/** Pfad eines Elements, gleich aufgebaut wie die id in fokusProbe (zum Vergleichen der erwarteten mit den erreichten Elementen). */
export async function tabbareElemente(page: Page): Promise<Array<{ id: string; name: string }>> {
  return page.evaluate(() => {
    const sel = 'a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]'
    return Array.from(document.querySelectorAll<HTMLElement>(sel))
      .filter((e) => !(e as HTMLButtonElement).disabled && e.tabIndex >= 0 && e.checkVisibility({ visibilityProperty: true }) && !e.closest("[inert]"))
      .map((e) => {
        const pfad: string[] = []
        for (let n: Element | null = e; n && n !== document.body; n = n.parentElement)
          pfad.push(n.tagName + ":" + Array.from(n.parentElement?.children ?? []).indexOf(n))
        return { id: pfad.join(">"), name: (e.getAttribute("aria-label") || e.textContent || e.getAttribute("href") || "").replace(/\s+/g, " ").trim().slice(0, 40) }
      })
  })
}

/** Setzt den Startpunkt der Tab-Reihenfolge an den Dokumentanfang (nach einem Mausklick bleibt er sonst am geklickten Element). */
export async function tabStartAmAnfang(page: Page): Promise<void> {
  await page.evaluate(() => {
    ;(document.activeElement as HTMLElement | null)?.blur()
    const t = document.createElement("div")
    t.tabIndex = -1
    document.body.prepend(t)
    t.focus()
    t.remove()
    scrollTo(0, 0)
  })
}

/**
 * Beschreibung des fokussierten Elements samt Fokus-Stil. Der Rahmen kann am Element selbst oder an einem Vorfahren sitzen
 * (Karten: `.projekt-karte:has(a:focus-visible)`); „hintergrund“ ist die erste deckende Fläche HINTER dem Rahmen
 * (der Rahmen liegt mit Abstand außerhalb des Trägers, also zählt der Hintergrund des Elternelements).
 */
export async function fokusProbe(page: Page): Promise<(FokusProbe & { id: string }) | null> {
  return page.evaluate(() => {
    const e = document.activeElement as HTMLElement | null
    if (!e || e === document.body || e === document.documentElement) return null
    let traeger: HTMLElement = e
    for (let n: HTMLElement | null = e, k = 0; n && k < 5; n = n.parentElement, k++) {
      if (getComputedStyle(n).outlineStyle !== "none") {
        traeger = n
        break
      }
    }
    const cs = getComputedStyle(traeger)
    const versatz = parseFloat(cs.outlineOffset) || 0
    let hg = "rgba(0, 0, 0, 0)"
    for (let n: Element | null = versatz >= 0 ? traeger.parentElement : traeger; n; n = n.parentElement) {
      const c = getComputedStyle(n).backgroundColor
      const m = c.match(/rgba?\(([^)]+)\)/)
      const alpha = m ? (m[1].split(",")[3] ?? "1").trim() : "0"
      if (m && parseFloat(alpha) > 0.99) {
        hg = c
        break
      }
    }
    const pfad: string[] = []
    for (let n: Element | null = e; n && n !== document.body; n = n.parentElement)
      pfad.push(n.tagName + ":" + Array.from(n.parentElement?.children ?? []).indexOf(n))
    return {
      id: pfad.join(">"),
      tag: e.tagName.toLowerCase(),
      name: (e.getAttribute("aria-label") || e.textContent || e.getAttribute("href") || "").replace(/\s+/g, " ").trim().slice(0, 40),
      sichtbar: e.checkVisibility({ visibilityProperty: true }),
      outlineStyle: cs.outlineStyle,
      outlineBreite: parseFloat(cs.outlineWidth),
      outlineFarbe: cs.outlineColor,
      boxShadow: cs.boxShadow,
      hintergrund: hg,
    }
  })
}

export function rgbAusCss(c: string): Rgb {
  const m = c.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/)
  if (!m) throw new Error(`Farbe nicht lesbar: ${c}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}
