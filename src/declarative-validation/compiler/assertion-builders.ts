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
import {
  closedStringArray,
  hasTextPredicate,
  hasTextLengthBound,
  optionalNumber,
  optionalString,
  optionalStringArray,
  pushNonEmptyStringDiagnostic,
  pushObjectDiagnostic,
  pushOptionalBooleanDiagnostic,
  pushOptionalNonEmptyStringDiagnostic,
  pushSectionsRequiredOrderDiagnostic,
  pushTextLengthShapeDiagnostics,
  pushTextOccurrenceCountDiagnostic,
  pushTextShapeDiagnostics,
  pushUnsupportedKeyDiagnostics,
} from "./assertion-shapes.js";

export type AssertionBuilder = (
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
) => CompiledDeclarativeAssertion | undefined;

export const ASSERTION_BUILDERS: readonly AssertionBuilder[] = [
  buildSectionsRequiredAssertion,
  buildTableColumnsRequiredAssertion,
  buildIdsAssertion,
  buildReferencesAssertion,
  buildTextAssertion,
  buildTextOccurrenceCountAssertion,
  buildTextLengthAssertion,
  buildFrontmatterRequiredAssertion,
];

function buildSectionsRequiredAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  if (assertion.sectionsRequired === undefined) {
    return undefined;
  }

  let headings: readonly string[] | undefined;
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
    (headings = closedStringArray(
      "sectionsRequired.headings",
      assertion.sectionsRequired.headings,
      ruleId,
      diagnostics,
    )) !== undefined &&
    pushSectionsRequiredOrderDiagnostic(
      assertion.sectionsRequired.order,
      ruleId,
      diagnostics,
    ) &&
    pushCompatibilityDiagnostic(
      "sectionsRequired",
      selector,
      ruleId,
      diagnostics,
    )
  ) {
    return {
      kind: "sectionsRequired",
      headings,
      order: assertion.sectionsRequired.order ?? "none",
    };
  }

  return undefined;
}

function buildTableColumnsRequiredAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  if (assertion.tableColumnsRequired === undefined) {
    return undefined;
  }

  let columns: readonly string[] | undefined;
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
      selector,
      ruleId,
      diagnostics,
    ) &&
    (columns = closedStringArray(
      "tableColumnsRequired.columns",
      assertion.tableColumnsRequired.columns,
      ruleId,
      diagnostics,
    )) !== undefined
  ) {
    return {
      kind: "tableColumnsRequired",
      columns,
    };
  }

  return undefined;
}

function buildIdsAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  if (assertion.ids === undefined) {
    return undefined;
  }

  if (!pushObjectDiagnostic("ids", assertion.ids, ruleId, diagnostics)) {
    return undefined;
  }

  const hasSupportedKeys = pushUnsupportedKeyDiagnostics(
    assertion.ids,
    ["prefix", "unique", "caseSensitive"],
    diagnostics,
  );

  if (assertion.ids.unique !== true) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        "ids.unique must be true.",
        ruleId,
      ),
    );

    return undefined;
  }

  if (
    hasSupportedKeys &&
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
    pushCompatibilityDiagnostic("ids", selector, ruleId, diagnostics)
  ) {
    return {
      kind: "ids",
      unique: true,
      caseSensitive: assertion.ids.caseSensitive ?? true,
      ...optionalString("prefix", assertion.ids.prefix),
    };
  }

  return undefined;
}

function buildReferencesAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  if (assertion.references === undefined) {
    return undefined;
  }

  let mustAppearIn: readonly string[] | undefined;
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
    (mustAppearIn = closedStringArray(
      "references.mustAppearIn",
      assertion.references.mustAppearIn,
      ruleId,
      diagnostics,
    )) !== undefined &&
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
    pushCompatibilityDiagnostic("references", selector, ruleId, diagnostics)
  ) {
    return {
      kind: "references",
      idsFrom: {
        ...optionalString("section", assertion.references.idsFrom.section),
        ...optionalString("column", assertion.references.idsFrom.column),
        ...optionalString("prefix", assertion.references.idsFrom.prefix),
      },
      mustAppearIn,
    };
  }

  return undefined;
}

function buildTextAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  if (assertion.text === undefined) {
    return undefined;
  }

  if (
    !pushObjectDiagnostic("text", assertion.text, ruleId, diagnostics) ||
    !pushUnsupportedKeyDiagnostics(
      assertion.text,
      ["contains", "excludes"],
      diagnostics,
    ) ||
    !pushTextShapeDiagnostics(assertion.text, ruleId, diagnostics)
  ) {
    return undefined;
  }

  if (!hasTextPredicate(assertion.text)) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        "text must include contains or a non-empty excludes array.",
        ruleId,
      ),
    );

    return undefined;
  }

  if (pushCompatibilityDiagnostic("text", selector, ruleId, diagnostics)) {
    return {
      kind: "text",
      ...optionalString("contains", assertion.text.contains),
      ...optionalStringArray("excludes", assertion.text.excludes),
    };
  }

  return undefined;
}

function buildTextOccurrenceCountAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  if (assertion.textOccurrenceCount === undefined) {
    return undefined;
  }

  if (
    pushObjectDiagnostic(
      "textOccurrenceCount",
      assertion.textOccurrenceCount,
      ruleId,
      diagnostics,
    ) &&
    pushUnsupportedKeyDiagnostics(
      assertion.textOccurrenceCount,
      ["text", "count"],
      diagnostics,
    ) &&
    pushCompatibilityDiagnostic(
      "textOccurrenceCount",
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
    )
  ) {
    return {
      kind: "textOccurrenceCount",
      text: assertion.textOccurrenceCount.text,
      count: assertion.textOccurrenceCount.count,
    };
  }

  return undefined;
}

function buildTextLengthAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  if (assertion.textLength === undefined) {
    return undefined;
  }

  if (
    !pushObjectDiagnostic("textLength", assertion.textLength, ruleId, diagnostics) ||
    !pushUnsupportedKeyDiagnostics(assertion.textLength, ["min", "max"], diagnostics) ||
    !pushTextLengthShapeDiagnostics(assertion.textLength, ruleId, diagnostics)
  ) {
    return undefined;
  }

  if (!hasTextLengthBound(assertion.textLength)) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        "textLength must include min, max, or both.",
        ruleId,
      ),
    );

    return undefined;
  }

  if (pushCompatibilityDiagnostic("textLength", selector, ruleId, diagnostics)) {
    return {
      kind: "textLength",
      ...optionalNumber("min", assertion.textLength.min),
      ...optionalNumber("max", assertion.textLength.max),
    };
  }

  return undefined;
}

function buildFrontmatterRequiredAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  if (assertion.frontmatterRequired === undefined) {
    return undefined;
  }

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
      selector,
      ruleId,
      diagnostics,
    )
  ) {
    let fields: readonly string[] | undefined;
    if (
      (fields = closedStringArray(
        "frontmatterRequired.fields",
        assertion.frontmatterRequired.fields,
        ruleId,
        diagnostics,
      )) !== undefined
    ) {
      return {
        kind: "frontmatterRequired",
        fields,
      };
    }
  }

  return undefined;
}

function pushCompatibilityDiagnostic(
  assertionName: DeclarativeAssertionName,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  const message = selectorAssertionCompatibilityError(assertionName, selector);

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
