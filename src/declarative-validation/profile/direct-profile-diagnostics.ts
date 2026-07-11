import { types as nodeTypes } from "node:util";

import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import { unsupportedProfileKey } from "../diagnostics/profile-config-diagnostics.js";
import { PROFILE_SYNTAX_VERSION_V2 } from "./syntax-version.js";

export const PROFILE_KEYS = ["syntaxVersion", "documentVersion", "rules"] as const;
export const RULE_KEYS_V1 = ["id", "severity", "select", "assert"] as const;
export const RULE_KEYS_V2 = [...RULE_KEYS_V1, "when", "anyOf", "allOf"] as const;

export function pushDirectProfileUnsupportedKeyDiagnostics(
  value: unknown,
  diagnostics: MarkdownDiagnostic[],
): boolean {
  const keys = enumerableDataKeys(value);
  if (keys === undefined) {
    return false;
  }

  let hasUnsupportedKeys = pushUnsupportedKeys(keys, PROFILE_KEYS, diagnostics);
  const rules = dataPropertyValue(value, "rules");
  if (
    rules === null ||
    typeof rules !== "object" ||
    nodeTypes.isProxy(rules) ||
    !Array.isArray(rules)
  ) {
    return hasUnsupportedKeys;
  }

  const syntaxVersion = dataPropertyValue(value, "syntaxVersion");
  const allowedRuleKeys =
    syntaxVersion === PROFILE_SYNTAX_VERSION_V2 ? RULE_KEYS_V2 : RULE_KEYS_V1;

  for (const indexKey of ownArrayIndexKeys(rules)) {
    const descriptor = safePropertyDescriptor(rules, indexKey);
    if (descriptor === undefined || !("value" in descriptor)) {
      continue;
    }

    const ruleKeys = enumerableDataKeys(descriptor.value);
    if (ruleKeys !== undefined) {
      hasUnsupportedKeys =
        pushUnsupportedKeys(ruleKeys, allowedRuleKeys, diagnostics) ||
        hasUnsupportedKeys;
    }
  }

  return hasUnsupportedKeys;
}

function ownArrayIndexKeys(value: readonly unknown[]): readonly string[] {
  let keys: readonly string[];

  try {
    keys = Object.getOwnPropertyNames(value);
  } catch {
    return [];
  }

  const { length } = value;

  return keys.filter((key) => {
    const index = Number(key);

    return (
      Number.isInteger(index) &&
      index >= 0 &&
      index < length &&
      String(index) === key
    );
  });
}

export function directProfileDataPropertyValue(
  value: unknown,
  key: (typeof PROFILE_KEYS)[number],
): unknown {
  return dataPropertyValue(value, key);
}

function pushUnsupportedKeys(
  keys: readonly string[],
  allowedKeys: readonly string[],
  diagnostics: MarkdownDiagnostic[],
): boolean {
  let hasUnsupportedKeys = false;

  for (const key of keys) {
    if (!allowedKeys.includes(key)) {
      diagnostics.push(unsupportedProfileKey(key));
      hasUnsupportedKeys = true;
    }
  }

  return hasUnsupportedKeys;
}

function enumerableDataKeys(value: unknown): readonly string[] | undefined {
  if (
    value === null ||
    typeof value !== "object" ||
    nodeTypes.isProxy(value) ||
    Array.isArray(value)
  ) {
    return undefined;
  }

  try {
    return isPlainRecord(value) ? Object.keys(value) : undefined;
  } catch {
    return undefined;
  }
}

function dataPropertyValue(
  value: unknown,
  key: string,
): unknown {
  if (value === null || typeof value !== "object" || nodeTypes.isProxy(value)) {
    return undefined;
  }

  const descriptor = safePropertyDescriptor(value, key);

  return descriptor !== undefined && "value" in descriptor
    ? descriptor.value
    : undefined;
}

function safePropertyDescriptor(
  value: object,
  key: string,
): PropertyDescriptor | undefined {
  try {
    return Object.getOwnPropertyDescriptor(value, key);
  } catch {
    return undefined;
  }
}
