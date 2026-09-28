import type { MarkdownDiagnostic } from "../api/diagnostics.js";
import type { DeclarativeValidationCliJsonResult } from "../declarative-validation/results/index.js";
import { MARKDOWN_ENGINE_PACKAGE_VERSION } from "../internal/package-version.js";
import type { ValidationReportReference } from "./validation-report.js";

const diagnosticLimit = 10;
const severityOrder = { error: 0, warning: 1, info: 2 };

/** Project only presentation fields; validation and identity semantics are unchanged. */
export function createValidationSummary(
  result: DeclarativeValidationCliJsonResult,
  exitCode: 0 | 1,
  report?: ValidationReportReference,
) {
  const diagnostics = [...result.diagnostics]
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, diagnosticLimit)
    .map(compactDiagnostic);
  const counts = { total: result.diagnostics.length, error: 0, warning: 0, info: 0 };
  for (const diagnostic of result.diagnostics) counts[diagnostic.severity] += 1;
  const evidence = result.evidence;
  return {
    schemaVersion: "markdown-engine.validation-summary.v1",
    valid: result.valid,
    stage: "stage" in result ? result.stage : "validation",
    exitCode,
    engineVersion: MARKDOWN_ENGINE_PACKAGE_VERSION,
    runtimeVersion: process.version,
    ...(result.profile !== undefined ? { profile: result.profile } : {}),
    ...(evidence !== undefined ? {
      evidence: {
        inputHash: evidence.inputHash,
        profileHash: evidence.profileHash,
        engineVersion: evidence.engineVersion,
        runtimeVersion: evidence.runtimeVersion,
        ...(evidence.sourceLength !== undefined ? { sourceLength: evidence.sourceLength } : {}),
      },
    } : {}),
    diagnosticCounts: counts,
    diagnostics,
    diagnosticsOmitted: counts.total - diagnostics.length,
    diagnosticsTruncated: diagnostics.filter(d => d.truncatedFields.length > 0).length,
    ...(report !== undefined ? { report } : {}),
  };
}

function compactDiagnostic(diagnostic: MarkdownDiagnostic) {
  const truncatedFields: string[] = [];
  const bound = (field: string, value: string, max: number): string => {
    if (value.length <= max) return value;
    truncatedFields.push(field);
    return `${value.slice(0, max - 1)}…`;
  };
  return {
    code: bound("code", diagnostic.code, 128),
    message: bound("message", diagnostic.message, 512),
    severity: diagnostic.severity,
    ...(diagnostic.ruleId !== undefined ? { ruleId: bound("ruleId", diagnostic.ruleId, 128) } : {}),
    ...(diagnostic.sourceRange !== undefined ? { sourceRange: diagnostic.sourceRange } : {}),
    truncatedFields,
  };
}
