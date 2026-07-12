import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { beforeAll, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const artifactDir = join(repoRoot, "dist-bundled");
const artifactPath = join(artifactDir, "markdown-engine-cli.mjs");
const installerPath = join(repoRoot, "scripts", "install-markdown-engine-cli.sh");
const legacyArtifactPath = join(repoRoot, "dist", "cli", "markdown-engine.mjs");
const packageManifestPath = join(repoRoot, "package.json");
const staleArtifactPath = join(artifactDir, "stale-artifact.txt");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
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

  it("includes the bundled artifact directory in the published package files", async () => {
    const manifest = JSON.parse(await readFile(packageManifestPath, "utf8")) as {
      files?: string[];
      scripts?: Record<string, string>;
    };

    expect(manifest.files).toContain("dist-bundled");
    expect(manifest.files).toContain("scripts/install-markdown-engine-cli.sh");
    expect(manifest.scripts?.["build:cli-bundle"]).toBe(
      "node scripts/build-cli-bundle.mjs",
    );
    expect(manifest.scripts?.prepack).toBe("npm run release:verify");
    expect(manifest.scripts?.prepublishOnly).toBe("npm run release:verify");
    expect(manifest.scripts?.["release:verify"]).toContain(
      "npm run build && npm run build:cli:bundled &&",
    );
  });

  it("pins the constrained-harness installer to the package version and bundled artifact hash", async () => {
    const packageVersion = await readPackageVersion();
    const installerText = await readFile(installerPath, "utf8");
    const readmeText = await readFile(join(repoRoot, "README.md"), "utf8");
    const installDocs = readmeText.slice(
      readmeText.indexOf("### Bundled CLI install"),
    );
    const artifactHash = createHash("sha256")
      .update(await readFile(artifactPath))
      .digest("hex");

    expect(installerText).toContain(`VERSION="${packageVersion}"`);
    expect(installerText).toContain(`EXPECTED_SHA256="${artifactHash}"`);
    expect(installerText).toContain(
      'INSTALL_DIR="$MARKDOWN_ENGINE_HOME/tools/markdown-engine/$VERSION"',
    );
    expect(installDocs).toContain(
      `@jasonbelmonti/markdown-engine@${packageVersion}`,
    );
    expect(installDocs).toContain(artifactHash);
    expect(installDocs).not.toContain("@jasonbelmonti/markdown-engine@3.0.0");
  });

  it("installs a wrapper that points at the current versioned bundled CLI", async () => {
    if (process.platform === "win32") {
      return;
    }

    const packageVersion = await readPackageVersion();
    const installRoot = await mkdtemp(join(tmpdir(), "markdown-engine-install-"));
    const markdownEngineHome = join(installRoot, "data");
    const binDir = join(installRoot, "bin");
    const expectedInstallCli = join(
      markdownEngineHome,
      "tools",
      "markdown-engine",
      packageVersion,
      "markdown-engine-cli.mjs",
    );

    try {
      await execFileAsync("sh", [installerPath], {
        cwd: repoRoot,
        env: {
          ...process.env,
          MARKDOWN_ENGINE_BIN_DIR: binDir,
          MARKDOWN_ENGINE_HOME: markdownEngineHome,
        },
        maxBuffer,
        timeout: commandTimeoutMs,
      });

      const wrapperText = await readFile(join(binDir, "markdown-engine"), "utf8");
      expect(await fileExists(expectedInstallCli)).toBe(true);
      expect(wrapperText).toContain(
        `DEFAULT_MARKDOWN_ENGINE_CLI='${expectedInstallCli}'`,
      );
      expect(wrapperText).not.toContain("/3.0.0/");
    } finally {
      await rm(installRoot, { force: true, recursive: true });
    }
  });

  it("packs the bundled CLI and constrained-harness installer", async () => {
    const result = await execFileAsync(
      npmCommand,
      ["pack", "--dry-run", "--json", "--ignore-scripts"],
      {
        cwd: repoRoot,
        maxBuffer,
        timeout: commandTimeoutMs,
      },
    );
    const [pack] = JSON.parse(result.stdout) as Array<{
      files: Array<{ path: string }>;
    }>;
    const packedPaths = pack.files.map((file) => file.path);

    expect(packedPaths).toContain("dist-bundled/markdown-engine-cli.mjs");
    expect(packedPaths).toContain("scripts/install-markdown-engine-cli.sh");
  });

  it("keeps constrained-harness installer paths host-neutral", async () => {
    const installerText = await readFile(installerPath, "utf8");
    const readmeText = await readFile(join(repoRoot, "README.md"), "utf8");
    const installContractText = `${installerText}\n${readmeText}`;
    const codexHomeName = ["CODEX", "HOME"].join("_");

    expect(installContractText).not.toContain(codexHomeName);
    expect(installContractText).toContain("MARKDOWN_ENGINE_HOME");
    expect(installContractText).toContain("MARKDOWN_ENGINE_BIN_DIR");
  });

  it("keeps the compatibility build command writing the legacy artifact path", async () => {
    await rm(legacyArtifactPath, { force: true });

    await execFileAsync(npmCommand, ["run", "build:cli-bundle"], {
      cwd: repoRoot,
      maxBuffer,
      timeout: buildTimeoutMs,
    });

    const artifactStats = await stat(legacyArtifactPath);
    const artifactText = await readFile(legacyArtifactPath, "utf8");

    expect(artifactText.startsWith("#!/usr/bin/env node\n")).toBe(true);
    expect(artifactStats.isFile()).toBe(true);
    expect(artifactStats.size).toBeGreaterThan(0);

    if (process.platform !== "win32") {
      expect(artifactStats.mode & 0o111).not.toBe(0);
    }

    const result = await runCliArtifact(legacyArtifactPath, ["--help"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("Usage: markdown-engine");
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
  return runCliArtifact(artifactPath, args);
}

async function runCliArtifact(path: string, args: string[]): Promise<CommandResult> {
  try {
    const result = await execFileAsync(process.execPath, [path, ...args], {
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

async function readPackageVersion(): Promise<string> {
  const manifest = JSON.parse(await readFile(packageManifestPath, "utf8")) as {
    version?: unknown;
  };

  if (typeof manifest.version !== "string" || manifest.version.length === 0) {
    throw new Error("package.json version must be a non-empty string");
  }

  return manifest.version;
}
