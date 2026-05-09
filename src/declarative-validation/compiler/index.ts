import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type {
  DeclarativeValidationRule,
  DeclarativeValidationSeverity,
  ValidationProfile,
} from "../profile/index.js";
import { selectorFromValue } from "../profile/selector-schema.js";
import { compiledAssertionsFromValue } from "./assertions.js";
import { compileDiagnostic } from "./diagnostics.js";
import type { DeclarativeValidationCompileResult } from "./plan.js";

export type {
  CompiledDeclarativeAssertion,
  CompiledDeclarativeValidationPlan,
  CompiledDeclarativeValidationRule,
  DeclarativeValidationCompileResult,
} from "./plan.js";

const SEVERITIES = new Set<DeclarativeValidationSeverity>([
  "error",
  "warning",
  "info",
]);

export function compileValidationProfile(
  profile: ValidationProfile,
): DeclarativeValidationCompileResult {
  const diagnostics: MarkdownDiagnostic[] = [];
  const profileRecord = profile as unknown;
  if (!isPlainRecord(profileRecord)) {
    return {
      diagnostics: [
        {
          code: "profile.config.invalidShape",
          message: "Profile must be an object.",
          severity: "error",
        },
      ],
    };
  }

  const closedProfileRecord = closeRecordDataProperties(
    profileRecord,
    "Profile",
    diagnostics,
  );
  if (closedProfileRecord === undefined) {
    return { diagnostics };
  }

  const profileRules = profileRulesFromValue(closedProfileRecord.rules, diagnostics);
  if (profileRules === undefined) {
    return { diagnostics };
  }

  const rules = [];

  for (let index = 0; index < profileRules.length; index += 1) {
    const ruleInput = profileRules[index];
    const rule = ruleFromValue(ruleInput, index, diagnostics);
    if (rule === undefined) {
      continue;
    }

    const ruleId = ruleIdFromValue(rule.id, index, diagnostics);
    if (ruleId === undefined) {
      continue;
    }

    const severity = severityFromValue(rule.severity, ruleId, diagnostics);
    if (severity === undefined && rule.severity !== undefined) {
      continue;
    }

    const selectorInput = closeDataTree(rule.select, "Rule select", diagnostics, ruleId);
    if (selectorInput === DATA_CLOSURE_FAILED) {
      continue;
    }

    const diagnosticCountBeforeSelector = diagnostics.length;
    const selector = selectorFromValue(selectorInput, diagnostics);
    if (
      selector === undefined ||
      diagnostics.length > diagnosticCountBeforeSelector
    ) {
      continue;
    }

    const assertionInput = closeDataTree(rule.assert, "Rule assert", diagnostics, ruleId);
    if (assertionInput === DATA_CLOSURE_FAILED) {
      continue;
    }

    const diagnosticCountBeforeAssertions = diagnostics.length;
    if (!isPlainRecord(assertionInput)) {
      diagnostics.push(
        compileDiagnostic(
          "profile.config.invalidShape",
          "Rule assert must be an object.",
          ruleId,
        ),
      );

      continue;
    }

    const assertions = compiledAssertionsFromValue(
      assertionInput as ValidationProfile["rules"][number]["assert"],
      selector,
      ruleId,
      diagnostics,
    );

    if (assertions.length === 0) {
      if (diagnostics.length === diagnosticCountBeforeAssertions) {
        diagnostics.push(
          compileDiagnostic(
            "profile.config.invalidShape",
            "Rule assert must include at least one supported assertion.",
            ruleId,
          ),
        );
      }

      continue;
    }

    rules.push({
      ruleId,
      severity: severity ?? "error",
      selector,
      assertions,
    });
  }

  return diagnostics.length > 0
    ? { diagnostics }
    : {
        plan: {
          rules,
        },
        diagnostics,
      };
}

const DATA_CLOSURE_FAILED = Symbol("data-closure-failed");

type DataClosureResult = unknown | typeof DATA_CLOSURE_FAILED;

function closeDataTree(
  value: unknown,
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId?: string,
): DataClosureResult {
  if (Array.isArray(value)) {
    const values: unknown[] = [];

    for (let index = 0; index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, String(index));

      if (descriptor === undefined || !("value" in descriptor)) {
        pushDataPropertyDiagnostic(`${fieldName}[${index}]`, diagnostics, ruleId);

        return DATA_CLOSURE_FAILED;
      }

      const closedValue = closeDataTree(
        descriptor.value,
        `${fieldName}[${index}]`,
        diagnostics,
        ruleId,
      );
      if (closedValue === DATA_CLOSURE_FAILED) {
        return DATA_CLOSURE_FAILED;
      }

      values.push(closedValue);
    }

    return values;
  }

  if (isPlainRecord(value)) {
    const record = closeRecordDataProperties(value, fieldName, diagnostics, ruleId);
    if (record === undefined) {
      return DATA_CLOSURE_FAILED;
    }

    const closedRecord: Record<string, unknown> = {};

    for (const [key, propertyValue] of Object.entries(record)) {
      const closedValue = closeDataTree(
        propertyValue,
        `${fieldName}.${key}`,
        diagnostics,
        ruleId,
      );
      if (closedValue === DATA_CLOSURE_FAILED) {
        return DATA_CLOSURE_FAILED;
      }

      closedRecord[key] = closedValue;
    }

    return closedRecord;
  }

  return value;
}

function closeRecordDataProperties(
  record: Record<string, unknown>,
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId?: string,
): Record<string, unknown> | undefined {
  const closedRecord: Record<string, unknown> = {};

  for (const key of Object.keys(record)) {
    const descriptor = Object.getOwnPropertyDescriptor(record, key);

    if (descriptor === undefined || !("value" in descriptor)) {
      pushDataPropertyDiagnostic(`${fieldName}.${key}`, diagnostics, ruleId);

      return undefined;
    }

    closedRecord[key] = descriptor.value;
  }

  return closedRecord;
}

function pushDataPropertyDiagnostic(
  fieldName: string,
  diagnostics: MarkdownDiagnostic[],
  ruleId?: string,
): void {
  diagnostics.push({
    code: "profile.config.invalidShape",
    ...(ruleId !== undefined ? { ruleId } : {}),
    message: `${fieldName} must contain only data properties.`,
    severity: "error",
  });
}

function profileRulesFromValue(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): readonly unknown[] | undefined {
  if (!Array.isArray(value)) {
    diagnostics.push({
      code: "profile.config.invalidShape",
      message: "Profile rules must be an array.",
      severity: "error",
    });

    return undefined;
  }

  const rules: unknown[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));

    if (descriptor === undefined || !("value" in descriptor)) {
      diagnostics.push({
        code: "profile.config.invalidShape",
        message: "Profile rules must be a dense array.",
        severity: "error",
      });

      return undefined;
    }

    rules.push(descriptor.value);
  }

  return rules;
}

function ruleFromValue(
  value: unknown,
  index: number,
  diagnostics: MarkdownDiagnostic[],
): DeclarativeValidationRule | undefined {
  if (!isPlainRecord(value)) {
    diagnostics.push({
      code: "profile.config.invalidShape",
      message: `Profile rule at index ${index} must be an object.`,
      severity: "error",
    });

    return undefined;
  }

  return closeRecordDataProperties(
    value,
    `Profile rule at index ${index}`,
    diagnostics,
  ) as DeclarativeValidationRule | undefined;
}

function ruleIdFromValue(
  value: unknown,
  index: number,
  diagnostics: MarkdownDiagnostic[],
): string | undefined {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  diagnostics.push({
    code: "profile.config.invalidShape",
    message: `Profile rule at index ${index} must have a non-empty id.`,
    severity: "error",
  });

  return undefined;
}

function severityFromValue(
  value: unknown,
  ruleId: string,
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
    compileDiagnostic(
      "profile.config.invalidShape",
      'Rule severity must be "error", "warning", or "info" when provided.',
      ruleId,
    ),
  );

  return undefined;
}
