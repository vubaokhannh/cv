"use client";

import type { ComponentType } from "react";
import {
  Copy,
  EnvelopeSimple,
  FileText,
  GithubLogo,
  MapPin,
  Phone,
} from "@phosphor-icons/react";
import { CONTACT } from "@/lib/constants";
import { useLocale } from "@/components/shared/LocaleContext";
import { useWorkspace } from "@/components/workspace/WorkspaceContext";
import SectionHeader from "@/components/shared/SectionHeader";

const outlineBtn =
  "px-2.5 py-1 text-xs font-mono border border-blueprint-200 rounded hover:bg-blueprint-50 transition-colors flex items-center gap-1";

export default function ContactView() {
  const { copyEmail: onCopyEmail } = useWorkspace();
  const { c } = useLocale();
  const t = c.ui.contact;

  const rows: {
    key: string;
    Icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
    action: React.ReactNode;
  }[] = [
    {
      key: "email",
      Icon: EnvelopeSimple,
      label: t.email,
      value: CONTACT.email,
      action: (
        <div className="flex gap-2">
          <button type="button" onClick={onCopyEmail} className={outlineBtn}>
            <Copy /> {t.copy}
          </button>
          <a href={`mailto:${CONTACT.email}`} className={outlineBtn}>
            {t.open}
          </a>
        </div>
      ),
    },
    ...(CONTACT.phone
      ? [
          {
            key: "phone",
            Icon: Phone,
            label: t.phone,
            value: CONTACT.phone,
            action: (
              <a href={`tel:${CONTACT.phone}`} className={outlineBtn}>
                {t.call}
              </a>
            ),
          },
        ]
      : []),
    {
      key: "github",
      Icon: GithubLogo,
      label: t.github,
      value: CONTACT.github.replace("https://", ""),
      action: (
        <a
          href={CONTACT.github}
          target="_blank"
          rel="noopener noreferrer"
          className={outlineBtn}
        >
          {t.open}
        </a>
      ),
    },
    {
      key: "location",
      Icon: MapPin,
      label: t.location,
      value: c.profile.location,
      action: null,
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      <SectionHeader kicker={t.kicker} title={t.title} aside={t.aside} />

      <p className="text-xs font-mono text-blueprint-600 leading-relaxed max-w-2xl">
        {t.intro}
      </p>

      <ul className="bg-white border border-blueprint-200 rounded-lg shadow-2xs divide-y divide-blueprint-100">
        {rows.map(({ key, Icon, label, value, action }) => (
          <li
            key={key}
            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-8 h-8 shrink-0 rounded border border-blueprint-200 bg-blueprint-50 flex items-center justify-center text-blueprint-700">
                <Icon />
              </span>
              <div className="min-w-0">
                <div className="text-[10px] font-mono uppercase text-blueprint-400">
                  {label}
                </div>
                <div className="text-sm font-mono text-blueprint-900 truncate">
                  {value}
                </div>
              </div>
            </div>
            {action}
          </li>
        ))}
      </ul>

      <a
        href={CONTACT.cvHref}
        download
        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono bg-blueprint-900 text-white rounded hover:bg-blueprint-950 transition-colors"
      >
        <FileText className="text-sm" /> {t.downloadCv}
      </a>
    </div>
  );
}
