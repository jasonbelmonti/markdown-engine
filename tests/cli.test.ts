import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { parseCliArgs } from "../src/cli/args.js";
import { runCli, type TextOutput } from "../src/cli/run.js";

const tempDirs: string[] = [];

describe("CLI", () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })),
    );
  });

  it("accepts --file and writes normalized Markdown JSON", async () => {
    const cwd = await makeTempDir();
    await writeFile(
      join(cwd, "mission.md"),
      `---
title: Mission Brief
owner: docs
---

# Mission Brief

Body text.
`,
    );
    const stdout = createTextOutput();
    const stderr = createTextOutput();

    const exitCode = await runCli({
      args: ["--file", "mission.md"],
      cwd,
      stderr,
      stdout,
    });

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");
    expect(JSON.parse(stdout.text())).toMatchObject({
      diagnostics: [],
      document: {
        kind: "markdown-document",
        path: "mission.md",
        version: "0.0.0",
        frontmatter: {
          title: "Mission Brief",
          owner: "docs",
        },
        children: [
          {
            type: "heading",
            text: "Mission Brief",
          },
          {
            type: "paragraph",
            text: "Body text.",
          },
        ],
      },
    });
  });

  it("accepts --path as a single-file target", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "notes.md"), "# Notes\n");
    const stdout = createTextOutput();
    const stderr = createTextOutput();

    const exitCode = await runCli({
      args: ["--path=notes.md"],
      cwd,
      stderr,
      stdout,
    });

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");
    expect(JSON.parse(stdout.text())).toMatchObject({
      document: {
        path: "notes.md",
        version: "0.0.0",
        children: [{ type: "heading", text: "Notes" }],
      },
    });
  });

  it("rejects a 1.0 draft document-version selector until a CLI cutover", async () => {
    const stdout = createTextOutput();
    const stderr = createTextOutput();

    const exitCode = await runCli({
      args: ["--document-version", "1.0.0-draft", "--file", "notes.md"],
      cwd: "/",
      stderr,
      stdout,
    });

    expect(exitCode).toBe(2);
    expect(stdout.text()).toBe("");
    expect(stderr.text()).toContain("Unknown argument: --document-version");
    expect(stderr.text()).toContain("Usage: markdown-engine");
  });

  it("rejects directory targets instead of traversing them", async () => {
    const cwd = await makeTempDir();
    await mkdir(join(cwd, "docs"));
    await writeFile(join(cwd, "docs", "nested.md"), "# Nested\n");
    const stdout = createTextOutput();
    const stderr = createTextOutput();

    const exitCode = await runCli({
      args: ["--path", "docs"],
      cwd,
      stderr,
      stdout,
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
