/** Blog-Cover unter /images/blog/ haben -480 / -1200 Varianten neben dem Original. */

export function isBlogCover(path: string | undefined): path is string {
  return !!path?.startsWith('/images/blog/') && path.endsWith('.webp')
}

/** Kleines Thumbnail für Listen / Prev-Next (480px breit). */
export function blogCoverThumb(path: string): string {
  if (!isBlogCover(path)) return path
  return path.replace(/\.webp$/, '-480.webp')
}

/** Responsive srcset für Artikel-Cover. */
export function blogCoverSrcset(path: string): string {
  const base = path.replace(/\.webp$/, '')
  return `${base}-480.webp 480w, ${base}-1200.webp 1200w, ${path} 2100w`
}

/** sizes-Attribut für volle Viewport-Breite Cover. */
export const COVER_SIZES = '100vw'

/** Thumbnail für Prev/Next — Blog mit -480, sonst Original. */
export function coverThumbSrc(path: string | undefined): string | undefined {
  if (!path) return undefined
  return isBlogCover(path) ? blogCoverThumb(path) : path
}
