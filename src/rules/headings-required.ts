import type { EngineDocument } from "../api/document.js";
import type { ValidationRuleResult } from "../api/validate.js";
import { makeDiagnostic } from "../diagnostics/index.js";
import { findNodes } from "./document-query.js";
import type { HeadingsRequiredRuleConfig } from "./headings-required-config.js";

export function evaluateHeadingsRequiredRule(
  document: EngineDocument,
  config: HeadingsRequiredRuleConfig,
): ValidationRuleResult {
  const presentHeadings = new Set(
    findNodes(document, (node) => node.type === "heading")
      .map((node) => node.text)
      .filter((text): text is string => text !== undefined),
  );
  const diagnostics = config.headings
    .filter((heading) => !presentHeadings.has(heading))
    .map((heading) =>
      makeDiagnostic({
        code: "headings.required.missing",
        ruleId: config.ruleId,
        message: `Required heading "${heading}" is missing.`,
        severity: config.severity,
      }),
    );

  return {
    ruleId: config.ruleId,
    passed: diagnostics.length === 0,
    diagnostics,
  };
}
