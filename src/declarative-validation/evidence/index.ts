import { createHash } from "node:crypto";

import type { EngineDocument } from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type { ValidationRuleResult } from "../../api/validate.js";
import { cloneDiagnostics } from "../../diagnostics/index.js";
import { stringifyStableJson } from "../../internal/stable-json.js";
import type { ValidationProfile } from "../profile/index.js";

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

interface AssertionsEvidenceRuleResult extends ValidationRuleResult {
  status: "passed" | "failed";
  evaluation: {
    kind: "assertions";
    diagnostics: MarkdownDiagnostic[];
  };
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
    engineVersion: "2.0.0",
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
  const baseResult: ValidationRuleResult = {
    ruleId: result.ruleId,
    passed: result.passed,
    diagnostics: cloneDiagnostics(result.diagnostics),
  };

  if (!hasAssertionsEvaluation(result)) {
    return baseResult as RuleResult;
  }

  return {
    ...baseResult,
    status: result.status,
    evaluation: {
      kind: "assertions",
      diagnostics: cloneDiagnostics(result.evaluation.diagnostics),
    },
  } as unknown as RuleResult;
}

function hasAssertionsEvaluation(
  result: ValidationRuleResult,
): result is AssertionsEvidenceRuleResult {
  const candidate = result as Partial<AssertionsEvidenceRuleResult>;

  return candidate.evaluation?.kind === "assertions";
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
