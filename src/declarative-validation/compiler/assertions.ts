import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type {
  DeclarativeAssertion,
  DeclarativeSelector,
} from "../profile/index.js";
import {
  type DeclarativeAssertionName,
  selectorAssertionCompatibilityError,
} from "./compatibility.js";
import { compileDiagnostic } from "./diagnostics.js";
import type { CompiledDeclarativeAssertion } from "./plan.js";

export function compiledAssertionsFromValue(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion[] {
  const compiled: CompiledDeclarativeAssertion[] = [];

  if (assertion.sectionsRequired !== undefined) {
    if (pushCompatibilityDiagnostic("sectionsRequired", assertion, selector, ruleId, diagnostics)) {
      compiled.push({
        kind: "sectionsRequired",
        headings: assertion.sectionsRequired.headings,
        order: assertion.sectionsRequired.order ?? "none",
      });
    }
  }

  if (assertion.sectionOrder !== undefined) {
    if (pushCompatibilityDiagnostic("sectionOrder", assertion, selector, ruleId, diagnostics)) {
      compiled.push({
        kind: "sectionOrder",
        headings: assertion.sectionOrder.headings,
      });
    }
  }

  if (assertion.tableColumnsRequired !== undefined) {
    if (
      pushCompatibilityDiagnostic(
        "tableColumnsRequired",
        assertion,
        selector,
        ruleId,
        diagnostics,
      )
    ) {
      compiled.push({
        kind: "tableColumnsRequired",
        columns: assertion.tableColumnsRequired.columns,
      });
    }
  }

  if (assertion.ids !== undefined) {
    if (pushCompatibilityDiagnostic("ids", assertion, selector, ruleId, diagnostics)) {
      compiled.push({
        kind: "ids",
        unique: true,
        caseSensitive: assertion.ids.caseSensitive ?? true,
        ...optionalString("column", assertion.ids.column),
        ...optionalString("prefix", assertion.ids.prefix),
      });
    }
  }

  if (assertion.references !== undefined) {
    if (pushCompatibilityDiagnostic("references", assertion, selector, ruleId, diagnostics)) {
      compiled.push({
        kind: "references",
        idsFrom: {
          ...optionalString("section", assertion.references.idsFrom.section),
          ...optionalString("column", assertion.references.idsFrom.column),
          ...optionalString("prefix", assertion.references.idsFrom.prefix),
        },
        mustAppearIn: assertion.references.mustAppearIn,
      });
    }
  }

  if (assertion.text !== undefined) {
    if (!hasTextPredicate(assertion.text)) {
      diagnostics.push(
        compileDiagnostic(
          "profile.config.invalidShape",
          "text must include contains, containsExactlyOne, or a non-empty excludes array.",
          ruleId,
        ),
      );
    } else if (pushCompatibilityDiagnostic("text", assertion, selector, ruleId, diagnostics)) {
      compiled.push({
        kind: "text",
        ...optionalString("column", assertion.text.column),
        ...optionalString("contains", assertion.text.contains),
        ...optionalString("containsExactlyOne", assertion.text.containsExactlyOne),
        ...optionalStringArray("excludes", assertion.text.excludes),
      });
    }
  }

  if (assertion.textOccurrenceCount !== undefined) {
    if (
      pushCompatibilityDiagnostic(
        "textOccurrenceCount",
        assertion,
        selector,
        ruleId,
        diagnostics,
      )
    ) {
      compiled.push({
        kind: "textOccurrenceCount",
        text: assertion.textOccurrenceCount.text,
        count: assertion.textOccurrenceCount.count,
        ...optionalString("column", assertion.textOccurrenceCount.column),
      });
    }
  }

  if (assertion.frontmatterRequired !== undefined) {
    if (
      pushCompatibilityDiagnostic(
        "frontmatterRequired",
        assertion,
        selector,
        ruleId,
        diagnostics,
      )
    ) {
      compiled.push({
        kind: "frontmatterRequired",
        fields: assertion.frontmatterRequired.fields,
      });
    }
  }

  return compiled;
}

function pushCompatibilityDiagnostic(
  assertionName: DeclarativeAssertionName,
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  const message = selectorAssertionCompatibilityError(assertionName, selector, assertion);

  if (message !== undefined) {
    diagnostics.push(
      compileDiagnostic(
        "profile.compile.incompatibleSelectorAssertion",
        message,
        ruleId,
      ),
    );

    return false;
  }

  return true;
}

function optionalString<TKey extends string>(
  key: TKey,
  value: string | undefined,
): Record<TKey, string> | Record<string, never> {
  return value === undefined ? {} : ({ [key]: value } as Record<TKey, string>);
}

function optionalStringArray<TKey extends string>(
  key: TKey,
  value: readonly string[] | undefined,
): Record<TKey, readonly string[]> | Record<string, never> {
  return value === undefined
    ? {}
    : ({ [key]: value } as Record<TKey, readonly string[]>);
}

function hasTextPredicate(assertion: DeclarativeAssertion["text"]): boolean {
  return (
    assertion?.contains !== undefined ||
    assertion?.containsExactlyOne !== undefined ||
    (assertion?.excludes !== undefined && assertion.excludes.length > 0)
  );
}
