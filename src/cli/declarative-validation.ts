import { validateWithProfile } from "../api/declarative-validation.js";
import type { MarkdownDiagnostic } from "../api/diagnostics.js";
import type { EngineDocument, EngineDocumentVersion } from "../api/document.js";
import { compileValidationProfile } from "../declarative-validation/compiler/index.js";
import { parseValidationProfileInput } from "../declarative-validation/profile/index.js";
import type {
  DeclarativeOutputFormat,
  ValidationProfile,
} from "../declarative-validation/profile/index.js";
import { createDeclarativeValidationResult } from "../declarative-validation/results/index.js";
import type {
  DeclarativeValidationConfigErrorResult,
  DeclarativeValidationResult,
} from "../declarative-validation/results/index.js";
import { cloneDiagnostics, hasErrorDiagnostic } from "../diagnostics/index.js";
import { readCliFile } from "./files.js";
import { normalizeMarkdown } from "./normalize-markdown.js";
import { outputValidationResult, type ValidationOutputOptions, type ValidationOutputResult } from "./validation-output.js";

/** @internal Declarative validation CLI behavior is not part of the package API. */
export interface DeclarativeValidationCliAdapterOptions extends ValidationOutputOptions {
  cwd: string;
  filePath: string;
  profilePath: string;
  format: DeclarativeOutputFormat;
}

export type DeclarativeValidationCliAdapterResult = ValidationOutputResult;

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
    return outputValidationResult(profileStageResult(profileResult.diagnostics), 1, input);
  }

  const compileDiagnostics = compileProfileForCli(profileResult.profile);

  if (hasErrorDiagnostic(compileDiagnostics)) {
    return outputValidationResult(
      profileStageResult([...profileResult.diagnostics, ...compileDiagnostics]),
      1,
      input,
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
  const documentDiagnostics = [
    ...profileResult.diagnostics,
    ...normalizeResult.diagnostics,
  ];

  if (hasErrorDiagnostic(normalizeResult.diagnostics)) {
    return outputValidationResult(
      documentDiagnosticsResult(
        normalizeResult.document,
        profileResult.profile,
        markdown.content,
        [
          ...documentDiagnostics,
          ...documentVersionDiagnostics(
            profileResult.profile,
            normalizeResult.document.version,
          ),
        ],
      ),
      1,
      input,
    );
  }

  const validationResult = validateWithProfile(
    normalizeResult.document,
    profileResult.profile,
    { includeEvidence: true, sourceText: markdown.content },
  );
  const result = mergeDocumentDiagnostics(
    validationResult,
    documentDiagnostics,
  );

  return outputValidationResult(
    result,
    hasErrorDiagnostic(result.diagnostics) ? 1 : 0,
    input,
  );
}

function compileProfileForCli(
  profile: ValidationProfile,
): readonly MarkdownDiagnostic[] {
  return compileValidationProfile(profile).diagnostics;
}

function documentVersionDiagnostics(
  profile: ValidationProfile,
  documentVersion: EngineDocumentVersion,
): readonly MarkdownDiagnostic[] {
  const profileDocumentVersion = profile.documentVersion ?? documentVersion;

  return profileDocumentVersion === documentVersion
    ? []
    : [
        {
          code: "profile.config.documentVersionMismatch",
          message: `Profile documentVersion "${profileDocumentVersion}" does not match document version "${documentVersion}".`,
          severity: "error" as const,
        },
      ];
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
  sourceText: string,
  diagnostics: readonly MarkdownDiagnostic[],
): DeclarativeValidationResult {
  return createDeclarativeValidationResult({
    document,
    profile,
    ruleResults: [],
    diagnostics,
    options: { includeEvidence: true, sourceText },
  });
}

function mergeDocumentDiagnostics<T extends DeclarativeValidationResult>(
  validationResult: T,
  documentDiagnostics: readonly MarkdownDiagnostic[],
): T {
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
          } as T["evidence"],
        }
      : {}),
  } as T;
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
