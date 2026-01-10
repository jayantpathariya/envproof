/**
 * EnvKit - JSON Reporter
 * Machine-readable JSON error output for CI/CD
 */

import type { ValidationError } from "../types.js";

/**
 * JSON output structure
 */
interface JsonOutput {
  success: false;
  errorCount: number;
  errors: JsonError[];
}

interface JsonError {
  variable: string;
  reason: string;
  message: string;
  expected: string;
  received?: string;
  isSecret: boolean;
}

/**
 * Format validation errors as JSON
 */
export function formatJson(errors: ValidationError[]): string {
  const output: JsonOutput = {
    success: false,
    errorCount: errors.length,
    errors: errors.map((error) => ({
      variable: error.variable,
      reason: error.reason,
      message: error.message,
      expected: error.expected,
      ...(error.received !== undefined ? { received: error.received } : {}),
      isSecret: error.isSecret,
    })),
  };

  return JSON.stringify(output, null, 2);
}
