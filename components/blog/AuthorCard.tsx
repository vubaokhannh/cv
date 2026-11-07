import Link from "next/link";
import {
  EnvelopeSimple,
  FileText,
  GithubLogo,
  MapPin,
} from "@phosphor-icons/react/dist/ssr";
import { CONTACT } from "@/lib/constants";
import { getContent } from "@/lib/content";
import type { Locale } from "@/lib/i18n";

const linkClass =
  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-blueprint-200 bg-white hover:bg-blueprint-50 text-blueprint-800 transition-colors";

/** Author box shown at the bottom of every blog post (server component). */
export default function AuthorCard({ lang }: { lang: Locale }) {
  const { ui, profile } = getContent(lang);
  const t = ui.blog.author;

  return (
    <footer
      aria-label={t.heading}
      className="mt-10 pt-6 border-t border-blueprint-200"
    >
      <div className="text-xs font-mono uppercase tracking-widest text-blueprint-400 mb-3">
        {t.heading}
      </div>

      <div className="rounded-lg border border-blueprint-200 bg-blueprint-50/60 p-4 sm:p-5">
        <div className="min-w-0">
          <Link
            href={`/${lang}`}
            rel="author"
            className="text-base font-bold text-blueprint-950 hover:underline"
          >
            {CONTACT.name}
          </Link>
          <div className="text-xs font-mono text-blueprint-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <span>{profile.role}</span>
            <span className="inline-flex items-center gap-1">
              <MapPin /> {profile.location}
            </span>
          </div>

          <p className="text-xs text-blueprint-700 leading-relaxed mt-3">
            {t.bio}
          </p>

          <div className="flex flex-wrap gap-2 mt-4 text-xs font-mono">
            <a
              href={CONTACT.github}
              target="_blank"
              rel="noopener noreferrer me"
              className={linkClass}
            >
              <GithubLogo /> {ui.sidebar.github}
            </a>
            <a href={`mailto:${CONTACT.email}`} className={linkClass}>
              <EnvelopeSimple /> {CONTACT.email}
            </a>
            <a href={CONTACT.cvHref} download className={linkClass}>
              <FileText /> {ui.sidebar.cv}
            </a>
            <Link href={`/${lang}/contact`} className={linkClass}>
              {t.contact}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
