import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const wrapperPath = join(
  repoRoot,
  "skills",
  "profile-backed-markdown",
  "scripts",
  "validate-profile-backed-markdown.mjs",
);
const bundlePath = join(repoRoot, "dist-bundled", "markdown-engine-cli.mjs");
const buildTimeoutMs = 30_000;
const commandTimeoutMs = 10_000;
const maxBuffer = 10 * 1024 * 1024;
const tempDirs: string[] = [];

interface CommandResult {
  exitCode: number | string;
  stderr: string;
  stdout: string;
}

interface ExecFileFailure extends Error {
  code?: number | string;
  stderr?: string | Buffer;
  stdout?: string | Buffer;
}

const passingMarkdown = `---
validationProfile: operational-spec
title: Operational Spec Example
owner: platform-team
status: ready
---

# Objective

Mission control uses this structural profile to confirm a small operating spec
has the required sections, handoff links, and risk tracking details.

# Context / Constraints

The example stays generic. It validates Markdown headings, tables, IDs, list
content, literal text, and links without attaching domain meaning to the core
engine.

# Execution Plan

- MUST Validate profile fixtures locally.
- MUST Record evidence before requesting review.
- Keep the checks deterministic and local-only.

# Risk Register

| ID | Mitigation | Status |
| --- | --- | --- |
| OPS-RISK-1 | Keep examples structural. | tracked |
| OPS-RISK-2 | Keep commands local. | closed |

# Handoff Links

The [handoff packet](./handoff-packet.md) records follow-up review notes for the
next operator.
`;

const failingMarkdown = passingMarkdown.replace(
  "- MUST Record evidence before requesting review.",
  "- Record evidence before requesting review.",
);

describe("profile-backed-markdown skill wrapper", () => {
  beforeAll(async () => {
    await execFileAsync(process.execPath, ["scripts/build-bundled-cli.mjs"], {
      cwd: repoRoot,
      maxBuffer,
      timeout: buildTimeoutMs,
    });
  }, buildTimeoutMs);

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })),
    );
  });

  it("routes validationProfile frontmatter to a local profile asset", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "spec.md"), passingMarkdown);

    const result = await runWrapper(["--file", "spec.md"], cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");

    const output = JSON.parse(result.stdout) as {
      diagnostics: unknown[];
      profile: { ruleCount: number; syntaxVersion: string };
      valid: boolean;
    };
    expect(output.valid).toBe(true);
    expect(output.diagnostics).toEqual([]);
    expect(output.profile).toMatchObject({
      ruleCount: 9,
      syntaxVersion: "markdown-engine.validation@v1",
    });
  });

  it("accepts a quoted validationProfile scalar with an inline YAML comment", async () => {
    const cwd = await makeTempDir();
    await writeFile(
      join(cwd, "spec.md"),
      passingMarkdown.replace(
        "validationProfile: operational-spec",
        'validationProfile: "operational-spec" # local skill asset',
      ),
    );

    const result = await runWrapper(["--file", "spec.md"], cwd);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({ valid: true });
  });

  it("preserves validator JSON on failure and exits non-zero", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "spec.md"), failingMarkdown);

    const result = await runWrapper(["--file", "spec.md"], cwd);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");

    const output = JSON.parse(result.stdout) as {
      diagnostics: Array<{ message?: string; ruleId?: string; sourceRange?: unknown }>;
      valid: boolean;
    };
    expect(output.valid).toBe(false);
    expect(output.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: expect.stringContaining("MUST"),
          ruleId: "execution.must.count",
          sourceRange: expect.any(Object),
        }),
      ]),
    );
  });

  it("can emit a compact repair brief from validator diagnostics", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "spec.md"), failingMarkdown);

    const result = await runWrapper(["--file", "spec.md", "--repair-brief"], cwd);

    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({ valid: false });
    expect(result.stderr).toContain("Repair brief:");
    expect(result.stderr).toContain("ruleId: execution.must.count");
    expect(result.stderr).toContain("message:");
    expect(result.stderr).toContain("sourceRange:");
  });

  it("does not require a globally installed markdown-engine binary", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "spec.md"), passingMarkdown);

    const result = await runWrapper(["--file", "spec.md"], cwd, {
      MARKDOWN_ENGINE_CLI: bundlePath,
      PATH: "",
    });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ valid: true });
  });

  it("rejects frontmatter profile traversal before invoking validation", async () => {
    const cwd = await makeTempDir();
    await writeFile(
      join(cwd, "spec.md"),
      passingMarkdown.replace(
        "validationProfile: operational-spec",
        "validationProfile: ../operational-spec",
      ),
    );

    const result = await runWrapper(["--file", "spec.md"], cwd);

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("validationProfile must not contain");
  });

  it("rejects duplicate file targets instead of overwriting the first target", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "first.md"), failingMarkdown);
    await writeFile(join(cwd, "second.md"), passingMarkdown);

    const result = await runWrapper(
      ["--file", "first.md", "--file", "second.md"],
      cwd,
    );

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Expected one Markdown file target");
  });
});

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "profile-backed-markdown-"));
  tempDirs.push(dir);
  return dir;
}

async function runWrapper(
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv = {},
): Promise<CommandResult> {
  try {
    const result = await execFileAsync(process.execPath, [wrapperPath, ...args], {
      cwd,
      env: { ...process.env, ...env },
      maxBuffer,
      timeout: commandTimeoutMs,
    });

    return {
      exitCode: 0,
      stderr: result.stderr,
      stdout: result.stdout,
    };
  } catch (error) {
    const failure = error as ExecFileFailure;

    if (failure.code === undefined) {
      throw error;
    }

    return {
      exitCode: failure.code,
      stderr: toText(failure.stderr),
      stdout: toText(failure.stdout),
    };
  }
}

function toText(value: string | Buffer | undefined): string {
  if (value === undefined) {
    return "";
  }

  return typeof value === "string" ? value : value.toString("utf8");
}
