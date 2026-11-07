import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n";

interface LanguageSwitcherProps {
  lang: Locale;
  label: string;
  /** Target URL for each language. */
  hrefFor: (lang: Locale) => string;
  replace?: boolean;
}

export default function LanguageSwitcher({
  lang,
  label,
  hrefFor,
  replace,
}: LanguageSwitcherProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center rounded border border-blueprint-200 overflow-hidden text-xs"
    >
      {locales.map((l) =>
        l === lang ? (
          <span
            key={l}
            aria-current="true"
            className="px-2 py-1 uppercase bg-blueprint-900 text-white"
          >
            {l}
          </span>
        ) : (
          <Link
            key={l}
            href={hrefFor(l)}
            hrefLang={l}
            replace={replace}
            className="px-2 py-1 uppercase bg-white text-blueprint-600 hover:bg-blueprint-50 transition-colors"
          >
            {l}
          </Link>
        ),
      )}
    </div>
  );
}
