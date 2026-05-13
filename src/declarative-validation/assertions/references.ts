import { documentQueries } from "../../api/document-queries.js";
import type { EngineDocument, EngineSection } from "../../api/document.js";
import type { SourceRange } from "../../api/diagnostics.js";
import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import { resolveDeclarativeSelector } from "../selectors/index.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  emptySelectionDiagnostic,
  validationDiagnostic,
} from "./diagnostics.js";
import {
  extractSectionBodyIdTokens,
  extractTableColumnIdTokens,
  extractTargetIdTokens,
  type TargetIdToken,
} from "./id-targets.js";

type ReferencesAssertion = Extract<
  CompiledDeclarativeAssertion,
  { kind: "references" }
>;

interface SourceId {
  value: string;
  textOffset: number;
  segmentTargetId?: string;
  sourceRange?: SourceRange;
  excludedOccurrences: readonly SourceIdOccurrence[];
}

interface SourceIdOccurrence {
  value: string;
  textOffset: number;
  occurrenceKey?: string;
  segmentTargetId?: string;
  sourceRange?: SourceRange;
}

export function evaluateReferences(
  assertion: ReferencesAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  const sourceIds = sourceIdsForAssertion(context.selection.document, assertion);

  if (sourceIds.length === 0) {
    return [emptySelectionDiagnostic(context.rule, context.assertionIndex)];
  }

  return sourceIds.flatMap((sourceId, sourceIdOrder) =>
    missingReferenceDiagnostics(assertion, context, sourceId, sourceIdOrder),
  );
}

function sourceIdsForAssertion(
  document: EngineDocument,
  assertion: ReferencesAssertion,
): SourceId[] {
  const sourceOccurrences = sourceTokens(document, assertion).map((token) => ({
    value: token.value,
    textOffset: token.textOffset,
    ...(token.occurrenceKey !== undefined
      ? { occurrenceKey: token.occurrenceKey }
      : {}),
    ...(token.segmentTargetId !== undefined
      ? { segmentTargetId: token.segmentTargetId }
      : {}),
    ...(token.sourceRange !== undefined
      ? { sourceRange: token.sourceRange }
      : {}),
  }));

  return uniqueSourceIds(sourceOccurrences, sourceExclusionMode(assertion));
}

function sourceTokens(
  document: EngineDocument,
  assertion: ReferencesAssertion,
): TargetIdToken[] {
  const options = {
    ...(assertion.idsFrom.prefix !== undefined
      ? { prefix: assertion.idsFrom.prefix }
      : {}),
  };

  if (assertion.idsFrom.column !== undefined) {
    return extractTableColumnIdTokens(
      document,
      {
        column: assertion.idsFrom.column,
        ...(assertion.idsFrom.section !== undefined
          ? { section: assertion.idsFrom.section }
          : {}),
      },
      options,
    );
  }

  if (assertion.idsFrom.section !== undefined) {
    return resolveDeclarativeSelector(document, {
      target: "section",
      title: assertion.idsFrom.section,
    }).targets.flatMap((target) =>
      extractTargetIdTokens(document, target, options),
    );
  }

  return resolveDeclarativeSelector(document, { target: "document" }).targets.flatMap(
    (target) => extractTargetIdTokens(document, target, options),
  );
}

function uniqueSourceIds(
  occurrences: readonly SourceIdOccurrence[],
  exclusionMode: SourceExclusionMode,
): SourceId[] {
  const ids = new Map<string, SourceIdOccurrence[]>();

  for (const occurrence of occurrences) {
    ids.set(occurrence.value, [...(ids.get(occurrence.value) ?? []), occurrence]);
  }

  return [...ids.entries()].map(([value, entries]) => {
    const canonicalOccurrence = entries[0];

    return {
      value,
      textOffset: canonicalOccurrence?.textOffset ?? 0,
      ...segmentTargetIdProperty(canonicalOccurrence),
      ...sourceRangeProperty(entries),
      excludedOccurrences: excludedSourceOccurrences(entries, exclusionMode),
    };
  });
}

type SourceExclusionMode = "canonical" | "definitions" | "all";

function sourceExclusionMode(assertion: ReferencesAssertion): SourceExclusionMode {
  return assertion.idsFrom.column === undefined ? "definitions" : "all";
}

function excludedSourceOccurrences(
  occurrences: readonly SourceIdOccurrence[],
  mode: SourceExclusionMode,
): readonly SourceIdOccurrence[] {
  const canonicalOccurrence = occurrences[0];

  if (mode === "all") {
    return occurrences;
  }

  if (mode === "definitions") {
    const tableCellOccurrences = occurrences.filter(isTableCellOccurrence);

    if (tableCellOccurrences.length > 0) {
      return tableCellOccurrences;
    }
  }

  return canonicalOccurrence === undefined ? [] : [canonicalOccurrence];
}

function isTableCellOccurrence(occurrence: SourceIdOccurrence): boolean {
  return occurrence.segmentTargetId?.endsWith(":tableCell") === true;
}

function missingReferenceDiagnostics(
  assertion: ReferencesAssertion,
  context: AssertionEvaluationContext,
  sourceId: SourceId,
  sourceIdOrder: number,
): AssertionDiagnostic[] {
  return assertion.mustAppearIn.flatMap((sectionTitle, sectionOrder) => {
    const targetSections = documentQueries.sections(context.selection.document, {
      title: sectionTitle,
    });

    if (
      targetSections.some((section) =>
        sectionContainsReference(
          context.selection.document,
          section,
          sourceId,
        ),
      )
    ) {
      return [];
    }

    return [
      validationDiagnostic(
        "profile.validation.referenceMissing",
        `ID "${sourceId.value}" must appear in section "${sectionTitle}".`,
        context.rule,
        {
          assertionIndex: context.assertionIndex,
          targetKey: `reference:${sourceId.value}:${sectionTitle}`,
          diagnosticOrder:
            sourceIdOrder * assertion.mustAppearIn.length + sectionOrder,
          ...missingReferenceSourceRange(sourceId),
        },
      ),
    ];
  });
}

function sectionContainsReference(
  document: EngineDocument,
  section: EngineSection,
  sourceId: SourceId,
): boolean {
  const bodyTokens = extractSectionBodyIdTokens(document, section);
  const matchingOccurrences = bodyTokens.filter(
    (token) => token.value === sourceId.value,
  );
  const sourceOccurrencesInSection = matchingOccurrences.filter((token) =>
    sourceId.excludedOccurrences.some((occurrence) =>
      sameSourceIdOccurrence(token, occurrence),
    ),
  ).length;

  return matchingOccurrences.length - sourceOccurrencesInSection > 0;
}

function sameSourceIdOccurrence(
  token: TargetIdToken,
  occurrence: SourceIdOccurrence,
): boolean {
  if (token.value !== occurrence.value) {
    return false;
  }

  if (
    token.occurrenceKey !== undefined &&
    occurrence.occurrenceKey !== undefined
  ) {
    return token.occurrenceKey === occurrence.occurrenceKey;
  }

  return token.textOffset === occurrence.textOffset && sameSourceLocation(token, occurrence);
}

function sameSourceLocation(
  token: TargetIdToken,
  occurrence: SourceIdOccurrence,
): boolean {
  if (
    token.sourceRange !== undefined &&
    occurrence.sourceRange !== undefined &&
    sourceRangesEqual(token.sourceRange, occurrence.sourceRange)
  ) {
    return true;
  }

  return (
    token.segmentTargetId !== undefined &&
    occurrence.segmentTargetId !== undefined &&
    token.segmentTargetId === occurrence.segmentTargetId
  );
}

function sourceRangesEqual(left: SourceRange, right: SourceRange): boolean {
  return (
    left.start.line === right.start.line &&
    left.start.column === right.start.column &&
    left.start.offset === right.start.offset &&
    left.end.line === right.end.line &&
    left.end.column === right.end.column &&
    left.end.offset === right.end.offset
  );
}

function sourceRangeProperty(
  occurrences: readonly SourceIdOccurrence[],
): { sourceRange: SourceRange } | Record<string, never> {
  const sourceRange = occurrences.find(
    (occurrence) => occurrence.sourceRange !== undefined,
  )?.sourceRange;

  return sourceRange === undefined ? {} : { sourceRange };
}

function segmentTargetIdProperty(
  occurrence: SourceIdOccurrence | undefined,
): { segmentTargetId: string } | Record<string, never> {
  return occurrence?.segmentTargetId === undefined
    ? {}
    : { segmentTargetId: occurrence.segmentTargetId };
}

function missingReferenceSourceRange(
  sourceId: SourceId,
): { sourceRange: SourceRange } | Record<string, never> {
  return sourceId.sourceRange === undefined
    ? {}
    : { sourceRange: sourceId.sourceRange };
}
