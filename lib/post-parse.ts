import { slugify } from "@/lib/slugify";

/** Pure (no fs, no server-only) helpers for blog Markdown — unit-testable. */

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface PostMeta {
  slug: string;
  title: string;
  date: string; // ISO yyyy-mm-dd
  /** ISO date of the last meaningful edit; falls back to `date`. */
  updated: string;
  summary: string;
  tags: string[];
  minutes: number;
}

export interface Post extends PostMeta {
  body: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Strips one pair of matching surrounding quotes. */
const unquote = (v: string) => v.replace(/^(["'])(.*)\1$/, "$2");

/** Returns a function that makes heading ids unique ("a", "a-2", "a-3"). */
export function createSlugger() {
  const seen = new Map<string, number>();
  return (text: string) => {
    const base = slugify(text);
    if (!base) return "";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}

/** Removes fenced code blocks so their contents are never read as headings. */
function stripFences(markdown: string): string {
  return markdown.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, "");
}

export function extractToc(markdown: string): TocItem[] {
  const headingRe = /^(#{2,3})\s+(.+)$/gm;
  const slug = createSlugger();
  const items: TocItem[] = [];
  let match;
  const source = stripFences(markdown);
  while ((match = headingRe.exec(source)) !== null) {
    const text = match[2]
      .trim()
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1");
    const id = slug(text);
    if (id) items.push({ id, text, level: match[1].length });
  }
  return items;
}

/**
 * Minimal `---` frontmatter parser (flat `key: value` pairs).
 * Throws on missing/invalid required fields so a bad post fails the build
 * instead of silently shipping a 1970 date or an empty title.
 */
export function parsePost(slug: string, raw: string): Post {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`[blog] ${slug}: missing frontmatter`);

  const front: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) front[line.slice(0, i).trim()] = unquote(line.slice(i + 1).trim());
  }
  const body = match[2].trim();

  for (const key of ["title", "date", "summary"]) {
    if (!front[key]) throw new Error(`[blog] ${slug}: missing "${key}"`);
  }
  for (const key of ["date", "updated"]) {
    if (front[key] && !ISO_DATE.test(front[key])) {
      throw new Error(`[blog] ${slug}: "${key}" must be YYYY-MM-DD`);
    }
  }

  const words = body.split(/\s+/).length;
  return {
    slug,
    title: front.title,
    date: front.date,
    updated: front.updated || front.date,
    summary: front.summary,
    tags: (front.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
    minutes: Math.max(1, Math.round(words / 200)),
    body,
  };
}
