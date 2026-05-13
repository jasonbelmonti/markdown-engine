import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { parseCliArgs } from "../src/cli/args.js";
import { runCli, type TextOutput } from "../src/cli/run.js";

const tempDirs: string[] = [];
const missionBriefMarkdown = `---
title: Mission Brief
owner: docs
---

# Mission Brief

Body text.
`;

describe("CLI", () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })),
    );
  });

  it("accepts --file and writes 1.0 rich IR JSON by default", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), missionBriefMarkdown);
    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: ["--file", "mission.md"],
      cwd,
    });

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");
    const result = JSON.parse(stdout.text());

    expectMissionBriefRichIrOutput(result);
  });

  it("accepts assignment-form --file as a single-file target", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), missionBriefMarkdown);
    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: ["--file=mission.md"],
      cwd,
    });

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");
    expectMissionBriefRichIrOutput(JSON.parse(stdout.text()));
  });

  it("accepts --path as a single-file target", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "notes.md"), "# Notes\n");
    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: ["--path=notes.md"],
      cwd,
    });

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");
    expect(JSON.parse(stdout.text())).toMatchObject({
      document: {
        path: "notes.md",
        version: "1.0.0",
        target: {
          kind: "node",
          nodeType: "document",
        },
        children: [{ type: "heading", text: "Notes" }],
        sections: expect.arrayContaining([
          expect.objectContaining({
            title: "Notes",
          }),
        ]),
      },
    });
  });

  it("accepts an explicit legacy document-version selector", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "legacy.md"), "# Legacy\n");
    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: ["--document-version", "0.0.0", "--file", "legacy.md"],
      cwd,
    });

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");
    const result = JSON.parse(stdout.text());

    expect(result).toMatchObject({
      diagnostics: [],
      document: {
        kind: "markdown-document",
        path: "legacy.md",
        version: "0.0.0",
        children: [{ type: "heading", text: "Legacy" }],
      },
    });
    expect(result.document).not.toHaveProperty("compatibility");
    expect(result.document).not.toHaveProperty("target");
    expect(result.document).not.toHaveProperty("sections");
    expect(result.document.children[0]).not.toHaveProperty("target");
  });

  it.each([
    {
      args: ["--help"],
      usage: "Usage: markdown-engine",
    },
    {
      args: ["-h"],
      usage: "Usage: markdown-engine",
    },
  ])("writes normalize help to stdout: $args", async ({ args, usage }) => {
    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args,
      cwd: "/",
    });

    expect(exitCode).toBe(0);
    expect(stdout.text()).toContain(usage);
    expect(stdout.text()).toContain("Usage: markdown-engine validate");
    expect(stderr.text()).toBe("");
  });

  it.each([
    {
      args: ["--document-version", "1.0.0-draft", "--file", "notes.md"],
      message: "Invalid document version: 1.0.0-draft.",
    },
    {
      args: ["--document-version=1.0.0-draft", "--file", "notes.md"],
      message: "Invalid document version: 1.0.0-draft.",
    },
    {
      args: ["--document-version", "--file", "notes.md"],
      message: "Missing value for --document-version.",
    },
    {
      args: ["--document-version=", "--file", "notes.md"],
      message: "Missing value for --document-version.",
    },
    {
      args: [
        "--document-version",
        "0.0.0",
        "--document-version",
        "1.0.0",
        "--file",
        "notes.md",
      ],
      message: "Expected at most one --document-version selector.",
    },
    {
      args: [
        "--document-version=0.0.0",
        "--document-version",
        "1.0.0",
        "--file",
        "notes.md",
      ],
      message: "Expected at most one --document-version selector.",
    },
  ])(
    "rejects invalid document-version selector input: $message",
    async ({ args, message }) => {
      const { exitCode, stderr, stdout } = await runCliWithOutput({
        args,
        cwd: "/",
      });

      expect(exitCode).toBe(2);
      expect(stdout.text()).toBe("");
      expect(stderr.text()).toContain(message);
      expect(stderr.text()).toContain("Usage: markdown-engine");
    },
  );

  it.each([
    {
      args: [],
      message: "Expected exactly one of --file or --path.",
    },
    {
      args: ["--bogus"],
      message: "Unknown argument: --bogus",
    },
    {
      args: ["--file"],
      message: "Missing value for --file.",
    },
    {
      args: ["--path"],
      message: "Missing value for --path.",
    },
    {
      args: ["--file="],
      message: "Target path cannot be empty.",
    },
    {
      args: ["--file", "a.md", "--path", "b.md"],
      message: "Expected one Markdown file target, received multiple.",
    },
  ])(
    "returns usage errors with exit code 2: $message",
    async ({ args, message }) => {
      const { exitCode, stderr, stdout } = await runCliWithOutput({
        args,
        cwd: "/",
      });

      expect(exitCode).toBe(2);
      expect(stdout.text()).toBe("");
      expect(stderr.text()).toContain(message);
      expect(stderr.text()).toContain("Usage: markdown-engine");
    },
  );

  it("reports unreadable file targets without partial JSON output", async () => {
    const cwd = await makeTempDir();
    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: ["--file", "missing.md"],
      cwd,
    });

    expect(exitCode).toBe(1);
    expect(stdout.text()).toBe("");
    expect(stderr.text()).toContain('Unable to read "missing.md"');
  });

  it("accepts an explicit 1.0 document-version selector as rich IR output", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), missionBriefMarkdown);
    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: ["--document-version=1.0.0", "--file", "mission.md"],
      cwd,
    });

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");
    const result = JSON.parse(stdout.text());

    expectMissionBriefRichIrOutput(result);
  });

  it("rejects directory targets instead of traversing them", async () => {
    const cwd = await makeTempDir();
    await mkdir(join(cwd, "docs"));
    await writeFile(join(cwd, "docs", "nested.md"), "# Nested\n");
    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: ["--path", "docs"],
      cwd,
    });

    expect(exitCode).toBe(1);
    expect(stdout.text()).toBe("");
    expect(stderr.text()).toContain("Directories are not supported");
  });

  it("requires exactly one file target", () => {
    expect(parseCliArgs([])).toMatchObject({
      kind: "error",
      message: "Expected exactly one of --file or --path.",
    });
    expect(parseCliArgs(["--file", "a.md", "--path", "b.md"])).toMatchObject({
      kind: "error",
      message: "Expected one Markdown file target, received multiple.",
    });
  });
});

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "markdown-engine-cli-"));
  tempDirs.push(dir);
  return dir;
}

function expectMissionBriefRichIrOutput(result: unknown): void {
  expect(result).toMatchObject({
    diagnostics: [],
    document: {
      kind: "markdown-document",
      path: "mission.md",
      version: "1.0.0",
      compatibility: {
        mode: "default",
      },
      frontmatter: {
        title: "Mission Brief",
        owner: "docs",
      },
      children: [
        {
          type: "heading",
          text: "Mission Brief",
          target: {
            kind: "node",
            nodeType: "heading",
          },
        },
        {
          type: "paragraph",
          text: "Body text.",
        },
      ],
    },
  });
  expect(result).toMatchObject({
    document: {
      target: {
        kind: "node",
        nodeType: "document",
      },
      sections: expect.arrayContaining([
        expect.objectContaining({
          depth: 1,
          title: "Mission Brief",
        }),
      ]),
    },
  });
}

function createTextOutput(): TextOutput & { text(): string } {
  let output = "";

  return {
    text: () => output,
    write: (chunk: string) => {
      output += chunk;
      return true;
    },
  };
}

async function runCliWithOutput(input: {
  args: string[];
  cwd: string;
}): Promise<{
  exitCode: number;
  stderr: TextOutput & { text(): string };
  stdout: TextOutput & { text(): string };
}> {
  const stdout = createTextOutput();
  const stderr = createTextOutput();
  const exitCode = await runCli({
    ...input,
    stderr,
    stdout,
  });

  return { exitCode, stderr, stdout };
}
