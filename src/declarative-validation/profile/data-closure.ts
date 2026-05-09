import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";

export const DATA_CLOSURE_FAILED = Symbol("data-closure-failed");

export type DataClosureResult = unknown | typeof DATA_CLOSURE_FAILED;

export function closeProfileDataTree(
  value: unknown,
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId?: string,
): DataClosureResult {
  if (isJsonPrimitive(value)) {
    return value;
  }

  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const values: unknown[] = [];

    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));

      if (descriptor === undefined || !("value" in descriptor)) {
        pushDataClosureDiagnostic(`${fieldName}[${index}]`, diagnostics, ruleId);

        return DATA_CLOSURE_FAILED;
      }

      const closedValue = closeProfileDataTree(
        descriptor.value,
        `${fieldName}[${index}]`,
        diagnostics,
        ruleId,
      );
      if (closedValue === DATA_CLOSURE_FAILED) {
        return DATA_CLOSURE_FAILED;
      }

      values.push(closedValue);
    }

    return values;
  }

  if (isPlainRecord(value)) {
    const closedRecord = Object.create(null) as Record<string, unknown>;

    for (const key of Object.keys(value)) {
      if (key === "__proto__") {
        pushDataClosureDiagnostic(`${fieldName}.${key}`, diagnostics, ruleId);

        return DATA_CLOSURE_FAILED;
      }

      const descriptor = Object.getOwnPropertyDescriptor(value, key);

      if (descriptor === undefined || !("value" in descriptor)) {
        pushDataClosureDiagnostic(`${fieldName}.${key}`, diagnostics, ruleId);

        return DATA_CLOSURE_FAILED;
      }

      const closedValue = closeProfileDataTree(
        descriptor.value,
        `${fieldName}.${key}`,
        diagnostics,
        ruleId,
      );
      if (closedValue === DATA_CLOSURE_FAILED) {
        return DATA_CLOSURE_FAILED;
      }

      Object.defineProperty(closedRecord, key, {
        configurable: true,
        enumerable: true,
        value: closedValue,
        writable: true,
      });
    }

    return closedRecord;
  }

  pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

  return DATA_CLOSURE_FAILED;
}

export function pushDataClosureDiagnostic(
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId?: string,
): void {
  diagnostics.push({
    code: "profile.config.invalidShape",
    ...(ruleId !== undefined ? { ruleId } : {}),
    message: `${fieldName} must contain only JSON-safe data properties.`,
    severity: "error",
  });
}

function isJsonPrimitive(value: unknown): boolean {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}
