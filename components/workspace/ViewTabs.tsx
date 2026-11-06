"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/shared/LocaleContext";
import { viewFromPathname, viewHref } from "@/lib/views";

/** Editor-style tab strip. Each tab is a real link to its own indexable page. */
export default function ViewTabs() {
  const { c, lang } = useLocale();
  const active = viewFromPathname(usePathname());

  return (
    <nav
      aria-label={c.ui.tabs.label}
      className="sticky top-12 md:static z-20 shrink-0 flex items-end justify-between gap-2 px-2 sm:px-4 pt-2 bg-white/95 backdrop-blur border-b border-blueprint-200 font-mono text-[11px] sm:text-xs"
    >
      <div className="flex min-w-0 gap-1 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {c.views.map((v) => {
          const isActive = v.key === active;
          return (
            <Link
              key={v.key}
              href={viewHref(lang, v.key)}
              aria-current={isActive ? "page" : undefined}
              className={`-mb-px px-3 py-2 rounded-t border border-b-0 flex items-center gap-2 whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-blueprint-50 border-blueprint-200 text-blueprint-950 font-semibold"
                  : "bg-transparent border-transparent text-blueprint-500 hover:text-blueprint-900"
              }`}
            >
              <span
                className={
                  isActive ? "text-blueprint-400" : "text-blueprint-300"
                }
              >
                {v.index}
              </span>
              {v.short}
            </Link>
          );
        })}
      </div>

      <div className="hidden sm:flex items-center gap-1.5 pb-2 text-[10px] text-blueprint-400">
        {c.views.map((v) => (
          <kbd
            key={v.key}
            className="px-1 py-0.5 bg-white border border-blueprint-200 rounded"
          >
            {Number(v.index)}
          </kbd>
        ))}
        <span className="hidden lg:inline">{c.ui.tabs.hint}</span>
      </div>
    </nav>
  );
}
