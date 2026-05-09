import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import {
  invalidProfileShape,
  unsupportedProfileKeys,
} from "../diagnostics/profile-config-diagnostics.js";

export const invalidShape = invalidProfileShape;

export function unsupportedKeys(
  record: Record<string, unknown>,
  allowedKeys: readonly string[],
  diagnostics: MarkdownDiagnostic[],
): void {
  unsupportedProfileKeys(record, allowedKeys, diagnostics);
}

export function optionalString(
  record: Record<string, unknown>,
  key: string,
  diagnostics: MarkdownDiagnostic[],
): Record<string, string> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  if (typeof value !== "string" || value.length === 0) {
    diagnostics.push(
      invalidShape(`Selector ${key} must be a non-empty string when provided.`),
    );

    return {};
  }

  return { [key]: value };
}

export function optionalStringArray(
  record: Record<string, unknown>,
  key: string,
  diagnostics: MarkdownDiagnostic[],
): Record<string, readonly string[]> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  const values = stringArray(value);

  if (values === undefined) {
    diagnostics.push(
      invalidShape(
        `Selector ${key} must be an array of non-empty strings when provided.`,
      ),
    );

    return {};
  }

  return { [key]: values };
}

export function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function stringArray(value: unknown): readonly string[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  const values: string[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));

    if (
      descriptor === undefined ||
      !("value" in descriptor) ||
      typeof descriptor.value !== "string" ||
      descriptor.value.length === 0
    ) {
      return undefined;
    }

    values.push(descriptor.value);
  }

  return values;
}
