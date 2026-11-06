"use client";

import type { Release } from "@/lib/content/types";
import { useLocale } from "@/components/shared/LocaleContext";
import SectionHeader from "@/components/shared/SectionHeader";

const dotClass: Record<Release["tone"], string> = {
  current: "bg-blueprint-950 border-2 border-white ring-4 ring-blueprint-100",
  mid: "bg-blueprint-400 border-2 border-white",
};

const badgeClass: Record<Release["tone"], string> = {
  current: "bg-blueprint-900 text-white",
  mid: "bg-blueprint-200 text-blueprint-800",
};

export default function ExperienceView() {
  const { c } = useLocale();
  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      <SectionHeader
        kicker={c.ui.experience.kicker}
        title={c.ui.experience.title}
        aside={c.ui.experience.aside}
      />

      <h3 className="text-xs font-mono uppercase tracking-wider text-blueprint-500">
        {c.ui.experience.work}
      </h3>

      <div className="space-y-6 relative border-l-2 border-blueprint-200 ml-2 sm:ml-3 pl-5 sm:pl-6">
        {c.releases.map((r) => (
          <div key={r.version} className="relative">
            <span
              className={`absolute -left-[27px] sm:-left-[31px] top-1.5 w-3 h-3 rounded-full ${dotClass[r.tone]}`}
            />

            <div className="flex flex-wrap items-baseline gap-2 mb-1">
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${badgeClass[r.tone]}`}
              >
                {r.version}
              </span>
              <span className="text-sm font-bold text-blueprint-950">
                {r.role}
              </span>
              <span className="text-xs font-mono text-blueprint-500">
                {r.company}
              </span>
            </div>

            {r.bullets && (
              <ul className="mt-2.5 space-y-1.5 text-xs text-blueprint-700 font-mono text-justify hyphens-auto">
                {r.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="text-blueprint-400">›</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <h3 className="text-xs font-mono uppercase tracking-wider text-blueprint-500 pt-2">
        {c.ui.experience.education}
      </h3>

      <div className="space-y-3">
        {c.education.map((e) => (
          <div
            key={e.school + e.period}
            className="bg-white border border-blueprint-200 rounded-lg p-4 sm:p-5 shadow-2xs"
          >
            <div className="text-[10px] font-mono text-blueprint-400 uppercase">
              {e.period}
            </div>
            <div className="text-sm font-bold text-blueprint-950 mt-1">
              {e.school}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs font-mono text-blueprint-600">
              <span>{e.program}</span>
              <span className="px-2 py-0.5 bg-blueprint-100 text-blueprint-800 rounded">
                {e.gpa}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
