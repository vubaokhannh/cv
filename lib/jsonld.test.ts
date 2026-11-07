import { expect, it } from "vitest";
import { jsonLd } from "./jsonld";

it("escapes < so </script> cannot break out", () => {
  const out = jsonLd({ a: "</script><b>" });
  expect(out).not.toContain("<");
  expect(JSON.parse(out).a).toBe("</script><b>");
});
