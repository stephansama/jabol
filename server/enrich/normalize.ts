import { randomUUID } from "node:crypto";
import { inputSchema, type CategorizedInput, type FlatInput, type LinkInput } from "./schema.js";

export type CanonicalLink = {
  id: string;
  name: string;
  url: string;
  description?: string;
  icon?: string;
  image?: string;
  tags?: string[];
  hidden?: boolean;
};

export type CanonicalCategory = {
  id: string;
  name: string;
  icon?: string;
  links: CanonicalLink[];
};

export type Canonical = {
  brand?: string;
  title?: string;
  description?: string;
  favicon?: string;
  theme?: "light" | "dark" | "mocha" | "latte" | "system" | "system-catppuccin";
  categories: CanonicalCategory[];
};

function ensureLinkId(link: LinkInput): CanonicalLink {
  return {
    id: link.id ?? randomUUID(),
    name: link.name,
    url: link.url,
    description: link.description,
    icon: link.icon,
    image: link.image,
    tags: link.tags,
    hidden: link.hidden,
  };
}

function fromCategorized(input: CategorizedInput): Canonical {
  return {
    brand: input.brand,
    title: input.title,
    description: input.description,
    favicon: input.favicon,
    theme: input.theme,
    categories: input.categories.map((c) => ({
      id: c.id ?? randomUUID(),
      name: c.name,
      icon: c.icon,
      links: c.links.map(ensureLinkId),
    })),
  };
}

function fromFlat(input: FlatInput): Canonical {
  if (input.groupByTag) {
    const buckets = new Map<string, CanonicalLink[]>();
    const untagged: CanonicalLink[] = [];

    for (const raw of input.links) {
      const link = ensureLinkId(raw);
      const tag = link.tags?.[0];
      if (!tag) {
        untagged.push(link);
        continue;
      }
      const arr = buckets.get(tag) ?? [];
      arr.push(link);
      buckets.set(tag, arr);
    }

    const categories: CanonicalCategory[] = [];
    for (const [name, links] of buckets) {
      categories.push({ id: randomUUID(), name, links });
    }
    if (untagged.length > 0) {
      categories.push({ id: randomUUID(), name: "Other", links: untagged });
    }

    return {
      brand: input.brand,
      title: input.title,
      description: input.description,
      favicon: input.favicon,
      theme: input.theme,
      categories,
    };
  }

  return {
    brand: input.brand,
    title: input.title,
    description: input.description,
    favicon: input.favicon,
    theme: input.theme,
    categories: [
      {
        id: randomUUID(),
        name: input.title ?? "Links",
        links: input.links.map(ensureLinkId),
      },
    ],
  };
}

export function parseAndNormalize(raw: unknown): Canonical {
  const parsed = inputSchema.parse(raw);
  if ("categories" in parsed) {
    return fromCategorized(parsed);
  }
  return fromFlat(parsed);
}

export function ensureIds(canonical: Canonical): { canonical: Canonical; mutated: boolean } {
  let mutated = false;
  const categories = canonical.categories.map((cat) => {
    let catChanged = false;
    let id = cat.id;
    if (!id) {
      id = randomUUID();
      catChanged = true;
    }
    const links = cat.links.map((link) => {
      if (!link.id) {
        mutated = true;
        return { ...link, id: randomUUID() };
      }
      return link;
    });
    if (catChanged) mutated = true;
    return { ...cat, id, links };
  });
  return { canonical: { ...canonical, categories }, mutated };
}
