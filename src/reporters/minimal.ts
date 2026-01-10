/**
 * EnvKit - Minimal Reporter
 * Single-line compact error output
 */

import type { ValidationError } from "../types.js";

/**
 * Format validation errors as a minimal single line
 */
export function formatMinimal(errors: ValidationError[]): string {
  const varNames = errors.map((e) => e.variable).join(", ");
  return `EnvKit: ${errors.length} invalid environment variable${
    errors.length === 1 ? "" : "s"
  }: ${varNames}`;
}
