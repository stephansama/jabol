import { describe, expect, it } from "vitest";
import { filterPublicCanonical } from "./store.js";
import type { Canonical } from "../enrich/normalize.js";

const sample: Canonical = {
  brand: "@me",
  categories: [
    {
      id: "cat-public",
      name: "Public",
      links: [
        { id: "l1", name: "A", url: "https://a" },
        { id: "l2", name: "Secret", url: "https://b", hidden: true },
      ],
    },
    {
      id: "cat-hidden",
      name: "Internal",
      hidden: true,
      links: [
        { id: "l3", name: "Visible-in-hidden-cat", url: "https://c" },
      ],
    },
  ],
};

describe("filterPublicCanonical", () => {
  it("drops hidden categories entirely (including their visible links)", () => {
    const result = filterPublicCanonical(sample);
    const names = result.categories.map((c) => c.name);
    expect(names).toEqual(["Public"]);
    const flatIds = result.categories.flatMap((c) => c.links.map((l) => l.id));
    expect(flatIds).not.toContain("l3");
  });

  it("drops hidden links within visible categories", () => {
    const result = filterPublicCanonical(sample);
    const publicLinks = result.categories[0].links.map((l) => l.id);
    expect(publicLinks).toEqual(["l1"]);
  });

  it("preserves top-level branding fields untouched", () => {
    const result = filterPublicCanonical(sample);
    expect(result.brand).toBe("@me");
  });
});
