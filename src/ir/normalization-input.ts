import type {
  EngineDocument,
  EngineDocumentVersion,
} from "../api/document.js";

export interface NormalizationInput {
  markdown: string;
  path?: string;
  frontmatter?: unknown;
  document: EngineDocument;
}

export interface NormalizationOptions {
  documentVersion?: EngineDocumentVersion;
  preserveSourceLocations?: boolean;
}
