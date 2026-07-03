import { createHash } from "node:crypto";

import type { EngineDocument } from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type { ValidationRuleResult } from "../../api/validate.js";
import { cloneDiagnostics } from "../../diagnostics/index.js";
import { MARKDOWN_ENGINE_PACKAGE_VERSION } from "../../internal/package-version.js";
import { stringifyStableJson } from "../../internal/stable-json.js";
import type { ValidationProfile } from "../profile/index.js";
import { cloneValidationRuleResult } from "../results/clone-rule-result.js";

export interface DeclarativeValidationEvidence<
  RuleResult extends ValidationRuleResult = ValidationRuleResult,
> {
  inputHash: string;
  profileHash: string;
  engineVersion: string;
  runtimeVersion: string;
  ruleResults: readonly RuleResult[];
  diagnostics: readonly MarkdownDiagnostic[];
}

export function createDeclarativeValidationEvidence<
  RuleResult extends ValidationRuleResult,
>(
  document: EngineDocument,
  profile: ValidationProfile,
  ruleResults: readonly RuleResult[],
  diagnostics: readonly MarkdownDiagnostic[],
): DeclarativeValidationEvidence<RuleResult> {
  return {
    inputHash: sha256(stringifyStableJson(documentWithoutPath(document))),
    profileHash: sha256(stringifyStableJson(resolvedProfile(profile, document))),
    engineVersion: MARKDOWN_ENGINE_PACKAGE_VERSION,
    runtimeVersion: process.version,
    ruleResults: cloneRuleResults(ruleResults),
    diagnostics: cloneDiagnostics(diagnostics),
  };
}

function resolvedProfile(
  profile: ValidationProfile,
  document: EngineDocument,
): ValidationProfile {
  return {
    syntaxVersion: profile.syntaxVersion,
    documentVersion: profile.documentVersion ?? document.version,
    rules: profile.rules.map((rule) => ({
      ...rule,
      severity: rule.severity ?? "error",
    })),
  };
}

function documentWithoutPath(document: EngineDocument): Omit<EngineDocument, "path"> {
  const { path: _path, ...withoutPath } = document;

  return withoutPath;
}

function cloneRuleResults<RuleResult extends ValidationRuleResult>(
  ruleResults: readonly RuleResult[],
): RuleResult[] {
  return ruleResults.map((result) => cloneRuleResult(result));
}

function cloneRuleResult<RuleResult extends ValidationRuleResult>(
  result: RuleResult,
): RuleResult {
  return cloneValidationRuleResult(result) as RuleResult;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
