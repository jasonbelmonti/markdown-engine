export const ACCESSOR_PLACEHOLDER = "[Accessor]";
export const FUNCTION_PLACEHOLDER = "[Function]";
export const UNAVAILABLE_PLACEHOLDER = "[Unavailable]";
export const MAX_NORMALIZED_ARRAY_LENGTH = 1_024;
export const MAX_NORMALIZED_DEPTH = 64;

export type OwnRuntimeProperty =
  | { kind: "accessor" }
  | { kind: "data"; value: unknown }
  | { kind: "missing" }
  | { kind: "unavailable" };

export function normalizeRuntimeValue(
  value: unknown,
  path = new WeakSet<object>(),
  depth = MAX_NORMALIZED_DEPTH,
): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "function") {
    return FUNCTION_PLACEHOLDER;
  }

  if (typeof value === "symbol") {
    return String(value);
  }

  if (typeof value === "number" && !Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  if (path.has(value)) {
    return "[Circular]";
  }

  if (depth <= 0) {
    return UNAVAILABLE_PLACEHOLDER;
  }

  path.add(value);

  try {
    if (isArray(value)) {
      return normalizeArrayValue(value, path, depth);
    }

    if (isPlainObject(value)) {
      const keys = enumerableOwnKeys(value);

      if (keys === undefined) {
        return UNAVAILABLE_PLACEHOLDER;
      }

      return Object.fromEntries(
        keys
          .sort(compareStrings)
          .map((key) => [
            key,
            normalizePlainObjectProperty(value, key, path, depth),
          ]),
      );
    }

    return UNAVAILABLE_PLACEHOLDER;
  } finally {
    path.delete(value);
  }
}

export function isArray(value: unknown): value is readonly unknown[] {
  try {
    return Array.isArray(value);
  } catch {
    return false;
  }
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || isArray(value)) {
    return false;
  }

  const prototype = objectPrototype(value);

  return prototype === Object.prototype || prototype === null;
}

export function ownDataProperty(
  value: Record<string, unknown>,
  key: string,
): unknown {
  const property = ownRuntimeProperty(value, key);

  return property.kind === "data" ? property.value : undefined;
}

export function arrayLength(value: readonly unknown[]): number | undefined {
  const property = ownRuntimeProperty(
    value as unknown as Record<string, unknown>,
    "length",
  );

  return property.kind === "data" && isNonNegativeInteger(property.value)
    ? property.value
    : undefined;
}

export function arrayDataProperty(
  value: readonly unknown[],
  index: number,
): unknown {
  const property = ownRuntimeProperty(
    value as unknown as Record<string, unknown>,
    String(index),
  );

  return property.kind === "data" ? property.value : undefined;
}

export function ownRuntimeProperty(
  value: Record<string, unknown>,
  key: string,
): OwnRuntimeProperty {
  let descriptor: PropertyDescriptor | undefined;

  try {
    descriptor = Object.getOwnPropertyDescriptor(value, key);
  } catch {
    return { kind: "unavailable" };
  }

  if (descriptor === undefined) {
    return { kind: "missing" };
  }

  if (!("value" in descriptor)) {
    return { kind: "accessor" };
  }

  return { kind: "data", value: descriptor.value };
}

function normalizeArrayValue(
  value: readonly unknown[],
  path: WeakSet<object>,
  depth: number,
): unknown {
  const length = arrayLength(value);

  if (length === undefined || length > MAX_NORMALIZED_ARRAY_LENGTH) {
    return UNAVAILABLE_PLACEHOLDER;
  }

  const normalized: unknown[] = [];

  for (let index = 0; index < length; index += 1) {
    normalized.push(normalizeArrayProperty(value, index, path, depth));
  }

  return normalized;
}

function normalizeArrayProperty(
  value: readonly unknown[],
  index: number,
  path: WeakSet<object>,
  depth: number,
): unknown {
  const property = ownRuntimeProperty(
    value as unknown as Record<string, unknown>,
    String(index),
  );

  if (property.kind === "missing") {
    return undefined;
  }

  if (property.kind === "accessor") {
    return ACCESSOR_PLACEHOLDER;
  }

  if (property.kind === "unavailable") {
    return UNAVAILABLE_PLACEHOLDER;
  }

  return normalizeRuntimeValue(property.value, path, depth - 1);
}

function normalizePlainObjectProperty(
  value: Record<string, unknown>,
  key: string,
  path: WeakSet<object>,
  depth: number,
): unknown {
  const property = ownRuntimeProperty(value, key);

  if (property.kind === "missing") {
    return undefined;
  }

  if (property.kind === "accessor") {
    return ACCESSOR_PLACEHOLDER;
  }

  if (property.kind === "unavailable") {
    return UNAVAILABLE_PLACEHOLDER;
  }

  return normalizeRuntimeValue(property.value, path, depth - 1);
}

function enumerableOwnKeys(value: Record<string, unknown>): string[] | undefined {
  try {
    return Object.keys(value);
  } catch {
    return undefined;
  }
}

function objectPrototype(value: object): object | null | undefined {
  try {
    return Object.getPrototypeOf(value);
  } catch {
    return undefined;
  }
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function compareStrings(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}
