import { createHash } from "node:crypto";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { MARKDOWN_ENGINE_PACKAGE_VERSION } from "../src/internal/package-version.js";
import { fixture, markdown, profile, run } from "./validation-output-support.js";

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

describe("compact validation output", () => {
  it.each(["v1", "v2"])("preserves %s verdicts, identities and exact full report bytes", async version => {
    const cwd = await fixture(directories, markdown, {
      ...profile, syntaxVersion: `markdown-engine.validation@${version}`,
    });
    const full = await run(cwd);
    const compact = await run(cwd, ["--output", "summary", "--report-file", "full report.json"]);
    const result = JSON.parse(full.stdout), summary = JSON.parse(compact.stdout);
    const report = await readFile(join(cwd, "full report.json"));
    expect(compact.exitCode).toBe(0);
    expect(compact.stderr).toBe("");
    expect(report.toString()).toBe(full.stdout);
    expect(summary).toMatchObject({
      schemaVersion: "markdown-engine.validation-summary.v1", valid: true, stage: "validation",
      exitCode: 0, engineVersion: MARKDOWN_ENGINE_PACKAGE_VERSION, runtimeVersion: process.version,
      profile: result.profile,
      evidence: { inputHash: result.evidence.inputHash, profileHash: result.evidence.profileHash },
      diagnosticCounts: { total: 0, error: 0, warning: 0, info: 0 },
      diagnostics: [], diagnosticsOmitted: 0, diagnosticsTruncated: 0,
      report: {
        path: join(cwd, "full report.json"), bytes: report.length,
        sha256: createHash("sha256").update(report).digest("hex"),
      },
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
    const full = await run(cwd);
    const compact = await run(cwd, ["--output=summary", "--report-file=full.json"]);
    const result = JSON.parse(full.stdout), summary = JSON.parse(compact.stdout);
    expect(full.exitCode).toBe(1);
    expect(compact.exitCode).toBe(1);
    expect(summary).toMatchObject({ valid: false, exitCode: 1, stage });
    expect(summary.diagnosticCounts.total).toBe(result.diagnostics.length);
    expect(summary.diagnosticCounts.error).toBeGreaterThan(0);
    expect(summary.diagnostics[0]).toMatchObject(result.diagnostics[0]);
    expect(await readFile(join(cwd, "full.json"), "utf8")).toBe(full.stdout);
    if (stage === "profile") {
      expect(summary.evidence).toBeUndefined();
      expect(summary.profile).toBeUndefined();
    }
  });

  it("retains profile-first behavior when the Markdown cannot be read", async () => {
    const cwd = await fixture(directories, markdown, { syntaxVersion: "unsupported" });
    await rm(join(cwd, "mission.md"));
    const result = await run(cwd, ["--output", "summary", "--report-file", "full.json"]);
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout).stage).toBe("profile");
  });

  it("keeps warnings visible without changing a passing exit status", async () => {
    const cwd = await fixture(directories, "# Wrong\n", {
      ...profile, rules: profile.rules.map(rule => ({ ...rule, severity: "warning" })),
    });
    const result = await run(cwd, ["--output", "summary", "--report-file", "full.json"]);
    expect(result.exitCode).toBe(0);
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
    const full = await run(cwd);
    const compact = await run(cwd, ["--output", "summary", "--report-file", "full.json"]);
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
        severity: i === 14 ? "error" : "warning",
        select: { target: "document" }, assert: { text: { contains: "Y".repeat(2000) } },
      })),
    });
    const result = await run(cwd, ["--output", "summary", "--report-file", "full.json"]);
    const summary = JSON.parse(result.stdout);
    const report = JSON.parse(await readFile(join(cwd, "full.json"), "utf8"));
    expect(result.exitCode).toBe(1);
    expect(summary.diagnosticCounts).toEqual({ total: 15, error: 1, warning: 14, info: 0 });
    expect(summary.diagnostics).toHaveLength(10);
    expect(summary.diagnostics[0].severity).toBe("error");
    expect(summary.diagnosticsOmitted).toBe(5);
    expect(summary.diagnosticsTruncated).toBe(10);
    for (const diagnostic of summary.diagnostics) {
      expect(diagnostic.message.length).toBeLessThanOrEqual(512);
      expect(diagnostic.ruleId.length).toBeLessThanOrEqual(128);
      expect(diagnostic.truncatedFields).toContain("ruleId");
    }
    expect(report.diagnostics).toHaveLength(15);
    expect(report.diagnostics.every((d: { ruleId: string }) => d.ruleId.length > 300)).toBe(true);
    expect(Buffer.byteLength(result.stdout)).toBeLessThan(14_000);
  });

  it("keeps default and explicit full stdout byte-identical, including report mode", async () => {
    const cwd = await fixture(directories);
    const normal = await run(cwd);
    expect(await run(cwd, ["--output=full"])).toEqual(normal);
    expect(await run(cwd, ["--output", "full", "--report-file", "full.json"])).toEqual(normal);
    expect(await readFile(join(cwd, "full.json"), "utf8")).toBe(normal.stdout);
  });

  it("reports invalid YAML through compact profile-stage output", async () => {
    const cwd = await fixture(directories);
    await writeFile(join(cwd, "profile.json"), "rules: [");
    const result = await run(cwd, ["--output=summary", "--report-file=full.json"]);
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({ stage: "profile", valid: false });
  });
});
