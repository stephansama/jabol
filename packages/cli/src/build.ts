import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  enrichCanonical,
  ensureIds,
  filterPublicCanonical,
  parseAndNormalize,
  renderIndexHtml,
  type Canonical,
} from "@jabol/core";

export type BuildOptions = {
  /** Path to the links.json config (categorized or flat shape). */
  configPath: string;
  /** Directory to write the generated static site into. */
  outDir: string;
  /** Public base path, e.g. "/" or "/repo/". Normalized to leading+trailing slash. */
  base?: string;
  /** Absolute site URL used for og:url (optional). */
  siteUrl?: string;
  /** Fetch favicons/OG images at build time (default true). */
  enrich?: boolean;
};

export type BuildResult = {
  outDir: string;
  base: string;
  categories: number;
  links: number;
  enriched: boolean;
};

const here = dirname(fileURLToPath(import.meta.url));

/** Normalize a base to "/" or "/segment/". */
export function normalizeBase(base: string | undefined): string {
  if (!base || base === "/" || base === "") return "/";
  let b = base.trim();
  if (!b.startsWith("/")) b = "/" + b;
  if (!b.endsWith("/")) b = b + "/";
  return b;
}

/**
 * Locate the client package to build. When published inside `jabol`, the
 * client source is bundled at `<pkg>/client` (see scripts/bundle-client.mjs).
 * In the workspace we resolve the sibling @jabol/client package instead.
 */
function resolveClientRoot(): string {
  const bundled = resolve(here, "..", "client");
  if (existsSync(join(bundled, "vite.config.ts")) || existsSync(join(bundled, "vite.config.js"))) {
    return bundled;
  }
  const require = createRequire(import.meta.url);
  const pkgJson = require.resolve("@jabol/client/package.json");
  return dirname(pkgJson);
}

/** Prefix a root-relative ("/x") app path with the base; leave URLs & Iconify ids alone. */
function withBase(path: string | undefined, base: string): string | undefined {
  if (!path || base === "/") return path;
  if (!path.startsWith("/")) return path; // absolute URL or Iconify id (foo:bar)
  return base + path.slice(1);
}

/** Rewrite root-relative asset paths in the canonical to sit under the base. */
function applyBase(canonical: Canonical, base: string): Canonical {
  if (base === "/") return canonical;
  return {
    ...canonical,
    favicon: withBase(canonical.favicon, base),
    image: withBase(canonical.image, base),
    categories: canonical.categories.map((c) => ({
      ...c,
      links: c.links.map((l) => ({
        ...l,
        icon: withBase(l.icon, base),
        image: withBase(l.image, base),
      })),
    })),
  };
}

export async function buildStatic(opts: BuildOptions): Promise<BuildResult> {
  const base = normalizeBase(opts.base);
  const outDir = resolve(opts.outDir);
  const configPath = isAbsolute(opts.configPath) ? opts.configPath : resolve(opts.configPath);
  const enrich = opts.enrich !== false;

  const clientRoot = resolveClientRoot();

  // 1. Build the SPA with the requested base. Unset JABOL_CONFIG_PATH so the
  //    client's dev head-inject plugin passes HTML through untouched, leaving
  //    the sentinels intact for our post-render below. JABOL_SSG_BASE drives
  //    both `base` and the PWA manifest scope in the client's vite.config.
  delete process.env.JABOL_CONFIG_PATH;
  process.env.JABOL_SSG_BASE = base;
  const { build: viteBuild } = await import("vite");
  await viteBuild({
    root: clientRoot,
    base,
    configFile: join(clientRoot, existsSync(join(clientRoot, "vite.config.ts")) ? "vite.config.ts" : "vite.config.js"),
    logLevel: "warn",
    build: { outDir, emptyOutDir: true },
  });

  // 2. Load the built template (still carries the head/body sentinels).
  const template = await readFile(join(outDir, "index.html"), "utf8");

  // 3. Normalize the config into a canonical shape.
  const raw = JSON.parse(await readFile(configPath, "utf8"));
  let canonical = ensureIds(parseAndNormalize(raw)).canonical;

  // 4. Optionally fetch + cache favicons/OG images into <out>/api/icons.
  if (enrich) {
    canonical = await enrichCanonical(canonical, join(outDir, "api", "icons"));
  }

  // 5. Public view only (drop hidden), then base-prefix runtime asset paths.
  const pub = applyBase(filterPublicCanonical(canonical), base);

  // 6. Render the final document with the embedded static bootstrap.
  const bootstrap = { ...pub, readOnly: true, static: true };
  const favicon = pub.favicon ?? (base === "/" ? undefined : `${base}favicon.svg`);
  const html = renderIndexHtml(template, {
    brand: pub.brand,
    title: pub.title,
    description: pub.description,
    favicon,
    image: pub.image,
    siteUrl: opts.siteUrl,
    headHtml: pub.headHtml,
    bodyHtml: pub.bodyHtml,
    bootstrap,
  });

  // 7. Emit index.html, a 404 fallback (deep-link routing on static hosts),
  //    and .nojekyll (so GitHub Pages serves _-prefixed dirs verbatim).
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, "index.html"), html, "utf8");
  await writeFile(join(outDir, "404.html"), html, "utf8");
  await writeFile(join(outDir, ".nojekyll"), "", "utf8");

  const links = pub.categories.reduce((n, c) => n + c.links.length, 0);
  return { outDir, base, categories: pub.categories.length, links, enriched: enrich };
}
