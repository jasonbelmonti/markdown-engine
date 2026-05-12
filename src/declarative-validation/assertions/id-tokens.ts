import type { SourceRange } from "../../api/diagnostics.js";

const ID_TOKEN_PATTERN = /\b[A-Za-z][A-Za-z0-9]*-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*\b/g;

export interface IdToken {
  value: string;
  comparisonValue: string;
  textOffset: number;
  sourceRange?: SourceRange;
}

export interface IdTokenOptions {
  caseSensitive?: boolean;
  prefix?: string;
  sourceRange?: SourceRange;
}

export function extractIdTokens(
  text: string,
  options: IdTokenOptions = {},
): IdToken[] {
  const caseSensitive = options.caseSensitive ?? true;
  const tokens = [...text.matchAll(ID_TOKEN_PATTERN)].map((match) => {
    const value = match[0] ?? "";

    return {
      value,
      comparisonValue: comparisonValue(value, caseSensitive),
      textOffset: match.index ?? 0,
      ...(options.sourceRange !== undefined
        ? { sourceRange: options.sourceRange }
        : {}),
    };
  });

  const prefix = options.prefix;

  if (prefix === undefined) {
    return tokens;
  }

  return tokens.filter((token) =>
    tokenMatchesPrefix(token.value, prefix, caseSensitive),
  );
}

export function comparisonValue(value: string, caseSensitive: boolean): string {
  return caseSensitive ? value : value.toLowerCase();
}

function tokenMatchesPrefix(
  token: string,
  prefix: string,
  caseSensitive: boolean,
): boolean {
  return comparisonValue(token, caseSensitive).startsWith(
    comparisonValue(`${prefix}-`, caseSensitive),
  );
}
