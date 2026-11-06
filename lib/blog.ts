import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Locale } from "@/lib/content";
import { slugify } from "@/lib/slugify";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractToc(markdown: string): TocItem[] {
  const headingRe = /^(#{2,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;
  while ((match = headingRe.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2]
      .trim()
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1");
    const id = slugify(text);
    if (id) {
      items.push({ id, text, level });
    }
  }
  return items;
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  summary: string;
  tags: string[];
  minutes: number;
}

export interface Post extends PostMeta {
  body: string;
}

/** Minimal `---` frontmatter parser (flat `key: value` pairs). */
function parse(slug: string, raw: string): Post {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const front: Record<string, string> = {};
  const body = match ? match[2] : raw;
  if (match) {
    for (const line of match[1].split(/\r?\n/)) {
      const i = line.indexOf(":");
      if (i > 0) front[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  const words = body.trim().split(/\s+/).length;
  return {
    slug,
    title: front.title ?? slug,
    date: front.date ?? "1970-01-01",
    summary: front.summary ?? "",
    tags: front.tags
      ? front.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    minutes: Math.max(1, Math.round(words / 200)),
    body: body.trim(),
  };
}

export async function getPost(
  lang: Locale,
  slug: string,
): Promise<Post | null> {
  "use cache";
  if (!SLUG_RE.test(slug)) return null; // also blocks path traversal
  try {
    const raw = await readFile(path.join(BLOG_DIR, lang, `${slug}.md`), "utf8");
    return parse(slug, raw);
  } catch {
    return null;
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
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      date: p.date,
      summary: p.summary,
      tags: p.tags,
      minutes: p.minutes,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function formatDate(iso: string, lang: Locale) {
  return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(iso));
}
