import { types as nodeTypes } from "node:util";

import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";

export const DATA_CLOSURE_FAILED = Symbol("data-closure-failed");

// Valid profile grammar is shallow. Keep hostile direct-object inputs well below
// the JavaScript call-stack limit while leaving ample room for future additions.
const MAX_PROFILE_DATA_DEPTH = 256;

export type DataClosureResult = unknown | typeof DATA_CLOSURE_FAILED;

interface ClosedProfileDataValue {
  maxRelativeDepth: number;
  value: unknown;
}

type ClosedProfileDataResult =
  | ClosedProfileDataValue
  | typeof DATA_CLOSURE_FAILED;

export function closeProfileDataTree(
  value: unknown,
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId?: string,
): DataClosureResult {
  const result = closeProfileDataTreeValue(
    value,
    fieldName,
    diagnostics,
    ruleId,
    new WeakSet<object>(),
    new WeakMap<object, ClosedProfileDataValue>(),
    0,
  );

  return result === DATA_CLOSURE_FAILED ? result : result.value;
}

function closeProfileDataTreeValue(
  value: unknown,
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId: string | undefined,
  ancestors: WeakSet<object>,
  completedValues: WeakMap<object, ClosedProfileDataValue>,
  depth: number,
): ClosedProfileDataResult {
  if (depth > MAX_PROFILE_DATA_DEPTH) {
    pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

    return DATA_CLOSURE_FAILED;
  }

  if (isJsonPrimitive(value)) {
    return { maxRelativeDepth: 0, value };
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

    const previouslyCompletedValue = completedValues.get(arrayValue);
    if (previouslyCompletedValue !== undefined) {
      return completedValueAtDepth(
        previouslyCompletedValue,
        fieldName,
        diagnostics,
        ruleId,
        depth,
      );
    }

    ancestors.add(arrayValue);
    const values: unknown[] = [];
    let maxRelativeDepth = 0;
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
        completedValues,
        depth + 1,
      );
      if (closedValue === DATA_CLOSURE_FAILED) {
        ancestors.delete(arrayValue);

        return DATA_CLOSURE_FAILED;
      }

      values.push(closedValue.value);
      maxRelativeDepth = Math.max(
        maxRelativeDepth,
        closedValue.maxRelativeDepth + 1,
      );
    }

    ancestors.delete(arrayValue);

    const completedValue = { maxRelativeDepth, value: values };
    completedValues.set(arrayValue, completedValue);

    return completedValue;
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

    const previouslyCompletedValue = completedValues.get(recordValue);
    if (previouslyCompletedValue !== undefined) {
      return completedValueAtDepth(
        previouslyCompletedValue,
        fieldName,
        diagnostics,
        ruleId,
        depth,
      );
    }

    ancestors.add(recordValue);
    const closedRecord = Object.create(null) as Record<string, unknown>;
    let maxRelativeDepth = 0;
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
        completedValues,
        depth + 1,
      );
      if (closedValue === DATA_CLOSURE_FAILED) {
        ancestors.delete(recordValue);

        return DATA_CLOSURE_FAILED;
      }

      Object.defineProperty(closedRecord, key, {
        configurable: true,
        enumerable: true,
        value: closedValue.value,
        writable: true,
      });
      maxRelativeDepth = Math.max(
        maxRelativeDepth,
        closedValue.maxRelativeDepth + 1,
      );
    }

    ancestors.delete(recordValue);

    const completedValue = { maxRelativeDepth, value: closedRecord };
    completedValues.set(recordValue, completedValue);

    return completedValue;
  }

  pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

  return DATA_CLOSURE_FAILED;
}

function completedValueAtDepth(
  completedValue: ClosedProfileDataValue,
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId: string | undefined,
  depth: number,
): ClosedProfileDataResult {
  if (depth + completedValue.maxRelativeDepth > MAX_PROFILE_DATA_DEPTH) {
    pushDataClosureDiagnostic(fieldName, diagnostics, ruleId);

    return DATA_CLOSURE_FAILED;
  }

  return completedValue;
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
