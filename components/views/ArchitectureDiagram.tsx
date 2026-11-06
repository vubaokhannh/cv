"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowDown } from "@phosphor-icons/react";
import type { NodeKey, ProjectArchData } from "@/lib/content/types";
import { useLocale } from "@/components/shared/LocaleContext";

export default function ArchitectureDiagram({
  archData,
  onToast,
}: {
  archData: ProjectArchData;
  onToast: (message: string) => void;
}) {
  const { c } = useLocale();
  const defaultKey =
    archData.defaultNodeKey || Object.keys(archData.nodeDetails)[0] || "api";
  const [selectedKey, setSelectedKey] = useState<NodeKey | null>(null);

  const inspectedKey =
    selectedKey && archData.nodeDetails[selectedKey] ? selectedKey : defaultKey;

  const inspected =
    archData.nodeDetails[inspectedKey] ||
    Object.values(archData.nodeDetails)[0];
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const nodeProps = (key: NodeKey) => ({
    role: "button" as const,
    tabIndex: 0,
    "aria-pressed": inspectedKey === key,
    onClick: () => inspectNode(key),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        inspectNode(key);
      }
    },
  });

  function inspectNode(key: NodeKey) {
    const data = archData.nodeDetails[key];
    if (!data) return;
    setSelectedKey(key);
    setFlash(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(false), 250);
    onToast(c.ui.arch.inspecting.replace("{tag}", data.tag));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-mono text-blueprint-500">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
        <span>{archData.hint || c.ui.arch.hint}</span>
      </div>

      {/* Blueprint diagram */}
      <div className="bg-white border border-blueprint-200 rounded-lg p-4 sm:p-6 shadow-2xs relative bg-blueprint-grid">
        <div className="text-[10px] font-mono text-blueprint-400 uppercase tracking-wider mb-6 flex flex-wrap justify-between gap-x-4">
          <span>{archData.diagram}</span>
          <span>{archData.diagramRight}</span>
        </div>

        <div className="space-y-6 relative">
          {archData.tiers.map((tier, i) => (
            <Fragment key={tier.label}>
              {i > 0 && (
                <div className="flex justify-center my-1 text-blueprint-300">
                  <ArrowDown className="text-lg" />
                </div>
              )}
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <div className="w-full md:w-36 text-xs font-mono text-blueprint-500 shrink-0">
                  {tier.label}
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {tier.nodes.map((node) =>
                    node.primary ? (
                      <div
                        key={node.key}
                        {...nodeProps(node.key)}
                        className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint-900 p-3.5 bg-white border-2 border-blueprint-900 rounded shadow-xs relative"
                      >
                        <span className="absolute -top-2 right-2 text-[9px] font-mono bg-blueprint-900 text-white px-1.5 rounded">
                          {c.ui.arch.core}
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-blueprint-950">
                            {node.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blueprint-100 rounded text-blueprint-700">
                            {node.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-blueprint-600 mt-1">
                          {node.desc}
                        </p>
                      </div>
                    ) : (
                      <div
                        key={node.key}
                        {...nodeProps(node.key)}
                        className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint-900 p-3.5 bg-white border border-blueprint-200 rounded hover:border-blueprint-900 transition-all hover:shadow-xs group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold text-blueprint-900 group-hover:text-blueprint-950">
                            {node.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blueprint-100 rounded text-blueprint-600">
                            {node.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-blueprint-500 mt-1">
                          {node.desc}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Inspector card */}
      {inspected && (
        <div
          className={`bg-white border border-blueprint-200 rounded-lg p-5 ${
            flash ? "ring-2 ring-blueprint-900" : ""
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-blueprint-100">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blueprint-900" />
              <span className="text-sm font-bold font-mono text-blueprint-950">
                {inspected.title}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-blueprint-100 px-2 py-0.5 rounded text-blueprint-700">
              {inspected.tag}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-xs font-mono">
            <div>
              <span className="text-blueprint-400 block text-[10px]">
                {c.ui.arch.responsibility}
              </span>
              <p className="text-blueprint-800 mt-1 text-justify hyphens-auto">
                {inspected.resp}
              </p>
            </div>
            <div>
              <span className="text-blueprint-400 block text-[10px]">
                {c.ui.arch.decision}
              </span>
              <p className="text-blueprint-800 mt-1 text-justify hyphens-auto">
                {inspected.decision}
              </p>
            </div>
            <div>
              <span className="text-blueprint-400 block text-[10px]">
                {c.ui.arch.stack}
              </span>
              <p className="text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                {inspected.stack}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
