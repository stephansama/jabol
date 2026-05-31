import { readFile, writeFile, rename, access, constants } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { parseAndNormalize, ensureIds, type Canonical, type CanonicalLink, type CanonicalCategory } from "../enrich/normalize.js";
import { enrichCanonical, enrichLinks } from "../enrich/index.js";
import { env } from "../config.js";

type Listener = () => void;

class Store {
  private canonical: Canonical = { categories: [] };
  private listeners = new Set<Listener>();
  private writePromise: Promise<void> = Promise.resolve();
  private suppressWatchUntil = 0;
  private readOnly = false;

  isReadOnly(): boolean {
    return this.readOnly;
  }

  /** Returns true if the watcher should ignore the upcoming event. */
  shouldSuppressWatchEvent(): boolean {
    return Date.now() < this.suppressWatchUntil;
  }

  getCanonical(): Canonical {
    return this.canonical;
  }

  getPublicCanonical(): Canonical {
    return {
      ...this.canonical,
      categories: this.canonical.categories
        .filter((c) => !c.hidden)
        .map((c) => ({
          ...c,
          links: c.links.filter((l) => !l.hidden),
        })),
    };
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    for (const l of this.listeners) {
      try {
        l();
      } catch (err) {
        console.error("[store] listener error:", err);
      }
    }
  }

  async init(): Promise<void> {
    this.readOnly = await detectReadOnly(env.configPath);

    const raw = await readJsonOrEmpty(env.configPath);
    const parsed = parseAndNormalize(raw);
    const { canonical, mutated } = ensureIds(parsed);
    this.canonical = canonical;

    // First enrichment pass at startup.
    try {
      this.canonical = await enrichCanonical(this.canonical, env.iconsDir);
    } catch (err) {
      console.error("[store] initial enrichment failed:", err);
    }

    if (mutated && !this.readOnly) {
      await this.persist();
    }
    this.emit();
  }

  async reloadFromDisk(): Promise<void> {
    const raw = await readJsonOrEmpty(env.configPath);
    const parsed = parseAndNormalize(raw);
    const { canonical, mutated } = ensureIds(parsed);

    const oldLinks = new Map<string, CanonicalLink>();
    for (const cat of this.canonical.categories) {
      for (const link of cat.links) oldLinks.set(link.id, link);
    }

    // Carry forward already-resolved icon/image when url unchanged.
    const carried: Canonical = {
      ...canonical,
      categories: canonical.categories.map((cat) => ({
        ...cat,
        links: cat.links.map((link) => {
          const prev = oldLinks.get(link.id);
          if (prev && prev.url === link.url) {
            return {
              ...link,
              icon: link.icon ?? prev.icon,
              image: link.image ?? prev.image,
            };
          }
          return link;
        }),
      })),
    };

    this.canonical = carried;

    // Enrich only newly added / changed links.
    const newOrChanged: CanonicalLink[] = [];
    for (const cat of this.canonical.categories) {
      for (const link of cat.links) {
        const prev = oldLinks.get(link.id);
        if (!prev || prev.url !== link.url) newOrChanged.push(link);
      }
    }

    if (newOrChanged.length > 0) {
      const enriched = await enrichLinks(newOrChanged, env.iconsDir);
      const lookup = new Map(enriched.map((l) => [l.id, l]));
      this.canonical = {
        ...this.canonical,
        categories: this.canonical.categories.map((c) => ({
          ...c,
          links: c.links.map((l) => lookup.get(l.id) ?? l),
        })),
      };
    }

    if (mutated && !this.readOnly) {
      await this.persist();
    }
    this.emit();
  }

  async replaceAll(next: Canonical): Promise<{ counts: { categories: number; links: number } }> {
    this.assertWritable();
    const { canonical: withIds } = ensureIds(next);

    const oldLinks = new Map<string, CanonicalLink>();
    for (const cat of this.canonical.categories) {
      for (const link of cat.links) oldLinks.set(link.id, link);
    }
    const carried: Canonical = {
      ...withIds,
      categories: withIds.categories.map((cat) => ({
        ...cat,
        links: cat.links.map((link) => {
          const prev = oldLinks.get(link.id);
          if (prev && prev.url === link.url) {
            return {
              ...link,
              icon: link.icon ?? prev.icon,
              image: link.image ?? prev.image,
            };
          }
          return link;
        }),
      })),
    };

    this.canonical = carried;
    await this.persist();

    enrichCanonical(this.canonical, env.iconsDir)
      .then((enriched) => {
        this.canonical = enriched;
        this.emit();
      })
      .catch((err) => console.error("[store] post-replace enrichment failed:", err));

    this.emit();
    return {
      counts: {
        categories: this.canonical.categories.length,
        links: this.canonical.categories.reduce((n, c) => n + c.links.length, 0),
      },
    };
  }

  async addLink(categoryId: string, link: Omit<CanonicalLink, "id">): Promise<CanonicalLink> {
    this.assertWritable();
    const newLink: CanonicalLink = { ...link, id: randomUUID() };
    const cats = this.canonical.categories.map((c) =>
      c.id === categoryId ? { ...c, links: [...c.links, newLink] } : c,
    );
    if (!cats.some((c) => c.id === categoryId)) {
      throw new HttpError(404, `category ${categoryId} not found`);
    }
    this.canonical = { ...this.canonical, categories: cats };

    try {
      const [enriched] = await enrichLinks([newLink], env.iconsDir);
      this.canonical = {
        ...this.canonical,
        categories: this.canonical.categories.map((c) => ({
          ...c,
          links: c.links.map((l) => (l.id === enriched.id ? enriched : l)),
        })),
      };
    } catch (err) {
      console.error("[store] enrichment failed for new link:", err);
    }

    await this.persist();
    this.emit();
    return this.findLink(newLink.id)!;
  }

  async updateLink(id: string, patch: Partial<Omit<CanonicalLink, "id">>): Promise<CanonicalLink> {
    this.assertWritable();
    let found: CanonicalLink | undefined;
    const cats = this.canonical.categories.map((c) => ({
      ...c,
      links: c.links.map((l) => {
        if (l.id !== id) return l;
        found = { ...l, ...patch };
        return found;
      }),
    }));
    if (!found) throw new HttpError(404, `link ${id} not found`);
    this.canonical = { ...this.canonical, categories: cats };

    // Re-enrich if URL changed.
    const original = this.findLink(id);
    if (original && patch.url && (!patch.icon || !patch.image)) {
      try {
        const [enriched] = await enrichLinks([original], env.iconsDir);
        this.canonical = {
          ...this.canonical,
          categories: this.canonical.categories.map((c) => ({
            ...c,
            links: c.links.map((l) => (l.id === enriched.id ? enriched : l)),
          })),
        };
        found = enriched;
      } catch (err) {
        console.error("[store] re-enrichment failed:", err);
      }
    }

    await this.persist();
    this.emit();
    return found;
  }

  async deleteLink(id: string): Promise<void> {
    this.assertWritable();
    const cats = this.canonical.categories.map((c) => ({
      ...c,
      links: c.links.filter((l) => l.id !== id),
    }));
    this.canonical = { ...this.canonical, categories: cats };
    await this.persist();
    this.emit();
  }

  async addCategory(input: { name: string; icon?: string; hidden?: boolean }): Promise<CanonicalCategory> {
    this.assertWritable();
    const cat: CanonicalCategory = {
      id: randomUUID(),
      name: input.name,
      icon: input.icon,
      hidden: input.hidden,
      links: [],
    };
    this.canonical = { ...this.canonical, categories: [...this.canonical.categories, cat] };
    await this.persist();
    this.emit();
    return cat;
  }

  async updateCategory(id: string, patch: Partial<Omit<CanonicalCategory, "id" | "links">>): Promise<CanonicalCategory> {
    this.assertWritable();
    let found: CanonicalCategory | undefined;
    const cats = this.canonical.categories.map((c) => {
      if (c.id !== id) return c;
      found = { ...c, ...patch };
      return found;
    });
    if (!found) throw new HttpError(404, `category ${id} not found`);
    this.canonical = { ...this.canonical, categories: cats };
    await this.persist();
    this.emit();
    return found;
  }

  async deleteCategory(id: string): Promise<void> {
    this.assertWritable();
    const target = this.canonical.categories.find((c) => c.id === id);
    if (!target) throw new HttpError(404, `category ${id} not found`);
    if (target.links.length > 0) {
      throw new HttpError(400, "category has links — move or delete them first");
    }
    this.canonical = {
      ...this.canonical,
      categories: this.canonical.categories.filter((c) => c.id !== id),
    };
    await this.persist();
    this.emit();
  }

  async updateSettings(patch: {
    brand?: string | null;
    title?: string | null;
    favicon?: string | null;
    theme?: Canonical["theme"] | null;
  }): Promise<{ brand?: string; title?: string; favicon?: string; theme?: Canonical["theme"] }> {
    this.assertWritable();
    const next: Canonical = { ...this.canonical };
    const apply = (key: "brand" | "title" | "favicon" | "theme") => {
      if (!(key in patch)) return;
      const value = patch[key];
      if (value === null || value === "") {
        delete next[key];
      } else if (typeof value === "string") {
        (next as any)[key] = value;
      }
    };
    apply("brand");
    apply("title");
    apply("favicon");
    apply("theme");
    this.canonical = next;
    await this.persist();
    this.emit();
    return { brand: next.brand, title: next.title, favicon: next.favicon, theme: next.theme };
  }

  async refreshAssets(): Promise<{ count: number }> {
    this.assertWritable();
    this.canonical = await enrichCanonical(this.canonical, env.iconsDir, { force: true });
    await this.persist();
    this.emit();
    const count = this.canonical.categories.reduce((n, c) => n + c.links.length, 0);
    return { count };
  }

  findLink(id: string): CanonicalLink | undefined {
    for (const cat of this.canonical.categories) {
      for (const link of cat.links) if (link.id === id) return link;
    }
    return undefined;
  }

  private assertWritable() {
    if (this.readOnly) throw new HttpError(403, "read-only mount");
  }

  private persist(): Promise<void> {
    this.writePromise = this.writePromise.then(() => this.writeNow());
    return this.writePromise;
  }

  private async writeNow(): Promise<void> {
    const serialized = JSON.stringify(this.canonical, null, 2) + "\n";
    const tmp = `${env.configPath}.tmp.${process.pid}`;
    this.suppressWatchUntil = Date.now() + 1500;
    await writeFile(tmp, serialized, "utf8");
    await rename(tmp, env.configPath);
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function detectReadOnly(path: string): Promise<boolean> {
  try {
    await access(path, constants.W_OK);
    return false;
  } catch (err: any) {
    console.warn(
      `[store] read-only detection: cannot write ${path}` +
        ` (errno=${err?.code ?? "?"}, process uid=${process.getuid?.() ?? "?"}).`,
    );
    return true;
  }
}

async function readJsonOrEmpty(path: string): Promise<unknown> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw);
  } catch (err: any) {
    if (err && err.code === "ENOENT") {
      console.warn(`[store] ${path} not found — starting empty. Mount a JSON file to populate.`);
      return { categories: [{ name: "Welcome", links: [] }] };
    }
    throw err;
  }
}

export const store = new Store();
