import { test } from "node:test"
import assert from "node:assert/strict"
import vm from "node:vm"
import { kopfSkript, KOPF_SKRIPT_PFAD } from "./kopf-skript.ts"
import { posthogSkript, POSTHOG_SKRIPT_PFAD } from "./posthog-skript.ts"
import { MOTION_WATCHDOG_MS } from "./motion/gate.ts"

/** Minimaler Browser für die serialisierten Skripte: Attribute an <html>, localStorage, matchMedia, Timer, Events, <script>-Einfügen. */
function umgebung({ gespeichert = null, systemDunkel = false, reduziert = false, cookiebot } = {}) {
  const attr = new Map()
  const timer = []
  const hoerer = new Map()
  const eingefuegt = []
  const ersterSkript = { parentNode: { insertBefore: (el) => eingefuegt.push(el) } }
  const window = {
    localStorage: { getItem: (k) => (k === "theme" ? gespeichert : null) },
    matchMedia: (q) => ({ matches: q.includes("dark") ? systemDunkel : q.includes("reduced-motion") ? reduziert : false }),
    setTimeout: (fn, ms) => (timer.push({ fn, ms }), timer.length),
    addEventListener: (typ, fn) => hoerer.set(typ, [...(hoerer.get(typ) ?? []), fn]),
    document: {
      documentElement: { setAttribute: (k, v) => attr.set(k, v), removeAttribute: (k) => attr.delete(k) },
      createElement: () => ({}),
      getElementsByTagName: () => [ersterSkript],
    },
    Array,
  }
  if (cookiebot) window.Cookiebot = cookiebot
  window.window = window
  const ctx = vm.createContext(window)
  return { ctx, attr, timer, hoerer, eingefuegt, window, feuern: (typ) => (hoerer.get(typ) ?? []).forEach((fn) => fn()) }
}

test("Pfade der Dateien", () => {
  assert.equal(KOPF_SKRIPT_PFAD, "/js/kopf.js")
  assert.equal(POSTHOG_SKRIPT_PFAD, "/js/posthog.js")
})

test("kopfSkript: gespeichert dunkel ⇒ data-theme dark, data-js, data-motion, Watchdog mit MOTION_WATCHDOG_MS", () => {
  const u = umgebung({ gespeichert: "dark" })
  vm.runInContext(kopfSkript(), u.ctx)
  assert.equal(u.attr.get("data-theme"), "dark")
  assert.equal(u.attr.get("data-js"), "")
  assert.equal(u.attr.get("data-motion"), "")
  assert.equal(u.timer.length, 1)
  assert.equal(u.timer[0].ms, MOTION_WATCHDOG_MS)
  u.timer[0].fn()
  assert.equal(u.attr.has("data-motion"), false, "Watchdog nimmt das Gate wieder weg")
})

test("kopfSkript: nichts gespeichert ⇒ System; gespeichert hell schlägt System dunkel; reduzierte Bewegung ⇒ kein Gate", () => {
  const sys = umgebung({ systemDunkel: true })
  vm.runInContext(kopfSkript(), sys.ctx)
  assert.equal(sys.attr.get("data-theme"), "dark")
  const hell = umgebung({ gespeichert: "light", systemDunkel: true, reduziert: true })
  vm.runInContext(kopfSkript(), hell.ctx)
  assert.equal(hell.attr.get("data-theme"), "light")
  assert.equal(hell.attr.has("data-motion"), false)
  assert.equal(hell.timer.length, 0)
})

test("posthogSkript: ohne Einwilligung wird nichts geladen, auch nicht nach Ablehnen", () => {
  const u = umgebung({ cookiebot: { consent: { statistics: false } } })
  vm.runInContext(posthogSkript("phc_test", "https://eu.i.posthog.com"), u.ctx)
  assert.deepEqual(u.eingefuegt, [])
  assert.equal(u.window.posthog, undefined)
  u.feuern("CookiebotOnAccept") // Zustimmung nur zu „notwendig“
  assert.deepEqual(u.eingefuegt, [])
})

test("posthogSkript: Einwilligung besteht ⇒ array.js vom PostHog-Host, einmal; spätere Zustimmung lädt nicht doppelt", () => {
  const cookiebot = { consent: { statistics: true } }
  const u = umgebung({ cookiebot })
  vm.runInContext(posthogSkript("phc_test", "https://eu.i.posthog.com"), u.ctx)
  assert.equal(u.eingefuegt.length, 1)
  assert.equal(u.eingefuegt[0].src, "https://eu.i.posthog.com/static/array.js")
  assert.equal(u.eingefuegt[0].crossOrigin, "anonymous")
  u.feuern("CookiebotOnAccept")
  assert.equal(u.eingefuegt.length, 1)
  // init wurde mit Token und Einstellungen in die Warteschlange gelegt
  const [token, opts] = u.window.posthog._i[0]
  assert.equal(token, "phc_test")
  assert.equal(opts.api_host, "https://eu.i.posthog.com")
  assert.equal(opts.capture_pageview, "history_change")
})

test("posthogSkript: Zustimmung im Banner (CookiebotOnAccept mit Statistik) lädt PostHog", () => {
  const cookiebot = { consent: { statistics: false } }
  const u = umgebung({ cookiebot })
  vm.runInContext(posthogSkript("phc_test", "https://eu.i.posthog.com"), u.ctx)
  assert.equal(u.eingefuegt.length, 0)
  cookiebot.consent.statistics = true
  u.feuern("CookiebotOnAccept")
  assert.equal(u.eingefuegt.length, 1)
})

test("posthogSkript: Werte werden als JSON eingesetzt (kein Code aus Umgebungsvariablen)", () => {
  const boese = `"); alert(1); ("`
  const text = posthogSkript(boese, undefined)
  assert.ok(text.includes(JSON.stringify(boese)))
  assert.ok(text.includes(`var apiHost = ""`))
  assert.doesNotThrow(() => new vm.Script(text))
})
