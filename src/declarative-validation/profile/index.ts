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
  | {
      target: "table";
      section?: string;
      header?: readonly string[];
    }
  | {
      target: "textSpan";
      section?: string;
      nodeType?: EngineNode["type"];
      textIncludes?: string;
    };

export interface DeclarativeAssertion {
  sectionsRequired?: {
    headings: readonly string[];
    order?: DeclarativeSectionOrder;
  };
  tableColumnsRequired?: {
    columns: readonly string[];
  };
  text?: {
    contains: string;
  };
}

export interface DeclarativeProfileParseOptions {
  path?: string;
}

export interface DeclarativeProfileParseResult {
  profile?: ValidationProfile;
  diagnostics: readonly MarkdownDiagnostic[];
}
