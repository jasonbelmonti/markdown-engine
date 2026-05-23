import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import type {
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
import { compiledApplicabilityPlanFromValue } from "./applicability-plan.js";
import { compileDiagnostic } from "./diagnostics.js";
import {
  compiledGroupRuleFromValue,
  type CompiledGroupKind,
} from "./group-plans.js";
import type {
  CompiledDeclarativeValidationPlan,
  CompiledDeclarativeValidationRule,
  CompiledDeclarativeValidationRuleFields,
  CompiledDeclarativeValidationRuleV2,
  DeclarativeValidationCompileResult,
} from "./plan.js";
import { compiledRuleFieldsFromValue } from "./rule-fields.js";

export type {
  CompiledDeclarativeValidationPlan,
  CompiledDeclarativeValidationPlanV1,
  CompiledDeclarativeValidationPlanV2,
  CompiledDeclarativeValidationAnyOfRuleV2,
  CompiledDeclarativeValidationAllOfRuleV2,
  CompiledDeclarativeValidationBranchV2,
  CompiledDeclarativeValidationExecutableRule,
  CompiledDeclarativeValidationRule,
  CompiledDeclarativeValidationRuleFields,
  CompiledDeclarativeValidationRuleV2,
  CompiledDeclarativeValidationRuleV1,
  CompiledDeclarativeValidationFlatRuleV2,
  CompiledDeclarativeValidationGroupRuleV2,
  CompiledDeclarativeValidationGroupRuleFields,
  CompiledDeclarativeValidationApplicabilityPlan,
  CompiledDeclarativeAssertion,
  DeclarativeValidationCompileResult,
} from "./plan.js";

const SEVERITIES = new Set<DeclarativeValidationSeverity>([
  "error",
  "warning",
  "info",
]);
const GROUP_KINDS = ["anyOf", "allOf"] as const;

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

  const rules: CompiledDeclarativeValidationRule[] = [];
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

    const compiledRule = compiledRuleFromValue(
      rule,
      index,
      ruleId,
      severity ?? "error",
      profile.syntaxVersion,
      diagnostics,
    );

    if (compiledRule !== undefined) {
      rules.push(compiledRule);
    }
  }

  return diagnostics.length > 0
    ? { diagnostics }
    : {
        plan: compiledPlanFromRules(profile.syntaxVersion, rules),
        diagnostics,
      };
}

function compiledPlanFromRules(
  syntaxVersion: ValidationProfileSyntaxVersion,
  rules: readonly CompiledDeclarativeValidationRule[],
): CompiledDeclarativeValidationPlan {
  return syntaxVersion === PROFILE_SYNTAX_VERSION_V2
    ? {
        syntaxVersion,
        rules: rules.map((rule) => v2RulePlanFromRule(rule, syntaxVersion)),
      }
    : {
        rules: rules as readonly CompiledDeclarativeValidationRuleFields[],
      };
}

function v2RulePlanFromRule(
  rule: CompiledDeclarativeValidationRule,
  syntaxVersion: typeof PROFILE_SYNTAX_VERSION_V2,
): CompiledDeclarativeValidationRuleV2 {
  return "kind" in rule
    ? rule
    : {
        kind: "flat",
        syntaxVersion,
        ...rule,
      };
}

function compiledRuleFromValue(
  rule: Record<string, unknown>,
  ruleIndex: number,
  ruleId: string,
  severity: DeclarativeValidationSeverity,
  syntaxVersion: ValidationProfileSyntaxVersion,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeValidationRule | undefined {
  if (syntaxVersion !== PROFILE_SYNTAX_VERSION_V2) {
    return compiledRuleFieldsFromValue(
      rule.select,
      rule.assert,
      ruleId,
      severity,
      syntaxVersion,
      diagnostics,
    );
  }

  const hasFlatShapeInput = rule.select !== undefined || rule.assert !== undefined;
  const groupKind = groupKindFromRule(rule);
  const applicability =
    rule.when === undefined
      ? undefined
      : compiledApplicabilityPlanFromValue(rule.when, ruleId, severity, diagnostics);
  if (rule.when !== undefined && applicability === undefined) {
    return undefined;
  }
  const shapeCount = Number(hasFlatShapeInput) + GROUP_KINDS.reduce(
    (count, kind) => count + Number(rule[kind] !== undefined),
    0,
  );

  if (shapeCount !== 1) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        `V2 rule at index ${ruleIndex} must declare exactly one of select/assert, anyOf, or allOf.`,
        ruleId,
      ),
    );

    return undefined;
  }

  if (groupKind !== undefined) {
    const groupRule = compiledGroupRuleFromValue(
      rule[groupKind],
      groupKind,
      ruleId,
      severity,
      diagnostics,
    );

    return groupRule === undefined
      ? undefined
      : {
          ...groupRule,
          ...(applicability !== undefined ? { applicability } : {}),
        };
  }

  const fields = compiledRuleFieldsFromValue(
    rule.select,
    rule.assert,
    ruleId,
    severity,
    syntaxVersion,
    diagnostics,
  );

  return fields === undefined
    ? undefined
    : {
        kind: "flat",
        syntaxVersion: PROFILE_SYNTAX_VERSION_V2,
        ...fields,
        ...(applicability !== undefined ? { applicability } : {}),
      };
}

function groupKindFromRule(
  rule: Record<string, unknown>,
): CompiledGroupKind | undefined {
  if (rule.anyOf !== undefined) {
    return "anyOf";
  }

  return rule.allOf !== undefined ? "allOf" : undefined;
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
): Record<string, unknown> | undefined {
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
    : closedRule;
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
