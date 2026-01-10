/**
 * EnvProof CLI
 * Command-line interface for environment validation
 */

import { runCheck } from "./check.js";
import { runGenerate } from "./generate.js";

const VERSION = "1.0.0";

const HELP = `
envproof - TypeScript-first environment variable validation

USAGE:
  envproof <command> [options]

COMMANDS:
  check      Validate environment variables against schema
  generate   Generate .env.example from schema
  help       Show this help message
  version    Show version number

OPTIONS:
  --schema <path>    Path to schema file (default: env.config.ts)
  --output <path>    Output path for .env.example (default: .env.example)
  --force            Overwrite existing files
  --reporter <type>  Error output format: pretty, json, minimal

EXAMPLES:
  envproof check
  envproof check --schema ./config/env.ts
  envproof generate
  envproof generate --output .env.template --force

For more information, visit: https://github.com/jayantpathariya/envproof
`;

interface ParsedArgs {
  command: string;
  schema: string | undefined;
  output: string | undefined;
  force: boolean;
  reporter: "pretty" | "json" | "minimal" | undefined;
}

/**
 * Parse command-line arguments
 */
function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    command: args[0] ?? "help",
    schema: undefined,
    output: undefined,
    force: false,
    reporter: undefined,
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case "--schema":
      case "-s":
        result.schema = next;
        i++;
        break;

      case "--output":
      case "-o":
        result.output = next;
        i++;
        break;

      case "--force":
      case "-f":
        result.force = true;
        break;

      case "--reporter":
      case "-r":
        if (next === "pretty" || next === "json" || next === "minimal") {
          result.reporter = next;
        }
        i++;
        break;

      case "--help":
      case "-h":
        result.command = "help";
        break;

      case "--version":
      case "-v":
        result.command = "version";
        break;
    }
  }

  return result;
}

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
