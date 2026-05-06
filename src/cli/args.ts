import type { EngineDocumentVersion } from "../api/contracts.js";
import {
  cliDocumentVersionUsageValues,
  defaultCliDocumentVersion,
  missingCliDocumentVersionMessage,
  parseCliDocumentVersion,
} from "./document-version.js";

const documentVersionFlag = "--document-version";
const documentVersionAssignmentPrefix = `${documentVersionFlag}=`;
const duplicateDocumentVersionMessage =
  "Expected at most one --document-version selector.";

export type CliArgsResult =
  | {
      kind: "run";
      documentVersion: EngineDocumentVersion;
      targetPath: string;
    }
  | { kind: "help" }
  | { kind: "error"; message: string };

export const cliUsage = `Usage: markdown-engine [--document-version <version>] (--file <markdown-file> | --path <markdown-file>)

Runs parse and normalization for one Markdown file and writes normalized JSON.
Defaults to documentVersion "1.0.0-draft"; use "0.0.0" for legacy output.

Options:
  --file <markdown-file>         Markdown file to process.
  --path <markdown-file>         Markdown file to process. Directories are not traversed.
  --document-version <version>   Output document version (${cliDocumentVersionUsageValues()}).
  -h, --help                     Show this help message.
`;

export function parseCliArgs(args: string[]): CliArgsResult {
  const targets: string[] = [];
  let documentVersion: EngineDocumentVersion | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "-h" || arg === "--help") {
      return { kind: "help" };
    }

    if (arg === "--file" || arg === "--path") {
      const value = args[index + 1];

      if (value === undefined || value.startsWith("-")) {
        return { kind: "error", message: `Missing value for ${arg}.` };
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
        return {
          kind: "error",
          message: duplicateDocumentVersionMessage,
        };
      }

      const selectorValue = readDocumentVersionSelectorValue(arg, args, index);

      if (selectorValue.kind === "error") {
        return selectorValue;
      }

      const parsedDocumentVersion = parseCliDocumentVersion(selectorValue.value);

      if (parsedDocumentVersion.kind === "error") {
        return parsedDocumentVersion;
      }

      documentVersion = parsedDocumentVersion.documentVersion;
      if (selectorValue.consumesNextArg) {
        index += 1;
      }
      continue;
    }

    if (arg?.startsWith("--file=") === true) {
      targets.push(arg.slice("--file=".length));
      continue;
    }

    if (arg?.startsWith("--path=") === true) {
      targets.push(arg.slice("--path=".length));
      continue;
    }

    return { kind: "error", message: `Unknown argument: ${arg ?? ""}` };
  }

  if (targets.length === 0) {
    return {
      kind: "error",
      message: "Expected exactly one of --file or --path.",
    };
  }

  if (targets.length > 1) {
    return {
      kind: "error",
      message: "Expected one Markdown file target, received multiple.",
    };
  }

  const [targetPath] = targets;

  if (targetPath === undefined || targetPath.trim() === "") {
    return { kind: "error", message: "Target path cannot be empty." };
  }

  return {
    kind: "run",
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
