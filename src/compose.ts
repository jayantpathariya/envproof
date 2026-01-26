/**
 * EnvProof - Schema Composition
 * Utilities for composing and extending schemas
 */

import type { EnvSchema } from "./types.js";

/**
 * Merge multiple schemas into a single schema
 * Later schemas override earlier ones if there are duplicate keys
 *
 * @param schemas - Schemas to merge
 * @returns Merged schema
 *
 * @example
 * ```typescript
 * const baseSchema = {
 *   NODE_ENV: e.enum(['dev', 'prod'] as const),
 *   LOG_LEVEL: e.enum(['debug', 'info'] as const),
 * };
 *
 * const serverSchema = {
 *   PORT: e.number().port(),
 *   HOST: e.string().default('localhost'),
 * };
 *
 * const fullSchema = mergeSchemas(baseSchema, serverSchema);
 * // Contains all fields from both schemas
 * ```
 */
export function mergeSchemas<T extends EnvSchema[]>(
  ...schemas: T
): EnvSchema {
  return Object.assign({}, ...schemas);
}

/**
 * Extend a base schema with additional fields
 * Alias for mergeSchemas for better readability
 *
 * @param baseSchema - Base schema to extend
 * @param extensions - Additional schema fields
 * @returns Extended schema
 *
 * @example
 * ```typescript
 * const base = {
 *   NODE_ENV: e.enum(['dev', 'prod'] as const),
 * };
 *
 * const extended = extendSchema(base, {
 *   PORT: e.number().default(3000),
 *   DEBUG: e.boolean().optional(),
 * });
 * ```
 */
export function extendSchema<
  TBase extends EnvSchema,
  TExtension extends EnvSchema,
>(baseSchema: TBase, extensions: TExtension): TBase & TExtension {
  return { ...baseSchema, ...extensions };
}

/**
 * Pick specific fields from a schema
 *
 * @param schema - Source schema
 * @param keys - Keys to pick
 * @returns New schema with only the specified keys
 *
 * @example
 * ```typescript
 * const fullSchema = {
 *   DATABASE_URL: e.url(),
 *   REDIS_URL: e.url(),
 *   PORT: e.number(),
 * };
 *
 * const dbOnlySchema = pickSchema(fullSchema, ['DATABASE_URL', 'REDIS_URL']);
 * ```
 */
export function pickSchema<T extends EnvSchema, K extends keyof T>(
  schema: T,
  keys: K[]
): Pick<T, K> {
  const result: Partial<T> = {};
  for (const key of keys) {
    if (key in schema) {
      result[key] = schema[key];
    }
  }
  return result as Pick<T, K>;
}

/**
 * Omit specific fields from a schema
 *
 * @param schema - Source schema
 * @param keys - Keys to omit
 * @returns New schema without the specified keys
 *
 * @example
 * ```typescript
 * const fullSchema = {
 *   DATABASE_URL: e.url(),
 *   REDIS_URL: e.url(),
 *   PORT: e.number(),
 * };
 *
 * const withoutPort = omitSchema(fullSchema, ['PORT']);
 * ```
 */
export function omitSchema<T extends EnvSchema, K extends keyof T>(
  schema: T,
  keys: K[]
): Omit<T, K> {
  const result: Partial<T> = { ...schema };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

/**
 * Create a schema with a prefix applied to all keys
 *
 * @param schema - Source schema
 * @param prefix - Prefix to add to all keys
 * @returns New schema with prefixed keys
 *
 * @example
 * ```typescript
 * const schema = {
 *   PORT: e.number(),
 *   HOST: e.string(),
 * };
 *
 * const prefixedSchema = prefixSchema(schema, 'APP_');
 * // Result: { APP_PORT: e.number(), APP_HOST: e.string() }
 * ```
 */
export function prefixSchema<T extends EnvSchema>(
  schema: T,
  prefix: string
): EnvSchema {
  const result: EnvSchema = {};
  for (const [key, value] of Object.entries(schema)) {
    result[`${prefix}${key}`] = value;
  }
  return result;
}
