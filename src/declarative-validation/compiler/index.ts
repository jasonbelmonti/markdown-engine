import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type {
  DeclarativeValidationRule,
  DeclarativeValidationSeverity,
  ValidationProfile,
} from "../profile/index.js";
import {
  closeProfileDataTree,
  DATA_CLOSURE_FAILED,
} from "../profile/data-closure.js";
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

  const closedProfile = closeProfileDataTree(
    profileRecord,
    "Profile",
    diagnostics,
  );
  if (closedProfile === DATA_CLOSURE_FAILED || !isPlainRecord(closedProfile)) {
    return { diagnostics };
  }

  const profileRules = profileRulesFromValue(closedProfile.rules, diagnostics);
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

    const selectorInput = closeProfileDataTree(
      rule.select,
      "Rule select",
      diagnostics,
      ruleId,
    );
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

    const assertionInput = closeProfileDataTree(
      rule.assert,
      "Rule assert",
      diagnostics,
      ruleId,
    );
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

  const closedRule = closeProfileDataTree(
    value,
    `Profile rule at index ${index}`,
    diagnostics,
  );

  return closedRule === DATA_CLOSURE_FAILED || !isPlainRecord(closedRule)
    ? undefined
    : (closedRule as unknown as DeclarativeValidationRule);
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
