import { parse as parseYaml } from "yaml";

import {
  ANNOTATED_PROFILE_CONTRACT,
  ANNOTATED_PROFILE_HEADING,
  ANNOTATED_RULE_CONTRACTS,
} from "./declarative-validation-agent-guide-contract.mjs";

export function guideSectionFailures({
  file,
  markdown,
  heading,
  minLength,
  phrases,
}) {
  const body = markdownSectionBody(markdown, heading);

  if (body === undefined) {
    return [`${file}: missing section body for ${heading}`];
  }

  const failures = [];

  if (body.length < minLength) {
    failures.push(
      `${file}: section ${heading} must contain at least ${minLength} characters; found ${body.length}`,
    );
  }

  const normalizedBody = normalizeWhitespace(body);
  for (const phrase of phrases) {
    if (!normalizedBody.includes(phrase)) {
      failures.push(
        `${file}: section ${heading} missing required phrase ${phrase}`,
      );
    }
  }

  return failures;
}

export function annotatedProfileFailures({
  guideFile,
  guideMarkdown,
  profileFile,
  profileYaml,
}) {
  const failures = [];
  const profile = fixtureProfile(profileYaml, profileFile, failures);

  if (profile === undefined) {
    return failures;
  }

  failures.push(...fixtureSemanticFailures(profile, profileFile));

  const annotatedSections = markdownSectionBodies(
    guideMarkdown,
    ANNOTATED_PROFILE_HEADING,
  );
  if (annotatedSections.length === 0) {
    failures.push(
      `${guideFile}: missing section body for ${ANNOTATED_PROFILE_HEADING}`,
    );
    return failures;
  }

  if (annotatedSections.length > 1) {
    failures.push(
      `${guideFile}: duplicate section heading ${ANNOTATED_PROFILE_HEADING}`,
    );
  }

  const [annotatedSection] = annotatedSections;

  failures.push(...annotationHeadingFailures(guideFile, annotatedSection));

  for (const [index, contract] of ANNOTATED_RULE_CONTRACTS.entries()) {
    const heading = annotationHeading(index, contract.rule.id);
    const bodies = markdownSectionBodies(annotatedSection, heading);

    if (bodies.length === 0) {
      failures.push(
        `${guideFile}: missing annotation heading ${heading} from ${profileFile}`,
      );
      continue;
    }

    failures.push(
      ...annotationBodyFailures(
        guideFile,
        heading,
        bodies[0],
        contract.annotation,
      ),
    );
  }

  return failures;
}

function fixtureProfile(profileText, profileFile, failures) {
  let profile;

  try {
    profile = parseYaml(profileText);
  } catch (error) {
    failures.push(
      `${profileFile}: unable to parse fixture profile YAML: ${errorMessage(error)}`,
    );
    return undefined;
  }

  if (!isPlainRecord(profile) || !Array.isArray(profile.rules)) {
    failures.push(`${profileFile}: fixture profile must contain a rules array`);
    return undefined;
  }

  const seenRuleIds = new Set();
  let valid = true;

  for (const [index, rule] of profile.rules.entries()) {
    if (
      !isPlainRecord(rule) ||
      typeof rule.id !== "string" ||
      rule.id.length === 0
    ) {
      failures.push(
        `${profileFile}: fixture rule ${index + 1} must contain a non-empty string id`,
      );
      valid = false;
      continue;
    }

    if (seenRuleIds.has(rule.id)) {
      failures.push(`${profileFile}: fixture rule id "${rule.id}" must be unique`);
      valid = false;
    }
    seenRuleIds.add(rule.id);
  }

  return valid ? profile : undefined;
}

function fixtureSemanticFailures(profile, profileFile) {
  const failures = [];
  const actualEnvelope = recordWithoutKey(profile, "rules");
  const expectedEnvelope = recordWithoutKey(ANNOTATED_PROFILE_CONTRACT, "rules");

  if (stableSemanticJson(actualEnvelope) !== stableSemanticJson(expectedEnvelope)) {
    failures.push(
      `${profileFile}: fixture profile envelope semantics drifted from the annotated profile contract; expected ${stableSemanticJson(expectedEnvelope)}, found ${stableSemanticJson(actualEnvelope)}`,
    );
  }

  if (profile.rules.length !== ANNOTATED_PROFILE_CONTRACT.rules.length) {
    failures.push(
      `${profileFile}: fixture rule count drifted from the annotated profile contract; expected ${ANNOTATED_PROFILE_CONTRACT.rules.length}, found ${profile.rules.length}`,
    );
  }

  const comparableRuleCount = Math.min(
    profile.rules.length,
    ANNOTATED_PROFILE_CONTRACT.rules.length,
  );
  for (let index = 0; index < comparableRuleCount; index += 1) {
    const actualRule = profile.rules[index];
    const expectedRule = ANNOTATED_PROFILE_CONTRACT.rules[index];

    if (stableSemanticJson(actualRule) === stableSemanticJson(expectedRule)) {
      continue;
    }

    failures.push(
      `${profileFile}: fixture rule ${index + 1} semantics drifted from annotation ${annotationHeading(index, expectedRule.id)}; expected ${stableSemanticJson(expectedRule)}, found ${stableSemanticJson(actualRule)}`,
    );
  }

  return failures;
}

function annotationHeadingFailures(guideFile, annotatedSection) {
  const failures = [];
  const entries = annotationHeadingEntries(annotatedSection);
  const expectedHeadings = new Set(
    ANNOTATED_RULE_CONTRACTS.map(({ rule }, index) =>
      annotationHeading(index, rule.id),
    ),
  );

  for (const [heading, matchingEntries] of groupBy(
    entries,
    ({ heading }) => heading,
  )) {
    if (matchingEntries.length > 1) {
      failures.push(`${guideFile}: duplicate annotation heading ${heading}`);
    }
  }

  for (const entry of entries) {
    if (!expectedHeadings.has(entry.heading)) {
      failures.push(`${guideFile}: unexpected annotation heading ${entry.heading}`);
    }
  }

  failures.push(
    ...duplicateAnnotationKeyFailures(
      guideFile,
      entries,
      "rule id",
      ({ ruleId }) => ruleId,
    ),
    ...duplicateAnnotationKeyFailures(
      guideFile,
      entries,
      "ordinal",
      ({ ordinal }) => ordinal,
    ),
  );

  return failures;
}

function duplicateAnnotationKeyFailures(
  guideFile,
  entries,
  label,
  keyFromEntry,
) {
  const failures = [];

  for (const [key, matchingEntries] of groupBy(entries, keyFromEntry)) {
    const distinctHeadings = new Set(
      matchingEntries.map(({ heading }) => heading),
    );
    if (matchingEntries.length > 1 && distinctHeadings.size > 1) {
      failures.push(`${guideFile}: duplicate annotation ${label} "${key}"`);
    }
  }

  return failures;
}

function annotationHeadingEntries(markdown) {
  return markdown.split(/\r?\n/).flatMap((line) => {
    const heading = line.trimEnd();
    const match = /^###\s+([1-9]\d*)\.\s+`([^`]+)`\s*$/.exec(heading);

    return match === null
      ? []
      : [
          {
            heading,
            ordinal: Number(match[1]),
            ruleId: match[2],
          },
        ];
  });
}

function annotationBodyFailures(
  guideFile,
  heading,
  body,
  semanticContract,
) {
  const minimumLength = 120;
  const requiredClauses = [
    { label: "selection", pattern: /\bselect(?:s|ed)?\b/i },
    {
      label: "assertion",
      pattern: /\b(?:assert(?:s|ion)?|require(?:s|d)?)\b/i,
    },
    {
      label: "failure meaning",
      pattern: /\b(?:fail(?:s|ure|ed)?|empty selection|means)\b/i,
    },
  ];
  const failures = [];
  const normalizedBody = normalizeWhitespace(body);

  if (normalizedBody !== semanticContract.canonicalText) {
    failures.push(
      `${guideFile}: annotation ${heading} does not match canonical semantic text`,
    );
  }

  if (body.length < minimumLength) {
    failures.push(
      `${guideFile}: annotation ${heading} must contain at least ${minimumLength} characters; found ${body.length}`,
    );
  }

  for (const clause of requiredClauses) {
    if (!clause.pattern.test(normalizedBody)) {
      failures.push(
        `${guideFile}: annotation ${heading} missing ${clause.label} clause`,
      );
    }
  }

  for (const literal of semanticContract.literals) {
    if (!normalizedBody.includes(literal)) {
      failures.push(
        `${guideFile}: annotation ${heading} missing semantic literal "${literal}"`,
      );
    }
  }

  for (const claim of semanticContract.patterns) {
    if (!claim.pattern.test(normalizedBody)) {
      failures.push(
        `${guideFile}: annotation ${heading} missing semantic claim ${claim.label}`,
      );
    }
  }

  return failures;
}

function annotationHeading(index, ruleId) {
  return `### ${index + 1}. \`${ruleId}\``;
}

function markdownSectionBody(markdown, heading) {
  return markdownSectionBodies(markdown, heading)[0];
}

function markdownSectionBodies(markdown, heading) {
  const headingMatch = /^(#{1,6})\s/.exec(heading);
  if (headingMatch === null) {
    return [];
  }

  const headingLevel = headingMatch[1].length;
  const lines = markdown.split(/\r?\n/);
  const bodies = [];

  for (let headingIndex = 0; headingIndex < lines.length; headingIndex += 1) {
    if (lines[headingIndex].trimEnd() !== heading) {
      continue;
    }

    let endIndex = lines.length;

    for (let index = headingIndex + 1; index < lines.length; index += 1) {
      const nextHeading = /^(#{1,6})\s/.exec(lines[index]);
      if (nextHeading !== null && nextHeading[1].length <= headingLevel) {
        endIndex = index;
        break;
      }
    }

    bodies.push(lines.slice(headingIndex + 1, endIndex).join("\n").trim());
  }

  return bodies;
}

function stableSemanticJson(value) {
  return JSON.stringify(normalizeSemanticValue(value));
}

function normalizeSemanticValue(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeSemanticValue);
  }

  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, normalizeSemanticValue(value[key])]),
    );
  }

  return value;
}

function recordWithoutKey(record, omittedKey) {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => key !== omittedKey),
  );
}

function groupBy(values, keyFromValue) {
  const grouped = new Map();

  for (const value of values) {
    const key = keyFromValue(value);
    grouped.set(key, [...(grouped.get(key) ?? []), value]);
  }

  return grouped;
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function isPlainRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
