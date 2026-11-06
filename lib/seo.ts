import "server-only";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants";
import { getContent } from "@/lib/content";
import type { Locale, ViewKey } from "@/lib/content/types";
import { locales } from "@/lib/i18n";
import { VIEW_PATH } from "@/lib/views";

export const OG_LOCALE: Record<Locale, string> = {
  vi: "vi_VN",
  en: "en_US",
};

/** Canonical + hreflang (incl. x-default) for a path without locale prefix. */
export const pageAlternates = (lang: Locale, path: string) => ({
  canonical: `/${lang}${path}`,
  languages: {
    ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
    "x-default": `/vi${path}`,
  },
});

/**
 * A page that sets its own `openGraph` loses the image inherited from the
 * segment's opengraph-image file, so pass it explicitly.
 */
export const socialImages = (lang: Locale, alt: string) => ({
  openGraph: [
    { url: `/${lang}/opengraph-image`, width: 1200, height: 630, alt },
  ],
  twitter: [`/${lang}/twitter-image`],
});

export function pageMetadata({
  lang,
  path,
  title,
  description,
}: {
  lang: Locale;
  path: string;
  title: string;
  description: string;
}): Metadata {
  const images = socialImages(lang, `${title} — Vũ Bảo Khanh`);
  return {
    title,
    description,
    alternates: pageAlternates(lang, path),
    openGraph: {
      type: "website",
      url: `${SITE_URL}/${lang}${path}`,
      title,
      description,
      locale: OG_LOCALE[lang],
      siteName: "Vũ Bảo Khanh — Fullstack Portfolio",
      images: images.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.twitter,
    },
  };
}

export function viewMetadata(lang: Locale, key: ViewKey): Metadata {
  const view = getContent(lang).views.find((v) => v.key === key)!;
  return pageMetadata({
    lang,
    path: VIEW_PATH[key],
    title: view.title,
    description: view.description,
  });
}
