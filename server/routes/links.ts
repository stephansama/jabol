import { Hono } from "hono";
import { z } from "zod";
import { store, HttpError } from "../state/store.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { parseAndNormalize } from "../enrich/normalize.js";
import { inputSchema } from "../enrich/schema.js";

const linkPayloadSchema = z.object({
  name: z.string().min(1),
  url: z.url(),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  hidden: z.boolean().optional(),
  openInSameTab: z.boolean().optional(),
});

const linkPatchSchema = linkPayloadSchema.partial();

const publicLinks = new Hono().get("/", (c) => {
  return c.json({
    ...store.getPublicCanonical(),
    readOnly: store.isReadOnly(),
  });
});

const adminLinks = new Hono()
  .use("*", requireAdmin)
  .get("/", (c) =>
    c.json({
      ...store.getCanonical(),
      readOnly: store.isReadOnly(),
    }),
  )
  .post("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = z
      .object({ categoryId: z.string().min(1), link: linkPayloadSchema })
      .safeParse(body);
    if (!parsed.success) return c.json({ error: z.flattenError(parsed.error) }, 400);
    try {
      const link = await store.addLink(parsed.data.categoryId, parsed.data.link);
      return c.json({ link }, 201);
    } catch (err) {
      return errorResponse(c, err);
    }
  })
  .post("/refresh-assets", async (c) => {
    try {
      const result = await store.refreshAssets();
      return c.json(result);
    } catch (err) {
      return errorResponse(c, err);
    }
  })
  .put("/", async (c) => {
    const raw = await c.req.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return c.json({ error: `Invalid JSON: ${msg}` }, 400);
    }
    const check = inputSchema.safeParse(parsed);
    if (!check.success) {
      const first = check.error.issues[0];
      const path = first?.path.join(".") || "(root)";
      return c.json(
        {
          error: `Schema mismatch at ${path}: ${first?.message ?? "unknown"}`,
          issues: check.error.issues,
        },
        400,
      );
    }
    try {
      const canonical = parseAndNormalize(check.data);
      const result = await store.replaceAll(canonical);
      return c.json(result);
    } catch (err) {
      return errorResponse(c, err);
    }
  })
  .put("/order", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = z
      .object({ categoryId: z.string().min(1), linkIds: z.array(z.string().min(1)) })
      .safeParse(body);
    if (!parsed.success) return c.json({ error: z.flattenError(parsed.error) }, 400);
    try {
      await store.reorderLinksInCategory(parsed.data.categoryId, parsed.data.linkIds);
      return c.body(null, 204);
    } catch (err) {
      return errorResponse(c, err);
    }
  })
  .post("/:id/move", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const parsed = z
      .object({ categoryId: z.string().min(1), index: z.number().int().min(0) })
      .safeParse(body);
    if (!parsed.success) return c.json({ error: z.flattenError(parsed.error) }, 400);
    try {
      await store.moveLink(id, parsed.data.categoryId, parsed.data.index);
      return c.body(null, 204);
    } catch (err) {
      return errorResponse(c, err);
    }
  })
  .patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const parsed = linkPatchSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: z.flattenError(parsed.error) }, 400);
    try {
      const link = await store.updateLink(id, parsed.data);
      return c.json({ link });
    } catch (err) {
      return errorResponse(c, err);
    }
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    try {
      await store.deleteLink(id);
      return c.body(null, 204);
    } catch (err) {
      return errorResponse(c, err);
    }
  });

function errorResponse(c: any, err: unknown) {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status);
  console.error("[links] unexpected error:", err);
  return c.json({ error: "internal error" }, 500);
}

export { publicLinks, adminLinks };
