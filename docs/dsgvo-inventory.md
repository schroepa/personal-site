# DSGVO — technisches Inventar (Vorlage)

> **Kein Rechtsrat.** Diese Datei listet nur, was im Code/Deploy der Site tatsächlich eingebunden ist.
> Beim Schreiben der Datenschutzerklärung kannst du die Abschnitte unten übernehmen und mit Rechtsgrundlage, Speicherdauer und AV-Verträgen ergänzen.

**Stand der Codebasis:** automatisch aus dem Repo abgeleitet — vor Veröffentlichung prüfen.

---

## Verantwortlicher (von dir ausfüllen)

- Name: Patrick Schröder
- Adresse: `[PLZ Ort, Straße]`
- E-Mail: kontakt@ptrckschrdtr.de

---

## 1. Hosting — Vercel Inc.

| | |
|---|---|
| **Zweck** | Auslieferung der statischen Website |
| **Daten** | IP-Adresse, Zugriffszeitpunkt, User-Agent, Referrer, angeforderte URL |
| **Quelle im Projekt** | Deployment auf Vercel; Erwähnung in `src/pages/datenschutz.astro` |
| **Drittland** | USA — EU-US Data Privacy Framework |
| **Links** | https://vercel.com/legal/privacy-policy |

**Deine Aufgabe:** Speicherdauer der Logs bei Vercel prüfen; AVV/DPA mit Vercel abschließen falls nötig.

---

## 2. Consent — Cookiebot (Usercentrics / Cybot A/S)

| | |
|---|---|
| **Zweck** | Einwilligungsverwaltung, Script-Blocking |
| **Cookie-ID** | `302ab2a4-6e4a-43b3-82b6-f1d58c3f19f8` |
| **Quelle** | `src/layouts/BaseLayout.astro` — `consent.cookiebot.com/uc.js`, `data-blockingmode="auto"` |
| **Footer** | Button „Cookie-Einstellungen“ → `Cookiebot.renew()` |
| **Rechtsgrundlage (typisch)** | Art. 6 Abs. 1 lit. c (Consent-Pflicht) / lit. f |

**Deine Aufgabe:** Cookiebot-Dashboard: Scan durchführen, Kategorien (notwendig / Statistik / Marketing) den Diensten zuordnen.

---

## 3. Google Analytics 4

| | |
|---|---|
| **ID** | `G-3SFN6YV6W9` |
| **Quelle** | `BaseLayout.astro` — direktes `gtag.js` |
| **Consent** | Google Consent Mode v2 Defaults = `denied`; Update über Cookiebot prüfen |
| **Rechtsgrundlage (typisch)** | Art. 6 Abs. 1 lit. a (Einwilligung) |

---

## 4. Google Tag Manager

| | |
|---|---|
| **Container** | `GTM-T4HLWZWZ` |
| **Quelle** | `BaseLayout.astro` (Script + noscript-iframe) |
| **Hinweis** | GA4 läuft **zusätzlich** direkt — Doppelung vermeiden oder in Datenschutz erklären |

---

## 5. PostHog (Product Analytics)

| | |
|---|---|
| **Quelle** | `src/components/posthog.astro` |
| **Env-Variablen** | `PUBLIC_POSTHOG_PROJECT_TOKEN`, `PUBLIC_POSTHOG_HOST` |
| **Consent** | Lädt nur bei `Cookiebot.consent.statistics` |
| **Events (Auszug)** | `project_clicked`, `blog_post_clicked`, `cv_downloaded`, `theme_toggled`, `contact_email_clicked`, `article_shared`, `ai_link_clicked` |
| **Rechtsgrundlage (typisch)** | Art. 6 Abs. 1 lit. a |

**Deine Aufgabe:** AVV mit PostHog; EU-Hosting bestätigen; Retention in PostHog-Projekt setzen; **keine E-Mail-Adressen** in Events (Code prüfen: `contact_email_clicked`).

---

## 6. Schriften (self-hosted)

| | |
|---|---|
| **Zweck** | Typografie (Geist Variable, Geist Mono) |
| **Quelle** | `public/fonts/` — kopiert via `scripts/copy-fonts.mjs` aus `@fontsource/*` |
| **Rechtsgrundlage (typisch)** | Art. 6 Abs. 1 lit. f (berechtigtes Interesse an einheitlicher Darstellung) |
| **Hinweis** | Kein Google Fonts, kein jsDelivr mehr (nach Phase-2-Update) |

---

## 7. Lokale Speicherung (localStorage)

| | |
|---|---|
| **Schlüssel** | `theme` (`dark` / `light`) |
| **Quelle** | `BaseLayout.astro` — Dark-Mode-Toggle |
| **Rechtsgrundlage (typisch)** | Art. 6 Abs. 1 lit. f — UX-Präferenz, kein Tracking |

---

## 8. Externe Links (kein automatisches Tracking)

| Dienst | Wo |
|--------|-----|
| LinkedIn, Instagram, GitHub | Footer `BaseLayout.astro` |
| LinkedIn Share | `ArticleFooter.astro` |
| Claude, ChatGPT, Perplexity | `ArticleFooter.astro` — URL/Titel nur bei Klick in Query-String |

---

## 9. LLM / KI-Crawler

| Endpunkt | Inhalt |
|----------|--------|
| `/llms.txt` | Index Blog, Projekte, Seiten |
| `/llms-full.txt` | Volltexte aller veröffentlichten Beiträge |

Keine personenbezogenen Daten Dritter — nur öffentliche Inhalte.

---

## 10. Checkliste vor Go-Live

- [ ] Impressum: alle PLACEHOLDER ersetzt (`src/pages/impressum.astro`)
- [ ] Datenschutz: Abschnitte 3–4 **nicht** mehr „kein Tracking / keine Cookies“ (`src/pages/datenschutz.astro`)
- [ ] Cookiebot-Scan = Live-Site
- [ ] GA **oder** GTM konsolidieren
- [ ] PostHog AVV + Retention
- [ ] Vercel DPA
- [ ] Stand-Datum in Datenschutz
- [ ] Optional: Aufsichtsbehörde Berlin (wenn du dort ansässig bist) in § Beschwerderecht

---

## Wie ich dir beim DSGVO-Text helfen kann

1. **Diese Inventar-Datei** beim Schreiben der Erklärung nutzen (Fakten, keine Formulierungs-Garantie).
2. **Entwurf pro Abschnitt** — du gibst Adresse/Stand an, ich formuliere einen Markdown-Entwurf für `datenschutz.astro`.
3. **Diff-Review:** du schickst deinen Text, ich prüfe gegen das Repo ob etwas fehlt oder widersprüchlich ist.
4. **Cookiebot-Kategorie-Mapping** als Tabelle aus dem Code.

**Nicht:** Rechtsberatung, Haftung für Vollständigkeit gegenüber Behörden.
