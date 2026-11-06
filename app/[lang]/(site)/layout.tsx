import { notFound } from "next/navigation";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import { getContent } from "@/lib/content";
import { hasLocale } from "@/lib/i18n";

export default async function SiteLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  // Only this language's content is passed down to the client bundle.
  return (
    <WorkspaceShell lang={lang} content={getContent(lang)}>
      {children}
    </WorkspaceShell>
  );
}
