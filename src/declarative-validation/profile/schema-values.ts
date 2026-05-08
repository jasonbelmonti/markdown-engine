import type { MarkdownDiagnostic } from "../../api/diagnostics.js";

export function diagnostic(code: string, message: string): MarkdownDiagnostic {
  return { code, message, severity: "error" };
}

export function invalidShape(message: string): MarkdownDiagnostic {
  return diagnostic("profile.config.invalidShape", message);
}

export function unsupportedKeys(
  record: Record<string, unknown>,
  allowedKeys: readonly string[],
  diagnostics: MarkdownDiagnostic[],
): void {
  for (const key of Object.keys(record)) {
    if (!allowedKeys.includes(key)) {
      diagnostics.push(
        diagnostic(
          "profile.config.unsupportedKey",
          `Unsupported validation profile key "${key}".`,
        ),
      );
    }
  }
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

  return value.every(
    (item): item is string => typeof item === "string" && item.length > 0,
  )
    ? [...value]
    : undefined;
}
