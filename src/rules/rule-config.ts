import type {
  MarkdownDiagnostic,
  MarkdownDiagnosticSeverity,
} from "../api/diagnostics.js";
import { makeDiagnostic } from "../diagnostics/index.js";

export type ParsedRuleConfig<T> =
  | { rule: T; diagnostic?: undefined }
  | { rule?: undefined; diagnostic: MarkdownDiagnostic };

export function invalidRuleConfig(
  ruleId: string,
  message: string,
): { diagnostic: MarkdownDiagnostic } {
  return {
    diagnostic: makeDiagnostic({
      code: "config.rule.invalid",
      ruleId,
      message,
      severity: "error",
    }),
  };
}

export function parseOptionalSeverity(
  ruleId: string,
  severity: unknown,
): ParsedRuleConfig<MarkdownDiagnosticSeverity> {
  if (severity === undefined) {
    return { rule: "error" };
  }

  if (severity === "error" || severity === "warning" || severity === "info") {
    return { rule: severity };
  }

  return invalidRuleConfig(
    ruleId,
    `Rule ${ruleId} severity must be error, warning, or info.`,
  );
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function parseNonEmptyStringArray(
  value: unknown,
): string[] | undefined {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    !value.every(isNonEmptyString)
  ) {
    return undefined;
  }

  return value;
}
