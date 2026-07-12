import type { EngineDocument } from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type {
  CompiledDeclarativeValidationAllOfRuleV2,
  CompiledDeclarativeValidationAnyOfRuleV2,
  CompiledDeclarativeValidationBranchV2,
} from "../compiler/plan.js";
import type {
  DeclarativeValidationBranchReference,
  DeclarativeValidationBranchResult,
  DeclarativeValidationRuleResultV2,
} from "../results/index.js";
import { resolveDeclarativeSelector } from "../selectors/index.js";
import type { DeclarativeValidationRuntimeContext } from "./context.js";
import {
  groupRequirementFailedDiagnostic,
  isSourceUnavailableDiagnostic,
  noAlternativeMatchedDiagnostic,
} from "./diagnostics.js";
import { evaluateCompiledDeclarativeRule } from "./evaluator.js";

export function evaluateCompiledDeclarativeAnyOfRule(
  rule: CompiledDeclarativeValidationAnyOfRuleV2,
  document: EngineDocument,
  runtimeContext: DeclarativeValidationRuntimeContext = {},
): DeclarativeValidationRuleResultV2 {
  const branches = evaluateCompiledDeclarativeBranches(
    rule.branches,
    document,
    runtimeContext,
  );
  const sourceUnavailable = sourceUnavailableDiagnostics(branches);
  const selectedBranch = branches.find((branch) => branch.status === "passed");
  const passed = selectedBranch !== undefined && sourceUnavailable.length === 0;
  let diagnostics: MarkdownDiagnostic[] = [];
  if (sourceUnavailable.length > 0) {
    diagnostics = sourceUnavailable;
  } else if (!passed) {
    diagnostics = [noAlternativeMatchedDiagnostic(rule)];
  }

  return {
    ruleId: rule.ruleId,
    status: passed ? "passed" : "failed",
    passed,
    diagnostics,
    evaluation: {
      kind: "anyOf",
      ...(passed && selectedBranch !== undefined
        ? { selectedBranch: branchReferenceFromResult(selectedBranch) }
        : {}),
      branches,
    },
  };
}

export function evaluateCompiledDeclarativeAllOfRule(
  rule: CompiledDeclarativeValidationAllOfRuleV2,
  document: EngineDocument,
  runtimeContext: DeclarativeValidationRuntimeContext = {},
): DeclarativeValidationRuleResultV2 {
  const branches = evaluateCompiledDeclarativeBranches(
    rule.branches,
    document,
    runtimeContext,
  );
  const sourceUnavailable = sourceUnavailableDiagnostics(branches);
  const failed =
    sourceUnavailable.length > 0 ||
    branches.some((branch) => branch.status === "failed");
  let diagnostics: MarkdownDiagnostic[] = [];
  if (sourceUnavailable.length > 0) {
    diagnostics = sourceUnavailable;
  } else if (failed) {
    diagnostics = [groupRequirementFailedDiagnostic(rule)];
  }
  const status = failed ? "failed" : "passed";

  return {
    ruleId: rule.ruleId,
    status,
    passed: !failed,
    diagnostics,
    evaluation: {
      kind: "allOf",
      branches,
    },
  };
}

function evaluateCompiledDeclarativeBranches(
  branches: readonly CompiledDeclarativeValidationBranchV2[],
  document: EngineDocument,
  runtimeContext: DeclarativeValidationRuntimeContext,
): DeclarativeValidationBranchResult[] {
  return branches.map((branch) =>
    evaluateCompiledDeclarativeBranch(branch, document, runtimeContext),
  );
}

function evaluateCompiledDeclarativeBranch(
  branch: CompiledDeclarativeValidationBranchV2,
  document: EngineDocument,
  runtimeContext: DeclarativeValidationRuntimeContext,
): DeclarativeValidationBranchResult {
  const result = evaluateCompiledDeclarativeRule(
    branch,
    resolveDeclarativeSelector(document, branch.selector),
    runtimeContext,
  );

  return {
    branchIndex: branch.branchIndex,
    ...(branch.label !== undefined ? { label: branch.label } : {}),
    status: result.diagnostics.length === 0 ? "passed" : "failed",
    diagnostics: result.diagnostics,
  };
}

function sourceUnavailableDiagnostics(
  branches: readonly DeclarativeValidationBranchResult[],
): MarkdownDiagnostic[] {
  return branches.flatMap((branch) =>
    branch.diagnostics.filter(isSourceUnavailableDiagnostic),
  );
}

function branchReferenceFromResult(
  branch: DeclarativeValidationBranchResult,
): DeclarativeValidationBranchReference {
  return {
    branchIndex: branch.branchIndex,
    ...(branch.label !== undefined ? { label: branch.label } : {}),
  };
}
