// Gebaut als statische Datei dist/js/kopf.js: Theme, data-js und Bewegungs-Gate vor dem ersten Paint (siehe src/scripts/kopf-skript.ts).
import type { APIRoute } from "astro"
import { kopfSkript } from "@/scripts/kopf-skript.ts"

export const GET: APIRoute = () =>
  new Response(kopfSkript(), { headers: { "Content-Type": "text/javascript; charset=utf-8" } })
