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

  if (
    field.valueType !== undefined &&
    !matchesFrontmatterValueType(value, field.valueType)
  ) {
    diagnostics.push(typeMismatchDiagnostic(field, context, fieldOrder));
  }

  if (field.nonEmpty === true && failsNonEmptyStringPredicate(value, field)) {
    diagnostics.push(emptyFieldDiagnostic(field, context, fieldOrder));
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

function failsNonEmptyStringPredicate(
  value: unknown,
  field: FrontmatterFieldShape,
): boolean {
  if (field.valueType === "string" && typeof value !== "string") {
    return false;
  }

  return typeof value !== "string" || value.length === 0;
}
