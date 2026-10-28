import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { expectNoHorizontalOverflow, warteAufRuhe } from "../helpers"
import {
  BEWEGUNG,
  QA_SEITEN,
  THEMES,
  TOKEN_PAARE,
  ebenenFehler,
  farbenAufloesen,
  fokusProbe,
  kontrast,
  ladeSeite,
  rgbAusCss,
  sammleKonsole,
  stubExterne,
  tabStartAmAnfang,
  tabbareElemente,
  ueberschriftsEbenen,
  vorbereiten,
} from "../helpers/qa"

// Konsolidierter QA-Lauf über alle Seiten (Matrix: Seite × Theme × Bewegung, die Breite kommt vom Playwright-Projekt
// desktop 1440 / tablet 768 / mobile 390). Linkprüfung, Meta-Daten und Sitemap stehen in qa-links.spec.ts.
test.describe.configure({ mode: "parallel" })
test.setTimeout(90_000)

/** Die Fehlerseite antwortet mit Status 404: Chromium meldet das für das Dokument selbst als Konsolenfehler (genau einmal) */
const FEHLER_404_DOKUMENT = "error: Failed to load resource: the server responded with a status of 404 (Not Found)"

test.beforeEach(async ({ context }) => {
  await stubExterne(context)
})

// ---------------------------------------------------------------------------------------------
// 1-3, 5, 9, 10: je Seite × Theme × Bewegung
for (const seite of QA_SEITEN) {
  for (const theme of THEMES) {
    for (const bewegung of BEWEGUNG) {
      test(`Matrix ${seite.name} · ${theme} · ${bewegung}: axe, Überlauf, Überschriften, Landmarken, Bilder, Konsole`, async ({ page }) => {
        const konsole = sammleKonsole(page)
        await vorbereiten(page, theme, bewegung)
        await ladeSeite(page, seite.url)
        await warteAufRuhe(page)

        // (1) axe, WCAG 2.1 AA
        const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze()
        expect.soft(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`), "axe").toEqual([])

        // (2) kein horizontaler Überlauf
        await expectNoHorizontalOverflow(page)

        // (3) genau eine h1, keine Sprünge in der Gliederung
        // Elemente in Shadow-DOM (Astro-Dev-Werkzeugleiste mit eigenen h1) gehören nicht zur Seite
        const h1s = await page.locator("h1").evaluateAll((l) => l.filter((h) => !(h.getRootNode() instanceof ShadowRoot)).map((h) => `${(h.textContent ?? "").trim().slice(0, 30)} [${h.parentElement?.className}]`))
        expect.soft(h1s, "genau eine h1").toHaveLength(1)
        expect.soft(ebenenFehler(await ueberschriftsEbenen(page)), "Überschriften").toEqual([])

        // (5) Landmarken einmal, Sprache, Titel
        await expect.soft(page.getByRole("banner")).toHaveCount(1)
        await expect.soft(page.getByRole("main")).toHaveCount(1)
        await expect.soft(page.getByRole("contentinfo")).toHaveCount(1)
        // im schmalen Layout liegt die Navigation im geschlossenen Menü (nicht sichtbar): per Selektor zählen
        await expect.soft(page.locator('nav[aria-label="Hauptnavigation"]')).toHaveCount(1)
        await expect.soft(page.locator("html")).toHaveAttribute("lang", "de")
        const titel = await page.title()
        expect.soft(titel.length, `Titel „${titel}“`).toBeGreaterThan(0)
        expect.soft(titel.length, `Titel „${titel}“ ≤ 70`).toBeLessThanOrEqual(70)

        // (9) Bilder nur einmal pro Seite prüfen (Theme/Bewegung ändern sie nicht)
        if (theme === "light" && bewegung === "normal") await bilderPruefen(page)

        // (10) Konsole
        // Die Fehlerseite antwortet mit Status 404: Chromium meldet das für das Dokument selbst als Konsolenfehler (genau einmal)
        const erwartet = seite.url === "/404" ? [FEHLER_404_DOKUMENT] : []
        expect.soft(konsole.eintraege, "Konsole").toEqual(erwartet)
      })
    }
  }
}

/** (9) alt-Attribut, geladen, Maße gegen Layoutsprünge, Lazy-Loading unterhalb des ersten Bildschirms. */
async function bilderPruefen(page: Page) {
  const hoehe = await page.evaluate(() => innerHeight)
  const ausgangsInfo = await page.evaluate((h) =>
    Array.from(document.images).map((i) => ({
      src: i.currentSrc || i.src,
      hatAlt: i.hasAttribute("alt"),
      lazy: i.loading === "lazy",
      unterhalb: i.getBoundingClientRect().top + scrollY > h * 1.5,
      // Maße: width/height, Seitenverhältnis (am Bild oder Vorfahren) oder ein Rahmen mit fester Größe, der überstehendes abschneidet (kein Layoutsprung)
      maße:
        (i.hasAttribute("width") && i.hasAttribute("height")) ||
        getComputedStyle(i).aspectRatio !== "auto" ||
        [i.parentElement, i.parentElement?.parentElement].some(
          (a) => !!a && (getComputedStyle(a).aspectRatio !== "auto" || (getComputedStyle(a).overflow !== "visible" && a.getBoundingClientRect().height > 0))
        ),
    })),
    hoehe
  )
  for (const b of ausgangsInfo) {
    expect.soft(b.hatAlt, `alt fehlt: ${b.src}`).toBe(true)
    expect.soft(b.maße, `Maße/Seitenverhältnis fehlen (CLS): ${b.src}`).toBe(true)
    if (b.unterhalb) expect.soft(b.lazy, `unterhalb des ersten Bildschirms ohne loading=lazy: ${b.src}`).toBe(true)
  }
  // Alles durchscrollen, damit lazy Bilder laden
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) {
      scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 60))
    }
    scrollTo(0, 0)
  })
  await page.waitForFunction(() => Array.from(document.images).every((i) => i.complete), null, { timeout: 15_000 }).catch(() => undefined)
  const kaputt = await page.evaluate(() => Array.from(document.images).filter((i) => i.naturalWidth === 0).map((i) => i.currentSrc || i.src))
  expect.soft(kaputt, "Bilder ohne Inhalt (naturalWidth 0)").toEqual([])
}

// ---------------------------------------------------------------------------------------------
// (4) Tastatur: Tab-Durchlauf, sichtbarer Fokus, kein Fokus-Gefängnis
for (const seite of QA_SEITEN) {
  for (const theme of THEMES) {
    test(`Tastatur ${seite.name} · ${theme}: jedes Element erreichbar, Fokus sichtbar (≥ 2 px, ≥ 3:1)`, async ({ page }) => {
      const konsole = sammleKonsole(page)
      await vorbereiten(page, theme, "normal")
      await ladeSeite(page, seite.url)
      await warteAufRuhe(page)
      // Im schmalen Layout liegen Navigation, Farbschema und Suche im Menü: erst öffnen (wie ein Nutzer)
      const menue = page.getByRole("button", { name: "Menü" })
      if (await menue.isVisible()) await menue.click()
      await page.waitForTimeout(150)

      const erwartet = await tabbareElemente(page)
      expect(erwartet.length, "mindestens Skip-Link, Logo und Navigation").toBeGreaterThan(3)
      await tabStartAmAnfang(page)
      const gesehen = new Set<string>()
      const schlecht: string[] = []
      let erster = ""
      for (let i = 0; i < erwartet.length + 12; i++) {
        await page.keyboard.press("Tab")
        const p = await fokusProbe(page)
        if (!p) break // Fokus hat das Dokument verlassen (Browser-Oberfläche)
        if (p.tag === "astro-dev-toolbar") continue // nur im Dev-Server, nicht Teil der Seite
        if (i === 0) {
          erster = p.id
          expect.soft(p.name, "erstes Element ist der Skip-Link").toBe("Zum Inhalt springen")
        } else if (p.id === erster) break // einmal herum, kein Gefängnis
        if (gesehen.has(p.id)) continue
        gesehen.add(p.id)
        if (!p.sichtbar) schlecht.push(`${p.tag} „${p.name}“ fokussiert, aber nicht sichtbar`)
        const outlineDa = p.outlineStyle !== "none" && p.outlineBreite >= 2
        const schattenDa = p.boxShadow !== "none"
        if (!outlineDa && !schattenDa) {
          schlecht.push(`${p.tag} „${p.name}“: kein Fokusrahmen (outline ${p.outlineStyle} ${p.outlineBreite}px)`)
          continue
        }
        if (outlineDa) {
          const k = kontrast(rgbAusCss(p.outlineFarbe), rgbAusCss(p.hintergrund))
          if (k < 3) schlecht.push(`${p.tag} „${p.name}“: Fokuskontrast ${k.toFixed(2)}:1 (${p.outlineFarbe} auf ${p.hintergrund})`)
        }
      }
      expect.soft(schlecht, "Fokus-Indikator").toEqual([])
      // jedes sichtbare tabbare Element wurde erreicht (Anzahl; Radiogruppen o. ä. zählen im Selektor evtl. mehrfach)
      const nichtErreicht = erwartet.filter((e) => !gesehen.has(e.id)).map((e) => e.name)
      expect.soft(nichtErreicht, "sichtbare, tabbare Elemente ohne Tab-Erreichbarkeit").toEqual([])
      expect.soft(konsole.eintraege, "Konsole").toEqual(seite.url === "/404" ? [FEHLER_404_DOKUMENT] : [])
    })
  }
}

test.describe("Tastatur: Skip-Link, Suche, Menü", () => {
  test("Skip-Link springt in den Hauptbereich, danach liegt der Fokus im Inhalt", async ({ page }) => {
    await vorbereiten(page, "light", "normal")
    await ladeSeite(page, "/about")
    await page.keyboard.press("Tab")
    await expect(page.getByRole("link", { name: "Zum Inhalt springen" })).toBeFocused()
    await page.keyboard.press("Enter")
    await expect.poll(() => page.evaluate(() => location.hash)).toBe("#inhalt")
    await page.keyboard.press("Tab")
    expect(await page.evaluate(() => !!document.activeElement?.closest("main"))).toBe(true)
  })

  test("Suche: Strg/⌘+K öffnet, Tab bleibt bedienbar, Escape schließt und gibt den Fokus zurück", async ({ page }) => {
    await vorbereiten(page, "light", "normal")
    await ladeSeite(page, "/")
    const dialog = page.getByRole("dialog", { name: "Suche" })
    await page.keyboard.press("Control+k")
    await expect(dialog).toBeVisible()
    await expect(page.getByRole("combobox", { name: "Suche" })).toBeFocused()
    for (let i = 0; i < 6; i++) await page.keyboard.press("Tab")
    for (let i = 0; i < 3; i++) await page.keyboard.press("Shift+Tab")
    expect(await page.evaluate(() => !!document.activeElement && document.activeElement !== document.body), "Fokus nicht verloren").toBe(true)
    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    expect(await page.evaluate(() => !!document.activeElement && document.activeElement !== document.body), "Fokus nach Escape zurück").toBe(true)
  })

  test("Menü-Knopf (schmal): per Tastatur auf- und zuklappbar, aria-expanded stimmt", async ({ page }) => {
    await vorbereiten(page, "light", "normal")
    await ladeSeite(page, "/")
    const knopf = page.getByRole("button", { name: "Menü" })
    test.skip(!(await knopf.isVisible()), "Menü-Knopf nur im schmalen Layout sichtbar")
    await knopf.focus()
    await expect(knopf).toHaveAttribute("aria-expanded", "false")
    await page.keyboard.press("Enter")
    await expect(knopf).toHaveAttribute("aria-expanded", "true")
    await page.keyboard.press("Enter")
    await expect(knopf).toHaveAttribute("aria-expanded", "false")
  })
})

// ---------------------------------------------------------------------------------------------
// (6) Kontrast der Token-Paare aus den berechneten Farben
for (const theme of THEMES) {
  test(`Token-Kontrast ${theme}: Übergabe-Paare ≥ 4,5:1, Abweichung zur Übergabe ≤ 0,5`, async ({ page }) => {
    await vorbereiten(page, theme, "normal")
    await ladeSeite(page, "/")
    const meldungen: string[] = []
    const zahlen: string[] = []
    for (const paar of TOKEN_PAARE) {
      const [fg, bg] = await farbenAufloesen(page, [paar.fg, paar.bg])
      const k = kontrast(fg, bg)
      const soll = theme === "light" ? paar.hell : paar.dunkel
      zahlen.push(`${paar.name}: ${k.toFixed(2)} (Übergabe ${soll})`)
      expect.soft(k, `${paar.name} ≥ 4,5:1`).toBeGreaterThanOrEqual(4.5)
      if (Math.abs(k - soll) > 0.5) meldungen.push(`${paar.name}: ${k.toFixed(2)} statt ${soll}`)
    }
    test.info().annotations.push({ type: `kontrast-${theme}`, description: zahlen.join("; ") })
    // Die Tokens sind maßgeblich: eine Abweichung zur Übergabe wird gemeldet (Annotation), nicht als Fehler gewertet
    if (meldungen.length) test.info().annotations.push({ type: `abweichung-${theme}`, description: meldungen.join("; ") })
  })
}

// ---------------------------------------------------------------------------------------------
// (7) Reflow und Textabstände (nur Desktop- und Mobil-Projekt, die Breite wird im Test selbst gesetzt)
test.describe("Reflow und Textabstände", () => {
  test.beforeEach(({}, info) => {
    test.skip(info.project.name === "tablet", "Breite wird im Test gesetzt, Tablet-Projekt wäre doppelt")
  })

  for (const seite of QA_SEITEN) {
    test(`Reflow 320 px ${seite.name}: kein horizontaler Scroll (WCAG 1.4.10)`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 })
      await vorbereiten(page, "light", "reduziert")
      await ladeSeite(page, seite.url)
      await expectNoHorizontalOverflow(page)
    })

    test(`Textabstände ${seite.name}: nichts abgeschnitten oder überlagert (WCAG 1.4.12)`, async ({ page }, info) => {
      await page.setViewportSize({ width: info.project.name === "mobile" ? 390 : 1440, height: 900 })
      await vorbereiten(page, "light", "reduziert")
      await ladeSeite(page, seite.url)
      const messen = () =>
        page.evaluate(() => {
          const p: string[] = []
          const bez = (e: Element) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : ""} „${(e.textContent ?? "").trim().slice(0, 30).replace(/\s+/g, " ")}“`
          const klemmt = (o: string) => o === "hidden" || o === "clip"
          for (const e of Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,li,a,button,summary,label,span"))) {
            if (!e.checkVisibility({ visibilityProperty: true }) || !(e.textContent ?? "").trim()) continue
            // Schriftfeld: dekoratives, aria-hidden HUD mit Auslassungspunkten (siehe QA-Bericht, bewusst nicht gefixt)
            if (e.closest("[data-schriftfeld]")) continue
            const cs = getComputedStyle(e)
            if (klemmt(cs.overflowX) && e.scrollWidth > e.clientWidth + 1) p.push(`${bez(e)} horizontal abgeschnitten`)
            if (klemmt(cs.overflowY) && e.scrollHeight > e.clientHeight + 1) p.push(`${bez(e)} vertikal abgeschnitten`)
            for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
              const ps = getComputedStyle(a)
              if (klemmt(ps.overflowX) || klemmt(ps.overflowY)) {
                const r = e.getBoundingClientRect()
                const ar = a.getBoundingClientRect()
                if (ar.height > 0 && (r.bottom > ar.bottom + 1 || r.top < ar.top - 1) && klemmt(ps.overflowY) && !a.matches("[aria-hidden='true'],[hidden]"))
                  p.push(`${bez(e)} in ${a.tagName.toLowerCase()}.${String(a.className).split(" ")[0]} vertikal abgeschnitten`)
                break
              }
            }
          }
          // Überlagerung: sichtbare Überschrift und Geschwister, deren Kästen sich wirklich schneiden
          for (const h of Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3"))) {
            const n = h.nextElementSibling as HTMLElement | null
            if (!n || !n.checkVisibility()) continue
            if (getComputedStyle(n).position === "absolute" || getComputedStyle(h).position === "absolute") continue
            const a = h.getBoundingClientRect()
            const b = n.getBoundingClientRect()
            const breite = Math.min(a.right, b.right) - Math.max(a.left, b.left)
            const hoehe = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
            if (breite > 1 && hoehe > 1) p.push(`${bez(h)} überlappt ${bez(n)}`)
          }
          return [...new Set(p)]
        })
      // WCAG 1.4.12 verlangt, dass die Abstände KEINEN Verlust verursachen: nur neu Entstandenes zählt (gewollt geklemmte Rahmen wie die Galerie-Streifen nicht)
      const vorher = new Set(await messen())
      await page.addStyleTag({
        content: `*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important}p{margin-bottom:2em !important}`,
      })
      await page.evaluate(() => document.fonts.ready)
      await expectNoHorizontalOverflow(page)
      const probleme = (await messen()).filter((x) => !vorher.has(x)).slice(0, 12)
      expect(probleme).toEqual([])
    })
  }

  test("Textvergrößerung 200 %: halbe Fensterbreite, kein horizontaler Scroll, h1 sichtbar (WCAG 1.4.4, Näherung über Viewport)", async ({ page }) => {
    // Näherung: Browser-Zoom 200 % entspricht der halben CSS-Breite. Echten Zoom kann Playwright nicht auslösen.
    for (const [w, h] of [[720, 450]] as const) {
      await page.setViewportSize({ width: w, height: h })
      await vorbereiten(page, "light", "reduziert")
      for (const url of ["/", "/blog", "/about"]) {
        await ladeSeite(page, url)
        await expectNoHorizontalOverflow(page)
        await expect(page.locator("main h1")).toBeVisible()
      }
    }
  })
})

// ---------------------------------------------------------------------------------------------
// (12) Fehlerseite im Dev-Server und Verhalten bei unbekannten Pfaden (Dist: qa-links.spec.ts)
test("Fehlerseite /404: Status 404, noindex, Wege zurück", async ({ page }) => {
  const res = await page.goto("/404")
  expect(res?.status()).toBe(404)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/)
  await expect(page.locator("main").getByRole("link", { name: "Zur Startseite" })).toBeVisible()
})
