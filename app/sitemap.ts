import type { MetadataRoute } from "next";
import { getPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/constants";
import { locales } from "@/lib/i18n";
import { VIEW_PATH } from "@/lib/views";

const languagesFor = (path: string, langs = locales) => ({
  ...Object.fromEntries(langs.map((l) => [l, `${SITE_URL}/${l}${path}`])),
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [vi, en] = await Promise.all([getPosts("vi"), getPosts("en")]);
  const slugs = {
    vi: new Set(vi.map((p) => p.slug)),
    en: new Set(en.map((p) => p.slug)),
  };

  // Static pages: no lastModified — an inaccurate date is worse than none.
  const pages: MetadataRoute.Sitemap = [
    ...Object.values(VIEW_PATH),
    "/blog",
  ].flatMap((path) =>
    locales.map((lang) => ({
      url: `${SITE_URL}/${lang}${path}`,
      changeFrequency:
        path === "/blog" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/blog" ? 0.8 : 0.7,
      alternates: { languages: languagesFor(path) },
    })),
  );

  const posts: MetadataRoute.Sitemap = (["vi", "en"] as const).flatMap((lang) =>
    (lang === "vi" ? vi : en).map((post) => {
      const both = slugs.vi.has(post.slug) && slugs.en.has(post.slug);
      return {
        url: `${SITE_URL}/${lang}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "monthly" as const,
        priority: 0.6,
        alternates: {
          languages: languagesFor(
            `/blog/${post.slug}`,
            both ? locales : [lang],
          ),
        },
      };
    }),
  );

  return [...pages, ...posts];
}
