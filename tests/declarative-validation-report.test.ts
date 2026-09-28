import { link, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { fixture, run } from "./validation-output-support.js";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

describe.each([
  { label: "default", flags: [] },
  { label: "summary", flags: ["--output=summary"] },
  { label: "full", flags: ["--output=full"] },
])("$label validation report publication", ({ flags }) => {
  it.each(["mission.md", "profile.json", "existing.json"])("never replaces %s", async reportFile => {
    const cwd = await fixture(directories);
    if (reportFile === "existing.json") await writeFile(join(cwd, reportFile), "prior evidence\n");
    const before = await readFile(join(cwd, reportFile));
    const result = await run(cwd, [...flags, `--report-file=${reportFile}`]);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Unable to save validation report");
    expect(await readFile(join(cwd, reportFile))).toEqual(before);
    expect((await readdir(cwd)).filter(name => name.startsWith(".markdown-engine-report-"))).toEqual([]);
  });

  it.each([
    ["hard", "mission.md"], ["symbolic", "mission.md"],
    ["hard", "profile.json"], ["symbolic", "profile.json"],
  ])("does not overwrite through a %s link to %s", async (kind, inputName) => {
    const cwd = await fixture(directories);
    const input = join(cwd, inputName), destination = join(cwd, "alias.json");
    const before = await readFile(input);
    if (kind === "hard") await link(input, destination);
    else await symlink(input, destination);
    const result = await run(cwd, [...flags, "--report-file=alias.json"]);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(await readFile(input)).toEqual(before);
    expect(result.stderr).toContain("Unable to save validation report");
    expect((await readdir(cwd)).filter(name => name.startsWith(".markdown-engine-report-"))).toEqual([]);
  });

  it.each(["missing/report.json", "directory", "blocked/report.json"])("fails explicitly for report destination %s", async path => {
    const cwd = await fixture(directories);
    await mkdir(join(cwd, "directory"));
    await writeFile(join(cwd, "blocked"), "not a directory");
    const result = await run(cwd, [...flags, `--report-file=${path}`]);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Unable to save validation report");
  });

  it("report failure overrides validation failure without printing a misleading result", async () => {
    const cwd = await fixture(directories, "# Wrong\n");
    const result = await run(cwd, [...flags, "--report-file=missing/report.json"]);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Unable to save validation report");
  });

  it("publishes only one complete report when invocations share a destination", async () => {
    const cwd = await fixture(directories);
    const results = await Promise.all([0, 1].map(() => run(cwd, [...flags, "--report-file=shared.json"])));
    expect(results.map(r => r.exitCode).sort()).toEqual([0, 2]);
    expect(JSON.parse(await readFile(join(cwd, "shared.json"), "utf8")).valid).toBe(true);
    expect(results.find(r => r.exitCode === 2)?.stdout).toBe("");
  });

  it.each(["mission.md", "profile.json"])("retains existing read-error behavior for missing %s", async input => {
    const cwd = await fixture(directories);
    await rm(join(cwd, input));
    const result = await run(cwd, [...flags, "--report-file=full.json"]);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Unable to read");
    expect(await readdir(cwd)).not.toContain("full.json");
  });

});

describe("validation output arguments", () => {
  it.each([
    ["--output"], ["--output="], ["--output=brief"],
    ["--output=full", "--output", "summary"],
    ["--report-file"], ["--report-file="], ["--report-file=   "],
    ["--report-file=a.json", "--report-file", "b.json"],
  ])("rejects invalid output arguments %j before report creation", async (...invalidFlags) => {
    const cwd = await fixture(directories);
    const result = await run(cwd, invalidFlags);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Usage:");
    expect((await readdir(cwd)).sort()).toEqual(["mission.md", "profile.json"]);
  });
});
