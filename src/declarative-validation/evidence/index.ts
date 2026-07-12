import { createHash } from "node:crypto";

import type { EngineDocument } from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type { ValidationRuleResult } from "../../api/validate.js";
import { cloneDiagnostics } from "../../diagnostics/index.js";
import { MARKDOWN_ENGINE_PACKAGE_VERSION } from "../../internal/package-version.js";
import { stringifyStableJson } from "../../internal/stable-json.js";
import type {
  DeclarativeValidationRule,
  ValidationProfile,
} from "../profile/index.js";
import { cloneValidationRuleResult } from "../results/clone-rule-result.js";

export interface DeclarativeValidationEvidence<
  RuleResult extends ValidationRuleResult = ValidationRuleResult,
> {
  inputHash: string;
  profileHash: string;
  engineVersion: string;
  runtimeVersion: string;
  sourceLength?: number;
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
  sourceText?: string,
): DeclarativeValidationEvidence<RuleResult> {
  const sourceLength =
    sourceText !== undefined && profileUsesSourceLength(profile)
      ? sourceText.length
      : undefined;

  return {
    inputHash: sha256(
      stringifyStableJson(canonicalInput(document, sourceLength)),
    ),
    profileHash: sha256(stringifyStableJson(resolvedProfile(profile, document))),
    engineVersion: MARKDOWN_ENGINE_PACKAGE_VERSION,
    runtimeVersion: process.version,
    ...(sourceLength !== undefined ? { sourceLength } : {}),
    ruleResults: cloneRuleResults(ruleResults),
    diagnostics: cloneDiagnostics(diagnostics),
  };
}

function canonicalInput(
  document: EngineDocument,
  sourceLength: number | undefined,
): Omit<EngineDocument, "path"> | {
  document: Omit<EngineDocument, "path">;
  sourceLength: number;
} {
  const normalizedDocument = documentWithoutPath(document);

  return sourceLength === undefined
    ? normalizedDocument
    : { document: normalizedDocument, sourceLength };
}

function profileUsesSourceLength(profile: ValidationProfile): boolean {
  return profile.rules.some(ruleUsesSourceLength);
}

function ruleUsesSourceLength(rule: DeclarativeValidationRule): boolean {
  if (rule.when?.assert.sourceLength !== undefined) {
    return true;
  }

  if ("assert" in rule) {
    return rule.assert.sourceLength !== undefined;
  }

  const branches = "anyOf" in rule ? rule.anyOf : rule.allOf;

  return branches.some((branch) => branch.assert.sourceLength !== undefined);
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
