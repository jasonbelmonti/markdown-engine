import { types as nodeTypes } from "node:util";

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

  if (nodeTypes.isProxy(value)) {
    pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

    return DATA_CLOSURE_FAILED;
  }

  const arrayCheck = safeArrayCheck(value, fieldName, diagnostics, ruleId);
  if (arrayCheck === DATA_CLOSURE_FAILED) {
    return DATA_CLOSURE_FAILED;
  }

  if (arrayCheck) {
    const arrayValue = value as readonly unknown[];
    if (ancestors.has(arrayValue)) {
      pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

      return DATA_CLOSURE_FAILED;
    }

    ancestors.add(arrayValue);
    const values: unknown[] = [];
    const length = safeArrayLength(arrayValue, fieldName, diagnostics, ruleId);
    if (length === DATA_CLOSURE_FAILED) {
      ancestors.delete(arrayValue);

      return DATA_CLOSURE_FAILED;
    }

    for (let index = 0; index < length; index += 1) {
      const descriptor = safePropertyDescriptor(
        arrayValue,
        String(index),
        `${fieldName}[${index}]`,
        diagnostics,
        ruleId,
      );

      if (
        descriptor === DATA_CLOSURE_FAILED ||
        descriptor === undefined ||
        !("value" in descriptor)
      ) {
        if (descriptor !== DATA_CLOSURE_FAILED) {
          pushDataClosureDiagnostic(`${fieldName}[${index}]`, diagnostics, ruleId);
        }
        ancestors.delete(arrayValue);

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
        ancestors.delete(arrayValue);

        return DATA_CLOSURE_FAILED;
      }

      values.push(closedValue);
    }

    ancestors.delete(arrayValue);

    return values;
  }

  const plainRecordCheck = safePlainRecordCheck(
    value,
    fieldName,
    diagnostics,
    ruleId,
  );
  if (plainRecordCheck === DATA_CLOSURE_FAILED) {
    return DATA_CLOSURE_FAILED;
  }

  if (plainRecordCheck) {
    const recordValue = value as Record<string, unknown>;
    if (ancestors.has(recordValue)) {
      pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

      return DATA_CLOSURE_FAILED;
    }

    ancestors.add(recordValue);
    const closedRecord = Object.create(null) as Record<string, unknown>;
    const keys = safeKeys(recordValue, fieldName, diagnostics, ruleId);
    if (keys === DATA_CLOSURE_FAILED) {
      ancestors.delete(recordValue);

      return DATA_CLOSURE_FAILED;
    }

    for (const key of keys) {
      if (key === "__proto__") {
        pushDataClosureDiagnostic(`${fieldName}.${key}`, diagnostics, ruleId);
        ancestors.delete(recordValue);

        return DATA_CLOSURE_FAILED;
      }

      const descriptor = safePropertyDescriptor(
        recordValue,
        key,
        `${fieldName}.${key}`,
        diagnostics,
        ruleId,
      );

      if (
        descriptor === DATA_CLOSURE_FAILED ||
        descriptor === undefined ||
        !("value" in descriptor)
      ) {
        if (descriptor !== DATA_CLOSURE_FAILED) {
          pushDataClosureDiagnostic(`${fieldName}.${key}`, diagnostics, ruleId);
        }
        ancestors.delete(recordValue);

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
        ancestors.delete(recordValue);

        return DATA_CLOSURE_FAILED;
      }

      Object.defineProperty(closedRecord, key, {
        configurable: true,
        enumerable: true,
        value: closedValue,
        writable: true,
      });
    }

    ancestors.delete(recordValue);

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
    (typeof value === "number" && Number.isFinite(value)) ||
    typeof value === "boolean"
  );
}

function safeArrayCheck(
  value: unknown,
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId: string | undefined,
): boolean | typeof DATA_CLOSURE_FAILED {
  try {
    return Array.isArray(value);
  } catch {
    pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

    return DATA_CLOSURE_FAILED;
  }
}

function safeArrayLength(
  value: readonly unknown[],
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId: string | undefined,
): number | typeof DATA_CLOSURE_FAILED {
  try {
    const { length } = value;
    if (Number.isSafeInteger(length) && length >= 0) {
      return length;
    }
  } catch {
    // Shape diagnostic emitted below.
  }

  pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

  return DATA_CLOSURE_FAILED;
}

function safePlainRecordCheck(
  value: unknown,
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId: string | undefined,
): boolean | typeof DATA_CLOSURE_FAILED {
  try {
    return isPlainRecord(value);
  } catch {
    pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

    return DATA_CLOSURE_FAILED;
  }
}

function safeKeys(
  value: Record<string, unknown>,
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId: string | undefined,
): string[] | typeof DATA_CLOSURE_FAILED {
  try {
    return Object.keys(value);
  } catch {
    pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

    return DATA_CLOSURE_FAILED;
  }
}

function safePropertyDescriptor(
  value: object,
  key: string,
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId: string | undefined,
): PropertyDescriptor | undefined | typeof DATA_CLOSURE_FAILED {
  try {
    return Object.getOwnPropertyDescriptor(value, key);
  } catch {
    pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

    return DATA_CLOSURE_FAILED;
  }
}
