import type { EngineDocumentVersion } from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import {
  PROFILE_SYNTAX_VERSION,
  unsupportedSyntaxVersion,
} from "../diagnostics/profile-config-diagnostics.js";
import type {
  DeclarativeValidationRule,
  DeclarativeValidationSeverity,
  JsonSafeValue,
  ValidationProfile,
} from "./index.js";
import { assertionFromValue } from "./assertion-schema.js";
import { selectorFromValue } from "./selector-schema.js";
import {
  invalidShape,
  nonEmptyString,
  unsupportedKeys,
} from "./schema-values.js";

const DOCUMENT_VERSIONS = new Set<EngineDocumentVersion>(["0.0.0", "1.0.0"]);
const SEVERITIES = new Set<DeclarativeValidationSeverity>([
  "error",
  "warning",
  "info",
]);

interface ProfileSchemaResult {
  profile?: ValidationProfile;
  diagnostics: MarkdownDiagnostic[];
}

export function validationProfileFromValue(
  value: JsonSafeValue,
): ProfileSchemaResult {
  if (!isPlainRecord(value)) {
    return { diagnostics: [invalidShape("Profile must be an object.")] };
  }

  const diagnostics: MarkdownDiagnostic[] = [];
  unsupportedKeys(value, ["syntaxVersion", "documentVersion", "rules"], diagnostics);

  if (value.syntaxVersion !== PROFILE_SYNTAX_VERSION) {
    diagnostics.push(unsupportedSyntaxVersion());
  }

  const documentVersion = documentVersionFromValue(value.documentVersion, diagnostics);
  const rules = rulesFromValue(value.rules, diagnostics);

  if (diagnostics.length > 0 || rules === undefined) {
    return { diagnostics };
  }

  return {
    profile: {
      syntaxVersion: PROFILE_SYNTAX_VERSION,
      ...(documentVersion !== undefined ? { documentVersion } : {}),
      rules,
    },
    diagnostics,
  };
}

function documentVersionFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): EngineDocumentVersion | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value === "string" &&
    DOCUMENT_VERSIONS.has(value as EngineDocumentVersion)
  ) {
    return value as EngineDocumentVersion;
  }

  diagnostics.push(
    invalidShape(
      "Profile documentVersion must be \"0.0.0\" or \"1.0.0\" when provided.",
    ),
  );

  return undefined;
}

function rulesFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): readonly DeclarativeValidationRule[] | undefined {
  if (!Array.isArray(value)) {
    diagnostics.push(invalidShape("Profile rules must be an array."));

    return undefined;
  }

  const rules: DeclarativeValidationRule[] = [];
  const seenRuleIds = new Set<string>();

  for (const [index, item] of value.entries()) {
    const rule = ruleFromValue(item, index, diagnostics);

    if (rule !== undefined) {
      if (seenRuleIds.has(rule.id)) {
        diagnostics.push(
          invalidShape(
            `Profile rule at index ${index} duplicates rule id "${rule.id}".`,
          ),
        );
      }

      seenRuleIds.add(rule.id);
      rules.push(rule);
    }
  }

  return rules;
}

function ruleFromValue(
  value: unknown,
  index: number,
  diagnostics: MarkdownDiagnostic[],
): DeclarativeValidationRule | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape(`Profile rule at index ${index} must be an object.`));

    return undefined;
  }

  unsupportedKeys(value, ["id", "severity", "select", "assert"], diagnostics);

  const id = nonEmptyString(value.id);
  const severity = severityFromValue(value.severity, diagnostics);
  const select = selectorFromValue(value.select, diagnostics);
  const assert = assertionFromValue(value.assert, diagnostics);

  if (id === undefined) {
    diagnostics.push(
      invalidShape(`Profile rule at index ${index} must have a non-empty id.`),
    );
  }

  return id === undefined || select === undefined || assert === undefined
    ? undefined
    : {
        id,
        ...(severity !== undefined ? { severity } : {}),
        select,
        assert,
      };
}

function severityFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): DeclarativeValidationSeverity | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value === "string" &&
    SEVERITIES.has(value as DeclarativeValidationSeverity)
  ) {
    return value as DeclarativeValidationSeverity;
  }

  diagnostics.push(
    invalidShape(
      "Rule severity must be \"error\", \"warning\", or \"info\" when provided.",
    ),
  );

  return undefined;
}
