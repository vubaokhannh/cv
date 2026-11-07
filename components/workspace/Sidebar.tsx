"use client";

import {
  Copy,
  EnvelopeSimple,
  FileText,
  GithubLogo,
  MapPin,
  Phone,
} from "@phosphor-icons/react";
import { CONTACT } from "@/lib/constants";
import Link from "next/link";
import { useLocale } from "@/components/shared/LocaleContext";
import { viewHref } from "@/lib/views";
import { useWorkspace } from "./WorkspaceContext";
import SkillsPanel from "./SkillsPanel";

const linkClass =
  "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded border border-blueprint-200 bg-white hover:bg-blueprint-50 text-blueprint-700 hover:text-blueprint-950 transition-colors";

export default function Sidebar() {
  const { copyEmail: onCopyEmail } = useWorkspace();
  const { c, lang } = useLocale();
  return (
    <aside className="w-full md:w-[380px] lg:w-[420px] shrink-0 border-b md:border-b-0 md:border-r border-blueprint-200 bg-white flex flex-col md:h-full md:overflow-y-auto">
      {/* Identity block */}
      <div className="p-5 border-b border-blueprint-200 bg-gradient-to-b from-white to-blueprint-50/50">
        <div className="flex justify-between items-start mb-3">
          <span className="px-2 py-0.5 text-xs font-mono uppercase tracking-wider bg-blueprint-100 text-blueprint-700 rounded border border-blueprint-200">
            {c.profile.role}
          </span>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-blueprint-950">
          {CONTACT.name}
          <span className="sr-only"> — {c.profile.role}</span>
        </h1>
        <p className="text-xs text-blueprint-500 font-mono mt-0.5">
          {c.profile.tagline}
        </p>

        <p className="text-xs text-blueprint-600 mt-3 leading-relaxed text-justify hyphens-auto">
          {c.profile.summary}
        </p>

        <div className="mt-3 space-y-1 text-xs font-mono text-blueprint-500">
          <div className="flex items-center gap-1.5">
            <MapPin /> {c.profile.location}
          </div>
          {CONTACT.phone ? (
            <a
              href={`tel:${CONTACT.phone}`}
              className="flex items-center gap-1.5 hover:text-blueprint-900"
            >
              <Phone /> {CONTACT.phone}
            </a>
          ) : null}
        </div>

        <Link
          href={viewHref(lang, "contact")}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded bg-blueprint-900 text-white text-xs font-mono font-semibold hover:bg-blueprint-950 transition-colors"
        >
          <EnvelopeSimple className="text-sm" /> {c.ui.sidebar.contact}
        </Link>

        <div className="grid grid-cols-3 gap-2 mt-2 text-xs font-mono">
          <a
            href={CONTACT.github}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            <GithubLogo className="text-sm" /> {c.ui.sidebar.github}
          </a>
          <button type="button" onClick={onCopyEmail} className={linkClass}>
            <Copy className="text-sm" /> {c.ui.sidebar.email}
          </button>
          <a href={CONTACT.cvHref} download className={linkClass}>
            <FileText className="text-sm" /> {c.ui.sidebar.cv}
          </a>
        </div>
      </div>

      <SkillsPanel className="hidden md:flex" />
    </aside>
  );
}
