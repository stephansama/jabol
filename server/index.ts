import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { mkdirSync } from "node:fs";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { env } from "./config.js";
import { auth } from "./auth.js";
import { store } from "./state/store.js";
import { startWatcher } from "./state/watcher.js";
import { linksEventStream } from "./state/sse.js";
import { ensureAuthSchema, getBootstrapState, maybeSeedAdmin } from "./bootstrap.js";
import { publicLinks, adminLinks } from "./routes/links.js";
import { categoryRoutes } from "./routes/categories.js";
import { adminRoutes } from "./routes/admins.js";
import { signupRoutes } from "./routes/signup.js";
import { iconRoutes } from "./routes/icons.js";
import { settingsRoutes } from "./routes/settings.js";
import { getSession } from "./middleware/requireAdmin.js";
import { authRateLimit } from "./middleware/rateLimit.js";
import { renderIndexHtml } from "./spa/renderHead.js";

mkdirSync(env.iconsDir, { recursive: true });
mkdirSync(env.dataDir, { recursive: true });

await ensureAuthSchema();
await maybeSeedAdmin();
await store.init();
startWatcher();

const app = new Hono();

app.use("*", async (c, next) => {
  await next();
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("X-Content-Type-Options", "nosniff");
});

app.use("/api/auth/*", authRateLimit);
app.all("/api/auth/*", (c) => auth.handler(c.req.raw));

app.get("/api/session", async (c) => {
  const session = await getSession(c);
  return c.json({ session });
});

app.get("/api/info", (c) => {
  const bootstrap = getBootstrapState();
  return c.json({
    readOnly: store.isReadOnly(),
    signupOpen: bootstrap.signupOpen,
    hasAdmin: bootstrap.hasAdmin,
  });
});

app.get("/api/events", linksEventStream);

app.route("/api/links", publicLinks);
app.route("/api/links/admin", adminLinks);
app.route("/api/categories", categoryRoutes);
app.route("/api/admins", adminRoutes);
app.route("/api/signup", signupRoutes);
app.route("/api/icons", iconRoutes);
app.route("/api/settings", settingsRoutes);

// SPA fallback — only mounted when dist exists (production builds).
if (existsSync(env.spaDist)) {
  const indexPath = join(env.spaDist, "index.html");
  let indexTemplate: string | null = null;
  try {
    indexTemplate = readFileSync(indexPath, "utf8");
  } catch {
    indexTemplate = null;
  }

  const MAX_CACHE = 100;
  const cachedHtml = new Map<string, string>();
  store.subscribe(() => cachedHtml.clear());

  const spaHandler = (c: import("hono").Context) => {
    if (!indexTemplate) return c.text("SPA dist missing", 500);
    const reqUrl = new URL(c.req.url);
    const siteUrl = `${reqUrl.origin}${reqUrl.pathname}`;
    const cached = cachedHtml.get(siteUrl);
    if (cached) return c.html(cached);

    const canonical = store.getPublicCanonical();
    const html = renderIndexHtml(indexTemplate, {
      brand: canonical.brand,
      title: canonical.title,
      description: canonical.description,
      favicon: canonical.favicon,
      image: canonical.image,
      siteUrl,
      bootstrap: { ...canonical, readOnly: store.isReadOnly() },
    });
    if (cachedHtml.size >= MAX_CACHE) cachedHtml.clear();
    cachedHtml.set(siteUrl, html);
    return c.html(html);
  };

  // Intercept the document routes BEFORE static so we render head tags.
  app.get("/", spaHandler);
  app.get("/index.html", spaHandler);
  app.use("/*", serveStatic({ root: env.spaDist }));
  app.get("*", spaHandler);
} else {
  console.warn(`[server] SPA dist not found at ${env.spaDist} — API-only mode (use 'vite' dev server for UI)`);
}

const port = env.port;
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`[server] jabol listening on http://localhost:${info.port}`);
  if (store.isReadOnly()) console.warn(`[server] links.json is read-only — admin mutations disabled`);
  const bs = getBootstrapState();
  if (bs.signupOpen) console.log(`[server] no admin exists — POST /api/signup to create one`);
});
