import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import type {
  DeclarativeAssertion,
  DeclarativeSelector,
} from "../profile/index.js";
import {
  PROFILE_SYNTAX_VERSION_V2,
  type ValidationProfileSyntaxVersion,
} from "../profile/syntax-version.js";
import { pushCompatibilityDiagnostic } from "./compatibility.js";
import { compileDiagnostic } from "./diagnostics.js";
import type { CompiledDeclarativeAssertion } from "./plan.js";
import {
  optionalNumber,
  pushNonNegativeIntegerDiagnostic,
  pushObjectDiagnostic,
  pushUnsupportedKeyDiagnostics,
} from "./assertion-shapes.js";

type LengthAssertionName = "selectionCount" | "sourceLength" | "textLength";
type LengthBounds = { min?: number; max?: number };

export function buildSelectionCountAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  syntaxVersion: ValidationProfileSyntaxVersion,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  const bounds = assertion.selectionCount;

  return bounds === undefined || syntaxVersion !== PROFILE_SYNTAX_VERSION_V2
    ? undefined
    : buildLengthAssertion(
        "selectionCount",
        bounds,
        selector,
        ruleId,
        diagnostics,
      );
}

export function buildTextLengthAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  _syntaxVersion: ValidationProfileSyntaxVersion,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  const bounds = assertion.textLength;

  return bounds === undefined
    ? undefined
    : buildLengthAssertion("textLength", bounds, selector, ruleId, diagnostics);
}

export function buildSourceLengthAssertion(
  assertion: DeclarativeAssertion,
  selector: DeclarativeSelector,
  ruleId: string,
  syntaxVersion: ValidationProfileSyntaxVersion,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  const bounds = assertion.sourceLength;

  return bounds === undefined || syntaxVersion !== PROFILE_SYNTAX_VERSION_V2
    ? undefined
    : buildLengthAssertion(
        "sourceLength",
        bounds,
        selector,
        ruleId,
        diagnostics,
      );
}

function buildLengthAssertion(
  assertionName: LengthAssertionName,
  bounds: LengthBounds,
  selector: DeclarativeSelector,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): CompiledDeclarativeAssertion | undefined {
  if (
    !pushObjectDiagnostic(assertionName, bounds, ruleId, diagnostics) ||
    !pushUnsupportedKeyDiagnostics(bounds, ["min", "max"], diagnostics) ||
    !pushLengthBoundShapeDiagnostics(
      assertionName,
      bounds,
      ruleId,
      diagnostics,
    )
  ) {
    return undefined;
  }

  if (!hasLengthBound(bounds)) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        `${assertionName} must include min, max, or both.`,
        ruleId,
      ),
    );

    return undefined;
  }

  if (
    !pushCompatibilityDiagnostic(
      assertionName,
      selector,
      ruleId,
      diagnostics,
    )
  ) {
    return undefined;
  }

  return {
    kind: assertionName,
    ...optionalNumber("min", bounds.min),
    ...optionalNumber("max", bounds.max),
  };
}

function pushLengthBoundShapeDiagnostics(
  assertionName: LengthAssertionName,
  bounds: LengthBounds,
  ruleId: string,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  let valid = true;

  if (
    bounds.min !== undefined &&
    !pushNonNegativeIntegerDiagnostic(
      `${assertionName}.min`,
      bounds.min,
      ruleId,
      diagnostics,
    )
  ) {
    valid = false;
  }

  if (
    bounds.max !== undefined &&
    !pushNonNegativeIntegerDiagnostic(
      `${assertionName}.max`,
      bounds.max,
      ruleId,
      diagnostics,
    )
  ) {
    valid = false;
  }

  if (
    valid &&
    bounds.min !== undefined &&
    bounds.max !== undefined &&
    bounds.min > bounds.max
  ) {
    diagnostics.push(
      compileDiagnostic(
        "profile.config.invalidShape",
        `${assertionName}.min must be less than or equal to ${assertionName}.max.`,
        ruleId,
      ),
    );

    valid = false;
  }

  return valid;
}

function hasLengthBound(bounds: LengthBounds): boolean {
  return bounds.min !== undefined || bounds.max !== undefined;
}
