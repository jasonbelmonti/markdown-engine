import type { MarkdownDiagnostic, SourceRange } from "../../api/diagnostics.js";
import type {
  CompiledDeclarativeAssertion,
  CompiledDeclarativeValidationRule,
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

export function emptySelectionDiagnostic(
  rule: CompiledDeclarativeValidationRule,
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
  rule: CompiledDeclarativeValidationRule,
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
  rule: CompiledDeclarativeValidationRule,
  assertionIndex: number,
): AssertionDiagnostic {
  return {
    diagnostic: {
      code: "profile.validation.assertionUnsupported",
      ruleId: rule.ruleId,
      message: unsupportedEvaluatorMessage(assertion.kind),
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
