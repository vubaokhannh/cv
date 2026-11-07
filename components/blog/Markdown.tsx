import type { ComponentProps, ElementType, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { createSlugger } from "@/lib/post-parse";

/** Extracts plain text from nested React children to generate stable anchor slugs. */
function getNodeText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (node && typeof node === "object" && "props" in node) {
    return getNodeText(
      (node as { props: { children?: ReactNode } }).props.children,
    );
  }
  return "";
}

/** Builds a styled element, dropping react-markdown's `node` prop. */
function el<T extends ElementType>(Tag: T, className: string) {
  return function Styled({
    node,
    ...props
  }: ComponentProps<T> & { node?: unknown }) {
    void node;
    const Component = Tag as ElementType;
    return <Component className={className} {...props} />;
  };
}

const InlineOrBlockCode: Components["code"] = ({
  node,
  className,
  ...props
}) => {
  void node;
  // Fenced blocks get a `hljs` / `language-*` class from rehype-highlight.
  return className ? (
    <code className={className} {...props} />
  ) : (
    <code
      className="px-1 py-0.5 rounded bg-blueprint-100 text-blueprint-900 text-[0.85em] font-mono"
      {...props}
    />
  );
};

/** Builds the renderers; heading ids come from a per-render slugger so duplicates stay unique and match the TOC. */
function buildComponents(sectionLabel: string): Components {
  const slug = createSlugger();

  const heading = (Tag: "h2" | "h3", className: string) =>
    function Heading({ children, node, ...props }: ComponentProps<"h2"> & { node?: unknown }) {
      void node;
      const id = slug(getNodeText(children));
      return (
        <Tag id={id || undefined} className={className} {...props}>
          <span>{children}</span>
          {id && (
            <a
              href={`#${id}`}
              aria-label={sectionLabel}
              className="text-blueprint-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-blueprint-700 transition-opacity text-xs font-mono select-none"
            >
              #
            </a>
          )}
        </Tag>
      );
    };

  return {
    h2: heading(
      "h2",
      "text-base font-bold text-blueprint-950 mt-8 mb-2 scroll-mt-20 group flex items-center justify-between gap-2 border-b border-blueprint-100 pb-1",
    ),
    h3: heading(
      "h3",
      "text-sm font-bold text-blueprint-950 mt-6 mb-2 scroll-mt-20 group flex items-center justify-between gap-2",
    ),
    p: el("p", "my-3"),
    ul: el("ul", "my-3 list-disc pl-5 space-y-1.5"),
    ol: el("ol", "my-3 list-decimal pl-5 space-y-1.5"),
    strong: el("strong", "font-semibold text-blueprint-950"),
    blockquote: el(
      "blockquote",
      "my-4 border-l-2 border-blueprint-300 pl-4 text-blueprint-600",
    ),
    pre: el(
      "pre",
      "my-4 overflow-x-auto rounded-lg bg-blueprint-950 text-blueprint-100 p-4 text-xs font-mono leading-relaxed",
    ),
    a: ({ node, href, ...props }) => {
      void node;
      const internal = href?.startsWith("#") || href?.startsWith("/");
      return (
        <a
          className="underline underline-offset-2 hover:text-blueprint-950"
          href={href}
          {...(internal ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          {...props}
        />
      );
    },
    code: InlineOrBlockCode,
  };
}

export default function Markdown({
  children,
  sectionLabel,
}: {
  children: string;
  sectionLabel: string;
}) {
  return (
    <ReactMarkdown
      components={buildComponents(sectionLabel)}
      rehypePlugins={[[rehypeHighlight, { detect: false }]]}
    >
      {children}
    </ReactMarkdown>
  );
}
