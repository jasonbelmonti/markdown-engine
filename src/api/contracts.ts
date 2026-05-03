export type CoreMarkdownEngineApiName =
  | "parse"
  | "normalize"
  | "validate"
  | "serialize";

export type RichIrApiName =
  | "queryRichIr"
  | "validateRichIrAnnotations"
  | "serializeRichIr";

export type MarkdownEngineApiName =
  | CoreMarkdownEngineApiName
  | RichIrApiName;

export * from "./diagnostics.js";
export * from "./document.js";
export * from "./normalize.js";
export * from "./parse.js";
export * from "./rich-ir.js";
export * from "./serialize.js";
export * from "./validate.js";
