import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type { DeclarativeValidationSeverity } from "../profile/index.js";
import { PROFILE_SYNTAX_VERSION_V2 } from "../profile/syntax-version.js";
import { pushUnsupportedKeyDiagnostics } from "./assertion-shapes.js";
import { compileDiagnostic } from "./diagnostics.js";
import type {
  CompiledDeclarativeValidationBranchV2,
  CompiledDeclarativeValidationGroupRuleV2,
} from "./plan.js";
import { compiledRuleFieldsFromValue } from "./rule-fields.js";

export type CompiledGroupKind = "anyOf" | "allOf";

const BRANCH_KEYS = ["label", "select", "assert"] as const;

export function compiledGroupRuleFromValue(
  value: unknown,
  kind: CompiledGroupKind,
  ruleId: string,
  severity: DeclarativeValidationSeverity,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeValidationGroupRuleV2 | undefined {
  const branches = compiledBranchesFromValue(
    value,
    kind,
    ruleId,
    severity,
    diagnostics,
  );

  return branches === undefined
    ? undefined
    : {
        kind,
        syntaxVersion: PROFILE_SYNTAX_VERSION_V2,
        ruleId,
        severity,
        branches,
      };
}

function compiledBranchesFromValue(
  value: unknown,
  kind: CompiledGroupKind,
  ruleId: string,
  severity: DeclarativeValidationSeverity,
  diagnostics: MarkdownDiagnostic[],
): readonly CompiledDeclarativeValidationBranchV2[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        `Rule ${kind} must be a non-empty array.`,
        ruleId,
      ),
    );

    return undefined;
  }

  const branches: CompiledDeclarativeValidationBranchV2[] = [];
  const seenLabels = new Set<string>();

  for (let branchIndex = 0; branchIndex < value.length; branchIndex += 1) {
    const branch = compiledBranchFromValue(
      value[branchIndex],
      kind,
      branchIndex,
      ruleId,
      severity,
      diagnostics,
    );

    if (branch === undefined) {
      continue;
    }

    if (branch.label !== undefined) {
      if (seenLabels.has(branch.label)) {
        diagnostics.push(
          compileDiagnostic(
            "profile.config.invalidShape",
            `Rule ${kind} branch label "${branch.label}" must be unique.`,
            ruleId,
          ),
        );
      }

      seenLabels.add(branch.label);
    }

    branches.push(branch);
  }

  return branches;
}

function compiledBranchFromValue(
  value: unknown,
  kind: CompiledGroupKind,
  branchIndex: number,
  ruleId: string,
  severity: DeclarativeValidationSeverity,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeValidationBranchV2 | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        `Rule ${kind} branch at index ${branchIndex} must be an object.`,
        ruleId,
      ),
    );

    return undefined;
  }

  pushUnsupportedKeyDiagnostics(value, BRANCH_KEYS, diagnostics);

  const label = branchLabelFromValue(
    value.label,
    kind,
    branchIndex,
    ruleId,
    diagnostics,
  );
  const branchFields = compiledRuleFieldsFromValue(
    value.select,
    value.assert,
    ruleId,
    severity,
    PROFILE_SYNTAX_VERSION_V2,
    diagnostics,
  );

  return branchFields === undefined
    ? undefined
    : {
        branchIndex,
        ...(label !== undefined ? { label } : {}),
        ...branchFields,
      };
}

function branchLabelFromValue(
  value: unknown,
  kind: CompiledGroupKind,
  branchIndex: number,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  diagnostics.push(
    compileDiagnostic(
      "profile.config.invalidShape",
      `Rule ${kind} branch at index ${branchIndex} label must be a non-empty string when provided.`,
      ruleId,
    ),
  );

  return undefined;
}
