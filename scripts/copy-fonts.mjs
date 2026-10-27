/**
 * Kopiert Fonts nach public/fonts/ für stabile URLs (Preload + CSS).
 * - Geist aus @fontsource
 * - PP Editorial New aus src/fonts (Überschriften)
 */
import { copyFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public/fonts')

const copies = [
  {
    from: join(
      root,
      'node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2'
    ),
    to: join(outDir, 'geist-latin.woff2'),
  },
  {
    from: join(
      root,
      'node_modules/@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2'
    ),
    to: join(outDir, 'geist-mono-latin.woff2'),
  },
  {
    from: join(root, 'src/fonts/PPEditorialNew-Heavy.woff2'),
    to: join(outDir, 'editorial-new-heavy.woff2'),
  },
  {
    from: join(root, 'src/fonts/PPEditorialNew-Bold.woff2'),
    to: join(outDir, 'editorial-new-bold.woff2'),
  },
]

await mkdir(outDir, { recursive: true })

for (const { from, to } of copies) {
  await copyFile(from, to)
  console.log(`copy-fonts: ${to.replace(root + '/', '')}`)
}
