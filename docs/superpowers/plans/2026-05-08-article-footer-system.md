# Artikel-Abschluss-System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jede Artikel- und Projektseite mit Lesezeit, AI-Links, Share-Button und Prev/Next-Navigation ausstatten.

**Architecture:** `src/lib/reading-time.ts` liefert die Lesezeit-Utility. `src/components/astro/ArticleFooter.astro` enthält den gesamten Abschluss-Block (AI, Share, Prev/Next). `PostLayout.astro` erhält neue Props für Lesezeit und Prev/Next und bindet `ArticleFooter` ein. Die `[slug].astro`-Seiten berechnen Prev/Next und reichen alles durch.

**Tech Stack:** Astro, TypeScript, CSS Custom Properties, shadcn Badge, inline SVG Icons, `navigator.clipboard` API

---

## Dateistruktur

| Aktion | Datei | Verantwortung |
|--------|-------|---------------|
| Create | `src/lib/reading-time.ts` | `readingTime(body)` → Minuten |
| Create | `src/components/astro/ArticleFooter.astro` | AI-Links, Share, Prev/Next |
| Modify | `src/layouts/PostLayout.astro` | Props erweitern, Lesezeit im Header, ArticleFooter einbinden |
| Modify | `src/pages/blog/[slug].astro` | Prev/Next berechnen, an PostLayout übergeben |
| Modify | `src/pages/projects/[slug].astro` | Prev/Next berechnen, an PostLayout übergeben |
| Modify | `src/pages/blog/index.astro` | Lesezeit in Cards |
| Modify | `src/pages/projects/index.astro` | Lesezeit in Cards |
| Modify | `src/pages/index.astro` | Lesezeit in Latest-Posts-Cards |

---

### Task 1: Lesezeit-Utility

**Files:**
- Create: `src/lib/reading-time.ts`

- [ ] **Schritt 1: Datei erstellen**

  ```ts
  /**
   * Berechnet die Lesezeit in Minuten.
   * Basis: 200 Wörter/Minute, mindestens 1 Minute.
   */
  export function readingTime(body: string): number {
    const words = body.trim().split(/\s+/).filter(Boolean).length
    return Math.max(1, Math.ceil(words / 200))
  }
  ```

- [ ] **Schritt 2: Build-Check**

  ```bash
  cd personal-site-ptrckschrdtr/personal-site-ptrckschrdtr && npm run build
  ```

  Erwartetes Ergebnis: `[build] Complete!` ohne Fehler.

- [ ] **Schritt 3: Commit**

  ```bash
  git add src/lib/reading-time.ts
  git commit -m "feat: readingTime utility"
  ```

---

### Task 2: ArticleFooter-Komponente

**Files:**
- Create: `src/components/astro/ArticleFooter.astro`

- [ ] **Schritt 1: Datei erstellen**

  ```astro
  ---
  import { Badge } from '@/components/ui/badge'

  interface PrevNextPost {
    slug: string
    title: string
    description: string
    tags: string[]
    coverImage?: string
  }

  interface Props {
    title: string
    pageUrl: string
    prev?: PrevNextPost
    next?: PrevNextPost
  }

  const { title, pageUrl, prev, next } = Astro.props

  const encodedTitle = encodeURIComponent(title)
  const encodedUrl   = encodeURIComponent(pageUrl)
  const prompt       = encodeURIComponent(`Erkläre mir mehr zu diesem Artikel: "${title}" — ${pageUrl}`)

  const aiLinks = [
    {
      name: 'Claude',
      href: `https://claude.ai/new?q=${prompt}`,
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.827 3.52c-.728-1.694-3.061-1.694-3.79 0L5.032 14.846c-.273.637.197 1.341.895 1.341h12.146c.698 0 1.168-.704.895-1.341z"/><path d="M9.5 18.5h5M12 16v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    },
    {
      name: 'ChatGPT',
      href: `https://chatgpt.com/?q=${prompt}`,
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.28 9.28a5.76 5.76 0 0 0-.44-4.72 6 6 0 0 0-6.47-2.88A5.75 5.75 0 0 0 11 .1a6 6 0 0 0-5.71 4.14 5.76 5.76 0 0 0-3.84 2.8 6 6 0 0 0 .74 7.04 5.76 5.76 0 0 0 .44 4.72 6 6 0 0 0 6.47 2.88A5.75 5.75 0 0 0 13 23.9a6 6 0 0 0 5.72-4.15 5.76 5.76 0 0 0 3.83-2.8 6 6 0 0 0-.27-7.67zM13 22.43a4.5 4.5 0 0 1-2.89-1.05l.14-.08 4.8-2.77a.77.77 0 0 0 .39-.68v-6.77l2.03 1.17a.07.07 0 0 1 .04.06v5.6A4.54 4.54 0 0 1 13 22.43zm-9.7-4.14a4.5 4.5 0 0 1-.54-3.03l.14.09 4.8 2.77a.78.78 0 0 0 .78 0l5.86-3.38v2.34a.08.08 0 0 1-.03.07L9.44 19.9a4.54 4.54 0 0 1-6.14-1.6zm-1.26-9.9A4.5 4.5 0 0 1 4.4 6.14v5.67a.77.77 0 0 0 .39.67l5.85 3.38-2.03 1.17a.08.08 0 0 1-.08 0L3.6 14.15a4.54 4.54 0 0 1-.55-5.77zm16.67 3.9L13.86 8.9l2.03-1.17a.08.08 0 0 1 .08 0l4.94 2.85a4.53 4.53 0 0 1-.7 8.18v-5.67a.77.77 0 0 0-.4-.67zm2.02-3.04-.15-.09-4.8-2.76a.78.78 0 0 0-.78 0L9.14 10.79V8.45a.07.07 0 0 1 .03-.07l4.87-2.81a4.54 4.54 0 0 1 6.73 4.7v-.02zm-12.72 4.18-2.03-1.17a.07.07 0 0 1-.04-.06V6.6a4.54 4.54 0 0 1 7.44-3.48l-.14.08-4.8 2.77a.77.77 0 0 0-.39.68l-.04 6.76zm1.1-2.37 2.61-1.5 2.6 1.5v3L11.9 16 9.1 14.5v-3z"/></svg>`,
    },
    {
      name: 'Perplexity',
      href: `https://www.perplexity.ai/search?q=${encodedTitle}+${encodeURIComponent('ptrckschrdtr.de')}`,
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 2L2 9h3v6H2l9 7 9-7h-3V9h3L11 2zm0 2.5l5.5 4.5H14v6h2.5L11 19l-5.5-4H8V9H5.5L11 4.5z"/></svg>`,
    },
  ]
  ---

  <footer class="article-footer">

    <!-- Divider -->
    <div class="footer-divider"></div>

    <!-- MIT KI ERKUNDEN -->
    <section class="footer-section" aria-labelledby="ai-heading">
      <h2 id="ai-heading" class="footer-label">Mit KI erkunden</h2>
      <p class="footer-sub">Diesen Beitrag mit einer KI weiterdenken —</p>
      <div class="ai-links">
        {aiLinks.map((ai) => (
          <a
            href={ai.href}
            target="_blank"
            rel="noopener noreferrer"
            class="ai-link"
            aria-label={`Beitrag mit ${ai.name} erkunden (öffnet externen Link)`}
          >
            <span set:html={ai.icon} />
            <span>{ai.name}</span>
          </a>
        ))}
      </div>
    </section>

    <div class="footer-divider"></div>

    <!-- TEILEN -->
    <section class="footer-section share-section" aria-labelledby="share-heading">
      <h2 id="share-heading" class="sr-only">Teilen</h2>
      <button
        id="copy-link-btn"
        type="button"
        class="share-btn"
        aria-live="polite"
        data-url={pageUrl}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <span id="copy-link-label">Link kopieren</span>
      </button>

      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        class="share-btn"
        aria-label="Auf LinkedIn teilen (öffnet externen Link)"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
          <rect x="2" y="9" width="4" height="12"/>
          <circle cx="4" cy="4" r="2"/>
        </svg>
        <span>LinkedIn</span>
      </a>
    </section>

    <div class="footer-divider"></div>

    <!-- PREV / NEXT -->
    {(prev || next) && (
      <nav class="prevnext" aria-label="Weitere Artikel">
        {prev ? (
          <a
            href={`/${prev.slug.startsWith('projects') ? 'projects' : 'blog'}/${prev.slug}`}
            class="pn-card pn-prev"
            aria-label={`Vorheriger Beitrag: ${prev.title}`}
          >
            <div class="pn-dir">← Vorheriger</div>
            <div class="pn-thumb">
              {prev.coverImage
                ? <img src={prev.coverImage} alt="" loading="lazy" />
                : <div class="pn-thumb-fallback" aria-hidden="true"></div>
              }
            </div>
            <div class="pn-body">
              <h3 class="pn-title">{prev.title}</h3>
              <p class="pn-desc">{prev.description}</p>
              {prev.tags.length > 0 && (
                <div class="pn-tags">
                  {prev.tags.slice(0, 3).map(tag => (
                    <span class="pn-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </a>
        ) : <div />}

        {next ? (
          <a
            href={`/${next.slug.startsWith('projects') ? 'projects' : 'blog'}/${next.slug}`}
            class="pn-card pn-next"
            aria-label={`Nächster Beitrag: ${next.title}`}
          >
            <div class="pn-dir">Nächster →</div>
            <div class="pn-thumb">
              {next.coverImage
                ? <img src={next.coverImage} alt="" loading="lazy" />
                : <div class="pn-thumb-fallback" aria-hidden="true"></div>
              }
            </div>
            <div class="pn-body">
              <h3 class="pn-title">{next.title}</h3>
              <p class="pn-desc">{next.description}</p>
              {next.tags.length > 0 && (
                <div class="pn-tags">
                  {next.tags.slice(0, 3).map(tag => (
                    <span class="pn-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </a>
        ) : <div />}
      </nav>
    )}

  </footer>

  <style>
    .article-footer {
      margin-top: 4rem;
      padding-bottom: 4rem;
    }

    .footer-divider {
      width: 100%;
      height: 1px;
      background: var(--border);
      margin: 2rem 0;
    }

    .footer-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .footer-label {
      font-size: var(--text-xs);
      letter-spacing: var(--tracking-wide);
      text-transform: uppercase;
      font-weight: 500;
      color: var(--muted-foreground);
    }

    .footer-sub {
      font-size: var(--text-sm);
      color: var(--muted-foreground);
      margin: 0;
    }

    /* AI Links */
    .ai-links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .ai-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      font-size: var(--text-sm);
      color: var(--foreground);
      text-decoration: none;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      background: var(--card);
      transition: border-color 200ms ease, background 200ms ease, transform 200ms ease;
    }

    .ai-link:hover {
      border-color: var(--foreground);
      background: var(--muted);
      transform: translateY(-1px);
    }

    /* Share */
    .share-section {
      flex-direction: row;
      align-items: center;
      gap: 0.75rem;
    }

    .share-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      font-size: var(--text-sm);
      color: var(--foreground);
      text-decoration: none;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      background: var(--card);
      cursor: pointer;
      font-family: var(--font-sans);
      transition: border-color 200ms ease, background 200ms ease;
    }

    .share-btn:hover {
      border-color: var(--foreground);
      background: var(--muted);
    }

    .share-btn.copied {
      border-color: var(--foreground);
      background: var(--foreground);
      color: var(--background);
    }

    /* Prev / Next */
    .prevnext {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    @media (max-width: 640px) {
      .prevnext {
        grid-template-columns: 1fr;
      }
    }

    .pn-card {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      padding: 1.25rem;
      border: 1px solid var(--border);
      border-radius: 0.75rem;
      text-decoration: none;
      color: var(--foreground);
      background: var(--card);
      transition: border-color 200ms ease, transform 200ms ease, background 200ms ease;
    }

    .pn-card:hover {
      border-color: color-mix(in oklch, var(--foreground) 30%, transparent);
      transform: translateY(-2px);
      background: var(--muted);
    }

    .pn-next {
      text-align: right;
    }

    .pn-dir {
      font-size: var(--text-xs);
      letter-spacing: var(--tracking-wide);
      text-transform: uppercase;
      font-weight: 500;
      color: var(--muted-foreground);
    }

    .pn-thumb {
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 0.5rem;
      overflow: hidden;
      background: var(--muted);
    }

    .pn-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 400ms cubic-bezier(0.25, 1, 0.5, 1);
    }

    .pn-card:hover .pn-thumb img {
      transform: scale(1.04);
    }

    .pn-thumb-fallback {
      width: 100%;
      height: 100%;
      background:
        radial-gradient(ellipse 70% 70% at 20% 30%,
          color-mix(in oklch, var(--mesh-warm) 60%, transparent) 0%, transparent 70%),
        radial-gradient(ellipse 60% 60% at 80% 70%,
          color-mix(in oklch, var(--mesh-cool) 50%, transparent) 0%, transparent 65%),
        var(--muted);
    }

    .pn-body {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .pn-title {
      font-size: var(--text-base);
      font-weight: 500;
      line-height: var(--leading-snug);
      letter-spacing: var(--tracking-snug);
      margin: 0;
    }

    .pn-desc {
      font-size: var(--text-sm);
      color: var(--muted-foreground);
      line-height: var(--leading-normal);
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .pn-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
      margin-top: 0.25rem;
    }

    .pn-next .pn-tags {
      justify-content: flex-end;
    }

    .pn-tag {
      font-size: var(--text-xs);
      letter-spacing: var(--tracking-wide);
      text-transform: uppercase;
      color: var(--muted-foreground);
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 0.25rem;
      padding: 0.125rem 0.5rem;
    }

    @media (prefers-reduced-motion: reduce) {
      .ai-link, .pn-card, .share-btn { transition: none; }
      .pn-card:hover { transform: none; }
      .ai-link:hover { transform: none; }
    }
  </style>

  <script>
    const btn = document.getElementById('copy-link-btn')
    const label = document.getElementById('copy-link-label')
    if (btn && label) {
      btn.addEventListener('click', async () => {
        const url = btn.dataset.url ?? window.location.href
        try {
          await navigator.clipboard.writeText(url)
          label.textContent = 'Kopiert ✓'
          btn.classList.add('copied')
          setTimeout(() => {
            label.textContent = 'Link kopieren'
            btn.classList.remove('copied')
          }, 2000)
        } catch {
          // Fallback für ältere Browser
          const input = document.createElement('input')
          input.value = url
          document.body.appendChild(input)
          input.select()
          document.execCommand('copy')
          document.body.removeChild(input)
          label.textContent = 'Kopiert ✓'
          btn.classList.add('copied')
          setTimeout(() => {
            label.textContent = 'Link kopieren'
            btn.classList.remove('copied')
          }, 2000)
        }
      })
    }
  </script>
  ```

- [ ] **Schritt 2: Build-Check**

  ```bash
  npm run build
  ```

  Erwartetes Ergebnis: `[build] Complete!`

- [ ] **Schritt 3: Commit**

  ```bash
  git add src/components/astro/ArticleFooter.astro
  git commit -m "feat: ArticleFooter mit AI-Links, Share und Prev/Next"
  ```

---

### Task 3: PostLayout erweitern

**Files:**
- Modify: `src/layouts/PostLayout.astro`

- [ ] **Schritt 1: PostLayout komplett ersetzen**

  `src/layouts/PostLayout.astro` mit folgendem Inhalt überschreiben:

  ```astro
  ---
  import BaseLayout from './BaseLayout.astro'
  import ReadingProgress from '@/components/astro/ReadingProgress.astro'
  import ArticleFooter from '@/components/astro/ArticleFooter.astro'
  import { Badge } from '@/components/ui/badge'
  import { readingTime } from '@/lib/reading-time'

  interface PrevNextPost {
    slug: string
    title: string
    description: string
    tags: string[]
    coverImage?: string
  }

  interface Props {
    title: string
    description?: string
    date: Date
    tags?: string[]
    coverImage?: string
    body?: string
    pageUrl?: string
    prev?: PrevNextPost
    next?: PrevNextPost
  }

  const {
    title,
    description,
    date,
    tags = [],
    coverImage,
    body = '',
    pageUrl = Astro.url.href,
    prev,
    next,
  } = Astro.props

  const minutes = readingTime(body)

  const formattedDate = new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
  ---

  <BaseLayout title={title} description={description}>
    <ReadingProgress />

    <article class="pb-24">

      <!-- Cover -->
      <div class="cover-wrap">
        {coverImage ? (
          <img src={coverImage} alt="" class="cover-img" loading="eager" decoding="async" />
        ) : (
          <div class="cover-placeholder" aria-hidden="true">
            <div class="cp-orb cp-orb-1"></div>
            <div class="cp-orb cp-orb-2"></div>
            <div class="cp-orb cp-orb-3"></div>
          </div>
        )}
      </div>

      <!-- Content -->
      <div class="content-wrap">
        <header class="mb-12 max-w-2xl pt-10">
          <h1 class="t-h1 mb-6" data-reveal="lines">{title}</h1>
          <div class="flex flex-wrap items-center gap-3">
            <time class="t-small text-muted-foreground" datetime={date.toISOString()}>
              {formattedDate}
            </time>
            <span class="t-small text-muted-foreground" aria-label={`${minutes} Minuten Lesezeit`}>
              · {minutes} min
            </span>
            {tags.length > 0 && (
              <div class="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge variant="secondary" client:visible>{tag}</Badge>
                ))}
              </div>
            )}
          </div>
        </header>

        <div class="prose t-prose">
          <slot />
        </div>

        <ArticleFooter
          title={title}
          pageUrl={pageUrl}
          prev={prev}
          next={next}
        />
      </div>
    </article>
  </BaseLayout>

  <style>
    .cover-wrap {
      position: relative;
      width: 100%;
      height: 62vh;
      max-height: 520px;
      min-height: 280px;
      overflow: hidden;
    }
    .cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .content-wrap {
      position: relative;
      z-index: 10;
      background: var(--background);
      border-radius: 16px 16px 0 0;
      margin-top: -72px;
      margin-left: auto;
      margin-right: auto;
      max-width: calc(65ch + 5rem);
      width: 100%;
      padding: 0 2.5rem;
    }
    article { padding-top: 0; }
    .cover-placeholder {
      position: absolute;
      inset: 0;
      background: var(--background);
      overflow: hidden;
    }
    .cp-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
    }
    .cp-orb-1 {
      width: 60%; height: 120%; top: -10%; left: -5%;
      background: var(--mesh-warm); opacity: 0.55;
      animation: cp-drift-1 14s ease-in-out infinite alternate;
    }
    .cp-orb-2 {
      width: 50%; height: 120%; top: -15%; right: -5%;
      background: var(--mesh-cool); opacity: 0.45;
      animation: cp-drift-2 18s ease-in-out infinite alternate;
      animation-delay: -6s;
    }
    .cp-orb-3 {
      width: 40%; height: 80%; bottom: -10%; left: 35%;
      background: var(--mesh-warm); opacity: 0.35;
      animation: cp-drift-3 12s ease-in-out infinite alternate;
      animation-delay: -3s;
    }
    @keyframes cp-drift-1 {
      0%   { transform: translate(0%,  0%)  scale(1); }
      100% { transform: translate(6%,  8%)  scale(1.08); }
    }
    @keyframes cp-drift-2 {
      0%   { transform: translate(0%,  0%)  scale(1); }
      100% { transform: translate(-5%, 6%)  scale(1.06); }
    }
    @keyframes cp-drift-3 {
      0%   { transform: translate(0%,  0%)  scale(1); }
      100% { transform: translate(4%, -5%)  scale(1.04); }
    }
    @media (prefers-reduced-motion: reduce) {
      .cp-orb { animation: none; }
    }
    .cover-wrap::after {
      content: '';
      position: absolute;
      inset: 0;
      filter: url(#grain);
      opacity: 0.06;
      mix-blend-mode: overlay;
      pointer-events: none;
    }
  </style>
  ```

- [ ] **Schritt 2: Build-Check**

  ```bash
  npm run build
  ```

  Erwartetes Ergebnis: `[build] Complete!`

- [ ] **Schritt 3: Commit**

  ```bash
  git add src/layouts/PostLayout.astro src/lib/reading-time.ts
  git commit -m "feat: PostLayout mit Lesezeit und ArticleFooter"
  ```

---

### Task 4: Blog [slug].astro — Prev/Next + body

**Files:**
- Modify: `src/pages/blog/[slug].astro`

- [ ] **Schritt 1: Datei ersetzen**

  ```astro
  ---
  import PostLayout from '@/layouts/PostLayout.astro'
  import { getCollection, render } from 'astro:content'
  import type { GetStaticPaths } from 'astro'

  export const getStaticPaths: GetStaticPaths = async () => {
    const posts = await getCollection('blog', ({ data }) => !data.draft)
    const sorted = posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())

    return sorted.map((post, index) => {
      const prev = sorted[index + 1] // älter = vorheriger
      const next = sorted[index - 1] // neuer  = nächster

      return {
        params: { slug: post.id.replace(/\.md$/, '') },
        props: {
          post,
          prev: prev ? {
            slug: prev.id.replace(/\.md$/, ''),
            title: prev.data.title,
            description: prev.data.description,
            tags: prev.data.tags ?? [],
            coverImage: prev.data.coverImage,
          } : undefined,
          next: next ? {
            slug: next.id.replace(/\.md$/, ''),
            title: next.data.title,
            description: next.data.description,
            tags: next.data.tags ?? [],
            coverImage: next.data.coverImage,
          } : undefined,
        },
      }
    })
  }

  const { post, prev, next } = Astro.props
  const { Content } = await render(post)
  const slug = post.id.replace(/\.md$/, '')
  ---

  <PostLayout
    title={post.data.title}
    description={post.data.description}
    date={post.data.date}
    tags={post.data.tags}
    coverImage={post.data.coverImage}
    body={post.body ?? ''}
    pageUrl={`https://ptrckschrdtr.de/blog/${slug}`}
    prev={prev}
    next={next}
  >
    <Content />
  </PostLayout>
  ```

- [ ] **Schritt 2: Build-Check**

  ```bash
  npm run build
  ```

  Erwartetes Ergebnis: `[build] Complete!`

- [ ] **Schritt 3: Commit**

  ```bash
  git add 'src/pages/blog/[slug].astro'
  git commit -m "feat: blog slug mit Prev/Next und body-Weitergabe"
  ```

---

### Task 5: Projects [slug].astro — Prev/Next + body

**Files:**
- Modify: `src/pages/projects/[slug].astro`

- [ ] **Schritt 1: Datei ersetzen**

  ```astro
  ---
  import PostLayout from '@/layouts/PostLayout.astro'
  import { getCollection, render } from 'astro:content'
  import type { GetStaticPaths } from 'astro'

  export const getStaticPaths: GetStaticPaths = async () => {
    const projects = await getCollection('projects')
    const sorted = projects.sort((a, b) => b.data.date.getTime() - a.data.date.getTime())

    return sorted.map((project, index) => {
      const prev = sorted[index + 1]
      const next = sorted[index - 1]

      return {
        params: { slug: project.id.replace(/\.md$/, '') },
        props: {
          project,
          prev: prev ? {
            slug: `projects/${prev.id.replace(/\.md$/, '')}`,
            title: prev.data.title,
            description: prev.data.description,
            tags: prev.data.tags ?? [],
            coverImage: prev.data.coverImage,
          } : undefined,
          next: next ? {
            slug: `projects/${next.id.replace(/\.md$/, '')}`,
            title: next.data.title,
            description: next.data.description,
            tags: next.data.tags ?? [],
            coverImage: next.data.coverImage,
          } : undefined,
        },
      }
    })
  }

  const { project, prev, next } = Astro.props
  const { Content } = await render(project)
  const slug = project.id.replace(/\.md$/, '')
  ---

  <PostLayout
    title={project.data.title}
    description={project.data.description}
    date={project.data.date}
    tags={project.data.tags}
    coverImage={project.data.coverImage}
    body={project.body ?? ''}
    pageUrl={`https://ptrckschrdtr.de/projects/${slug}`}
    prev={prev}
    next={next}
  >
    <Content />
  </PostLayout>
  ```

- [ ] **Schritt 2: Build-Check**

  ```bash
  npm run build
  ```

  Erwartetes Ergebnis: `[build] Complete!`

- [ ] **Schritt 3: Commit**

  ```bash
  git add 'src/pages/projects/[slug].astro'
  git commit -m "feat: projects slug mit Prev/Next und body-Weitergabe"
  ```

---

### Task 6: Lesezeit in Blog-Index-Cards

**Files:**
- Modify: `src/pages/blog/index.astro`

- [ ] **Schritt 1: Import hinzufügen**

  Im Frontmatter von `src/pages/blog/index.astro` ergänzen:

  ```astro
  ---
  import BaseLayout from '@/layouts/BaseLayout.astro'
  import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
  import { Badge } from '@/components/ui/badge'
  import { getCollection } from 'astro:content'
  import { readingTime } from '@/lib/reading-time'   // ← neu
  ```

- [ ] **Schritt 2: Datum + Lesezeit in der Card anzeigen**

  Die `<time>`-Zeile in der Card ersetzen:

  ```astro
  <!-- vorher -->
  <time class="t-label text-muted-foreground" datetime={post.data.date.toISOString()}>
    {formatDate(post.data.date)}
  </time>

  <!-- nachher -->
  <div class="flex items-center gap-2">
    <time class="t-label text-muted-foreground" datetime={post.data.date.toISOString()}>
      {formatDate(post.data.date)}
    </time>
    <span class="t-label text-muted-foreground">· {readingTime(post.body ?? '')} min</span>
  </div>
  ```

- [ ] **Schritt 3: Build-Check**

  ```bash
  npm run build
  ```

  Erwartetes Ergebnis: `[build] Complete!`

- [ ] **Schritt 4: Commit**

  ```bash
  git add src/pages/blog/index.astro
  git commit -m "feat: Lesezeit in Blog-Index-Cards"
  ```

---

### Task 7: Lesezeit in Projects-Index-Cards

**Files:**
- Modify: `src/pages/projects/index.astro`

- [ ] **Schritt 1: Import + Lesezeit hinzufügen**

  Gleiche Änderungen wie Task 6 — Import und `· {readingTime(project.body ?? '')} min` neben dem Datum.

  Im Frontmatter:
  ```astro
  import { readingTime } from '@/lib/reading-time'
  ```

  In der Card (Datum-Zeile suchen und ersetzen):
  ```astro
  <div class="flex items-center gap-2">
    <time class="t-label text-muted-foreground" datetime={project.data.date.toISOString()}>
      {formatDate(project.data.date)}
    </time>
    <span class="t-label text-muted-foreground">· {readingTime(project.body ?? '')} min</span>
  </div>
  ```

  Dabei `formatDate` analog zu `blog/index.astro` definieren falls noch nicht vorhanden:
  ```ts
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('de-DE', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
  ```

- [ ] **Schritt 2: Build-Check + Commit**

  ```bash
  npm run build
  git add src/pages/projects/index.astro
  git commit -m "feat: Lesezeit in Projects-Index-Cards"
  ```

---

### Task 8: Lesezeit in Homepage Latest Posts

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Schritt 1: Import + Lesezeit hinzufügen**

  Im Frontmatter:
  ```astro
  import { readingTime } from '@/lib/reading-time'
  ```

  In der Latest-Posts-Card (time-Element suchen und ersetzen):
  ```astro
  <div class="flex items-center gap-2">
    <time class="t-label text-muted-foreground shrink-0 mt-1">
      {formatDate(post.data.date)}
    </time>
    <span class="t-label text-muted-foreground mt-1">· {readingTime(post.body ?? '')} min</span>
  </div>
  ```

- [ ] **Schritt 2: Finaler Build-Check**

  ```bash
  npm run build
  ```

  Erwartetes Ergebnis: `[build] 16 page(s) built` (oder mehr) ohne Fehler.

- [ ] **Schritt 3: Push**

  ```bash
  git add src/pages/index.astro
  git commit -m "feat: Lesezeit auf Homepage Latest Posts"
  git push origin main
  ```
