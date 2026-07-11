export function deeplyNestedMalformedYaml(
  depth: number,
  initialIndent = 0,
): string {
  const lines = Array.from({ length: depth }, (_value, index) =>
    `${" ".repeat(initialIndent + index * 2)}nested:`,
  );

  return [...lines, "invalid-unindented-value"].join("\n");
}
