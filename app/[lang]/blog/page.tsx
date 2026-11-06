import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogShell from "@/components/blog/BlogShell";
import { formatDate, getPosts } from "@/lib/blog";
import { getContent } from "@/lib/content";
import { hasLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/blog">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { blog } = getContent(lang).ui;
  return pageMetadata({
    lang,
    path: "/blog",
    title: blog.title,
    description: blog.description,
  });
}

export default async function BlogIndex({ params }: PageProps<"/[lang]/blog">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const { blog } = getContent(lang).ui;
  const posts = await getPosts(lang);

  return (
    <BlogShell lang={lang} path="/blog">
      <div className="border-b border-blueprint-200 pb-4 mb-6">
        <div className="text-xs font-mono text-blueprint-500 uppercase tracking-widest">
          {blog.kicker}
        </div>
        <h1 className="text-lg font-bold text-blueprint-950">{blog.title}</h1>
        <p className="text-xs text-blueprint-500 font-mono mt-1">
          {blog.subtitle}
        </p>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm font-mono text-blueprint-500">{blog.empty}</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/${lang}/blog/${p.slug}`}
                className="block bg-white border border-blueprint-200 rounded-lg p-5 shadow-2xs hover:border-blueprint-900 transition-colors"
              >
                <div className="text-[10px] font-mono text-blueprint-400 uppercase">
                  {formatDate(p.date, lang)} ·{" "}
                  {blog.minRead.replace("{n}", String(p.minutes))}
                </div>
                <h2 className="text-base font-bold text-blueprint-950 mt-1">
                  {p.title}
                </h2>
                <p className="text-xs text-blueprint-600 mt-2 leading-relaxed">
                  {p.summary}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-3 text-[11px] font-mono">
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 bg-blueprint-100 text-blueprint-800 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </BlogShell>
  );
}
