"use client";

import { useEffect, useRef } from "react";
import { TreeStructure, X } from "@phosphor-icons/react";
import type { Project, ProjectArchData } from "@/lib/content/types";
import { useLocale } from "@/components/shared/LocaleContext";
import ArchitectureDiagram from "./ArchitectureDiagram";

interface ArchitectureModalProps {
  isOpen: boolean;
  project: Project;
  onClose: () => void;
  onToast: (message: string) => void;
}

export default function ArchitectureModal({
  isOpen,
  project,
  onClose,
  onToast,
}: ArchitectureModalProps) {
  const { c, lang } = useLocale();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus modal container on mount
    modalRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const archData: ProjectArchData = project.archData || {
    kicker: c.ui.arch.kicker,
    title: c.ui.arch.title,
    hint: c.ui.arch.hint,
    diagram: c.ui.arch.diagram,
    diagramRight: c.ui.arch.diagramRight,
    tiers: c.archTiers,
    nodeDetails: c.nodeDetails,
    defaultNodeKey: "api",
  };

  const closeLabel = lang === "vi" ? "Đóng" : "Close";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="arch-modal-title"
        className="bg-white border border-blueprint-200 rounded-xl shadow-2xl w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden my-auto focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-blueprint-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded bg-blueprint-100 text-blueprint-900 shrink-0">
              <TreeStructure className="text-base" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-blueprint-500 uppercase tracking-wider flex items-center gap-2 truncate">
                <span>{project.spec}</span>
                <span>·</span>
                <span>{archData.kicker.replace("// ", "")}</span>
              </div>
              <h2
                id="arch-modal-title"
                className="text-sm sm:text-base font-bold text-blueprint-950 truncate"
              >
                {project.title} — {archData.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-mono border border-blueprint-200 rounded hover:bg-blueprint-50 text-blueprint-600 hover:text-blueprint-950 transition-colors flex items-center gap-1.5 cursor-pointer"
              aria-label={closeLabel}
            >
              <span className="hidden sm:inline text-[10px] text-blueprint-400 bg-blueprint-100 px-1 py-0.5 rounded font-mono">
                {c.ui.palette.esc}
              </span>
              <X className="text-sm" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
          <ArchitectureDiagram
            key={project.id || archData.diagram}
            archData={archData}
            onToast={onToast}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-blueprint-100 bg-blueprint-50/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-blueprint-500 shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{archData.diagramRight}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-mono bg-blueprint-900 text-white rounded hover:bg-blueprint-950 transition-colors cursor-pointer"
          >
            {closeLabel} ({c.ui.palette.esc})
          </button>
        </div>
      </div>
    </div>
  );
}
