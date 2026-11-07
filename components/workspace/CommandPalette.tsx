"use client";

import { useRef, useState, type ComponentType } from "react";
import { useLocale } from "@/components/shared/LocaleContext";
import { useFocusTrap } from "@/components/shared/useFocusTrap";
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
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

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

  const activeIndex = Math.min(active, Math.max(results.length - 1, 0));

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((activeIndex + step + results.length) % results.length);
    } else if (e.key === "Enter" && results[activeIndex]) {
      onExecute(results[activeIndex].action);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-start justify-center pt-12 sm:pt-20 px-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
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
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={
              results[activeIndex] ? `palette-${results[activeIndex].action}` : undefined
            }
            aria-label={palette.placeholder}
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

        <div
          id="palette-list"
          role="listbox"
          className="p-2 space-y-1 max-h-72 overflow-y-auto text-xs font-mono"
        >
          {results.map(({ action, label, hint }, i) => {
            const Icon = ICONS[action];
            return (
              <button
                type="button"
                key={action}
                id={`palette-${action}`}
                role="option"
                aria-selected={i === activeIndex}
                tabIndex={-1}
                onMouseMove={() => setActive(i)}
                onClick={() => onExecute(action)}
                className={`w-full text-left p-2 outline-none rounded ${i === activeIndex ? "bg-blueprint-100" : ""} cursor-pointer flex items-center justify-between text-blueprint-800`}
              >
                <span className="flex items-center gap-2">
                  <Icon /> {label}
                </span>
                <span className="text-xs text-blueprint-400">{hint}</span>
              </button>
            );
          })}
        </div>

        <div className="p-2 bg-blueprint-50 border-t border-blueprint-100 flex justify-between items-center text-xs font-mono text-blueprint-400">
          <span>{palette.footerLeft}</span>
          <span>{palette.footerRight}</span>
        </div>
      </div>
    </div>
  );
}
