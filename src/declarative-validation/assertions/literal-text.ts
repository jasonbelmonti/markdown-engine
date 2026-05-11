export function countNonOverlappingLiteralOccurrences(
  text: string,
  literal: string,
): number {
  let count = 0;
  let searchStart = 0;

  while (searchStart <= text.length) {
    const occurrenceIndex = text.indexOf(literal, searchStart);
    if (occurrenceIndex === -1) {
      return count;
    }

    count += 1;
    searchStart = occurrenceIndex + literal.length;
  }

  return count;
}
