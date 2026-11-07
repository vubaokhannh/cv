import { describe, expect, it } from "vitest";
import { stripLocale, viewFromPathname, viewHref } from "./views";

describe("views", () => {
  it("builds hrefs", () => {
    expect(viewHref("vi", "experience")).toBe("/vi");
    expect(viewHref("en", "projects")).toBe("/en/projects");
  });
  it("strips the locale prefix", () => {
    expect(stripLocale("/vi")).toBe("");
    expect(stripLocale("/en/blog/x")).toBe("/blog/x");
    expect(stripLocale("/vietnam")).toBe("/vietnam");
  });
  it("maps pathname to a view", () => {
    expect(viewFromPathname("/vi")).toBe("experience");
    expect(viewFromPathname("/en/contact/")).toBe("contact");
    expect(viewFromPathname("/en/blog")).toBeNull();
  });
});
