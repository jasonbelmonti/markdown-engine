import type { SourceRange } from "../../api/diagnostics.js";
import type { CompiledDeclarativeAssertion } from "../compiler/plan.js";
import type { AssertionEvaluationContext } from "./context.js";
import type { AssertionDiagnostic } from "./diagnostics.js";
import {
  emptySelectionDiagnostic,
  validationDiagnostic,
} from "./diagnostics.js";
import {
  resolveTableColumnIdTokens,
  type TargetIdToken,
} from "./id-targets.js";
import type { IdTokenOptions } from "./id-tokens.js";

type TableColumnCoverageAssertion = Extract<
  CompiledDeclarativeAssertion,
  { kind: "tableColumnCoverage" }
>;

interface CoverageSourceId {
  value: string;
  comparisonValue: string;
  sourceRange?: SourceRange;
}

type CoverageDiagnosticKind =
  | "missingTargetSection"
  | "missingTargetColumn"
  | "missingTargetColumnId";

export function evaluateTableColumnCoverage(
  assertion: TableColumnCoverageAssertion,
  context: AssertionEvaluationContext,
): AssertionDiagnostic[] {
  const options = idTokenOptions(assertion);
  const sourceIds = sourceIdsForCoverage(assertion, context, options);

  if (sourceIds.length === 0) {
    return [emptySelectionDiagnostic(context.rule, context.assertionIndex)];
  }

  const targetResolution = resolveTableColumnIdTokens(
    context.selection.document,
    targetColumnSource(assertion),
    options,
  );

  if (targetResolution.status === "missingSection") {
    return sourceIds.map((sourceId, sourceIdOrder) =>
      missingTargetSectionDiagnostic(assertion, context, sourceId, sourceIdOrder),
    );
  }

  if (targetResolution.status === "missingColumn") {
    return sourceIds.map((sourceId, sourceIdOrder) =>
      missingTargetColumnDiagnostic(assertion, context, sourceId, sourceIdOrder),
    );
  }

  const targetComparisonValues = new Set(
    targetResolution.tokens.map((token) => token.comparisonValue),
  );
  const diagnostics: AssertionDiagnostic[] = [];

  for (const [sourceIdOrder, sourceId] of sourceIds.entries()) {
    if (targetComparisonValues.has(sourceId.comparisonValue)) {
      continue;
    }

    diagnostics.push(
      missingTargetColumnIdDiagnostic(
        assertion,
        context,
        sourceId,
        sourceIdOrder,
      ),
    );
  }

  return diagnostics;
}

function sourceIdsForCoverage(
  assertion: TableColumnCoverageAssertion,
  context: AssertionEvaluationContext,
  options: IdTokenOptions,
): CoverageSourceId[] {
  const sourceResolution = resolveTableColumnIdTokens(
    context.selection.document,
    {
      section: assertion.source.section,
      column: assertion.source.column,
    },
    options,
  );

  return sourceResolution.status === "resolved"
    ? uniqueSourceIds(sourceResolution.tokens)
    : [];
}

function uniqueSourceIds(tokens: readonly TargetIdToken[]): CoverageSourceId[] {
  const sourceIdsByComparisonValue = new Map<string, CoverageSourceId>();

  for (const token of tokens) {
    if (sourceIdsByComparisonValue.has(token.comparisonValue)) {
      continue;
    }

    sourceIdsByComparisonValue.set(token.comparisonValue, {
      value: token.value,
      comparisonValue: token.comparisonValue,
      ...(token.sourceRange !== undefined ? { sourceRange: token.sourceRange } : {}),
    });
  }

  return [...sourceIdsByComparisonValue.values()];
}

function missingTargetSectionDiagnostic(
  assertion: TableColumnCoverageAssertion,
  context: AssertionEvaluationContext,
  sourceId: CoverageSourceId,
  sourceIdOrder: number,
): AssertionDiagnostic {
  return coverageDiagnostic(
    "profile.validation.tableColumnCoverageTargetSectionMissing",
    `ID "${sourceId.value}" requires target section "${assertion.target.section}" for tableColumnCoverage.`,
    "missingTargetSection",
    assertion,
    context,
    sourceId,
    sourceIdOrder,
  );
}

function missingTargetColumnDiagnostic(
  assertion: TableColumnCoverageAssertion,
  context: AssertionEvaluationContext,
  sourceId: CoverageSourceId,
  sourceIdOrder: number,
): AssertionDiagnostic {
  return coverageDiagnostic(
    "profile.validation.tableColumnCoverageTargetColumnMissing",
    `ID "${sourceId.value}" requires target table column "${assertion.target.column}" in section "${assertion.target.section}".`,
    "missingTargetColumn",
    assertion,
    context,
    sourceId,
    sourceIdOrder,
  );
}

function missingTargetColumnIdDiagnostic(
  assertion: TableColumnCoverageAssertion,
  context: AssertionEvaluationContext,
  sourceId: CoverageSourceId,
  sourceIdOrder: number,
): AssertionDiagnostic {
  return coverageDiagnostic(
    "profile.validation.tableColumnCoverageIdMissing",
    `ID "${sourceId.value}" must appear in target table column "${assertion.target.column}" of section "${assertion.target.section}".`,
    "missingTargetColumnId",
    assertion,
    context,
    sourceId,
    sourceIdOrder,
  );
}

function coverageDiagnostic(
  code: string,
  message: string,
  kind: CoverageDiagnosticKind,
  assertion: TableColumnCoverageAssertion,
  context: AssertionEvaluationContext,
  sourceId: CoverageSourceId,
  sourceIdOrder: number,
): AssertionDiagnostic {
  return validationDiagnostic(code, message, context.rule, {
    assertionIndex: context.assertionIndex,
    targetKey: coverageTargetKey(assertion, sourceId, kind),
    diagnosticOrder: sourceIdOrder,
    ...(sourceId.sourceRange !== undefined
      ? { sourceRange: sourceId.sourceRange }
      : {}),
  });
}

function coverageTargetKey(
  assertion: TableColumnCoverageAssertion,
  sourceId: CoverageSourceId,
  kind: CoverageDiagnosticKind,
): string {
  return [
    "tableColumnCoverage",
    kind,
    sourceId.comparisonValue,
    assertion.target.section,
    tableHeaderKey(assertion),
    assertion.target.column,
  ].join(":");
}

function tableHeaderKey(assertion: TableColumnCoverageAssertion): string {
  return assertion.target.tableHeader === undefined
    ? "anyTable"
    : assertion.target.tableHeader.join("|");
}

function idTokenOptions(assertion: TableColumnCoverageAssertion): IdTokenOptions {
  return {
    caseSensitive: assertion.source.caseSensitive,
    ...(assertion.source.prefix !== undefined
      ? { prefix: assertion.source.prefix }
      : {}),
  };
}

function targetColumnSource(assertion: TableColumnCoverageAssertion): {
  section: string;
  tableHeader?: readonly string[];
  column: string;
} {
  return {
    section: assertion.target.section,
    ...(assertion.target.tableHeader !== undefined
      ? { tableHeader: assertion.target.tableHeader }
      : {}),
    column: assertion.target.column,
  };
}
