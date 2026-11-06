import Link from "next/link";
import type { Locale } from "@/lib/i18n";

const COPY: Record<
  Locale,
  { heading: string; body: string; home: string; blog: string }
> = {
  vi: {
    heading: "Trang không tồn tại",
    body: "Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển.",
    home: "← Về trang chủ",
    blog: "Xem Blog",
  },
  en: {
    heading: "Page not found",
    body: "The page you requested does not exist or has been moved.",
    home: "← Back to home",
    blog: "Browse blog",
  },
};

/**
 * The one 404 design. With `lang` it is localized; without (the global 404,
 * where the language isn't known) it shows both languages.
 */
export default function NotFoundCard({ lang }: { lang?: Locale }) {
  const langs: Locale[] = lang ? [lang] : ["vi", "en"];
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-dot-grid min-h-screen">
      <div className="bg-white border border-blueprint-200 rounded-lg max-w-md w-full p-6 sm:p-8 shadow-2xs">
        <div className="text-[11px] font-mono uppercase tracking-widest text-blueprint-400 mb-2">
          {"// HTTP 404 · NOT FOUND"}
        </div>

        <div className="space-y-4 mb-6">
          {langs.map((l) => (
            <div key={l}>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-blueprint-950 mb-1">
                {COPY[l].heading}
              </h1>
              <p className="text-xs text-blueprint-600 font-mono leading-relaxed">
                {COPY[l].body}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 font-mono text-xs">
          {langs.map((l) => (
            <span key={l} className="contents">
              <Link
                href={`/${l}`}
                className="px-3 py-1.5 bg-blueprint-900 text-white rounded hover:bg-blueprint-950 transition-colors"
              >
                {lang ? COPY[l].home : `${l.toUpperCase()} · ${COPY[l].home}`}
              </Link>
              {lang && (
                <Link
                  href={`/${l}/blog`}
                  className="px-3 py-1.5 border border-blueprint-200 bg-white rounded hover:bg-blueprint-50 text-blueprint-800 transition-colors"
                >
                  {COPY[l].blog}
                </Link>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
