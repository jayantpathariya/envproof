/**
 * EnvProof - createEnv
 * Main entry point for environment validation
 */

import type { EnvSchema, InferEnv, EnvOptions, AnySchema } from "./types.js";
import { validate, handleValidationFailure } from "./validation/engine.js";
import { loadDotenv } from "./dotenv.js";

/**
 * Create and validate a typed environment object
 *
 * @example
 * ```typescript
 * import { createEnv, e } from 'envproof';
 *
 * const env = createEnv({
 *   DATABASE_URL: e.url(),
 *   PORT: e.number().default(3000),
 *   NODE_ENV: e.enum(['development', 'production']),
 * });
 *
 * // env is fully typed!
 * console.log(env.PORT); // number
 * ```
 */
export function createEnv<T extends EnvSchema>(
  schema: T,
  options: EnvOptions = {}
): InferEnv<T> {
  // Load environment variables from .env file if requested
  let source = options.source ?? process.env;

  if (options.dotenv) {
    const dotenvVars = loadDotenv(options.dotenvPath ?? ".env");
    // Merge: process.env takes precedence over .env file
    // Use Object.assign for better performance with large objects
    source = Object.assign({}, dotenvVars, source);
  }

  // Apply environment-specific schema modifications
  const modifiedSchema = applyEnvironmentRules(schema, options);

  const result = validate(modifiedSchema, source, options);

  if (!result.success) {
    handleValidationFailure(result.errors, options);
  }

  // Type narrowing: if we reach here, result.success is true and data exists
  if (!result.data) {
    throw new Error("Validation succeeded but no data returned");
  }

  // Freeze the object to prevent modifications
  return Object.freeze(result.data) as InferEnv<T>;
}

/**
 * Clone a schema with modified optional flag
 */
function cloneSchemaWithOptional(
  schema: AnySchema,
  isOptional: boolean
): AnySchema {
  const cloned = Object.create(Object.getPrototypeOf(schema));
  Object.assign(cloned, schema);
  cloned._def = { ...schema._def, isOptional };
  return cloned;
}

/**
 * Apply environment-specific rules to schema
 */
function applyEnvironmentRules<T extends EnvSchema>(
  schema: T,
  options: EnvOptions
): T {
  const { environment, requireInProduction, optionalInDevelopment } = options;

  if (!environment) return schema;

  const isProduction = environment === "production";
  const isDevelopment = environment === "development" || environment === "dev";

  // Check if we need to modify anything
  const needsModification =
    (isProduction && requireInProduction?.length) ||
    (isDevelopment && optionalInDevelopment?.length);

  if (!needsModification) return schema;

  // Clone the schema
  const modifiedSchema: Record<string, AnySchema> = { ...schema };

  // Make specified variables required in production
  if (isProduction && requireInProduction) {
    for (const key of requireInProduction) {
      const fieldSchema = modifiedSchema[key];
      if (fieldSchema && fieldSchema._def.isOptional) {
        modifiedSchema[key] = cloneSchemaWithOptional(fieldSchema, false);
      }
    }
  }

  // Make specified variables optional in development
  if (isDevelopment && optionalInDevelopment) {
    for (const key of optionalInDevelopment) {
      const fieldSchema = modifiedSchema[key];
      if (fieldSchema) {
        modifiedSchema[key] = cloneSchemaWithOptional(fieldSchema, true);
      }
    }
  }

  return modifiedSchema as T;
}

/**
 * Validate environment without throwing
 * Returns a result object with success/data/errors
 *
 * @example
 * ```typescript
 * const result = validateEnv(schema);
 * if (result.success) {
 *   console.log(result.data.PORT);
 * } else {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateEnv<T extends EnvSchema>(
  schema: T,
  options: Omit<EnvOptions, "onError"> = {}
) {
  // Load environment variables from .env file if requested
  let source = options.source ?? process.env;

  if (options.dotenv) {
    const dotenvVars = loadDotenv(options.dotenvPath ?? ".env");
    // Use Object.assign for better performance with large objects
    source = Object.assign({}, dotenvVars, source);
  }

  // Apply environment-specific schema modifications
  const modifiedSchema = applyEnvironmentRules(schema, options);

  return validate(modifiedSchema, source, options);
}
