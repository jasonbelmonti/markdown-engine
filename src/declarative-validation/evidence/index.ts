import { createHash } from "node:crypto";

import type { EngineDocument } from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type { ValidationRuleResult } from "../../api/validate.js";
import { cloneDiagnostics } from "../../diagnostics/index.js";
import { stringifyStableJson } from "../../internal/stable-json.js";
import type { ValidationProfile } from "../profile/index.js";

export interface DeclarativeValidationEvidence {
  inputHash: string;
  profileHash: string;
  engineVersion: string;
  runtimeVersion: string;
  ruleResults: readonly ValidationRuleResult[];
  diagnostics: readonly MarkdownDiagnostic[];
}

export function createDeclarativeValidationEvidence(
  document: EngineDocument,
  profile: ValidationProfile,
  ruleResults: readonly ValidationRuleResult[],
  diagnostics: readonly MarkdownDiagnostic[],
): DeclarativeValidationEvidence {
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

function cloneRuleResults(
  ruleResults: readonly ValidationRuleResult[],
): ValidationRuleResult[] {
  return ruleResults.map((result) => ({
    ruleId: result.ruleId,
    passed: result.passed,
    diagnostics: cloneDiagnostics(result.diagnostics),
  }));
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
