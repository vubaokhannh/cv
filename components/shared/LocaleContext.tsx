"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Content, Locale } from "@/lib/content/types";

interface LocaleValue {
  lang: Locale;
  c: Content;
}

const LocaleContext = createContext<LocaleValue | null>(null);

/** Receives the already-selected language's content from the server. */
export function LocaleProvider({
  lang,
  content,
  children,
}: {
  lang: Locale;
  content: Content;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ lang, c: content }), [lang, content]);
  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}
