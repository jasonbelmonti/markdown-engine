import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import {
  invalidShape,
  isFiniteNumber,
  unsupportedKeys,
} from "./schema-values.js";

export interface DeclarativeLengthBounds {
  min?: number;
  max?: number;
}

export function lengthBoundsFromValue(
  value: unknown,
  assertionName: "sourceLength" | "textLength",
  diagnostics: MarkdownDiagnostic[],
): DeclarativeLengthBounds | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape(`${assertionName} must be an object.`));

    return undefined;
  }

  unsupportedKeys(value, ["min", "max"], diagnostics);

  const diagnosticCountBeforeBounds = diagnostics.length;
  const bounds = {
    ...optionalLengthBound(value, assertionName, "min", diagnostics),
    ...optionalLengthBound(value, assertionName, "max", diagnostics),
  };

  if (!hasLengthBound(bounds)) {
    if (diagnostics.length === diagnosticCountBeforeBounds) {
      diagnostics.push(
        invalidShape(`${assertionName} must include min, max, or both.`),
      );
    }

    return undefined;
  }

  if (!hasValidLengthRange(bounds)) {
    diagnostics.push(
      invalidShape(
        `${assertionName}.min must be less than or equal to ${assertionName}.max.`,
      ),
    );

    return undefined;
  }

  return bounds;
}

function optionalLengthBound(
  record: Record<string, unknown>,
  assertionName: "sourceLength" | "textLength",
  key: "min" | "max",
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<"min" | "max", number>> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  if (!isFiniteNumber(value)) {
    diagnostics.push(
      invalidShape(`${assertionName}.${key} must be a number when provided.`),
    );

    return {};
  }

  if (!isNonNegativeInteger(value)) {
    diagnostics.push(
      invalidShape(
        `${assertionName}.${key} must be a non-negative integer when provided.`,
      ),
    );

    return {};
  }

  return { [key]: value } as Partial<Record<"min" | "max", number>>;
}

function hasLengthBound(bounds: DeclarativeLengthBounds): boolean {
  return bounds.min !== undefined || bounds.max !== undefined;
}

function hasValidLengthRange(bounds: DeclarativeLengthBounds): boolean {
  return (
    bounds.min === undefined ||
    bounds.max === undefined ||
    bounds.min <= bounds.max
  );
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}
