import type { EngineDocument } from "../../api/document.js";
import type {
  CompiledDeclarativeValidationApplicabilityPlan,
  CompiledDeclarativeValidationExecutableRule,
  CompiledDeclarativeValidationRule,
} from "../compiler/plan.js";
import type { DeclarativeValidationApplicabilityResult } from "../results/index.js";
import { evaluateCompiledDeclarativeRule } from "../assertions/evaluator.js";
import { resolveDeclarativeSelector } from "../selectors/index.js";

export type CompiledRuleApplicabilityClassification =
  | {
      status: "notConfigured";
    }
  | {
      status: "matched";
      result: DeclarativeValidationApplicabilityResult & { status: "matched" };
    }
  | {
      status: "notMatched";
      result: DeclarativeValidationApplicabilityResult & {
        status: "notMatched";
      };
    };

export function classifyCompiledDeclarativeRuleApplicability(
  rule: CompiledDeclarativeValidationRule,
  document: EngineDocument,
): CompiledRuleApplicabilityClassification {
  const applicability = compiledApplicabilityFromRule(rule);

  if (applicability === undefined) {
    return { status: "notConfigured" };
  }

  const result = evaluateCompiledDeclarativeRule(
    applicabilityRuleFromPlan(rule, applicability),
    resolveDeclarativeSelector(document, applicability.selector),
  );

  if (result.diagnostics.length === 0) {
    return {
      status: "matched",
      result: {
        status: "matched",
        diagnostics: [],
      },
    };
  }

  return {
    status: "notMatched",
    result: {
      status: "notMatched",
      diagnostics: result.diagnostics,
    },
  };
}

function compiledApplicabilityFromRule(
  rule: CompiledDeclarativeValidationRule,
): CompiledDeclarativeValidationApplicabilityPlan | undefined {
  return "applicability" in rule ? rule.applicability : undefined;
}

function applicabilityRuleFromPlan(
  rule: CompiledDeclarativeValidationRule,
  applicability: CompiledDeclarativeValidationApplicabilityPlan,
): CompiledDeclarativeValidationExecutableRule {
  return {
    ruleId: rule.ruleId,
    severity: rule.severity,
    selector: applicability.selector,
    assertions: applicability.assertions,
  };
}
