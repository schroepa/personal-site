import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const PORT = 4323
const BASE_URL = `http://localhost:${PORT}`
const OUTPUT_PATH = path.join(projectRoot, 'dist', 'cv.pdf')

async function waitForServer(url, timeoutMs = 15000) {
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
    'npx',
    ['astro', 'preview', '--port', String(PORT)],
    { cwd: projectRoot, stdio: 'pipe' }
  )

  previewProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[astro preview] ${chunk}`)
  })

  try {
    await waitForServer(`${BASE_URL}/cv`)
    console.log('[cv-pdf] Preview-Server bereit. Rendere PDF …')

    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.goto(`${BASE_URL}/cv`, { waitUntil: 'networkidle' })
    await page.emulateMedia({ media: 'print' })
    await page.pdf({
      path: OUTPUT_PATH,
      printBackground: true,
      preferCSSPageSize: true,
    })
    await browser.close()

    console.log(`[cv-pdf] PDF geschrieben nach ${OUTPUT_PATH}`)
  } finally {
    previewProcess.kill()
  }
}

main().catch((err) => {
  console.error('[cv-pdf] Fehler:', err)
  process.exit(1)
})
