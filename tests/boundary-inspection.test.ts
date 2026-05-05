import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  inspectAnnotationSemanticLeakage,
  inspectDependencies,
  runBoundaryAudit,
  runBoundaryDependencyAudit,
} from "../scripts/check-boundaries.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

describe("WP-5 boundary dependency audit", () => {
  it("VAL-8/EVD-8 reports no forbidden dependency drift", () => {
    const output = execFileSync(
      process.execPath,
      ["scripts/check-boundaries.mjs"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    expect(output).toContain("Boundary dependency audit PASS");
    expect(output).toContain("Annotation semantic boundary PASS");
    expect(output).toContain("Annotation semantic leakage matches: 0");
  });

  it("returns dependency and annotation semantic boundary results together", () => {
    const result = runBoundaryAudit(repoRoot);

    expect(result.dependencyMatches).toEqual([]);
    expect(result.annotationSemanticMatches).toEqual([]);
  });

  it("flags common forbidden MCP and LLM SDK dependency names", () => {
    const matches = inspectDependencies([
      { name: "@modelcontextprotocol/sdk", section: "dependencies" },
      { name: "@mcp/sdk", section: "dependencies" },
      { name: "@anthropic-ai/sdk", section: "dependencies" },
      { name: "@openai/agents", section: "dependencies" },
      { name: "@ai-sdk/openai", section: "dependencies" },
      { name: "@llm/provider", section: "dependencies" },
      { name: "@markdown-runtime/sdk", section: "dependencies" },
      { name: "@profile-compiler/core", section: "dependencies" },
      { name: "markdown-runtime", section: "dependencies" },
      { name: "markdown-profile", section: "dependencies" },
      { name: "mcp-client", section: "dependencies" },
      { name: "llm-provider", section: "dependencies" },
      { name: "profile-compiler", section: "dependencies" },
      { name: "runtime-lens", section: "dependencies" },
      { name: "network-service", section: "dependencies" },
    ]);

    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "@modelcontextprotocol/sdk" }),
        expect.objectContaining({ name: "@mcp/sdk" }),
        expect.objectContaining({ name: "@anthropic-ai/sdk" }),
        expect.objectContaining({ name: "@openai/agents" }),
        expect.objectContaining({ name: "@ai-sdk/openai" }),
        expect.objectContaining({ name: "@llm/provider" }),
        expect.objectContaining({ name: "@markdown-runtime/sdk" }),
        expect.objectContaining({ name: "@profile-compiler/core" }),
        expect.objectContaining({ name: "markdown-runtime" }),
        expect.objectContaining({ name: "markdown-profile" }),
        expect.objectContaining({ name: "mcp-client" }),
        expect.objectContaining({ name: "llm-provider" }),
        expect.objectContaining({ name: "profile-compiler" }),
        expect.objectContaining({ name: "runtime-lens" }),
        expect.objectContaining({ name: "network-service" }),
      ]),
    );
  });

  it("does not flag unrelated dependency names with common substrings", () => {
    const matches = inspectDependencies([
      { name: "@babel/runtime", section: "dependencies" },
      { name: "@types/node", section: "devDependencies" },
      { name: "profile-photo", section: "dependencies" },
      { name: "runtime-config", section: "dependencies" },
      { name: "openapi-types", section: "dependencies" },
      { name: "anthropics", section: "dependencies" },
      { name: "@notmcp/sdk", section: "dependencies" },
    ]);

    expect(matches).toEqual([]);
  });

  it("flags npm alias specs that point at forbidden dependency targets", () => {
    const tempRepo = mkdtempSync(join(tmpdir(), "boundary-alias-"));

    try {
      writeFileSync(
        join(tempRepo, "package.json"),
        JSON.stringify({
          dependencies: {
            "engine-client": "npm:openai@latest",
            "protocol-client": "npm:@modelcontextprotocol/sdk@1.0.0",
            "remark-alias": "npm:remark-parse@latest",
          },
        }),
      );

      const result = runBoundaryDependencyAudit(tempRepo);

      expect(result.dependencyNames).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "engine-client",
            spec: "npm:openai@latest",
          }),
        ]),
      );
      expect(result.dependencyMatches).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "engine-client",
            target: "openai",
            targetKind: "npm alias target",
          }),
          expect.objectContaining({
            name: "protocol-client",
            target: "@modelcontextprotocol/sdk",
            targetKind: "npm alias target",
          }),
        ]),
      );
      expect(result.dependencyMatches).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "remark-alias" }),
        ]),
      );
    } finally {
      rmSync(tempRepo, { force: true, recursive: true });
    }
  });

  it("flags annotation semantic identifiers that belong outside the engine", () => {
    const matches = inspectAnnotationSemanticLeakage([
      {
        filePath: "src/api/annotations.ts",
        content: [
          "type ProfileId = string;",
          "interface IssueKey {}",
          "type EntityID = string;",
          "const relationship_type = 'blocks';",
          "class SemanticEvaluator {",
          "  run() { return 'done'; }",
          "}",
          "const registry = EntityRegistries.open(markdown_profile);",
        ].join("\n"),
      },
    ]);

    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "profile ID" }),
        expect.objectContaining({ label: "entity registry" }),
        expect.objectContaining({ label: "issue key" }),
        expect.objectContaining({ label: "entity ID" }),
        expect.objectContaining({ label: "relationship type" }),
        expect.objectContaining({ label: "semantic evaluator" }),
        expect.objectContaining({ label: "markdown-profile" }),
      ]),
    );
  });

  it("flags each MCP and LLM identifier form independently", () => {
    const cases = [
      {
        content: "const mcpClient = createClient();",
        label: "MCP",
        term: "mcpClient",
      },
      { content: "class MCPClient {}", label: "MCP", term: "MCPClient" },
      {
        content: "const llmProvider = createProvider();",
        label: "LLM",
        term: "llmProvider",
      },
      { content: "class LLMProvider {}", label: "LLM", term: "LLMProvider" },
      {
        content: "const protocol = new ModelContextProtocolClient();",
        label: "MCP",
        term: "ModelContextProtocolClient",
      },
      {
        content: "const model = new LargeLanguageModelProvider();",
        label: "LLM",
        term: "LargeLanguageModelProvider",
      },
    ];

    for (const { content, label, term } of cases) {
      const matches = inspectAnnotationSemanticLeakage([
        { filePath: `src/api/${term}.ts`, content },
      ]);

      expect(matches).toEqual([
        expect.objectContaining({
          label,
          term,
        }),
      ]);
    }
  });

  it("flags annotation semantic phrases across separate words", () => {
    const cases = [
      {
        content: 'const note = "model context protocol client";',
        label: "MCP",
        term: "model context protocol",
      },
      {
        content: 'const note = "large language model provider";',
        label: "LLM",
        term: "large language model",
      },
      {
        content: 'const note = "profile ID policy";',
        label: "profile ID",
        term: "profile ID",
      },
      {
        content: "// entity registry lookup",
        label: "entity registry",
        term: "entity registry",
      },
    ];

    for (const { content, label, term } of cases) {
      const matches = inspectAnnotationSemanticLeakage([
        { filePath: `src/api/${label}.ts`, content },
      ]);

      expect(matches).toEqual([
        expect.objectContaining({
          label,
          term,
        }),
      ]);
    }
  });

  it("does not flag unrelated identifiers that only contain acronym letters", () => {
    const matches = inspectAnnotationSemanticLeakage([
      {
        filePath: "src/api/renderer.ts",
        content: "const shellMode = true; const promptCompiler = shellMode;",
      },
    ]);

    expect(matches).toEqual([]);
  });

  it("does not treat separated code identifiers as semantic phrases", () => {
    const matches = inspectAnnotationSemanticLeakage([
      {
        filePath: "src/api/annotations.ts",
        content: "const entity = registry; const model = context.protocol;",
      },
    ]);

    expect(matches).toEqual([]);
  });
});
