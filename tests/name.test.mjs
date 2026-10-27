import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

/**
 * Der Name schreibt sich „Schrödter“ (Spec §7). „Schröder“ (auch „Schroeder“) darf in versionierten Dateien
 * nur dort stehen, wo der alte Wert absichtlich zitiert wird. Jeder Eintrag braucht einen Grund.
 */
const ERLAUBT = [
  // Prüfen selbst, dass „Schröder“ NICHT vorkommt (der Wert steht dort als Suchmuster)
  { pfad: "tests/name.test.mjs", grund: "dieser Test: Suchmuster und Erklärung" },
  { pfad: "tests/rechtliches.test.mjs", grund: "assertet, dass der Rechtstext „Schröder“ nicht enthält" },
  { pfad: "tests/e2e/rechtliches.spec.ts", grund: "assertet, dass Impressum und Datenschutz „Schröder“ nicht enthalten" },
  // Pläne und Spezifikationen zitieren den alten Wert als Beispiel bzw. als Aufgabe („Schröder → Schrödter“)
  { pfad: "docs/superpowers/", grund: "Plan- und Spec-Dokumente (Verlauf) zitieren die alte Schreibweise" },
]

/** Alle Fundstellen „Schröder“/„Schroeder“ in versionierten Dateien, ohne erlaubte Pfade. */
export function unerlaubteTreffer(ausgabe, erlaubt = ERLAUBT) {
  // NFC: zerlegtes „ö“ (o + U+0308) soll nicht an der Erlaubnisliste oder dem Muster vorbeirutschen
  return ausgabe
    .normalize("NFC")
    .split("\n")
    .filter(Boolean)
    .filter((zeile) => !erlaubt.some((e) => zeile.startsWith(e.pfad)))
}

test("unerlaubteTreffer: Präfixe aus der Erlaubnisliste werden ausgenommen", () => {
  const text = "src/a.ts:1:Schröder\ndocs/superpowers/x.md:2:Schröder\ntests/name.test.mjs:3:Schröder"
  assert.deepEqual(unerlaubteTreffer(text), ["src/a.ts:1:Schröder"])
})

/** Das Suchmuster kennt „ö“ als ein Zeichen (NFC) und zerlegt (o + U+0308, NFD). */
const MUSTER = /[Ss][Cc][Hh][Rr](ö|Ö|oe|OE|Oe|o\u0308|O\u0308)[Dd][Ee][Rr]/

test("das Muster erkennt auch zerlegtes (NFD) „Schröder“", () => {
  assert.ok(MUSTER.test("Schro\u0308der".normalize("NFD")))
  assert.ok(MUSTER.test("Schröder"))
  assert.ok(!MUSTER.test("Schrödter"))
})

test("die Erlaubnisliste ist klein und begründet", () => {
  assert.ok(ERLAUBT.length <= 5)
  for (const e of ERLAUBT) assert.ok(e.grund.length > 10, e.pfad)
})

test("„Schröder“ kommt in versionierten Dateien nur in der Erlaubnisliste vor (richtig: Schrödter)", () => {
  const r = spawnSync("git", ["grep", "-n", "-I", "-E", "[Ss][Cc][Hh][Rr](ö|Ö|oe|OE|Oe|o\u0308|O\u0308)[Dd][Ee][Rr]", "--", ".", ":!package-lock.json"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
  assert.ok(!r.error, `git grep nicht ausführbar: ${r.error?.message}`)
  // Exit 1 = keine Treffer (gut), 0 = Treffer, alles andere ist ein Fehler
  assert.ok(r.status === 0 || r.status === 1, `git grep Exit ${r.status}: ${r.stderr}`)
  const treffer = unerlaubteTreffer(r.stdout)
  assert.deepEqual(treffer, [], `„Schröder“ statt „Schrödter“:\n${treffer.join("\n")}`)
})
