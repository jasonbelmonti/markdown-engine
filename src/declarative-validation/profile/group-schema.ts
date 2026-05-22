import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type {
  DeclarativeValidationBranch,
  ValidationProfile,
} from "./index.js";
import { assertionFromValue } from "./assertion-schema.js";
import { selectorFromValue } from "./selector-schema.js";
import { invalidShape, unsupportedKeys } from "./schema-values.js";

export type DeclarativeValidationGroupKind = "anyOf" | "allOf";

const BRANCH_KEYS = ["label", "select", "assert"] as const;

export function branchesFromValue(
  value: unknown,
  ruleIndex: number,
  groupKind: DeclarativeValidationGroupKind,
  syntaxVersion: ValidationProfile["syntaxVersion"],
  diagnostics: MarkdownDiagnostic[],
): readonly DeclarativeValidationBranch[] | undefined {
  if (!Array.isArray(value) || value.length === 0) {
    diagnostics.push(
      invalidShape(
        `V2 rule at index ${ruleIndex} ${groupKind} must be a non-empty array.`,
      ),
    );

    return undefined;
  }

  const branches: DeclarativeValidationBranch[] = [];
  const seenLabels = new Set<string>();

  for (const [branchIndex, branchValue] of value.entries()) {
    const branch = branchFromValue(
      branchValue,
      ruleIndex,
      groupKind,
      branchIndex,
      syntaxVersion,
      diagnostics,
    );

    if (branch === undefined) {
      continue;
    }

    if (branch.label !== undefined) {
      if (seenLabels.has(branch.label)) {
        diagnostics.push(
          invalidShape(
            `V2 rule at index ${ruleIndex} ${groupKind} branch label "${branch.label}" must be unique.`,
          ),
        );
      }

      seenLabels.add(branch.label);
    }

    branches.push(branch);
  }

  return branches;
}

function branchFromValue(
  value: unknown,
  ruleIndex: number,
  groupKind: DeclarativeValidationGroupKind,
  branchIndex: number,
  syntaxVersion: ValidationProfile["syntaxVersion"],
  diagnostics: MarkdownDiagnostic[],
): DeclarativeValidationBranch | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(
      invalidShape(
        `V2 rule at index ${ruleIndex} ${groupKind} branch at index ${branchIndex} must be an object.`,
      ),
    );

    return undefined;
  }

  unsupportedKeys(value, BRANCH_KEYS, diagnostics);

  const label = branchLabelFromValue(
    value.label,
    ruleIndex,
    groupKind,
    branchIndex,
    diagnostics,
  );
  const select = selectorFromValue(value.select, diagnostics);
  const assert = assertionFromValue(value.assert, syntaxVersion, diagnostics);

  return select === undefined || assert === undefined
    ? undefined
    : {
        ...(label !== undefined ? { label } : {}),
        select,
        assert,
      };
}

function branchLabelFromValue(
  value: unknown,
  ruleIndex: number,
  groupKind: DeclarativeValidationGroupKind,
  branchIndex: number,
  diagnostics: MarkdownDiagnostic[],
): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  diagnostics.push(
    invalidShape(
      `V2 rule at index ${ruleIndex} ${groupKind} branch at index ${branchIndex} label must be a non-empty string when provided.`,
    ),
  );

  return undefined;
}
