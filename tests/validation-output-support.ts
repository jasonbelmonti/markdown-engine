import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runCli } from "../src/cli/run.js";

export const markdown = "# Mission\n\nReady.\n";
export const profile = {
  syntaxVersion: "markdown-engine.validation@v2",
  rules: [{
    id: "mission.required",
    select: { target: "document" },
    assert: { sectionsRequired: { headings: ["Mission"] } },
  }],
};

export async function fixture(directories: string[], content = markdown, rules: unknown = profile) {
  const cwd = await mkdtemp(join(tmpdir(), "markdown-engine-summary-"));
  directories.push(cwd);
  await writeFile(join(cwd, "mission.md"), content);
  await writeFile(join(cwd, "profile.json"), JSON.stringify(rules));
  return cwd;
}

export async function run(cwd: string, flags: string[] = []) {
  let stdout = "", stderr = "";
  const exitCode = await runCli({
    cwd,
    args: ["validate", "--file", "mission.md", "--profile", "profile.json", ...flags],
    stdout: { write: text => { stdout += text; } },
    stderr: { write: text => { stderr += text; } },
  });
  return { exitCode, stdout, stderr };
}
