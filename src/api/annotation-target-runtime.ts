export const ACCESSOR_PLACEHOLDER = "[Accessor]";
export const FUNCTION_PLACEHOLDER = "[Function]";
export const UNAVAILABLE_PLACEHOLDER = "[Unavailable]";
export const MAX_NORMALIZED_ARRAY_LENGTH = 1_024;
export const MAX_NORMALIZED_OBJECT_KEYS = 1_024;
export const MAX_NORMALIZED_DEPTH = 64;
export const MAX_NORMALIZED_WORK = 2_048;

export type OwnRuntimeProperty =
  | { kind: "accessor" }
  | { kind: "data"; value: unknown }
  | { kind: "missing" }
  | { kind: "unavailable" };

interface NormalizeRuntimeContext {
  cache: WeakMap<object, unknown>;
  path: WeakSet<object>;
  remainingWork: number;
}

interface EnumerableRuntimeProperty {
  key: string;
  property: OwnRuntimeProperty;
}

export function normalizeRuntimeValue(
  value: unknown,
  context = createNormalizeRuntimeContext(),
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

  if (context.path.has(value)) {
    return "[Circular]";
  }

  if (depth <= 0) {
    return UNAVAILABLE_PLACEHOLDER;
  }

  if (context.cache.has(value)) {
    return cloneNormalizedRuntimeValue(context.cache.get(value), context, depth);
  }

  context.path.add(value);

  try {
    let normalized: unknown;

    if (isArray(value)) {
      normalized = normalizeArrayValue(value, context, depth);
    } else if (isPlainObject(value)) {
      normalized = normalizePlainObjectValue(value, context, depth);
    } else {
      normalized = UNAVAILABLE_PLACEHOLDER;
    }

    context.cache.set(value, normalized);

    return normalized;
  } finally {
    context.path.delete(value);
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
  context: NormalizeRuntimeContext,
  depth: number,
): unknown {
  const length = arrayLength(value);

  if (length === undefined || length > MAX_NORMALIZED_ARRAY_LENGTH) {
    return UNAVAILABLE_PLACEHOLDER;
  }

  if (!reserveNormalizationWork(context, length + 1)) {
    return UNAVAILABLE_PLACEHOLDER;
  }

  const normalized: unknown[] = [];

  for (let index = 0; index < length; index += 1) {
    normalized.push(normalizeArrayProperty(value, index, context, depth));
  }

  return normalized;
}

function normalizeArrayProperty(
  value: readonly unknown[],
  index: number,
  context: NormalizeRuntimeContext,
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

  return normalizeRuntimeValue(property.value, context, depth - 1);
}

function normalizePlainObjectValue(
  value: Record<string, unknown>,
  context: NormalizeRuntimeContext,
  depth: number,
): unknown {
  if (!reserveNormalizationWork(context, 1)) {
    return UNAVAILABLE_PLACEHOLDER;
  }

  const properties = boundedEnumerableOwnProperties(value, context);

  if (properties === undefined) {
    return UNAVAILABLE_PLACEHOLDER;
  }

  return Object.fromEntries(
    properties
      .sort((left, right) => compareStrings(left.key, right.key))
      .map(({ key, property }) => [
        key,
        normalizePlainObjectProperty(property, context, depth),
      ]),
  );
}

function normalizePlainObjectProperty(
  property: OwnRuntimeProperty,
  context: NormalizeRuntimeContext,
  depth: number,
): unknown {
  if (property.kind === "missing") {
    return undefined;
  }

  if (property.kind === "accessor") {
    return ACCESSOR_PLACEHOLDER;
  }

  if (property.kind === "unavailable") {
    return UNAVAILABLE_PLACEHOLDER;
  }

  return normalizeRuntimeValue(property.value, context, depth - 1);
}

function cloneNormalizedRuntimeValue(
  value: unknown,
  context: NormalizeRuntimeContext,
  depth: number,
): unknown {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  if (depth <= 0) {
    return UNAVAILABLE_PLACEHOLDER;
  }

  if (Array.isArray(value)) {
    if (
      value.length > MAX_NORMALIZED_ARRAY_LENGTH ||
      !reserveNormalizationWork(context, value.length + 1)
    ) {
      return UNAVAILABLE_PLACEHOLDER;
    }

    return value.map((item) =>
      cloneNormalizedRuntimeValue(item, context, depth - 1),
    );
  }

  const keys = Object.keys(value);

  if (
    keys.length > MAX_NORMALIZED_OBJECT_KEYS ||
    !reserveNormalizationWork(context, keys.length + 1)
  ) {
    return UNAVAILABLE_PLACEHOLDER;
  }

  return Object.fromEntries(
    keys
      .sort(compareStrings)
      .map((key) => [
        key,
        cloneNormalizedRuntimeValue(
          (value as Record<string, unknown>)[key],
          context,
          depth - 1,
        ),
      ]),
  );
}

function createNormalizeRuntimeContext(): NormalizeRuntimeContext {
  return {
    cache: new WeakMap<object, unknown>(),
    path: new WeakSet<object>(),
    remainingWork: MAX_NORMALIZED_WORK,
  };
}

function reserveNormalizationWork(
  context: NormalizeRuntimeContext,
  amount: number,
): boolean {
  if (context.remainingWork < amount) {
    return false;
  }

  context.remainingWork -= amount;

  return true;
}

function boundedEnumerableOwnProperties(
  value: Record<string, unknown>,
  context: NormalizeRuntimeContext,
): EnumerableRuntimeProperty[] | undefined {
  const properties: EnumerableRuntimeProperty[] = [];

  try {
    for (const key in value) {
      if (!reserveNormalizationWork(context, 1)) {
        return undefined;
      }

      const property = ownRuntimeProperty(value, key);

      if (property.kind === "missing") {
        continue;
      }

      properties.push({ key, property });

      if (properties.length > MAX_NORMALIZED_OBJECT_KEYS) {
        return undefined;
      }
    }
  } catch {
    return undefined;
  }

  return properties;
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
