import { createHash } from "node:crypto";
import { mkdir, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

const FETCH_TIMEOUT_MS = 5_000;
const USER_AGENT = "jabol-enrich/0.1 (+https://github.com/jabol)";

export type FetchedMeta = {
  iconUrl?: string;
  imageUrl?: string;
};

async function timedFetch(url: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        ...(init?.headers ?? {}),
      },
      redirect: "follow",
    });
  } finally {
    clearTimeout(timer);
  }
}

function attr(html: string, tagRe: RegExp, attrName: string): string | undefined {
  const tagMatch = html.match(tagRe);
  if (!tagMatch) return undefined;
  const attrRe = new RegExp(`${attrName}\\s*=\\s*["']([^"']+)["']`, "i");
  const m = tagMatch[0].match(attrRe);
  return m?.[1];
}

function extractIconHref(html: string): string | undefined {
  const candidates: RegExp[] = [
    /<link[^>]+rel\s*=\s*["'][^"']*apple-touch-icon[^"']*["'][^>]*>/i,
    /<link[^>]+rel\s*=\s*["'][^"']*icon[^"']*["'][^>]*>/i,
    /<link[^>]+rel\s*=\s*["'][^"']*shortcut icon[^"']*["'][^>]*>/i,
  ];
  for (const re of candidates) {
    const href = attr(html, re, "href");
    if (href) return href;
  }
  return undefined;
}

function extractOgImage(html: string): string | undefined {
  const ogRe = /<meta[^>]+property\s*=\s*["']og:image["'][^>]*>/i;
  return attr(html, ogRe, "content");
}

function resolve(maybeRelative: string, base: string): string | undefined {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return undefined;
  }
}

export async function fetchMeta(pageUrl: string): Promise<FetchedMeta> {
  let res: Response;
  try {
    res = await timedFetch(pageUrl);
  } catch {
    return {};
  }
  if (!res.ok) return {};

  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("html")) return {};

  let html: string;
  try {
    html = await res.text();
  } catch {
    return {};
  }

  const iconHref = extractIconHref(html);
  const ogImage = extractOgImage(html);

  return {
    iconUrl: iconHref ? resolve(iconHref, res.url) : undefined,
    imageUrl: ogImage ? resolve(ogImage, res.url) : undefined,
  };
}

export function googleFallbackIcon(pageUrl: string): string {
  try {
    const u = new URL(pageUrl);
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=64`;
  } catch {
    return "";
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export function iconHash(url: string): string {
  return createHash("sha1").update(url).digest("hex");
}

export async function cacheImage(
  imageUrl: string,
  cacheDir: string,
): Promise<{ filename: string; publicPath: string } | null> {
  const hash = iconHash(imageUrl);
  const ext = guessExt(imageUrl) ?? ".img";
  const filename = `${hash}${ext}`;
  const filePath = join(cacheDir, filename);
  const publicPath = `/api/icons/${filename}`;

  if (await exists(filePath)) return { filename, publicPath };

  try {
    const res = await timedFetch(imageUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength === 0 || buf.byteLength > 5 * 1024 * 1024) return null;
    await mkdir(cacheDir, { recursive: true });
    await writeFile(filePath, buf);
    return { filename, publicPath };
  } catch {
    return null;
  }
}

function guessExt(url: string): string | undefined {
  const cleaned = url.split("?")[0].split("#")[0].toLowerCase();
  const dot = cleaned.lastIndexOf(".");
  if (dot < 0) return undefined;
  const ext = cleaned.slice(dot);
  if ([".png", ".jpg", ".jpeg", ".svg", ".ico", ".webp", ".gif"].includes(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return undefined;
}
