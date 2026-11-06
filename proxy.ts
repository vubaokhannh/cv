import { NextResponse, type NextRequest } from "next/server";
import { existsSync } from "node:fs";
import path from "node:path";
import { defaultLocale, hasLocale, locales } from "@/lib/i18n";

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
      // No route matches this path, so Next answers with a real 404 using
      // app/global-not-found.tsx (a page that calls notFound() would stream a 200).
      const url = request.nextUrl.clone();
      url.pathname = `/${lang}/blog/${slug}/missing`;
      return NextResponse.rewrite(url);
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
