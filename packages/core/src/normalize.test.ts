import { describe, expect, it } from "vitest";
import { parseAndNormalize } from "./normalize.js";

describe("parseAndNormalize — categorized shape", () => {
  it("preserves all top-level branding fields including image and per-category hidden", () => {
    const result = parseAndNormalize({
      brand: "@example",
      title: "links",
      description: "demo collection",
      favicon: "https://example.com/favicon.svg",
      image: "https://example.com/og.png",
      theme: "mocha",
      categories: [
        { name: "Public", links: [{ name: "GitHub", url: "https://github.com" }] },
        { name: "Internal", hidden: true, links: [{ name: "Wiki", url: "https://wiki" }] },
      ],
    });

    expect(result.brand).toBe("@example");
    expect(result.image).toBe("https://example.com/og.png");
    expect(result.categories).toHaveLength(2);
    expect(result.categories[1].hidden).toBe(true);
  });

  it("stamps a UUID on categories and links that omit one", () => {
    const result = parseAndNormalize({
      categories: [{ name: "Cat", links: [{ name: "L", url: "https://a" }] }],
    });
    expect(result.categories[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.categories[0].links[0].id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("respects pre-existing UUIDs", () => {
    const catId = "11111111-2222-4333-8444-555555555555";
    const linkId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
    const result = parseAndNormalize({
      categories: [{ id: catId, name: "Cat", links: [{ id: linkId, name: "L", url: "https://a" }] }],
    });
    expect(result.categories[0].id).toBe(catId);
    expect(result.categories[0].links[0].id).toBe(linkId);
  });
});

describe("parseAndNormalize — flat shape", () => {
  it("groups by first tag when groupByTag is true; untagged go to 'Other'", () => {
    const result = parseAndNormalize({
      groupByTag: true,
      links: [
        { name: "GH", url: "https://github.com", tags: ["dev"] },
        { name: "HN", url: "https://news.yc", tags: ["news"] },
        { name: "Misc", url: "https://misc" },
      ],
    });
    const names = result.categories.map((c) => c.name).sort();
    expect(names).toEqual(["Other", "dev", "news"]);
    expect(result.categories.find((c) => c.name === "Other")?.links[0].name).toBe("Misc");
  });

  it("collapses into a single category when groupByTag is false", () => {
    const result = parseAndNormalize({
      title: "All",
      links: [
        { name: "A", url: "https://a" },
        { name: "B", url: "https://b" },
      ],
    });
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].name).toBe("All");
    expect(result.categories[0].links).toHaveLength(2);
  });
});
