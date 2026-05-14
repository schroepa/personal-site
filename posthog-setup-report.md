<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into your Astro (View Transitions) personal site. A `posthog.astro` component was created with the initialization guard required for ClientRouter soft navigation, and it was imported into `BaseLayout.astro` so every page is covered. Eight custom events were instrumented across three files, and environment variables were written to `.env`.

| Event | Description | File |
|---|---|---|
| `project_clicked` | User clicks a project item from the home page list | `src/pages/index.astro` |
| `blog_post_clicked` | User clicks a blog post item from the home page list | `src/pages/index.astro` |
| `cv_downloaded` | User clicks the CV/Lebenslauf download link | `src/pages/index.astro` |
| `contact_email_clicked` | User clicks any contact email button (bot-protected) | `src/layouts/BaseLayout.astro` |
| `social_link_clicked` | User clicks a social media link (LinkedIn, Instagram, GitHub) in the footer | `src/layouts/BaseLayout.astro` |
| `theme_toggled` | User switches between dark and light mode | `src/layouts/BaseLayout.astro` |
| `article_shared` | User copies article link or shares via LinkedIn | `src/components/astro/ArticleFooter.astro` |
| `ai_link_clicked` | User clicks Claude, ChatGPT, or Perplexity to explore an article | `src/components/astro/ArticleFooter.astro` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](https://eu.posthog.com/project/178894/dashboard/680609)
- [Project clicks over time](https://eu.posthog.com/project/178894/insights/yoTQ0ton)
- [Blog post clicks over time](https://eu.posthog.com/project/178894/insights/pnUeny8q)
- [Contact & CV engagement](https://eu.posthog.com/project/178894/insights/Zmxh9Ogv)
- [Social link clicks by platform](https://eu.posthog.com/project/178894/insights/LZqctbKr)
- [Article sharing & AI exploration](https://eu.posthog.com/project/178894/insights/GfGXmWZx)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
