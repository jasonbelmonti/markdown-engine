import { createHash } from "node:crypto";

import type { EngineDocument } from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type { ValidationRuleResult } from "../../api/validate.js";
import { cloneDiagnostics } from "../../diagnostics/index.js";
import { isPlainRecord } from "../../internal/plain-record.js";
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
    inputHash: sha256(stableJson(documentWithoutPath(document))),
    profileHash: sha256(stableJson(resolvedProfile(profile, document))),
    engineVersion: "1.0.0",
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

function stableJson(value: unknown): string {
  return JSON.stringify(normalizeStableValue(value)) ?? "null";
}

function normalizeStableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeStableValue(item));
  }

  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => value[key] !== undefined)
        .sort()
        .map((key) => [key, normalizeStableValue(value[key])]),
    );
  }

  return value;
}
