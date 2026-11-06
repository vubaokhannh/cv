# cv_demo

Bilingual (vi / en) portfolio & CV site for Vũ Bảo Khanh, built with Next.js (App Router), TypeScript and Tailwind CSS v4.

```bash
npm run dev     # http://localhost:3000  (redirects to /vi or /en)
npm run build   # production build
npm run lint
```

## Structure

```
app/
  [lang]/                 locale-scoped routes (/vi, /en)
    layout.tsx            fonts, <html lang>, metadata + OG
    page.tsx              workspace (Experience / Projects)
    blog/                 blog index and /blog/[slug]
    not-found.tsx         localized 404 page (wrapped in layout)
  opengraph-image.tsx     dynamic technical OG image (1200x630)
  twitter-image.tsx       Twitter card image
  sitemap.ts              dynamic sitemap.xml generator with alternates
  robots.ts               robots.txt generator
  globals.css             Tailwind theme (blueprint palette) + utilities
components/
  workspace/              interactive shell: TopBar, Sidebar, tabs, command palette, toast
  views/                  Experience, Projects, Architecture diagram
  blog/                   BlogShell, Markdown renderer
  shared/                 LocaleContext, LanguageSwitcher, SectionHeader
content/blog/<lang>/      blog posts as Markdown (+ frontmatter)
lib/
  content/                en.ts / vi.ts (all copy) + types.ts — server-only entry in index.ts
  i18n.ts                 locales + helpers (safe for client/proxy)
  constants.ts            language-independent facts (contact, tech lists, SITE_URL)
  blog.ts                 reads & parses blog Markdown (server-only)
proxy.ts                  redirects / → /vi | /en, checks blog posts for true HTTP 404
public/                   CV PDF
.env.example              example env vars (NEXT_PUBLIC_SITE_URL)
```

## Environment variables

- `NEXT_PUBLIC_SITE_URL`: Root canonical domain (e.g. `https://vubaokhanh.tech`). Used for `metadataBase`, `sitemap.xml`, `robots.txt`, and Open Graph canonical URLs. Fallback: `https://vubaokhanh.tech`.
- `NEXT_PUBLIC_GA_ID`: (Optional) Google Analytics Measurement ID (e.g. `G-XXXXXXXXXX`).

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
- **Blog posts:** add `content/blog/<vi|en>/<slug>.md` with `title`, `date`, `summary`, `tags` frontmatter. Use the same slug in both languages to link translations.
