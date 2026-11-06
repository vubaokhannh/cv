import "server-only";
import { en } from "./en";
import { vi } from "./vi";
import type { Content, Locale } from "./types";

export type {
  Content,
  Locale,
  ViewKey,
  NodeKey,
  Release,
  Education,
  Project,
} from "./types";

const contents: Record<Locale, Content> = { en, vi };

/** Server-only: only the requested language is ever sent to the client. */
export const getContent = (lang: Locale): Content => contents[lang];
