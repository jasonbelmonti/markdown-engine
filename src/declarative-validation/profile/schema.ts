import type { EngineDocumentVersion } from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import { unsupportedSyntaxVersion } from "../diagnostics/profile-config-diagnostics.js";
import type {
  DeclarativeValidationApplicability,
  DeclarativeValidationRule,
  DeclarativeValidationSeverity,
  JsonSafeValue,
  ValidationProfile,
} from "./index.js";
import { applicabilityFromValue } from "./applicability-schema.js";
import { assertionFromValue } from "./assertion-schema.js";
import { branchesFromValue } from "./group-schema.js";
import { selectorFromValue } from "./selector-schema.js";
import {
  PROFILE_SYNTAX_VERSION_V1,
  PROFILE_SYNTAX_VERSION_V2,
  isValidationProfileSyntaxVersion,
} from "./syntax-version.js";
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
const RULE_KEYS_V1 = ["id", "severity", "select", "assert"] as const;
const RULE_KEYS_V2 = [...RULE_KEYS_V1, "when", "anyOf", "allOf"] as const;

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

  const syntaxVersion = isValidationProfileSyntaxVersion(value.syntaxVersion)
    ? value.syntaxVersion
    : undefined;
  if (syntaxVersion === undefined) {
    diagnostics.push(unsupportedSyntaxVersion());
  }

  const documentVersion = documentVersionFromValue(value.documentVersion, diagnostics);
  const rules = rulesFromValue(
    value.rules,
    syntaxVersion ?? PROFILE_SYNTAX_VERSION_V1,
    diagnostics,
  );

  if (diagnostics.length > 0 || syntaxVersion === undefined || rules === undefined) {
    return { diagnostics };
  }

  return {
    profile: {
      syntaxVersion,
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
  syntaxVersion: ValidationProfile["syntaxVersion"],
  diagnostics: MarkdownDiagnostic[],
): readonly DeclarativeValidationRule[] | undefined {
  if (!Array.isArray(value)) {
    diagnostics.push(invalidShape("Profile rules must be an array."));

    return undefined;
  }

  const rules: DeclarativeValidationRule[] = [];
  const seenRuleIds = new Set<string>();

  for (const [index, item] of value.entries()) {
    const rule = ruleFromValue(item, index, syntaxVersion, diagnostics);

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
  syntaxVersion: ValidationProfile["syntaxVersion"],
  diagnostics: MarkdownDiagnostic[],
): DeclarativeValidationRule | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push(invalidShape(`Profile rule at index ${index} must be an object.`));

    return undefined;
  }

  unsupportedKeys(value, ruleKeysForSyntaxVersion(syntaxVersion), diagnostics);

  const id = nonEmptyString(value.id);
  const severity = severityFromValue(value.severity, diagnostics);

  if (id === undefined) {
    diagnostics.push(
      invalidShape(`Profile rule at index ${index} must have a non-empty id.`),
    );
  }

  if (syntaxVersion === PROFILE_SYNTAX_VERSION_V2) {
    const rule = v2RuleFromValue(
      value,
      index,
      id ?? "",
      severity,
      syntaxVersion,
      diagnostics,
    );

    return id === undefined ? undefined : rule;
  }

  const rule = flatRuleFromValue(
    value,
    id ?? "",
    severity,
    syntaxVersion,
    diagnostics,
  );

  return id === undefined ? undefined : rule;
}

function ruleKeysForSyntaxVersion(
  syntaxVersion: ValidationProfile["syntaxVersion"],
): readonly string[] {
  return syntaxVersion === PROFILE_SYNTAX_VERSION_V2
    ? RULE_KEYS_V2
    : RULE_KEYS_V1;
}

function v2RuleFromValue(
  value: Record<string, unknown>,
  index: number,
  id: string,
  severity: DeclarativeValidationSeverity | undefined,
  syntaxVersion: ValidationProfile["syntaxVersion"],
  diagnostics: MarkdownDiagnostic[],
): DeclarativeValidationRule | undefined {
  const hasFlatShapeInput = value.select !== undefined || value.assert !== undefined;
  const hasAnyOf = value.anyOf !== undefined;
  const hasAllOf = value.allOf !== undefined;
  const shapeCount =
    Number(hasFlatShapeInput) + Number(hasAnyOf) + Number(hasAllOf);
  const when =
    value.when === undefined
      ? undefined
      : applicabilityFromValue(value.when, syntaxVersion, diagnostics);

  if (value.when !== undefined && when === undefined) {
    return undefined;
  }

  if (shapeCount !== 1) {
    diagnostics.push(
      invalidShape(
        `V2 rule at index ${index} must declare exactly one of select/assert, anyOf, or allOf.`,
      ),
    );

    return undefined;
  }

  if (hasAnyOf) {
    const anyOf = branchesFromValue(value.anyOf, index, "anyOf", syntaxVersion, diagnostics);

    return anyOf === undefined
      ? undefined
      : {
          id,
          ...(severity !== undefined ? { severity } : {}),
          ...(when !== undefined ? { when } : {}),
          anyOf,
        };
  }

  if (hasAllOf) {
    const allOf = branchesFromValue(value.allOf, index, "allOf", syntaxVersion, diagnostics);

    return allOf === undefined
      ? undefined
      : {
          id,
          ...(severity !== undefined ? { severity } : {}),
          ...(when !== undefined ? { when } : {}),
          allOf,
        };
  }

  return flatRuleFromValue(value, id, severity, syntaxVersion, diagnostics, when);
}

function flatRuleFromValue(
  value: Record<string, unknown>,
  id: string,
  severity: DeclarativeValidationSeverity | undefined,
  syntaxVersion: ValidationProfile["syntaxVersion"],
  diagnostics: MarkdownDiagnostic[],
  when?: DeclarativeValidationApplicability,
): DeclarativeValidationRule | undefined {
  const select = selectorFromValue(value.select, diagnostics);
  const assert = assertionFromValue(value.assert, syntaxVersion, diagnostics);

  return select === undefined || assert === undefined
    ? undefined
    : {
        id,
        ...(severity !== undefined ? { severity } : {}),
        ...(when !== undefined ? { when } : {}),
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
