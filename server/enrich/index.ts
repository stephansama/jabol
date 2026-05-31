import pLimit from "p-limit";
import { cacheImage, fetchMeta, googleFallbackIcon, rootFaviconUrl } from "./fetchers.js";
import type { Canonical, CanonicalLink } from "./normalize.js";

const CONCURRENCY = 8;

function isIconifyId(s: string): boolean {
  return /^[a-z0-9_-]+:[a-z0-9_-]+$/i.test(s);
}

function isUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

function isCachedPath(s: string): boolean {
  return s.startsWith("/api/icons/");
}

export type EnrichOptions = { force?: boolean };

function isResolvedIcon(s: string | undefined, force = false): boolean {
  if (!s) return false;
  if (force && isCachedPath(s)) return false;
  return isIconifyId(s) || isUrl(s) || isCachedPath(s);
}

function isResolvedImage(s: string | undefined, force = false): boolean {
  if (!s) return false;
  if (force && isCachedPath(s)) return false;
  return isUrl(s) || isCachedPath(s);
}

async function enrichLink(
  link: CanonicalLink,
  cacheDir: string,
  opts: EnrichOptions = {},
): Promise<CanonicalLink> {
  // Skip metadata fetch when both icon and image are already resolved
  // (iconify id, absolute URL, or a previously-cached /api/icons/ path).
  // When opts.force is true, cached paths count as unresolved so they re-scrape.
  const iconAlreadyResolved = isResolvedIcon(link.icon, opts.force);
  const imageAlreadyResolved = isResolvedImage(link.image, opts.force);
  if (iconAlreadyResolved && imageAlreadyResolved) return link;

  let nextIcon = link.icon;
  let nextImage = link.image;

  // Fetch page metadata once.
  const meta = await fetchMeta(link.url);

  if (!iconAlreadyResolved) {
    // Try, in order: the page's declared icon, the universal /favicon.ico,
    // and Google's S2 favicon proxy. cacheImage rejects HTML/non-image responses,
    // so each attempt fails fast on misses.
    const candidates: string[] = [];
    if (meta.iconUrl) candidates.push(meta.iconUrl);
    const root = rootFaviconUrl(link.url);
    if (root) candidates.push(root);
    const gfb = googleFallbackIcon(link.url);
    if (gfb) candidates.push(gfb);

    for (const c of candidates) {
      const cached = await cacheImage(c, cacheDir, { force: opts.force });
      if (cached) {
        nextIcon = cached.publicPath;
        break;
      }
    }

    if (!nextIcon) {
      console.warn(`[enrich] no favicon resolved for ${link.url}`);
    }
  }

  if (!imageAlreadyResolved && meta.imageUrl) {
    const cached = await cacheImage(meta.imageUrl, cacheDir, { force: opts.force });
    if (cached) nextImage = cached.publicPath;
  }

  return { ...link, icon: nextIcon, image: nextImage };
}

export async function enrichCanonical(
  canonical: Canonical,
  cacheDir: string,
  opts: EnrichOptions = {},
): Promise<Canonical> {
  const limit = pLimit(CONCURRENCY);
  const enriched = await Promise.all(
    canonical.categories.map(async (cat) => {
      const links = await Promise.all(
        cat.links.map((link) => limit(() => enrichLink(link, cacheDir, opts))),
      );
      return { ...cat, links };
    }),
  );
  return { ...canonical, categories: enriched };
}

export async function enrichLinks(
  links: CanonicalLink[],
  cacheDir: string,
  opts: EnrichOptions = {},
): Promise<CanonicalLink[]> {
  const limit = pLimit(CONCURRENCY);
  return Promise.all(links.map((l) => limit(() => enrichLink(l, cacheDir, opts))));
}
