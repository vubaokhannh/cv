"use client";

import { useState, type ComponentType } from "react";
import { useLocale } from "@/components/shared/LocaleContext";
import type { ViewKey } from "@/lib/content/types";
import {
  Copy,
  FolderOpen,
  Briefcase,
  Terminal,
  EnvelopeSimple,
} from "@phosphor-icons/react";

export type PaletteAction = ViewKey | "copy-email";

const ICONS: Record<PaletteAction, ComponentType> = {
  experience: Briefcase,
  projects: FolderOpen,
  contact: EnvelopeSimple,
  "copy-email": Copy,
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onExecute: (action: PaletteAction) => void;
}

export default function CommandPalette({
  open,
  onClose,
  onExecute,
}: CommandPaletteProps) {
  // Mount only while open so the query resets and the input autofocuses each time.
  if (!open) return null;
  return <PaletteDialog onClose={onClose} onExecute={onExecute} />;
}

function PaletteDialog({
  onClose,
  onExecute,
}: Omit<CommandPaletteProps, "open">) {
  const [query, setQuery] = useState("");

  const { c } = useLocale();
  const { palette } = c.ui;

  const commands = [
    ...c.views.map((v) => ({
      action: v.key as PaletteAction,
      label: palette.switchTo.replace("{view}", v.paletteName),
      hint: palette.viewHint.replace("{n}", v.index),
    })),
    {
      action: "copy-email" as PaletteAction,
      label: palette.copyEmail,
      hint: palette.clipboard,
    },
  ];

  const q = query.trim().toLowerCase();
  const results = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(q) ||
      cmd.action.includes(q) ||
      cmd.hint.toLowerCase().includes(q),
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-start justify-center pt-12 sm:pt-20 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={palette.placeholder}
        className="bg-white border border-blueprint-200 rounded-lg shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-blueprint-100 flex items-center gap-2">
          <Terminal className="text-lg text-blueprint-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) onExecute(results[0].action);
            }}
            placeholder={palette.placeholder}
            className="w-full text-xs font-mono text-blueprint-950 focus:outline-none placeholder-blueprint-400 bg-transparent"
          />
          <button
            onClick={onClose}
            className="text-blueprint-400 hover:text-blueprint-600 text-xs font-mono px-1.5 py-0.5 rounded border border-blueprint-200"
          >
            {palette.esc}
          </button>
        </div>

        <div className="p-2 space-y-1 max-h-72 overflow-y-auto text-xs font-mono">
          {results.map(({ action, label, hint }) => {
            const Icon = ICONS[action];
            return (
              <button
                type="button"
                key={action}
                onClick={() => onExecute(action)}
                className="w-full text-left p-2 hover:bg-blueprint-50 focus-visible:bg-blueprint-50 outline-none rounded cursor-pointer flex items-center justify-between text-blueprint-800"
              >
                <span className="flex items-center gap-2">
                  <Icon /> {label}
                </span>
                <span className="text-[10px] text-blueprint-400">{hint}</span>
              </button>
            );
          })}
        </div>

        <div className="p-2 bg-blueprint-50 border-t border-blueprint-100 flex justify-between items-center text-[10px] font-mono text-blueprint-400">
          <span>{palette.footerLeft}</span>
          <span>{palette.footerRight}</span>
        </div>
      </div>
    </div>
  );
}
