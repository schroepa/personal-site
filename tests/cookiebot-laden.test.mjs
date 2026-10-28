import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

// Cookiebot lädt asynchron (Performance, siehe SiteLayout.astro). Sicherstellen, dass das so bleibt und das PostHog-Gate
// auch auf CookiebotOnConsentReady hört, weil uc.js dann nach posthog.js eintreffen kann. Das Verhalten im Browser prüft csp.spec.ts.
const dist = join(process.cwd(), "dist")
const vorhanden = existsSync(join(dist, "index.html"))
if (!vorhanden && process.env.CI) throw new Error("dist/ fehlt: in CI vor test:scripts `npm run build` ausführen")
const grund = "dist/ fehlt: übersprungen (lokal)."

test("uc.js ist asynchron, steht im <head> und hat ein Preconnect", { skip: vorhanden ? false : grund }, () => {
  const html = readFileSync(join(dist, "index.html"), "utf8")
  const kopf = html.slice(0, html.indexOf("</head>"))
  const tag = kopf.match(/<script[^>]*id="Cookiebot"[^>]*>/)?.[0]
  assert.ok(tag, "Cookiebot-Skript im Kopf")
  assert.match(tag, /\sasync[\s>=]/)
  assert.match(tag, /src="https:\/\/consent\.cookiebot\.com\/uc\.js"/)
  assert.match(tag, /data-blockingmode="manual"/, "deterministisch: kein Auto-Blocking bei asynchronem Laden")
  assert.match(kopf, /<link rel="preconnect" href="https:\/\/consent\.cookiebot\.com"/)
})

// Das erzeugte PostHog-Skript (src/scripts/posthog-skript.ts) läuft hier in node:vm gegen ein Fake-window: Ereignisse von Cookiebot werden
// von Hand ausgelöst, jeder Skript-Einschub (array.js von PostHog) wird gezählt, es gibt keine echten Anfragen.
import vm from "node:vm"
import { posthogSkript } from "../src/scripts/posthog-skript.ts"

function umgebung({ vorher } = {}) {
  const hoerer = {}
  const eingefuegt = []
  const w = {
    addEventListener: (name, fn) => (hoerer[name] ??= []).push(fn),
    dispatch: (name) => (hoerer[name] ?? []).forEach((fn) => fn({})),
  }
  w.window = w
  w.document = {
    createElement: () => ({}),
    getElementsByTagName: () => [{ parentNode: { insertBefore: (el) => eingefuegt.push(el.src) } }],
  }
  if (vorher) w.Cookiebot = { consent: { statistics: vorher.statistics } }
  vm.createContext(w)
  vm.runInContext(posthogSkript("phc_test", "https://eu.i.posthog.com"), w)
  const aufrufe = () => (w.posthog ?? []).filter((e) => Array.isArray(e)).map((e) => e[0])
  const consent = (statistics) => (w.Cookiebot = { consent: { statistics } })
  return { w, eingefuegt, consent, aufrufe }
}

test("Gate: Einwilligung besteht schon beim Start, PostHog lädt genau einmal", () => {
  const u = umgebung({ vorher: { statistics: true } })
  assert.equal(u.eingefuegt.length, 1)
  assert.equal(u.eingefuegt[0], "https://eu.i.posthog.com/static/array.js")
  u.w.dispatch("CookiebotOnConsentReady")
  u.w.dispatch("CookiebotOnAccept")
  assert.equal(u.eingefuegt.length, 1)
})

test("Gate: ohne Einwilligung lädt PostHog nie (kein Cookiebot, Statistik aus, Ereignisse ohne Statistik)", () => {
  const u = umgebung()
  u.w.dispatch("CookiebotOnConsentReady") // uc.js noch nicht da: nichts zu lesen
  u.w.dispatch("CookiebotOnAccept")
  u.consent(false)
  u.w.dispatch("CookiebotOnConsentReady")
  u.w.dispatch("CookiebotOnAccept")
  u.w.dispatch("CookiebotOnDecline")
  assert.equal(u.eingefuegt.length, 0)
  assert.equal(u.w.posthog, undefined)
})

test("Gate: uc.js trifft später ein, nur CookiebotOnConsentReady kommt (kein OnAccept): PostHog startet bei Einwilligung", () => {
  const u = umgebung()
  u.consent(true)
  u.w.dispatch("CookiebotOnConsentReady")
  assert.equal(u.eingefuegt.length, 1)
  assert.equal(u.eingefuegt[0], "https://eu.i.posthog.com/static/array.js")
})

test("Gate: nur CookiebotOnAccept (Erstzustimmung im Banner) startet PostHog", () => {
  const u = umgebung()
  u.consent(true)
  u.w.dispatch("CookiebotOnAccept")
  assert.equal(u.eingefuegt.length, 1)
})

test("Gate: Widerruf nach dem Laden schaltet PostHog aus, erneute Einwilligung wieder ein, ohne zweites Laden", () => {
  const u = umgebung({ vorher: { statistics: true } })
  assert.equal(u.eingefuegt.length, 1)
  u.consent(false)
  u.w.dispatch("CookiebotOnAccept") // Änderung der Auswahl meldet sich auch als Accept/ConsentReady
  assert.equal(u.aufrufe().filter((n) => n === "opt_out_capturing").length, 1)
  u.consent(true)
  u.w.dispatch("CookiebotOnAccept")
  assert.equal(u.aufrufe().filter((n) => n === "opt_in_capturing").length, 1)
  assert.equal(u.eingefuegt.length, 1, "nicht ein zweites Mal geladen")
  u.consent(false)
  u.w.dispatch("CookiebotOnDecline")
  assert.equal(u.aufrufe().filter((n) => n === "opt_out_capturing").length, 2)
})

test("Gate: dieselbe Einwilligung als ConsentReady und Accept löst nie opt_in_capturing aus (uc.js früh und spät)", () => {
  for (const frueh of [true, false]) {
    const u = umgebung(frueh ? { vorher: { statistics: true } } : undefined)
    u.consent(true)
    u.w.dispatch("CookiebotOnConsentReady")
    u.w.dispatch("CookiebotOnAccept")
    assert.equal(u.eingefuegt.length, 1, frueh ? "früh" : "spät")
    assert.equal(u.aufrufe().filter((n) => n === "opt_in_capturing").length, 0, `${frueh ? "früh" : "spät"}: kein opt_in`)
  }
})

test("Gate: opt_in nach eigenem Widerruf immer ohne $opt_in-Ereignis (captureEventName: false)", () => {
  const u = umgebung({ vorher: { statistics: true } })
  u.consent(false)
  u.w.dispatch("CookiebotOnDecline")
  u.consent(true)
  u.w.dispatch("CookiebotOnAccept")
  const opt = u.w.posthog.filter((e) => Array.isArray(e) && e[0] === "opt_in_capturing")
  assert.equal(opt.length, 1)
  assert.equal(opt[0][1].captureEventName, false)
})

test("Gate: dauerhaftes Opt-out aus früherem Widerruf, Wiederzustimmung mit nur einem Ereignis: genau ein opt_in ohne Ereignis (loaded-Callback)", () => {
  const u = umgebung()
  u.consent(true)
  u.w.dispatch("CookiebotOnConsentReady") // Cookiebot meldet nur dieses eine Ereignis
  const konfig = u.w.posthog._i[0][1]
  assert.equal(typeof konfig.loaded, "function")
  const aufrufe = []
  const ph = { has_opted_out_capturing: () => true, opt_in_capturing: (o) => aufrufe.push(o) }
  konfig.loaded(ph) // die echte Bibliothek ruft das nach dem Laden auf und kennt das gespeicherte Opt-out
  assert.equal(aufrufe.length, 1)
  assert.equal(aufrufe[0].captureEventName, false)
  // Nicht ausgeschaltet gespeichert: kein opt_in
  const ph2 = { has_opted_out_capturing: () => false, opt_in_capturing: (o) => aufrufe.push(o) }
  konfig.loaded(ph2)
  assert.equal(aufrufe.length, 1)
})

test("Gate: loaded-Callback schaltet nicht ein, wenn die Statistik inzwischen aus ist", () => {
  const u = umgebung({ vorher: { statistics: true } })
  const konfig = u.w.posthog._i[0][1]
  u.consent(false)
  const aufrufe = []
  konfig.loaded({ has_opted_out_capturing: () => true, opt_in_capturing: (o) => aufrufe.push(o) })
  assert.equal(aufrufe.length, 0)
})
