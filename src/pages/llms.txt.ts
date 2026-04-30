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

  const lines: string[] = [
    `# Patrick Schröder — UI Designer & Developer`,
    ``,
    `> Patrick Schröder ist UI Designer und Frontend Developer.`,
    `> Diese Site zeigt ausgewählte Projekte und einen Blog zu den Themen`,
    `> Interface Design, Frontend-Entwicklung und Design Systems.`,
    `> Vollständige Inhalte: ${SITE}/llms-full.txt`,
    ``,
    `## Blog`,
    ``,
    ...sortedPosts.map((post) => {
      const slug = post.id.replace(/\.md$/, '')
      return `- [${post.data.title}](${SITE}/blog/${slug}): ${post.data.description}`
    }),
    ``,
    `## Projekte`,
    ``,
    ...sortedProjects.map((project) => {
      const slug = project.id.replace(/\.md$/, '')
      const featured = project.data.featured ? ' ⭐' : ''
      return `- [${project.data.title}](${SITE}/projects/${slug})${featured}: ${project.data.description}`
    }),
    ``,
    `## Seiten`,
    ``,
    `- [Start](${SITE}/)`,
    `- [Impressum](${SITE}/impressum)`,
    `- [Datenschutz](${SITE}/datenschutz)`,
    ``,
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
