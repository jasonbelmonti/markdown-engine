import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type { DeclarativeSelector, ValidationProfile } from "../profile/index.js";
import { compiledAssertionsFromValue } from "./assertions.js";
import { compileDiagnostic } from "./diagnostics.js";
import type { DeclarativeValidationCompileResult } from "./plan.js";

export type {
  CompiledDeclarativeAssertion,
  CompiledDeclarativeValidationPlan,
  CompiledDeclarativeValidationRule,
  DeclarativeValidationCompileResult,
} from "./plan.js";

const SUPPORTED_SELECTOR_TARGETS = new Set<DeclarativeSelector["target"]>([
  "document",
  "section",
  "heading",
  "table",
  "tableRow",
  "tableCell",
  "textSpan",
  "link",
  "list",
  "frontmatter",
]);

export function compileValidationProfile(
  profile: ValidationProfile,
): DeclarativeValidationCompileResult {
  const diagnostics: MarkdownDiagnostic[] = [];
  const rules = profile.rules.flatMap((rule) => {
    if (!SUPPORTED_SELECTOR_TARGETS.has(rule.select.target)) {
      diagnostics.push(
        compileDiagnostic(
          "profile.compile.unsupportedSelector",
          `Selector target "${rule.select.target}" is not supported by declarative validation.`,
          rule.id,
        ),
      );

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
      rule.select,
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
        selector: rule.select,
        assertions,
      },
    ];
  });

  return diagnostics.length > 0
    ? { diagnostics }
    : {
        plan: {
          profile,
          rules,
        },
        diagnostics,
      };
}
