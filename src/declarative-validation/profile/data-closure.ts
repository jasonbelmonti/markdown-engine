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
  return closeProfileDataTreeValue(
    value,
    fieldName,
    diagnostics,
    ruleId,
    new WeakSet<object>(),
  );
}

function closeProfileDataTreeValue(
  value: unknown,
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId: string | undefined,
  ancestors: WeakSet<object>,
): DataClosureResult {
  if (isJsonPrimitive(value)) {
    return value;
  }

  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    if (ancestors.has(value)) {
      pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

      return DATA_CLOSURE_FAILED;
    }

    ancestors.add(value);
    const values: unknown[] = [];

    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));

      if (descriptor === undefined || !("value" in descriptor)) {
        pushDataClosureDiagnostic(`${fieldName}[${index}]`, diagnostics, ruleId);
        ancestors.delete(value);

        return DATA_CLOSURE_FAILED;
      }

      const closedValue = closeProfileDataTreeValue(
        descriptor.value,
        `${fieldName}[${index}]`,
        diagnostics,
        ruleId,
        ancestors,
      );
      if (closedValue === DATA_CLOSURE_FAILED) {
        ancestors.delete(value);

        return DATA_CLOSURE_FAILED;
      }

      values.push(closedValue);
    }

    ancestors.delete(value);

    return values;
  }

  if (isPlainRecord(value)) {
    if (ancestors.has(value)) {
      pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

      return DATA_CLOSURE_FAILED;
    }

    ancestors.add(value);
    const closedRecord = Object.create(null) as Record<string, unknown>;

    for (const key of Object.keys(value)) {
      if (key === "__proto__") {
        pushDataClosureDiagnostic(`${fieldName}.${key}`, diagnostics, ruleId);
        ancestors.delete(value);

        return DATA_CLOSURE_FAILED;
      }

      const descriptor = Object.getOwnPropertyDescriptor(value, key);

      if (descriptor === undefined || !("value" in descriptor)) {
        pushDataClosureDiagnostic(`${fieldName}.${key}`, diagnostics, ruleId);
        ancestors.delete(value);

        return DATA_CLOSURE_FAILED;
      }

      const closedValue = closeProfileDataTreeValue(
        descriptor.value,
        `${fieldName}.${key}`,
        diagnostics,
        ruleId,
        ancestors,
      );
      if (closedValue === DATA_CLOSURE_FAILED) {
        ancestors.delete(value);

        return DATA_CLOSURE_FAILED;
      }

      Object.defineProperty(closedRecord, key, {
        configurable: true,
        enumerable: true,
        value: closedValue,
        writable: true,
      });
    }

    ancestors.delete(value);

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
