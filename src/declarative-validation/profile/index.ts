import type {
  EngineDocumentVersion,
  EngineNode,
} from "../../api/document.js";
import type { MarkdownDiagnostic } from "../../api/diagnostics.js";

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
  syntaxVersion: "markdown-engine.validation@v1";
  documentVersion?: EngineDocumentVersion;
  rules: readonly DeclarativeValidationRule[];
}

export interface DeclarativeValidationRule {
  id: string;
  severity?: DeclarativeValidationSeverity;
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
  };
  references?: {
    idsFrom: DeclarativeIdSource;
    mustAppearIn: readonly string[];
  };
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

export interface DeclarativeProfileParseOptions {
  path?: string;
}

export interface DeclarativeProfileParseResult {
  profile?: ValidationProfile;
  diagnostics: readonly MarkdownDiagnostic[];
}
