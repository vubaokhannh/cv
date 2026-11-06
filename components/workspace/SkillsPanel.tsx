"use client";

import { useLocale } from "@/components/shared/LocaleContext";

export default function SkillsPanel({
  className = "",
}: {
  className?: string;
}) {
  const { c } = useLocale();
  return (
    <div className={`p-5 space-y-3 flex-col text-xs font-mono ${className}`}>
      <div className="text-[10px] uppercase tracking-wider text-blueprint-400">
        {c.ui.sidebar.skills}
      </div>

      <div className="space-y-3">
        {c.skills.map((s) => (
          <div key={s.label}>
            <div className="text-[10px] uppercase text-blueprint-400 mb-1.5">
              {s.label}
            </div>
            <ul className="flex flex-wrap gap-1.5">
              {s.value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .map((tech) => (
                  <li
                    key={tech}
                    className="px-2 py-0.5 rounded border border-blueprint-200 bg-blueprint-50 text-blueprint-800 text-[11px]"
                  >
                    {tech}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
