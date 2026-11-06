import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import Script from "next/script";
import { CONTACT, SITE_URL } from "@/lib/constants";
import { getContent } from "@/lib/content";
import { hasLocale, locales } from "@/lib/i18n";
import { OG_LOCALE, pageAlternates } from "@/lib/seo";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "vietnamese"],
});

/** Applies the saved/system theme before paint so there is no light flash. */
const THEME_INIT = `try{var t=localStorage.getItem("theme");if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const { meta } = getContent(lang);

  const keywords =
    lang === "vi"
      ? [
          "Vũ Bảo Khanh",
          "Fullstack Developer",
          "Lập trình viên Fullstack",
          "React",
          "TypeScript",
          "NestJS",
          "PostgreSQL",
          "Docker",
          "Hồ sơ năng lực",
          "CV",
        ]
      : [
          "Vu Bao Khanh",
          "Fullstack Developer",
          "React",
          "TypeScript",
          "NestJS",
          "PostgreSQL",
          "Docker",
          "Portfolio",
          "CV",
          "Software Engineer",
        ];

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: meta.title,
      template: "%s — Vũ Bảo Khanh",
    },
    description: meta.description,
    authors: [{ name: CONTACT.name, url: CONTACT.github }],
    creator: CONTACT.name,
    publisher: CONTACT.name,
    keywords,
    alternates: {
      ...pageAlternates(lang, ""),
      types: { "application/rss+xml": "/feed.xml" },
    },
    openGraph: {
      type: "website",
      locale: OG_LOCALE[lang],
      alternateLocale: lang === "vi" ? ["en_US"] : ["vi_VN"],
      url: `${SITE_URL}/${lang}`,
      title: meta.title,
      description: meta.description,
      siteName: "Vũ Bảo Khanh — Fullstack Portfolio",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: CONTACT.name,
    jobTitle: "Fullstack Developer",
    description: getContent(lang).meta.description,
    inLanguage: lang,
    worksFor: { "@type": "Organization", name: "BM WEB Co., Ltd" },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "FPT Polytechnic Can Tho",
    },
    url: `${SITE_URL}/${lang}`,
    sameAs: [CONTACT.github],
    email: `mailto:${CONTACT.email}`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ho Chi Minh City",
      addressCountry: "VN",
    },
    knowsAbout: [
      "React",
      "Next.js",
      "TypeScript",
      "NestJS",
      "PostgreSQL",
      "Docker",
      "Redis",
      "Web Performance",
      "Technical SEO",
    ],
  };

  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body
        suppressHydrationWarning
        className="bg-blueprint-50 text-blueprint-900 font-sans antialiased min-h-screen md:h-screen flex flex-col md:overflow-hidden selection:bg-blueprint-900 selection:text-white"
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
