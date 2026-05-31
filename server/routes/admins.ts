import { Hono } from "hono";
import { z } from "zod";
import { auth, deleteUserById, listAdminUsers, countUsers } from "../auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const createAdminSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const adminRoutes = new Hono()
  .use("*", requireAdmin)
  .get("/", (c) => c.json({ admins: listAdminUsers() }))
  .post("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = createAdminSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: z.flattenError(parsed.error) }, 400);
    try {
      await auth.api.signUpEmail({
        body: {
          email: parsed.data.email,
          password: parsed.data.password,
          name: parsed.data.name ?? "Admin",
        },
      });
      return c.json({ admins: listAdminUsers() }, 201);
    } catch (err: any) {
      console.error("[admins] create failed:", err);
      const message = err?.message ?? "failed to create admin";
      return c.json({ error: message }, 400);
    }
  })
  .delete("/:id", async (c) => {
    const session = (c as any).get("session") as { user: { id: string } } | undefined;
    const id = c.req.param("id");
    if (session?.user.id === id && countUsers() <= 1) {
      return c.json({ error: "cannot remove the only admin" }, 400);
    }
    const ok = deleteUserById(id);
    if (!ok) return c.json({ error: "not found" }, 404);
    return c.body(null, 204);
  });
