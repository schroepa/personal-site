import { chromium } from 'playwright'
import sparticuzChromium from '@sparticuz/chromium'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const PORT = 4823
const BASE_URL = `http://localhost:${PORT}`
const OUTPUT_PATH = path.join(projectRoot, 'dist', 'cv.pdf')
const ASTRO_BIN = path.join(projectRoot, 'node_modules', '.bin', 'astro')

// Auf Vercel scheitert Playwrights eigenes Chromium-Binary am Start, weil dem
// Build-Container Shared Libraries fehlen, die Chromium normalerweise vom
// Betriebssystem erwartet (libnss3 & co.) — reine --no-sandbox-Flags reichen
// dafür nicht, das Binary crasht schon vorher. @sparticuz/chromium liefert ein
// statisch gelinktes Chromium samt der in Serverless-/Build-Containern nötigen
// Flags und behebt das zuverlässig.
async function launchBrowser() {
  if (process.env.VERCEL) {
    return chromium.launch({
      executablePath: await sparticuzChromium.executablePath(),
      args: sparticuzChromium.args,
    })
  }
  return chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return true
    } catch {
      // Server noch nicht bereit — weiter warten
    }
    await sleep(300)
  }
  throw new Error(`Preview-Server unter ${url} antwortete nicht innerhalb von ${timeoutMs}ms`)
}

async function main() {
  console.log('[cv-pdf] Starte Preview-Server …')
  const previewProcess = spawn(
    ASTRO_BIN,
    ['preview', '--port', String(PORT)],
    { cwd: projectRoot, stdio: 'pipe' }
  )

  previewProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[astro preview] ${chunk}`)
  })

  let spawnError = null
  previewProcess.on('error', (err) => {
    spawnError = err
  })
  previewProcess.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[cv-pdf] Preview-Server unerwartet beendet (Code ${code}, Signal ${signal})`)
    }
  })

  try {
    if (spawnError) {
      throw new Error(`Preview-Server konnte nicht gestartet werden: ${spawnError.message}`)
    }
    await waitForServer(`${BASE_URL}/cv`)
    console.log('[cv-pdf] Preview-Server bereit. Rendere PDF …')

    const browser = await launchBrowser()
    try {
      const page = await browser.newPage()
      await page.goto(`${BASE_URL}/cv`, { waitUntil: 'networkidle' })
      await page.emulateMedia({ media: 'print' })
      await page.pdf({
        path: OUTPUT_PATH,
        printBackground: true,
        preferCSSPageSize: true,
      })
      console.log(`[cv-pdf] PDF geschrieben nach ${OUTPUT_PATH}`)
    } finally {
      await browser.close()
    }
  } finally {
    previewProcess.kill()
  }
}

main().catch((err) => {
  // Bewusst kein process.exit(1): Ein Fehler beim CV-PDF-Export (z.B. fehlendes
  // Chromium in einer neuen Build-Umgebung) darf niemals den gesamten Astro-Build
  // scheitern lassen — postbuild-Fehler würden sonst den kompletten Deploy blockieren.
  // Der Fehler wird klar geloggt, damit er in den Build-Logs sichtbar ist.
  console.error('[cv-pdf] Fehler — CV-PDF wurde NICHT generiert, der restliche Build läuft trotzdem weiter:')
  console.error(err?.stack ?? err)
})
