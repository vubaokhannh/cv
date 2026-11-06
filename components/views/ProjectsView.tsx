"use client";

import { useState } from "react";
import { TreeStructure } from "@phosphor-icons/react";
import type { Project } from "@/lib/content/types";
import dynamic from "next/dynamic";

import { useLocale } from "@/components/shared/LocaleContext";
import { useWorkspace } from "@/components/workspace/WorkspaceContext";
import SectionHeader from "@/components/shared/SectionHeader";

// Loaded on demand: the diagram is only needed when the user opens it.
const ArchitectureModal = dynamic(() => import("./ArchitectureModal"));

const outlineBtn =
  "px-2.5 py-1 text-xs font-mono border border-blueprint-200 rounded hover:bg-blueprint-50 transition-colors flex items-center gap-1";
const solidBtn =
  "px-2.5 py-1 text-xs font-mono bg-blueprint-900 text-white rounded hover:bg-blueprint-950 transition-colors flex items-center gap-1";

export default function ProjectsView() {
  const { showToast: onToast } = useWorkspace();
  const { c } = useLocale();
  const [archModalProject, setArchModalProject] = useState<Project | null>(
    null,
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      <SectionHeader
        kicker={c.ui.projects.kicker}
        title={c.ui.projects.title}
        aside={c.ui.projects.aside}
      />

      <div className="grid grid-cols-1 gap-6">
        {c.projects.map((p) => (
          <ProjectCard
            key={p.spec}
            project={p}
            onOpenArch={
              p.architecture ? () => setArchModalProject(p) : undefined
            }
          />
        ))}
      </div>

      {archModalProject && (
        <ArchitectureModal
          isOpen={true}
          project={archModalProject}
          onClose={() => setArchModalProject(null)}
          onToast={onToast}
        />
      )}
    </div>
  );
}

function ProjectCard({
  project: p,
  onOpenArch,
}: {
  project: Project;
  onOpenArch?: () => void;
}) {
  const { c } = useLocale();

  return (
    <article className="bg-white border border-blueprint-200 rounded-lg p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-blueprint-100 pb-3 gap-2">
        <div>
          <span className="text-[10px] font-mono text-blueprint-400 uppercase">
            {p.spec} · {p.period}
          </span>
          <h3 className="text-base font-bold text-blueprint-950">{p.title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {p.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className={l.primary ? solidBtn : outlineBtn}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-center">
        {p.facts.map((f) => (
          <div
            key={f.label}
            className="border border-blueprint-200 p-2 rounded"
          >
            <div className="text-xs text-blueprint-500">{f.label}</div>
            <div className="text-sm font-bold text-blueprint-950">
              {f.value}
            </div>
          </div>
        ))}
      </div>

      <ul className="space-y-1.5 text-xs text-blueprint-700 leading-relaxed text-justify hyphens-auto">
        {p.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2">
            <span className="text-blueprint-400 font-mono">›</span>
            <span>{h}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-mono">
        {p.tech.map((t) => (
          <span
            key={t}
            className="px-2 py-0.5 bg-blueprint-100 text-blueprint-800 rounded"
          >
            {t}
          </span>
        ))}
      </div>

      {p.architecture && onOpenArch && (
        <div className="pt-2 border-t border-blueprint-100 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onOpenArch}
            className="px-3 py-1.5 text-xs font-mono border border-blueprint-200 rounded hover:bg-blueprint-50 hover:border-blueprint-900 transition-colors flex items-center gap-2 text-blueprint-800 hover:text-blueprint-950 cursor-pointer shadow-2xs group"
          >
            <TreeStructure className="text-sm text-blueprint-500 group-hover:text-blueprint-900 transition-colors" />
            <span className="font-semibold">{c.ui.arch.show}</span>
            <span className="text-[10px] text-blueprint-400 font-mono px-1 py-0.5 bg-blueprint-100 rounded ml-1">
              MODAL
            </span>
          </button>
          <span className="text-[10px] font-mono text-blueprint-400 hidden sm:inline">
            {p.archData?.diagramRight ?? c.ui.arch.diagramRight}
          </span>
        </div>
      )}
    </article>
  );
}
