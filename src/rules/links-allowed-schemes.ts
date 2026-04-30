import type { EngineDocument, EngineNode } from "../api/document.js";
import type { MarkdownDiagnostic } from "../api/diagnostics.js";
import type { ValidationRuleResult } from "../api/validate.js";
import { makeDiagnostic } from "../diagnostics/index.js";
import { findNodes, stringAttribute } from "./document-query.js";
import type { LinksAllowedSchemesRuleConfig } from "./links-allowed-schemes-config.js";

const SCHEME_PATTERN = /^([A-Za-z][A-Za-z0-9+.-]*):/;
const LINK_NODE_TYPES = new Set(["definition", "image", "link"]);

export function evaluateLinksAllowedSchemesRule(
  document: EngineDocument,
  config: LinksAllowedSchemesRuleConfig,
): ValidationRuleResult {
  const allowedSchemes = new Set(config.schemes);
  const diagnostics = findNodes(document, (node) => LINK_NODE_TYPES.has(node.type))
    .map((node) => evaluateLinkNode(node, allowedSchemes, config))
    .filter((diagnostic): diagnostic is MarkdownDiagnostic => {
      return diagnostic !== undefined;
    });

  return {
    ruleId: config.ruleId,
    passed: diagnostics.length === 0,
    diagnostics,
  };
}

function evaluateLinkNode(
  node: EngineNode,
  allowedSchemes: ReadonlySet<string>,
  config: LinksAllowedSchemesRuleConfig,
): MarkdownDiagnostic | undefined {
  const url = stringAttribute(node, "url");
  const scheme = url?.match(SCHEME_PATTERN)?.[1]?.toLowerCase();

  if (url === undefined || scheme === undefined || allowedSchemes.has(scheme)) {
    return undefined;
  }

  return makeDiagnostic({
    code: "links.allowedSchemes.disallowed",
    ruleId: config.ruleId,
    message: `Link URL scheme "${scheme}" is not allowed.`,
    severity: config.severity,
    ...(node.sourceRange !== undefined ? { sourceRange: node.sourceRange } : {}),
  });
}
