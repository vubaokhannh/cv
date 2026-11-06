import type { ReactNode } from "react";

interface SectionHeaderProps {
  kicker: string;
  title: string;
  aside: ReactNode;
}

export default function SectionHeader({
  kicker,
  title,
  aside,
}: SectionHeaderProps) {
  return (
    <div className="border-b border-blueprint-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div>
        <div className="text-xs font-mono text-blueprint-500 uppercase tracking-widest">
          {kicker}
        </div>
        <h2 className="text-lg font-bold text-blueprint-950">{title}</h2>
      </div>
      {typeof aside === "string" ? (
        <span className="text-xs font-mono text-blueprint-500">{aside}</span>
      ) : (
        aside
      )}
    </div>
  );
}
