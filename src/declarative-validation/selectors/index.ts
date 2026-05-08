import type { EngineDocument } from "../../api/document.js";
import type { DeclarativeSelector } from "../profile/index.js";

/** @internal Selector results remain internal to declarative validation. */
export interface DeclarativeSelection {
  document: EngineDocument;
  selector: DeclarativeSelector;
  targets: readonly unknown[];
}

export type DeclarativeSelectorTarget = DeclarativeSelector["target"];
