import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { SUPPORTED_PROFILE_SYNTAX_VERSIONS } from "../profile/syntax-version.js";

export const REGEX_LIKE_PROFILE_KEYS = [
  "matches",
  "pattern",
  "regex",
  "regexp",
] as const;

export const UNSAFE_PROFILE_KEYS = [
  "callback",
  "eval",
  "execute",
  "expression",
  "function",
  "import",
  "imports",
  "plugin",
  "script",
] as const;

const CONFIG_UNSUPPORTED_KEY_PRECEDENCE = new Set<string>([
  ...REGEX_LIKE_PROFILE_KEYS,
  ...UNSAFE_PROFILE_KEYS,
]);

export function profileDiagnostic(
  code: string,
  message: string,
): MarkdownDiagnostic {
  return { code, message, severity: "error" };
}

export function invalidProfileShape(message: string): MarkdownDiagnostic {
  return profileDiagnostic("profile.config.invalidShape", message);
}

export function unsupportedProfileKey(key: string): MarkdownDiagnostic {
  return profileDiagnostic(
    "profile.config.unsupportedKey",
    `Unsupported validation profile key "${key}".`,
  );
}

export function unsupportedSyntaxVersion(): MarkdownDiagnostic {
  return profileDiagnostic(
    "profile.config.unsupportedSyntaxVersion",
    `Profile syntaxVersion must be ${quotedList(SUPPORTED_PROFILE_SYNTAX_VERSIONS)}`,
  );
}

export function unsupportedProfileKeys(
  record: Record<string, unknown>,
  allowedKeys: readonly string[],
  diagnostics: MarkdownDiagnostic[],
): void {
  for (const key of Object.keys(record)) {
    if (!allowedKeys.includes(key)) {
      diagnostics.push(unsupportedProfileKey(key));
    }
  }
}

export function hasConfigUnsupportedKeyPrecedence(key: string): boolean {
  return CONFIG_UNSUPPORTED_KEY_PRECEDENCE.has(key);
}

function quotedList(values: readonly string[]): string {
  const quotedValues = values.map((value) => `"${value}"`);
  const finalValue = quotedValues.at(-1) ?? "";
  const prefix = quotedValues.slice(0, -1).join(", ");

  return prefix.length === 0 ? `${finalValue}.` : `${prefix} or ${finalValue}.`;
}
