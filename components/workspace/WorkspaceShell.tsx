"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { EMAIL } from "@/lib/constants";
import type { Content, Locale } from "@/lib/content/types";
import { viewHref } from "@/lib/views";
import { LocaleProvider, useLocale } from "@/components/shared/LocaleContext";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import CommandPalette, { type PaletteAction } from "./CommandPalette";
import Toast from "./Toast";
import ViewTabs from "./ViewTabs";
import SkillsPanel from "./SkillsPanel";
import { WorkspaceContext } from "./WorkspaceContext";

/** Persistent chrome around the server-rendered view pages. */
export default function WorkspaceShell({
  lang,
  content,
  children,
}: {
  lang: Locale;
  content: Content;
  children: ReactNode;
}) {
  return (
    <LocaleProvider lang={lang} content={content}>
      <ShellInner>{children}</ShellInner>
    </LocaleProvider>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const { c, lang } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState({ message: "", visible: false });
  const sectionRef = useRef<HTMLElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const firstRender = useRef(true);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      2500,
    );
  }, []);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      showToast(c.ui.toast.copied.replace("{email}", EMAIL));
    } catch {
      showToast(c.ui.toast.copyFailed.replace("{email}", EMAIL));
    }
  }, [showToast, c]);

  const actions = useMemo(
    () => ({ showToast, copyEmail }),
    [showToast, copyEmail],
  );

  // New page: reset the panel's own scroll (desktop) or bring it into view (mobile).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    sectionRef.current?.scrollTo({ top: 0 });
    if (window.matchMedia("(max-width: 767px)").matches) {
      sectionRef.current?.scrollIntoView({ block: "start" });
    }
  }, [pathname]);

  const executeCommand = useCallback(
    (action: PaletteAction) => {
      setPaletteOpen(false);
      if (action === "copy-email") copyEmail();
      else router.push(viewHref(lang, action));
    },
    [copyEmail, router, lang],
  );

  // Keyboard shortcuts: Cmd/Ctrl+K toggles palette, Esc closes, 1–N opens a view
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
        return;
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        return;
      }
      const target = e.target as HTMLElement | null;
      const typing =
        target?.closest("input, textarea, select, [contenteditable]") !== null;
      if (paletteOpen || typing || e.metaKey || e.ctrlKey || e.altKey) return;
      const next = c.views[Number(e.key) - 1];
      if (next) router.push(viewHref(lang, next.key));
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paletteOpen, c.views, router, lang]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  return (
    <WorkspaceContext.Provider value={actions}>
      <TopBar onOpenPalette={() => setPaletteOpen(true)} />

      <main className="flex-1 flex flex-col md:flex-row md:overflow-hidden relative">
        <Sidebar />

        <div className="flex-1 flex flex-col md:min-h-0 md:overflow-hidden">
          <ViewTabs />

          <section
            ref={sectionRef}
            className="flex-1 md:overflow-y-auto bg-dot-grid relative flex flex-col scroll-mt-[6.5rem] md:scroll-mt-0"
          >
            {children}
          </section>
        </div>

        <SkillsPanel className="flex md:hidden border-t border-blueprint-200 bg-white" />
      </main>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onExecute={executeCommand}
      />
      <Toast message={toast.message} visible={toast.visible} />
    </WorkspaceContext.Provider>
  );
}
