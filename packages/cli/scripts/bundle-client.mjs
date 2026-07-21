// Bundle the @jabol/client buildable source into this package (packages/cli/client)
// so the published `jabol` CLI is self-contained: it can run a real Vite build
// (needed for --base subpath support) without depending on the private
// @jabol/client package at install time. Runs at prepack.
import { cp, rm, readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url)); // packages/cli/scripts
const cliRoot = resolve(here, "..");                  // packages/cli
const repoRoot = resolve(here, "..", "..", "..");     // repo root
const clientSrc = resolve(repoRoot, "packages", "client");
const assetsSrc = resolve(repoRoot, "assets");
const dest = resolve(cliRoot, "client");              // packages/cli/client

async function main() {
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });

  // App source + entry + PWA/shadcn config.
  for (const entry of ["src", "index.html", "pwa-assets.config.ts", "components.json"]) {
    await cp(join(clientSrc, entry), join(dest, entry), { recursive: true });
  }

  // Shared static assets — the client's publicDir. In the workspace it lives at
  // repo-root ../../assets; bundled, it sits next to the config as ./assets.
  await cp(assetsSrc, join(dest, "assets"), { recursive: true });

  // Copy the Vite config, rewriting the publicDir to the bundled asset location.
  const viteConfig = await readFile(join(clientSrc, "vite.config.ts"), "utf8");
  const rewritten = viteConfig.replace('publicDir: "../../assets"', 'publicDir: "assets"');
  if (rewritten === viteConfig) {
    throw new Error("bundle-client: expected publicDir rewrite did not match — check vite.config.ts");
  }
  await writeFile(join(dest, "vite.config.ts"), rewritten, "utf8");

  console.log(`bundled @jabol/client → ${dest}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
