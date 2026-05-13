import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  emptySelectionDiagnostic,
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
      const occurrenceKey = idOccurrenceKey(token);

      if (occurrenceKey !== undefined && seenOccurrences.has(occurrenceKey)) {
        continue;
      }

      if (occurrenceKey !== undefined) {
        seenOccurrences.add(occurrenceKey);
      }

      const firstSeen = seenIds.get(token.comparisonValue);

      if (firstSeen === undefined) {
        seenIds.set(token.comparisonValue, {
          value: token.value,
        });
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

function idOccurrenceKey(
  token: ReturnType<typeof extractTargetIdTokens>[number],
): string | undefined {
  return token.occurrenceKey;
}

function duplicateIdSortKey(comparisonValue: string, targetOrder: number): string {
  return `id:${comparisonValue}:${targetOrder}`;
}
