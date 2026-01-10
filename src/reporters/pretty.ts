/**
 * EnvKit - Pretty Reporter
 * Terminal-friendly error output with colors and boxes
 */

import type { ValidationError } from "../types.js";
import { groupErrorsByReason } from "../validation/errors.js";

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
};

// Box drawing characters
const box = {
  topLeft: "╭",
  topRight: "╮",
  bottomLeft: "╰",
  bottomRight: "╯",
  horizontal: "─",
  vertical: "│",
  sectionTop: "┌",
  sectionBottom: "└",
  treeVertical: "├",
  treeEnd: "└",
  treeContinue: "│",
};

/**
 * Format validation errors for terminal display
 */
export function formatPretty(errors: ValidationError[]): string {
  const lines: string[] = [];
  const width = 65;

  // Header
  lines.push("");
  lines.push(
    `${colors.red}${box.topLeft}${box.horizontal.repeat(width)}${box.topRight}${
      colors.reset
    }`
  );
  lines.push(
    `${colors.red}${box.vertical}${colors.reset}${centerText(
      "❌ Environment Validation Failed",
      width
    )}${colors.red}${box.vertical}${colors.reset}`
  );
  lines.push(
    `${colors.red}${box.vertical}${colors.reset}${centerText(
      `${errors.length} error${errors.length === 1 ? "" : "s"} found`,
      width
    )}${colors.red}${box.vertical}${colors.reset}`
  );
  lines.push(
    `${colors.red}${box.bottomLeft}${box.horizontal.repeat(width)}${
      box.bottomRight
    }${colors.reset}`
  );
  lines.push("");

  // Group errors by reason
  const grouped = groupErrorsByReason(errors);

  // Missing variables section
  const missing = grouped.get("missing") ?? [];
  const empty = grouped.get("empty") ?? [];
  const missingAndEmpty = [...missing, ...empty];

  if (missingAndEmpty.length > 0) {
    lines.push(formatSection("MISSING VARIABLES", missingAndEmpty, width));
    lines.push("");
  }

  // Invalid values section
  const typeErrors = grouped.get("invalid_type") ?? [];
  const valueErrors = grouped.get("invalid_value") ?? [];
  const parseErrors = grouped.get("parse_error") ?? [];
  const invalidValues = [...typeErrors, ...valueErrors, ...parseErrors];

  if (invalidValues.length > 0) {
    lines.push(formatSection("INVALID VALUES", invalidValues, width));
    lines.push("");
  }

  // Tip
  lines.push(
    `${colors.cyan}💡 Tip:${colors.reset} Run ${colors.bold}npx envkit generate${colors.reset} to create a .env.example file`
  );
  lines.push("");

  return lines.join("\n");
}

/**
 * Format a section of errors
 */
function formatSection(
  title: string,
  errors: ValidationError[],
  width: number
): string {
  const lines: string[] = [];

  // Section header
  lines.push(
    `${colors.yellow}${box.sectionTop}${
      box.horizontal
    } ${title} ${box.horizontal.repeat(width - title.length - 4)}${
      colors.reset
    }`
  );
  lines.push(`${colors.yellow}${box.vertical}${colors.reset}`);

  // Error entries
  for (const error of errors) {
    lines.push(...formatError(error));
    lines.push(`${colors.yellow}${box.vertical}${colors.reset}`);
  }

  // Section footer
  lines.push(
    `${colors.yellow}${box.sectionBottom}${box.horizontal.repeat(width)}${
      colors.reset
    }`
  );

  return lines.join("\n");
}

/**
 * Format a single error
 */
function formatError(error: ValidationError): string[] {
  const lines: string[] = [];
  const prefix = `${colors.yellow}${box.vertical}${colors.reset}  `;

  // Variable name
  lines.push(
    `${prefix}${colors.bold}${colors.white}${error.variable}${colors.reset}`
  );

  // Status
  const statusText = getStatusText(error);
  lines.push(
    `${prefix}  ${colors.dim}${box.treeVertical}${colors.reset}${colors.dim}─ Status:${colors.reset}   ${colors.red}${statusText}${colors.reset}`
  );

  // Expected type
  lines.push(
    `${prefix}  ${colors.dim}${box.treeVertical}${colors.reset}${colors.dim}─ Expected:${colors.reset} ${colors.cyan}${error.expected}${colors.reset}`
  );

  // Received value (if applicable)
  if (error.received !== undefined) {
    lines.push(
      `${prefix}  ${colors.dim}${box.treeVertical}${colors.reset}${colors.dim}─ Received:${colors.reset} ${colors.yellow}"${error.received}"${colors.reset}`
    );
  }

  // Example
  if (error.example) {
    const exampleValue = error.isSecret
      ? maskSecret(error.example)
      : error.example;
    lines.push(
      `${prefix}  ${colors.dim}${box.treeEnd}${colors.reset}${colors.dim}─ Example:${colors.reset}  ${colors.green}${exampleValue}${colors.reset}`
    );
  }

  return lines;
}

/**
 * Get human-readable status text for an error
 */
function getStatusText(error: ValidationError): string {
  switch (error.reason) {
    case "missing":
      return "Missing (required)";
    case "empty":
      return "Empty value";
    case "invalid_type":
      return "Invalid type";
    case "invalid_value":
      return error.message;
    case "parse_error":
      return "Parse error";
    default:
      return error.message;
  }
}

/**
 * Mask a secret value for display
 */
function maskSecret(value: string): string {
  if (value.length <= 8) {
    return "*".repeat(value.length);
  }
  return (
    value.slice(0, 3) +
    "*".repeat(Math.min(value.length - 6, 10)) +
    value.slice(-3)
  );
}

/**
 * Center text within a given width
 */
function centerText(text: string, width: number): string {
  // Remove ANSI codes for length calculation
  const plainText = text.replace(/\x1b\[[0-9;]*m/g, "");
  const padding = Math.max(0, Math.floor((width - plainText.length) / 2));
  const rightPadding = Math.max(0, width - plainText.length - padding);
  return " ".repeat(padding) + text + " ".repeat(rightPadding);
}
