import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type {
  DeclarativeAssertion,
  DeclarativeSelector,
} from "../profile/index.js";
import {
  PROFILE_SYNTAX_VERSION_V2,
  type ValidationProfileSyntaxVersion,
} from "../profile/syntax-version.js";
import { ASSERTION_BUILDERS } from "./assertion-builders.js";
import { pushUnsupportedKeyDiagnostics } from "./assertion-shapes.js";
import type { CompiledDeclarativeAssertion } from "./plan.js";

const ASSERTION_KEYS_V1 = [
  "exists",
  "sectionsRequired",
  "tableColumnsRequired",
  "ids",
  "references",
  "text",
  "textOccurrenceCount",
  "textLength",
  "frontmatterRequired",
] as const;

const ASSERTION_KEYS_V2 = [
  ...ASSERTION_KEYS_V1,
  "sourceLength",
  "tableColumnCoverage",
  "frontmatterShape",
  "textFormat",
] as const;

export function compiledAssertionsFromValue(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  syntaxVersion: ValidationProfileSyntaxVersion,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion[] {
  const compiled: CompiledDeclarativeAssertion[] = [];

  pushUnsupportedKeyDiagnostics(
    assertion,
    assertionKeysForSyntaxVersion(syntaxVersion),
    diagnostics,
  );

  for (const buildAssertion of ASSERTION_BUILDERS) {
    const compiledAssertion = buildAssertion(
      assertion,
      selector,
      ruleId,
      syntaxVersion,
      diagnostics,
    );

    if (compiledAssertion !== undefined) {
      compiled.push(compiledAssertion);
    }
  }

  return compiled;
}

function assertionKeysForSyntaxVersion(
  syntaxVersion: ValidationProfileSyntaxVersion,
): readonly string[] {
  return syntaxVersion === PROFILE_SYNTAX_VERSION_V2
    ? ASSERTION_KEYS_V2
    : ASSERTION_KEYS_V1;
}
