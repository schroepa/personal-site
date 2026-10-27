import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
    coverImage: z.string().optional(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    coverImage: z.string().optional(),
    date: z.coerce.date(),
    // Achtung: tags[0] ist das Label der Projektkarte und des Seitenkopfs (projektMeta: „Tool · 2026“); die Reihenfolge ändern heißt das Label ändern
    tags: z.array(z.string()),
    url: z.string().url().optional(),
    repo: z.string().url().optional(),
    featured: z.boolean().default(false),
    /** Wirkungszeile der Karte (ein Satz); fehlt sie, gilt der erste Satz der Beschreibung */
    wirkung: z.string().optional(),
    /** Seitenverhältnis des Bildes in der Projektkarte (Bento) */
    format: z.enum(['16x10', '4x5', '1x1']).default('16x10'),
    /** Drei Fakten (Rolle, Jahr, Stack): macht das Projekt zur Fallstudie mit fünf Pflichtabschnitten */
    fakten: z.array(z.object({ label: z.string(), wert: z.string() })).length(3).optional(),
    /** Kennzahlen im Abschnitt Ergebnis */
    kennzahlen: z.array(z.object({ wert: z.string(), label: z.string() })).optional(),
    /** true: erscheint in der Liste „Weitere Projekte“ statt im Bento „Ausgewählt“ */
    weitere: z.boolean().default(false),
  }),
});

export const collections = { blog, projects };
