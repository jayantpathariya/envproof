/**
 * EnvProof CLI - Argument Parser
 */

import type { ReporterType } from "../types.js";

export interface ParsedArgs {
  command: string;
  schema: string | undefined;
  output: string | undefined;
  force: boolean;
  strict: boolean;
  reporter: ReporterType | undefined;
}

/**
 * Parse command-line arguments.
 */
export function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {
    command: args[0] ?? "help",
    schema: undefined,
    output: undefined,
    force: false,
    strict: false,
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

      case "--strict":
        result.strict = true;
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
