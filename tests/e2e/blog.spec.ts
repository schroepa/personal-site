import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"
import { entwuerfe, jahrVon, veroeffentlichteBeitraege } from "../content"
import { expectNoHorizontalOverflow, expectSingleH1, setTheme } from "../helpers"

const BLOG = "/blog"
const ARTIKEL = "single-source-of-truth-ist-eine-luege" // 8 Zwischentitel, jüngster Beitrag
const MIT_CODE = "design-tokens-in-der-praxis" // Codeblöcke (css)
const LANGES_WORT = "Donaudampfschifffahrtsgesellschaftskapitaensmuetzenherstellungsfabrikationsunternehmen" // 80 Zeichen, ohne Trennstelle
const beitraege = veroeffentlichteBeitraege()

async function laden(page: Page, url = BLOG) {
  await page.goto(url)
  await page.waitForSelector("body[data-bereit]")
}

const sichtbareSlugs = (page: Page) =>
  page.locator("[data-eintrag]").evaluateAll((els) =>
    els.filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => e.getAttribute("data-slug")!)
  )

const chip = (page: Page, name: string) =>
  name === "Alle" ? page.locator("[data-filter-chips] button:not([data-tag])") : page.locator(`[data-filter-chips] button[data-tag="${name}"]`)

test.describe("Blog-Übersicht", () => {
  test("Seitenkopf: genau eine h1, Label „Gedanken“, kein Überlauf", async ({ page }) => {
    await laden(page)
    await expectSingleH1(page)
    await expect(page.locator("main h1")).toHaveText("Notizen über Systeme, Code und Handwerk.")
    await expect(page.locator(".seitenkopf .label")).toContainText("Gedanken")
    await expectNoHorizontalOverflow(page)
  })

  test("Neu zeigt den jüngsten veröffentlichten Beitrag groß, nicht doppelt in den Jahren", async ({ page }) => {
    await laden(page)
    const neu = page.locator("#neu")
    await expect(neu.locator("h2")).toContainText("Neu")
    await expect(neu.locator("[data-eintrag]")).toHaveCount(1)
    await expect(neu.locator("[data-eintrag]")).toHaveAttribute("data-slug", beitraege[0].slug)
    await expect(neu.locator(".artikel-zeile-gross")).toHaveCount(1)
    await expect(page.locator(`[data-eintrag][data-slug="${beitraege[0].slug}"]`)).toHaveCount(1)
    await expect(neu.locator("h3 > a")).toHaveAttribute("href", `/blog/${beitraege[0].slug}`)
  })

  test("Jahresgruppen absteigend, Einträge je Jahr jüngste zuerst, kleine Zeilen mit h3", async ({ page }) => {
    await laden(page)
    const rest = beitraege.slice(1)
    const jahre = [...new Set(rest.map(jahrVon))].sort((a, b) => b - a)
    const ids = await page.locator("main section[id^='jahr-']").evaluateAll((els) => els.map((e) => e.id))
    expect(ids).toEqual(jahre.map((j) => `jahr-${j}`))
    const labels = await page.locator("main section[id^='jahr-'] > h2").evaluateAll((els) => els.map((e) => e.textContent!.replace(/\s+/g, " ").trim()))
    expect(labels).toEqual(jahre.map((j) => `→ ${j}`))
    for (const j of jahre) {
      const slugs = await page.locator(`#jahr-${j} [data-eintrag]`).evaluateAll((els) => els.map((e) => e.getAttribute("data-slug")))
      expect(slugs).toEqual(rest.filter((b) => jahrVon(b) === j).map((b) => b.slug))
      await expect(page.locator(`#jahr-${j} .artikel-zeile-klein`)).toHaveCount(slugs.length)
    }
    // Überschriftenfolge h1 > h2 > h3 ohne Sprung
    const ebenen = await page.locator("main h1, main h2, main h3").evaluateAll((els) => els.map((e) => Number(e.tagName[1])))
    ebenen.reduce((vorher, jetzt) => {
      expect(jetzt - vorher).toBeLessThanOrEqual(1)
      return jetzt
    }, 0)
  })

  test("Drafts erscheinen nicht (Liste, Filter, Route)", async ({ page, request }) => {
    await laden(page)
    const hrefs = (await page.locator("main a").evaluateAll((els) => els.map((e) => e.getAttribute("href") ?? ""))).join(" ")
    const chips = (await page.locator("[data-filter-chips]").textContent()) ?? ""
    expect(entwuerfe().length).toBeGreaterThan(0)
    for (const d of entwuerfe()) {
      expect(hrefs).not.toContain(d)
      const res = await request.get(`/blog/${d}`)
      expect(res.status()).toBe(404)
    }
    expect(chips).not.toContain("UX Writing") // Schlagwort nur am Entwurf
    expect((await sichtbareSlugs(page)).length).toBe(beitraege.length)
  })

  test("Themenfilter: Chips sind Buttons mit aria-pressed, Alle ist vorgewählt", async ({ page }) => {
    await laden(page)
    const alle = page.locator("[data-filter-chips] button")
    const erwartet = new Set(beitraege.flatMap((b) => b.tags))
    await expect(alle).toHaveCount(erwartet.size + 1)
    await expect(chip(page, "Alle")).toHaveAttribute("aria-pressed", "true")
    await expect(chip(page, "CSS")).toHaveAttribute("aria-pressed", "false")
    await expect(page.locator("[data-filter-chips]")).toHaveAttribute("role", "group")
    await expect(page.locator("[data-filter-chips]")).toHaveAttribute("aria-label", "Nach Thema filtern")
  })

  test("Filter blendet aus und wieder ein; Gruppen ohne Treffer verschwinden samt Überschrift", async ({ page }) => {
    await laden(page)
    const tags = [...new Set(beitraege.flatMap((b) => b.tags))]
    for (const tag of tags) {
      await chip(page, tag).click()
      const erwartet = beitraege.filter((b) => b.tags.includes(tag)).map((b) => b.slug)
      expect(await sichtbareSlugs(page), tag).toEqual(erwartet)
      await expect(chip(page, tag)).toHaveAttribute("aria-pressed", "true")
      await expect(chip(page, "Alle")).toHaveAttribute("aria-pressed", "false")
      // Jede Gruppe ist sichtbar, genau wenn sie einen sichtbaren Eintrag hat; die Überschrift geht mit
      const gruppen = await page.locator("[data-gruppe]").evaluateAll((els) =>
        els.map((g) => ({
          id: g.querySelector("section")!.id,
          sichtbar: (g as HTMLElement).offsetParent !== null,
          eintraege: [...g.querySelectorAll("[data-eintrag]")].filter((e) => (e as HTMLElement).offsetParent !== null).length,
          ueberschrift: [...g.querySelectorAll("h2")].some((h) => (h as HTMLElement).offsetParent !== null),
        }))
      )
      for (const g of gruppen) {
        expect(g.sichtbar, `${tag}: ${g.id}`).toBe(g.eintraege > 0)
        expect(g.ueberschrift, `${tag}: Überschrift ${g.id}`).toBe(g.eintraege > 0)
      }
      // Höfliche Ansage der Trefferzahl (role=status)
      await expect(page.getByRole("status").filter({ hasText: /Beitr/ })).toHaveText(erwartet.length === 1 ? "1 Beitrag" : `${erwartet.length} Beiträge`)
    }
    await chip(page, "Alle").click()
    expect((await sichtbareSlugs(page)).length).toBe(beitraege.length)
    await expect(chip(page, "Alle")).toHaveAttribute("aria-pressed", "true")
  })

  test("Schlagwort ohne den jüngsten Beitrag blendet Neu aus; leere Jahre verlieren ihre Überschrift", async ({ page }) => {
    await laden(page)
    const tag = [...new Set(beitraege.flatMap((b) => b.tags))].find((t) => !beitraege[0].tags.includes(t) && beitraege.filter((b) => b.tags.includes(t)).length < beitraege.length)!
    expect(tag).toBeTruthy()
    await chip(page, tag).click()
    await expect(page.locator("#neu")).toBeHidden()
    await expect(page.getByRole("heading", { name: "Neu", level: 2 })).toBeHidden()
    const treffer = beitraege.filter((b) => b.tags.includes(tag))
    const leereJahre = [...new Set(beitraege.slice(1).map(jahrVon))].filter((j) => !treffer.some((b) => jahrVon(b) === j))
    for (const j of leereJahre) {
      await expect(page.locator(`#jahr-${j}`)).toBeHidden()
      await expect(page.getByRole("heading", { name: String(j), level: 2 })).toBeHidden()
    }
    // Jahre mit Treffern bleiben samt Überschrift
    for (const j of new Set(treffer.filter((b) => b !== beitraege[0]).map(jahrVon))) {
      await expect(page.getByRole("heading", { name: String(j), level: 2 })).toBeVisible()
    }
  })

  test("0 Treffer: Hinweis mit role=status, alles ausgeblendet; zurück mit Alle", async ({ page }) => {
    await laden(page)
    await page.locator("[data-filter-chips]").evaluate((el) => {
      const b = document.createElement("button")
      b.type = "button"
      b.setAttribute("data-tag", "Gibt es nicht")
      b.setAttribute("aria-pressed", "false")
      b.textContent = "Gibt es nicht"
      el.appendChild(b)
    })
    await chip(page, "Gibt es nicht").click()
    const status = page.getByRole("status").filter({ hasText: "Keine Beiträge zu diesem Thema." })
    await expect(status).toBeVisible()
    expect(await sichtbareSlugs(page)).toEqual([])
    await expect(page.locator("[data-gruppe]:visible")).toHaveCount(0)
    // Hinweis ist Geschwister der Liste, nicht darin
    expect(await page.locator("[data-filter-leer]").evaluate((el) => el.parentElement === document.querySelector("[data-filter-liste]")!.parentElement)).toBe(true)
    await chip(page, "Alle").click()
    await expect(page.locator("[data-filter-leer]")).toHaveText("")
    expect((await sichtbareSlugs(page)).length).toBe(beitraege.length)
  })

  test("Client-Router: nach Hin- und Rückweg filtert ein Klick genau einmal (keine doppelten Listener)", async ({ page }) => {
    await laden(page)
    await page.locator(`[data-slug="${beitraege[0].slug}"] a`).first().click()
    await page.waitForURL(`**/blog/${beitraege[0].slug}`)
    await page.goBack()
    await page.waitForSelector("body[data-bereit]")
    await page.waitForSelector("[data-filter-chips] button")
    await chip(page, "CSS").click()
    await expect(chip(page, "CSS")).toHaveAttribute("aria-pressed", "true")
    await chip(page, "CSS").click() // zweiter Klick auf denselben Chip hebt den Filter auf (genau einmal ausgelöst)
    await expect(chip(page, "Alle")).toHaveAttribute("aria-pressed", "true")
    expect((await sichtbareSlugs(page)).length).toBe(beitraege.length)
  })

  test("lange zusammengesetzte Titel laufen nicht über", async ({ page }) => {
    await laden(page)
    await page.locator("[data-eintrag] h3 a").first().evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await page.locator("#neu h3 a").evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await page.locator("main h1").evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await expectNoHorizontalOverflow(page)
  })

  test("Kontakt-Panel steht zuletzt vor dem Fuß", async ({ page }) => {
    await laden(page)
    await expect(page.locator("[data-kontakt]")).toHaveCount(1)
    const nachListe = await page.evaluate(() => !!(document.querySelector("[data-filter-liste]")!.compareDocumentPosition(document.querySelector("[data-kontakt]")!) & Node.DOCUMENT_POSITION_FOLLOWING))
    expect(nachListe).toBe(true)
  })

  test("Meta der kleinen Zeilen: Schlagwort und Datum (Figma), die große mit Lesezeit", async ({ page }) => {
    await laden(page)
    await expect(page.locator("#neu .artikel-zeile-gross .meta")).toContainText(/ · \d+ Min\. · /)
    const klein = page.locator(".artikel-zeile-klein .meta").first()
    await expect(klein).not.toContainText("Min.")
    await expect(klein).toContainText(/\d{4}$/)
  })

  test("axe hell und dunkel", async ({ page }) => {
    await laden(page)
    for (const theme of ["light", "dark"] as const) {
      await setTheme(page, theme)
      const result = await new AxeBuilder({ page }).analyze()
      expect(result.violations, theme).toEqual([])
    }
  })
})

test.describe("Blog-Übersicht ohne JavaScript", () => {
  test.use({ javaScriptEnabled: false })

  test("alle Einträge und Gruppen sichtbar, Chips versteckt, Status leer", async ({ page }) => {
    await page.goto(BLOG)
    expect((await sichtbareSlugs(page)).length).toBe(beitraege.length)
    await expect(page.locator("[data-gruppe]:visible")).not.toHaveCount(0)
    await expect(page.locator("[data-filter-chips]")).toBeHidden()
    await expect(page.locator("[data-filter-leer]")).toHaveText("")
    await expectSingleH1(page)
    await expectNoHorizontalOverflow(page)
  })

  test("Artikel ist lesbar: Text, Inhaltsverzeichnis-Links und Weiterlesen sichtbar", async ({ page }) => {
    await page.goto(`/blog/${ARTIKEL}`)
    await expectSingleH1(page)
    await expect(page.locator("[data-prose] p").first()).toBeVisible()
    await expect(page.locator("[data-weiterlesen] a").first()).toBeVisible()
    await expect(page.locator("[data-prose] h2").first()).toBeVisible()
  })
})

test.describe("Artikel", () => {
  const url = `/blog/${ARTIKEL}`

  test("Aufbau: Seitenkopf art=artikel, Titelbild, Text, Weiterlesen, Kontakt-Panel in dieser Reihenfolge", async ({ page }) => {
    await laden(page, url)
    await expectSingleH1(page)
    const b = beitraege.find((x) => x.slug === ARTIKEL)!
    await expect(page.locator("main h1")).toHaveText(b.title)
    await expect(page.locator(".seitenkopf-artikel")).toHaveCount(1)
    await expect(page.locator(".seitenkopf .label")).toContainText(/\d+ Min\. · \d{1,2}\. \w+ \d{4}/)
    const ordnung = await page.evaluate(() => {
      const sel = [".seitenkopf", "[data-titelbild]", "[data-prose]", "[data-weiterlesen]", "[data-kontakt]"]
      const els = sel.map((s) => document.querySelector(s)!)
      return els.every((e, i) => i === 0 || !!(els[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING))
    })
    expect(ordnung).toBe(true)
    await expectNoHorizontalOverflow(page)
  })

  test("Titelbild: Cover des Beitrags, dekorativ, Höhe aus Tokens", async ({ page }) => {
    await laden(page, url)
    const img = page.locator("[data-titelbild] img")
    await expect(img).toHaveAttribute("alt", "")
    await expect(img).toHaveAttribute("src", /\/images\/blog\/blog-014\.webp$/)
    const r = await page.locator("[data-titelbild] .bild").evaluate((el) => {
      const sonde = document.createElement("div")
      const b = innerWidth
      sonde.style.height = `var(${b < 768 ? "--size-240" : b < 1024 ? "--size-360" : "--global-size-640"})`
      document.body.appendChild(sonde)
      const erwartet = getComputedStyle(sonde).height
      sonde.remove()
      return { h: el.getBoundingClientRect().height, erwartet }
    })
    expect(r.h).toBeCloseTo(parseFloat(r.erwartet), 0)
  })

  test("Zwischentitel haben Anker-IDs; Inhaltsverzeichnis listet jedes h2 und springt zum Anker", async ({ page }) => {
    await laden(page, url)
    const h2 = await page.locator("[data-prose] h2").evaluateAll((els) => els.map((e) => ({ id: e.id, text: e.textContent!.trim() })))
    expect(h2.length).toBe(8)
    for (const h of h2) expect(h.id).not.toBe("")
    expect(new Set(h2.map((h) => h.id)).size).toBe(h2.length)
    const nav = page.locator("nav[aria-label='Inhalt']")
    const breit = (page.viewportSize()?.width ?? 0) >= 768
    test.skip(!breit, "Mobil ohne Inhaltsverzeichnis (Figma 266:24481), siehe eigenen Test")
    // Das Verzeichnis steht rechts neben dem Text, nicht darüber
    const nb = (await nav.boundingBox())!
    const pb = (await page.locator("[data-prose]").boundingBox())!
    expect(nb.x).toBeGreaterThanOrEqual(pb.x + pb.width)
    const links = await nav.locator("a").evaluateAll((els) => els.map((e) => ({ href: e.getAttribute("href"), text: e.textContent!.trim() })))
    expect(links).toEqual(h2.map((h) => ({ href: `#${h.id}`, text: h.text })))
    // Klick auf den letzten Eintrag: Hash gesetzt, Überschrift im sichtbaren Bereich, mit Abstand zum oberen Rand
    const ziel = h2[h2.length - 1]
    await nav.locator("a").last().click()
    await expect(page).toHaveURL(new RegExp(`#${ziel.id}$`))
    const heading = page.locator(`[data-prose] h2#${ziel.id}`)
    await expect.poll(async () => (await heading.boundingBox())!.y, { message: "scrollt zur Überschrift" }).toBeGreaterThanOrEqual(0)
    const m = await heading.evaluate((el) => {
      const r = el.getBoundingClientRect()
      const feld = document.querySelector("[data-schriftfeld]")!.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom, margin: parseFloat(getComputedStyle(el).scrollMarginTop), feldTop: feld.top, innen: innerHeight }
    })
    expect(m.margin).toBeGreaterThan(0)
    // Versatz: die Überschrift liegt um den scroll-margin unter dem oberen Rand, nie bündig oder darüber
    expect(m.top).toBeGreaterThanOrEqual(m.margin - 1)
    expect(m.top).toBeLessThan(m.innen)
    // und sie liegt vollständig über dem festen Schriftfeld
    expect(m.bottom).toBeLessThan(m.feldTop)
    expect(m.bottom).toBeGreaterThan(0)
    await expect(nav.locator("a[aria-current='true']")).toHaveCount(1)
  })

  test("Mobil: kein Inhaltsverzeichnis, Zwischentitel bleiben mit Anker", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) >= 768, "nur Mobil")
    await laden(page, url)
    await expect(page.locator("nav[aria-label='Inhalt']")).toBeHidden()
    await expect(page.locator("[data-prose] h2").first()).toHaveAttribute("id", /.+/)
  })

  test("Textspalte ist höchstens 7 von 9 Spalten breit (tatsächlich 7, Tablet 6 von 8)", async ({ page }) => {
    await laden(page, url)
    // Subgrid löst die Spuren im berechneten Stil nicht auf: Spuren und Abstand kommen vom Raster des Abschnitts,
    // die Zahl der Spalten des Textblocks aus seinen Subgrid-Linien
    const m = await page.locator("[data-artikel-inhalt]").evaluate((raster) => {
      const sub = getComputedStyle(raster).gridTemplateColumns.split(" ").filter((t) => t === "[]").length - 1 // n Spalten haben n + 1 Linien
      const abschnitt = getComputedStyle(raster.closest("section")!)
      const alle = abschnitt.gridTemplateColumns.split(" ").map(parseFloat)
      const prose = (raster.querySelector("[data-prose]") as HTMLElement).getBoundingClientRect()
      return { spuren: alle.slice(alle.length - sub), abstand: parseFloat(abschnitt.columnGap), breite: prose.width, gesamt: raster.getBoundingClientRect().width }
    })
    const n = m.spuren.length
    if (n === 4) {
      expect(m.breite).toBeCloseTo(m.gesamt, 0) // Mobil: volle Breite
      return
    }
    const k = n === 9 ? 7 : 6
    const erwartet = m.spuren.slice(0, k).reduce((a, b) => a + b, 0) + (k - 1) * m.abstand
    expect(m.breite).toBeCloseTo(erwartet, 0)
    expect(k / n).toBeLessThanOrEqual(7 / 9)
  })

  test("Weiterlesen: zwei Zeilen, jüngste andere Beiträge, nie der aktuelle", async ({ page }) => {
    await laden(page, url)
    const slugs = await page.locator("[data-weiterlesen] [data-eintrag]").evaluateAll((els) => els.map((e) => e.getAttribute("data-slug")))
    const erwartet = beitraege.filter((b) => b.slug !== ARTIKEL).slice(0, 2).map((b) => b.slug)
    expect(slugs).toEqual(erwartet)
    expect(slugs).not.toContain(ARTIKEL)
    await expect(page.locator("[data-weiterlesen] section > h2")).toContainText("Weiterlesen")
    await expect(page.locator("[data-weiterlesen] h3 > a")).toHaveCount(slugs.length)
    // auch beim ältesten Beitrag: nie der aktuelle
    const aeltester = beitraege[beitraege.length - 1].slug
    await laden(page, `/blog/${aeltester}`)
    const s2 = await page.locator("[data-weiterlesen] [data-eintrag]").evaluateAll((els) => els.map((e) => e.getAttribute("data-slug")))
    expect(s2).toHaveLength(2)
    expect(s2).not.toContain(aeltester)
  })

  test("Keine Silbentrennung in Titeln (Seitenkopf, Zeilen, Prosa), lange Wörter laufen trotzdem nicht über", async ({ page }) => {
    await laden(page, url)
    for (const sel of ["main h1", "[data-weiterlesen] h3", "[data-prose] h2", "[data-prose] p"]) {
      expect(await page.locator(sel).first().evaluate((el) => getComputedStyle(el).hyphens), sel).not.toBe("auto")
    }
    await laden(page, BLOG)
    for (const sel of ["main h1", "#neu h3", ".artikel-zeile-klein h3"]) {
      expect(await page.locator(sel).first().evaluate((el) => getComputedStyle(el).hyphens), sel).not.toBe("auto")
    }
    await page.locator(".artikel-zeile-klein h3 a").first().evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await expectNoHorizontalOverflow(page)
  })

  test("Startseite: Zeilen, Karten und Galerie trennen nicht, langer Titel läuft nicht über", async ({ page }) => {
    await laden(page, "/")
    for (const sel of ["#gedanken h3", "#arbeit h3", "#digital-art [data-galerie-akkordeon]"]) {
      expect(await page.locator(sel).first().evaluate((el) => getComputedStyle(el).hyphens), sel).not.toBe("auto")
    }
    await page.locator("#gedanken h3 a").first().evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await page.locator("#arbeit h3 a").first().evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await expectNoHorizontalOverflow(page)
  })

  test("Lange Titel laufen im Artikelkopf nicht über", async ({ page }) => {
    await laden(page, url)
    await page.locator("main h1").evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await page.locator("[data-weiterlesen] h3 a").first().evaluate((el, t) => (el.textContent = t), LANGES_WORT)
    await expectNoHorizontalOverflow(page)
  })

  test("Prosa: Codeblock nutzt Fläche, Radius und Abstand aus Figma, Text läuft nicht über", async ({ page }) => {
    await laden(page, `/blog/${MIT_CODE}`)
    const pre = page.locator("[data-prose] pre").first()
    await expect(pre).toBeVisible()
    const r = await pre.evaluate((el) => {
      const sonde = document.createElement("div")
      sonde.style.background = "var(--code-block-background)"
      // Figma-Screen 266:23589 (nicht der Atom-Radius 8): verschachtelter Radius, Innenabstand 16/24
      sonde.style.borderRadius = "var(--objekt-radius-verschachtelt)"
      sonde.style.padding = "var(--global-size-16) var(--global-size-24)"
      document.body.appendChild(sonde)
      const s = getComputedStyle(sonde)
      const erwartet = { bg: s.backgroundColor, radius: s.borderTopLeftRadius, padding: s.paddingTop }
      sonde.remove()
      const cs = getComputedStyle(el)
      const code = el.querySelector("code")!
      const span = code.querySelector("span") as HTMLElement | null
      return { bg: cs.backgroundColor, radius: cs.borderTopLeftRadius, padding: cs.paddingTop, erwartet, spanFarbe: span ? getComputedStyle(span).color : null, codeFarbe: getComputedStyle(code).color, font: getComputedStyle(code).fontFamily }
    })
    expect(r.bg).toBe(r.erwartet.bg)
    expect(r.radius).toBe(r.erwartet.radius)
    expect(r.padding).toBe(r.erwartet.padding)
    expect(r.font).toContain("Geist Mono")
    if (r.spanFarbe) expect(r.spanFarbe).toBe(r.codeFarbe) // keine Fremdfarben aus dem Syntax-Highlighting
    await expectNoHorizontalOverflow(page)
  })

  test("axe hell und dunkel (Artikel mit Codeblöcken und eingefügtem Zitat)", async ({ page }) => {
    await laden(page, `/blog/${MIT_CODE}`)
    // Kein Beitrag enthält ein Zitat; für den Kontrast-Test eines einfügen
    await page.locator("[data-prose] p").first().evaluate((p) => {
      const q = document.createElement("blockquote")
      q.innerHTML = "<p>Nicht eine Wahrheit, die man behauptet, sondern drei.</p>"
      p.after(q)
    })
    for (const theme of ["light", "dark"] as const) {
      await setTheme(page, theme)
      const result = await new AxeBuilder({ page }).analyze()
      expect(result.violations, theme).toEqual([])
    }
  })

  test("Inline-Code, Link und Liste im Text sind gestaltet (Tokens)", async ({ page }) => {
    await laden(page, "/blog/tailwind-v4-design-tokens")
    const code = page.locator("[data-prose] p code").first()
    const r = await code.evaluate((el) => {
      const s = getComputedStyle(el)
      const sonde = document.createElement("span")
      sonde.style.background = "var(--inline-code-background)"
      sonde.style.borderRadius = "var(--inline-code-radius)"
      document.body.appendChild(sonde)
      const e = getComputedStyle(sonde)
      const out = { bg: s.backgroundColor, radius: s.borderTopLeftRadius, eb: e.backgroundColor, er: e.borderTopLeftRadius, font: s.fontFamily }
      sonde.remove()
      return out
    })
    expect(r.bg).toBe(r.eb)
    expect(r.radius).toBe(r.er)
    expect(r.font).toContain("Geist Mono")
    await expectNoHorizontalOverflow(page)
  })
})

test.describe("Alle veröffentlichten Artikel", () => {
  test("jede Route: 200, genau eine h1, JSON-LD parsebar, OG-Artikel-Metadaten", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Routenprüfung einmal reicht")
    test.setTimeout(240_000)
    for (const b of beitraege) {
      const res = await page.goto(`/blog/${b.slug}`)
      expect(res?.status(), b.slug).toBe(200)
      await expect(page.locator("main h1"), b.slug).toHaveCount(1)
      const ld = await page.locator('script[type="application/ld+json"]').evaluateAll((els) => els.map((e) => e.textContent ?? ""))
      expect(ld.length, b.slug).toBeGreaterThanOrEqual(1)
      const daten = ld.map((t) => JSON.parse(t))
      const art = daten.find((d) => d["@type"] === "BlogPosting")
      expect(art, `${b.slug}: BlogPosting`).toBeTruthy()
      expect(art.headline).toBe(b.title)
      expect(art.url).toBe(`https://www.ptrckschrdtr.de/blog/${b.slug}`)
      expect(art.datePublished).toContain(b.date)
      const meta = (n: string) => page.locator(`meta[property="${n}"]`).getAttribute("content")
      expect(await meta("og:type"), b.slug).toBe("article")
      expect(await meta("article:published_time"), b.slug).toContain(b.date)
      expect(await meta("article:author"), b.slug).toBe("Patrick Schröder")
      await expect(page.locator('meta[property="article:tag"]'), b.slug).toHaveCount(b.tags.length)
      await expect(page.locator('link[rel="canonical"]'), b.slug).toHaveAttribute("href", `https://www.ptrckschrdtr.de/blog/${b.slug}`)
      expect(await meta("og:image"), b.slug).toMatch(/^https:\/\/www\.ptrckschrdtr\.de\//)
      // Zwischentitel mit eindeutigen Ankern
      const ids = await page.locator("[data-prose] h2").evaluateAll((els) => els.map((e) => e.id))
      expect(ids.every(Boolean), b.slug).toBe(true)
      expect(new Set(ids).size, b.slug).toBe(ids.length)
    }
  })

  test("Übersicht: og:type website, kein Artikel-Metadatum", async ({ page }) => {
    await page.goto(BLOG)
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website")
    await expect(page.locator('meta[property="article:published_time"]')).toHaveCount(0)
  })
})
