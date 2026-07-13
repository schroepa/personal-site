import { chromium } from 'playwright'
import sparticuzChromium from '@sparticuz/chromium'
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const PORT = 4833
const BASE_URL = `http://localhost:${PORT}`
const ASTRO_BIN = path.join(projectRoot, 'node_modules', '.bin', 'astro')
const OG_RENDER_DIR = path.join(projectRoot, 'dist', 'og-render')
const OG_OUTPUT_DIR = path.join(projectRoot, 'dist', 'images', 'og')

// Alle /og-render/<kind>/<slug>/index.html Seiten finden, die der Astro-Build
// über getStaticPaths erzeugt hat.
function findOgRenderSlugs() {
  if (!fs.existsSync(OG_RENDER_DIR)) return []
  const slugs = []
  for (const kind of fs.readdirSync(OG_RENDER_DIR)) {
    const kindDir = path.join(OG_RENDER_DIR, kind)
    if (!fs.statSync(kindDir).isDirectory()) continue
    for (const slug of fs.readdirSync(kindDir)) {
      const pageFile = path.join(kindDir, slug, 'index.html')
      if (fs.existsSync(pageFile)) slugs.push({ kind, slug })
    }
  }
  return slugs
}

// Auf Vercel scheitert Playwrights eigenes Chromium-Binary am Start, weil dem
// Build-Container Shared Libraries fehlen — reine --no-sandbox-Flags reichen
// dafür nicht. @sparticuz/chromium liefert ein statisch gelinktes Chromium,
// das dort zuverlässig startet.
//
// og-render nutzt bewusst KEIN WebGL mehr (siehe og-render/[kind]/[slug].astro)
// — ein echter WebGL2-Kontext hat den Chromium-Prozess im Vercel-Build-Sandbox
// zuverlässig zum Absturz gebracht, selbst mit SwiftShader-Software-Rendering-
// Flags. Reines HTML/CSS-Rendering (wie beim funktionierenden CV-PDF-Export)
// braucht keine GL-Flags mehr.
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
  const targets = findOgRenderSlugs()
  if (targets.length === 0) {
    console.log('[og-images] Keine og-render-Seiten gefunden — nichts zu tun.')
    return
  }

  fs.mkdirSync(OG_OUTPUT_DIR, { recursive: true })

  console.log(`[og-images] Starte Preview-Server für ${targets.length} OG-Bild(er) …`)
  const previewProcess = spawn(ASTRO_BIN, ['preview', '--port', String(PORT)], {
    cwd: projectRoot,
    stdio: 'pipe',
  })

  previewProcess.stderr.on('data', (chunk) => {
    process.stderr.write(`[astro preview] ${chunk}`)
  })

  let spawnError = null
  previewProcess.on('error', (err) => {
    spawnError = err
  })

  try {
    if (spawnError) {
      throw new Error(`Preview-Server konnte nicht gestartet werden: ${spawnError.message}`)
    }
    await waitForServer(`${BASE_URL}/og-render/${targets[0].kind}/${targets[0].slug}`)
    console.log('[og-images] Preview-Server bereit.')

    console.log(`[og-images] Starte Chromium (VERCEL=${process.env.VERCEL ? 'ja' : 'nein'}) …`)
    const browser = await launchBrowser()
    console.log('[og-images] Chromium gestartet.')

    let succeeded = 0
    let failed = 0

    try {
      for (const { kind, slug } of targets) {
        // Ein fehlgeschlagenes Bild darf die restlichen nicht mitreißen —
        // vorher brach hier ein einzelner Timeout/Fehler die gesamte
        // for-Schleife ab, wodurch KEIN einziges der Bilder geschrieben
        // wurde, obwohl nur eines tatsächlich Probleme hatte.
        try {
          const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
          try {
            console.log(`[og-images] ${kind}/${slug}: navigiere …`)
            await page.goto(`${BASE_URL}/og-render/${kind}/${slug}`, {
              waitUntil: 'networkidle',
              timeout: 20000,
            })
            console.log(`[og-images] ${kind}/${slug}: geladen, schieße Screenshot …`)
            const outputPath = path.join(OG_OUTPUT_DIR, `${kind}-${slug}.png`)
            await page.locator('#frame').screenshot({ path: outputPath, timeout: 10000 })
            console.log(`[og-images] ${kind}/${slug} → ${outputPath}`)
            succeeded++
          } finally {
            await page.close()
          }
        } catch (err) {
          failed++
          console.error(`[og-images] ${kind}/${slug} FEHLGESCHLAGEN:`)
          console.error(err?.stack ?? err)
        }
      }
    } finally {
      await browser.close()
    }

    console.log(`[og-images] Fertig: ${succeeded} erfolgreich, ${failed} fehlgeschlagen (von ${targets.length}).`)
  } finally {
    previewProcess.kill()
  }
}

main().catch((err) => {
  // Wie beim CV-PDF-Export: ein Fehler hier darf den Gesamt-Build nicht
  // zum Scheitern bringen — nur klar loggen.
  console.error('[og-images] Fehler — OG-Bilder wurden NICHT vollständig generiert:')
  console.error(err?.stack ?? err)
})
