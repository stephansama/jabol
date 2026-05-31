import { Hono } from "hono";
import { z } from "zod";
import { store, HttpError } from "../state/store.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const categoryPayloadSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
});

export const categoryRoutes = new Hono()
  .use("*", requireAdmin)
  .post("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = categoryPayloadSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: z.flattenError(parsed.error) }, 400);
    try {
      const category = await store.addCategory(parsed.data);
      return c.json({ category }, 201);
    } catch (err) {
      return errorResponse(c, err);
    }
  })
  .patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => null);
    const parsed = categoryPayloadSchema.partial().safeParse(body);
    if (!parsed.success) return c.json({ error: z.flattenError(parsed.error) }, 400);
    try {
      const category = await store.updateCategory(id, parsed.data);
      return c.json({ category });
    } catch (err) {
      return errorResponse(c, err);
    }
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    try {
      await store.deleteCategory(id);
      return c.body(null, 204);
    } catch (err) {
      return errorResponse(c, err);
    }
  });

function errorResponse(c: any, err: unknown) {
  if (err instanceof HttpError) return c.json({ error: err.message }, err.status);
  console.error("[categories] unexpected error:", err);
  return c.json({ error: "internal error" }, 500);
}
