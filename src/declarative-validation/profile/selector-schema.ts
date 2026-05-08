import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type { DeclarativeSelector } from "./index.js";
import {
  diagnostic,
  invalidShape,
  optionalString,
  optionalStringArray,
  unsupportedKeys,
} from "./schema-values.js";

export function selectorFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): DeclarativeSelector | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape("Rule select must be an object."));

    return undefined;
  }

  switch (value.target) {
    case "document":
      unsupportedKeys(value, ["target"], diagnostics);
      return { target: "document" };

    case "table":
      unsupportedKeys(value, ["target", "section", "header"], diagnostics);
      return {
        target: "table",
        ...optionalString(value, "section", diagnostics),
        ...optionalStringArray(value, "header", diagnostics),
      };

    case "textSpan":
      unsupportedKeys(
        value,
        ["target", "section", "nodeType", "textIncludes"],
        diagnostics,
      );
      return {
        target: "textSpan",
        ...optionalString(value, "section", diagnostics),
        ...optionalString(value, "nodeType", diagnostics),
        ...optionalString(value, "textIncludes", diagnostics),
      };

    default:
      diagnostics.push(
        diagnostic(
          "profile.compile.unsupportedSelector",
          `Unsupported selector target "${String(value.target)}".`,
        ),
      );

      return undefined;
  }
}
