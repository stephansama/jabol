import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { inputSchema } from "../server/enrich/schema.js";

const SCHEMA_ID =
  "https://raw.githubusercontent.com/stephansama/jabol/refs/heads/main/schema/links.schema.json";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(repoRoot, "schema/links.schema.json");

function build(): string {
  const generated = z.toJSONSchema(inputSchema, {
    target: "draft-7",
    io: "input",
    unrepresentable: "any",
  }) as Record<string, unknown>;

  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: SCHEMA_ID,
    title: "Jabol links.json",
    description:
      "Configuration file consumed by jabol — Just A Bunch Of Links. Accepts either a categorized shape (with categories[]) or a flat shape (with links[]).",
    ...generated,
  };

  return JSON.stringify(schema, null, 2) + "\n";
}

async function main() {
  const check = process.argv.includes("--check");
  const next = build();

  if (check) {
    let current: string;
    try {
      current = await readFile(outputPath, "utf8");
    } catch {
      console.error(
        `schema:check failed — ${outputPath} does not exist. Run \`pnpm schema:generate\` and commit the result.`,
      );
      process.exit(1);
    }
    if (current !== next) {
      console.error(
        `schema:check failed — ${outputPath} is out of date.\nRun \`pnpm schema:generate\` and commit the result.`,
      );
      process.exit(1);
    }
    console.log("schema:check ok — generated schema matches committed file.");
    return;
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, next);
  console.log(`Wrote ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
