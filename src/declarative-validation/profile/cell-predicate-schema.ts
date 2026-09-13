import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type { DeclarativeTableCellPredicate } from "./index.js";
import {
  invalidShape,
  optionalStringField,
  requiredNonEmptyStringField,
  unsupportedKeys,
} from "./schema-values.js";

export function cellPredicateFromValue(
  value: unknown,
  key: "where" | "rowWhere",
  diagnostics: MarkdownDiagnostic[],
): DeclarativeTableCellPredicate | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape(`Selector ${key} must be an object.`));

    return undefined;
  }

  unsupportedKeys(value, ["column", "equals", "includes"], diagnostics);

  const column = requiredNonEmptyStringField(
    value.column,
    `Selector ${key}.column`,
    diagnostics,
    (field) => `${field} must be a non-empty string.`,
  );
  if (column === undefined) {
    return undefined;
  }

  const predicate = {
    ...optionalPredicateString(value, "equals", diagnostics),
    ...optionalPredicateString(value, "includes", diagnostics),
  };

  if (predicate.equals === undefined && predicate.includes === undefined) {
    diagnostics.push(
      invalidShape(
        `Selector ${key} must include at least one of equals or includes.`,
      ),
    );

    return undefined;
  }

  return {
    column,
    ...predicate,
  };
}

function optionalPredicateString(
  record: Record<string, unknown>,
  key: "equals" | "includes",
  diagnostics: MarkdownDiagnostic[],
): Partial<Record<"equals" | "includes", string>> {
  return optionalStringField(
    record,
    key,
    diagnostics,
    (field) => `Selector ${field} must be a non-empty string when provided.`,
  );
}
