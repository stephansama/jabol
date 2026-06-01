import { describe, expect, it } from "vitest";
import {
  SENTINEL_END,
  SENTINEL_START,
  computeDocumentTitle,
  renderBootstrapScript,
  renderIndexHtml,
} from "./renderHead.js";

const TEMPLATE = `<!doctype html>
<html><head>
${SENTINEL_START}
<title>jabol</title>
${SENTINEL_END}
</head><body></body></html>`;

describe("computeDocumentTitle", () => {
  it("prefers brand, then title, then falls back to 'jabol'", () => {
    expect(computeDocumentTitle({ brand: "B", title: "T" })).toBe("B");
    expect(computeDocumentTitle({ title: "T" })).toBe("T");
    expect(computeDocumentTitle({})).toBe("jabol");
  });
});

describe("renderIndexHtml", () => {
  it("replaces the sentinel block with computed head tags", () => {
    const html = renderIndexHtml(TEMPLATE, { brand: "@me", description: "hi" });
    expect(html).toContain("<title>@me</title>");
    expect(html).toContain('content="hi"');
    expect(html).not.toContain("<title>jabol</title>");
  });

  it("escapes attribute-context characters in user-controlled strings", () => {
    const html = renderIndexHtml(TEMPLATE, { brand: '"><svg/onload=alert(1)>' });
    expect(html).not.toMatch(/<svg\/onload/);
    expect(html).toContain("&quot;");
    expect(html).toContain("&lt;");
  });

  it("returns the template unchanged when sentinels are missing", () => {
    expect(renderIndexHtml("<html></html>", { brand: "x" })).toBe("<html></html>");
  });
});

describe("renderBootstrapScript", () => {
  it("breaks any literal </script> inside user-controlled strings by escaping <", () => {
    const out = renderBootstrapScript({ brand: "</script><script>alert(1)</script>" });
    expect(out).not.toMatch(/<\/script><script>/);
    expect(out).toContain('type="application/json"');
    // The wrapper's own closing </script> is the only literal </script> allowed.
    const matches = out.match(/<\/script>/g) ?? [];
    expect(matches).toHaveLength(1);
  });
});
