import type { EngineDocument } from "../../api/document.js";
import type {
  CompiledDeclarativeValidationAllOfRuleV2,
  CompiledDeclarativeValidationBranchV2,
} from "../compiler/plan.js";
import type {
  DeclarativeValidationBranchResult,
  DeclarativeValidationRuleResultV2,
} from "../results/index.js";
import { resolveDeclarativeSelector } from "../selectors/index.js";
import { groupRequirementFailedDiagnostic } from "./diagnostics.js";
import { evaluateCompiledDeclarativeRule } from "./evaluator.js";

export function evaluateCompiledDeclarativeAllOfRule(
  rule: CompiledDeclarativeValidationAllOfRuleV2,
  document: EngineDocument,
): DeclarativeValidationRuleResultV2 {
  const branches = rule.branches.map((branch) =>
    evaluateCompiledDeclarativeBranch(branch, document),
  );
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
