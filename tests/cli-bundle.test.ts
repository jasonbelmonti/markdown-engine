import { execFile } from "node:child_process";
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const artifactDir = join(repoRoot, "dist-bundled");
const artifactPath = join(artifactDir, "markdown-engine-cli.mjs");
const staleArtifactPath = join(artifactDir, "stale-artifact.txt");
const buildTimeoutMs = 30_000;
const commandTimeoutMs = 10_000;
const maxBuffer = 10 * 1024 * 1024;

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

describe("bundled CLI artifact", () => {
  beforeAll(async () => {
    await mkdir(artifactDir, { recursive: true });
    await writeFile(staleArtifactPath, "stale output must be removed\n", "utf8");

    await execFileAsync(process.execPath, ["scripts/build-bundled-cli.mjs"], {
      cwd: repoRoot,
      maxBuffer,
      timeout: buildTimeoutMs,
    });
  }, buildTimeoutMs);

  it("builds an executable single-file ESM artifact", async () => {
    const artifactStats = await stat(artifactPath);
    const artifactText = await readFile(artifactPath, "utf8");

    expect(artifactPath.endsWith(".mjs")).toBe(true);
    expect(artifactPath.endsWith(join("dist-bundled", "markdown-engine-cli.mjs"))).toBe(true);
    expect(artifactText.startsWith("#!/usr/bin/env node\n")).toBe(true);
    expect(artifactStats.isFile()).toBe(true);
    expect(artifactStats.size).toBeGreaterThan(0);

    if (process.platform !== "win32") {
      expect(artifactStats.mode & 0o111).not.toBe(0);
    }
  });

  it("cleans stale bundled output before rebuilding", async () => {
    await expect(fileExists(staleArtifactPath)).resolves.toBe(false);
  });

  it("prints CLI usage and exits 0 for --help", async () => {
    const result = await runBundledCli(["--help"]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: markdown-engine");
    expect(result.stdout).toContain("Usage: markdown-engine validate");
  });

  it("runs the declarative validation pass fixture", async () => {
    const result = await runBundledCli([
      "validate",
      "--file",
      "fixtures/declarative-validation/examples/operational-spec/pass.md",
      "--profile",
      "fixtures/declarative-validation/examples/operational-spec/profile.yaml",
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");

    const output = JSON.parse(result.stdout) as {
      diagnostics: unknown[];
      valid: boolean;
    };
    expect(output.valid).toBe(true);
    expect(output.diagnostics).toEqual([]);
  });

  it("emits JSON diagnostics and exits 1 for the failing validation fixture", async () => {
    const result = await runBundledCli([
      "validate",
      "--file",
      "fixtures/declarative-validation/examples/operational-spec/fail.md",
      "--profile",
      "fixtures/declarative-validation/examples/operational-spec/profile.yaml",
    ]);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBe("");

    const output = JSON.parse(result.stdout) as {
      diagnostics: Array<{ severity?: string }>;
      valid: boolean;
    };
    expect(output.valid).toBe(false);
    expect(output.diagnostics.length).toBeGreaterThan(0);
    expect(output.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ severity: "error" }),
      ]),
    );
  });
});

async function runBundledCli(args: string[]): Promise<CommandResult> {
  try {
    const result = await execFileAsync(process.execPath, [artifactPath, ...args], {
      cwd: repoRoot,
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

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
