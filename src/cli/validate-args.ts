import type { DeclarativeOutputFormat } from "../declarative-validation/profile/index.js";

export interface ValidateCliArgs {
  kind: "validate";
  filePath: string;
  format: DeclarativeOutputFormat;
  profilePath: string;
  output: "full" | "summary";
  reportFile?: string;
}

export type ValidateCliArgsResult =
  | ValidateCliArgs
  | { kind: "help"; usage: string }
  | { kind: "error"; message: string; usage: string };

export const validateCliUsage = `Usage: markdown-engine validate --file <markdown-file> --profile <profile-file> [--format json] [--output full|summary] [--report-file <new-file>]

Runs declarative validation for one Markdown file and one validation profile.

Options:
  --file <markdown-file>         Markdown file to validate.
  --profile <profile-file>       Declarative validation profile to apply.
  --format json                  Output JSON. This is the default and only supported format.
  --output full|summary          Full JSON (default) or a compact validation summary.
  --report-file <new-file>       Save full JSON; required for summary. Never overwrites.
  -h, --help                     Show this help message.

Summary includes at most 10 top-level diagnostics, errors first, with explicit
omission/truncation counts. The report's parent directory must already exist.

Exit status:
  0                              Validation completed with no error diagnostics.
  1                              Profile/config/compile or validation diagnostics failed.
  2                              Usage, unsupported format, unknown args, or file read/write error.
`;

export function parseValidateCliArgs(args: string[]): ValidateCliArgsResult {
  const values: Record<string, string[]> = {
    "--file": [], "--profile": [], "--format": [], "--output": [], "--report-file": [],
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]!;
    if (arg === "-h" || arg === "--help") {
      return { kind: "help", usage: validateCliUsage };
    }
    const equals = arg.indexOf("=");
    const flag = equals === -1 ? arg : arg.slice(0, equals);
    if (!Object.hasOwn(values, flag)) return validateError(`Unknown argument: ${arg}`);
    const entries = values[flag]!;
    if (flag !== "--file" && flag !== "--profile" && entries.length > 0) {
      return validateError(`Expected at most one ${flag} selector.`);
    }
    const value = equals === -1 ? args[index + 1] : arg.slice(equals + 1);
    if (value === undefined || (equals === -1 && value.startsWith("-"))) {
      return validateError(`Missing value for ${flag}.`);
    }
    if (flag === "--format" && value !== "json") {
      return validateError(`Unsupported validation output format: ${value}.`);
    }
    if (flag === "--output" && value !== "full" && value !== "summary") {
      return validateError(`Unsupported validation output mode: ${value}.`);
    }
    entries.push(value);
    if (equals === -1) index += 1;
  }

  const files = values["--file"]!;
  const profiles = values["--profile"]!;
  if (files.length === 0) return validateError("Expected exactly one --file target.");
  if (files.length > 1) return validateError("Expected one Markdown file target, received multiple.");
  if (profiles.length === 0) return validateError("Expected exactly one --profile target.");
  if (profiles.length > 1) return validateError("Expected one profile file target, received multiple.");
  const filePath = files[0]!;
  const profilePath = profiles[0]!;
  if (filePath.trim() === "") return validateError("File path cannot be empty.");
  if (profilePath.trim() === "") return validateError("Profile path cannot be empty.");
  const output = (values["--output"]![0] ?? "full") as "full" | "summary";
  const reportFile = values["--report-file"]![0];
  if (reportFile !== undefined && reportFile.trim() === "") {
    return validateError("Report file path cannot be empty.");
  }
  if (output === "summary" && reportFile === undefined) {
    return validateError("--output summary requires --report-file to retain the full result.");
  }
  return {
    kind: "validate", filePath, profilePath, format: "json", output,
    ...(reportFile !== undefined ? { reportFile } : {}),
  };
}

function validateError(message: string): ValidateCliArgsResult {
  return { kind: "error", message, usage: validateCliUsage };
}
