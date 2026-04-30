import { parseDocument } from "yaml";

import type {
  MarkdownDiagnostic,
  SourcePosition,
  SourceRange,
} from "../api/diagnostics.js";
import {
  yamlIssueToDiagnostic,
  yamlMaterializationDiagnostic,
} from "./yaml-diagnostics.js";
import type { YamlIssueLike } from "./yaml-diagnostics.js";
import { toJsonSafeValue } from "./yaml-json.js";
import {
  YAML_MATERIALIZE_OPTIONS,
  YAML_PARSE_OPTIONS,
} from "./yaml-options.js";
import { unsupportedYamlKeyDiagnostics } from "./yaml-key-policy.js";

interface ParsedYamlFrontmatter {
  value?: unknown;
  valueParsed: boolean;
  diagnostics: MarkdownDiagnostic[];
}

export function parseYamlFrontmatter(
  raw: string,
  contentStart: SourcePosition,
  fallbackRange: SourceRange,
): ParsedYamlFrontmatter {
  if (raw.trim().length === 0) {
    return {
      value: {},
      valueParsed: true,
      diagnostics: [],
    };
  }

  const document = parseDocument(raw, YAML_PARSE_OPTIONS);
  const diagnostics = yamlDocumentDiagnostics(
    document.errors,
    document.warnings,
    raw,
    contentStart,
    fallbackRange,
  );

  if (document.errors.length > 0) {
    return {
      valueParsed: false,
      diagnostics,
    };
  }

  const unsupportedKeyDiagnostics = unsupportedYamlKeyDiagnostics(
    document.contents,
    raw,
    contentStart,
    fallbackRange,
  );

  if (unsupportedKeyDiagnostics.length > 0) {
    return {
      valueParsed: false,
      diagnostics: [...diagnostics, ...unsupportedKeyDiagnostics],
    };
  }

  try {
    const value = document.toJS(YAML_MATERIALIZE_OPTIONS);
    const jsonSafe = toJsonSafeValue(value, fallbackRange);

    if (!jsonSafe.valueParsed) {
      return {
        valueParsed: false,
        diagnostics: [...diagnostics, jsonSafe.diagnostic],
      };
    }

    return {
      value: jsonSafe.value,
      valueParsed: true,
      diagnostics,
    };
  } catch (error) {
    return {
      valueParsed: false,
      diagnostics: [
        ...diagnostics,
        yamlMaterializationDiagnostic(error, fallbackRange),
      ],
    };
  }
}

function yamlDocumentDiagnostics(
  errors: readonly YamlIssueLike[],
  warnings: readonly YamlIssueLike[],
  raw: string,
  contentStart: SourcePosition,
  fallbackRange: SourceRange,
): MarkdownDiagnostic[] {
  const errorDiagnostics = errors.map((error) =>
    yamlIssueToDiagnostic(
      error,
      "frontmatter.yaml.invalid",
      "error",
      raw,
      contentStart,
      fallbackRange,
    ),
  );
  const warningDiagnostics = warnings.map((warning) =>
    yamlIssueToDiagnostic(
      warning,
      "frontmatter.yaml.warning",
      "warning",
      raw,
      contentStart,
      fallbackRange,
    ),
  );

  return [...errorDiagnostics, ...warningDiagnostics];
}
