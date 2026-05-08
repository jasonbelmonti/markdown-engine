import type { EngineDocument, EngineNode } from "../api/document.js";
import { codeLanguage, isFencedCodeBlock } from "../api/engine-node-attributes.js";
import type { MarkdownDiagnostic } from "../api/diagnostics.js";
import type { ValidationRuleResult } from "../api/validate.js";
import { makeDiagnostic } from "../diagnostics/index.js";
import { findNodes } from "./document-query.js";
import type { CodeFenceLanguagesRuleConfig } from "./code-fence-languages-config.js";

export function evaluateCodeFenceLanguagesRule(
  document: EngineDocument,
  config: CodeFenceLanguagesRuleConfig,
): ValidationRuleResult {
  const allowed = new Set(config.allowed);
  const diagnostics = findNodes(document, isFencedCodeBlock)
    .map((node) => evaluateCodeNode(node, allowed, config))
    .filter((diagnostic): diagnostic is MarkdownDiagnostic => {
      return diagnostic !== undefined;
    });

  return {
    ruleId: config.ruleId,
    passed: diagnostics.length === 0,
    diagnostics,
  };
}

function evaluateCodeNode(
  node: EngineNode,
  allowed: ReadonlySet<string>,
  config: CodeFenceLanguagesRuleConfig,
): MarkdownDiagnostic | undefined {
  const language = codeLanguage(node);

  if (language === undefined) {
    if (!config.requireLanguage) {
      return undefined;
    }

    return makeDiagnostic({
      code: "codeFences.languages.missing",
      ruleId: config.ruleId,
      message: "Code fence language is required.",
      severity: config.severity,
      ...(node.sourceRange !== undefined ? { sourceRange: node.sourceRange } : {}),
    });
  }

  if (allowed.size > 0 && !allowed.has(language)) {
    return makeDiagnostic({
      code: "codeFences.languages.unsupported",
      ruleId: config.ruleId,
      message: `Code fence language "${language}" is not allowed.`,
      severity: config.severity,
      ...(node.sourceRange !== undefined ? { sourceRange: node.sourceRange } : {}),
    });
  }

  return undefined;
}
