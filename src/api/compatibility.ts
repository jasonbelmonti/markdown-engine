import type { EngineDocumentVersion } from "./document.js";
import type { NormalizeResult } from "./normalize.js";
import type { ParseResult } from "./parse.js";
import { isPlainRecord } from "../internal/plain-record.js";

export type EngineCompatibilityMode = "default" | "legacy-0.1";

export class EngineCompatibilityError extends Error {
  readonly code = "engine.compatibility.versionMismatch";
  readonly requestedMode: EngineCompatibilityMode;
  readonly expectedVersion: EngineDocumentVersion;
  readonly actualVersion: string;

  constructor(details: {
    requestedMode: EngineCompatibilityMode;
    expectedVersion: EngineDocumentVersion;
    actualVersion: string;
  }) {
    super(
      `Compatibility mode "${details.requestedMode}" expects document version "${details.expectedVersion}" but received "${details.actualVersion}".`,
    );
    this.name = "EngineCompatibilityError";
    this.requestedMode = details.requestedMode;
    this.expectedVersion = details.expectedVersion;
    this.actualVersion = details.actualVersion;
  }
}

const expectedVersionByCompatibilityMode = {
  default: "1.0.0",
  "legacy-0.1": "0.0.0",
} satisfies Record<EngineCompatibilityMode, EngineDocumentVersion>;

export function assertCompatibleResultVersion(
  result: unknown,
  requestedMode: EngineCompatibilityMode,
): void {
  const actualVersion = documentVersionFromPublicResult(result);

  if (actualVersion === undefined) {
    return;
  }

  const expectedVersion = expectedVersionByCompatibilityMode[requestedMode];

  if (actualVersion !== expectedVersion) {
    throw new EngineCompatibilityError({
      requestedMode,
      expectedVersion,
      actualVersion,
    });
  }
}

function documentVersionFromPublicResult(value: unknown): string | undefined {
  const rootDocumentVersion = documentVersionFromPublicDocument(value);

  if (rootDocumentVersion !== undefined) {
    return rootDocumentVersion;
  }

  return versionFromNormalizeResult(value) ?? versionFromParseResult(value);
}

function versionFromNormalizeResult(value: unknown): string | undefined {
  const result = value as Partial<NormalizeResult>;

  return documentVersionFromPublicDocument(result.document);
}

function versionFromParseResult(value: unknown): string | undefined {
  const result = value as Partial<ParseResult>;

  if (!isPlainRecord(result.parsed)) {
    return undefined;
  }

  return documentVersionFromPublicDocument(result.parsed.document);
}

function documentVersionFromPublicDocument(value: unknown): string | undefined {
  if (!isPlainRecord(value) || value.kind !== "markdown-document") {
    return undefined;
  }

  return typeof value.version === "string" ? value.version : undefined;
}
