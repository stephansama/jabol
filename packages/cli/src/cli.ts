#!/usr/bin/env node
import { buildStatic } from "./build.js";

const HELP = `jabol — generate a static site from a links.json

Usage:
  jabol build [options]

Options:
  -c, --config <path>    Path to links.json        (default: ./links.json)
  -o, --out <dir>        Output directory          (default: ./site)
  -b, --base <path>      Public base path          (default: /)
                         Use e.g. /repo/ for user.github.io/repo/ hosting.
      --site-url <url>   Absolute site URL for og:url
      --no-enrich        Skip fetching favicons/OG images at build time
  -h, --help             Show this help

Examples:
  jabol build --config links.json --out ./site
  jabol build -c links.json -o dist --base /links/ --no-enrich
`;

type Args = {
  config: string;
  out: string;
  base: string;
  siteUrl?: string;
  enrich: boolean;
};

function parse(argv: string[]): Args {
  const args: Args = { config: "./links.json", out: "./site", base: "/", enrich: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      const v = argv[++i];
      if (v === undefined) {
        console.error(`error: ${a} requires a value`);
        process.exit(1);
      }
      return v;
    };
    switch (a) {
      case "-c":
      case "--config":
        args.config = next();
        break;
      case "-o":
      case "--out":
        args.out = next();
        break;
      case "-b":
      case "--base":
        args.base = next();
        break;
      case "--site-url":
        args.siteUrl = next();
        break;
      case "--no-enrich":
        args.enrich = false;
        break;
      default:
        console.error(`error: unknown option ${a}`);
        process.exit(1);
    }
  }
  return args;
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);

  if (!cmd || cmd === "-h" || cmd === "--help" || cmd === "help") {
    console.log(HELP);
    return;
  }
  if (cmd !== "build") {
    console.error(`error: unknown command "${cmd}"\n`);
    console.log(HELP);
    process.exit(1);
  }

  const args = parse(rest);
  const start = Date.now();
  const result = await buildStatic({
    configPath: args.config,
    outDir: args.out,
    base: args.base,
    siteUrl: args.siteUrl,
    enrich: args.enrich,
  });
  const secs = ((Date.now() - start) / 1000).toFixed(1);
  console.log(
    `\n✓ jabol: generated ${result.links} links across ${result.categories} categories\n` +
      `  → ${result.outDir}  (base ${result.base}, enrich ${result.enriched ? "on" : "off"}, ${secs}s)`,
  );
}

main().catch((err) => {
  console.error("\njabol build failed:\n", err);
  process.exit(1);
});
