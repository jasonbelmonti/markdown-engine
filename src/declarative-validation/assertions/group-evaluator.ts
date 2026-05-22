import type { EngineDocument } from "../../api/document.js";
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
import {
  groupRequirementFailedDiagnostic,
  noAlternativeMatchedDiagnostic,
} from "./diagnostics.js";
import { evaluateCompiledDeclarativeRule } from "./evaluator.js";

export function evaluateCompiledDeclarativeAnyOfRule(
  rule: CompiledDeclarativeValidationAnyOfRuleV2,
  document: EngineDocument,
): DeclarativeValidationRuleResultV2 {
  const branches = evaluateCompiledDeclarativeBranches(rule.branches, document);
  const selectedBranch = branches.find((branch) => branch.status === "passed");
  const passed = selectedBranch !== undefined;
  const diagnostics = passed ? [] : [noAlternativeMatchedDiagnostic(rule)];

  return {
    ruleId: rule.ruleId,
    status: passed ? "passed" : "failed",
    passed,
    diagnostics,
    evaluation: {
      kind: "anyOf",
      ...(selectedBranch !== undefined
        ? { selectedBranch: branchReferenceFromResult(selectedBranch) }
        : {}),
      branches,
    },
  };
}

export function evaluateCompiledDeclarativeAllOfRule(
  rule: CompiledDeclarativeValidationAllOfRuleV2,
  document: EngineDocument,
): DeclarativeValidationRuleResultV2 {
  const branches = evaluateCompiledDeclarativeBranches(rule.branches, document);
  const failed = branches.some((branch) => branch.status === "failed");
  const diagnostics = failed ? [groupRequirementFailedDiagnostic(rule)] : [];
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
): DeclarativeValidationBranchResult[] {
  return branches.map((branch) =>
    evaluateCompiledDeclarativeBranch(branch, document),
  );
}

function evaluateCompiledDeclarativeBranch(
  branch: CompiledDeclarativeValidationBranchV2,
  document: EngineDocument,
): DeclarativeValidationBranchResult {
  const result = evaluateCompiledDeclarativeRule(
    branch,
    resolveDeclarativeSelector(document, branch.selector),
  );

  return {
    branchIndex: branch.branchIndex,
    ...(branch.label !== undefined ? { label: branch.label } : {}),
    status: result.diagnostics.length === 0 ? "passed" : "failed",
    diagnostics: result.diagnostics,
  };
}

function branchReferenceFromResult(
  branch: DeclarativeValidationBranchResult,
): DeclarativeValidationBranchReference {
  return {
    branchIndex: branch.branchIndex,
    ...(branch.label !== undefined ? { label: branch.label } : {}),
  };
}
