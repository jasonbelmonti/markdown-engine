import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("..", import.meta.url));
const gatePath = join(repoRoot, "scripts", "check-release-clean.mjs");

describe("release clean-tree gate", () => {
  it("rejects tracked and untracked inputs while allowing ignored outputs", async () => {
    const tempRepo = await mkdtemp(join(tmpdir(), "markdown-engine-clean-gate-"));

    try {
      await runGit(tempRepo, ["init", "--quiet"]);
      await runGit(tempRepo, ["config", "user.name", "Release Gate Test"]);
      await runGit(tempRepo, ["config", "user.email", "release-gate@example.invalid"]);
      await writeFile(join(tempRepo, ".gitignore"), "ignored-output\n", "utf8");
      await writeFile(join(tempRepo, "tracked.txt"), "tracked\n", "utf8");
      await runGit(tempRepo, ["add", ".gitignore", "tracked.txt"]);
      await runGit(tempRepo, ["commit", "--quiet", "-m", "fixture"]);

      await expect(runGate(tempRepo)).resolves.toMatchObject({
        stderr: "",
        stdout: expect.stringContaining("Release clean-tree gate PASS"),
      });

      await writeFile(join(tempRepo, "ignored-output"), "ignored\n", "utf8");
      await expect(runGate(tempRepo)).resolves.toMatchObject({
        stderr: "",
        stdout: expect.stringContaining("Release clean-tree gate PASS"),
      });

      await writeFile(join(tempRepo, "untracked.txt"), "untracked\n", "utf8");
      await expect(runGate(tempRepo)).rejects.toMatchObject({
        stderr: expect.stringContaining(
          "untracked file is not release-safe: untracked.txt",
        ),
      });
      await rm(join(tempRepo, "untracked.txt"));

      await writeFile(join(tempRepo, "tracked.txt"), "changed\n", "utf8");
      await expect(runGate(tempRepo)).rejects.toMatchObject({
        stderr: expect.stringContaining(
          "tracked file differs from HEAD: tracked.txt",
        ),
      });
    } finally {
      await rm(tempRepo, { force: true, recursive: true });
    }
  });
});

function runGit(cwd: string, args: string[]) {
  return execFileAsync("git", args, { cwd });
}

function runGate(cwd: string) {
  return execFileAsync(process.execPath, [gatePath, "--repo-root", cwd]);
}
