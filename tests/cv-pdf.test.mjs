import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { join } from "node:path"

// Prüft das gebaute dist/cv.pdf (postbuild: scripts/generate-cv-pdf.mjs). Ohne PDF lokal begründet übersprungen, in CI Fehler.
const pdfPfad = join(process.cwd(), "dist", "cv.pdf")
const vorhanden = existsSync(pdfPfad)
if (!vorhanden && process.env.CI) throw new Error("dist/cv.pdf fehlt: in CI vor test:scripts `npm run build` ausführen")
const grund = "dist/cv.pdf fehlt: übersprungen (lokal). Zum Prüfen erst `npm run build`, in CI ist das Pflicht."

/** Seitenzahl: Objekte „/Type /Page“, aber nicht „/Type /Pages“. */
export function seitenZahl(pdf) {
  return (pdf.match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length
}

/** Titel aus dem Info-Dictionary (Literal oder UTF-16BE-Hex). */
export function pdfTitel(pdf) {
  const hex = pdf.match(/\/Title\s*<([0-9A-Fa-f]+)>/)
  if (hex) {
    const b = Buffer.from(hex[1], "hex")
    return b.subarray(0, 2).equals(Buffer.from([0xfe, 0xff])) ? b.subarray(2).swap16().toString("utf16le") : b.toString("latin1")
  }
  const lit = pdf.match(/\/Title\s*\(((?:\\.|[^\\)])*)\)/)
  if (lit) {
    const b = Buffer.from(lit[1], "latin1")
    return b.subarray(0, 2).equals(Buffer.from([0xfe, 0xff])) ? b.subarray(2).swap16().toString("utf16le") : b.toString("latin1")
  }
  return null
}

test("seitenZahl und pdfTitel: lesen Beispielobjekte", () => {
  assert.equal(seitenZahl("<< /Type /Pages /Count 2 >> << /Type /Page >> << /Type /Page >>"), 2)
  assert.equal(pdfTitel("/Title (Lebenslauf)"), "Lebenslauf")
  assert.equal(pdfTitel("/Title <FEFF004C0065>"), "Le")
  assert.equal(pdfTitel("nichts"), null)
})

test("dist/cv.pdf: gültiges PDF, höchstens 3 Seiten, Titel mit Namen", { skip: vorhanden ? false : grund }, () => {
  const buf = readFileSync(pdfPfad)
  assert.equal(buf.subarray(0, 4).toString(), "%PDF")
  assert.ok(buf.length > 20_000, `PDF auffällig klein: ${buf.length} Bytes`)
  const text = buf.toString("latin1")
  const seiten = seitenZahl(text)
  assert.ok(seiten >= 1 && seiten <= 3, `Seitenzahl ${seiten}`)
  assert.match(pdfTitel(text) ?? "", /Lebenslauf.*Patrick Schr/)
})

const hatPdftotext = spawnSync("pdftotext", ["-v"]).error === undefined
// In CI muss pdftotext (poppler-utils) da sein: sonst bliebe die Textprüfung dort stillschweigend aus
if (vorhanden && !hatPdftotext && process.env.CI) throw new Error("pdftotext fehlt: in CI poppler-utils installieren")
test(
  "dist/cv.pdf: Text enthält Name und mehrere Einträge aus cv.ts, keinen Seitenrahmen (pdftotext)",
  { skip: !vorhanden ? grund : hatPdftotext ? false : "pdftotext nicht installiert: lokal übersprungen (Titel- und Seitenprüfung laufen trotzdem), in CI Pflicht" },
  async () => {
    const { cvData } = await import("../src/data/cv.ts")
    const r = spawnSync("pdftotext", ["-layout", pdfPfad, "-"], { encoding: "utf8" })
    // Zeilenumbrüche und Silbentrennung einebnen, damit lange Sätze nicht an Umbrüchen scheitern
    // Meta-Spalten stehen per text-transform in Großbuchstaben: ohne Groß-/Kleinschreibung vergleichen
    const text = r.stdout.replace(/\s+/g, " ").toLowerCase()
    const erwartet = [
      cvData.name,
      cvData.experience[0].company.split(" — ")[0],
      cvData.experience.at(-1).company,
      cvData.projects[0].title,
      cvData.projects.at(-1).title,
      cvData.techStack[0].category,
      cvData.education[0].title,
      cvData.languages[0].name,
      cvData.languages.at(-1).name,
    ]
    for (const e of erwartet) assert.ok(text.includes(e.toLowerCase()), `fehlt im PDF: ${e}`)
    assert.ok(!/zum inhalt springen|hauptnavigation|ptrckschrdtr|impressum|datenschutz/.test(text), "Seitenrahmen im PDF")
  }
)
