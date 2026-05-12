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
  extractSectionIdTokens,
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
  comparisonValue: string;
  sourceRange?: SourceRange;
  occurrences: readonly SourceIdOccurrence[];
  definitionOccurrences: readonly SourceIdOccurrence[];
  primaryDefinitionSectionTargetId?: string;
}

interface SourceIdOccurrence {
  value: string;
  comparisonValue: string;
  occurrenceKey: string;
  definitionColumnKey?: string;
  definitionColumnHeader?: string;
  definitionColumnSignature?: string;
  definitionSourceRowKey?: string;
  definitionRowSignature?: string;
  definitionTableHeaderCount?: number;
  definitionTableKey?: string;
  sectionTitle?: string;
  sectionTargetId?: string;
  sourceRange?: SourceRange;
}

interface SourceDefinitionExclusion {
  exactOccurrenceKeys: ReadonlySet<string>;
  rowSignatures: ReadonlySet<string>;
  suppressRows: boolean;
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
  const sourceOccurrences = sourceTokens(document, assertion).map(sourceOccurrence);
  const definitionOccurrences = sourceDefinitionOccurrences(
    sourceOccurrences,
    assertion.idsFrom.column,
  );
  const configuredTargetSectionIds = targetSectionIdsForTitles(
    document,
    assertion.mustAppearIn,
  );

  return uniqueSourceIds(
    sourceOccurrences,
    definitionOccurrences,
    assertion.idsFrom.column,
    configuredTargetSectionIds,
  );
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
      target.kind === "section"
        ? extractSectionIdTokens(document, target.section, options)
        : extractTargetIdTokens(document, target, options),
    );
  }

  return resolveDeclarativeSelector(document, { target: "document" }).targets.flatMap(
    (target) => extractTargetIdTokens(document, target, options),
  );
}

function sourceOccurrence(token: TargetIdToken): SourceIdOccurrence {
  return {
    value: token.value,
    comparisonValue: token.comparisonValue,
    occurrenceKey: token.occurrenceKey,
    ...(token.definitionColumnKey !== undefined
      ? { definitionColumnKey: token.definitionColumnKey }
      : {}),
    ...(token.definitionColumnHeader !== undefined
      ? { definitionColumnHeader: token.definitionColumnHeader }
      : {}),
    ...(token.definitionColumnSignature !== undefined
      ? { definitionColumnSignature: token.definitionColumnSignature }
      : {}),
    ...(token.definitionSourceRowKey !== undefined
      ? { definitionSourceRowKey: token.definitionSourceRowKey }
      : {}),
    ...(token.definitionRowSignature !== undefined
      ? { definitionRowSignature: token.definitionRowSignature }
      : {}),
    ...(token.definitionTableHeaderCount !== undefined
      ? { definitionTableHeaderCount: token.definitionTableHeaderCount }
      : {}),
    ...(token.definitionTableKey !== undefined
      ? { definitionTableKey: token.definitionTableKey }
      : {}),
    ...(token.sectionTitle !== undefined ? { sectionTitle: token.sectionTitle } : {}),
    ...(token.sectionTargetId !== undefined
      ? { sectionTargetId: token.sectionTargetId }
      : {}),
    ...(token.sourceRange !== undefined ? { sourceRange: token.sourceRange } : {}),
  };
}

function uniqueSourceIds(
  occurrences: readonly SourceIdOccurrence[],
  definitionOccurrences: readonly SourceIdOccurrence[],
  sourceColumn: string | undefined,
  configuredTargetSectionIds: ReadonlySet<string>,
): SourceId[] {
  const occurrencesById = new Map<string, SourceIdOccurrence[]>();

  for (const occurrence of occurrences) {
    occurrencesById.set(occurrence.comparisonValue, [
      ...(occurrencesById.get(occurrence.comparisonValue) ?? []),
      occurrence,
    ]);
  }

  return [...occurrencesById.entries()].flatMap(([comparisonValue, entries]) => {
    const canonicalOccurrence = entries[0];

    if (canonicalOccurrence === undefined) {
      return [];
    }

    const definitionEntries = sourceEvidenceOccurrences(
      entries,
      sourceColumn,
    );
    const primaryDefinitionSectionTargetId =
      primaryDefinitionSectionTargetIdForOccurrences(
        definitionEntries,
        configuredTargetSectionIds,
      );
    const sourceRangeEntries = sourceRangeEvidenceOccurrences(
      entries,
      sourceColumn,
      configuredTargetSectionIds,
    );

    return [
      {
        value: canonicalOccurrence.value,
        comparisonValue,
        ...sourceRangeProperty(
          sourceRangeEntries.length > 0 ? sourceRangeEntries : entries,
        ),
        occurrences: entries,
        definitionOccurrences,
        ...(primaryDefinitionSectionTargetId !== undefined
          ? { primaryDefinitionSectionTargetId }
          : {}),
      },
    ];
  });
}

function primaryDefinitionSectionTargetIdForOccurrences(
  occurrences: readonly SourceIdOccurrence[],
  configuredTargetSectionIds: ReadonlySet<string>,
): string | undefined {
  const outsideConfiguredTargetSectionId = occurrences.find(
    (occurrence) =>
      occurrence.sectionTargetId !== undefined &&
      !configuredTargetSectionIds.has(occurrence.sectionTargetId),
  )?.sectionTargetId;

  return (
    outsideConfiguredTargetSectionId ??
    occurrences.find((occurrence) => occurrence.sectionTargetId !== undefined)
      ?.sectionTargetId
  );
}

function missingReferenceDiagnostics(
  assertion: ReferencesAssertion,
  context: AssertionEvaluationContext,
  sourceId: SourceId,
  sourceIdOrder: number,
): AssertionDiagnostic[] {
  const configuredTargetSectionIds = targetSectionIdsForTitles(
    context.selection.document,
    assertion.mustAppearIn,
  );

  return assertion.mustAppearIn.flatMap((sectionTitle, sectionOrder) => {
    const targetSections = documentQueries.sections(context.selection.document, {
      title: sectionTitle,
    });

    if (targetSections.length === 0) {
      return [
        missingReferenceDiagnostic(
          context,
          sourceId,
          sectionTitle,
          missingReferenceDiagnosticOrder(
            sourceIdOrder,
            assertion.mustAppearIn.length,
            sectionOrder,
          ),
        ),
      ];
    }

    return targetSections.flatMap((section, targetSectionOrder) => {
      if (
        sectionContainsReference(context.selection.document, section, sourceId, {
          hasExplicitSourceSection: assertion.idsFrom.section !== undefined,
          ...(assertion.idsFrom.column !== undefined
            ? { sourceColumn: assertion.idsFrom.column }
            : {}),
          targetSectionId: section.target.id,
          targetSectionIds: targetSectionIds(context.selection.document, section),
          configuredTargetSectionIds,
        })
      ) {
        return [];
      }

      return [
        missingReferenceDiagnostic(
          context,
          sourceId,
          sectionTitle,
          missingReferenceDiagnosticOrder(
            sourceIdOrder,
            assertion.mustAppearIn.length,
            sectionOrder,
            targetSectionOrder,
          ),
          section.target.id,
        ),
      ];
    });
  });
}

function missingReferenceDiagnostic(
  context: AssertionEvaluationContext,
  sourceId: SourceId,
  sectionTitle: string,
  diagnosticOrder: number,
  targetSectionId?: string,
): AssertionDiagnostic {
  return validationDiagnostic(
    "profile.validation.referenceMissing",
    `ID "${sourceId.value}" must appear in section "${sectionTitle}".`,
    context.rule,
    {
      assertionIndex: context.assertionIndex,
      targetKey: [
        "reference",
        sourceId.comparisonValue,
        sectionTitle,
        targetSectionId ?? "missing",
      ].join(":"),
      diagnosticOrder,
      ...missingReferenceSourceRange(sourceId),
    },
  );
}

function missingReferenceDiagnosticOrder(
  sourceIdOrder: number,
  sectionCount: number,
  sectionOrder: number,
  targetSectionOrder = 0,
): number {
  return (sourceIdOrder * sectionCount + sectionOrder) * 1000 + targetSectionOrder;
}

function sectionContainsReference(
  document: EngineDocument,
  section: EngineSection,
  sourceId: SourceId,
  options: {
    hasExplicitSourceSection: boolean;
    sourceColumn?: string;
    targetSectionId: string;
    targetSectionIds: ReadonlySet<string>;
    configuredTargetSectionIds: ReadonlySet<string>;
  },
): boolean {
  const sectionTokens = extractSectionBodyIdTokens(document, section);
  const matchingOccurrences = sectionTokens.filter(
    (token) => token.comparisonValue === sourceId.comparisonValue,
  );
  const definitionExclusion = sourceDefinitionExclusion(
    sourceId,
    options,
  );
  const sourceOccurrencesInSection = matchingOccurrences.filter((token) =>
    sourceDefinitionTokenMatches(token, definitionExclusion),
  ).length;

  return matchingOccurrences.length - sourceOccurrencesInSection > 0;
}

function sourceDefinitionExclusion(
  sourceId: SourceId,
  options: {
    hasExplicitSourceSection: boolean;
    sourceColumn?: string;
    targetSectionId: string;
    targetSectionIds: ReadonlySet<string>;
    configuredTargetSectionIds: ReadonlySet<string>;
  },
): SourceDefinitionExclusion {
  const definitionOccurrences = sourceDefinitionOccurrences(
    sourceId.occurrences,
    options.sourceColumn,
  );
  const targetDefinitionRows = rowExclusionSourceDefinitions(
    sourceId.definitionOccurrences,
    options.targetSectionIds,
    options.configuredTargetSectionIds,
    sourceId.primaryDefinitionSectionTargetId,
  );
  const targetDefinitionRowSignatures =
    unionSets(
      unionSets(
        rowSignaturesForOccurrences(targetDefinitionRows),
        duplicateRowSignaturesForOccurrences(
          sourceDefinitionsInSections(
            sourceId.definitionOccurrences,
            options.targetSectionIds,
          ),
        ),
      ),
      duplicateSelectedSourceRowSignatures(
        sourceDefinitionsInSections(definitionOccurrences, options.targetSectionIds),
        options.targetSectionIds,
        sourceId.primaryDefinitionSectionTargetId,
      ),
    );

  if (definitionOccurrences.length === 0) {
    return {
      exactOccurrenceKeys: occurrenceKeysInSections(
        sourceId.occurrences,
        options.targetSectionIds,
      ),
      rowSignatures: targetDefinitionRowSignatures,
      suppressRows: targetDefinitionRowSignatures.size > 0,
    };
  }

  if (options.hasExplicitSourceSection) {
    return {
      exactOccurrenceKeys: unionSets(
        unionSets(
          occurrenceKeysForOccurrences(definitionOccurrences),
          oneColumnOccurrenceKeysInSections(
            sourceId.occurrences,
            options.targetSectionIds,
            options.sourceColumn,
          ),
        ),
        occurrenceKeysInChildSections(
          sourceId.occurrences,
          options.targetSectionId,
          options.targetSectionIds,
        ),
      ),
      rowSignatures: targetDefinitionRowSignatures,
      suppressRows: targetDefinitionRowSignatures.size > 0,
    };
  }

  return {
    exactOccurrenceKeys: unionSets(
      currentTargetDefinitionKeys(
        definitionOccurrences,
        options.targetSectionIds,
        sourceId.primaryDefinitionSectionTargetId,
      ),
      oneColumnOccurrenceKeysInSections(
        sourceId.occurrences,
        options.targetSectionIds,
        options.sourceColumn,
      ),
    ),
    rowSignatures: targetDefinitionRowSignatures,
    suppressRows: true,
  };
}

function sourceDefinitionTokenMatches(
  token: TargetIdToken,
  exclusion: SourceDefinitionExclusion,
): boolean {
  if (exclusion.exactOccurrenceKeys.has(token.occurrenceKey)) {
    return true;
  }

  if (
    exclusion.suppressRows &&
    token.definitionRowSignature !== undefined &&
    exclusion.rowSignatures.has(token.definitionRowSignature)
  ) {
    return true;
  }

  return false;
}

function targetSectionIdsForTitles(
  document: EngineDocument,
  sectionTitles: readonly string[],
): ReadonlySet<string> {
  return new Set(
    sectionTitles.flatMap((sectionTitle) =>
      documentQueries
        .sections(document, { title: sectionTitle })
        .flatMap((section) => [...targetSectionIds(document, section)]),
    ),
  );
}

function targetSectionIds(
  document: EngineDocument,
  section: EngineSection,
): ReadonlySet<string> {
  return new Set([section.target.id, ...childSectionIds(document, section)]);
}

function childSectionIds(
  document: EngineDocument,
  section: EngineSection,
): string[] {
  return section.childSections.flatMap((childTarget) => {
    const childSection = documentQueries.sections(document, {
      targetId: childTarget.id,
    })[0];

    return childSection === undefined
      ? []
      : [childSection.target.id, ...childSectionIds(document, childSection)];
  });
}

function rowExclusionSourceDefinitions(
  occurrences: readonly SourceIdOccurrence[],
  targetSectionIds: ReadonlySet<string>,
  configuredTargetSectionIds: ReadonlySet<string>,
  primaryDefinitionSectionTargetId: string | undefined,
): readonly SourceIdOccurrence[] {
  return occurrences.filter(
    (occurrence) =>
      !occurrenceIsInSections(occurrence, targetSectionIds) &&
      (!occurrenceIsInSections(occurrence, configuredTargetSectionIds) ||
        occurrence.sectionTargetId === primaryDefinitionSectionTargetId),
  );
}

function currentTargetDefinitionKeys(
  occurrences: readonly SourceIdOccurrence[],
  targetSectionIds: ReadonlySet<string>,
  primaryDefinitionSectionTargetId: string | undefined,
): ReadonlySet<string> {
  const targetOccurrences = occurrences.filter(
    (occurrence) => occurrenceIsInSections(occurrence, targetSectionIds),
  );

  if (targetOccurrences.length === 0) {
    return new Set();
  }

  if (primaryDefinitionSectionTargetId !== undefined) {
    if (!targetSectionIds.has(primaryDefinitionSectionTargetId)) {
      return new Set();
    }

    if (
      hasOutsideDefinitions(occurrences, targetSectionIds) &&
      targetOccurrences.length === 1
    ) {
      return new Set();
    }

    return occurrenceKeysForOccurrences(targetOccurrences);
  }

  if (hasOutsideDefinitions(occurrences, targetSectionIds)) {
    return new Set();
  }

  return occurrenceKeysForOccurrences(targetOccurrences);
}

function hasOutsideDefinitions(
  occurrences: readonly SourceIdOccurrence[],
  targetSectionIds: ReadonlySet<string>,
): boolean {
  return occurrences.some(
    (occurrence) => !occurrenceIsInSections(occurrence, targetSectionIds),
  );
}

function sourceDefinitionsInSections(
  occurrences: readonly SourceIdOccurrence[],
  sectionTargetIds: ReadonlySet<string>,
): readonly SourceIdOccurrence[] {
  return occurrences.filter((occurrence) =>
    occurrenceIsInSections(occurrence, sectionTargetIds),
  );
}

function occurrenceKeysForOccurrences(
  occurrences: readonly SourceIdOccurrence[],
): ReadonlySet<string> {
  return new Set(occurrences.map((occurrence) => occurrence.occurrenceKey));
}

function unionSets<T>(left: ReadonlySet<T>, right: ReadonlySet<T>): ReadonlySet<T> {
  return new Set([...left, ...right]);
}

function occurrenceKeysInChildSections(
  occurrences: readonly SourceIdOccurrence[],
  sectionTargetId: string,
  sectionTargetIds: ReadonlySet<string>,
): ReadonlySet<string> {
  return new Set(
    [...occurrenceKeysInSections(occurrences, sectionTargetIds)].filter(
      (occurrenceKey) =>
        occurrences.some(
          (occurrence) =>
            occurrence.occurrenceKey === occurrenceKey &&
            occurrence.sectionTargetId !== sectionTargetId,
        ),
    ),
  );
}

function occurrenceKeysInSections(
  occurrences: readonly SourceIdOccurrence[],
  sectionTargetIds: ReadonlySet<string>,
): ReadonlySet<string> {
  return new Set(
    occurrences
      .filter(
        (occurrence) =>
          occurrence.sectionTargetId !== undefined &&
          sectionTargetIds.has(occurrence.sectionTargetId),
      )
      .map((occurrence) => occurrence.occurrenceKey),
  );
}

function oneColumnOccurrenceKeysInSections(
  occurrences: readonly SourceIdOccurrence[],
  sectionTargetIds: ReadonlySet<string>,
  sourceColumn: string | undefined,
): ReadonlySet<string> {
  return new Set(
    occurrences
      .filter(
        (occurrence) =>
          occurrence.definitionTableHeaderCount === 1 &&
          isSourceDefinitionColumn(occurrence.definitionColumnHeader, sourceColumn) &&
          occurrence.sectionTargetId !== undefined &&
          sectionTargetIds.has(occurrence.sectionTargetId),
      )
      .map((occurrence) => occurrence.occurrenceKey),
  );
}

function rowSignaturesForOccurrences(
  occurrences: readonly SourceIdOccurrence[],
): ReadonlySet<string> {
  return new Set(
    occurrences
      .map((occurrence) => occurrence.definitionRowSignature)
      .filter((signature): signature is string => signature !== undefined),
  );
}

function duplicateRowSignaturesForOccurrences(
  occurrences: readonly SourceIdOccurrence[],
): ReadonlySet<string> {
  const rowSignatureCounts = new Map<string, number>();

  for (const occurrence of occurrences) {
    if (occurrence.definitionRowSignature === undefined) {
      continue;
    }

    rowSignatureCounts.set(
      occurrence.definitionRowSignature,
      (rowSignatureCounts.get(occurrence.definitionRowSignature) ?? 0) + 1,
    );
  }

  return new Set(
    [...rowSignatureCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([signature]) => signature),
  );
}

function duplicateSelectedSourceRowSignatures(
  occurrences: readonly SourceIdOccurrence[],
  targetSectionIds: ReadonlySet<string>,
  primaryDefinitionSectionTargetId: string | undefined,
): ReadonlySet<string> {
  if (
    primaryDefinitionSectionTargetId === undefined ||
    !targetSectionIds.has(primaryDefinitionSectionTargetId)
  ) {
    return new Set();
  }

  const rowKeys = new Set(
    occurrences
      .map((occurrence) => occurrence.definitionSourceRowKey)
      .filter((rowKey): rowKey is string => rowKey !== undefined),
  );

  if (rowKeys.size <= 1) {
    return new Set();
  }

  return rowSignaturesForOccurrences(occurrences);
}

function occurrenceIsInSections(
  occurrence: SourceIdOccurrence,
  sectionTargetIds: ReadonlySet<string>,
): boolean {
  return (
    occurrence.sectionTargetId !== undefined &&
    sectionTargetIds.has(occurrence.sectionTargetId)
  );
}

function sourceEvidenceOccurrences(
  occurrences: readonly SourceIdOccurrence[],
  sourceColumn: string | undefined,
): SourceIdOccurrence[] {
  return occurrences.filter(
    (occurrence) =>
      isSourceDefinitionOccurrence(occurrence, sourceColumn) ||
      isOneColumnSourceOccurrence(occurrence, sourceColumn),
  );
}

function sourceRangeEvidenceOccurrences(
  occurrences: readonly SourceIdOccurrence[],
  sourceColumn: string | undefined,
  configuredTargetSectionIds: ReadonlySet<string>,
): SourceIdOccurrence[] {
  const structuralEvidence = sourceEvidenceOccurrences(occurrences, sourceColumn);

  if (structuralEvidence.length === 0) {
    return [];
  }

  const outsideConfiguredTargets = structuralEvidence.filter(
    (occurrence) => !occurrenceIsInSections(occurrence, configuredTargetSectionIds),
  );

  return outsideConfiguredTargets.length > 0
    ? outsideConfiguredTargets
    : structuralEvidence;
}

function sourceDefinitionOccurrences(
  occurrences: readonly SourceIdOccurrence[],
  sourceColumn: string | undefined,
): SourceIdOccurrence[] {
  const definitions: SourceIdOccurrence[] = [];

  for (const occurrence of occurrences) {
    if (
      occurrence.definitionTableKey !== undefined &&
      occurrence.definitionColumnSignature !== undefined &&
      isSourceDefinitionOccurrence(occurrence, sourceColumn)
    ) {
      definitions.push(occurrence);
    }
  }

  return definitions;
}

function isSourceDefinitionOccurrence(
  occurrence: SourceIdOccurrence,
  sourceColumn: string | undefined,
): boolean {
  return (
    isSourceDefinitionTableToken(occurrence) &&
    isSourceDefinitionColumn(occurrence.definitionColumnHeader, sourceColumn)
  );
}

function isSourceDefinitionTableToken(
  token: Pick<TargetIdToken, "definitionTableHeaderCount">,
): boolean {
  return (token.definitionTableHeaderCount ?? 0) > 1;
}

function isOneColumnSourceOccurrence(
  occurrence: SourceIdOccurrence,
  sourceColumn: string | undefined,
): boolean {
  return (
    occurrence.definitionTableHeaderCount === 1 &&
    isSourceDefinitionColumn(occurrence.definitionColumnHeader, sourceColumn)
  );
}

function isSourceDefinitionColumn(
  header: string | undefined,
  sourceColumn: string | undefined,
): boolean {
  return header === (sourceColumn ?? "ID");
}

function sourceRangeProperty(
  occurrences: readonly SourceIdOccurrence[],
): { sourceRange: SourceRange } | Record<string, never> {
  const sourceRange = occurrences.find(
    (occurrence) => occurrence.sourceRange !== undefined,
  )?.sourceRange;

  return sourceRange === undefined ? {} : { sourceRange };
}

function missingReferenceSourceRange(
  sourceId: SourceId,
): { sourceRange: SourceRange } | Record<string, never> {
  return sourceId.sourceRange === undefined
    ? {}
    : { sourceRange: sourceId.sourceRange };
}
