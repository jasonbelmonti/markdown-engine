import { hasOwnProperty, isPlainRecord } from "../../internal/plain-record.js";
import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import { validationDiagnostic } from "./diagnostics.js";

type FrontmatterShapeAssertion = Extract<
  CompiledDeclarativeAssertion,
  { kind: "frontmatterShape" }
>;
type FrontmatterFieldShape = NonNullable<
  FrontmatterShapeAssertion["fields"]
>[number];
type FrontmatterValueType = NonNullable<FrontmatterFieldShape["valueType"]>;

export function evaluateFrontmatterShape(
  assertion: FrontmatterShapeAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  const frontmatter = context.selection.document.frontmatter;
  const diagnostics: AssertionDiagnostic[] = [];

  if (assertion.presence === "required" && frontmatter === undefined) {
    diagnostics.push(requiredFrontmatterDiagnostic(context));
  }

  if (assertion.presence === "forbidden" && frontmatter !== undefined) {
    diagnostics.push(forbiddenFrontmatterDiagnostic(context));
  }

  if (assertion.fields === undefined) {
    return diagnostics;
  }

  if (!isPlainRecord(frontmatter)) {
    for (const [fieldOrder, field] of assertion.fields.entries()) {
      if (field.required === true) {
        diagnostics.push(missingFieldDiagnostic(field, context, fieldOrder));
      }
    }

    return diagnostics;
  }

  for (const [fieldOrder, field] of assertion.fields.entries()) {
    diagnostics.push(
      ...evaluateFrontmatterField(frontmatter, field, context, fieldOrder),
    );
  }

  return diagnostics;
}

function evaluateFrontmatterField(
  frontmatter: Record<string, unknown>,
  field: FrontmatterFieldShape,
  context: AssertionEvaluationContext,
  fieldOrder: number,
): AssertionDiagnostic[] {
  if (!hasOwnProperty(frontmatter, field.field)) {
    return field.required === true
      ? [missingFieldDiagnostic(field, context, fieldOrder)]
      : [];
  }

  const value = frontmatter[field.field];
  const diagnostics: AssertionDiagnostic[] = [];
  const stringTypeMismatch =
    field.valueType === "string" && typeof value !== "string";

  if (
    field.valueType !== undefined &&
    !matchesFrontmatterValueType(value, field.valueType)
  ) {
    diagnostics.push(typeMismatchDiagnostic(field, context, fieldOrder));
  }

  if (field.forbidden === true) {
    diagnostics.push(forbiddenFieldDiagnostic(field, context, fieldOrder));
  }

  if (
    !stringTypeMismatch &&
    field.equals !== undefined &&
    failsExactStringPredicate(value, field.equals)
  ) {
    diagnostics.push(valueMismatchDiagnostic(field, context, fieldOrder));
  }

  if (
    !stringTypeMismatch &&
    field.nonEmpty === true &&
    failsNonEmptyStringPredicate(value)
  ) {
    diagnostics.push(emptyFieldDiagnostic(field, context, fieldOrder));
  }

  if (
    !stringTypeMismatch &&
    field.nonBlank === true &&
    failsNonBlankStringPredicate(value)
  ) {
    diagnostics.push(blankFieldDiagnostic(field, context, fieldOrder));
  }

  return diagnostics;
}

function requiredFrontmatterDiagnostic(
  context: AssertionEvaluationContext,
): AssertionDiagnostic {
  return validationDiagnostic(
    "profile.validation.frontmatterMissing",
    "Frontmatter is required.",
    context.rule,
    {
      assertionIndex: context.assertionIndex,
      targetKey: "frontmatter:presence:required",
      diagnosticOrder: 0,
    },
  );
}

function forbiddenFrontmatterDiagnostic(
  context: AssertionEvaluationContext,
): AssertionDiagnostic {
  return validationDiagnostic(
    "profile.validation.frontmatterForbidden",
    "Frontmatter is forbidden.",
    context.rule,
    {
      assertionIndex: context.assertionIndex,
      targetKey: "frontmatter:presence:forbidden",
      diagnosticOrder: 0,
    },
  );
}

function missingFieldDiagnostic(
  field: FrontmatterFieldShape,
  context: AssertionEvaluationContext,
  fieldOrder: number,
): AssertionDiagnostic {
  return validationDiagnostic(
    "profile.validation.frontmatterFieldMissing",
    `Required frontmatter field "${field.field}" is missing.`,
    context.rule,
    {
      assertionIndex: context.assertionIndex,
      targetKey: frontmatterFieldTargetKey(field, "missing"),
      diagnosticOrder: fieldOrder,
    },
  );
}

function typeMismatchDiagnostic(
  field: FrontmatterFieldShape,
  context: AssertionEvaluationContext,
  fieldOrder: number,
): AssertionDiagnostic {
  return validationDiagnostic(
    "profile.validation.frontmatterFieldTypeMismatch",
    `Frontmatter field "${field.field}" must be ${field.valueType}.`,
    context.rule,
    {
      assertionIndex: context.assertionIndex,
      targetKey: frontmatterFieldTargetKey(field, "type"),
      diagnosticOrder: fieldOrder,
    },
  );
}

function emptyFieldDiagnostic(
  field: FrontmatterFieldShape,
  context: AssertionEvaluationContext,
  fieldOrder: number,
): AssertionDiagnostic {
  return validationDiagnostic(
    "profile.validation.frontmatterFieldEmpty",
    `Frontmatter field "${field.field}" must be a non-empty string.`,
    context.rule,
    {
      assertionIndex: context.assertionIndex,
      targetKey: frontmatterFieldTargetKey(field, "nonEmpty"),
      diagnosticOrder: fieldOrder,
    },
  );
}

function valueMismatchDiagnostic(
  field: FrontmatterFieldShape,
  context: AssertionEvaluationContext,
  fieldOrder: number,
): AssertionDiagnostic {
  return validationDiagnostic(
    "profile.validation.frontmatterFieldValueMismatch",
    `Frontmatter field "${field.field}" must match its configured string value.`,
    context.rule,
    {
      assertionIndex: context.assertionIndex,
      targetKey: frontmatterFieldTargetKey(field, "equals"),
      diagnosticOrder: fieldOrder,
    },
  );
}

function blankFieldDiagnostic(
  field: FrontmatterFieldShape,
  context: AssertionEvaluationContext,
  fieldOrder: number,
): AssertionDiagnostic {
  return validationDiagnostic(
    "profile.validation.frontmatterFieldBlank",
    `Frontmatter field "${field.field}" must be a non-blank string.`,
    context.rule,
    {
      assertionIndex: context.assertionIndex,
      targetKey: frontmatterFieldTargetKey(field, "nonBlank"),
      diagnosticOrder: fieldOrder,
    },
  );
}

function forbiddenFieldDiagnostic(
  field: FrontmatterFieldShape,
  context: AssertionEvaluationContext,
  fieldOrder: number,
): AssertionDiagnostic {
  return validationDiagnostic(
    "profile.validation.frontmatterFieldForbidden",
    `Frontmatter field "${field.field}" is forbidden.`,
    context.rule,
    {
      assertionIndex: context.assertionIndex,
      targetKey: frontmatterFieldTargetKey(field, "forbidden"),
      diagnosticOrder: fieldOrder,
    },
  );
}

function frontmatterFieldTargetKey(
  field: FrontmatterFieldShape,
  predicate: string,
): string {
  return `frontmatter:${field.field}:${predicate}`;
}

function matchesFrontmatterValueType(
  value: unknown,
  valueType: FrontmatterValueType,
): boolean {
  switch (valueType) {
    case "string":
      return typeof value === "string";

    case "number":
      return typeof value === "number" && Number.isFinite(value);

    case "boolean":
      return typeof value === "boolean";

    case "array":
      return Array.isArray(value);

    case "object":
      return isPlainRecord(value);

    case "null":
      return value === null;
  }
}

function failsExactStringPredicate(value: unknown, expected: string): boolean {
  return typeof value !== "string" || value !== expected;
}

function failsNonEmptyStringPredicate(value: unknown): boolean {
  return typeof value !== "string" || value.length === 0;
}

function failsNonBlankStringPredicate(value: unknown): boolean {
  return typeof value !== "string" || value.trim().length === 0;
}
