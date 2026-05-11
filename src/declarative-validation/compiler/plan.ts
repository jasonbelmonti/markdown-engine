import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type {
  DeclarativeSelector,
  DeclarativeValidationSeverity,
} from "../profile/index.js";

/** @internal Private compiled plans must not be exported from the package root. */
export interface CompiledDeclarativeValidationPlan {
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
      kind: "tableColumnsRequired";
      columns: readonly string[];
    }
  | {
      kind: "ids";
      unique: true;
      caseSensitive: boolean;
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
      contains?: string;
      excludes?: readonly string[];
    }
  | {
      kind: "textOccurrenceCount";
      text: string;
      count: number;
    }
  | {
      kind: "frontmatterRequired";
      fields: readonly string[];
    };
