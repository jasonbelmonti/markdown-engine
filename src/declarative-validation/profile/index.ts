import type {
  EngineDocumentVersion,
  EngineNode,
} from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type { ValidationProfileSyntaxVersion } from "./syntax-version.js";

export { parseValidationProfileInput } from "./parse.js";

export type DeclarativeValidationSeverity = "error" | "warning" | "info";
export type DeclarativeOutputFormat = "json";
export type DeclarativeSectionOrder = "none" | "strict";
export type JsonSafeValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonSafeValue[]
  | { readonly [key: string]: JsonSafeValue };

export interface ValidationProfile {
  syntaxVersion: ValidationProfileSyntaxVersion;
  documentVersion?: EngineDocumentVersion;
  rules: readonly DeclarativeValidationRule[];
}

export type DeclarativeValidationRule =
  | DeclarativeValidationFlatRule
  | DeclarativeValidationGroupRule;

export interface DeclarativeValidationRuleFields {
  id: string;
  severity?: DeclarativeValidationSeverity;
  when?: DeclarativeValidationApplicability;
}

export interface DeclarativeValidationApplicability {
  select: DeclarativeSelector;
  assert: DeclarativeAssertion;
}

export interface DeclarativeValidationFlatRule
  extends DeclarativeValidationRuleFields {
  select: DeclarativeSelector;
  assert: DeclarativeAssertion;
}

export type DeclarativeValidationGroupRule =
  | DeclarativeValidationAnyOfRule
  | DeclarativeValidationAllOfRule;

export interface DeclarativeValidationAnyOfRule
  extends DeclarativeValidationRuleFields {
  anyOf: readonly DeclarativeValidationBranch[];
}

export interface DeclarativeValidationAllOfRule
  extends DeclarativeValidationRuleFields {
  allOf: readonly DeclarativeValidationBranch[];
}

export interface DeclarativeValidationBranch {
  label?: string;
  select: DeclarativeSelector;
  assert: DeclarativeAssertion;
}

export type DeclarativeSelector =
  | { target: "document" }
  | { target: "section"; title?: string; depth?: number }
  | { target: "heading"; text?: string; depth?: number }
  | {
      target: "table";
      section?: string;
      header?: readonly string[];
    }
  | {
      target: "tableRow";
      section?: string;
      tableHeader?: readonly string[];
      where?: DeclarativeTableCellPredicate;
    }
  | {
      target: "tableCell";
      section?: string;
      tableHeader?: readonly string[];
      column: string;
      rowWhere?: DeclarativeTableCellPredicate;
    }
  | {
      target: "textSpan";
      section?: string;
      nodeType?: EngineNode["type"];
      textIncludes?: string;
    }
  | { target: "link"; section?: string; text?: string; url?: string }
  | { target: "list"; section?: string; ordered?: boolean; depth?: number };

export interface DeclarativeTableCellPredicate {
  column: string;
  equals?: string;
  includes?: string;
}

export interface DeclarativeAssertion {
  exists?: true;
  sectionsRequired?: {
    headings: readonly string[];
    order?: DeclarativeSectionOrder;
  };
  tableColumnsRequired?: {
    columns: readonly string[];
  };
  ids?: {
    prefix?: string;
    unique?: boolean;
    caseSensitive?: boolean;
    minCount?: number;
    maxCount?: number;
  };
  references?: {
    idsFrom: DeclarativeIdSource;
    mustAppearIn: readonly string[];
  };
  tableColumnCoverage?: DeclarativeTableColumnCoverage;
  frontmatterShape?: DeclarativeFrontmatterShape;
  text?: {
    contains?: string;
    excludes?: readonly string[];
  };
  textOccurrenceCount?: {
    text: string;
    count: number;
  };
  textLength?: {
    min?: number;
    max?: number;
  };
  frontmatterRequired?: {
    fields: readonly string[];
  };
}

export interface DeclarativeIdSource {
  section?: string;
  column?: string;
  prefix?: string;
}

export interface DeclarativeTableColumnCoverage {
  source: DeclarativeTableColumnCoverageSource;
  target: DeclarativeTableColumnCoverageTarget;
  require: "everySourceId";
}

export interface DeclarativeTableColumnCoverageSource {
  section: string;
  column: string;
  prefix?: string;
  caseSensitive?: boolean;
}

export interface DeclarativeTableColumnCoverageTarget {
  section: string;
  tableHeader?: readonly string[];
  column: string;
}

export interface DeclarativeFrontmatterShape {
  presence?: DeclarativeFrontmatterPresence;
  fields?: readonly DeclarativeFrontmatterFieldShape[];
}

export type DeclarativeFrontmatterPresence = "required" | "forbidden";

export interface DeclarativeFrontmatterFieldShape {
  field: string;
  required?: true;
  valueType?: DeclarativeFrontmatterValueType;
  nonEmpty?: true;
}

export type DeclarativeFrontmatterValueType =
  | "string"
  | "number"
  | "boolean"
  | "array"
  | "object"
  | "null";

export interface DeclarativeProfileParseOptions {
  path?: string;
}

export interface DeclarativeProfileParseResult {
  profile?: ValidationProfile;
  diagnostics: readonly MarkdownDiagnostic[];
}
