import type { EngineDocument } from "../api/document.js";
import type { ValidationRuleResult } from "../api/validate.js";
import { makeDiagnostic } from "../diagnostics/index.js";
import { findNodes } from "./document-query.js";
import type { RawHtmlPolicyRuleConfig } from "./raw-html-policy-config.js";

export function evaluateRawHtmlPolicyRule(
  document: EngineDocument,
  config: RawHtmlPolicyRuleConfig,
): ValidationRuleResult {
  if (config.policy === "allow") {
    return {
      ruleId: config.ruleId,
      passed: true,
      diagnostics: [],
    };
  }

  const severity = config.policy === "deny" ? "error" : "warning";
  const diagnostics = findNodes(document, (node) => node.type === "html").map(
    (node) =>
      makeDiagnostic({
        code:
          config.policy === "deny"
            ? "rawHtml.policy.denied"
            : "rawHtml.policy.warned",
        ruleId: config.ruleId,
        message:
          config.policy === "deny"
            ? "Raw HTML is not allowed by policy."
            : "Raw HTML is present.",
        severity,
        ...(node.sourceRange !== undefined ? { sourceRange: node.sourceRange } : {}),
      }),
  );

  return {
    ruleId: config.ruleId,
    passed: diagnostics.length === 0,
    diagnostics,
  };
}
