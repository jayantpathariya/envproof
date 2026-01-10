/**
 * EnvProof - createEnv
 * Main entry point for environment validation
 */

import type { EnvSchema, InferEnv, EnvOptions } from "./types.js";
import { validate, handleValidationFailure } from "./validation/engine.js";

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
  const source = options.source ?? process.env;
  const result = validate(schema, source, options);

  if (!result.success) {
    handleValidationFailure(result.errors, options);
  }

  // Freeze the object to prevent modifications
  return Object.freeze(result.data!) as InferEnv<T>;
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
  const source = options.source ?? process.env;
  return validate(schema, source, options);
}
