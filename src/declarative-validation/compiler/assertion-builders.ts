import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type {
  DeclarativeAssertion,
  DeclarativeSelector,
} from "../profile/index.js";
import {
  hasEffectiveIdsPredicate,
  idsAssertionKeysForSyntaxVersion,
} from "../profile/ids-assertion-contract.js";
import {
  PROFILE_SYNTAX_VERSION_V2,
  type ValidationProfileSyntaxVersion,
} from "../profile/syntax-version.js";
import {
  type DeclarativeAssertionName,
  selectorAssertionCompatibilityError,
} from "./compatibility.js";
import { compileDiagnostic } from "./diagnostics.js";
import type { CompiledDeclarativeAssertion } from "./plan.js";
import {
  closedTableColumnCoverage,
  closedStringArray,
  hasTextPredicate,
  hasTextLengthBound,
  optionalNumber,
  optionalString,
  optionalStringArray,
  pushIdsCountShapeDiagnostics,
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
  syntaxVersion: ValidationProfileSyntaxVersion,
  diagnostics: MarkdownDiagnostic[],
) => CompiledDeclarativeAssertion | undefined;

export const ASSERTION_BUILDERS: readonly AssertionBuilder[] = [
  buildExistsAssertion,
  buildSectionsRequiredAssertion,
  buildTableColumnsRequiredAssertion,
  buildIdsAssertion,
  buildReferencesAssertion,
  buildTableColumnCoverageAssertion,
  buildTextAssertion,
  buildTextOccurrenceCountAssertion,
  buildTextLengthAssertion,
  buildFrontmatterRequiredAssertion,
];

function buildExistsAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  _syntaxVersion: ValidationProfileSyntaxVersion,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  if (assertion.exists === undefined) {
    return undefined;
  }

  if (assertion.exists !== true) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        "exists must be true.",
        ruleId,
      ),
    );

    return undefined;
  }

  if (pushCompatibilityDiagnostic("exists", selector, ruleId, diagnostics)) {
    return { kind: "exists" };
  }

  return undefined;
}

function buildSectionsRequiredAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  _syntaxVersion: ValidationProfileSyntaxVersion,
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
  _syntaxVersion: ValidationProfileSyntaxVersion,
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
  syntaxVersion: ValidationProfileSyntaxVersion,
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
    idsAssertionKeysForSyntaxVersion(syntaxVersion),
    diagnostics,
  );

  if (assertion.ids.unique !== undefined && assertion.ids.unique !== true) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        "ids.unique must be true.",
        ruleId,
      ),
    );

    return undefined;
  }

  if (!hasEffectiveIdsPredicate(assertion.ids, syntaxVersion)) {
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
    pushIdsCountShapeDiagnostics(assertion.ids, ruleId, diagnostics) &&
    pushCompatibilityDiagnostic("ids", selector, ruleId, diagnostics)
  ) {
    return {
      kind: "ids",
      caseSensitive: assertion.ids.caseSensitive ?? true,
      ...(assertion.ids.unique === true ? { unique: true as const } : {}),
      ...optionalString("prefix", assertion.ids.prefix),
      ...optionalNumber("minCount", assertion.ids.minCount),
      ...optionalNumber("maxCount", assertion.ids.maxCount),
    };
  }

  return undefined;
}

function buildReferencesAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  _syntaxVersion: ValidationProfileSyntaxVersion,
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

function buildTableColumnCoverageAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  syntaxVersion: ValidationProfileSyntaxVersion,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  if (
    assertion.tableColumnCoverage === undefined ||
    syntaxVersion !== PROFILE_SYNTAX_VERSION_V2
  ) {
    return undefined;
  }

  const tableColumnCoverage = closedTableColumnCoverage(
    assertion.tableColumnCoverage,
    ruleId,
    diagnostics,
  );

  if (
    tableColumnCoverage !== undefined &&
    pushCompatibilityDiagnostic(
      "tableColumnCoverage",
      selector,
      ruleId,
      diagnostics,
    )
  ) {
    return {
      kind: "tableColumnCoverage",
      source: {
        section: tableColumnCoverage.source.section,
        column: tableColumnCoverage.source.column,
        caseSensitive: tableColumnCoverage.source.caseSensitive ?? true,
        ...optionalString("prefix", tableColumnCoverage.source.prefix),
      },
      target: {
        section: tableColumnCoverage.target.section,
        ...(tableColumnCoverage.target.tableHeader === undefined
          ? {}
          : { tableHeader: tableColumnCoverage.target.tableHeader }),
        column: tableColumnCoverage.target.column,
      },
      require: tableColumnCoverage.require,
    };
  }

  return undefined;
}

function buildTextAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  _syntaxVersion: ValidationProfileSyntaxVersion,
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
  _syntaxVersion: ValidationProfileSyntaxVersion,
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
  _syntaxVersion: ValidationProfileSyntaxVersion,
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
  _syntaxVersion: ValidationProfileSyntaxVersion,
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
