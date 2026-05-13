import type { EngineDocumentVersion } from "../api/contracts.js";
import {
  cliDocumentVersionUsageValues,
  defaultCliDocumentVersion,
  missingCliDocumentVersionMessage,
  parseCliDocumentVersion,
} from "./document-version.js";
import {
  parseValidateCliArgs,
  validateCliUsage,
  type ValidateCliArgs,
} from "./validate-args.js";

const documentVersionFlag = "--document-version";
const documentVersionAssignmentPrefix = `${documentVersionFlag}=`;
const duplicateDocumentVersionMessage =
  "Expected at most one --document-version selector.";
const validateCommand = "validate";
const fileFlag = "--file";
const fileAssignmentPrefix = `${fileFlag}=`;
const pathFlag = "--path";
const pathAssignmentPrefix = `${pathFlag}=`;

export type CliArgsResult =
  | {
      kind: "normalize";
      documentVersion: EngineDocumentVersion;
      targetPath: string;
    }
  | ValidateCliArgs
  | { kind: "help"; usage: string }
  | { kind: "error"; message: string; usage: string };

export const normalizeCliUsage = `Usage: markdown-engine [--document-version <version>] (--file <markdown-file> | --path <markdown-file>)

Runs parse and normalization for one Markdown file and writes normalized JSON.
Defaults to documentVersion "1.0.0"; use "0.0.0" for legacy output.

Options:
  --file <markdown-file>         Markdown file to process.
  --path <markdown-file>         Markdown file to process. Directories are not traversed.
  --document-version <version>   Output document version (${cliDocumentVersionUsageValues()}).
  -h, --help                     Show this help message.
`;

export const cliUsage = `${normalizeCliUsage}
${validateCliUsage}`;

export function parseCliArgs(args: string[]): CliArgsResult {
  if (args[0] === validateCommand) {
    return parseValidateCliArgs(args.slice(1));
  }

  return parseNormalizeCliArgs(args);
}

function parseNormalizeCliArgs(args: string[]): CliArgsResult {
  const targets: string[] = [];
  let documentVersion: EngineDocumentVersion | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "-h" || arg === "--help") {
      return { kind: "help", usage: cliUsage };
    }

    if (arg === fileFlag || arg === pathFlag) {
      const value = args[index + 1];

      if (value === undefined || value.startsWith("-")) {
        return normalizeError(`Missing value for ${arg}.`);
      }

      targets.push(value);
      index += 1;
      continue;
    }

    if (
      arg === documentVersionFlag ||
      arg?.startsWith(documentVersionAssignmentPrefix) === true
    ) {
      if (documentVersion !== undefined) {
        return normalizeError(duplicateDocumentVersionMessage);
      }

      const selectorValue = readDocumentVersionSelectorValue(arg, args, index);

      if (selectorValue.kind === "error") {
        return normalizeError(selectorValue.message);
      }

      const parsedDocumentVersion = parseCliDocumentVersion(selectorValue.value);

      if (parsedDocumentVersion.kind === "error") {
        return normalizeError(parsedDocumentVersion.message);
      }

      documentVersion = parsedDocumentVersion.documentVersion;
      if (selectorValue.consumesNextArg) {
        index += 1;
      }
      continue;
    }

    if (arg?.startsWith(fileAssignmentPrefix) === true) {
      targets.push(arg.slice(fileAssignmentPrefix.length));
      continue;
    }

    if (arg?.startsWith(pathAssignmentPrefix) === true) {
      targets.push(arg.slice(pathAssignmentPrefix.length));
      continue;
    }

    return normalizeError(`Unknown argument: ${arg ?? ""}`);
  }

  if (targets.length === 0) {
    return normalizeError("Expected exactly one of --file or --path.");
  }

  if (targets.length > 1) {
    return normalizeError("Expected one Markdown file target, received multiple.");
  }

  const [targetPath] = targets;

  if (targetPath === undefined || targetPath.trim() === "") {
    return normalizeError("Target path cannot be empty.");
  }

  return {
    kind: "normalize",
    documentVersion: documentVersion ?? defaultCliDocumentVersion,
    targetPath,
  };
}

function readDocumentVersionSelectorValue(
  arg: string,
  args: string[],
  index: number,
):
  | { kind: "ok"; value: string; consumesNextArg: boolean }
  | { kind: "error"; message: string } {
  if (arg.startsWith(documentVersionAssignmentPrefix)) {
    return {
      kind: "ok",
      value: arg.slice(documentVersionAssignmentPrefix.length),
      consumesNextArg: false,
    };
  }

  const value = args[index + 1];

  if (value === undefined || value.startsWith("-")) {
    return { kind: "error", message: missingCliDocumentVersionMessage };
  }

  return { kind: "ok", value, consumesNextArg: true };
}

function normalizeError(message: string): CliArgsResult {
  return { kind: "error", message, usage: normalizeCliUsage };
}
