import { execFile } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";

import { buildCliArtifact } from "../scripts/build-cli-artifact.mjs";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const wrapperPath = join(
  repoRoot,
  "skills",
  "profile-backed-markdown",
  "scripts",
  "validate-profile-backed-markdown.mjs",
);
const skillProfilePath = join(
  repoRoot,
  "skills",
  "profile-backed-markdown",
  "assets",
  "profiles",
  "operational-spec.yaml",
);
const fixtureProfilePath = join(
  repoRoot,
  "fixtures",
  "declarative-validation",
  "examples",
  "operational-spec",
  "profile.yaml",
);
const buildTimeoutMs = 30_000;
const commandTimeoutMs = 10_000;
const maxBuffer = 10 * 1024 * 1024;
const tempDirs: string[] = [];
let suiteBundleDirectory: string | undefined;
let suiteBundlePath: string | undefined;

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
const permissiveProfile = `syntaxVersion: markdown-engine.validation@v1
rules:
  - id: frontmatter.required
    select:
      target: document
    assert:
      frontmatterRequired:
        fields:
          - title
`;

describe("profile-backed-markdown skill wrapper", () => {
  beforeAll(async () => {
    suiteBundleDirectory = await mkdtemp(
      join(tmpdir(), "profile-backed-markdown-cli-"),
    );
    suiteBundlePath = join(suiteBundleDirectory, "markdown-engine-cli.mjs");

    await buildCliArtifact({
      outfile: suiteBundlePath,
      repoRoot,
    });
  }, buildTimeoutMs);

  afterAll(async () => {
    if (suiteBundleDirectory !== undefined) {
      await rm(suiteBundleDirectory, { force: true, recursive: true });
    }
  });

  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })),
    );
  });

  it("keeps the packaged operational profile semantically aligned with the shipped fixture", async () => {
    const [skillProfile, fixtureProfile] = await Promise.all([
      readFile(skillProfilePath, "utf8"),
      readFile(fixtureProfilePath, "utf8"),
    ]);

    expect(parseYaml(skillProfile)).toEqual(parseYaml(fixtureProfile));
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
      ruleCount: 12,
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

  it("appends profile extensions for dotted profile ids", async () => {
    const cwd = await makeTempDir();
    await mkdir(join(cwd, "profiles"));
    await writeFile(join(cwd, "profiles", "team.v1.yaml"), permissiveProfile);
    await writeFile(
      join(cwd, "spec.md"),
      passingMarkdown.replace(
        "validationProfile: operational-spec",
        "validationProfile: team.v1",
      ),
    );

    const result = await runWrapper(
      ["--file", "spec.md", "--profile-root", "profiles"],
      cwd,
    );

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toMatchObject({
      profile: { ruleCount: 1 },
      valid: true,
    });
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

  it("enforces every rule from the shipped operational profile", async () => {
    const cwd = await makeTempDir();
    const missingFollowUp = passingMarkdown.replace(
      "records follow-up review notes",
      "records review notes",
    );
    await writeFile(join(cwd, "spec.md"), missingFollowUp);

    const result = await runWrapper(["--file", "spec.md"], cwd);
    const output = JSON.parse(result.stdout) as {
      diagnostics: Array<{ ruleId?: string }>;
      valid: boolean;
    };

    expect(result.exitCode).toBe(1);
    expect(output.valid).toBe(false);
    expect(output.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ruleId: "handoff.paragraph" }),
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
      MARKDOWN_ENGINE_CLI: requiredSuiteBundlePath(),
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

  it("rejects a profile symlink that escapes the selected profile root", async () => {
    if (process.platform === "win32") {
      return;
    }

    const cwd = await makeTempDir();
    const profileRoot = join(cwd, "profiles");
    const outsideProfile = join(cwd, "outside.yaml");
    await mkdir(profileRoot);
    await writeFile(outsideProfile, permissiveProfile);
    await symlink(outsideProfile, join(profileRoot, "escape.yaml"));
    await writeFile(
      join(cwd, "spec.md"),
      passingMarkdown.replace(
        "validationProfile: operational-spec",
        "validationProfile: escape",
      ),
    );

    const result = await runWrapper(
      ["--file", "spec.md", "--profile-root", "profiles"],
      cwd,
    );

    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain(
      "outside the local profile root through a symbolic link",
    );
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
      env: {
        ...process.env,
        MARKDOWN_ENGINE_CLI: requiredSuiteBundlePath(),
        ...env,
      },
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

function requiredSuiteBundlePath(): string {
  if (suiteBundlePath === undefined) {
    throw new Error("Suite-private bundled CLI was not built.");
  }

  return suiteBundlePath;
}

function toText(value: string | Buffer | undefined): string {
  if (value === undefined) {
    return "";
  }

  return typeof value === "string" ? value : value.toString("utf8");
}
