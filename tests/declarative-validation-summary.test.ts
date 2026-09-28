import { createHash } from "node:crypto";
import { lstat, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { MARKDOWN_ENGINE_PACKAGE_VERSION } from "../src/internal/package-version.js";
import { fixture, markdown, profile, run } from "./validation-output-support.js";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

describe.each([
  { label: "default without report", flags: [], saveReport: false },
  { label: "explicit summary without report", flags: ["--output=summary"], saveReport: false },
  { label: "default with report", flags: [], saveReport: true },
  { label: "explicit summary with report", flags: ["--output=summary"], saveReport: true },
])("$label", ({ flags, saveReport }) => {
  async function runCompact(cwd: string) {
    const result = await run(cwd, [...flags, ...(saveReport ? ["--report-file=full report.json"] : [])]);
    if (!saveReport) expect(JSON.parse(result.stdout)).not.toHaveProperty("report");
    return result;
  }

  it.each(["v1", "v2"])("preserves %s verdicts, identities and exact full report bytes", async version => {
    const cwd = await fixture(directories, markdown, {
      ...profile, syntaxVersion: `markdown-engine.validation@${version}`,
    });
    const full = await run(cwd, ["--output=full"]);
    const compact = await runCompact(cwd);
    const result = JSON.parse(full.stdout), summary = JSON.parse(compact.stdout);
    const report = Buffer.from(full.stdout);
    if (saveReport) {
      expect(await readFile(join(cwd, "full report.json"))).toEqual(report);
      expect((await lstat(join(cwd, "full report.json"))).mode & 0o777).toBe(0o600);
    }
    expect(compact.exitCode).toBe(0);
    expect(compact.stderr).toBe("");
    expect(summary).toMatchObject({
      schemaVersion: "markdown-engine.validation-summary.v1", valid: true, stage: "validation",
      exitCode: 0, engineVersion: MARKDOWN_ENGINE_PACKAGE_VERSION, runtimeVersion: process.version,
      profile: result.profile,
      evidence: {
        inputHash: result.evidence.inputHash, profileHash: result.evidence.profileHash,
        engineVersion: result.evidence.engineVersion, runtimeVersion: result.evidence.runtimeVersion,
        ...(result.evidence.sourceLength !== undefined ? { sourceLength: result.evidence.sourceLength } : {}),
      },
      diagnosticCounts: { total: 0, error: 0, warning: 0, info: 0 },
      diagnostics: [], diagnosticsOmitted: 0, diagnosticsTruncated: 0,
      ...(saveReport ? { report: {
        path: join(cwd, "full report.json"), bytes: report.length,
        sha256: createHash("sha256").update(report).digest("hex"),
      } } : {}),
    });
    expect(summary.ruleResults).toBeUndefined();
    expect(summary.evidence.ruleResults).toBeUndefined();
  });

  it.each([
    { name: "validation", content: "# Wrong\n", input: profile, stage: "validation" },
    { name: "normalization", content: "---\ntitle: [\n---\n# Mission", input: profile, stage: "validation" },
    { name: "profile", content: markdown, input: { syntaxVersion: "unsupported" }, stage: "profile" },
  ])("preserves $name failures and their diagnostics", async ({ content, input, stage }) => {
    const cwd = await fixture(directories, content, input);
    const full = await run(cwd, ["--output=full"]);
    const compact = await runCompact(cwd);
    const result = JSON.parse(full.stdout), summary = JSON.parse(compact.stdout);
    expect(full.exitCode).toBe(1);
    expect(compact.exitCode).toBe(1);
    expect(summary).toMatchObject({ valid: false, exitCode: 1, stage });
    expect(summary.diagnosticCounts.total).toBe(result.diagnostics.length);
    expect(summary.diagnosticCounts.error).toBeGreaterThan(0);
    expect(summary.diagnostics[0]).toMatchObject(result.diagnostics[0]);
    if (saveReport) expect(await readFile(join(cwd, "full report.json"), "utf8")).toBe(full.stdout);
    if (stage === "profile") {
      expect(summary.evidence).toBeUndefined();
      expect(summary.profile).toBeUndefined();
    }
  });

  it("retains profile-first behavior when the Markdown cannot be read", async () => {
    const cwd = await fixture(directories, markdown, { syntaxVersion: "unsupported" });
    await rm(join(cwd, "mission.md"));
    const result = await runCompact(cwd);
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).stage).toBe("profile");
  });

  it("keeps warnings visible without changing a passing exit status", async () => {
    const cwd = await fixture(directories, "# Wrong\n", {
      ...profile, rules: profile.rules.map(rule => ({ ...rule, severity: "warning" })),
    });
    const full = await run(cwd, ["--output=full"]);
    const result = await runCompact(cwd);
    expect(result.exitCode).toBe(full.exitCode);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).diagnostics).toEqual(
      JSON.parse(full.stdout).diagnostics.map((diagnostic: object) => ({ ...diagnostic, truncatedFields: [] })),
    );
    expect(JSON.parse(result.stdout)).toMatchObject({
      valid: true, diagnosticCounts: { total: 1, warning: 1, error: 0, info: 0 },
      diagnostics: [{ severity: "warning", ruleId: "mission.required" }],
    });
  });

  it("omits skipped-rule internals while preserving counts and reducing response bytes", async () => {
    const cwd = await fixture(directories, markdown, {
      ...profile, rules: Array.from({ length: 30 }, (_, i) => ({
        id: `conditional-${i}`,
        when: { select: { target: "section", title: "Absent" }, assert: { exists: true } },
        select: { target: "document" }, assert: { text: { contains: "never evaluated" } },
      })),
    });
    const full = await run(cwd, ["--output=full"]);
    const compact = await runCompact(cwd);
    expect(compact.exitCode).toBe(0);
    expect(JSON.parse(compact.stdout)).toMatchObject({
      profile: { ruleCount: 30, skippedRuleCount: 30, evaluatedRuleCount: 0 },
      diagnosticCounts: { total: 0 }, diagnostics: [],
    });
    expect(Buffer.byteLength(compact.stdout)).toBeLessThan(Buffer.byteLength(full.stdout) / 10);
  });

  it("bounds diagnostics and long fields, prioritizes errors, and retains all details", async () => {
    const cwd = await fixture(directories, markdown, {
      ...profile, rules: Array.from({ length: 15 }, (_, i) => ({
        id: `rule-${i}-${"X".repeat(300)}`,
        severity: i === 14 ? "error" : i >= 12 ? "info" : "warning",
        select: { target: "document" }, assert: { text: { contains: "Y".repeat(2000) } },
      })),
    });
    const result = await runCompact(cwd);
    const summary = JSON.parse(result.stdout);
    const full = await run(cwd, ["--output=full"]);
    const report = JSON.parse(full.stdout);
    if (saveReport) expect(await readFile(join(cwd, "full report.json"), "utf8")).toBe(full.stdout);
    expect(result.exitCode).toBe(1);
    expect(summary.diagnosticCounts).toEqual({ total: 15, error: 1, warning: 12, info: 2 });
    expect(summary.diagnostics).toHaveLength(10);
    expect(summary.diagnostics[0].severity).toBe("error");
    expect(summary.diagnosticsOmitted).toBe(5);
    expect(summary.diagnosticsTruncated).toBe(10);
    const ordered = ["error", "warning", "info"].flatMap(severity =>
      report.diagnostics.filter((diagnostic: { severity: string }) => diagnostic.severity === severity),
    );
    for (const [index, diagnostic] of summary.diagnostics.entries()) {
      const original = ordered[index];
      expect(diagnostic).toEqual({
        code: original.code, message: `${original.message.slice(0, 511)}…`,
        ruleId: `${original.ruleId.slice(0, 127)}…`, severity: original.severity,
        sourceRange: original.sourceRange, truncatedFields: ["message", "ruleId"],
      });
    }
    expect(report.diagnostics).toHaveLength(15);
    expect(report.diagnostics.every((d: { ruleId: string }) => d.ruleId.length > 300)).toBe(true);
    expect(Buffer.byteLength(result.stdout)).toBeLessThan(14_000);
  });

  it("reports invalid YAML through compact profile-stage output", async () => {
    const cwd = await fixture(directories);
    await writeFile(join(cwd, "profile.json"), "rules: [");
    const result = await runCompact(cwd);
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({ stage: "profile", valid: false });
  });
});

describe("full validation output", () => {
  it("keeps explicit full stdout byte-identical with report mode", async () => {
    const cwd = await fixture(directories);
    const normal = await run(cwd, ["--output=full"]);
    expect(await run(cwd, ["--output=full"])).toEqual(normal);
    expect(await run(cwd, ["--output", "full", "--report-file", "full.json"])).toEqual(normal);
    expect(await readFile(join(cwd, "full.json"), "utf8")).toBe(normal.stdout);
  });
});
