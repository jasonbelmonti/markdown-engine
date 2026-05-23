import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type { DeclarativeValidationSeverity } from "../profile/index.js";
import { PROFILE_SYNTAX_VERSION_V2 } from "../profile/syntax-version.js";
import { pushUnsupportedKeyDiagnostics } from "./assertion-shapes.js";
import { compileDiagnostic } from "./diagnostics.js";
import type { CompiledDeclarativeValidationApplicabilityPlan } from "./plan.js";
import { compiledRuleFieldsFromValue } from "./rule-fields.js";

const APPLICABILITY_KEYS = ["select", "assert"] as const;

export function compiledApplicabilityPlanFromValue(
  value: unknown,
  ruleId: string,
  severity: DeclarativeValidationSeverity,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeValidationApplicabilityPlan | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        "Rule when must be an object.",
        ruleId,
      ),
    );

    return undefined;
  }

  const diagnosticCountBefore = diagnostics.length;
  pushUnsupportedKeyDiagnostics(value, APPLICABILITY_KEYS, diagnostics);

  const fields = compiledRuleFieldsFromValue(
    value.select,
    value.assert,
    ruleId,
    severity,
    PROFILE_SYNTAX_VERSION_V2,
    diagnostics,
  );

  return fields !== undefined && diagnostics.length === diagnosticCountBefore
    ? {
        selector: fields.selector,
        assertions: fields.assertions,
      }
    : undefined;
}
