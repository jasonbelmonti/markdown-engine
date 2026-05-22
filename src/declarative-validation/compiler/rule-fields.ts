import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type {
  DeclarativeAssertion,
  DeclarativeValidationSeverity,
} from "../profile/index.js";
import {
  closeProfileDataTree,
  DATA_CLOSURE_FAILED,
} from "../profile/data-closure.js";
import { selectorFromValue } from "../profile/selector-schema.js";
import type { ValidationProfileSyntaxVersion } from "../profile/syntax-version.js";
import { compiledAssertionsFromValue } from "./assertions.js";
import { compileDiagnostic } from "./diagnostics.js";
import type { CompiledDeclarativeValidationRuleFields } from "./plan.js";

export function compiledRuleFieldsFromValue(
  selectValue: unknown,
  assertValue: unknown,
  ruleId: string,
  severity: DeclarativeValidationSeverity,
  syntaxVersion: ValidationProfileSyntaxVersion,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeValidationRuleFields | undefined {
  const selectorInput = closeProfileDataTree(
    selectValue,
    "Rule select",
    diagnostics,
    ruleId,
  );
  if (selectorInput === DATA_CLOSURE_FAILED) {
    return undefined;
  }

  const diagnosticCountBeforeSelector = diagnostics.length;
  const selector = selectorFromValue(selectorInput, diagnostics);
  if (
    selector === undefined ||
    diagnostics.length > diagnosticCountBeforeSelector
  ) {
    return undefined;
  }

  const assertionInput = closeProfileDataTree(
    assertValue,
    "Rule assert",
    diagnostics,
    ruleId,
  );
  if (assertionInput === DATA_CLOSURE_FAILED) {
    return undefined;
  }

  const diagnosticCountBeforeAssertions = diagnostics.length;
  if (!isPlainRecord(assertionInput)) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        "Rule assert must be an object.",
        ruleId,
      ),
    );

    return undefined;
  }

  const assertions = compiledAssertionsFromValue(
    assertionInput as DeclarativeAssertion,
    selector,
    ruleId,
    syntaxVersion,
    diagnostics,
  );

  if (assertions.length === 0) {
    if (diagnostics.length === diagnosticCountBeforeAssertions) {
      diagnostics.push(
        compileDiagnostic(
          "profile.config.invalidShape",
          "Rule assert must include at least one supported assertion.",
          ruleId,
        ),
      );
    }

    return undefined;
  }

  return {
    ruleId,
    severity,
    selector,
    assertions,
  };
}
