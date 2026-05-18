export const PROFILE_SYNTAX_VERSION_V1 = "markdown-engine.validation@v1";
export const PROFILE_SYNTAX_VERSION_V2 = "markdown-engine.validation@v2";
export const PROFILE_SYNTAX_VERSION = PROFILE_SYNTAX_VERSION_V1;

export const SUPPORTED_PROFILE_SYNTAX_VERSIONS = [
  PROFILE_SYNTAX_VERSION_V1,
  PROFILE_SYNTAX_VERSION_V2,
] as const;

export type ValidationProfileSyntaxVersion =
  (typeof SUPPORTED_PROFILE_SYNTAX_VERSIONS)[number];

export function isValidationProfileSyntaxVersion(
  value: unknown,
): value is ValidationProfileSyntaxVersion {
  return SUPPORTED_PROFILE_SYNTAX_VERSIONS.some(
    (syntaxVersion) => value === syntaxVersion,
  );
}
