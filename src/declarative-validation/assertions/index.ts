import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type { DeclarativeAssertion } from "../profile/index.js";
import type { DeclarativeSelection } from "../selectors/index.js";

/** @internal Assertion evaluation is assigned to a later work package. */
export interface DeclarativeAssertionEvaluation {
  assertion: DeclarativeAssertion;
  selection: DeclarativeSelection;
  diagnostics: readonly MarkdownDiagnostic[];
}
