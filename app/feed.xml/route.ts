import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/constants";
import { defaultLocale } from "@/lib/i18n";

/** Legacy URL: feeds are per language now (/vi/feed.xml, /en/feed.xml). */
export function GET() {
  return NextResponse.redirect(`${SITE_URL}/${defaultLocale}/feed.xml`, 308);
}
