export const TEXT_FORMAT_ASSERTION_KEYS = ["format"] as const;

export const TEXT_FORMAT_ISO_DATE = "isoDate" as const;

export function isTextFormatAssertionFormat(
  value: unknown,
): value is typeof TEXT_FORMAT_ISO_DATE {
  return value === TEXT_FORMAT_ISO_DATE;
}
