import { cloneDiagnostics } from "../../diagnostics/index.js";
import type {
  DeclarativeValidationApplicabilityResult,
  DeclarativeValidationRuleResultV2,
} from "./types.js";

interface CreateSkippedDeclarativeValidationRuleResultInput {
  ruleId: string;
  when: DeclarativeValidationApplicabilityResult & { status: "notMatched" };
}

export function createSkippedDeclarativeValidationRuleResult({
  ruleId,
  when,
}: CreateSkippedDeclarativeValidationRuleResultInput): DeclarativeValidationRuleResultV2 {
  return {
    ruleId,
    status: "skipped",
    passed: true,
    diagnostics: [],
    when: {
      status: when.status,
      diagnostics: cloneDiagnostics(when.diagnostics),
    },
    evaluation: {
      kind: "skipped",
      reason: "whenNotMatched",
    },
  };
}
