import type { DeclarativeValidationCliJsonResult } from "../declarative-validation/results/index.js";
import { normalizeStableJsonValue } from "../internal/stable-json.js";
import { saveAutomaticValidationReport } from "./validation-report-cache.js";
import { saveValidationReport } from "./validation-report.js";
import { createValidationSummary } from "./validation-summary.js";

export interface ValidationOutputOptions {
  cwd: string;
  output?: "full" | "summary";
  reportFile?: string;
}

export type ValidationOutputResult =
  | { kind: "output"; exitCode: 0 | 1; output: string }
  | { kind: "fileError"; message: string };

export async function outputValidationResult(
  result: DeclarativeValidationCliJsonResult,
  exitCode: 0 | 1,
  options: ValidationOutputOptions,
): Promise<ValidationOutputResult> {
  const output = JSON.stringify(normalizeStableJsonValue(result), null, 2) ?? "null";
  const summary = (options.output ?? "summary") === "summary";
  try {
    const report = options.reportFile !== undefined
      ? await saveValidationReport(options.cwd, options.reportFile, `${output}\n`)
      : summary ? await saveAutomaticValidationReport(`${output}\n`) : undefined;
    if (summary && report !== undefined) {
      return {
        kind: "output", exitCode,
        output: JSON.stringify(normalizeStableJsonValue(createValidationSummary(result, exitCode, report))),
      };
    }
    return { kind: "output", exitCode, output };
  } catch (error) {
    return {
      kind: "fileError",
      message: `Unable to save validation report "${options.reportFile ?? "automatic cache"}": ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
