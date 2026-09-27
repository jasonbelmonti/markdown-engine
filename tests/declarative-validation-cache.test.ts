import { createHash } from "node:crypto";
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

const name = (digit: string) => `report-${digit.repeat(8)}-1111-4111-8111-111111111111.json`;

describe("default compact validation with automatic reports", () => {
  it.each([
    { label: "passing", content: markdown, rules: profile, exit: 0 },
    { label: "validation failure", content: "# Wrong\n", rules: profile, exit: 1 },
    { label: "profile failure", content: markdown, rules: { syntaxVersion: "unknown" }, exit: 1 },
  ])("retains exact full evidence for $label without output flags", async ({ content, rules, exit }) => {
    const { cwd, reports } = await setup(content, rules);
    const full = await run(cwd, ["--output=full"]);
    const result = await run(cwd);
    const summary = JSON.parse(result.stdout);
    const report = await readFile(summary.report.path);
    expect(result.exitCode).toBe(exit);
    expect(result.stderr).toBe("");
    expect(summary.schemaVersion).toBe("markdown-engine.validation-summary.v1");
    expect(summary.exitCode).toBe(exit);
    expect(summary.valid).toBe(exit === 0);
    expect(summary.report.path).toMatch(new RegExp(`^${reports}/report-`));
    expect(report.toString()).toBe(full.stdout);
    expect(summary.report.bytes).toBe(report.length);
    expect(summary.report.sha256).toBe(createHash("sha256").update(report).digest("hex"));
    expect(summary.ruleResults).toBeUndefined();
    expect((await lstat(summary.report.path)).mode & 0o777).toBe(0o600);
    expect((await lstat(reports)).mode & 0o777).toBe(0o700);
  });

  it("gives concurrent default and explicit summary invocations unique complete reports", async () => {
    const { cwd, reports } = await setup();
    const results = await Promise.all([run(cwd), run(cwd, ["--output=summary"])]);
    const paths = results.map(result => JSON.parse(result.stdout).report.path);
    expect(new Set(paths).size).toBe(2);
    expect(await readdir(reports)).toHaveLength(2);
    for (const result of results) expect(result.exitCode).toBe(0);
    for (const path of paths) expect(JSON.parse(await readFile(path, "utf8")).valid).toBe(true);
  });

  it("fails with empty stdout when automatic report storage is unavailable", async () => {
    const { cwd, cache } = await setup();
    await writeFile(cache, "not a directory");
    const result = await run(cwd);
    expect(result.exitCode).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("Unable to save validation report");
    expect(await readFile(cache, "utf8")).toBe("not a directory");
    // Explicit full output needs no writable cache; explicit report paths bypass it.
    expect((await run(cwd, ["--output=full"])).exitCode).toBe(0);
    const explicit = await run(cwd, ["--report-file=retained.json"]);
    expect(explicit.exitCode).toBe(0);
    expect(JSON.parse(explicit.stdout).report.path).toBe(join(cwd, "retained.json"));
  });

  it("does not create a cache for full output, usage errors, or input-read errors", async () => {
    const { cwd, cache } = await setup();
    expect((await run(cwd, ["--output=full"])).exitCode).toBe(0);
    expect((await run(cwd, ["--output=bad"])).exitCode).toBe(2);
    await rm(join(cwd, "mission.md"));
    expect((await run(cwd)).exitCode).toBe(2);
    await expect(lstat(cache)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("prunes only expired regular automatic report files and leaves explicit reports alone", async () => {
    const { cwd, reports } = await setup();
    await mkdir(reports, { recursive: true });
    const stale = join(reports, name("a")), recent = join(reports, name("b"));
    const other = join(reports, "notes.json"), linked = join(reports, name("c"));
    const directory = join(reports, name("d")), explicit = join(cwd, "retained.json");
    for (const path of [stale, recent, other]) await writeFile(path, "keep unless expired auto report");
    await mkdir(directory);
    expect((await run(cwd, ["--report-file=retained.json"])).exitCode).toBe(0);
    const bytes = await readFile(explicit);
    await symlink(explicit, linked);
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    for (const path of [stale, other, directory, explicit]) await utimes(path, old, old);
    expect((await run(cwd)).exitCode).toBe(0);
    await expect(lstat(stale)).rejects.toMatchObject({ code: "ENOENT" });
    for (const path of [recent, other, linked, directory]) expect(await lstat(path)).toBeDefined();
    expect(await readFile(explicit)).toEqual(bytes);
  });
});
