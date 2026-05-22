import type { MarkdownDiagnostic, SourceRange } from "../../api/diagnostics.js";
import type {
  CompiledDeclarativeAssertion,
  CompiledDeclarativeValidationAllOfRuleV2,
  CompiledDeclarativeValidationAnyOfRuleV2,
  CompiledDeclarativeValidationExecutableRule,
} from "../compiler/plan.js";
import type { DeclarativeSelectionTarget } from "../selectors/index.js";

export interface AssertionDiagnostic {
  diagnostic: MarkdownDiagnostic;
  assertionIndex: number;
  targetOrder: number;
  targetKey: string;
  diagnosticOrder: number;
}

export interface AssertionDiagnosticOptions {
  assertionIndex: number;
  target?: DeclarativeSelectionTarget;
  targetOrder?: number;
  targetKey?: string;
  diagnosticOrder?: number;
  sourceRange?: SourceRange;
}

export function noAlternativeMatchedDiagnostic(
  rule: CompiledDeclarativeValidationAnyOfRuleV2,
): MarkdownDiagnostic {
  return {
    code: "profile.validation.noAlternativeMatched",
    ruleId: rule.ruleId,
    message: "No anyOf branch matched the grouped rule.",
    severity: rule.severity,
  };
}

export function groupRequirementFailedDiagnostic(
  rule: CompiledDeclarativeValidationAllOfRuleV2,
): MarkdownDiagnostic {
  return {
    code: "profile.validation.groupRequirementFailed",
    ruleId: rule.ruleId,
    message: "One or more allOf branches failed the grouped rule.",
    severity: rule.severity,
  };
}

export function emptySelectionDiagnostic(
  rule: CompiledDeclarativeValidationExecutableRule,
  assertionIndex: number,
): AssertionDiagnostic {
  return validationDiagnostic(
    "profile.validation.emptySelection",
    "Rule selector did not match any document targets.",
    rule,
    {
      assertionIndex,
      targetOrder: -1,
      targetKey: "selection:empty",
    },
  );
}

export function validationDiagnostic(
  code: string,
  message: string,
  rule: CompiledDeclarativeValidationExecutableRule,
  options: AssertionDiagnosticOptions,
): AssertionDiagnostic {
  const sourceRange = options.sourceRange ?? targetSourceRange(options.target);

  return {
    diagnostic: {
      code,
      ruleId: rule.ruleId,
      message,
      severity: rule.severity,
      ...(sourceRange !== undefined ? { sourceRange } : {}),
    },
    assertionIndex: options.assertionIndex,
    targetOrder: options.targetOrder ?? 0,
    targetKey: options.targetKey ?? targetSortKey(options.target),
    diagnosticOrder: options.diagnosticOrder ?? 0,
  };
}

export function unsupportedEvaluatorDiagnostic(
  assertion: CompiledDeclarativeAssertion,
  rule: CompiledDeclarativeValidationExecutableRule,
  assertionIndex: number,
): AssertionDiagnostic {
  return unsupportedEvaluatorDiagnosticFromMessage(
    unsupportedEvaluatorMessage(assertion.kind),
    rule,
    assertionIndex,
  );
}

export function unsupportedEvaluatorFeatureDiagnostic(
  assertionKind: CompiledDeclarativeAssertion["kind"],
  featureName: string,
  rule: CompiledDeclarativeValidationExecutableRule,
  assertionIndex: number,
): AssertionDiagnostic {
  return unsupportedEvaluatorDiagnosticFromMessage(
    unsupportedEvaluatorFeatureMessage(assertionKind, featureName),
    rule,
    assertionIndex,
  );
}

function unsupportedEvaluatorDiagnosticFromMessage(
  message: string,
  rule: CompiledDeclarativeValidationExecutableRule,
  assertionIndex: number,
): AssertionDiagnostic {
  return {
    diagnostic: {
      code: "profile.validation.assertionUnsupported",
      ruleId: rule.ruleId,
      message,
      severity: "error",
    },
    assertionIndex,
    targetOrder: 0,
    targetKey: "",
    diagnosticOrder: 0,
  };
}

function unsupportedEvaluatorMessage(
  assertionKind: CompiledDeclarativeAssertion["kind"],
): string {
  return `Assertion "${assertionKind}" is compiled but not implemented by the assertion evaluator yet.`;
}

function unsupportedEvaluatorFeatureMessage(
  assertionKind: CompiledDeclarativeAssertion["kind"],
  featureName: string,
): string {
  return `Unsupported assertion feature "${featureName}" for "${assertionKind}" is compiled but not implemented by the assertion evaluator yet.`;
}

function targetSourceRange(
  target: DeclarativeSelectionTarget | undefined,
): SourceRange | undefined {
  return target !== undefined && "source" in target
    ? target.source?.range
    : undefined;
}

function targetSortKey(target: DeclarativeSelectionTarget | undefined): string {
  if (target === undefined) {
    return "";
  }

  switch (target.kind) {
    case "document":
      return "document";

    case "section":
      return `section:${target.section.target.id}:${target.section.title}`;

    case "heading":
      return `heading:${target.section.headingTarget.id}:${target.text}`;

    case "table":
      return `table:${target.table.target.id}`;

    case "tableRow":
      return `tableRow:${target.table.target.id}:${target.rowIndex}`;

    case "tableCell":
      return `tableCell:${target.cell.target.id}:${target.cell.rowIndex}:${target.cell.columnIndex}`;

    case "textSpan":
      return `textSpan:${target.span.target.id}:${target.text}`;

    case "link":
      return `link:${target.link.target.id}:${target.link.url}:${target.text}`;

    case "list":
      return `list:${target.list.target.id}`;
  }
}
