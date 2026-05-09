import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type {
  DeclarativeSelector,
  DeclarativeValidationSeverity,
  ValidationProfile,
} from "../profile/index.js";

/** @internal Private compiled plans must not be exported from the package root. */
export interface CompiledDeclarativeValidationPlan {
  profile: ValidationProfile;
  rules: readonly CompiledDeclarativeValidationRule[];
}

/** @internal Private rule-plan records are owned by the compiler package. */
export interface CompiledDeclarativeValidationRule {
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
      kind: "sectionsRequired";
      headings: readonly string[];
      order: "none" | "strict";
    }
  | {
      kind: "sectionOrder";
      headings: readonly string[];
    }
  | {
      kind: "tableColumnsRequired";
      columns: readonly string[];
    }
  | {
      kind: "ids";
      unique: true;
      caseSensitive: boolean;
      column?: string;
      prefix?: string;
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
      column?: string;
      contains?: string;
      containsExactlyOne?: string;
      excludes?: readonly string[];
    }
  | {
      kind: "textOccurrenceCount";
      text: string;
      count: number;
      column?: string;
    }
  | {
      kind: "frontmatterRequired";
      fields: readonly string[];
    };
