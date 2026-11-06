"use client";

import Link from "next/link";
import { Article, Copy, MagnifyingGlass, MapPin } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { EMAIL } from "@/lib/constants";
import { stripLocale } from "@/lib/views";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { useLocale } from "@/components/shared/LocaleContext";
import { useWorkspace } from "./WorkspaceContext";

interface TopBarProps {
  onOpenPalette: () => void;
}

export default function TopBar({ onOpenPalette }: TopBarProps) {
  const { lang, c } = useLocale();
  const { copyEmail } = useWorkspace();
  const subPath = stripLocale(usePathname());
  return (
    <header className="h-12 border-b border-blueprint-200 bg-white/95 backdrop-blur px-3 sm:px-4 flex items-center justify-between text-xs font-mono select-none z-30 shrink-0 sticky top-0">
      <div className="flex items-center space-x-3 text-blueprint-600">
        <div className="flex items-center space-x-2 font-semibold text-blueprint-900">
          <span className="inline-block w-2.5 h-2.5 border border-blueprint-900 bg-blueprint-900 rounded-sm" />
          <span className="tracking-tight text-sm">VUBAOKHANH.TECH</span>
        </div>
        <span className="text-blueprint-300 hidden md:inline">|</span>
        <div className="hidden md:flex items-center gap-1.5 text-blueprint-500">
          <MapPin />
          <span>{c.profile.location}</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <LanguageSwitcher
          lang={lang}
          label={c.ui.topbar.switchLang}
          hrefFor={(l) => `/${l}${subPath}`}
          replace
        />

        <ThemeToggle
          lightLabel={c.ui.theme.light}
          darkLabel={c.ui.theme.dark}
        />

        <Link
          href={`/${lang}/blog`}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded border border-blueprint-200 bg-white hover:bg-blueprint-50 text-blueprint-800 transition-colors text-[11px]"
        >
          <Article />
          <span className="hidden sm:inline">{c.ui.topbar.blog}</span>
        </Link>

        <button
          onClick={onOpenPalette}
          className="flex items-center space-x-2 px-2.5 py-1 rounded border border-blueprint-200 bg-blueprint-50 hover:bg-blueprint-100 text-blueprint-600 transition-colors text-[11px]"
        >
          <MagnifyingGlass />
          <span className="hidden sm:inline">{c.ui.topbar.quickJump}</span>
          <kbd className="hidden sm:inline px-1 py-0.5 bg-white border border-blueprint-200 rounded text-[9px] font-mono text-blueprint-500 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={copyEmail}
          aria-label={EMAIL}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded border border-blueprint-200 bg-white hover:bg-blueprint-50 text-blueprint-800 transition-colors text-[11px] font-mono font-medium"
        >
          <Copy />
          <span className="hidden xl:inline">{EMAIL}</span>
        </button>
      </div>
    </header>
  );
}
