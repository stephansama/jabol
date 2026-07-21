import { Hono } from "hono";
import { z } from "zod";
import { consumeFirstSignup, getBootstrapState } from "../bootstrap.js";

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const signupRoutes = new Hono().post("/", async (c) => {
  if (!getBootstrapState().signupOpen) {
    return c.json({ error: "signup is closed" }, 404);
  }
  const body = await c.req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: z.flattenError(parsed.error) }, 400);
  try {
    await consumeFirstSignup(parsed.data.email, parsed.data.password, parsed.data.name);
    return c.json({ ok: true }, 201);
  } catch (err: any) {
    console.error("[signup] failed:", err);
    return c.json({ error: err?.message ?? "signup failed" }, 400);
  }
});
