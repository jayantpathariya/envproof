/**
 * EnvProof CLI - Init Command
 * Scaffold env.config.ts and .env.example
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as e from "../schema/index.js";
import { writeExampleFile } from "../generator/index.js";

interface InitOptions {
  schema?: string;
  output?: string;
  force?: boolean;
}

const DEFAULT_SCHEMA_PATH = "env.config.ts";
const DEFAULT_EXAMPLE_PATH = ".env.example";

const SCHEMA_TEMPLATE = `import { e } from "envproof";

export const schema = {
  NODE_ENV: e
    .enum(["development", "staging", "production"] as const)
    .default("development")
    .description("Node environment"),
  PORT: e.number().port().default(3000).description("HTTP port"),
  DATABASE_URL: e.url().description("Primary database URL"),
  API_KEY: e.string().secret().optional().description("External API key"),
};
`;

function createTemplateSchema() {
  return {
    NODE_ENV: e
      .enum(["development", "staging", "production"] as const)
      .default("development")
      .description("Node environment"),
    PORT: e.number().port().default(3000).description("HTTP port"),
    DATABASE_URL: e.url().description("Primary database URL"),
    API_KEY: e.string().secret().optional().description("External API key"),
  };
}

/**
 * Run the init command.
 */
export function runInit(options: InitOptions = {}): number {
  const schemaPath = path.resolve(process.cwd(), options.schema ?? DEFAULT_SCHEMA_PATH);
  const examplePath = options.output ?? DEFAULT_EXAMPLE_PATH;
  const force = options.force ?? false;

  if (fs.existsSync(schemaPath) && !force) {
    console.error(
      `❌ File already exists: ${path.relative(process.cwd(), schemaPath)}. Use --force to overwrite.`
    );
    return 1;
  }

  if (fs.existsSync(path.resolve(process.cwd(), examplePath)) && !force) {
    console.error(`❌ File already exists: ${examplePath}. Use --force to overwrite.`);
    return 1;
  }

  try {
    fs.mkdirSync(path.dirname(schemaPath), { recursive: true });
    fs.writeFileSync(schemaPath, SCHEMA_TEMPLATE, "utf-8");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Failed to write schema file: ${message}`);
    return 1;
  }

  const writeResult = writeExampleFile(createTemplateSchema(), {
    output: examplePath,
    force: true,
  });

  if (!writeResult.success) {
    console.error(`❌ ${writeResult.message}`);
    return 1;
  }

  console.log(
    `✅ Created ${path.relative(process.cwd(), schemaPath)} and ${examplePath}`
  );
  console.log("   Next step: run `npx envproof check` after setting your env vars.");
  return 0;
}
