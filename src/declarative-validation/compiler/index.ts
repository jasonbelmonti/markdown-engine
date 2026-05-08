import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type {
  DeclarativeAssertion,
  DeclarativeSelector,
  ValidationProfile,
} from "../profile/index.js";
import type {
  CompiledDeclarativeAssertion,
  DeclarativeValidationCompileResult,
} from "./plan.js";

export type {
  CompiledDeclarativeAssertion,
  CompiledDeclarativeValidationPlan,
  CompiledDeclarativeValidationRule,
  DeclarativeValidationCompileResult,
} from "./plan.js";

const MINIMAL_SELECTOR_TARGETS = new Set<DeclarativeSelector["target"]>([
  "document",
  "section",
]);

export function compileValidationProfile(
  profile: ValidationProfile,
): DeclarativeValidationCompileResult {
  const diagnostics: MarkdownDiagnostic[] = [];
  const rules = profile.rules.flatMap((rule) => {
    if (!MINIMAL_SELECTOR_TARGETS.has(rule.select.target)) {
      diagnostics.push(
        compileDiagnostic(
          "profile.compile.unsupportedSelector",
          `Selector target "${rule.select.target}" is not implemented in the WP-1B proof path.`,
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

function compiledAssertionsFromValue(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion[] {
  const compiled: CompiledDeclarativeAssertion[] = [];

  if (assertion.sectionsRequired !== undefined) {
    if (selector.target !== "document") {
      diagnostics.push(
        compileDiagnostic(
          "profile.compile.incompatibleSelectorAssertion",
          'Assertion "sectionsRequired" is only compatible with the document selector in the WP-1B proof path.',
          ruleId,
        ),
      );
    } else {
      compiled.push({
        kind: "sectionsRequired",
        headings: assertion.sectionsRequired.headings,
        order: assertion.sectionsRequired.order ?? "none",
      });
    }
  }

  if (assertion.text?.contains !== undefined) {
    compiled.push({
      kind: "textContains",
      text: assertion.text.contains,
    });
  }

  rejectUnsupportedAssertionShapes(assertion, ruleId, diagnostics);

  return compiled;
}

function rejectUnsupportedAssertionShapes(
  assertion: DeclarativeAssertion,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): void {
  const unsupportedAssertions = [
    assertion.sectionOrder !== undefined ? "sectionOrder" : undefined,
    assertion.tableColumnsRequired !== undefined ? "tableColumnsRequired" : undefined,
    assertion.ids !== undefined ? "ids" : undefined,
    assertion.references !== undefined ? "references" : undefined,
    assertion.textOccurrenceCount !== undefined ? "textOccurrenceCount" : undefined,
    assertion.frontmatterRequired !== undefined ? "frontmatterRequired" : undefined,
    assertion.text?.column !== undefined ? "text.column" : undefined,
    assertion.text?.containsExactlyOne !== undefined
      ? "text.containsExactlyOne"
      : undefined,
    assertion.text?.excludes !== undefined ? "text.excludes" : undefined,
  ].filter((key): key is string => key !== undefined);

  for (const assertionKey of unsupportedAssertions) {
    diagnostics.push(
      compileDiagnostic(
        "profile.compile.unsupportedAssertion",
        `Assertion "${assertionKey}" is not implemented in the WP-1B proof path.`,
        ruleId,
      ),
    );
  }
}

function compileDiagnostic(
  code: string,
  message: string,
  ruleId: string,
): MarkdownDiagnostic {
  return {
    code,
    ruleId,
    message,
    severity: "error",
  };
}
