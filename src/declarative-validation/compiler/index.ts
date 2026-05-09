import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type { ValidationProfile } from "../profile/index.js";
import { selectorFromValue } from "../profile/selector-schema.js";
import { compiledAssertionsFromValue } from "./assertions.js";
import { compileDiagnostic } from "./diagnostics.js";
import type { DeclarativeValidationCompileResult } from "./plan.js";

export type {
  CompiledDeclarativeAssertion,
  CompiledDeclarativeValidationPlan,
  CompiledDeclarativeValidationRule,
  DeclarativeValidationCompileResult,
} from "./plan.js";

export function compileValidationProfile(
  profile: ValidationProfile,
): DeclarativeValidationCompileResult {
  const diagnostics: MarkdownDiagnostic[] = [];
  const rules = profile.rules.flatMap((rule) => {
    const diagnosticCountBeforeSelector = diagnostics.length;
    const selector = selectorFromValue(rule.select, diagnostics);
    if (
      selector === undefined ||
      diagnostics.length > diagnosticCountBeforeSelector
    ) {
      return [];
    }

    const diagnosticCountBeforeAssertions = diagnostics.length;
    if (!isPlainRecord(rule.assert)) {
      diagnostics.push(
        compileDiagnostic(
          "profile.config.invalidShape",
          "Rule assert must be an object.",
          rule.id,
        ),
      );

      return [];
    }

    const assertions = compiledAssertionsFromValue(
      rule.assert,
      selector,
      rule.id,
      diagnostics,
    );

    if (assertions.length === 0) {
      if (diagnostics.length === diagnosticCountBeforeAssertions) {
        diagnostics.push(
          compileDiagnostic(
            "profile.config.invalidShape",
            "Rule assert must include at least one supported assertion.",
            rule.id,
          ),
        );
      }

      return [];
    }

    return [
      {
        ruleId: rule.id,
        severity: rule.severity ?? "error",
        selector,
        assertions,
      },
    ];
  });

  return diagnostics.length > 0
    ? { diagnostics }
    : {
        plan: {
          rules,
        },
        diagnostics,
      };
}
