export const ACCESSOR_PLACEHOLDER = "[Accessor]";
export const UNAVAILABLE_PLACEHOLDER = "[Unavailable]";

export function normalizeRuntimeValue(
  value: unknown,
  path = new WeakSet<object>(),
): unknown {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (typeof value === "function" || typeof value === "symbol") {
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

  path.add(value);

  try {
    if (isArray(value)) {
      return normalizeArrayValue(value, path);
    }

    if (isPlainObject(value)) {
      const keys = enumerableOwnKeys(value);

      if (keys === undefined) {
        return UNAVAILABLE_PLACEHOLDER;
      }

      return Object.fromEntries(
        keys
          .sort(compareStrings)
          .map((key) => [key, normalizePlainObjectProperty(value, key, path)]),
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
  const descriptor = ownPropertyDescriptor(value, key);

  return descriptor !== undefined && "value" in descriptor
    ? descriptor.value
    : undefined;
}

export function arrayLength(value: readonly unknown[]): number | undefined {
  const descriptor = ownPropertyDescriptor(
    value as unknown as Record<string, unknown>,
    "length",
  );

  return descriptor !== undefined &&
    "value" in descriptor &&
    isNonNegativeInteger(descriptor.value)
    ? descriptor.value
    : undefined;
}

export function arrayDataProperty(
  value: readonly unknown[],
  index: number,
): unknown {
  const descriptor = ownPropertyDescriptor(
    value as unknown as Record<string, unknown>,
    String(index),
  );

  return descriptor !== undefined && "value" in descriptor
    ? descriptor.value
    : undefined;
}

function normalizeArrayValue(
  value: readonly unknown[],
  path: WeakSet<object>,
): unknown {
  const length = arrayLength(value);

  if (length === undefined) {
    return UNAVAILABLE_PLACEHOLDER;
  }

  return Array.from({ length }, (_item, index) =>
    normalizeArrayProperty(value, index, path),
  );
}

function normalizeArrayProperty(
  value: readonly unknown[],
  index: number,
  path: WeakSet<object>,
): unknown {
  const descriptor = ownPropertyDescriptor(
    value as unknown as Record<string, unknown>,
    String(index),
  );

  if (descriptor === undefined) {
    return undefined;
  }

  if (!("value" in descriptor)) {
    return ACCESSOR_PLACEHOLDER;
  }

  return normalizeRuntimeValue(descriptor.value, path);
}

function normalizePlainObjectProperty(
  value: Record<string, unknown>,
  key: string,
  path: WeakSet<object>,
): unknown {
  const descriptor = ownPropertyDescriptor(value, key);

  if (descriptor === undefined) {
    return undefined;
  }

  if (!("value" in descriptor)) {
    return ACCESSOR_PLACEHOLDER;
  }

  return normalizeRuntimeValue(descriptor.value, path);
}

function ownPropertyDescriptor(
  value: Record<string, unknown>,
  key: string,
): PropertyDescriptor | undefined {
  try {
    return Object.getOwnPropertyDescriptor(value, key);
  } catch {
    return undefined;
  }
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
