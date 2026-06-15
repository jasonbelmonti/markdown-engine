import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type {
  DeclarativeFrontmatterFieldShape,
  DeclarativeFrontmatterPresence,
  DeclarativeSelector,
  DeclarativeValidationSeverity,
} from "../profile/index.js";
import type { PROFILE_SYNTAX_VERSION_V2 } from "../profile/syntax-version.js";

/** @internal Private compiled plans must not be exported from the package root. */
export type CompiledDeclarativeValidationPlan =
  | CompiledDeclarativeValidationPlanV1
  | CompiledDeclarativeValidationPlanV2;

/** @internal */
export interface CompiledDeclarativeValidationPlanV1 {
  rules: readonly CompiledDeclarativeValidationRuleV1[];
}

/** @internal */
export interface CompiledDeclarativeValidationPlanV2 {
  syntaxVersion: typeof PROFILE_SYNTAX_VERSION_V2;
  rules: readonly CompiledDeclarativeValidationRuleV2[];
}

/** @internal Private rule-plan records are owned by the compiler package. */
export type CompiledDeclarativeValidationRule =
  | CompiledDeclarativeValidationExecutableRule
  | CompiledDeclarativeValidationGroupRuleV2;

/** @internal */
export type CompiledDeclarativeValidationExecutableRule =
  | CompiledDeclarativeValidationRuleV1
  | CompiledDeclarativeValidationFlatRuleV2;

/** @internal */
export type CompiledDeclarativeValidationRuleV2 =
  | CompiledDeclarativeValidationFlatRuleV2
  | CompiledDeclarativeValidationGroupRuleV2;

/** @internal */
export type CompiledDeclarativeValidationRuleV1 =
  CompiledDeclarativeValidationRuleFields;

/** @internal */
export interface CompiledDeclarativeValidationFlatRuleV2
  extends CompiledDeclarativeValidationRuleFields,
    CompiledDeclarativeValidationApplicabilityOwnerV2 {
  kind: "flat";
  syntaxVersion: typeof PROFILE_SYNTAX_VERSION_V2;
}

/** @internal */
export type CompiledDeclarativeValidationGroupRuleV2 =
  | CompiledDeclarativeValidationAnyOfRuleV2
  | CompiledDeclarativeValidationAllOfRuleV2;

/** @internal */
export interface CompiledDeclarativeValidationAnyOfRuleV2
  extends CompiledDeclarativeValidationGroupRuleFields {
  kind: "anyOf";
}

/** @internal */
export interface CompiledDeclarativeValidationAllOfRuleV2
  extends CompiledDeclarativeValidationGroupRuleFields {
  kind: "allOf";
}

/** @internal */
export interface CompiledDeclarativeValidationGroupRuleFields
  extends CompiledDeclarativeValidationApplicabilityOwnerV2 {
  syntaxVersion: typeof PROFILE_SYNTAX_VERSION_V2;
  ruleId: string;
  severity: DeclarativeValidationSeverity;
  branches: readonly CompiledDeclarativeValidationBranchV2[];
}

/** @internal */
export interface CompiledDeclarativeValidationBranchV2
  extends CompiledDeclarativeValidationRuleFields {
  branchIndex: number;
  label?: string;
}

/** @internal */
export interface CompiledDeclarativeValidationRuleFields {
  ruleId: string;
  severity: DeclarativeValidationSeverity;
  selector: DeclarativeSelector;
  assertions: readonly CompiledDeclarativeAssertion[];
}

/** @internal */
export interface CompiledDeclarativeValidationApplicabilityOwnerV2 {
  applicability?: CompiledDeclarativeValidationApplicabilityPlan;
}

/** @internal */
export interface CompiledDeclarativeValidationApplicabilityPlan {
  selector: DeclarativeSelector;
  assertions: readonly CompiledDeclarativeAssertion[];
}

/** @internal */
export interface DeclarativeValidationCompileResult {
  plan?: CompiledDeclarativeValidationPlan;
  diagnostics: readonly MarkdownDiagnostic[];
}

/** @internal */
export type CompiledDeclarativeAssertion =
  | {
      kind: "exists";
    }
  | {
      kind: "sectionsRequired";
      headings: readonly string[];
      order: "none" | "strict";
    }
  | {
      kind: "tableColumnsRequired";
      columns: readonly string[];
    }
  | {
      kind: "ids";
      unique?: true;
      caseSensitive: boolean;
      prefix?: string;
      minCount?: number;
      maxCount?: number;
    }
  | {
      kind: "references";
      idsFrom: {
        section?: string;
        column?: string;
        prefix?: string;
      };
      mustAppearIn: readonly string[];
    }
  | {
      kind: "tableColumnCoverage";
      source: {
        section: string;
        column: string;
        prefix?: string;
        caseSensitive: boolean;
      };
      target: {
        section: string;
        tableHeader?: readonly string[];
        column: string;
      };
      require: "everySourceId";
    }
  | {
      kind: "frontmatterShape";
      presence?: DeclarativeFrontmatterPresence;
      fields?: readonly DeclarativeFrontmatterFieldShape[];
    }
  | {
      kind: "text";
      contains?: string;
      excludes?: readonly string[];
    }
  | {
      kind: "textOccurrenceCount";
      text: string;
      count: number;
    }
  | {
      kind: "textLength";
      min?: number;
      max?: number;
    }
  | {
      kind: "textFormat";
      format: "isoDate";
    }
  | {
      kind: "frontmatterRequired";
      fields: readonly string[];
    };
