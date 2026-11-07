"use client";

import { useEffect, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import type { TocItem } from "@/lib/blog";
import type { Locale } from "@/lib/content";

interface TableOfContentsProps {
  items: TocItem[];
  label: string;
  lang?: Locale;
  variant?: "inline" | "sidebar";
}

export default function TableOfContents({
  items,
  label,
  lang = "vi",
  variant = "inline",
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(true);
  const isEn = lang === "en";

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Highlight the currently intersecting heading
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0.1,
      },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  const minLevel =
    items.length > 0 ? Math.min(...items.map((i) => i.level)) : 2;

  // Sidebar variant (sticky alongside the article on desktop)
  if (variant === "sidebar") {
    return (
      <nav
        aria-label={label}
        className="bg-white border border-blueprint-200 rounded-lg p-4 sm:p-5 shadow-2xs"
      >
        <div className="flex items-center gap-2 border-b border-blueprint-100 pb-3 font-mono text-xs font-bold uppercase tracking-wider text-blueprint-900">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span>{label}</span>
        </div>

        <ul className="mt-3 space-y-1.5">
          {items.map((item) => {
            const isActive = activeId === item.id;
            const depth = Math.max(0, item.level - minLevel);

            return (
              <li
                key={item.id}
                className={
                  depth === 0
                    ? "pt-1 first:pt-0"
                    : depth === 1
                      ? "ml-3.5 pl-2.5 border-l-2 border-blueprint-200 dark:border-blueprint-800"
                      : "ml-7 pl-2.5 border-l-2 border-blueprint-200 dark:border-blueprint-800"
                }
              >
                <a
                  href={`#${item.id}`}
                  className={`group flex items-start gap-2 py-0.5 leading-snug transition-colors ${
                    depth === 0 ? "text-xs font-medium" : "text-[11.5px]"
                  } ${
                    isActive
                      ? "font-semibold text-blue-600 dark:text-blue-400"
                      : "text-blueprint-700 hover:text-blueprint-950"
                  }`}
                >
                  <span
                    className={`mt-1.5 shrink-0 rounded-full transition-all ${
                      depth === 0 ? "w-1.5 h-1.5" : "w-1 h-1"
                    } ${
                      isActive
                        ? "bg-blue-600 dark:bg-blue-400 ring-2 ring-blue-500/30"
                        : "bg-blueprint-400 group-hover:bg-blueprint-700"
                    }`}
                  />
                  <span className="line-clamp-2">{item.text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  // Inline variant (clean card on mobile/tablets)
  return (
    <nav
      aria-label={label}
      className="my-6 bg-white border border-blueprint-200 rounded-lg p-4 shadow-2xs"
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left font-mono text-xs font-bold uppercase tracking-wider text-blueprint-900"
      >
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
          <span>{label}</span>
          <span className="text-xs font-normal text-blueprint-500">
            ({items.length})
          </span>
        </span>
        <span className="flex items-center gap-1 text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline">
          <span>
            {isOpen
              ? isEn
                ? "Collapse"
                : "Thu gọn"
              : isEn
                ? "Expand"
                : "Mở rộng"}
          </span>
          <CaretDown
            className={`text-xs transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {isOpen && (
        <ul className="mt-3.5 space-y-1.5 pt-1">
          {items.map((item) => {
            const isActive = activeId === item.id;
            const depth = Math.max(0, item.level - minLevel);

            return (
              <li
                key={item.id}
                className={
                  depth === 0
                    ? "pt-1 first:pt-0"
                    : depth === 1
                      ? "ml-3.5 pl-2.5 border-l-2 border-blueprint-200 dark:border-blueprint-800"
                      : "ml-7 pl-2.5 border-l-2 border-blueprint-200 dark:border-blueprint-800"
                }
              >
                <a
                  href={`#${item.id}`}
                  className={`group flex items-start gap-2 py-0.5 leading-snug transition-colors ${
                    depth === 0 ? "text-xs font-medium" : "text-[11.5px]"
                  } ${
                    isActive
                      ? "font-semibold text-blue-600 dark:text-blue-400"
                      : "text-blueprint-700 hover:text-blueprint-950"
                  }`}
                >
                  <span
                    className={`mt-1.5 shrink-0 rounded-full transition-all ${
                      depth === 0 ? "w-1.5 h-1.5" : "w-1 h-1"
                    } ${
                      isActive
                        ? "bg-blue-600 dark:bg-blue-400 ring-2 ring-blue-500/30"
                        : "bg-blueprint-400 group-hover:bg-blueprint-700"
                    }`}
                  />
                  <span className="truncate">{item.text}</span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </nav>
  );
}
