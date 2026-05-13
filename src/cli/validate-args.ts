import type { DeclarativeOutputFormat } from "../declarative-validation/profile/index.js";

const fileFlag = "--file";
const fileAssignmentPrefix = `${fileFlag}=`;
const profileFlag = "--profile";
const profileAssignmentPrefix = `${profileFlag}=`;
const formatFlag = "--format";
const formatAssignmentPrefix = `${formatFlag}=`;

export interface ValidateCliArgs {
  kind: "validate";
  filePath: string;
  format: DeclarativeOutputFormat;
  profilePath: string;
}

export type ValidateCliArgsResult =
  | ValidateCliArgs
  | { kind: "help"; usage: string }
  | { kind: "error"; message: string; usage: string };

export const validateCliUsage = `Usage: markdown-engine validate --file <markdown-file> --profile <profile-file> [--format json]

Runs declarative validation for one Markdown file and one validation profile.

Options:
  --file <markdown-file>         Markdown file to validate.
  --profile <profile-file>       Declarative validation profile to apply.
  --format json                  Output JSON. This is the default and only supported format.
  -h, --help                     Show this help message.
`;

export function parseValidateCliArgs(args: string[]): ValidateCliArgsResult {
  const filePaths: string[] = [];
  const profilePaths: string[] = [];
  let format: DeclarativeOutputFormat | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "-h" || arg === "--help") {
      return { kind: "help", usage: validateCliUsage };
    }

    if (arg === fileFlag) {
      const value = readRequiredFlagValue(arg, args, index);

      if (value.kind === "error") {
        return validateError(value.message);
      }

      filePaths.push(value.value);
      index += 1;
      continue;
    }

    if (arg?.startsWith(fileAssignmentPrefix) === true) {
      filePaths.push(arg.slice(fileAssignmentPrefix.length));
      continue;
    }

    if (arg === profileFlag) {
      const value = readRequiredFlagValue(arg, args, index);

      if (value.kind === "error") {
        return validateError(value.message);
      }

      profilePaths.push(value.value);
      index += 1;
      continue;
    }

    if (arg?.startsWith(profileAssignmentPrefix) === true) {
      profilePaths.push(arg.slice(profileAssignmentPrefix.length));
      continue;
    }

    if (arg === formatFlag) {
      if (format !== undefined) {
        return validateError("Expected at most one --format selector.");
      }

      const value = readRequiredFlagValue(arg, args, index);

      if (value.kind === "error") {
        return validateError(value.message);
      }

      const parsedFormat = parseDeclarativeOutputFormat(value.value);

      if (parsedFormat.kind === "error") {
        return validateError(parsedFormat.message);
      }

      format = parsedFormat.format;
      index += 1;
      continue;
    }

    if (arg?.startsWith(formatAssignmentPrefix) === true) {
      if (format !== undefined) {
        return validateError("Expected at most one --format selector.");
      }

      const parsedFormat = parseDeclarativeOutputFormat(
        arg.slice(formatAssignmentPrefix.length),
      );

      if (parsedFormat.kind === "error") {
        return validateError(parsedFormat.message);
      }

      format = parsedFormat.format;
      continue;
    }

    return validateError(`Unknown argument: ${arg ?? ""}`);
  }

  if (filePaths.length === 0) {
    return validateError("Expected exactly one --file target.");
  }

  if (filePaths.length > 1) {
    return validateError("Expected one Markdown file target, received multiple.");
  }

  if (profilePaths.length === 0) {
    return validateError("Expected exactly one --profile target.");
  }

  if (profilePaths.length > 1) {
    return validateError("Expected one profile file target, received multiple.");
  }

  const [filePath] = filePaths;
  const [profilePath] = profilePaths;

  if (filePath === undefined || filePath.trim() === "") {
    return validateError("File path cannot be empty.");
  }

  if (profilePath === undefined || profilePath.trim() === "") {
    return validateError("Profile path cannot be empty.");
  }

  return {
    kind: "validate",
    filePath,
    format: format ?? "json",
    profilePath,
  };
}

function readRequiredFlagValue(
  arg: string,
  args: string[],
  index: number,
): { kind: "ok"; value: string } | { kind: "error"; message: string } {
  const value = args[index + 1];

  if (value === undefined || value.startsWith("-")) {
    return { kind: "error", message: `Missing value for ${arg}.` };
  }

  return { kind: "ok", value };
}

function parseDeclarativeOutputFormat(
  value: string,
):
  | { kind: "ok"; format: DeclarativeOutputFormat }
  | { kind: "error"; message: string } {
  return value === "json"
    ? { kind: "ok", format: value }
    : {
        kind: "error",
        message: `Unsupported validation output format: ${value}.`,
      };
}

function validateError(message: string): ValidateCliArgsResult {
  return { kind: "error", message, usage: validateCliUsage };
}
