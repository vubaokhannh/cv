# cv_demo

Bilingual (vi / en) portfolio & CV site for Vũ Bảo Khanh, built with Next.js (App Router), TypeScript and Tailwind CSS v4.

```bash
npm run dev     # http://localhost:3000  (redirects to /vi or /en)
npm run build   # production build
npm run lint
```

## Scripts

```bash
npm run check      # lint + typecheck + unit tests (same as CI)
npm test           # vitest (lib/*.test.ts)
```

CI (`.github/workflows/ci.yml`) runs lint, typecheck, tests and build on every push / PR. Requires Node >= 22.

## Structure

```
app/
  [lang]/                 locale-scoped routes (/vi, /en)
    layout.tsx            fonts, <html lang>, metadata, JSON-LD, analytics
    (site)/               workspace views (Experience / Projects / Contact)
    blog/                 blog index and /blog/[slug] (+ per-post OG/Twitter images)
    feed.xml/route.ts     per-language RSS feed (/vi/feed.xml, /en/feed.xml)
    opengraph-image.tsx   technical OG image (1200x630), statically generated
    not-found.tsx         localized 404 page
  feed.xml/route.ts       legacy URL, redirects to the default-language feed
  global-not-found.tsx    404 for URLs that match no route
  sitemap.ts, robots.ts
components/
  workspace/              interactive shell: TopBar, Sidebar, tabs, command palette, toast
  views/                  Experience (server), Projects, Contact, Architecture diagram
  blog/                   BlogShell, Markdown renderer (syntax highlighting), TOC
  shared/                 LocaleContext, LanguageSwitcher, ThemeToggle, useFocusTrap
content/blog/<lang>/      blog posts as Markdown (+ frontmatter)
lib/
  content/                en.ts / vi.ts (all copy) + types.ts, server-only entry in index.ts
  post-parse.ts           pure frontmatter parser + TOC extraction (unit tested)
  blog.ts                 reads blog Markdown from disk (server-only)
  jsonld.ts               safe JSON-LD serialisation
  i18n.ts, views.ts, seo.ts, constants.ts, slugify.ts
proxy.ts                  redirects / to /vi | /en, returns a real HTTP 404 for missing posts
```

## Environment variables

- `NEXT_PUBLIC_SITE_URL`: Root canonical domain (e.g. `https://vubaokhanh.tech`). Used for `metadataBase`, `sitemap.xml`, `robots.txt`, and Open Graph canonical URLs. Fallback: `https://vubaokhanh.tech`.
- `NEXT_PUBLIC_GA_ID`: (Optional) Google Analytics Measurement ID (e.g. `G-XXXXXXXXXX`). Inlined at build time; `docker compose` passes it as a build arg.

## Deployment on Proxmox VM (Docker)

The project is configured for standalone production deployment:

```bash
# Build and run with Docker Compose on your VM
docker compose up -d --build

# Check logs
docker compose logs -f
```

The app will run on port `3000`. You can configure Nginx, Caddy, or Cloudflare Tunnel on your Proxmox VM to proxy requests from `https://vubaokhanh.tech` to `http://localhost:3000`.

## Editing content

- **CV text / UI labels:** edit `lib/content/en.ts` and `lib/content/vi.ts` (both must satisfy `Content` in `types.ts`).
- **Blog posts:** add `content/blog/<vi|en>/<slug>.md` with `title`, `date` (YYYY-MM-DD), `summary` (all required; the build fails if missing/invalid), optional `updated` and `tags` (comma separated) frontmatter. Use the same slug in both languages to link translations.
