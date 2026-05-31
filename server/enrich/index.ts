import pLimit from "p-limit";
import { cacheImage, fetchMeta, googleFallbackIcon } from "./fetchers.js";
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

async function enrichLink(
  link: CanonicalLink,
  cacheDir: string,
): Promise<CanonicalLink> {
  // If both icon and image already provided as iconify ids or URLs, skip metadata fetch.
  const iconAlreadyResolved = link.icon && (isIconifyId(link.icon) || isUrl(link.icon));
  const imageAlreadyResolved = link.image && isUrl(link.image);
  if (iconAlreadyResolved && imageAlreadyResolved) return link;

  let nextIcon = link.icon;
  let nextImage = link.image;

  // Fetch page metadata once.
  const meta = await fetchMeta(link.url);

  if (!iconAlreadyResolved) {
    let iconCandidate = meta.iconUrl;
    if (!iconCandidate) iconCandidate = googleFallbackIcon(link.url);
    if (iconCandidate) {
      const cached = await cacheImage(iconCandidate, cacheDir);
      if (cached) nextIcon = cached.publicPath;
    }
  }

  if (!imageAlreadyResolved && meta.imageUrl) {
    const cached = await cacheImage(meta.imageUrl, cacheDir);
    if (cached) nextImage = cached.publicPath;
  }

  return { ...link, icon: nextIcon, image: nextImage };
}

export async function enrichCanonical(
  canonical: Canonical,
  cacheDir: string,
): Promise<Canonical> {
  const limit = pLimit(CONCURRENCY);
  const enriched = await Promise.all(
    canonical.categories.map(async (cat) => {
      const links = await Promise.all(
        cat.links.map((link) => limit(() => enrichLink(link, cacheDir))),
      );
      return { ...cat, links };
    }),
  );
  return { ...canonical, categories: enriched };
}

export async function enrichLinks(
  links: CanonicalLink[],
  cacheDir: string,
): Promise<CanonicalLink[]> {
  const limit = pLimit(CONCURRENCY);
  return Promise.all(links.map((l) => limit(() => enrichLink(l, cacheDir))));
}
