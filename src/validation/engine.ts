/**
 * EnvProof - Validation Engine
 * Core validation logic for environment variables
 */

import type {
  EnvSchema,
  InferEnv,
  ValidationError,
  ValidationResult,
  EnvOptions,
  AnySchema,
} from "../types.js";
import {
  createMissingError,
  createEmptyError,
  createTypeError,
  createValueError,
  EnvValidationError,
} from "./errors.js";
import { formatPretty } from "../reporters/pretty.js";
import { formatJson } from "../reporters/json.js";
import { formatMinimal } from "../reporters/minimal.js";

/**
 * Validate a single environment variable against its schema
 */
function validateVariable(
  name: string,
  value: string | undefined,
  schema: AnySchema
): { value?: unknown; error?: ValidationError } {
  const def = schema._def;

  // Check if value is missing or empty
  if (value === undefined || value === "") {
    // If optional, return undefined
    if (def.isOptional) {
      return { value: undefined };
    }

    // If has default, use it
    if (def.defaultValue !== undefined) {
      return { value: def.defaultValue };
    }

    // Otherwise, error
    if (value === undefined) {
      return { error: createMissingError(name, schema) };
    } else {
      return { error: createEmptyError(name, schema) };
    }
  }

  // Coerce the string value to the expected type
  const coercionResult = def.coerce(value);

  if (!coercionResult.success) {
    return {
      error: createTypeError(name, schema, value, coercionResult.error),
    };
  }

  // Run validation rules
  for (const rule of def.rules) {
    if (!rule.validate(coercionResult.value)) {
      return { error: createValueError(name, schema, value, rule.message) };
    }
  }

  return { value: coercionResult.value };
}

/**
 * Validate all environment variables against the schema
 * Returns a typed result with data or errors
 */
export function validate<T extends EnvSchema>(
  schema: T,
  source: Record<string, string | undefined> = process.env,
  options: EnvOptions = {}
): ValidationResult<InferEnv<T>> {
  const errors: ValidationError[] = [];
  const data: Record<string, unknown> = {};

  const { prefix, stripPrefix } = options;

  for (const [key, fieldSchema] of Object.entries(schema)) {
    // Determine the actual env var name
    const envKey = prefix ? `${prefix}${key}` : key;
    const value = source[envKey];

    // Validate the variable
    const result = validateVariable(envKey, value, fieldSchema as AnySchema);

    if (result.error) {
      // Store with original key name for error reporting
      result.error.variable = stripPrefix ? key : envKey;
      errors.push(result.error);
    } else {
      // Store with potentially stripped key
      const outputKey = stripPrefix && prefix ? key : key;
      data[outputKey] = result.value;
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: data as InferEnv<T>, errors: [] };
}

/**
 * Format validation errors using the specified reporter
 */
export function formatErrors(
  errors: ValidationError[],
  reporter: EnvOptions["reporter"] = "pretty"
): string {
  if (typeof reporter === "function") {
    return reporter(errors);
  }

  switch (reporter) {
    case "json":
      return formatJson(errors);
    case "minimal":
      return formatMinimal(errors);
    case "pretty":
    default:
      return formatPretty(errors);
  }
}

/**
 * Handle validation failure based on options
 */
export function handleValidationFailure(
  errors: ValidationError[],
  options: EnvOptions
): never {
  const formattedMessage = formatErrors(errors, options.reporter);

  switch (options.onError) {
    case "exit":
      console.error(formattedMessage);
      process.exit(options.exitCode ?? 1);
      // TypeScript doesn't know process.exit never returns
      throw new Error("Unreachable");

    case "return":
      throw new EnvValidationError(errors, formattedMessage);

    case "throw":
    default:
      throw new EnvValidationError(errors, formattedMessage);
  }
}
