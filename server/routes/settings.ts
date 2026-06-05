import { Hono } from "hono";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import { env } from "../config.js";
import { store, HttpError } from "../state/store.js";
import { cacheImage } from "../enrich/fetchers.js";
import { themeSchema } from "../enrich/schema.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const MAX_UPLOAD_BYTES = 512 * 1024;

const ALLOWED_MIME: Record<string, string> = {
  "image/svg+xml": ".svg",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/x-icon": ".ico",
  "image/vnd.microsoft.icon": ".ico",
  "image/gif": ".gif",
};

const patchBodySchema = z.object({
  brand: z.string().min(1).max(80).nullable().optional(),
  title: z.string().min(1).max(200).nullable().optional(),
  favicon: z.string().min(1).nullable().optional(),
  headerHtml: z.string().min(1).max(4096).nullable().optional(),
  headHtml: z.string().min(1).max(16384).nullable().optional(),
  theme: themeSchema.nullable().optional(),
});

const urlBodySchema = z.object({
  url: z.url(),
});

export const settingsRoutes = new Hono()
  .use("*", requireAdmin)
  .patch("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = patchBodySchema.safeParse(body);
    if (!parsed.success) return c.json({ error: z.flattenError(parsed.error) }, 400);
    try {
      const result = await store.updateSettings(parsed.data);
      return c.json(result);
    } catch (err) {
      return errorResponse(c, err);
    }
  })
  .post("/favicon", async (c) => {
    if (store.isReadOnly()) {
      return c.json({ error: "read-only mount" }, 403);
    }

    const contentType = c.req.header("content-type") ?? "";

    try {
      let publicPath: string | null = null;

      if (contentType.toLowerCase().startsWith("multipart/form-data")) {
        const form = await c.req.parseBody();
        const file = form["file"];
        if (!(file instanceof File)) {
          return c.json({ error: "missing file field" }, 400);
        }
        const ext = ALLOWED_MIME[file.type];
        if (!ext) {
          return c.json(
            { error: `unsupported file type: ${file.type || "unknown"}` },
            400,
          );
        }
        if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
          return c.json(
            { error: `file size must be 1B – ${MAX_UPLOAD_BYTES}B` },
            400,
          );
        }
        const buf = Buffer.from(await file.arrayBuffer());
        const hash = createHash("sha1").update(buf).digest("hex");
        const filename = `favicon-${hash}${ext}`;
        await mkdir(env.iconsDir, { recursive: true });
        await writeFile(join(env.iconsDir, filename), buf);
        publicPath = `/api/icons/${filename}`;
      } else {
        const body = await c.req.json().catch(() => null);
        const parsed = urlBodySchema.safeParse(body);
        if (!parsed.success) return c.json({ error: z.flattenError(parsed.error) }, 400);
        const cached = await cacheImage(parsed.data.url, env.iconsDir);
        if (!cached) {
          return c.json({ error: "failed to fetch or cache the URL" }, 400);
        }
        publicPath = cached.publicPath;
      }

      const result = await store.updateSettings({ favicon: publicPath });
      return c.json({ favicon: result.favicon });
    } catch (err) {
      return errorResponse(c, err);
    }
  });

function errorResponse(c: any, err: unknown) {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status);
  console.error("[settings] unexpected error:", err);
  return c.json({ error: "internal error" }, 500);
}
