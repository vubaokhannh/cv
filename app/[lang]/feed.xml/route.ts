import { notFound } from "next/navigation";
import { getPosts } from "@/lib/blog";
import { CONTACT, SITE_URL } from "@/lib/constants";
import { getContent } from "@/lib/content";
import { hasLocale, locales } from "@/lib/i18n";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/** One RSS feed per language, so readers never get mixed-language items. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ lang: string }> },
) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const { blog } = getContent(lang).ui;
  const posts = await getPosts(lang);
  const feedUrl = `${SITE_URL}/${lang}/feed.xml`;

  const itemsXml = posts
    .map((post) => {
      const url = `${SITE_URL}/${lang}/blog/${post.slug}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.summary)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>${CONTACT.email} (${CONTACT.name})</author>
      ${post.tags.map((t) => `<category>${escapeXml(t)}</category>`).join("\n      ")}
    </item>`;
    })
    .join("\n");

  // Last build = newest post (deterministic, so the feed stays cacheable).
  const lastBuild = new Date(posts[0]?.updated ?? Date.now()).toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${CONTACT.name} — ${blog.title}`)}</title>
    <link>${SITE_URL}/${lang}/blog</link>
    <description>${escapeXml(blog.description)}</description>
    <language>${lang}</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate",
    },
  });
}
