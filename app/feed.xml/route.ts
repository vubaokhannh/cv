import { getPosts } from "@/lib/blog";
import { CONTACT, SITE_URL } from "@/lib/constants";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [viPosts, enPosts] = await Promise.all([
    getPosts("vi"),
    getPosts("en"),
  ]);

  const allItems = [
    ...viPosts.map((p) => ({ ...p, lang: "vi" as const })),
    ...enPosts.map((p) => ({ ...p, lang: "en" as const })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const itemsXml = allItems
    .map((post) => {
      const url = `${SITE_URL}/${post.lang}/blog/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();
      return `    <item>
      <title>${escapeXml(post.title)} [${post.lang.toUpperCase()}]</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.summary)}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${CONTACT.email} (${CONTACT.name})</author>
      ${post.tags.map((t) => `<category>${escapeXml(t)}</category>`).join("\n      ")}
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(CONTACT.name)} — Technical Blog</title>
    <link>${SITE_URL}</link>
    <description>Engineering notes on real-time systems, performance optimization, and web architecture.</description>
    <language>vi</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
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
