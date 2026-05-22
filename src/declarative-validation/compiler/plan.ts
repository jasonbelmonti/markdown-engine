import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type {
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
  rules: readonly CompiledDeclarativeValidationFlatRuleV2[];
}

/** @internal Private rule-plan records are owned by the compiler package. */
export type CompiledDeclarativeValidationRule =
  | CompiledDeclarativeValidationRuleV1
  | CompiledDeclarativeValidationFlatRuleV2;

/** @internal */
export type CompiledDeclarativeValidationRuleV1 =
  CompiledDeclarativeValidationRuleFields;

/** @internal */
export interface CompiledDeclarativeValidationFlatRuleV2
  extends CompiledDeclarativeValidationRuleFields {
  kind: "flat";
  syntaxVersion: typeof PROFILE_SYNTAX_VERSION_V2;
}

/** @internal */
export interface CompiledDeclarativeValidationRuleFields {
  ruleId: string;
  severity: DeclarativeValidationSeverity;
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
      kind: "frontmatterRequired";
      fields: readonly string[];
    };
