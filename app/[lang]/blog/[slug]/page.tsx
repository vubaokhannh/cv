import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AuthorCard from "@/components/blog/AuthorCard";
import BlogShell from "@/components/blog/BlogShell";
import Markdown from "@/components/blog/Markdown";
import TableOfContents from "@/components/blog/TableOfContents";
import { jsonLd } from "@/lib/jsonld";
import { extractToc, formatDate, getPost, getPosts } from "@/lib/blog";
import { CONTACT, SITE_URL } from "@/lib/constants";
import { getContent } from "@/lib/content";
import { hasLocale, locales } from "@/lib/i18n";
import { OG_LOCALE } from "@/lib/seo";

export async function generateStaticParams() {
  const all = await Promise.all(
    locales.map(async (lang) =>
      (await getPosts(lang)).map((p) => ({ lang, slug: p.slug })),
    ),
  );
  return all.flat();
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/blog/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) return {};
  const post = await getPost(lang, slug);
  if (!post) return {};

  const title = post.title; // the layout template appends the site name
  const description = post.summary;

  // Check if article exists in other languages for hreflang alternates
  const availableLangs = (
    await Promise.all(
      locales.map(async (l) => ((await getPost(l, slug)) ? l : null)),
    )
  ).filter((l): l is (typeof locales)[number] => l !== null);

  const languages: Record<string, string> = {};
  for (const l of availableLangs) {
    languages[l] = `/${l}/blog/${slug}`;
  }

  return {
    title,
    description,
    authors: [{ name: CONTACT.name, url: CONTACT.github }],
    keywords: post.tags,
    alternates: {
      canonical: `/${lang}/blog/${slug}`,
      languages: {
        ...languages,
        "x-default": `/${availableLangs[0]}/blog/${slug}`,
      },
    },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/${lang}/blog/${slug}`,
      title,
      description,
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [CONTACT.name],
      tags: post.tags,
      locale: OG_LOCALE[lang],
      siteName: "Vũ Bảo Khanh — Fullstack Portfolio",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function BlogPostPage({
  params,
}: PageProps<"/[lang]/blog/[slug]">) {
  // `params` is read inside <Suspense> so the shell can render instantly.
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <BlogPost params={params} />
    </Suspense>
  );
}

async function BlogPost({
  params,
}: {
  params: PageProps<"/[lang]/blog/[slug]">["params"];
}) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const post = await getPost(lang, slug);
  if (!post) notFound();

  const toc = extractToc(post.body);
  const { blog } = getContent(lang).ui;
  const available = (
    await Promise.all(
      locales.map(async (l) => ((await getPost(l, slug)) ? l : null)),
    )
  ).filter((l) => l !== null);

  const postUrl = `${SITE_URL}/${lang}/blog/${slug}`;
  const postJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: post.title,
        description: post.summary,
        datePublished: post.date,
        dateModified: post.updated,
        inLanguage: lang,
        author: {
          "@type": "Person",
          name: CONTACT.name,
          url: `${SITE_URL}/${lang}`,
        },
        image: `${postUrl}/opengraph-image`,
        mainEntityOfPage: postUrl,
        url: postUrl,
        keywords: post.tags,
        wordCount: post.body.split(/\s+/).length,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: CONTACT.name,
            item: `${SITE_URL}/${lang}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: blog.title,
            item: `${SITE_URL}/${lang}/blog`,
          },
          { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
        ],
      },
    ],
  };

  return (
    <BlogShell
      lang={lang}
      path={`/blog/${slug}`}
      available={available}
      maxWidth="max-w-5xl xl:max-w-6xl"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(postJsonLd) }}
      />
      <Link
        href={`/${lang}/blog`}
        className="text-xs font-mono text-blueprint-500 hover:text-blueprint-950 inline-block mb-3"
      >
        ← {blog.back}
      </Link>

      <div className="flex flex-col lg:flex-row items-start gap-6 xl:gap-8">
        <article className="min-w-0 flex-1 w-full bg-white border border-blueprint-200 rounded-lg p-5 sm:p-8 shadow-2xs">
          <header className="border-b border-blueprint-100 pb-4 mb-4">
            <div className="text-xs font-mono text-blueprint-400 uppercase">
              {formatDate(post.date, lang)} ·{" "}
              {blog.minRead.replace("{n}", String(post.minutes))}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-blueprint-950 mt-1">
              {post.title}
            </h1>
            <div className="flex flex-wrap gap-1.5 mt-3 text-xs font-mono">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 bg-blueprint-100 text-blueprint-800 rounded"
                >
                  {t}
                </span>
              ))}
            </div>
          </header>

          {/* Inline TOC on mobile and tablet */}
          <div className="lg:hidden">
            <TableOfContents
              items={toc}
              label={blog.toc}
              lang={lang}
              variant="inline"
            />
          </div>

          <div className="text-sm text-blueprint-700 leading-relaxed">
            <Markdown sectionLabel={blog.sectionLink}>{post.body}</Markdown>
          </div>

          <AuthorCard lang={lang} />
        </article>

        {/* Sticky TOC alongside the article on desktop */}
        {toc.length > 0 && (
          <aside className="hidden lg:block w-56 xl:w-64 shrink-0 sticky top-6">
            <TableOfContents
              items={toc}
              label={blog.toc}
              lang={lang}
              variant="sidebar"
            />
          </aside>
        )}
      </div>
    </BlogShell>
  );
}
