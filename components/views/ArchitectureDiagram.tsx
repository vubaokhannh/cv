"use client";

import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { ArrowDown } from "@phosphor-icons/react";
import type { ArchEdge, NodeKey, ProjectArchData } from "@/lib/content/types";
import { useLocale } from "@/components/shared/LocaleContext";

// ───────────────────────── geometry ─────────────────────────

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Route {
  id: string;
  edge: ArchEdge;
  d: string;
  lx: number;
  ly: number;
}

const LANE_GAP = 9;
const LANE_INSET = 12;
const TRACK_GAP = 6;

type Pt = [number, number];

/** Polyline with rounded corners (duplicate points are dropped first). */
function rounded(points: Pt[], radius = 6): string {
  const pts = points.filter(
    (p, i) => i === 0 || p[0] !== points[i - 1][0] || p[1] !== points[i - 1][1],
  );
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1];
    const [x, y] = pts[i];
    const [nx, ny] = pts[i + 1];
    const l1 = Math.hypot(x - px, y - py);
    const l2 = Math.hypot(nx - x, ny - y);
    const r = Math.min(radius, l1 / 2, l2 / 2);
    d += ` L${x + ((px - x) / l1) * r} ${y + ((py - y) / l1) * r}`;
    d += ` Q${x} ${y} ${x + ((nx - x) / l2) * r} ${y + ((ny - y) / l2) * r}`;
  }
  const last = pts[pts.length - 1];
  return `${d} L${last[0]} ${last[1]}`;
}

/**
 * Routing rules, chosen so lines never run underneath unrelated nodes:
 * - same row: a straight line across the gap between the two nodes
 * - neighbouring tiers: an S-curve from bottom-centre to top-centre
 * - further apart: leave through the free space between tiers, travel down a
 *   "lane" in the right margin, and re-enter through the gap above the target
 */
function buildRoutes(
  edges: ArchEdge[],
  boxes: Record<string, Box>,
  tierOf: Record<string, number>,
  width: number,
): Route[] {
  // Vertical extent of every tier -> the free gap between tier t and t+1.
  const top: Record<number, number> = {};
  const bottom: Record<number, number> = {};
  for (const [key, b] of Object.entries(boxes)) {
    const t = tierOf[key];
    top[t] = Math.min(top[t] ?? Infinity, b.y);
    bottom[t] = Math.max(bottom[t] ?? -Infinity, b.y + b.h);
  }
  const gapY = (t: number) => (bottom[t] + top[t + 1]) / 2;

  let lane = 0;
  const routes: Route[] = [];

  for (const edge of edges) {
    const a = boxes[edge.from];
    const b = boxes[edge.to];
    if (!a || !b) continue;
    const ta = tierOf[edge.from];
    const tb = tierOf[edge.to];
    const span = Math.abs(tb - ta);
    const id = `${edge.from}->${edge.to}`;

    if (span === 0 && Math.abs(a.y - b.y) < 4) {
      const rightward = b.x > a.x;
      const sx = rightward ? a.x + a.w : a.x;
      const ex = rightward ? b.x : b.x + b.w;
      const y = a.y + a.h / 2;
      routes.push({
        id,
        edge,
        d: `M${sx} ${y} L${ex} ${y}`,
        lx: (sx + ex) / 2,
        ly: y,
      });
    } else if (span === 1) {
      const down = tb > ta;
      const sx = a.x + a.w / 2;
      const sy = down ? a.y + a.h : a.y;
      const ex = b.x + b.w / 2;
      const ey = down ? b.y : b.y + b.h;
      const my = (sy + ey) / 2;
      routes.push({
        id,
        edge,
        d: `M${sx} ${sy} C${sx} ${my} ${ex} ${my} ${ex} ${ey}`,
        lx: (sx + ex) / 2,
        ly: my,
      });
    } else {
      const k = lane++;
      const laneX = width - LANE_INSET - k * LANE_GAP;
      const down = tb > ta;
      const sx = a.x + a.w / 2;
      const ex = b.x + b.w / 2;
      const sy = down ? a.y + a.h : a.y;
      const ey = down ? b.y : b.y + b.h;
      // gap just after the source / just before the target (per direction)
      const y1 = (down ? gapY(ta) : gapY(ta - 1)) + k * TRACK_GAP;
      const y2 = (down ? gapY(tb - 1) : gapY(tb)) + k * TRACK_GAP;
      routes.push({
        id,
        edge,
        d: rounded([
          [sx, sy],
          [sx, y1],
          [laneX, y1],
          [laneX, y2],
          [ex, y2],
          [ex, ey],
        ]),
        // spread labels along the run so edges sharing a source don't overlap
        lx: sx + (laneX - sx) * (0.3 + 0.18 * (k % 4)),
        ly: y1,
      });
    }
  }
  return routes;
}

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ───────────────────────── component ─────────────────────────

export default function ArchitectureDiagram({
  archData,
  onToast,
}: {
  archData: ProjectArchData;
  onToast: (message: string) => void;
}) {
  const { c } = useLocale();
  const edges = useMemo(() => archData.edges ?? [], [archData.edges]);
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

  const reduceMotion = useSyncExternalStore(
    subscribeMotion,
    prefersReducedMotion,
    () => true,
  );

  // Lookups
  const { tierOf, nameOf } = useMemo(() => {
    const tierOf: Record<string, number> = {};
    const nameOf: Record<string, string> = {};
    archData.tiers.forEach((tier, i) =>
      tier.nodes.forEach((n) => {
        tierOf[n.key] = i;
        nameOf[n.key] = n.name;
      }),
    );
    return { tierOf, nameOf };
  }, [archData.tiers]);

  // Measure node boxes relative to the container, redo on any resize.
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeEls = useRef<Record<string, HTMLElement | null>>({});
  const [routes, setRoutes] = useState<Route[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const measure = useCallback(() => {
    const box = containerRef.current;
    if (!box || edges.length === 0) return;
    const origin = box.getBoundingClientRect();
    const boxes: Record<string, Box> = {};
    for (const [key, el] of Object.entries(nodeEls.current)) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      boxes[key] = {
        x: r.left - origin.left,
        y: r.top - origin.top,
        w: r.width,
        h: r.height,
      };
    }
    setSize({ w: origin.width, h: origin.height });
    setRoutes(buildRoutes(edges, boxes, tierOf, origin.width));
  }, [edges, tierOf]);

  useEffect(() => {
    const box = containerRef.current;
    if (!box || edges.length === 0) return;
    const ro = new ResizeObserver(measure); // also fires once on observe()
    ro.observe(box);
    return () => ro.disconnect();
  }, [measure, edges.length]);

  function inspectNode(key: NodeKey) {
    const data = archData.nodeDetails[key];
    if (!data) return;
    setSelectedKey(key);
    setFlash(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlash(false), 250);
    onToast(c.ui.arch.inspecting.replace("{tag}", data.tag));
  }

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

  // Which nodes/edges are related to the selected node.
  const related = useMemo(() => {
    const set = new Set<string>([inspectedKey]);
    for (const e of edges) {
      if (e.from === inspectedKey) set.add(e.to);
      if (e.to === inspectedKey) set.add(e.from);
    }
    return set;
  }, [edges, inspectedKey]);
  const hasEdges = edges.length > 0;

  const connections = edges.filter(
    (e) => e.from === inspectedKey || e.to === inspectedKey,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-mono text-blueprint-500">
        <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
        <span>{archData.hint || c.ui.arch.hint}</span>
      </div>

      {/* Diagram + inspector: side by side on wide screens, sticky sheet below otherwise */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        {/* Blueprint diagram */}
        <div className="bg-white border border-blueprint-200 rounded-lg p-4 sm:p-6 shadow-2xs relative bg-blueprint-grid">
          <div className="text-[10px] font-mono text-blueprint-400 uppercase tracking-wider mb-6 flex flex-wrap justify-between gap-x-4">
            <span>{archData.diagram}</span>
            <span>{archData.diagramRight}</span>
          </div>

          <div
            ref={containerRef}
            className={`relative ${hasEdges ? "sm:pr-16" : ""}`}
          >
            {/* Connector layer (hidden on phones: the list below covers them) */}
            {hasEdges && (
              <svg
                aria-hidden="true"
                width={size.w}
                height={size.h}
                viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}
                className="hidden sm:block absolute inset-0 pointer-events-none overflow-visible"
              >
                <defs>
                  <marker
                    id="arrow-dim"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                  >
                    <path
                      d="M0 0 L10 5 L0 10 z"
                      className="fill-blueprint-300"
                    />
                  </marker>
                  <marker
                    id="arrow-hot"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto"
                  >
                    <path
                      d="M0 0 L10 5 L0 10 z"
                      className="fill-blueprint-900"
                    />
                  </marker>
                </defs>

                {routes.map((r, i) => {
                  const hot =
                    r.edge.from === inspectedKey || r.edge.to === inspectedKey;
                  return (
                    <g key={r.id}>
                      <path
                        d={r.d}
                        fill="none"
                        strokeLinejoin="round"
                        markerEnd={`url(#${hot ? "arrow-hot" : "arrow-dim"})`}
                        className={`transition-all duration-200 ${
                          hot
                            ? "stroke-blueprint-900 stroke-[1.75]"
                            : "stroke-blueprint-300 stroke-1 [stroke-dasharray:4_4]"
                        }`}
                      />
                      {hot && !reduceMotion && (
                        <circle r="3" className="fill-sky-500">
                          <animateMotion
                            dur="2.2s"
                            begin={`${(i % 4) * 0.3}s`}
                            repeatCount="indefinite"
                            path={r.d}
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {routes.map((r) => {
                  const hot =
                    r.edge.from === inspectedKey || r.edge.to === inspectedKey;
                  const w = r.edge.label.length * 5.2 + 10;
                  return (
                    <g
                      key={`${r.id}-label`}
                      className={`transition-opacity duration-200 ${hot ? "opacity-100" : "opacity-60"}`}
                    >
                      <rect
                        x={r.lx - w / 2}
                        y={r.ly - 8}
                        width={w}
                        height="16"
                        rx="3"
                        className={`fill-white ${hot ? "stroke-blueprint-900" : "stroke-blueprint-200"}`}
                      />
                      <text
                        x={r.lx}
                        y={r.ly + 3}
                        textAnchor="middle"
                        className="fill-blueprint-700 font-mono text-[9px]"
                      >
                        {r.edge.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}

            <div className="relative z-10 space-y-6 sm:space-y-12">
              {archData.tiers.map((tier, i) => (
                <Fragment key={tier.label}>
                  {i > 0 && (
                    <div className="flex justify-center my-1 text-blueprint-300 sm:hidden">
                      <ArrowDown className="text-lg" />
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                    <div className="w-full md:w-28 text-xs font-mono text-blueprint-500 shrink-0">
                      {tier.label}
                    </div>
                    <div
                      className={`flex-1 grid grid-cols-1 gap-3 w-full ${
                        tier.nodes.length === 3
                          ? "sm:grid-cols-3"
                          : "sm:grid-cols-2"
                      } ${hasEdges ? "sm:gap-x-14" : ""}`}
                    >
                      {tier.nodes.map((node) => {
                        const dim = hasEdges && !related.has(node.key);
                        return (
                          <div
                            key={node.key}
                            ref={(el) => {
                              nodeEls.current[node.key] = el;
                            }}
                            {...nodeProps(node.key)}
                            className={`cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint-900 p-3.5 bg-white rounded relative transition-all duration-200 ${
                              node.primary
                                ? "border-2 border-blueprint-900 shadow-xs"
                                : "border border-blueprint-200 hover:border-blueprint-900 hover:shadow-xs"
                            } ${inspectedKey === node.key ? "ring-2 ring-sky-500/60" : ""} ${
                              dim ? "opacity-70" : ""
                            }`}
                          >
                            {node.primary && (
                              <span className="absolute -top-2 right-2 text-[9px] font-mono bg-blueprint-900 text-white px-1.5 rounded">
                                {c.ui.arch.core}
                              </span>
                            )}
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs font-mono text-blueprint-950 ${node.primary ? "font-bold" : "font-semibold"}`}
                              >
                                {node.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blueprint-100 rounded text-blueprint-600 shrink-0">
                                {node.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-blueprint-600 mt-1">
                              {node.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Inspector card */}
        {inspected && (
          <aside
            aria-live="polite"
            className={`sticky bottom-0 lg:bottom-auto lg:top-0 z-20 max-h-[36vh] lg:max-h-[calc(92vh-9.5rem)] overflow-y-auto bg-white border border-blueprint-200 rounded-lg p-4 sm:p-5 shadow-[0_-6px_16px_-8px_rgba(0,0,0,0.25)] lg:shadow-xs ${
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

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 gap-4 mt-4 text-xs font-mono">
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

            {connections.length > 0 && (
              <div className="mt-4 pt-3 border-t border-blueprint-100">
                <span className="text-blueprint-400 block text-[10px] font-mono">
                  {c.ui.arch.connections}
                </span>
                <ul className="mt-2 flex flex-wrap gap-2 text-[11px] font-mono">
                  {connections.map((e) => {
                    const outgoing = e.from === inspectedKey;
                    const other = outgoing ? e.to : e.from;
                    return (
                      <li key={`${e.from}-${e.to}`}>
                        <button
                          type="button"
                          onClick={() => inspectNode(other)}
                          className="px-2 py-1 rounded border border-blueprint-200 bg-blueprint-50 hover:border-blueprint-900 text-blueprint-800 transition-colors"
                        >
                          <span className="text-blueprint-400">
                            {outgoing ? "→" : "←"}
                          </span>{" "}
                          {nameOf[other] ?? other}{" "}
                          <span className="text-blueprint-500">
                            ({e.label})
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
