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
import { pushDirectProfileUnsupportedKeyDiagnostics } from "../profile/direct-profile-diagnostics.js";
import { selectorFromValue } from "../profile/selector-schema.js";
import {
  PROFILE_SYNTAX_VERSION_V2,
  type ValidationProfileSyntaxVersion,
} from "../profile/syntax-version.js";
import { compiledAssertionsFromValue } from "./assertions.js";
import { compileDiagnostic } from "./diagnostics.js";
import type {
  CompiledDeclarativeValidationPlan,
  CompiledDeclarativeValidationRuleFields,
  DeclarativeValidationCompileResult,
} from "./plan.js";

export type {
  CompiledDeclarativeValidationPlan,
  CompiledDeclarativeValidationPlanV1,
  CompiledDeclarativeValidationPlanV2,
  CompiledDeclarativeValidationRule,
  CompiledDeclarativeValidationRuleFields,
  CompiledDeclarativeValidationRuleV1,
  CompiledDeclarativeValidationFlatRuleV2,
  CompiledDeclarativeAssertion,
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
  if (pushDirectProfileUnsupportedKeyDiagnostics(profile, diagnostics)) {
    return { diagnostics };
  }

  const closedProfile = closeProfileDataTree(
    profile as unknown,
    "Profile",
    diagnostics,
  );
  if (closedProfile === DATA_CLOSURE_FAILED) {
    return { diagnostics };
  }
  if (!isPlainRecord(closedProfile)) {
    return {
      diagnostics: [
        ...diagnostics,
        {
          code: "profile.config.invalidShape",
          message: "Profile must be an object.",
          severity: "error" as const,
        },
      ],
    };
  }

  const profileRules = profileRulesFromValue(closedProfile.rules, diagnostics);
  if (profileRules === undefined) {
    return { diagnostics };
  }

  const rules: CompiledDeclarativeValidationRuleFields[] = [];
  const seenRuleIds = new Set<string>();

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
    if (seenRuleIds.has(ruleId)) {
      diagnostics.push({
        code: "profile.config.invalidShape",
        message: `Profile rule at index ${index} duplicates rule id "${ruleId}".`,
        severity: "error",
      });

      continue;
    }

    seenRuleIds.add(ruleId);

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
      profile.syntaxVersion,
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
        plan: compiledPlanFromRuleFields(profile.syntaxVersion, rules),
        diagnostics,
      };
}

function compiledPlanFromRuleFields(
  syntaxVersion: ValidationProfileSyntaxVersion,
  rules: readonly CompiledDeclarativeValidationRuleFields[],
): CompiledDeclarativeValidationPlan {
  return syntaxVersion === PROFILE_SYNTAX_VERSION_V2
    ? {
        syntaxVersion,
        rules: rules.map((rule) => ({
          kind: "flat",
          syntaxVersion,
          ...rule,
        })),
      }
    : {
        rules,
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
