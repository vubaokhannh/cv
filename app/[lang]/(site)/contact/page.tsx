import type { Metadata } from "next";
import ContactView from "@/components/views/ContactView";
import { hasLocale } from "@/lib/i18n";
import { viewMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? viewMetadata(lang, "contact") : {};
}

export default function ContactPage() {
  return <ContactView />;
}
