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

export type FieldDiagnosticMessage = (field: string) => string;

export function optionalStringField<Key extends string>(
  record: Record<string, unknown>,
  key: Key,
  diagnostics: MarkdownDiagnostic[],
  message: FieldDiagnosticMessage,
): Partial<Record<Key, string>> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  if (typeof value !== "string" || value.length === 0) {
    diagnostics.push(invalidShape(message(key)));

    return {};
  }

  return { [key]: value } as Partial<Record<Key, string>>;
}

export function optionalStringArrayField<Key extends string>(
  record: Record<string, unknown>,
  key: Key,
  diagnostics: MarkdownDiagnostic[],
  message: FieldDiagnosticMessage,
): Partial<Record<Key, readonly string[]>> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  const values = stringArray(value);

  if (values === undefined) {
    diagnostics.push(invalidShape(message(key)));

    return {};
  }

  return { [key]: values } as Partial<Record<Key, readonly string[]>>;
}

export function optionalBooleanField<Key extends string>(
  record: Record<string, unknown>,
  key: Key,
  diagnostics: MarkdownDiagnostic[],
  message: FieldDiagnosticMessage,
): Partial<Record<Key, boolean>> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  if (typeof value !== "boolean") {
    diagnostics.push(invalidShape(message(key)));

    return {};
  }

  return { [key]: value } as Partial<Record<Key, boolean>>;
}

export function optionalNumberField<Key extends string>(
  record: Record<string, unknown>,
  key: Key,
  diagnostics: MarkdownDiagnostic[],
  message: FieldDiagnosticMessage,
): Partial<Record<Key, number>> {
  const value = record[key];

  if (value === undefined) {
    return {};
  }

  if (!isFiniteNumber(value)) {
    diagnostics.push(invalidShape(message(key)));

    return {};
  }

  return { [key]: value } as Partial<Record<Key, number>>;
}

export function requiredNonEmptyStringField(
  value: unknown,
  field: string,
  diagnostics: MarkdownDiagnostic[],
  message: FieldDiagnosticMessage,
): string | undefined {
  const text = nonEmptyString(value);

  if (text === undefined) {
    diagnostics.push(invalidShape(message(field)));
  }

  return text;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
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
