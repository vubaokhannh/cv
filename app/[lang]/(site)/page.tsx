import { notFound } from "next/navigation";
import ExperienceView from "@/components/views/ExperienceView";
import { getContent } from "@/lib/content";
import { hasLocale } from "@/lib/i18n";

// Metadata (title, description, hreflang, OG) comes from the [lang] layout.
export default async function ExperiencePage({
  params,
}: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return <ExperienceView c={getContent(lang)} />;
}
