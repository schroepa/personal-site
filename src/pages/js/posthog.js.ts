// Gebaut als statische Datei dist/js/posthog.js: PostHog erst nach Statistik-Einwilligung (siehe src/scripts/posthog-skript.ts).
import type { APIRoute } from "astro"
import { posthogSkript } from "@/scripts/posthog-skript.ts"

export const GET: APIRoute = () =>
  new Response(posthogSkript(import.meta.env.PUBLIC_POSTHOG_PROJECT_TOKEN, import.meta.env.PUBLIC_POSTHOG_HOST), {
    headers: { "Content-Type": "text/javascript; charset=utf-8" },
  })
