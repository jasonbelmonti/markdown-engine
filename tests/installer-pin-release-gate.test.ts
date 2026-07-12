import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const gatePath = join(repoRoot, "scripts", "check-installer-pin.mjs");
const packageVersion = "4.0.0";
const artifact = "candidate bundled CLI\n";
const artifactHash = createHash("sha256").update(artifact).digest("hex");

describe("installer pin release gate", () => {
  it("accepts a release candidate whose package, installer, docs, and artifact align", async () => {
    await withReleaseFixture(async (fixtureRoot) => {
      await expect(runGate(fixtureRoot)).resolves.toMatchObject({
        stderr: "",
        stdout: expect.stringContaining("Installer pin release gate PASS"),
      });
    });
  });

  it("rejects an installer hash that does not identify the built release artifact", async () => {
    await withReleaseFixture(async (fixtureRoot) => {
      await writeInstaller(fixtureRoot, packageVersion, "0".repeat(64));

      await expect(runGate(fixtureRoot)).rejects.toMatchObject({
        stderr: expect.stringContaining(
          `expected built artifact hash ${artifactHash}`,
        ),
      });
    });
  });

  it("rejects an installer version that does not match the release package", async () => {
    await withReleaseFixture(async (fixtureRoot) => {
      await writeInstaller(fixtureRoot, "3.1.1", artifactHash);

      await expect(runGate(fixtureRoot)).rejects.toMatchObject({
        stderr: expect.stringContaining(
          `expected package version ${packageVersion}`,
        ),
      });
    });
  });
});

async function withReleaseFixture(
  run: (fixtureRoot: string) => Promise<void>,
): Promise<void> {
  const fixtureRoot = await mkdtemp(join(tmpdir(), "installer-pin-gate-"));

  try {
    await mkdir(join(fixtureRoot, "scripts"), { recursive: true });
    await mkdir(join(fixtureRoot, "dist-bundled"), { recursive: true });
    await writeFile(
      join(fixtureRoot, "package.json"),
      `${JSON.stringify({ version: packageVersion })}\n`,
      "utf8",
    );
    await writeFile(
      join(fixtureRoot, "README.md"),
      [
        "# Fixture",
        "",
        "### Bundled CLI install",
        "",
        `Download \`@jasonbelmonti/markdown-engine@${packageVersion}\`.`,
        "",
        artifactHash,
        "",
        "### Next section",
        "",
      ].join("\n"),
      "utf8",
    );
    await writeFile(
      join(fixtureRoot, "dist-bundled", "markdown-engine-cli.mjs"),
      artifact,
      "utf8",
    );
    await writeInstaller(fixtureRoot, packageVersion, artifactHash);
    await run(fixtureRoot);
  } finally {
    await rm(fixtureRoot, { force: true, recursive: true });
  }
}

function writeInstaller(
  fixtureRoot: string,
  version: string,
  expectedHash: string,
): Promise<void> {
  return writeFile(
    join(fixtureRoot, "scripts", "install-markdown-engine-cli.sh"),
    `VERSION="${version}"\nEXPECTED_SHA256="${expectedHash}"\n`,
    "utf8",
  );
}

function runGate(cwd: string) {
  return execFileAsync(process.execPath, [gatePath, "--repo-root", cwd]);
}
