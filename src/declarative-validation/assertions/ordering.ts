import type {
  MarkdownDiagnostic,
  SourcePosition,
  SourceRange,
} from "../../api/diagnostics.js";
import type { ValidationRuleResult } from "../../api/validate.js";
import type { AssertionDiagnostic } from "./diagnostics.js";

export function sortAssertionDiagnostics(
  diagnostics: readonly AssertionDiagnostic[],
): MarkdownDiagnostic[] {
  return [...diagnostics]
    .sort(compareAssertionDiagnostics)
    .map((entry) => entry.diagnostic);
}

export function sortValidationRuleResults(
  ruleResults: readonly ValidationRuleResult[],
): ValidationRuleResult[] {
  return [...ruleResults].sort(compareValidationRuleResults);
}

function compareValidationRuleResults(
  left: ValidationRuleResult,
  right: ValidationRuleResult,
): number {
  return compareStrings(left.ruleId, right.ruleId);
}

function compareAssertionDiagnostics(
  left: AssertionDiagnostic,
  right: AssertionDiagnostic,
): number {
  return (
    compareStrings(left.diagnostic.ruleId ?? "", right.diagnostic.ruleId ?? "") ||
    left.assertionIndex - right.assertionIndex ||
    compareOptionalSourceRange(
      left.diagnostic.sourceRange,
      right.diagnostic.sourceRange,
    ) ||
    compareSourceLessDiagnosticOrder(left, right) ||
    compareStrings(left.targetKey, right.targetKey) ||
    compareStrings(left.diagnostic.code, right.diagnostic.code) ||
    compareStrings(left.diagnostic.message, right.diagnostic.message) ||
    compareStrings(left.diagnostic.severity, right.diagnostic.severity) ||
    left.targetOrder - right.targetOrder ||
    left.diagnosticOrder - right.diagnosticOrder
  );
}

function compareSourceLessDiagnosticOrder(
  left: AssertionDiagnostic,
  right: AssertionDiagnostic,
): number {
  if (
    left.diagnostic.sourceRange !== undefined ||
    right.diagnostic.sourceRange !== undefined
  ) {
    return 0;
  }

  return (
    left.targetOrder - right.targetOrder ||
    left.diagnosticOrder - right.diagnosticOrder
  );
}

function compareOptionalSourceRange(
  left: SourceRange | undefined,
  right: SourceRange | undefined,
): number {
  if (left === undefined && right === undefined) {
    return 0;
  }

  if (left === undefined) {
    return 1;
  }

  if (right === undefined) {
    return -1;
  }

  return (
    compareSourcePositions(left.start, right.start) ||
    compareSourcePositions(left.end, right.end)
  );
}

function compareSourcePositions(
  left: SourcePosition,
  right: SourcePosition,
): number {
  return (
    left.line - right.line ||
    left.column - right.column ||
    compareOptionalNumbers(left.offset, right.offset)
  );
}

function compareOptionalNumbers(
  left: number | undefined,
  right: number | undefined,
): number {
  if (left === undefined && right === undefined) {
    return 0;
  }

  if (left === undefined) {
    return 1;
  }

  if (right === undefined) {
    return -1;
  }

  return left - right;
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
