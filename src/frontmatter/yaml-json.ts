import type {
  MarkdownDiagnostic,
  SourceRange,
} from "../api/diagnostics.js";
import {
  cyclicYamlAliasDiagnostic,
  nonFiniteNumberDiagnostic,
  nonStringYamlKeyDiagnostic,
  unsupportedJsonValueDiagnostic,
} from "./yaml-diagnostics.js";

export type JsonSafeValue =
  | null
  | boolean
  | number
  | string
  | JsonSafeValue[]
  | { [key: string]: JsonSafeValue };

export type JsonSafeResult =
  | {
      value: JsonSafeValue;
      valueParsed: true;
    }
  | {
      diagnostic: MarkdownDiagnostic;
      valueParsed: false;
    };

export function toJsonSafeValue(
  value: unknown,
  fallbackRange: SourceRange,
  ancestors = new WeakSet<object>(),
): JsonSafeResult {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return {
      value,
      valueParsed: true,
    };
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return {
        diagnostic: nonFiniteNumberDiagnostic(fallbackRange),
        valueParsed: false,
      };
    }

    return {
      value,
      valueParsed: true,
    };
  }

  if (Array.isArray(value)) {
    if (ancestors.has(value)) {
      return {
        diagnostic: cyclicYamlAliasDiagnostic(fallbackRange),
        valueParsed: false,
      };
    }

    ancestors.add(value);

    try {
      const jsonArray: JsonSafeValue[] = [];

      for (const item of value) {
        const jsonItem = toJsonSafeValue(item, fallbackRange, ancestors);

        if (!jsonItem.valueParsed) {
          return jsonItem;
        }

        jsonArray.push(jsonItem.value);
      }

      return {
        value: jsonArray,
        valueParsed: true,
      };
    } finally {
      ancestors.delete(value);
    }
  }

  if (value instanceof Map) {
    if (ancestors.has(value)) {
      return {
        diagnostic: cyclicYamlAliasDiagnostic(fallbackRange),
        valueParsed: false,
      };
    }

    ancestors.add(value);

    try {
      const jsonObject: { [key: string]: JsonSafeValue } = {};

      for (const [key, item] of value.entries()) {
        if (typeof key !== "string") {
          return {
            diagnostic: nonStringYamlKeyDiagnostic(fallbackRange),
            valueParsed: false,
          };
        }

        const jsonItem = toJsonSafeValue(item, fallbackRange, ancestors);

        if (!jsonItem.valueParsed) {
          return jsonItem;
        }

        defineJsonObjectProperty(jsonObject, key, jsonItem.value);
      }

      return {
        value: jsonObject,
        valueParsed: true,
      };
    } finally {
      ancestors.delete(value);
    }
  }

  return {
    diagnostic: unsupportedJsonValueDiagnostic(fallbackRange),
    valueParsed: false,
  };
}

function defineJsonObjectProperty(
  target: { [key: string]: JsonSafeValue },
  key: string,
  value: JsonSafeValue,
): void {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    value,
    writable: true,
  });
}
