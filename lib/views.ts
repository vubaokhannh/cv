import type { Locale, ViewKey } from "@/lib/content/types";

/** Each workspace view is its own URL so search engines can index it. */
export const VIEW_PATH: Record<ViewKey, string> = {
  experience: "",
  projects: "/projects",
  contact: "/contact",
};

export const viewHref = (lang: Locale, key: ViewKey) =>
  `/${lang}${VIEW_PATH[key]}`;

/** Path without the locale prefix, e.g. "/vi/projects" -> "/projects". */
export const stripLocale = (pathname: string) =>
  pathname.replace(/^\/(vi|en)(?=\/|$)/, "") || "";

export function viewFromPathname(pathname: string): ViewKey | null {
  const rest = stripLocale(pathname).replace(/\/$/, "");
  const entry = (Object.entries(VIEW_PATH) as [ViewKey, string][]).find(
    ([, path]) => path === rest,
  );
  return entry ? entry[0] : null;
}
