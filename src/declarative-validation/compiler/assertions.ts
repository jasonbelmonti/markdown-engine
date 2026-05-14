import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type {
  DeclarativeAssertion,
  DeclarativeSelector,
} from "../profile/index.js";
import { ASSERTION_BUILDERS } from "./assertion-builders.js";
import { pushUnsupportedKeyDiagnostics } from "./assertion-shapes.js";
import type { CompiledDeclarativeAssertion } from "./plan.js";

const ASSERTION_KEYS = [
  "exists",
  "sectionsRequired",
  "tableColumnsRequired",
  "ids",
  "references",
  "text",
  "textOccurrenceCount",
  "textLength",
  "frontmatterRequired",
];

export function compiledAssertionsFromValue(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion[] {
  const compiled: CompiledDeclarativeAssertion[] = [];

  pushUnsupportedKeyDiagnostics(assertion, ASSERTION_KEYS, diagnostics);

  for (const buildAssertion of ASSERTION_BUILDERS) {
    const compiledAssertion = buildAssertion(
      assertion,
      selector,
      ruleId,
      diagnostics,
    );

    if (compiledAssertion !== undefined) {
      compiled.push(compiledAssertion);
    }
  }

  return compiled;
}
