import type { ValidationRuleResult } from "../../api/validate.js";
import { cloneDiagnostics } from "../../diagnostics/index.js";
import type {
  DeclarativeValidationAllOfEvaluationResult,
  DeclarativeValidationAnyOfEvaluationResult,
  DeclarativeValidationApplicabilityResult,
  DeclarativeValidationAssertionsEvaluationResult,
  DeclarativeValidationBranchReference,
  DeclarativeValidationBranchResult,
  DeclarativeValidationRuleEvaluationResult,
  DeclarativeValidationRuleResultV2,
  DeclarativeValidationRuleStatus,
  DeclarativeValidationSkippedEvaluationResult,
} from "./types.js";

export function cloneValidationRuleResult(
  result: ValidationRuleResult,
): ValidationRuleResult {
  if (isDeclarativeValidationRuleResultV2(result)) {
    return cloneV2ValidationRuleResult(result);
  }

  return cloneBaseValidationRuleResult(result);
}

export function cloneBaseValidationRuleResult(
  result: ValidationRuleResult,
): ValidationRuleResult {
  return {
    ruleId: result.ruleId,
    passed: result.passed,
    diagnostics: cloneDiagnostics(result.diagnostics),
  };
}

export function cloneV2ValidationRuleResult(
  result: ValidationRuleResult,
): DeclarativeValidationRuleResultV2 {
  if (!isDeclarativeValidationRuleResultV2(result)) {
    return createAssertionsRuleResult(result);
  }

  const status = result.status;

  return {
    ruleId: result.ruleId,
    status,
    passed: passedFromStatus(status),
    diagnostics: cloneDiagnostics(result.diagnostics),
    ...(result.when !== undefined ? { when: cloneApplicability(result.when) } : {}),
    evaluation: cloneEvaluation(result.evaluation),
  };
}

function createAssertionsRuleResult(
  result: ValidationRuleResult,
): DeclarativeValidationRuleResultV2 {
  const status = statusFromRuleResult(result);
  const diagnostics = cloneDiagnostics(result.diagnostics);

  return {
    ruleId: result.ruleId,
    status,
    passed: passedFromStatus(status),
    diagnostics,
    evaluation: {
      kind: "assertions",
      diagnostics: cloneDiagnostics(diagnostics),
    },
  };
}

function cloneApplicability(
  when: DeclarativeValidationApplicabilityResult,
): DeclarativeValidationApplicabilityResult {
  return {
    status: when.status,
    diagnostics: cloneDiagnostics(when.diagnostics),
  };
}

function cloneEvaluation(
  evaluation: DeclarativeValidationRuleEvaluationResult,
): DeclarativeValidationRuleEvaluationResult {
  switch (evaluation.kind) {
    case "skipped":
      return cloneSkippedEvaluation(evaluation);

    case "assertions":
      return cloneAssertionsEvaluation(evaluation);

    case "anyOf":
      return cloneAnyOfEvaluation(evaluation);

    case "allOf":
      return cloneAllOfEvaluation(evaluation);
  }
}

function cloneSkippedEvaluation(
  evaluation: DeclarativeValidationSkippedEvaluationResult,
): DeclarativeValidationSkippedEvaluationResult {
  return {
    kind: "skipped",
    reason: evaluation.reason,
  };
}

function cloneAssertionsEvaluation(
  evaluation: DeclarativeValidationAssertionsEvaluationResult,
): DeclarativeValidationAssertionsEvaluationResult {
  return {
    kind: "assertions",
    diagnostics: cloneDiagnostics(evaluation.diagnostics),
  };
}

function cloneAnyOfEvaluation(
  evaluation: DeclarativeValidationAnyOfEvaluationResult,
): DeclarativeValidationAnyOfEvaluationResult {
  return {
    kind: "anyOf",
    ...(evaluation.selectedBranch !== undefined
      ? { selectedBranch: cloneBranchReference(evaluation.selectedBranch) }
      : {}),
    branches: evaluation.branches.map(cloneBranchResult),
  };
}

function cloneAllOfEvaluation(
  evaluation: DeclarativeValidationAllOfEvaluationResult,
): DeclarativeValidationAllOfEvaluationResult {
  return {
    kind: "allOf",
    branches: evaluation.branches.map(cloneBranchResult),
  };
}

function cloneBranchReference(
  branch: DeclarativeValidationBranchReference,
): DeclarativeValidationBranchReference {
  return {
    branchIndex: branch.branchIndex,
    ...(branch.label !== undefined ? { label: branch.label } : {}),
  };
}

function cloneBranchResult(
  branch: DeclarativeValidationBranchResult,
): DeclarativeValidationBranchResult {
  return {
    branchIndex: branch.branchIndex,
    ...(branch.label !== undefined ? { label: branch.label } : {}),
    status: branch.status,
    diagnostics: cloneDiagnostics(branch.diagnostics),
  };
}

function isDeclarativeValidationRuleResultV2(
  result: ValidationRuleResult,
): result is DeclarativeValidationRuleResultV2 {
  const candidate = result as Partial<DeclarativeValidationRuleResultV2>;
  const evaluation = candidate.evaluation as { kind?: unknown } | undefined;

  return (
    isRuleStatus(candidate.status) &&
    evaluation !== undefined &&
    evaluation !== null &&
    isEvaluationKind(evaluation.kind)
  );
}

function isEvaluationKind(
  kind: unknown,
): kind is DeclarativeValidationRuleEvaluationResult["kind"] {
  return (
    kind === "skipped" ||
    kind === "assertions" ||
    kind === "anyOf" ||
    kind === "allOf"
  );
}

function isRuleStatus(
  status: DeclarativeValidationRuleStatus | undefined,
): status is DeclarativeValidationRuleStatus {
  return status === "passed" || status === "failed" || status === "skipped";
}

function statusFromRuleResult(
  result: ValidationRuleResult,
): DeclarativeValidationRuleStatus {
  return result.diagnostics.length === 0 ? "passed" : "failed";
}

function passedFromStatus(status: DeclarativeValidationRuleStatus): boolean {
  return status !== "failed";
}
