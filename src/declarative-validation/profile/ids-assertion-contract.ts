import type { DeclarativeAssertion } from "./index.js";
import {
  PROFILE_SYNTAX_VERSION_V2,
  type ValidationProfileSyntaxVersion,
} from "./syntax-version.js";

export const IDS_COUNT_BOUND_KEYS = ["minCount", "maxCount"] as const;
export type IdsCountBoundKey = (typeof IDS_COUNT_BOUND_KEYS)[number];

export const IDS_ASSERTION_KEYS_V1 = [
  "prefix",
  "unique",
  "caseSensitive",
] as const;

export const IDS_ASSERTION_KEYS_V2 = [
  ...IDS_ASSERTION_KEYS_V1,
  ...IDS_COUNT_BOUND_KEYS,
] as const;

export function idsAssertionKeysForSyntaxVersion(
  syntaxVersion: ValidationProfileSyntaxVersion,
): readonly string[] {
  return idsAssertionSupportsCountBounds(syntaxVersion)
    ? IDS_ASSERTION_KEYS_V2
    : IDS_ASSERTION_KEYS_V1;
}

export function idsAssertionSupportsCountBounds(
  syntaxVersion: ValidationProfileSyntaxVersion,
): boolean {
  return syntaxVersion === PROFILE_SYNTAX_VERSION_V2;
}

export function hasEffectiveIdsPredicate(
  ids: DeclarativeAssertion["ids"],
  syntaxVersion: ValidationProfileSyntaxVersion,
): boolean {
  return (
    ids?.unique === true ||
    (idsAssertionSupportsCountBounds(syntaxVersion) && hasIdsCountBound(ids))
  );
}

export function hasIdsCountBound(ids: DeclarativeAssertion["ids"]): boolean {
  return ids?.minCount !== undefined || ids?.maxCount !== undefined;
}

export function hasValidIdsCountRange(ids: DeclarativeAssertion["ids"]): boolean {
  return (
    ids?.minCount === undefined ||
    ids.maxCount === undefined ||
    ids.minCount <= ids.maxCount
  );
}
