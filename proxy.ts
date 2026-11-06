import { NextResponse, type NextRequest } from "next/server";
import { existsSync } from "node:fs";
import path from "node:path";
import { defaultLocale, hasLocale, locales, type Locale } from "@/lib/i18n";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Whether a blog post is known to be missing. Fails open: if the content
 * folder can't be read at runtime (e.g. a host that doesn't bundle it), the
 * page itself decides and calls notFound().
 */
function isMissingPost(lang: string, slug: string): boolean {
  const dir = path.join(BLOG_DIR, lang);
  if (!existsSync(dir)) return false;
  return !SLUG_RE.test(slug) || !existsSync(path.join(dir, `${slug}.md`));
}

const NOT_FOUND_COPY: Record<
  Locale,
  { title: string; heading: string; body: string; blog: string; home: string }
> = {
  vi: {
    title: "404: Không tìm thấy bài viết",
    heading: "Bài viết không tồn tại",
    body: "Bài viết bạn yêu cầu không tồn tại hoặc đã được di chuyển.",
    blog: "← Tất cả bài viết",
    home: "Trang chủ",
  },
  en: {
    title: "404: Post not found",
    heading: "Blog post not found",
    body: "The article you requested does not exist or has been moved.",
    blog: "← All posts",
    home: "Home",
  },
};

/**
 * Pages that call notFound() answer 200 under Cache Components (the response
 * is streamed), so unknown posts get a real 404 from here instead. Kept tiny
 * and self-contained; follows the OS light/dark preference.
 */
function notFoundResponse(lang: Locale) {
  const t = NOT_FOUND_COPY[lang];
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${t.title}</title><style>
:root{--bg:#f8fafc;--card:#fff;--line:#cbd5e1;--fg:#0f172a;--mut:#475569}
@media(prefers-color-scheme:dark){:root{--bg:#0b1120;--card:#0f172a;--line:#334155;--fg:#f1f5f9;--mut:#a8b5c8}}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:1.5rem;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,sans-serif}
.card{max-width:28rem;width:100%;padding:2rem;background:var(--card);border:1px solid var(--line);border-radius:8px}
.k{font:600 11px ui-monospace,monospace;letter-spacing:.1em;color:var(--mut);text-transform:uppercase}
h1{margin:.5rem 0;font-size:1.25rem}p{margin:0 0 1.5rem;color:var(--mut)}
a{font:500 12px ui-monospace,monospace;padding:.5rem .875rem;border-radius:4px;text-decoration:none;border:1px solid var(--line);color:var(--fg);margin-right:.5rem}
a.p{background:var(--fg);color:var(--bg);border-color:var(--fg)}
</style></head><body><div class="card"><div class="k">// HTTP 404</div><h1>${t.heading}</h1><p>${t.body}</p><a class="p" href="/${lang}/blog">${t.blog}</a><a href="/${lang}">${t.home}</a></div></body></html>`;
  return new NextResponse(html, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/** Pick the best supported locale from the Accept-Language header. */
function getLocale(request: NextRequest) {
  const header = request.headers.get("accept-language") ?? "";
  for (const part of header.split(",")) {
    const code = part.split(";")[0].trim().slice(0, 2).toLowerCase();
    if (hasLocale(code)) return code;
  }
  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept requests for blog posts: /<lang>/blog/<slug>
  const blogPostMatch = pathname.match(/^\/([a-z]{2})\/blog\/([^/]+)\/?$/);
  if (blogPostMatch) {
    const [, lang, slug] = blogPostMatch;
    if (hasLocale(lang) && isMissingPost(lang, slug)) {
      return notFoundResponse(lang);
    }
  }

  const hasLocalePrefix = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );
  if (hasLocalePrefix) return;

  const url = request.nextUrl.clone();
  url.pathname = `/${getLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals, metadata files (favicon, icons, sitemap, robots, feed) and any path with a file extension
  matcher: [
    "/((?!api|_next|favicon\\.ico|icon|apple-icon|sitemap\\.xml|robots\\.txt|feed\\.xml|.*\\..*).*)",
  ],
};
