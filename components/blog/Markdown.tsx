import type { ComponentProps, ElementType, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { slugify } from "@/lib/slugify";

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

function Heading2({ children, ...props }: ComponentProps<"h2">) {
  const text = getNodeText(children);
  const id = slugify(text);
  return (
    <h2
      id={id}
      className="text-base font-bold text-blueprint-950 mt-8 mb-2 scroll-mt-20 group flex items-center justify-between gap-2 border-b border-blueprint-100 pb-1"
      {...props}
    >
      <span>{children}</span>
      {id && (
        <a
          href={`#${id}`}
          aria-label="Link to section"
          className="text-blueprint-300 opacity-0 group-hover:opacity-100 hover:text-blueprint-700 transition-opacity text-xs font-mono select-none"
        >
          #
        </a>
      )}
    </h2>
  );
}

function Heading3({ children, ...props }: ComponentProps<"h3">) {
  const text = getNodeText(children);
  const id = slugify(text);
  return (
    <h3
      id={id}
      className="text-sm font-bold text-blueprint-950 mt-6 mb-2 scroll-mt-20 group flex items-center justify-between gap-2"
      {...props}
    >
      <span>{children}</span>
      {id && (
        <a
          href={`#${id}`}
          aria-label="Link to section"
          className="text-blueprint-300 opacity-0 group-hover:opacity-100 hover:text-blueprint-700 transition-opacity text-xs font-mono select-none"
        >
          #
        </a>
      )}
    </h3>
  );
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
  return className ? (
    <code className={className} {...props} />
  ) : (
    <code
      className="px-1 py-0.5 rounded bg-blueprint-100 text-blueprint-900 text-[0.85em] font-mono"
      {...props}
    />
  );
};

const components: Components = {
  h2: Heading2,
  h3: Heading3,
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
  a: ({ node, ...props }) => {
    void node;
    return (
      <a
        className="underline underline-offset-2 hover:text-blueprint-950"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    );
  },
  code: InlineOrBlockCode,
};

export default function Markdown({ children }: { children: string }) {
  return <ReactMarkdown components={components}>{children}</ReactMarkdown>;
}
