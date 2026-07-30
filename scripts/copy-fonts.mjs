/**
 * Kopiert Latin-Subset-WOFF2 aus @fontsource nach public/fonts/ für self-hosted Fonts.
 * Wird in prebuild ausgeführt — keine CDN-Abhängigkeit, zuverlässige Build-URLs.
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
]

await mkdir(outDir, { recursive: true })

for (const { from, to } of copies) {
  await copyFile(from, to)
  console.log(`copy-fonts: ${to.replace(root + '/', '')}`)
}
