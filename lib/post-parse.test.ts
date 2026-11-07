import { describe, expect, it } from "vitest";
import { createSlugger, extractToc, parsePost } from "./post-parse";

const post = (front: string, body = "Hello world") =>
  `---\n${front}\n---\n${body}`;
const ok = "title: T\ndate: 2025-01-02\nsummary: S\ntags: a, b";

describe("parsePost", () => {
  it("parses frontmatter, tags and defaults `updated` to `date`", () => {
    const p = parsePost("x", post(ok));
    expect(p).toMatchObject({
      title: "T",
      date: "2025-01-02",
      updated: "2025-01-02",
      tags: ["a", "b"],
      minutes: 1,
    });
  });

  it("strips surrounding quotes and honours `updated`", () => {
    const p = parsePost("x", post(`title: "Quoted: yes"\ndate: 2025-01-02\nsummary: 'S'\nupdated: 2025-02-03`));
    expect(p.title).toBe("Quoted: yes");
    expect(p.summary).toBe("S");
    expect(p.updated).toBe("2025-02-03");
  });

  it("throws on missing frontmatter, fields or bad dates", () => {
    expect(() => parsePost("x", "no front")).toThrow(/frontmatter/);
    expect(() => parsePost("x", post("title: T\ndate: 2025-01-02"))).toThrow(/summary/);
    expect(() => parsePost("x", post("title: T\ndate: 1/2/25\nsummary: S"))).toThrow(/YYYY-MM-DD/);
  });
});

describe("extractToc", () => {
  it("ignores headings inside code fences", () => {
    const md = "## Real\n```bash\n## not a heading\n```\n### Sub";
    expect(extractToc(md).map((i) => i.text)).toEqual(["Real", "Sub"]);
  });

  it("dedupes ids and strips inline markdown", () => {
    const md = "## **Setup**\n## Setup\n## `code` here";
    expect(extractToc(md).map((i) => i.id)).toEqual(["setup", "setup-2", "code-here"]);
  });
});

describe("createSlugger", () => {
  it("handles Vietnamese diacritics", () => {
    expect(createSlugger()("Đăng nhập an toàn")).toBe("dang-nhap-an-toan");
  });
});
