import type { CompiledDeclarativeValidationRule } from "../compiler/plan.js";
import type { DeclarativeSelection } from "../selectors/index.js";

export interface AssertionEvaluationContext {
  rule: CompiledDeclarativeValidationRule;
  selection: DeclarativeSelection;
  assertionIndex: number;
}
