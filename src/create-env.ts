/**
 * EnvProof - createEnv
 * Main entry point for environment validation
 */

import type {
  EnvSchema,
  InferEnv,
  EnvOptions,
  AnySchema,
  ValidationResult,
  CrossFieldValidationResult,
  CrossFieldValidationIssue,
} from "./types.js";
import { validate, handleValidationFailure } from "./validation/engine.js";
import { createCrossFieldError } from "./validation/errors.js";
import { loadDotenvFiles, expandDotenvVars } from "./dotenv.js";

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
  options?: Omit<EnvOptions, "onError"> & { onError?: "throw" | "exit" }
): InferEnv<T>;
export function createEnv<T extends EnvSchema>(
  schema: T,
  options: Omit<EnvOptions, "onError"> & { onError: "return" }
): ValidationResult<InferEnv<T>>;
export function createEnv<T extends EnvSchema>(
  schema: T,
  options: EnvOptions = {}
): InferEnv<T> | ValidationResult<InferEnv<T>> {
  const source = resolveSource(options);

  // Apply environment-specific schema modifications
  const modifiedSchema = applyEnvironmentRules(schema, options);

  const baseResult = validate(modifiedSchema, source, options);
  const result = applyCrossFieldValidation(baseResult, options.crossValidate);

  if (!result.success) {
    if (options.onError === "return") {
      return result;
    }
    handleValidationFailure(result.errors, options);
  }

  // Type narrowing: if we reach here, result.success is true and data exists
  if (!result.data) {
    throw new Error("Validation succeeded but no data returned");
  }

  const frozenData = Object.freeze(result.data) as InferEnv<T>;

  if (options.onError === "return") {
    return { success: true, data: frozenData, errors: [] };
  }

  return frozenData;
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
 * Resolve the environment source, optionally layering and expanding dotenv files.
 */
function resolveSource(options: EnvOptions): Record<string, string | undefined> {
  const source = options.source ?? process.env;

  if (!options.dotenv) {
    return source;
  }

  const dotenvPaths = resolveDotenvPaths(options);
  let dotenvVars = loadDotenvFiles(...dotenvPaths);

  if (options.dotenvExpand) {
    dotenvVars = expandDotenvVars(dotenvVars, source);
  }

  // Merge: source vars take precedence over dotenv file vars
  return Object.assign({}, dotenvVars, source);
}

/**
 * Resolve dotenv file paths for layered loading.
 */
function resolveDotenvPaths(options: EnvOptions): string[] {
  if (Array.isArray(options.dotenvPath)) {
    return options.dotenvPath;
  }

  if (typeof options.dotenvPath === "string") {
    return [options.dotenvPath];
  }

  if (!options.environment) {
    return [".env"];
  }

  return [
    ".env",
    `.env.${options.environment}`,
    ".env.local",
    `.env.${options.environment}.local`,
  ];
}

/**
 * Apply cross-field validation for constraints involving multiple variables.
 */
function applyCrossFieldValidation<T>(
  result: ValidationResult<T>,
  validator?: (env: Readonly<Record<string, unknown>>) => CrossFieldValidationResult
): ValidationResult<T> {
  if (!result.success || !result.data || !validator) {
    return result;
  }

  const validationResult = validator(result.data as Record<string, unknown>);
  if (validationResult === undefined) {
    return result;
  }

  const rawIssues = Array.isArray(validationResult)
    ? validationResult
    : [validationResult];
  const errors = rawIssues.map((issue) => normalizeCrossFieldIssue(issue));

  if (errors.length === 0) {
    return result;
  }

  return { success: false, errors };
}

/**
 * Normalize cross-field validator issue into a standard validation error.
 */
function normalizeCrossFieldIssue(
  issue: string | CrossFieldValidationIssue
) {
  if (typeof issue === "string") {
    return createCrossFieldError(issue);
  }

  return createCrossFieldError(issue.message, issue.variable ?? "_schema");
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
  const source = resolveSource(options);

  // Apply environment-specific schema modifications
  const modifiedSchema = applyEnvironmentRules(schema, options);

  const baseResult = validate(modifiedSchema, source, options);
  return applyCrossFieldValidation(baseResult, options.crossValidate);
}
