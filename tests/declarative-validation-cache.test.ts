import { lstat, mkdir, readFile, readdir, rm, symlink, utimes, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fixture, markdown, profile, run } from "./validation-output-support.js";

const directories: string[] = [];
afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

async function setup(content = markdown, rules: unknown = profile) {
  const cwd = await fixture(directories, content, rules);
  const cache = join(cwd, "cache");
  vi.stubEnv("XDG_CACHE_HOME", cache);
  return { cwd, cache, reports: join(cache, "markdown-engine", "validation-reports") };
}

const modes = [
  { label: "default summary", flags: [] },
  { label: "explicit summary", flags: ["--output=summary"] },
  { label: "full", flags: ["--output=full"] },
];

describe.each(modes)("$label without automatic reports", ({ flags, label }) => {
  it.each([
    { label: "passing", content: markdown, rules: profile, exit: 0, stage: "validation" },
    { label: "validation failure", content: "# Wrong\n", rules: profile, exit: 1, stage: "validation" },
    { label: "profile failure", content: markdown, rules: { syntaxVersion: "unknown" }, exit: 1, stage: "profile" },
  ])("retains the $label verdict when the cache root is a regular file", async ({ content, rules, exit, stage }) => {
    const { cwd, cache } = await setup(content, rules);
    await writeFile(cache, "not a directory");
    const before = await snapshot(cwd);
    const result = await run(cwd, flags);
    expect(result.exitCode).toBe(exit);
    expect(result.stderr).toBe("");
    const output = JSON.parse(result.stdout);
    expect(output.valid).toBe(exit === 0);
    expect(output).not.toHaveProperty("report");
    if (label !== "full") {
      expect(output).toMatchObject({ schemaVersion: "markdown-engine.validation-summary.v1", exitCode: exit, stage });
      expect(output).not.toHaveProperty("ruleResults");
      expect(output.evidence?.ruleResults).toBeUndefined();
    }
    expect(await snapshot(cwd)).toEqual(before);
  });

  it("leaves an absent writable cache root absent", async () => {
    const { cwd, cache } = await setup();
    const before = await snapshot(cwd);
    const result = await run(cwd, flags);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).not.toHaveProperty("report");
    await expect(lstat(cache)).rejects.toMatchObject({ code: "ENOENT" });
    expect(await snapshot(cwd)).toEqual(before);
  });

  it("leaves old cached reports, other files, directories and symlinks untouched", async () => {
    const { cwd, cache, reports } = await setup();
    await mkdir(reports, { recursive: true });
    const name = (digit: string) => `report-${digit.repeat(8)}-1111-4111-8111-111111111111.json`;
    const stale = join(reports, name("a")), recent = join(reports, name("b"));
    const other = join(reports, "notes.json"), linked = join(reports, name("c"));
    const directory = join(reports, name("d"));
    for (const path of [stale, recent, other]) await writeFile(path, "prior report bytes\n");
    await mkdir(directory);
    await symlink(other, linked);
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    for (const path of [stale, other, directory]) await utimes(path, old, old);
    const before = await snapshot(cache);
    expect((await run(cwd, flags)).exitCode).toBe(0);
    expect(await snapshot(cache)).toEqual(before);
    expect((await run(cwd, [...flags, "--report-file=retained.json"])).exitCode).toBe(0);
    expect(await snapshot(cache)).toEqual(before);
  });

  it("publishes an explicit report independently of an unusable cache", async () => {
    const { cwd, cache } = await setup();
    await writeFile(cache, "not a directory");
    const full = await run(cwd, ["--output=full"]);
    const result = await run(cwd, [...flags, "--report-file=retained.json"]);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(await readFile(join(cwd, "retained.json"), "utf8")).toBe(full.stdout);
    expect(await readFile(cache, "utf8")).toBe("not a directory");
    expect((await readdir(cwd)).sort()).toEqual(["cache", "mission.md", "profile.json", "retained.json"]);
  });

  it("does not create a cache for usage or input-read errors", async () => {
    const { cwd, cache } = await setup();
    const usage = await run(cwd, [...flags, "--unknown"]);
    expect(usage.exitCode).toBe(2);
    expect(usage.stdout).toBe("");
    expect(usage.stderr).toContain("Usage:");
    await rm(join(cwd, "mission.md"));
    const missing = await run(cwd, flags);
    expect(missing.exitCode).toBe(2);
    expect(missing.stdout).toBe("");
    expect(missing.stderr).toContain("Unable to read");
    await expect(lstat(cache)).rejects.toMatchObject({ code: "ENOENT" });
  });
});

/** Observe content and write-sensitive metadata without treating input reads as writes. */
async function snapshot(directory: string): Promise<unknown[]> {
  const entries = [];
  for (const name of (await readdir(directory)).sort()) {
    const path = join(directory, name);
    const metadata = await lstat(path);
    entries.push({
      name, mode: metadata.mode, inode: metadata.ino, modified: metadata.mtimeMs,
      content: metadata.isDirectory() ? await snapshot(path) : await readFile(path, "utf8"),
    });
  }
  return entries;
}
