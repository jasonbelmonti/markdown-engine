import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = "fixtures/declarative-validation/examples/table-rows-complete";
const oracle = JSON.parse(readFileSync(`${root}/oracle.json`, "utf8")) as {
  name: string; valid: boolean; failures: { row: number; line: number; actual: number[] }[];
}[];

function run(file: string, profile: string) {
  const result = spawnSync(process.execPath, [
    "dist/cli/index.js", "validate", "--output", "full", "--file", file, "--profile", profile, "--format", "json",
  ], { encoding: "utf8" });
  expect(result.error).toBeUndefined();
  expect(result.stderr).toBe("");
  return { status: result.status, stdout: result.stdout, report: JSON.parse(result.stdout) };
}

describe("tableRowsComplete real CLI", () => {
  it.each(oracle)("matches the independent $name oracle with stable JSON and exits", (entry) => {
    const file = `${root}/${entry.name}.md`;
    const profile = `${root}/shape.yaml`;
    const result = run(file, profile);
    expect(result.status).toBe(entry.valid ? 0 : 1);
    expect(result.report.valid).toBe(entry.valid);
    expect(result.report.diagnostics).toHaveLength(entry.failures.length);
    for (const [index, failure] of entry.failures.entries()) {
      expect(result.report.diagnostics[index]).toMatchObject({
        code: "profile.validation.assertionFailed", ruleId: "rows.complete",
        message: expect.stringContaining(`body row ${failure.row} must have column positions [0,1]; found ${JSON.stringify(failure.actual)}.`),
        sourceRange: { start: { line: failure.line }, end: { line: failure.line } },
      });
    }
    expect(run(file, profile).stdout).toBe(result.stdout);
  });

  it("runs the consumer example with legacy pass, opt-in failure and repaired pass", () => {
    for (const [file, profile, status] of [
      ["consumer-missing", "legacy", 0],
      ["consumer-missing", "profile", 1],
      ["consumer-repaired", "profile", 0],
    ] as const) {
      const result = run(`${root}/${file}.md`, `${root}/${profile}.yaml`);
      expect(result.status).toBe(status);
      expect(result.report.valid).toBe(status === 0);
      if (status === 1) {
        expect(result.report.diagnostics).toEqual([expect.objectContaining({
          ruleId: "sources.columns", code: "profile.validation.assertionFailed",
          message: expect.stringContaining("body row 2 must have column positions [0,1,2,3]; found [0,1,2]."),
          sourceRange: expect.objectContaining({ start: expect.objectContaining({ line: 20 }) }),
        })]);
      }
    }
  });

  it.each([
    ["table", false, "profile.config.invalidShape"],
    ["document", true, "profile.compile.incompatibleSelectorAssertion"],
  ] as const)("rejects invalid configuration through CLI: %s / %s", (target, value, code) => {
    const directory = mkdtempSync(join(tmpdir(), "table-rows-complete-"));
    try {
      const profile = join(directory, "invalid.json");
      writeFileSync(profile, JSON.stringify({ syntaxVersion: "markdown-engine.validation@v2", rules: [
        { id: "rows.complete", select: { target }, assert: { tableRowsComplete: value } },
      ] }));
      const result = run(`${root}/complete.md`, profile);
      expect(result.status).toBe(1);
      expect(result.report.valid).toBe(false);
      expect(result.report.diagnostics).toContainEqual(expect.objectContaining({ code }));
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
