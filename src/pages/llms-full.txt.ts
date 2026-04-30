import type { APIRoute } from 'astro'
import { getCollection } from 'astro:content'

const SITE = 'https://ptrckschrdtr.de'

export const GET: APIRoute = async () => {
  const posts = await getCollection('blog', ({ data }) => !data.draft)
  const projects = await getCollection('projects')

  const sortedPosts = posts.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime()
  )
  const sortedProjects = projects.sort((a, b) => {
    if (a.data.featured && !b.data.featured) return -1
    if (!a.data.featured && b.data.featured) return 1
    return b.data.date.getTime() - a.data.date.getTime()
  })

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date)

  const separator = `\n${'─'.repeat(72)}\n`

  const lines: string[] = [
    `# Patrick Schröder — UI Designer & Developer`,
    `# Vollständige Inhalte (llms-full.txt)`,
    `# ${SITE}`,
    ``,
    `> Patrick Schröder ist UI Designer und Frontend Developer.`,
    `> Interface Design, Frontend-Entwicklung und Design Systems.`,
    ``,
    separator,
    `# BLOG`,
    separator,
  ]

  for (const post of sortedPosts) {
    const slug = post.id.replace(/\.md$/, '')
    const tags = post.data.tags?.join(', ') ?? ''

    lines.push(
      ``,
      `## ${post.data.title}`,
      `URL: ${SITE}/blog/${slug}`,
      `Datum: ${formatDate(post.data.date)}`,
      ...(tags ? [`Tags: ${tags}`] : []),
      ``,
      post.body ?? '',
      ``,
    )
  }

  lines.push(
    separator,
    `# PROJEKTE`,
    separator,
  )

  for (const project of sortedProjects) {
    const slug = project.id.replace(/\.md$/, '')
    const tags = project.data.tags.join(', ')
    const extras = [
      project.data.url ? `Website: ${project.data.url}` : '',
      project.data.repo  ? `Repository: ${project.data.repo}` : '',
    ].filter(Boolean)

    lines.push(
      ``,
      `## ${project.data.title}`,
      `URL: ${SITE}/projects/${slug}`,
      `Tags: ${tags}`,
      ...(project.data.featured ? [`Featured: ja`] : []),
      ...extras,
      ``,
      project.body ?? '',
      ``,
    )
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
