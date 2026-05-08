import type { DeclarativeOutputFormat } from "../profile/index.js";

/** @internal CLI adapters are registered here before command behavior exists. */
export interface DeclarativeValidationCliAdapterOptions {
  filePath: string;
  profilePath: string;
  format: DeclarativeOutputFormat;
}
