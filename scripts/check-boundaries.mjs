#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
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
const annotationSemanticPatterns = [
  { label: "SpecTrace", pattern: /\bSpecTrace\b/ },
  {
    label: "markdown-profile",
    pattern: /(?:^|[^\w])markdown[-_]profile(?:$|[^\w])/i,
  },
  {
    label: "markdown-runtime",
    pattern: /(?:^|[^\w])markdown[-_]runtime(?:$|[^\w])/i,
  },
  { label: "MCP", pattern: /(?:^|[^\w])MCP(?:$|[^\w])/i },
  { label: "LLM", pattern: /(?:^|[^\w])LLM(?:$|[^\w])/i },
  { label: "entity registry", pattern: /\bentity(?:Registry|Registries)\b/i },
  { label: "entity ID", pattern: /\bentity(?:Id|ID)\b/ },
  { label: "issue key", pattern: /\bissueKey\b/ },
  { label: "profile ID", pattern: /\bprofileId\b/ },
  { label: "relationship type", pattern: /\brelationshipType\b/ },
  { label: "semantic evaluator", pattern: /\bsemanticEvaluator\b/ },
];

if (isMain(process.argv[1])) {
  const result = runBoundaryAudit();

  if (result.dependencyMatches.length > 0) {
    console.error("Boundary dependency audit FAIL");
    for (const match of result.dependencyMatches) {
      console.error(
        `${match.section}: ${formatDependencyMatch(match)} matched ${match.label}`,
      );
    }
    process.exit(1);
  }

  if (result.annotationSemanticMatches.length > 0) {
    console.error("Annotation semantic boundary FAIL");
    for (const match of result.annotationSemanticMatches) {
      console.error(
        `${relativePath(result.repoRoot, match.filePath)}: ${match.label} matched ${match.term}`,
      );
    }
    process.exit(1);
  }

  console.log("Boundary dependency audit PASS");
  console.log(`Direct dependencies scanned: ${result.dependencyNames.length}`);
  console.log("Forbidden dependency matches: 0");
  console.log("Annotation semantic boundary PASS");
  console.log("Annotation semantic leakage matches: 0");
}

export function runBoundaryAudit(repoRoot = defaultRepoRoot) {
  const dependencyAudit = runBoundaryDependencyAudit(repoRoot);

  return {
    repoRoot,
    ...dependencyAudit,
    annotationSemanticMatches: scanAnnotationSemanticLeakage(repoRoot),
  };
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

export function scanAnnotationSemanticLeakage(repoRoot = defaultRepoRoot) {
  return inspectAnnotationSemanticLeakage(sourceFiles(join(repoRoot, "src")));
}

export function inspectAnnotationSemanticLeakage(sources) {
  return sources.flatMap(({ filePath, content }) => {
    const matches = [];

    for (const { label, pattern } of annotationSemanticPatterns) {
      const match = pattern.exec(content);

      if (match !== null) {
        matches.push({
          filePath,
          label,
          term: match[0],
        });
      }
    }

    return matches;
  });
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

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      return sourceFiles(entryPath);
    }

    if (!entry.isFile() || !entry.name.endsWith(".ts")) {
      return [];
    }

    return [
      {
        filePath: entryPath,
        content: readFileSync(entryPath, "utf8"),
      },
    ];
  });
}

function relativePath(repoRoot, filePath) {
  const normalizedRepoRoot = resolve(repoRoot);
  const normalizedFilePath = resolve(filePath);

  if (!normalizedFilePath.startsWith(`${normalizedRepoRoot}/`)) {
    return normalizedFilePath;
  }

  return normalizedFilePath.slice(normalizedRepoRoot.length + 1);
}

function isMain(entryPath) {
  return (
    entryPath !== undefined &&
    import.meta.url === pathToFileURL(resolve(entryPath)).href
  );
}
