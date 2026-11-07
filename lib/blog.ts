import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Locale } from "@/lib/content";
import { parsePost, type Post, type PostMeta } from "@/lib/post-parse";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export { extractToc } from "@/lib/post-parse";
export type { Post, PostMeta, TocItem } from "@/lib/post-parse";

export async function getPost(
  lang: Locale,
  slug: string,
): Promise<Post | null> {
  "use cache";
  if (!SLUG_RE.test(slug)) return null; // also blocks path traversal
  try {
    const raw = await readFile(path.join(BLOG_DIR, lang, `${slug}.md`), "utf8");
    return parsePost(slug, raw);
  } catch (err) {
    // A missing file is a 404; a malformed post must fail loudly.
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function getPosts(lang: Locale): Promise<PostMeta[]> {
  "use cache";
  let files: string[];
  try {
    files = await readdir(path.join(BLOG_DIR, lang));
  } catch {
    return [];
  }
  const posts = await Promise.all(
    files
      .filter((f) => f.endsWith(".md"))
      .map((f) => getPost(lang, f.slice(0, -3))),
  );
  return posts
    .filter((p): p is Post => p !== null)
    .map((p): PostMeta => {
      const { body, ...meta } = p;
      void body;
      return meta;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function formatDate(iso: string, lang: Locale) {
  return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(iso));
}
