#!/usr/bin/env node

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { runBoundaryDependencyAudit } from "./check-boundaries.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const sourceRoots = [
  "src/declarative-validation",
  "src/api/declarative-validation.ts",
  "src/cli",
];
const forbiddenRuntimePatterns = [
  {
    label: "arbitrary JavaScript eval",
    pattern: /\beval\s*\(/,
  },
  {
    label: "Function constructor",
    pattern: /\b(?:new\s+)?Function\s*\(/,
  },
  {
    label: "dynamic import",
    pattern: /\bimport\s*\(/,
  },
  {
    label: "profile-sourced regex compilation",
    pattern: /\bnew\s+RegExp\b|\bRegExp\s*\(/,
  },
  {
    label: "network call or network module",
    pattern:
      /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|(?:\bfrom\s+|\bimport\s+|\brequire\s*\(\s*|\bimport\s*\(\s*)["'](?:node:)?(?:http|http2|https|net|tls|dgram|dns)(?:\/[A-Za-z0-9_.-]+)*["']/,
  },
  {
    label: "file watching",
    pattern: /\bwatchFile\s*\(|\bwatch\s*\(/,
  },
  {
    label: "persistence write",
    pattern:
      /\bwriteFile(?:Sync)?\s*\(|\bappendFile(?:Sync)?\s*\(|\bcreateWriteStream\s*\(|\blocalStorage\b|\bindexedDB\b|\bsqlite\b|\bpostgres\b|\bdatabase\b/i,
  },
  {
    label: "LLM, MCP, or agent transport",
    pattern: /\bopenai\b|\banthropic\b|\bllm\b|\bmcp\b|\bmodelcontextprotocol\b|\bagent-adapter\b/i,
  },
  {
    label: "plugin loader",
    pattern: /\bloadPlugin\b|\bpluginLoader\b|\bplugins?\s*\(/,
  },
];
const profileSpecificTerms = [
  /\bSpecTrace\b/,
  /\boperationalDesignSpec\b/,
  /\bOperationalDesignSpec\b/,
  /\boperational-design-spec\b/,
  /\bAGENTS\.md\b/,
  /\bTASK\.md\b/,
  /\bagentsMd\b/,
  /\bAgentsMd\b/,
  /\btaskMd\b/,
  /\bTaskMd\b/,
  /\bprofileId\b/,
  /\bProfileId\b/,
  /\bissueKey\b/,
  /\bIssueKey\b/,
  /\bentityRegistr(?:y|ies)\b/,
  /\bEntityRegistr(?:y|ies)\b/,
  /\bentity registr(?:y|ies)\b/i,
  /\bentityId\b/,
  /\bentityIds\b/,
  /\bEntityId\b/,
  /\bEntityIds\b/,
  /\bentity IDs?\b/i,
  /\bissue keys?\b/i,
  /\brelationshipType\b/,
  /\bRelationshipType\b/,
  /\brelationship types?\b/i,
  /\bsemanticScor(?:e|ing)\b/i,
  /\bsemantic scor(?:e|ing)\b/i,
  /\bsemanticEvaluator\b/,
  /\bSemanticEvaluator\b/,
];

const dependencyAudit = runBoundaryDependencyAudit(repoRoot);
if (dependencyAudit.dependencyMatches.length > 0) {
  for (const match of dependencyAudit.dependencyMatches) {
    failures.push(
      `package.json:${match.section}: forbidden dependency ${match.name}`,
    );
  }
}

for (const source of declarativeValidationSources()) {
  for (const { label, pattern } of forbiddenRuntimePatterns) {
    const match = source.content.match(pattern);
    if (match !== null) {
      failures.push(
        `${source.file}: forbidden ${label} pattern matched ${JSON.stringify(match[0])}`,
      );
    }
  }

  for (const pattern of profileSpecificTerms) {
    const match = source.content.match(pattern);
    if (match !== null) {
      failures.push(
        `${source.file}: profile-specific core semantic term matched ${JSON.stringify(match[0])}`,
      );
    }
  }
}

checkUnsupportedKeyContracts();
checkRejectionCoverage();
checkEvidenceCoverage();
checkPatternCoverage();

if (failures.length > 0) {
  console.error("Declarative validation boundary audit FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Declarative validation boundary audit PASS");
console.log(`Direct dependency matches: ${dependencyAudit.dependencyMatches.length}`);
console.log("Runtime boundary source matches: 0");
console.log("Regex-like key rejection checks: present");
console.log("Unsafe executable key rejection checks: present");
console.log("Profile-specific core semantic matches: 0");

function declarativeValidationSources() {
  const sourcesByPath = new Map();

  for (const sourceRoot of sourceRoots) {
    const absolutePath = resolve(repoRoot, sourceRoot);
    const sources = absolutePath.endsWith(".ts")
      ? [
          {
            file: sourceRoot,
            content: readFileSync(absolutePath, "utf8"),
          },
        ]
      : sourceFiles(absolutePath).map((source) => ({
          file: relativePath(repoRoot, source.file),
          content: source.content,
        }));

    for (const source of sources) {
      sourcesByPath.set(source.file, source);
    }
  }

  return [...sourcesByPath.values()].sort((left, right) =>
    left.file.localeCompare(right.file),
  );
}

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".ts")
      ? [{ file: entryPath, content: readFileSync(entryPath, "utf8") }]
      : [];
  });
}

function checkUnsupportedKeyContracts() {
  const content = readRepoFile(
    "src/declarative-validation/diagnostics/profile-config-diagnostics.ts",
  );
  const requiredRegexKeys = ["matches", "pattern", "regex", "regexp"];
  const requiredUnsafeKeys = [
    "callback",
    "eval",
    "execute",
    "expression",
    "function",
    "import",
    "imports",
    "plugin",
    "script",
  ];

  for (const key of requiredRegexKeys) {
    if (!content.includes(`"${key}"`)) {
      failures.push(`profile-config-diagnostics.ts: missing regex-like key ${key}`);
    }
  }

  for (const key of requiredUnsafeKeys) {
    if (!content.includes(`"${key}"`)) {
      failures.push(
        `profile-config-diagnostics.ts: missing executable-like key ${key}`,
      );
    }
  }
}

function checkRejectionCoverage() {
  const profileTests = readRepoFile("tests/declarative-validation-profile.test.ts");
  const assertionTests = readRepoFile(
    "tests/declarative-validation-assertions.test.ts",
  );
  const compilerTests = readRepoFile(
    "tests/declarative-validation-compiler.test.ts",
  );
  const directProfileTests = readRepoFile(
    "tests/declarative-validation-compiler-direct-profile.ts",
  );
  const combined = [
    profileTests,
    assertionTests,
    compilerTests,
    directProfileTests,
  ].join("\n");
  const phrases = [
    'pattern: "^(a+)+$"',
    'regex: "^(a+)+$"',
    'matches: "^(a+)+$"',
    'regexp: "^(a+)+$"',
    'script: "return true"',
    'plugin: () => "mission-control"',
    "does not execute nested profile payloads while generating evidence",
    "containsFunction(result.plan)",
    "profile.config.unsupportedKey",
  ];

  for (const phrase of phrases) {
    if (!combined.includes(phrase)) {
      failures.push(`declarative validation tests: missing coverage phrase ${phrase}`);
    }
  }
}

function checkEvidenceCoverage() {
  const evidence = readRepoFile(
    "docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md",
  );
  const phrases = [
    "arbitrary JavaScript",
    "expression evaluation",
    "profile-sourced regex compilation",
    "plugins",
    "network calls",
    "LLM calls",
    "file watching",
    "persistence",
    "profile-specific core semantics",
  ];

  for (const phrase of phrases) {
    if (!evidence.includes(phrase)) {
      failures.push(`boundary evidence: missing phrase ${phrase}`);
    }
  }
}

function checkPatternCoverage() {
  const runtimeCases = [
    {
      label: "Function constructor",
      content: 'const predicate = Function("return true");',
    },
    {
      label: "Function constructor",
      content: 'const predicate = new Function("return true");',
    },
    {
      label: "network call or network module",
      content: 'import "node:http";',
    },
    {
      label: "network call or network module",
      content: 'import http2 from "node:http2";',
    },
    {
      label: "network call or network module",
      content: 'import { lookup } from "node:dns/promises";',
    },
    {
      label: "network call or network module",
      content: 'const http = require("node:http");',
    },
    {
      label: "network call or network module",
      content: 'import https from "https";',
    },
  ];
  const profileSpecificCases = [
    "const entityRegistries = new Map();",
    "const EntityRegistry = {};",
    'const note = "entity registries";',
    "const entityIds = [];",
    'const note = "issue keys";',
    "const relationshipType = 'blocks';",
    'const note = "relationship types";',
    "const semanticScoring = true;",
    "const SemanticScoring = true;",
    "const semanticScore = 1;",
    'const note = "semantic scoring";',
  ];

  for (const { label, content } of runtimeCases) {
    const matched = forbiddenRuntimePatterns.some(
      (pattern) => pattern.label === label && pattern.pattern.test(content),
    );
    if (!matched) {
      failures.push(`boundary pattern self-check: missing ${label} for ${content}`);
    }
  }

  for (const content of profileSpecificCases) {
    if (!profileSpecificTerms.some((pattern) => pattern.test(content))) {
      failures.push(
        `profile-specific term self-check: missing coverage for ${content}`,
      );
    }
  }
}

function readRepoFile(file) {
  return readFileSync(resolve(repoRoot, file), "utf8");
}

function relativePath(base, file) {
  const normalizedBase = resolve(base);
  const normalizedFile = resolve(file);

  return normalizedFile.startsWith(`${normalizedBase}/`)
    ? normalizedFile.slice(normalizedBase.length + 1)
    : normalizedFile;
}
