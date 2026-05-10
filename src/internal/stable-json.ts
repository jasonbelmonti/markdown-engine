import { isPlainRecord } from "./plain-record.js";

export function normalizeStableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeStableJsonValue(item));
  }

  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => value[key] !== undefined)
        .sort()
        .map((key) => [key, normalizeStableJsonValue(value[key])]),
    );
  }

  return value;
}

export function stringifyStableJson(value: unknown): string {
  return JSON.stringify(normalizeStableJsonValue(value)) ?? "null";
}
