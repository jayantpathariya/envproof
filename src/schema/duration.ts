/**
 * EnvProof - Duration Schema
 * Schema for duration environment variables (e.g., "1h", "30m", "5s")
 */

import { BaseSchema } from "./base.js";
import type { CoercionResult } from "../types.js";

/** Duration unit multipliers (to milliseconds) */
const DURATION_UNITS: Record<string, number> = {
  ms: 1,
  s: 1000,
  sec: 1000,
  second: 1000,
  seconds: 1000,
  m: 60 * 1000,
  min: 60 * 1000,
  minute: 60 * 1000,
  minutes: 60 * 1000,
  h: 60 * 60 * 1000,
  hr: 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  hours: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Parse a duration string to milliseconds
 */
function parseDuration(value: string): number | null {
  const trimmed = value.trim().toLowerCase();

  // Try to parse as pure number (assume milliseconds)
  const pureNumber = parseFloat(trimmed);
  if (!isNaN(pureNumber) && String(pureNumber) === trimmed) {
    return pureNumber;
  }

  // Parse with unit (e.g., "1h", "30m", "5s", "100ms")
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/);
  if (!match) return null;

  const numStr = match[1];
  const unit = match[2];
  if (!numStr || !unit) return null;

  const num = parseFloat(numStr);
  const multiplier = DURATION_UNITS[unit];

  if (isNaN(num) || multiplier === undefined) return null;

  return num * multiplier;
}

/**
 * Schema for duration environment variables
 * Parses duration strings like "1h", "30m", "5s" to milliseconds
 *
 * @example
 * ```typescript
 * // CACHE_TTL=1h
 * e.duration() // Result: 3600000 (ms)
 *
 * // TIMEOUT=30s
 * e.duration().min("5s").max("5m")
 * ```
 */
export class DurationSchema<
  Optional extends boolean = false,
> extends BaseSchema<number, Optional> {
  constructor() {
    super("duration", coerceDuration);
  }

  /**
   * Require minimum duration
   * @param duration - Duration string (e.g., "1m") or milliseconds
   */
  min(duration: string | number): this {
    const minMs =
      typeof duration === "string" ? (parseDuration(duration) ?? 0) : duration;
    return this.refine(
      (value) => value >= minMs,
      `Must be at least ${typeof duration === "string" ? duration : `${duration}ms`}`,
      "min"
    );
  }

  /**
   * Require maximum duration
   * @param duration - Duration string (e.g., "1d") or milliseconds
   */
  max(duration: string | number): this {
    const maxMs =
      typeof duration === "string"
        ? (parseDuration(duration) ?? Infinity)
        : duration;
    return this.refine(
      (value) => value <= maxMs,
      `Must be at most ${typeof duration === "string" ? duration : `${duration}ms`}`,
      "max"
    );
  }

  override getTypeDescription(): string {
    return "duration (e.g., 1h, 30m, 5s)";
  }

  protected override getDefaultExample(): string {
    return "30s";
  }
}

/**
 * Coerce string to duration in milliseconds
 */
function coerceDuration(value: string): CoercionResult<number> {
  const ms = parseDuration(value);

  if (ms === null) {
    return {
      success: false,
      error:
        "Invalid duration format. Use formats like: 100ms, 5s, 30m, 1h, 7d",
    };
  }

  if (ms < 0) {
    return {
      success: false,
      error: "Duration must be non-negative",
    };
  }

  return { success: true, value: ms };
}

/**
 * Create a new duration schema
 * Parses duration strings to milliseconds
 *
 * @example
 * ```typescript
 * e.duration() // "1h" -> 3600000
 * e.duration().min("1m").max("1d")
 * ```
 */
export function duration(): DurationSchema {
  return new DurationSchema();
}
