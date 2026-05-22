import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  emptySelectionDiagnostic,
  unsupportedEvaluatorFeatureDiagnostic,
  validationDiagnostic,
} from "./diagnostics.js";
import { extractTargetIdTokens } from "./id-targets.js";

type IdsAssertion = Extract<CompiledDeclarativeAssertion, { kind: "ids" }>;

interface SeenId {
  value: string;
}

export function evaluateIds(
  assertion: IdsAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  if (hasIdsCountBounds(assertion)) {
    return [
      unsupportedEvaluatorFeatureDiagnostic(
        assertion.kind,
        "count bounds",
        context.rule,
        context.assertionIndex,
      ),
    ];
  }

  if (context.selection.targets.length === 0) {
    return [emptySelectionDiagnostic(context.rule, context.assertionIndex)];
  }

  const seenIds = new Map<string, SeenId>();
  const seenOccurrences = new Set<string>();
  const diagnostics: AssertionDiagnostic[] = [];

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

      const firstSeen = seenIds.get(token.comparisonValue);

      if (firstSeen === undefined) {
        seenIds.set(token.comparisonValue, { value: token.value });
        continue;
      }

      diagnostics.push(
        validationDiagnostic(
          "profile.validation.duplicateId",
          `ID "${token.value}" duplicates earlier ID "${firstSeen.value}".`,
          context.rule,
          {
            assertionIndex: context.assertionIndex,
            target,
            targetOrder,
            targetKey: duplicateIdSortKey(token.comparisonValue, targetOrder),
            diagnosticOrder: tokenOrder,
            ...(token.sourceRange !== undefined
              ? { sourceRange: token.sourceRange }
              : {}),
          },
        ),
      );
    }
  }

  return diagnostics;
}

function hasIdsCountBounds(assertion: IdsAssertion): boolean {
  return assertion.minCount !== undefined || assertion.maxCount !== undefined;
}

function duplicateIdSortKey(comparisonValue: string, targetOrder: number): string {
  return `id:${comparisonValue}:${targetOrder}`;
}
