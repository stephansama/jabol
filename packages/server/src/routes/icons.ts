import { Hono } from "hono";
import { readFile, stat } from "node:fs/promises";
import { join, normalize } from "node:path";
import { env } from "../config.js";

export const iconRoutes = new Hono().get("/:filename", async (c) => {
  const filename = c.req.param("filename");
  if (!/^[a-z0-9._-]+$/i.test(filename)) {
    return c.json({ error: "invalid filename" }, 400);
  }
  const path = normalize(join(env.iconsDir, filename));
  if (!path.startsWith(env.iconsDir)) {
    return c.json({ error: "invalid path" }, 400);
  }
  try {
    const st = await stat(path);
    if (!st.isFile()) return c.notFound();
    const buf = await readFile(path);
    const type = contentTypeFor(filename);
    c.header("Cache-Control", "public, max-age=86400");
    return c.body(buf, 200, { "Content-Type": type });
  } catch {
    return c.notFound();
  }
});

function contentTypeFor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".svg")) return "image/svg+xml";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".ico")) return "image/x-icon";
  if (lower.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}
