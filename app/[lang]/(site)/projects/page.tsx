import type { Metadata } from "next";
import ProjectsView from "@/components/views/ProjectsView";
import { hasLocale } from "@/lib/i18n";
import { viewMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/projects">): Promise<Metadata> {
  const { lang } = await params;
  return hasLocale(lang) ? viewMetadata(lang, "projects") : {};
}

export default function ProjectsPage() {
  return <ProjectsView />;
}
