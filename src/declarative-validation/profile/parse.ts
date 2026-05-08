import { parseDocument } from "yaml";

import type { MarkdownDiagnostic, SourceRange } from "../../api/diagnostics.js";
import { yamlIssueToDiagnostic } from "../../frontmatter/yaml-diagnostics.js";
import type { YamlIssueLike } from "../../frontmatter/yaml-diagnostics.js";
import { toJsonSafeValue } from "../../frontmatter/yaml-json.js";
import {
  YAML_MATERIALIZE_OPTIONS,
  YAML_PARSE_OPTIONS,
} from "../../frontmatter/yaml-options.js";
import type {
  DeclarativeProfileParseOptions,
  DeclarativeProfileParseResult,
  JsonSafeValue,
} from "./index.js";
import { validationProfileFromValue } from "./schema.js";

type MaterializedProfileInput =
  | { parsed: true; value: JsonSafeValue; diagnostics: MarkdownDiagnostic[] }
  | { parsed: false; diagnostics: MarkdownDiagnostic[] };

export function parseValidationProfileInput(
  input: string | JsonSafeValue,
  _options: DeclarativeProfileParseOptions = {},
): DeclarativeProfileParseResult {
  const materialized = materializeInput(input);

  if (!materialized.parsed) {
    return { diagnostics: materialized.diagnostics };
  }

  const result = validationProfileFromValue(materialized.value);
  const diagnostics = [...materialized.diagnostics, ...result.diagnostics];

  return result.profile === undefined
    ? { diagnostics }
    : { profile: result.profile, diagnostics };
}

function materializeInput(input: string | JsonSafeValue): MaterializedProfileInput {
  return typeof input === "string"
    ? parseYaml(input)
    : { parsed: true, value: input, diagnostics: [] };
}

function parseYaml(raw: string): MaterializedProfileInput {
  const fallbackRange = fullInputRange(raw);
  const document = parseDocument(raw, YAML_PARSE_OPTIONS);
  const diagnostics = yamlDiagnostics(raw, fallbackRange, document.errors, document.warnings);

  if (document.errors.length > 0) {
    return { parsed: false, diagnostics };
  }

  try {
    const jsonSafe = toJsonSafeValue(
      document.toJS(YAML_MATERIALIZE_OPTIONS),
      fallbackRange,
    );

    return jsonSafe.valueParsed
      ? { parsed: true, value: jsonSafe.value, diagnostics }
      : {
          parsed: false,
          diagnostics: [
            ...diagnostics,
            profileYamlDiagnostic(
              profileYamlMessage(jsonSafe.diagnostic.message),
              jsonSafe.diagnostic.sourceRange ?? fallbackRange,
            ),
          ],
        };
  } catch (error) {
    return {
      parsed: false,
      diagnostics: [
        ...diagnostics,
        profileYamlDiagnostic(
          error instanceof Error
            ? profileYamlMessage(error.message)
            : "Validation profile YAML could not be parsed.",
          fallbackRange,
        ),
      ],
    };
  }
}

function yamlDiagnostics(
  raw: string,
  fallbackRange: SourceRange,
  errors: readonly YamlIssueLike[],
  warnings: readonly YamlIssueLike[],
): MarkdownDiagnostic[] {
  const contentStart = { line: 1, column: 1, offset: 0 };

  return [
    ...errors.map((error) =>
      yamlIssueToDiagnostic(
        error,
        "profile.config.invalidYaml",
        "error",
        raw,
        contentStart,
        fallbackRange,
      ),
    ),
    ...warnings.map((warning) =>
      yamlIssueToDiagnostic(
        warning,
        "profile.config.yamlWarning",
        "warning",
        raw,
        contentStart,
        fallbackRange,
      ),
    ),
  ];
}

function profileYamlDiagnostic(
  message: string,
  sourceRange: SourceRange,
): MarkdownDiagnostic {
  return {
    code: "profile.config.invalidYaml",
    message,
    severity: "error",
    sourceRange,
  };
}

function profileYamlMessage(message: string): string {
  return message.replaceAll("YAML frontmatter", "Validation profile YAML");
}

function fullInputRange(input: string): SourceRange {
  const lines = input.split(/\r\n|\r|\n/);
  const lastLine = lines.at(-1) ?? "";

  return {
    start: { line: 1, column: 1, offset: 0 },
    end: {
      line: lines.length,
      column: lastLine.length + 1,
      offset: input.length,
    },
  };
}
