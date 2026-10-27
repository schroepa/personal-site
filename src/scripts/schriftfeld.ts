/**
 * Schriftfeld: Blatt (Abschnitt), Raster (Maße oder Spalten unter dem Zeiger), Ortszeit Berlin.
 * Alle Maße kommen aus den Layout-Tokens (--layout-anzeige-*), nichts ist hier festgeschrieben.
 */

const zeitFormat = new Intl.DateTimeFormat("de-DE", {
  timeZone: "Europe/Berlin",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

export function formatZeit(date: Date): string {
  return `${zeitFormat.format(date)} Uhr`
}

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** „1440 · 12 / 80 / 24“: Breite · Spalten / Rand / Abstand des aktuellen Layouts. */
export function rasterMasse(): string {
  return `${token("--layout-anzeige-breite")} · ${token("--layout-anzeige-spalten")} / ${token("--layout-anzeige-rand")} / ${token("--layout-anzeige-abstand")}`
}

/** „Spalte a–b · n von N“ für ein Rechteck, gemessen an den sichtbaren Rasterspalten. */
export function spaltenBeschreibung(rect: DOMRect, spalten: DOMRect[]): string | null {
  const treffer = spalten
    .map((s, i) => ({ s, nr: i + 1 }))
    .filter(({ s }) => s.right > rect.left && s.left < rect.right)
  if (treffer.length === 0) return null
  const a = treffer[0].nr
  const b = treffer[treffer.length - 1].nr
  const bereich = a === b ? `Spalte ${a}` : `Spalte ${a}–${b}`
  return `${bereich} · ${b - a + 1} von ${spalten.length}`
}

export function initSchriftfeld(): () => void {
  const feld = document.querySelector<HTMLElement>("[data-schriftfeld]")
  if (!feld) return () => {}

  const zeit = feld.querySelector<HTMLElement>("[data-zeit]")
  const rasterWert = feld.querySelector<HTMLElement>("[data-raster-wert]")
  const blattWert = feld.querySelector<HTMLElement>("[data-blatt-wert]")
  const raster = document.querySelector<HTMLElement>("[data-raster]")
  const cleanups: Array<() => void> = []

  // Ortszeit: alle 15 s geprüft, damit der Minutenwechsel höchstens 15 s zu spät erscheint
  if (zeit) {
    const tick = () => {
      zeit.textContent = formatZeit(new Date())
    }
    tick()
    const id = window.setInterval(tick, 1000 * 15)
    cleanups.push(() => window.clearInterval(id))
  }

  // Raster: Maße, bei Hover über ein [data-objekt] die belegten Spalten
  if (rasterWert) {
    const zeigeMasse = () => {
      rasterWert.textContent = rasterMasse()
    }
    zeigeMasse()
    window.addEventListener("resize", zeigeMasse)
    cleanups.push(() => window.removeEventListener("resize", zeigeMasse))

    if (raster && matchMedia("(pointer: fine)").matches) {
      const onMove = (e: PointerEvent) => {
        const objekt = (e.target as Element | null)?.closest<HTMLElement>("[data-objekt]")
        if (!objekt) return zeigeMasse()
        const spalten = [...raster.children]
          .map((c) => c.getBoundingClientRect())
          .filter((r) => r.height > 0)
        rasterWert.textContent =
          spaltenBeschreibung(objekt.getBoundingClientRect(), spalten) ?? rasterMasse()
      }
      document.addEventListener("pointermove", onMove)
      cleanups.push(() => document.removeEventListener("pointermove", onMove))
    }
  }

  // Blatt: wechselt mit dem sichtbaren Abschnitt ([data-abschnitt="Name"]); sonst bleibt der Seitenname
  if (blattWert) {
    const abschnitte = [...document.querySelectorAll<HTMLElement>("[data-abschnitt]")]
    if (abschnitte.length > 0 && "IntersectionObserver" in window) {
      const nummer = (n: number) => String(n).padStart(2, "0")
      const io = new IntersectionObserver(
        (eintraege) => {
          for (const e of eintraege) {
            if (!e.isIntersecting) continue
            const i = abschnitte.indexOf(e.target as HTMLElement)
            blattWert.textContent = `${nummer(i + 1)}/${nummer(abschnitte.length)} ${(e.target as HTMLElement).dataset.abschnitt}`
          }
        },
        { rootMargin: "0px 0px -50% 0px" }
      )
      abschnitte.forEach((a) => io.observe(a))
      cleanups.push(() => io.disconnect())
    }
  }

  return () => cleanups.forEach((fn) => fn())
}
