/**
 * EnvProof - URL Schema
 * Schema for URL environment variables
 */

import { BaseSchema } from "./base.js";
import type { CoercionResult } from "../types.js";

/**
 * Schema for URL environment variables
 * Parses string into URL object with protocol validation
 */
export class UrlSchema<Optional extends boolean = false> extends BaseSchema<
  URL,
  Optional
> {
  private _allowedProtocols: string[] | undefined = undefined;

  constructor() {
    super("url", coerceUrl);
  }

  protected override clone(updates: Partial<typeof this._def>): this {
    const cloned = super.clone(updates);
    cloned._allowedProtocols = this._allowedProtocols;
    return cloned;
  }

  /**
   * Restrict allowed protocols
   */
  protocols(protocols: string[]): this {
    const normalizedProtocols = protocols.map((p) =>
      p.endsWith(":") ? p : `${p}:`
    );

    const cloned = this.refine(
      (url) => normalizedProtocols.includes(url.protocol),
      `Protocol must be one of: ${protocols.join(", ")}`,
      "protocols"
    );
    cloned._allowedProtocols = protocols;
    return cloned;
  }

  /**
   * Shorthand for HTTP/HTTPS only
   */
  http(): this {
    return this.protocols(["http", "https"]);
  }

  /**
   * Require URL to have a pathname (not just "/")
   */
  withPath(): this {
    return this.refine(
      (url) => url.pathname !== "/" && url.pathname.length > 0,
      "URL must have a path",
      "withPath"
    );
  }

  /**
   * Require URL to have a specific host
   */
  host(hostname: string): this {
    return this.refine(
      (url) => url.hostname === hostname,
      `Host must be "${hostname}"`,
      "host"
    );
  }

  override getTypeDescription(): string {
    if (this._allowedProtocols && this._allowedProtocols.length > 0) {
      return `URL (${this._allowedProtocols.join("/")})`;
    }
    return "URL";
  }

  protected override getDefaultExample(): string {
    if (
      this._allowedProtocols?.includes("postgresql") ||
      this._allowedProtocols?.includes("postgres")
    ) {
      return "postgresql://user:pass@localhost:5432/database";
    }
    if (this._allowedProtocols?.includes("redis")) {
      return "redis://localhost:6379";
    }
    if (this._allowedProtocols?.includes("mongodb")) {
      return "mongodb://localhost:27017/database";
    }
    return "https://example.com";
  }
}

/**
 * Coerce string to URL
 */
function coerceUrl(value: string): CoercionResult<URL> {
  const trimmed = value.trim();

  if (trimmed === "") {
    return { success: false, error: "Cannot convert empty string to URL" };
  }

  try {
    const url = new URL(trimmed);
    return { success: true, value: url };
  } catch {
    return {
      success: false,
      error: `Invalid URL format: "${value}"`,
    };
  }
}

/**
 * Create a new URL schema
 */
export function url(): UrlSchema {
  return new UrlSchema();
}
