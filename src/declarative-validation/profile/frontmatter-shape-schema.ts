import { isPlainRecord } from "../../internal/plain-record.js";
import type {
  DeclarativeFrontmatterFieldShape,
  DeclarativeFrontmatterPresence,
  DeclarativeFrontmatterShape,
  DeclarativeFrontmatterValueType,
} from "./index.js";

const FRONTMATTER_PRESENCE_VALUES = new Set<DeclarativeFrontmatterPresence>([
  "required",
  "forbidden",
]);
const FRONTMATTER_VALUE_TYPES = new Set<DeclarativeFrontmatterValueType>([
  "string",
  "number",
  "boolean",
  "array",
  "object",
  "null",
]);

export interface FrontmatterShapeSchemaResult {
  shape?: DeclarativeFrontmatterShape;
  invalidShapes: readonly string[];
  unsupportedKeys: readonly string[];
}

export function frontmatterShapeFromValue(
  value: unknown,
): FrontmatterShapeSchemaResult {
  const invalidShapes: string[] = [];
  const unsupportedKeys: string[] = [];
  const shape = frontmatterShape(value, invalidShapes, unsupportedKeys);

  return {
    ...(shape !== undefined ? { shape } : {}),
    invalidShapes,
    unsupportedKeys,
  };
}

function frontmatterShape(
  value: unknown,
  invalidShapes: string[],
  unsupportedKeys: string[],
): DeclarativeFrontmatterShape | undefined {
  if (!isPlainRecord(value)) {
    invalidShapes.push("frontmatterShape must be an object.");

    return undefined;
  }

  collectUnsupportedKeys(value, ["presence", "fields"], unsupportedKeys);

  let valid = true;
  const presence = frontmatterPresence(value.presence, invalidShapes);
  if (value.presence !== undefined && presence === undefined) {
    valid = false;
  }

  const fields = frontmatterFields(value.fields, invalidShapes, unsupportedKeys);
  if (value.fields !== undefined && fields === undefined) {
    valid = false;
  }

  if (value.presence === undefined && value.fields === undefined) {
    invalidShapes.push("frontmatterShape must include presence or fields.");
    valid = false;
  }

  if (presence === "forbidden" && fields !== undefined) {
    invalidShapes.push(
      "frontmatterShape.fields cannot be provided when presence is forbidden.",
    );
    valid = false;
  }

  return valid
    ? {
        ...(presence !== undefined ? { presence } : {}),
        ...(fields !== undefined ? { fields } : {}),
      }
    : undefined;
}

function frontmatterPresence(
  value: unknown,
  invalidShapes: string[],
): DeclarativeFrontmatterPresence | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value === "string" &&
    FRONTMATTER_PRESENCE_VALUES.has(value as DeclarativeFrontmatterPresence)
  ) {
    return value as DeclarativeFrontmatterPresence;
  }

  invalidShapes.push(
    'frontmatterShape.presence must be "required" or "forbidden" when provided.',
  );

  return undefined;
}

function frontmatterFields(
  value: unknown,
  invalidShapes: string[],
  unsupportedKeys: string[],
): readonly DeclarativeFrontmatterFieldShape[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.length === 0) {
    invalidShapes.push(
      "frontmatterShape.fields must be a non-empty array when provided.",
    );

    return undefined;
  }

  const fields: DeclarativeFrontmatterFieldShape[] = [];
  const seenFields = new Set<string>();
  let valid = true;

  for (let index = 0; index < value.length; index += 1) {
    const fieldShape = frontmatterField(
      value[index],
      index,
      invalidShapes,
      unsupportedKeys,
    );

    if (fieldShape === undefined) {
      valid = false;
      continue;
    }

    if (seenFields.has(fieldShape.field)) {
      invalidShapes.push(
        `frontmatterShape.fields[${index}].field duplicates field "${fieldShape.field}".`,
      );
      valid = false;
      continue;
    }

    seenFields.add(fieldShape.field);
    fields.push(fieldShape);
  }

  return valid ? fields : undefined;
}

function frontmatterField(
  value: unknown,
  index: number,
  invalidShapes: string[],
  unsupportedKeys: string[],
): DeclarativeFrontmatterFieldShape | undefined {
  const fieldName = `frontmatterShape.fields[${index}]`;

  if (!isPlainRecord(value)) {
    invalidShapes.push(`${fieldName} must be an object.`);

    return undefined;
  }

  collectUnsupportedKeys(
    value,
    ["field", "required", "valueType", "nonEmpty"],
    unsupportedKeys,
  );

  let valid = true;
  const field = nonEmptyString(value.field);
  if (field === undefined) {
    invalidShapes.push(`${fieldName}.field must be a non-empty string.`);
    valid = false;
  }

  const required = trueConstraint(
    value.required,
    `${fieldName}.required`,
    invalidShapes,
  );
  if (value.required !== undefined && required === undefined) {
    valid = false;
  }

  const valueType = frontmatterValueType(
    value.valueType,
    `${fieldName}.valueType`,
    invalidShapes,
  );
  if (value.valueType !== undefined && valueType === undefined) {
    valid = false;
  }

  const nonEmpty = trueConstraint(
    value.nonEmpty,
    `${fieldName}.nonEmpty`,
    invalidShapes,
  );
  if (value.nonEmpty !== undefined && nonEmpty === undefined) {
    valid = false;
  }
  if (nonEmpty === true && valueType !== undefined && valueType !== "string") {
    invalidShapes.push(
      `${fieldName}.nonEmpty can be combined only with valueType "string".`,
    );
    valid = false;
  }

  const hasPredicateInput =
    value.required !== undefined ||
    value.valueType !== undefined ||
    value.nonEmpty !== undefined;
  if (!hasPredicateInput) {
    invalidShapes.push(
      `${fieldName} must include required, valueType, or nonEmpty.`,
    );
    valid = false;
  }

  if (!valid || field === undefined) {
    return undefined;
  }

  const baseField = {
    field,
    ...(required === true ? { required: true as const } : {}),
  };

  if (nonEmpty === true) {
    return {
      ...baseField,
      ...(valueType === "string" ? { valueType } : {}),
      nonEmpty: true as const,
    };
  }

  return {
    ...baseField,
    ...(valueType !== undefined ? { valueType } : {}),
  };
}

function trueConstraint(
  value: unknown,
  fieldName: string,
  invalidShapes: string[],
): true | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === true) {
    return true;
  }

  invalidShapes.push(`${fieldName} must be true when provided.`);

  return undefined;
}

function frontmatterValueType(
  value: unknown,
  fieldName: string,
  invalidShapes: string[],
): DeclarativeFrontmatterValueType | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value === "string" &&
    FRONTMATTER_VALUE_TYPES.has(value as DeclarativeFrontmatterValueType)
  ) {
    return value as DeclarativeFrontmatterValueType;
  }

  invalidShapes.push(
    `${fieldName} must be "string", "number", "boolean", "array", "object", or "null" when provided.`,
  );

  return undefined;
}

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function collectUnsupportedKeys(
  record: Record<string, unknown>,
  allowedKeys: readonly string[],
  unsupportedKeys: string[],
): void {
  for (const key of Object.keys(record)) {
    if (!allowedKeys.includes(key)) {
      unsupportedKeys.push(key);
    }
  }
}
