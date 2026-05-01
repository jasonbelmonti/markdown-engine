#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = join(scriptDir, "..");
const forbiddenDependencyNames = new Set([
  "markdown-profile",
  "markdown-runtime",
  "markdown-mcp",
  "agent-adapter",
  "agent-adapters",
  "agent-eval-harness",
  "axios",
  "got",
  "ky",
  "node-fetch",
  "cross-fetch",
  "isomorphic-fetch",
  "undici",
  "ws",
  "openai",
  "anthropic",
]);
const forbiddenDependencyPatterns = [
  {
    label: "MCP SDK",
    pattern: /(?:^|[@/_-])modelcontextprotocol(?:$|[\/_-])/,
  },
  { label: "MCP", pattern: /(?:^|[@/_-])mcp(?:$|[\/_-])/ },
  {
    label: "OpenAI",
    pattern: /(?:^|[@/_-])openai(?:$|[\/_-])/,
  },
  {
    label: "Anthropic",
    pattern: /(?:^|[@/_-])anthropic(?:$|[\/_-])/,
  },
  {
    label: "AI SDK",
    pattern: /(?:^|[@/_-])ai[-_]sdk(?:$|[\/_-])/,
  },
  {
    label: "agent-adapter",
    pattern: /(?:^|[@/_-])agent[-_]adapter(?:s)?(?:$|[\/_-])/,
  },
  { label: "LLM", pattern: /(?:^|[@/_-])llm(?:$|[\/_-])/ },
  {
    label: "markdown-profile",
    pattern: /(?:^|[@/_-])markdown[-_]profile(?:$|[\/_-])/,
  },
  {
    label: "markdown-runtime",
    pattern: /(?:^|[@/_-])markdown[-_]runtime(?:$|[\/_-])/,
  },
  {
    label: "markdown-mcp",
    pattern: /(?:^|[@/_-])markdown[-_]mcp(?:$|[\/_-])/,
  },
  {
    label: "profile compiler",
    pattern: /(?:^|[@/_-])profile[-_]compiler(?:$|[\/_-])/,
  },
  {
    label: "runtime lens",
    pattern: /(?:^|[@/_-])runtime[-_]lens(?:$|[\/_-])/,
  },
  {
    label: "network service",
    pattern: /(?:^|[@/_-])network[-_]service(?:$|[\/_-])/,
  },
];
const dependencySections = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

if (isMain(process.argv[1])) {
  const result = runBoundaryDependencyAudit();

  if (result.dependencyMatches.length > 0) {
    console.error("Boundary dependency audit FAIL");
    for (const match of result.dependencyMatches) {
      console.error(
        `${match.section}: ${formatDependencyMatch(match)} matched ${match.label}`,
      );
    }
    process.exit(1);
  }

  console.log("Boundary dependency audit PASS");
  console.log(`Direct dependencies scanned: ${result.dependencyNames.length}`);
  console.log("Forbidden dependency matches: 0");
}

export function runBoundaryDependencyAudit(repoRoot = defaultRepoRoot) {
  const packageJsonPath = join(repoRoot, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const dependencyNames = dependencySections.flatMap((section) =>
    Object.entries(packageJson[section] ?? {}).map(([name, spec]) => ({
      name,
      section,
      spec,
    })),
  );
  const dependencyMatches = inspectDependencies(dependencyNames);

  return {
    dependencyNames,
    dependencyMatches,
  };
}

export function inspectDependencies(dependencies) {
  return dependencies.flatMap(({ name, section, spec }) => {
    const targets = [
      { kind: "name", value: name },
      ...dependencySpecTargets(spec).map((target) => ({
        kind: "npm alias target",
        value: target,
      })),
    ];
    const matches = [];

    for (const { kind, value } of targets) {
      const normalizedName = value.toLowerCase();
      const targetMatches = [];

      for (const { label, pattern } of forbiddenDependencyPatterns) {
        if (
          pattern.test(normalizedName) &&
          !targetMatches.some(
            (match) => match.target === value && match.label === label,
          )
        ) {
          targetMatches.push({
            name,
            section,
            spec,
            target: value,
            targetKind: kind,
            label,
          });
        }
      }

      if (
        forbiddenDependencyNames.has(normalizedName) &&
        targetMatches.length === 0
      ) {
        targetMatches.push({
          name,
          section,
          spec,
          target: value,
          targetKind: kind,
          label: normalizedName,
        });
      }

      matches.push(...targetMatches);
    }

    return matches;
  });
}

function dependencySpecTargets(spec) {
  if (typeof spec !== "string") {
    return [];
  }

  const trimmedSpec = spec.trim();
  if (!trimmedSpec.startsWith("npm:")) {
    return [];
  }

  const aliasTarget = packageNameFromAliasTarget(trimmedSpec.slice(4));
  return aliasTarget === undefined ? [] : [aliasTarget];
}

function packageNameFromAliasTarget(aliasTarget) {
  if (aliasTarget.startsWith("@")) {
    const scopeSeparator = aliasTarget.indexOf("/");
    if (scopeSeparator === -1) {
      return undefined;
    }

    const versionSeparator = aliasTarget.indexOf("@", scopeSeparator + 1);
    return versionSeparator === -1
      ? aliasTarget
      : aliasTarget.slice(0, versionSeparator);
  }

  const versionSeparator = aliasTarget.indexOf("@");
  return versionSeparator === -1
    ? aliasTarget
    : aliasTarget.slice(0, versionSeparator);
}

function formatDependencyMatch(match) {
  if (match.targetKind === "npm alias target") {
    return `${match.name} -> ${match.target}`;
  }

  return match.name;
}

function isMain(entryPath) {
  return (
    entryPath !== undefined &&
    import.meta.url === pathToFileURL(resolve(entryPath)).href
  );
}
