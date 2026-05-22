import type { CompiledDeclarativeValidationExecutableRule } from "../compiler/plan.js";
import type { DeclarativeSelection } from "../selectors/index.js";

export interface AssertionEvaluationContext {
  rule: CompiledDeclarativeValidationExecutableRule;
  selection: DeclarativeSelection;
  assertionIndex: number;
}
