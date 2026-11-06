import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { getContent } from "@/lib/content";
import { locales, type Locale } from "@/lib/i18n";

interface BlogShellProps {
  lang: Locale;
  /** Path after the locale, e.g. "/blog" or "/blog/my-post". */
  path: string;
  /** Locales in which the current page exists (language switcher targets). */
  available?: Locale[];
  /** Container max-width override (defaults to "max-w-3xl"). */
  maxWidth?: string;
  children: React.ReactNode;
}

/** Header + scroll container shared by the blog pages (server component). */
export default function BlogShell({
  lang,
  path,
  available = locales,
  maxWidth = "max-w-3xl",
  children,
}: BlogShellProps) {
  const { ui } = getContent(lang);
  return (
    <>
      <header className="h-12 border-b border-blueprint-200 bg-white/95 backdrop-blur px-3 sm:px-4 flex items-center justify-between text-xs font-mono select-none z-30 shrink-0 sticky top-0">
        <Link
          href={`/${lang}`}
          className="flex items-center gap-2 text-blueprint-700 hover:text-blueprint-950"
        >
          <ArrowLeft />
          <span className="font-semibold tracking-tight text-sm text-blueprint-900">
            VUBAOKHANH.TECH
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle lightLabel={ui.theme.light} darkLabel={ui.theme.dark} />
          <LanguageSwitcher
            lang={lang}
            label={ui.topbar.switchLang}
            hrefFor={(l) =>
              available.includes(l) ? `/${l}${path}` : `/${l}/blog`
            }
          />
        </div>
      </header>

      <main className="flex-1 md:overflow-y-auto bg-dot-grid">
        <div className={`${maxWidth} mx-auto w-full p-4 sm:p-6 md:p-8`}>
          {children}
        </div>
      </main>
    </>
  );
}
