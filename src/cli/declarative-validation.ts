import { validateWithProfile } from "../api/declarative-validation.js";
import type { MarkdownDiagnostic } from "../api/diagnostics.js";
import type { EngineDocument } from "../api/document.js";
import { compileValidationProfile } from "../declarative-validation/compiler/index.js";
import { createDeclarativeValidationEvidence } from "../declarative-validation/evidence/index.js";
import { parseValidationProfileInput } from "../declarative-validation/profile/index.js";
import type {
  DeclarativeOutputFormat,
  ValidationProfile,
} from "../declarative-validation/profile/index.js";
import type {
  DeclarativeValidationCliJsonResult,
  DeclarativeValidationConfigErrorResult,
  DeclarativeValidationResult,
} from "../declarative-validation/results/index.js";
import { cloneDiagnostics, hasErrorDiagnostic } from "../diagnostics/index.js";
import { normalizeStableJsonValue } from "../internal/stable-json.js";
import { readCliFile } from "./files.js";
import { normalizeMarkdown } from "./normalize-markdown.js";

/** @internal Declarative validation CLI behavior is not part of the package API. */
export interface DeclarativeValidationCliAdapterOptions {
  cwd: string;
  filePath: string;
  profilePath: string;
  format: DeclarativeOutputFormat;
}

export type DeclarativeValidationCliAdapterResult =
  | {
      kind: "output";
      exitCode: 0 | 1;
      output: string;
    }
  | {
      kind: "fileError";
      message: string;
    };

export async function runDeclarativeValidationCli(
  input: DeclarativeValidationCliAdapterOptions,
): Promise<DeclarativeValidationCliAdapterResult> {
  const profileText = await readValidationFile(input.profilePath, input.cwd);

  if (profileText.kind === "fileError") {
    return profileText;
  }

  const profileResult = parseValidationProfileInput(profileText.content, {
    path: input.profilePath,
  });

  if (
    profileResult.profile === undefined ||
    hasErrorDiagnostic(profileResult.diagnostics)
  ) {
    return outputResult(profileStageResult(profileResult.diagnostics), 1);
  }

  const compileDiagnostics = compileProfileForCli(profileResult.profile);

  if (hasErrorDiagnostic(compileDiagnostics)) {
    return outputResult(
      profileStageResult([...profileResult.diagnostics, ...compileDiagnostics]),
      1,
    );
  }

  const markdown = await readValidationFile(input.filePath, input.cwd);

  if (markdown.kind === "fileError") {
    return markdown;
  }

  const normalizeResult = normalizeMarkdown({
    documentVersion: "1.0.0",
    markdown: markdown.content,
    path: input.filePath,
  });

  if (hasErrorDiagnostic(normalizeResult.diagnostics)) {
    return outputResult(
      documentDiagnosticsResult(
        normalizeResult.document,
        profileResult.profile,
        normalizeResult.diagnostics,
      ),
      1,
    );
  }

  const validationResult = validateWithProfile(
    normalizeResult.document,
    profileResult.profile,
    { includeEvidence: true },
  );
  const result = mergeDocumentDiagnostics(
    validationResult,
    normalizeResult.diagnostics,
  );

  return outputResult(
    result,
    hasErrorDiagnostic(result.diagnostics) ? 1 : 0,
  );
}

function compileProfileForCli(
  profile: ValidationProfile,
): readonly MarkdownDiagnostic[] {
  return compileValidationProfile(profile).diagnostics;
}

function profileStageResult(
  diagnostics: readonly MarkdownDiagnostic[],
): DeclarativeValidationConfigErrorResult {
  return {
    valid: false,
    stage: "profile",
    diagnostics,
    ruleResults: [],
  };
}

function documentDiagnosticsResult(
  document: EngineDocument,
  profile: ValidationProfile,
  diagnostics: readonly MarkdownDiagnostic[],
): DeclarativeValidationResult {
  const clonedDiagnostics = cloneDiagnostics(diagnostics);

  return {
    valid: !hasErrorDiagnostic(clonedDiagnostics),
    diagnostics: clonedDiagnostics,
    ruleResults: [],
    profile: {
      syntaxVersion: profile.syntaxVersion,
      documentVersion: profile.documentVersion ?? document.version,
      ruleCount: profile.rules.length,
    },
    evidence: createDeclarativeValidationEvidence(
      document,
      profile,
      [],
      clonedDiagnostics,
    ),
  };
}

function mergeDocumentDiagnostics(
  validationResult: DeclarativeValidationResult,
  documentDiagnostics: readonly MarkdownDiagnostic[],
): DeclarativeValidationResult {
  if (documentDiagnostics.length === 0) {
    return validationResult;
  }

  const diagnostics = cloneDiagnostics([
    ...documentDiagnostics,
    ...validationResult.diagnostics,
  ]);

  return {
    ...validationResult,
    valid: !hasErrorDiagnostic(diagnostics),
    diagnostics,
    ...(validationResult.evidence !== undefined
      ? {
          evidence: {
            ...validationResult.evidence,
            diagnostics: cloneDiagnostics(diagnostics),
          },
        }
      : {}),
  };
}

function outputResult(
  result: DeclarativeValidationCliJsonResult,
  exitCode: 0 | 1,
): DeclarativeValidationCliAdapterResult {
  return {
    kind: "output",
    exitCode,
    output: serializeDeclarativeValidationCliJsonResult(result),
  };
}

function serializeDeclarativeValidationCliJsonResult(
  result: DeclarativeValidationCliJsonResult,
): string {
  return JSON.stringify(normalizeStableJsonValue(result), null, 2) ?? "null";
}

async function readValidationFile(
  path: string,
  cwd: string,
): Promise<
  | {
      kind: "ok";
      content: string;
    }
  | {
      kind: "fileError";
      message: string;
    }
> {
  try {
    return {
      kind: "ok",
      content: await readCliFile(path, cwd),
    };
  } catch (error) {
    return {
      kind: "fileError",
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
