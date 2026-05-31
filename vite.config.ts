import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { renderIndexHtml } from "./server/spa/renderHead";

function jabolHeadInject(): Plugin {
  let warnedMissingPath = false;
  return {
    name: "jabol-head-inject",
    transformIndexHtml: {
      order: "pre",
      async handler(html, ctx) {
        const configPath = process.env.JABOL_CONFIG_PATH;
        if (!configPath) {
          if (!warnedMissingPath) {
            console.warn(
              "[jabol-head-inject] JABOL_CONFIG_PATH not set — serving static fallback head. Set it to enable dev head injection.",
            );
            warnedMissingPath = true;
          }
          return html;
        }
        try {
          const raw = await readFile(configPath, "utf8");
          const canonical = JSON.parse(raw) as {
            brand?: string;
            title?: string;
            description?: string;
            favicon?: string;
            image?: string;
          };
          const port = ctx.server?.config.server.port ?? 5173;
          const origin = `http://localhost:${port}`;
          return renderIndexHtml(html, {
            brand: canonical.brand,
            title: canonical.title,
            description: canonical.description,
            favicon: canonical.favicon,
            image: canonical.image,
            siteUrl: origin + (ctx.originalUrl ?? "/"),
            bootstrap: { ...canonical, readOnly: false },
          });
        } catch (err) {
          console.warn(
            `[jabol-head-inject] failed to read/parse ${configPath}: ${(err as Error).message}`,
          );
          return html;
        }
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), jabolHeadInject()],
  publicDir: "assets",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8080",
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
