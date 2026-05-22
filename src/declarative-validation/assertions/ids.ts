import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { DeclarativeSelectionTarget } from "../selectors/index.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  emptySelectionDiagnostic,
  validationDiagnostic,
} from "./diagnostics.js";
import { extractTargetIdTokens, type TargetIdToken } from "./id-targets.js";
import type { SourceRange } from "../../api/diagnostics.js";

type IdsAssertion = Extract<CompiledDeclarativeAssertion, { kind: "ids" }>;

interface IdOccurrence {
  token: TargetIdToken;
  target: DeclarativeSelectionTarget;
  targetOrder: number;
  tokenOrder: number;
}

interface CollectedIds {
  duplicates: DuplicateIdOccurrence[];
  uniqueOccurrences: IdOccurrence[];
}

interface DuplicateIdOccurrence {
  firstSeen: IdOccurrence;
  repeated: IdOccurrence;
}

interface CountDiagnosticAnchor {
  target?: DeclarativeSelectionTarget;
  targetOrder: number;
  diagnosticOrder: number;
  sourceRange?: SourceRange;
}

export function evaluateIds(
  assertion: IdsAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  if (context.selection.targets.length === 0) {
    return [emptySelectionDiagnostic(context.rule, context.assertionIndex)];
  }

  const collectedIds = collectIds(assertion, context);
  const diagnostics =
    assertion.unique === true
      ? duplicateIdDiagnostics(collectedIds, context)
      : [];

  diagnostics.push(...idCountDiagnostics(assertion, collectedIds, context));

  return diagnostics;
}

function collectIds(
  assertion: IdsAssertion,
  context: AssertionEvaluationContext,
): CollectedIds {
  const seenByComparisonValue = new Map<string, IdOccurrence>();
  const uniqueOccurrences: IdOccurrence[] = [];
  const seenOccurrences = new Set<string>();
  const duplicates: DuplicateIdOccurrence[] = [];

  for (const [targetOrder, target] of context.selection.targets.entries()) {
    const tokens = extractTargetIdTokens(context.selection.document, target, {
      caseSensitive: assertion.caseSensitive,
      ...(assertion.prefix !== undefined ? { prefix: assertion.prefix } : {}),
    });

    for (const [tokenOrder, token] of tokens.entries()) {
      if (seenOccurrences.has(token.occurrenceKey)) {
        continue;
      }

      seenOccurrences.add(token.occurrenceKey);

      const currentOccurrence = {
        token,
        target,
        targetOrder,
        tokenOrder,
      };
      const firstSeen = seenByComparisonValue.get(token.comparisonValue);

      if (firstSeen === undefined) {
        seenByComparisonValue.set(token.comparisonValue, currentOccurrence);
        uniqueOccurrences.push(currentOccurrence);
        continue;
      }

      duplicates.push({ firstSeen, repeated: currentOccurrence });
    }
  }

  return { duplicates, uniqueOccurrences };
}

function duplicateIdDiagnostics(
  collectedIds: CollectedIds,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  return collectedIds.duplicates.map(({ firstSeen, repeated }) =>
    validationDiagnostic(
      "profile.validation.duplicateId",
      `ID "${repeated.token.value}" duplicates earlier ID "${firstSeen.token.value}".`,
      context.rule,
      {
        assertionIndex: context.assertionIndex,
        target: repeated.target,
        targetOrder: repeated.targetOrder,
        targetKey: duplicateIdSortKey(
          repeated.token.comparisonValue,
          repeated.targetOrder,
        ),
        diagnosticOrder: repeated.tokenOrder,
        ...(repeated.token.sourceRange !== undefined
          ? { sourceRange: repeated.token.sourceRange }
          : {}),
      },
    ),
  );
}

function idCountDiagnostics(
  assertion: IdsAssertion,
  collectedIds: CollectedIds,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  const diagnostics: AssertionDiagnostic[] = [];
  const actualCount = collectedIds.uniqueOccurrences.length;

  if (assertion.minCount !== undefined && actualCount < assertion.minCount) {
    diagnostics.push(
      idCountDiagnostic(
        "profile.validation.idCountTooLow",
        minCountMessage(assertion, assertion.minCount, actualCount),
        "min",
        minCountAnchor(collectedIds, context),
        context,
      ),
    );
  }

  if (assertion.maxCount !== undefined && actualCount > assertion.maxCount) {
    diagnostics.push(
      idCountDiagnostic(
        "profile.validation.idCountTooHigh",
        maxCountMessage(assertion, assertion.maxCount, actualCount),
        "max",
        maxCountAnchor(assertion, collectedIds, context),
        context,
      ),
    );
  }

  return diagnostics;
}

function idCountDiagnostic(
  code: "profile.validation.idCountTooLow" | "profile.validation.idCountTooHigh",
  message: string,
  boundName: "min" | "max",
  anchor: CountDiagnosticAnchor,
  context: AssertionEvaluationContext,
): AssertionDiagnostic {
  return validationDiagnostic(code, message, context.rule, {
    assertionIndex: context.assertionIndex,
    targetOrder: anchor.targetOrder,
    targetKey: idCountSortKey(boundName),
    diagnosticOrder: anchor.diagnosticOrder,
    ...(anchor.target !== undefined ? { target: anchor.target } : {}),
    ...(anchor.sourceRange !== undefined ? { sourceRange: anchor.sourceRange } : {}),
  });
}

function minCountAnchor(
  collectedIds: CollectedIds,
  context: AssertionEvaluationContext,
): CountDiagnosticAnchor {
  const firstKnownId = collectedIds.uniqueOccurrences[0];

  return firstKnownId === undefined
    ? firstSelectionTargetAnchor(context)
    : occurrenceAnchor(firstKnownId);
}

function maxCountAnchor(
  assertion: IdsAssertion,
  collectedIds: CollectedIds,
  context: AssertionEvaluationContext,
): CountDiagnosticAnchor {
  const firstExcessId =
    assertion.maxCount === undefined
      ? undefined
      : collectedIds.uniqueOccurrences[assertion.maxCount];

  return firstExcessId === undefined
    ? firstSelectionTargetAnchor(context)
    : occurrenceAnchor(firstExcessId);
}

function occurrenceAnchor(occurrence: IdOccurrence): CountDiagnosticAnchor {
  return {
    target: occurrence.target,
    targetOrder: occurrence.targetOrder,
    diagnosticOrder: occurrence.tokenOrder,
    ...(occurrence.token.sourceRange !== undefined
      ? { sourceRange: occurrence.token.sourceRange }
      : {}),
  };
}

function firstSelectionTargetAnchor(
  context: AssertionEvaluationContext,
): CountDiagnosticAnchor {
  const firstTarget = context.selection.targets[0];

  return {
    targetOrder: 0,
    diagnosticOrder: 0,
    ...(firstTarget !== undefined ? { target: firstTarget } : {}),
  };
}

function minCountMessage(
  assertion: IdsAssertion,
  expected: number,
  actual: number,
): string {
  return `Expected at least ${expected} ${uniqueIdDescription(assertion)} but found ${actual}.`;
}

function maxCountMessage(
  assertion: IdsAssertion,
  expected: number,
  actual: number,
): string {
  return `Expected at most ${expected} ${uniqueIdDescription(assertion)} but found ${actual}.`;
}

function uniqueIdDescription(assertion: IdsAssertion): string {
  return assertion.prefix === undefined
    ? "unique IDs"
    : `unique IDs matching prefix "${assertion.prefix}"`;
}

function idCountSortKey(boundName: "min" | "max"): string {
  return `id-count:${boundName}`;
}

function duplicateIdSortKey(comparisonValue: string, targetOrder: number): string {
  return `id:${comparisonValue}:${targetOrder}`;
}
