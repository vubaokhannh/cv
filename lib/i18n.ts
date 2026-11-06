import type { Locale } from "./content/types";

export type { Locale };

/** Lightweight locale helpers — safe to import from client code and proxy. */
export const locales: Locale[] = ["vi", "en"];
export const defaultLocale: Locale = "vi";

export const hasLocale = (value: string): value is Locale =>
  (locales as string[]).includes(value);
