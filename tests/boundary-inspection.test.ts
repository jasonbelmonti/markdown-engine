import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  inspectDependencies,
  inspectSourceText,
} from "../scripts/check-boundaries.mjs";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

describe("WP-5 boundary inspection", () => {
  it("VAL-8/EVD-8 reports no forbidden source or dependency drift", () => {
    const output = execFileSync(
      process.execPath,
      ["scripts/check-boundaries.mjs"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    expect(output).toContain("Boundary inspection PASS");
  });

  it("flags common forbidden MCP and LLM SDK dependency names", () => {
    const matches = inspectDependencies([
      { name: "@modelcontextprotocol/sdk", section: "dependencies" },
      { name: "@anthropic-ai/sdk", section: "dependencies" },
      { name: "@openai/agents", section: "dependencies" },
      { name: "@ai-sdk/openai", section: "dependencies" },
    ]);

    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "@modelcontextprotocol/sdk" }),
        expect.objectContaining({ name: "@anthropic-ai/sdk" }),
        expect.objectContaining({ name: "@openai/agents" }),
        expect.objectContaining({ name: "@ai-sdk/openai" }),
      ]),
    );
  });

  it("flags common forbidden network source entry points", () => {
    const sourceFile = join(repoRoot, "src/network-boundary-example.ts");
    const matches = inspectSourceText(
      sourceFile,
      [
        'import { request } from "node:https";',
        'import net from "node:net";',
        "const socket = new WebSocket(url);",
        "http.request(options);",
      ].join("\n"),
      repoRoot,
    );

    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "network module" }),
        expect.objectContaining({ label: "WebSocket" }),
        expect.objectContaining({ label: "HTTP request" }),
      ]),
    );
  });

  it("flags camel and Pascal case forbidden source identifiers", () => {
    const sourceFile = join(repoRoot, "src/identifier-boundary-example.ts");
    const matches = inspectSourceText(
      sourceFile,
      [
        "const mcpTransport = {};",
        "type LLMClient = {};",
        "const openAIClient = {};",
        "class AnthropicClient {}",
        "class WebSocketClient {}",
        "class ModelContextProtocolClient {}",
        "class AiSdkClient {}",
      ].join("\n"),
      repoRoot,
    );

    expect(matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "MCP" }),
        expect.objectContaining({ label: "LLM" }),
        expect.objectContaining({ label: "OpenAI" }),
        expect.objectContaining({ label: "Anthropic" }),
        expect.objectContaining({ label: "WebSocket" }),
        expect.objectContaining({ label: "Model Context Protocol" }),
        expect.objectContaining({ label: "AI SDK" }),
      ]),
    );
  });
});
