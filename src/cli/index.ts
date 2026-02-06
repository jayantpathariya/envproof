/**
 * EnvProof CLI
 * Command-line interface for environment validation
 */

import { runCheck } from "./check.js";
import { runGenerate } from "./generate.js";
import { runInit } from "./init.js";
import { parseArgs } from "./args.js";
import { getCliVersion } from "./version.js";

const VERSION = getCliVersion();

const HELP = `
envproof - TypeScript-first environment variable validation

USAGE:
  envproof <command> [options]

COMMANDS:
  check      Validate environment variables against schema
  generate   Generate .env.example from schema
  init       Scaffold env.config.ts and .env.example
  help       Show this help message
  version    Show version number

OPTIONS:
  --schema <path>    Path to schema file (default: env.config.ts)
  --output <path>    Output path for .env.example (default: .env.example)
  --force            Overwrite existing files
  --strict           Fail on unknown variables (for check command)
  --reporter <type>  Error output format: pretty, json, minimal

EXAMPLES:
  envproof check
  envproof check --schema ./config/env.ts
  envproof check --strict
  envproof generate
  envproof generate --output .env.template --force
  envproof init
  envproof init --schema ./config/env.ts --output .env.example

For more information, visit: https://github.com/jayantpathariya/envproof
`;

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  let exitCode = 0;

  switch (parsed.command) {
    case "check":
      exitCode = await runCheck({
        ...(parsed.schema !== undefined && { schema: parsed.schema }),
        ...(parsed.reporter !== undefined && { reporter: parsed.reporter }),
        strict: parsed.strict,
      });
      break;

    case "generate":
    case "gen":
      exitCode = await runGenerate({
        ...(parsed.schema !== undefined && { schema: parsed.schema }),
        ...(parsed.output !== undefined && { output: parsed.output }),
        force: parsed.force,
      });
      break;

    case "init":
      exitCode = runInit({
        ...(parsed.schema !== undefined && { schema: parsed.schema }),
        ...(parsed.output !== undefined && { output: parsed.output }),
        force: parsed.force,
      });
      break;

    case "version":
    case "-v":
    case "--version":
      console.log(`envproof v${VERSION}`);
      break;

    case "help":
    case "-h":
    case "--help":
    default:
      console.log(HELP);
      break;
  }

  process.exit(exitCode);
}

// Run CLI
main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
