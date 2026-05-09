import { types as nodeTypes } from "node:util";

import type { MarkdownDiagnostic } from "../../api/diagnostics.js";
import { isPlainRecord } from "../../internal/plain-record.js";
import { unsupportedProfileKey } from "../diagnostics/profile-config-diagnostics.js";

export const PROFILE_KEYS = ["syntaxVersion", "documentVersion", "rules"] as const;
export const RULE_KEYS = ["id", "severity", "select", "assert"] as const;

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
  if (!Array.isArray(rules)) {
    return hasUnsupportedKeys;
  }

  for (let index = 0; index < rules.length; index += 1) {
    const descriptor = safePropertyDescriptor(rules, String(index));
    if (descriptor === undefined || !("value" in descriptor)) {
      continue;
    }

    const ruleKeys = enumerableDataKeys(descriptor.value);
    if (ruleKeys !== undefined) {
      hasUnsupportedKeys =
        pushUnsupportedKeys(ruleKeys, RULE_KEYS, diagnostics) || hasUnsupportedKeys;
    }
  }

  return hasUnsupportedKeys;
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
    Array.isArray(value) ||
    nodeTypes.isProxy(value)
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
