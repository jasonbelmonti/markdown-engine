import { PROFILE_SYNTAX_VERSION_V2 } from "../profile/syntax-version.js";
import type { AssertionBuilder } from "./assertion-builders.js";
import { pushCompatibilityDiagnostic } from "./compatibility.js";
import { compileDiagnostic } from "./diagnostics.js";

export const buildTableRowsCompleteAssertion: AssertionBuilder = (
  assertion, selector, ruleId, syntaxVersion, diagnostics,
) => {
  if (
    assertion.tableRowsComplete === undefined ||
    syntaxVersion !== PROFILE_SYNTAX_VERSION_V2
  ) {
    return undefined;
  }
  if (assertion.tableRowsComplete !== true) {
    diagnostics.push(compileDiagnostic(
      "profile.config.invalidShape",
      "tableRowsComplete must be true.",
      ruleId,
    ));
    return undefined;
  }
  return pushCompatibilityDiagnostic("tableRowsComplete", selector, ruleId, diagnostics)
    ? { kind: "tableRowsComplete" }
    : undefined;
};
