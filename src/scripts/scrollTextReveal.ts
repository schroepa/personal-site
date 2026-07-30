// Wortweise Scroll-Aufhellung: Text startet gedimmt (--muted-foreground) und
// wird hell (--foreground), sobald das jeweilige Wort eine "Leselinie" bei
// ~55% Bildschirmhöhe durchläuft — inspiriert von bymonolog.com.
//
// Läuft deterministisch über rAF + scroll-Listener statt über natives CSS
// `animation-timeline: view()`: Ein erster Versuch mit view-timeline-inset
// zeigte, dass sich der exakte Zeitpunkt von "0%"/"100%" pro Wort-Element
// nicht verlässlich auf eine feste Bildschirmlinie abbilden lässt (die
// Spec-Semantik ist für Enter/Exit-Reveals ganzer Elemente gedacht, nicht für
// positionsgebundene Effekte vieler kleiner Inline-Elemente). Gleiches Muster
// wie der bestehende Parallax-Fallback in scrollAnimations.ts.
export function initScrollTextReveal(): void {
  const containers = document.querySelectorAll<HTMLElement>('[data-reveal="scroll-words"]')
  if (containers.length === 0) return

  const words: HTMLElement[] = []
  containers.forEach((el) => {
    const text = el.textContent ?? ''
    const tokens = text.split(/\s+/).filter(Boolean)
    el.innerHTML = ''

    tokens.forEach((word, i) => {
      const span = document.createElement('span')
      span.className = 'scroll-word'
      span.textContent = word
      el.appendChild(span)
      if (i < tokens.length - 1) el.appendChild(document.createTextNode(' '))
      words.push(span)
    })
  })

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    words.forEach((w) => (w.style.color = 'var(--foreground)'))
    return
  }

  // CSS-Farbvariablen einmalig in RGB-Komponenten auflösen, um sie in JS
  // interpolieren zu können (color-mix() wäre hier pro Frame zu teuer/umständlich).
  // Über Canvas statt getComputedStyle(), weil moderne Browser Farben in
  // computed styles als oklch()-String zurückgeben können, nicht als rgb() —
  // ein Canvas-2D-Kontext löst dagegen zuverlässig in echte RGB-Bytes auf.
  function resolveRGB(cssValue: string): [number, number, number] {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
      cssValue.replace('var(', '').replace(')', '')
    )
    ctx.fillRect(0, 0, 1, 1)
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
    return [r, g, b]
  }

  const muted = resolveRGB('var(--muted-foreground)')
  const fg = resolveRGB('var(--foreground)')
  const lerp = (a: number, b: number, t: number) => Math.round(a + (b - a) * t)

  const LINE_RATIO = 0.55 // Position der Leselinie, relativ zur Viewport-Höhe
  const BAND_HALF_PX = 70 // Halbe Breite der Übergangszone in Pixeln

  let ticking = false
  function update(): void {
    const lineY = window.innerHeight * LINE_RATIO
    for (const w of words) {
      const wordTop = w.getBoundingClientRect().top
      const raw = (lineY + BAND_HALF_PX - wordTop) / (BAND_HALF_PX * 2)
      const t = Math.min(1, Math.max(0, raw))
      w.style.color = `rgb(${lerp(muted[0], fg[0], t)}, ${lerp(muted[1], fg[1], t)}, ${lerp(muted[2], fg[2], t)})`
    }
    ticking = false
  }

  update()
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update)
        ticking = true
      }
    },
    { passive: true }
  )
}
