#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = join(scriptDir, "..");

const forbiddenSourcePatterns = [
  { label: "MCP", pattern: /\bmcp\b/gi },
  { label: "MCP SDK", pattern: /@modelcontextprotocol\//gi },
  { label: "agent adapter", pattern: /agent[-_ ]?adapter/gi },
  { label: "LLM", pattern: /\bllm\b/gi },
  { label: "OpenAI", pattern: /\bopenai\b|@openai\//gi },
  { label: "Anthropic", pattern: /\banthropic\b|@anthropic-ai\//gi },
  { label: "AI SDK", pattern: /@ai-sdk\//gi },
  { label: "fetch call", pattern: /\bfetch\s*\(/gi },
  {
    label: "network module",
    pattern: /["'](?:node:)?(?:http|https|http2|net|tls|dgram|dns)["']/gi,
  },
  {
    label: "network client package",
    pattern: /["'](?:node-fetch|cross-fetch|isomorphic-fetch|undici|axios|got|ky|ws)["']/gi,
  },
  { label: "HTTP request", pattern: /\bhttps?\.(?:request|get)\s*\(/gi },
  { label: "WebSocket", pattern: /\bWebSocket\b/gi },
  { label: "network service", pattern: /network[-_ ]?service/gi },
  { label: "profile compiler", pattern: /profile[-_ ]?compiler/gi },
  { label: "runtime lens", pattern: /runtime[-_ ]?lens/gi },
  { label: "markdown-profile", pattern: /markdown[-_ ]?profile/gi },
  { label: "markdown-runtime", pattern: /markdown[-_ ]?runtime/gi },
  { label: "markdown-mcp", pattern: /markdown[-_ ]?mcp/gi },
];
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
const forbiddenDependencyFragments = [
  "modelcontextprotocol",
  "mcp",
  "openai",
  "anthropic",
  "ai-sdk",
  "profile",
  "runtime",
  "agent-adapter",
  "llm",
];
const dependencySections = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
];

if (isMain(process.argv[1])) {
  const result = runBoundaryInspection();

  if (result.sourceMatches.length > 0 || result.dependencyMatches.length > 0) {
    console.error("Boundary inspection FAIL");
    for (const match of result.sourceMatches) {
      console.error(
        `${match.file}:${match.line}:${match.column} ${match.label} ${match.text}`,
      );
    }
    for (const match of result.dependencyMatches) {
      console.error(`${match.section}: ${match.name} matched ${match.label}`);
    }
    process.exit(1);
  }

  console.log("Boundary inspection PASS");
  console.log(`Source files scanned: ${result.sourceFiles.length}`);
  console.log(`Direct dependencies scanned: ${result.dependencyNames.length}`);
  console.log("Forbidden source matches: 0");
  console.log("Forbidden dependency matches: 0");
}

export function runBoundaryInspection(repoRoot = defaultRepoRoot) {
  const sourceRoot = join(repoRoot, "src");
  const packageJsonPath = join(repoRoot, "package.json");
  const sourceFiles = listFiles(sourceRoot).filter((file) =>
    file.endsWith(".ts"),
  );
  const sourceMatches = inspectSourceFiles(sourceFiles, repoRoot);
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const dependencyNames = dependencySections.flatMap((section) =>
    Object.keys(packageJson[section] ?? {}).map((name) => ({ name, section })),
  );
  const dependencyMatches = inspectDependencies(dependencyNames);

  return {
    sourceFiles,
    sourceMatches,
    dependencyNames,
    dependencyMatches,
  };
}

export function listFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory)
    .sort()
    .flatMap((entry) => {
      const path = join(directory, entry);
      const stat = statSync(path);

      return stat.isDirectory() ? listFiles(path) : [path];
    });
}

export function inspectSourceFiles(files, repoRoot = defaultRepoRoot) {
  return files.flatMap((file) => {
    const text = readFileSync(file, "utf8");

    return inspectSourceText(file, text, repoRoot);
  });
}

export function inspectSourceText(file, text, repoRoot = defaultRepoRoot) {
  return forbiddenSourcePatterns.flatMap(({ label, pattern }) =>
    matchPattern(file, text, repoRoot, label, pattern),
  );
}

function matchPattern(file, text, repoRoot, label, pattern) {
  const matches = [];
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const location = locationForOffset(text, match.index);
    matches.push({
      file: relative(repoRoot, file),
      line: location.line,
      column: location.column,
      label,
      text: lineAtOffset(text, match.index).trim(),
    });
  }

  pattern.lastIndex = 0;
  return matches;
}

function locationForOffset(text, offset) {
  const linesBeforeOffset = text.slice(0, offset).split("\n");
  const line = linesBeforeOffset.length;
  const column = linesBeforeOffset.at(-1).length + 1;

  return { line, column };
}

function lineAtOffset(text, offset) {
  const lineStart = text.lastIndexOf("\n", offset) + 1;
  const lineEnd = text.indexOf("\n", offset);

  return text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
}

export function inspectDependencies(dependencies) {
  return dependencies.flatMap(({ name, section }) => {
    const normalizedName = name.toLowerCase();
    const directMatch = forbiddenDependencyNames.has(normalizedName)
      ? [{ name, section, label: normalizedName }]
      : [];
    const fragmentMatches = forbiddenDependencyFragments
      .filter((fragment) => normalizedName.includes(fragment))
      .map((fragment) => ({ name, section, label: fragment }));

    return [...directMatch, ...fragmentMatches];
  });
}

function isMain(entryPath) {
  return (
    entryPath !== undefined &&
    import.meta.url === pathToFileURL(resolve(entryPath)).href
  );
}
