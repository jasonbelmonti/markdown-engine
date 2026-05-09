import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import { unsupportedProfileKey } from "../diagnostics/profile-config-diagnostics.js";
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

const ASSERTION_KEYS = [
  "sectionsRequired",
  "sectionOrder",
  "tableColumnsRequired",
  "ids",
  "references",
  "text",
  "textOccurrenceCount",
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

  if (assertion.sectionsRequired !== undefined) {
    if (
      pushObjectDiagnostic(
        "sectionsRequired",
        assertion.sectionsRequired,
        ruleId,
        diagnostics,
      ) &&
      pushUnsupportedKeyDiagnostics(
        assertion.sectionsRequired,
        ["headings", "order"],
        diagnostics,
      ) &&
      pushStringArrayDiagnostic(
        "sectionsRequired.headings",
        assertion.sectionsRequired.headings,
        ruleId,
        diagnostics,
      ) &&
      pushSectionsRequiredOrderDiagnostic(
        assertion.sectionsRequired.order,
        ruleId,
        diagnostics,
      ) &&
      pushCompatibilityDiagnostic("sectionsRequired", assertion, selector, ruleId, diagnostics)
    ) {
      compiled.push({
        kind: "sectionsRequired",
        headings: assertion.sectionsRequired.headings,
        order: assertion.sectionsRequired.order ?? "none",
      });
    }
  }

  if (assertion.sectionOrder !== undefined) {
    if (
      pushObjectDiagnostic("sectionOrder", assertion.sectionOrder, ruleId, diagnostics) &&
      pushUnsupportedKeyDiagnostics(
        assertion.sectionOrder,
        ["headings"],
        diagnostics,
      ) &&
      pushStringArrayDiagnostic(
        "sectionOrder.headings",
        assertion.sectionOrder.headings,
        ruleId,
        diagnostics,
      ) &&
      pushCompatibilityDiagnostic("sectionOrder", assertion, selector, ruleId, diagnostics)
    ) {
      compiled.push({
        kind: "sectionOrder",
        headings: assertion.sectionOrder.headings,
      });
    }
  }

  if (assertion.tableColumnsRequired !== undefined) {
    if (
      pushObjectDiagnostic(
        "tableColumnsRequired",
        assertion.tableColumnsRequired,
        ruleId,
        diagnostics,
      ) &&
      pushUnsupportedKeyDiagnostics(
        assertion.tableColumnsRequired,
        ["columns"],
        diagnostics,
      ) &&
      pushCompatibilityDiagnostic(
        "tableColumnsRequired",
        assertion,
        selector,
        ruleId,
        diagnostics,
      ) &&
      pushStringArrayDiagnostic(
        "tableColumnsRequired.columns",
        assertion.tableColumnsRequired.columns,
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
    if (!pushObjectDiagnostic("ids", assertion.ids, ruleId, diagnostics)) {
      // Shape diagnostics are already recorded.
    } else if (assertion.ids.unique !== true) {
      diagnostics.push(
        compileDiagnostic(
          "profile.config.invalidShape",
          "ids.unique must be true.",
          ruleId,
        ),
      );
    } else if (
      pushUnsupportedKeyDiagnostics(
        assertion.ids,
        ["column", "prefix", "unique", "caseSensitive"],
        diagnostics,
      ) &&
      pushOptionalNonEmptyStringDiagnostic(
        "column",
        assertion.ids.column,
        ruleId,
        diagnostics,
      ) &&
      pushOptionalNonEmptyStringDiagnostic(
        "prefix",
        assertion.ids.prefix,
        ruleId,
        diagnostics,
      ) &&
      pushOptionalBooleanDiagnostic(
        "caseSensitive",
        assertion.ids.caseSensitive,
        ruleId,
        diagnostics,
      ) &&
      pushCompatibilityDiagnostic("ids", assertion, selector, ruleId, diagnostics)
    ) {
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
    if (
      pushObjectDiagnostic("references", assertion.references, ruleId, diagnostics) &&
      pushUnsupportedKeyDiagnostics(
        assertion.references,
        ["idsFrom", "mustAppearIn"],
        diagnostics,
      ) &&
      pushObjectDiagnostic(
        "references.idsFrom",
        assertion.references.idsFrom,
        ruleId,
        diagnostics,
      ) &&
      pushUnsupportedKeyDiagnostics(
        assertion.references.idsFrom,
        ["section", "column", "prefix"],
        diagnostics,
      ) &&
      pushStringArrayDiagnostic(
        "references.mustAppearIn",
        assertion.references.mustAppearIn,
        ruleId,
        diagnostics,
      ) &&
      pushOptionalNonEmptyStringDiagnostic(
        "section",
        assertion.references.idsFrom.section,
        ruleId,
        diagnostics,
      ) &&
      pushOptionalNonEmptyStringDiagnostic(
        "column",
        assertion.references.idsFrom.column,
        ruleId,
        diagnostics,
      ) &&
      pushOptionalNonEmptyStringDiagnostic(
        "prefix",
        assertion.references.idsFrom.prefix,
        ruleId,
        diagnostics,
      ) &&
      pushCompatibilityDiagnostic("references", assertion, selector, ruleId, diagnostics)
    ) {
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
    if (
      pushObjectDiagnostic("text", assertion.text, ruleId, diagnostics) &&
      pushUnsupportedKeyDiagnostics(
        assertion.text,
        ["column", "contains", "containsExactlyOne", "excludes"],
        diagnostics,
      ) &&
      pushTextShapeDiagnostics(assertion.text, ruleId, diagnostics)
    ) {
      if (!hasTextPredicate(assertion.text)) {
        diagnostics.push(
          compileDiagnostic(
            "profile.config.invalidShape",
            "text must include contains, containsExactlyOne, or a non-empty excludes array.",
            ruleId,
          ),
        );
      } else if (
        pushCompatibilityDiagnostic("text", assertion, selector, ruleId, diagnostics)
      ) {
        compiled.push({
          kind: "text",
          ...optionalString("column", assertion.text.column),
          ...optionalString("contains", assertion.text.contains),
          ...optionalString("containsExactlyOne", assertion.text.containsExactlyOne),
          ...optionalStringArray("excludes", assertion.text.excludes),
        });
      }
    }
  }

  if (assertion.textOccurrenceCount !== undefined) {
    if (
      pushObjectDiagnostic(
        "textOccurrenceCount",
        assertion.textOccurrenceCount,
        ruleId,
        diagnostics,
      ) &&
      pushUnsupportedKeyDiagnostics(
        assertion.textOccurrenceCount,
        ["text", "count", "column"],
        diagnostics,
      ) &&
      pushCompatibilityDiagnostic(
        "textOccurrenceCount",
        assertion,
        selector,
        ruleId,
        diagnostics,
      ) &&
      pushNonEmptyStringDiagnostic(
        "textOccurrenceCount.text",
        assertion.textOccurrenceCount.text,
        ruleId,
        diagnostics,
      ) &&
      pushTextOccurrenceCountDiagnostic(
        assertion.textOccurrenceCount.count,
        ruleId,
        diagnostics,
      ) &&
      pushOptionalNonEmptyStringDiagnostic(
        "column",
        assertion.textOccurrenceCount.column,
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
      pushObjectDiagnostic(
        "frontmatterRequired",
        assertion.frontmatterRequired,
        ruleId,
        diagnostics,
      ) &&
      pushUnsupportedKeyDiagnostics(
        assertion.frontmatterRequired,
        ["fields"],
        diagnostics,
      ) &&
      pushCompatibilityDiagnostic(
        "frontmatterRequired",
        assertion,
        selector,
        ruleId,
        diagnostics,
      )
    ) {
      if (
        pushStringArrayDiagnostic(
          "frontmatterRequired.fields",
          assertion.frontmatterRequired.fields,
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

function pushUnsupportedKeyDiagnostics(
  record: object,
  allowedKeys: readonly string[],
  diagnostics: MarkdownDiagnostic[],
): boolean {
  const diagnosticCountBefore = diagnostics.length;

  for (const key of Object.keys(record)) {
    if (!allowedKeys.includes(key)) {
      diagnostics.push(unsupportedProfileKey(key));
    }
  }

  return diagnostics.length === diagnosticCountBefore;
}

function pushObjectDiagnostic(
  fieldName: string,
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  if (isPlainRecord(value)) {
    return true;
  }

  diagnostics.push(
    compileDiagnostic(
      "profile.config.invalidShape",
      `${fieldName} must be an object.`,
      ruleId,
    ),
  );

  return false;
}

function pushTextShapeDiagnostics(
  assertion: DeclarativeAssertion["text"],
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  let valid = true;

  if (
    assertion?.column !== undefined &&
    !pushOptionalNonEmptyStringDiagnostic(
      "column",
      assertion.column,
      ruleId,
      diagnostics,
    )
  ) {
    valid = false;
  }

  if (
    assertion?.contains !== undefined &&
    !pushNonEmptyStringDiagnostic("contains", assertion.contains, ruleId, diagnostics)
  ) {
    valid = false;
  }

  if (
    assertion?.containsExactlyOne !== undefined &&
    !pushNonEmptyStringDiagnostic(
      "containsExactlyOne",
      assertion.containsExactlyOne,
      ruleId,
      diagnostics,
    )
  ) {
    valid = false;
  }

  if (
    assertion?.excludes !== undefined &&
    !pushStringArrayDiagnostic("excludes", assertion.excludes, ruleId, diagnostics)
  ) {
    valid = false;
  }

  return valid;
}

function pushSectionsRequiredOrderDiagnostic(
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  if (value === undefined || value === "none" || value === "strict") {
    return true;
  }

  diagnostics.push(
    compileDiagnostic(
      "profile.config.invalidShape",
      'sectionsRequired.order must be "none" or "strict" when provided.',
      ruleId,
    ),
  );

  return false;
}

function pushTextOccurrenceCountDiagnostic(
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  if (typeof value === "number" && Number.isFinite(value)) {
    return true;
  }

  diagnostics.push(
    compileDiagnostic(
      "profile.config.invalidShape",
      "textOccurrenceCount.count must be a number.",
      ruleId,
    ),
  );

  return false;
}

function pushOptionalNonEmptyStringDiagnostic(
  fieldName: string,
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  return value === undefined
    ? true
    : pushNonEmptyStringDiagnostic(fieldName, value, ruleId, diagnostics);
}

function pushOptionalBooleanDiagnostic(
  fieldName: string,
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  if (value === undefined || typeof value === "boolean") {
    return true;
  }

  diagnostics.push(
    compileDiagnostic(
      "profile.config.invalidShape",
      `${fieldName} must be a boolean when provided.`,
      ruleId,
    ),
  );

  return false;
}

function pushNonEmptyStringDiagnostic(
  fieldName: string,
  value: unknown,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  if (typeof value === "string" && value.length > 0) {
    return true;
  }

  diagnostics.push(
    compileDiagnostic(
      "profile.config.invalidShape",
      `${fieldName} must be a non-empty string when provided.`,
      ruleId,
    ),
  );

  return false;
}

function pushStringArrayDiagnostic(
  fieldName: string,
  value: readonly string[],
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.length > 0)
  ) {
    return true;
  }

  diagnostics.push(
    compileDiagnostic(
      "profile.config.invalidShape",
      `${fieldName} must be an array of non-empty strings.`,
      ruleId,
    ),
  );

  return false;
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
