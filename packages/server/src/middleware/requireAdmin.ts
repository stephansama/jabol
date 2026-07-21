import type { Context, Next } from "hono";
import { auth } from "../auth.js";

export type SessionLike = {
  user: { id: string; email: string; name?: string | null };
};

export async function getSession(c: Context): Promise<SessionLike | null> {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) return null;
    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(c: Context, next: Next) {
  const session = await getSession(c);
  if (!session) {
    return c.json({ error: "unauthorized" }, 401);
  }
  c.set("session", session);
  await next();
}
