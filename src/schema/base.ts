/**
 * EnvProof - Base Schema
 * Abstract base class for all schema types
 */

import type {
  SchemaDefinition,
  ValidationRule,
  CoercionResult,
  SchemaType,
} from "../types.js";

/**
 * Base schema class that all schema types extend
 * Implements common functionality like optional, default, secret, description
 */
export abstract class BaseSchema<T, Optional extends boolean = false> {
  /** Type brand for inference */
  declare readonly _output: T;
  declare readonly _optional: Optional;

  /** Internal schema definition */
  readonly _def: SchemaDefinition<T>;

  constructor(
    type: SchemaType,
    coerce: (value: string) => CoercionResult<T>,
    rules: ValidationRule<T>[] = []
  ) {
    this._def = {
      type,
      isOptional: false as Optional,
      metadata: { isSecret: false },
      rules,
      coerce,
    };
  }

  /**
   * Clone the schema with updated definition
   */
  protected clone(updates: Partial<SchemaDefinition<T>>): this {
    const cloned = Object.create(Object.getPrototypeOf(this));
    cloned._def = { ...this._def, ...updates };
    return cloned;
  }

  /**
   * Mark this variable as optional
   * Optional variables can be undefined if not set
   */
  optional(): BaseSchema<T, true> {
    return this.clone({ isOptional: true }) as unknown as BaseSchema<T, true>;
  }

  /**
   * Set a default value
   * Variables with defaults are never undefined
   */
  default(value: T): BaseSchema<T, false> {
    return this.clone({
      isOptional: false,
      defaultValue: value,
    }) as unknown as BaseSchema<T, false>;
  }

  /**
   * Mark this variable as a secret
   * Secret values are masked in error output
   */
  secret(): this {
    return this.clone({
      metadata: { ...this._def.metadata, isSecret: true },
    });
  }

  /**
   * Add a description for documentation
   * Used in .env.example generation and error messages
   */
  description(text: string): this {
    return this.clone({
      metadata: { ...this._def.metadata, description: text },
    });
  }

  /**
   * Add an example value
   * Used in .env.example generation
   */
  example(value: string): this {
    return this.clone({
      metadata: { ...this._def.metadata, example: value },
    });
  }

  /**
   * Add a custom validation rule
   */
  refine(
    validate: (value: T) => boolean,
    message: string,
    name: string = "custom"
  ): this {
    return this.clone({
      rules: [...this._def.rules, { name, message, validate }],
    });
  }

  /**
   * Get a human-readable type description
   */
  abstract getTypeDescription(): string;

  /**
   * Get an example value for documentation
   */
  getExample(): string {
    return this._def.metadata.example ?? this.getDefaultExample();
  }

  /**
   * Get the default example value for this type
   */
  protected abstract getDefaultExample(): string;
}
