import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type {
  DeclarativeValidationApplicability,
  ValidationProfile,
} from "./index.js";
import { assertionFromValue } from "./assertion-schema.js";
import { selectorFromValue } from "./selector-schema.js";
import { invalidShape, unsupportedKeys } from "./schema-values.js";

const APPLICABILITY_KEYS = ["select", "assert"] as const;

export function applicabilityFromValue(
  value: unknown,
  syntaxVersion: ValidationProfile["syntaxVersion"],
  diagnostics: MarkdownDiagnostic[],
): DeclarativeValidationApplicability | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("Rule when must be an object."));

    return undefined;
  }

  const diagnosticCountBefore = diagnostics.length;
  unsupportedKeys(value, APPLICABILITY_KEYS, diagnostics);

  const select = selectorFromValue(value.select, diagnostics);
  const assert = assertionFromValue(value.assert, syntaxVersion, diagnostics);

  return select !== undefined &&
    assert !== undefined &&
    diagnostics.length === diagnosticCountBefore
    ? {
        select,
        assert,
      }
    : undefined;
}
