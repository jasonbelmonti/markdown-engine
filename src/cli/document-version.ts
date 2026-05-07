import type {
  EngineCompatibilityMode,
  EngineDocumentVersion,
} from "../api/contracts.js";

export const defaultCliDocumentVersion =
  "1.0.0" satisfies EngineDocumentVersion;

export const missingCliDocumentVersionMessage =
  "Missing value for --document-version.";

const supportedCliDocumentVersions = [
  "0.0.0",
  "1.0.0",
] as const satisfies readonly EngineDocumentVersion[];

const compatibilityModeByDocumentVersion = {
  "0.0.0": "legacy-0.1",
  "1.0.0": "default",
} satisfies Record<EngineDocumentVersion, EngineCompatibilityMode>;

export function isCliDocumentVersion(
  value: string,
): value is EngineDocumentVersion {
  return supportedCliDocumentVersions.includes(value as EngineDocumentVersion);
}

export function cliDocumentVersionUsageValues(): string {
  return supportedCliDocumentVersions.join(" | ");
}

export function parseCliDocumentVersion(
  value: string,
):
  | { kind: "ok"; documentVersion: EngineDocumentVersion }
  | { kind: "error"; message: string } {
  if (value.trim() === "") {
    return { kind: "error", message: missingCliDocumentVersionMessage };
  }

  if (!isCliDocumentVersion(value)) {
    return {
      kind: "error",
      message: `Invalid document version: ${value}. Expected one of: ${cliDocumentVersionUsageValues()}.`,
    };
  }

  return { kind: "ok", documentVersion: value };
}

export function compatibilityModeForDocumentVersion(
  documentVersion: EngineDocumentVersion,
): EngineCompatibilityMode {
  return compatibilityModeByDocumentVersion[documentVersion];
}
