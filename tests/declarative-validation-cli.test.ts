import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { runCli, type TextOutput } from "../src/cli/run.js";

const tempDirs: string[] = [];
const validMarkdown = `---
title: Mission Brief
---

# Mission Brief

REQ-1 is ready.
`;
const failingMarkdown = `# Mission Brief

No required text here.
`;
const invalidFrontmatterMarkdown = `---
title: [
---

# Mission Brief

REQ-1 is ready.
`;
const validProfile = `syntaxVersion: markdown-engine.validation@v1
rules:
  - id: sections.present
    select:
      target: document
    assert:
      sectionsRequired:
        headings:
          - Mission Brief
`;
const v2PassingProfile = `syntaxVersion: markdown-engine.validation@v2
rules:
  - id: v2.text.present
    select:
      target: document
    assert:
      text:
        contains: REQ-1
`;
const v2FailingProfile = `syntaxVersion: markdown-engine.validation@v2
rules:
  - id: v2.text.missing
    select:
      target: document
    assert:
      text:
        contains: ready for launch
`;
const v2GroupedProfile = `syntaxVersion: markdown-engine.validation@v2
rules:
  - id: v2.grouped.anyof
    anyOf:
      - label: missing-verification
        select:
          target: section
          title: Verification
        assert:
          exists: true
      - label: mission-ready
        select:
          target: document
        assert:
          text:
            contains: REQ-1
`;
const v2SkippedProfile = `syntaxVersion: markdown-engine.validation@v2
rules:
  - id: v2.when.skipped
    when:
      select:
        target: section
        title: Verification
      assert:
        exists: true
    select:
      target: document
    assert:
      text:
        contains: DO NOT EVALUATE
`;
const v2IdCountMarkdown = `# Requirements

| ID | Statement |
| --- | --- |
| OBJ-1 | Build safely |
| SYS-1 | Ignore non-objective IDs |
| OBJ-1 | Repeated objective occurrence |
`;
const v2IdCountProfile = `syntaxVersion: markdown-engine.validation@v2
rules:
  - id: v2.ids.min-count
    select:
      target: tableCell
      column: ID
    assert:
      ids:
        prefix: OBJ
        minCount: 2
`;
const warningProfile = `syntaxVersion: !custom markdown-engine.validation@v1
rules:
  - id: sections.present
    select:
      target: document
    assert:
      sectionsRequired:
        headings:
          - Mission Brief
`;
const failingProfile = `syntaxVersion: markdown-engine.validation@v1
rules:
  - id: text.required
    select:
      target: document
    assert:
      text:
        contains: ready for launch
`;
const textLengthFailingMarkdown = `# Summary

Short.
`;
const textLengthProfile = `syntaxVersion: markdown-engine.validation@v1
rules:
  - id: summary.length
    select:
      target: section
      title: Summary
    assert:
      textLength:
        min: 30
        max: 40
`;
const invalidYamlProfile = `syntaxVersion: markdown-engine.validation@v1
rules:
  - id: invalid
    select: [
`;
const unsupportedSyntaxProfile = `syntaxVersion: markdown-engine.validation@v3
rules:
  - id: skipped.rule
    select:
      target: document
    assert:
      text:
        contains: REQ-1
`;
const incompatibleProfile = `syntaxVersion: markdown-engine.validation@v1
rules:
  - id: sections.incompatible
    select:
      target: section
      title: Mission Brief
    assert:
      sectionsRequired:
        headings:
          - Mission Brief
`;
const unsupportedAssertionProfile = `syntaxVersion: markdown-engine.validation@v1
rules:
  - id: unsupported.assertion
    select:
      target: document
    assert:
      linkSchemesAllowed:
        schemes:
          - https
`;
const versionMismatchProfile = `syntaxVersion: markdown-engine.validation@v1
documentVersion: 0.0.0
rules:
  - id: skipped.rule
    select:
      target: document
    assert:
      text:
        contains: REQ-1
`;

describe("declarative validation CLI", () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((dir) => rm(dir, { force: true, recursive: true })),
    );
  });

  it("emits validation JSON with evidence and exits 0 for passing documents", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), validMarkdown);
    await writeFile(join(cwd, "profile.yaml"), validProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
      ],
      cwd,
    });

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    expect(result).toMatchObject({
      diagnostics: [],
      profile: {
        documentVersion: "1.0.0",
        ruleCount: 1,
        syntaxVersion: "markdown-engine.validation@v1",
      },
      ruleResults: [
        {
          passed: true,
          ruleId: "sections.present",
        },
      ],
      valid: true,
    });
    expect(result).not.toHaveProperty("stage");
    expect(result.profile).not.toHaveProperty("evaluatedRuleCount");
    expect(result.profile).not.toHaveProperty("skippedRuleCount");
    expect(result.ruleResults[0]).not.toHaveProperty("status");
    expect(result.ruleResults[0]).not.toHaveProperty("evaluation");
    expect(result.evidence).toMatchObject({
      diagnostics: [],
      ruleResults: result.ruleResults,
    });
    expect(result.evidence.ruleResults[0]).not.toHaveProperty("status");
    expect(result.evidence.ruleResults[0]).not.toHaveProperty("evaluation");
    expect(result.evidence.inputHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.evidence.profileHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("accepts assignment-form file and profile targets with explicit JSON format", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), validMarkdown);
    await writeFile(join(cwd, "profile.yaml"), validProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file=mission.md",
        "--profile=profile.yaml",
        "--format",
        "json",
      ],
      cwd,
    });

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");
    expect(parseStdout(stdout.text())).toMatchObject({
      diagnostics: [],
      profile: {
        documentVersion: "1.0.0",
        ruleCount: 1,
      },
      valid: true,
    });
  });

  it("emits discriminated v2 flat validation JSON with evidence", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), validMarkdown);
    await writeFile(join(cwd, "profile.yaml"), v2PassingProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
      ],
      cwd,
    });

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    expect(result).toMatchObject({
      diagnostics: [],
      profile: {
        documentVersion: "1.0.0",
        evaluatedRuleCount: 1,
        ruleCount: 1,
        skippedRuleCount: 0,
        syntaxVersion: "markdown-engine.validation@v2",
      },
      ruleResults: [
        {
          diagnostics: [],
          evaluation: {
            diagnostics: [],
            kind: "assertions",
          },
          passed: true,
          ruleId: "v2.text.present",
          status: "passed",
        },
      ],
      valid: true,
    });
    expect(result).not.toHaveProperty("stage");
    expect(result.evidence).toMatchObject({
      diagnostics: [],
      ruleResults: result.ruleResults,
    });
    expect(result.evidence.inputHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.evidence.profileHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("measures the complete original source for v2 sourceLength", async () => {
    const cwd = await makeTempDir();
    const source =
      "---\r\ntitle: 🚀\r\n---\r\n\r\n# Mission Brief\r\n\r\nReady.\r\n";
    const profile = `syntaxVersion: markdown-engine.validation@v2
rules:
  - id: document.source-length
    select:
      target: document
    assert:
      sourceLength:
        min: ${source.length}
        max: ${source.length}
`;
    await writeFile(join(cwd, "mission.md"), source);
    await writeFile(join(cwd, "profile.yaml"), profile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file=mission.md",
        "--profile=profile.yaml",
        "--format=json",
      ],
      cwd,
    });
    const result = parseStdout(stdout.text());

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");
    expect(result).toMatchObject({
      valid: true,
      diagnostics: [],
      evidence: {
        sourceLength: source.length,
      },
      ruleResults: [
        {
          ruleId: "document.source-length",
          status: "passed",
          passed: true,
          diagnostics: [],
        },
      ],
    });
  });

  it("emits failed v2 flat validation JSON without changing the v2 discriminator", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), failingMarkdown);
    await writeFile(join(cwd, "profile.yaml"), v2FailingProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
      ],
      cwd,
    });

    expect(exitCode).toBe(1);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    const expectedDiagnostic = expect.objectContaining({
      code: "profile.validation.textMissing",
      ruleId: "v2.text.missing",
      severity: "error",
    });

    expect(result).toMatchObject({
      diagnostics: [expectedDiagnostic],
      profile: {
        documentVersion: "1.0.0",
        evaluatedRuleCount: 1,
        ruleCount: 1,
        skippedRuleCount: 0,
        syntaxVersion: "markdown-engine.validation@v2",
      },
      ruleResults: [
        {
          diagnostics: [expectedDiagnostic],
          evaluation: {
            diagnostics: [expectedDiagnostic],
            kind: "assertions",
          },
          passed: false,
          ruleId: "v2.text.missing",
          status: "failed",
        },
      ],
      valid: false,
    });
    expect(result).not.toHaveProperty("stage");
    expect(result.evidence).toMatchObject({
      diagnostics: result.diagnostics,
      ruleResults: result.ruleResults,
    });
  });

  it("emits documented v2 grouped validation JSON with evidence", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), validMarkdown);
    await writeFile(join(cwd, "profile.yaml"), v2GroupedProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
      ],
      cwd,
    });

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    expect(result).toMatchObject({
      diagnostics: [],
      profile: {
        documentVersion: "1.0.0",
        evaluatedRuleCount: 1,
        ruleCount: 1,
        skippedRuleCount: 0,
        syntaxVersion: "markdown-engine.validation@v2",
      },
      ruleResults: [
        {
          diagnostics: [],
          evaluation: {
            branches: [
              {
                branchIndex: 0,
                diagnostics: [
                  expect.objectContaining({
                    code: "profile.validation.emptySelection",
                    ruleId: "v2.grouped.anyof",
                    severity: "error",
                  }),
                ],
                label: "missing-verification",
                status: "failed",
              },
              {
                branchIndex: 1,
                diagnostics: [],
                label: "mission-ready",
                status: "passed",
              },
            ],
            kind: "anyOf",
            selectedBranch: {
              branchIndex: 1,
              label: "mission-ready",
            },
          },
          passed: true,
          ruleId: "v2.grouped.anyof",
          status: "passed",
        },
      ],
      valid: true,
    });
    expect(result).not.toHaveProperty("stage");
    expect(result.evidence).toMatchObject({
      diagnostics: [],
      ruleResults: result.ruleResults,
    });
  });

  it("emits documented v2 skipped validation JSON with evidence", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), validMarkdown);
    await writeFile(join(cwd, "profile.yaml"), v2SkippedProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
      ],
      cwd,
    });

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    expect(result).toMatchObject({
      diagnostics: [],
      profile: {
        documentVersion: "1.0.0",
        evaluatedRuleCount: 0,
        ruleCount: 1,
        skippedRuleCount: 1,
        syntaxVersion: "markdown-engine.validation@v2",
      },
      ruleResults: [
        {
          diagnostics: [],
          evaluation: {
            kind: "skipped",
            reason: "whenNotMatched",
          },
          passed: true,
          ruleId: "v2.when.skipped",
          status: "skipped",
          when: {
            diagnostics: [
              expect.objectContaining({
                code: "profile.validation.emptySelection",
                ruleId: "v2.when.skipped",
                severity: "error",
              }),
            ],
            status: "notMatched",
          },
        },
      ],
      valid: true,
    });
    expect(result).not.toHaveProperty("stage");
    expect(result.evidence).toMatchObject({
      diagnostics: [],
      ruleResults: result.ruleResults,
    });
  });

  it("emits documented v2 assertion-extension validation JSON with evidence", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), v2IdCountMarkdown);
    await writeFile(join(cwd, "profile.yaml"), v2IdCountProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
      ],
      cwd,
    });

    expect(exitCode).toBe(1);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    const expectedDiagnostic = expect.objectContaining({
      code: "profile.validation.idCountTooLow",
      ruleId: "v2.ids.min-count",
      severity: "error",
    });

    expect(result).toMatchObject({
      diagnostics: [expectedDiagnostic],
      profile: {
        documentVersion: "1.0.0",
        evaluatedRuleCount: 1,
        ruleCount: 1,
        skippedRuleCount: 0,
        syntaxVersion: "markdown-engine.validation@v2",
      },
      ruleResults: [
        {
          diagnostics: [expectedDiagnostic],
          evaluation: {
            diagnostics: [expectedDiagnostic],
            kind: "assertions",
          },
          passed: false,
          ruleId: "v2.ids.min-count",
          status: "failed",
        },
      ],
      valid: false,
    });
    expect(result).not.toHaveProperty("stage");
    expect(result.evidence).toMatchObject({
      diagnostics: result.diagnostics,
      ruleResults: result.ruleResults,
    });
  });

  it("carries executable profile warnings into validation JSON and evidence", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), validMarkdown);
    await writeFile(join(cwd, "profile.yaml"), warningProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
      ],
      cwd,
    });

    expect(exitCode).toBe(0);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    expect(result).toMatchObject({
      diagnostics: [
        expect.objectContaining({
          code: "profile.config.yamlWarning",
          severity: "warning",
        }),
      ],
      ruleResults: [
        {
          passed: true,
          ruleId: "sections.present",
        },
      ],
      valid: true,
    });
    expect(result.evidence).toMatchObject({
      diagnostics: result.diagnostics,
      ruleResults: result.ruleResults,
    });
  });

  it("emits validation JSON and exits 1 for assertion failures", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), failingMarkdown);
    await writeFile(join(cwd, "profile.yaml"), failingProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file=mission.md",
        "--profile=profile.yaml",
        "--format=json",
      ],
      cwd,
    });

    expect(exitCode).toBe(1);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    expect(result).toMatchObject({
      diagnostics: [
        expect.objectContaining({
          code: "profile.validation.textMissing",
          ruleId: "text.required",
          severity: "error",
        }),
      ],
      profile: {
        documentVersion: "1.0.0",
        ruleCount: 1,
      },
      ruleResults: [
        {
          passed: false,
          ruleId: "text.required",
        },
      ],
      valid: false,
    });
    expect(result.evidence).toBeDefined();
  });

  it("emits deterministic validation JSON for failed textLength rules", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), textLengthFailingMarkdown);
    await writeFile(join(cwd, "profile.yaml"), textLengthProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file=mission.md",
        "--profile=profile.yaml",
        "--format=json",
      ],
      cwd,
    });

    expect(exitCode).toBe(1);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    const expectedDiagnostic = {
      code: "profile.validation.assertionFailed",
      message:
        "Selected section text length must be between 30 and 40; found 14.",
      ruleId: "summary.length",
      severity: "error",
    };

    expect(result).toMatchObject({
      diagnostics: [expectedDiagnostic],
      profile: {
        documentVersion: "1.0.0",
        ruleCount: 1,
        syntaxVersion: "markdown-engine.validation@v1",
      },
      ruleResults: [
        {
          diagnostics: [expectedDiagnostic],
          passed: false,
          ruleId: "summary.length",
        },
      ],
      valid: false,
    });
    expect(result).not.toHaveProperty("stage");
    expect(result.evidence).toMatchObject({
      diagnostics: result.diagnostics,
      ruleResults: result.ruleResults,
    });
  });

  it("emits validation JSON and exits 1 for Markdown normalization diagnostics", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), invalidFrontmatterMarkdown);
    await writeFile(join(cwd, "profile.yaml"), validProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
      ],
      cwd,
    });

    expect(exitCode).toBe(1);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    expect(result).toMatchObject({
      diagnostics: [
        expect.objectContaining({
          code: "frontmatter.yaml.invalid",
          severity: "error",
        }),
      ],
      profile: {
        documentVersion: "1.0.0",
        ruleCount: 1,
      },
      ruleResults: [],
      valid: false,
    });
    expect(result).not.toHaveProperty("stage");
    expect(result.evidence).toMatchObject({
      diagnostics: result.diagnostics,
      ruleResults: [],
    });
  });

  it("combines Markdown normalization diagnostics with document-version mismatch", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), invalidFrontmatterMarkdown);
    await writeFile(join(cwd, "profile.yaml"), versionMismatchProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
      ],
      cwd,
    });

    expect(exitCode).toBe(1);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    expect(result).toMatchObject({
      diagnostics: expect.arrayContaining([
        expect.objectContaining({
          code: "frontmatter.yaml.invalid",
          severity: "error",
        }),
        expect.objectContaining({
          code: "profile.config.documentVersionMismatch",
          severity: "error",
        }),
      ]),
      profile: {
        documentVersion: "0.0.0",
        ruleCount: 1,
      },
      ruleResults: [],
      valid: false,
    });
    expect(result.evidence).toMatchObject({
      diagnostics: result.diagnostics,
      ruleResults: [],
    });
  });

  it("emits profile-stage JSON for invalid YAML without reading Markdown", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "profile.yaml"), invalidYamlProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file",
        "missing.md",
        "--profile",
        "profile.yaml",
      ],
      cwd,
    });

    expect(exitCode).toBe(1);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    expect(result).toMatchObject({
      diagnostics: [
        expect.objectContaining({
          code: "profile.config.invalidYaml",
          severity: "error",
        }),
      ],
      ruleResults: [],
      stage: "profile",
      valid: false,
    });
    expect(result).not.toHaveProperty("profile");
    expect(result).not.toHaveProperty("evidence");
  });

  it("emits profile-stage JSON for unsupported syntax without reading Markdown", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "profile.yaml"), unsupportedSyntaxProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file",
        "missing.md",
        "--profile",
        "profile.yaml",
      ],
      cwd,
    });

    expect(exitCode).toBe(1);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    expect(result).toMatchObject({
      diagnostics: [
        expect.objectContaining({
          code: "profile.config.unsupportedSyntaxVersion",
          severity: "error",
        }),
      ],
      ruleResults: [],
      stage: "profile",
      valid: false,
    });
    expect(result).not.toHaveProperty("profile");
    expect(result).not.toHaveProperty("evidence");
  });

  it.each([
    {
      name: "incompatible selector/assertion",
      profileText: incompatibleProfile,
    },
    {
      name: "unsupported assertion",
      profileText: unsupportedAssertionProfile,
    },
  ])(
    "emits profile-stage JSON for compile failures without reading Markdown: $name",
    async ({ profileText }) => {
      const cwd = await makeTempDir();
      await writeFile(join(cwd, "profile.yaml"), profileText);

      const { exitCode, stderr, stdout } = await runCliWithOutput({
        args: [
          "validate",
          "--file",
          "missing.md",
          "--profile",
          "profile.yaml",
        ],
        cwd,
      });

      expect(exitCode).toBe(1);
      expect(stderr.text()).toBe("");

      const result = parseStdout(stdout.text());
      expect(result).toMatchObject({
        ruleResults: [],
        stage: "profile",
        valid: false,
      });
      expect(result.diagnostics[0]?.code).toMatch(/^profile\.(config|compile)\./);
      expect(result).not.toHaveProperty("profile");
      expect(result).not.toHaveProperty("evidence");
    },
  );

  it("emits validation JSON for document-version mismatch without rule evaluation", async () => {
    const cwd = await makeTempDir();
    await writeFile(join(cwd, "mission.md"), validMarkdown);
    await writeFile(join(cwd, "profile.yaml"), versionMismatchProfile);

    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
      ],
      cwd,
    });

    expect(exitCode).toBe(1);
    expect(stderr.text()).toBe("");

    const result = parseStdout(stdout.text());
    expect(result).toMatchObject({
      diagnostics: [
        {
          code: "profile.config.documentVersionMismatch",
          message:
            'Profile documentVersion "0.0.0" does not match document version "1.0.0".',
          severity: "error",
        },
      ],
      profile: {
        documentVersion: "0.0.0",
        ruleCount: 1,
      },
      ruleResults: [],
      valid: false,
    });
    expect(result).not.toHaveProperty("stage");
    expect(result.evidence).toBeDefined();
  });

  it.each([
    {
      args: ["validate", "--help"],
      usage: "Usage: markdown-engine validate",
    },
    {
      args: ["validate", "-h"],
      usage: "Usage: markdown-engine validate",
    },
  ])("writes validation help to stdout: $args", async ({ args, usage }) => {
    const { exitCode, stderr, stdout } = await runCliWithOutput({
      args,
      cwd: "/",
    });

    expect(exitCode).toBe(0);
    expect(stdout.text()).toContain(usage);
    expect(stderr.text()).toBe("");
  });

  it.each([
    {
      args: ["validate"],
      message: "Expected exactly one --file target.",
    },
    {
      args: ["validate", "--file", "mission.md"],
      message: "Expected exactly one --profile target.",
    },
    {
      args: ["validate", "--file"],
      message: "Missing value for --file.",
    },
    {
      args: ["validate", "--file=", "--profile", "profile.yaml"],
      message: "File path cannot be empty.",
    },
    {
      args: ["validate", "--file", "mission.md", "--profile"],
      message: "Missing value for --profile.",
    },
    {
      args: ["validate", "--file", "mission.md", "--profile="],
      message: "Profile path cannot be empty.",
    },
    {
      args: [
        "validate",
        "--file",
        "a.md",
        "--file",
        "b.md",
        "--profile",
        "profile.yaml",
      ],
      message: "Expected one Markdown file target, received multiple.",
    },
    {
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "a.yaml",
        "--profile",
        "b.yaml",
      ],
      message: "Expected one profile file target, received multiple.",
    },
    {
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
        "--format",
      ],
      message: "Missing value for --format.",
    },
    {
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
        "--format",
        "text",
      ],
      message: "Unsupported validation output format: text.",
    },
    {
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
        "--format=xml",
      ],
      message: "Unsupported validation output format: xml.",
    },
    {
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
        "--format=json",
        "--format",
        "json",
      ],
      message: "Expected at most one --format selector.",
    },
    {
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "profile.yaml",
        "--document-version",
        "1.0.0",
      ],
      message: "Unknown argument: --document-version",
    },
  ])(
    "returns usage errors with exit code 2: $message",
    async ({ args, message }) => {
      const { exitCode, stderr, stdout } = await runCliWithOutput({
        args,
        cwd: "/",
      });

      expect(exitCode).toBe(2);
      expect(stdout.text()).toBe("");
      expect(stderr.text()).toContain(message);
      expect(stderr.text()).toContain("Usage: markdown-engine validate");
    },
  );

  it.each([
    {
      name: "missing profile",
      setup: async (cwd: string) => {
        await writeFile(join(cwd, "mission.md"), validMarkdown);
      },
      args: [
        "validate",
        "--file",
        "mission.md",
        "--profile",
        "missing.yaml",
      ],
      message: 'Unable to read "missing.yaml"',
    },
    {
      name: "missing markdown",
      setup: async (cwd: string) => {
        await writeFile(join(cwd, "profile.yaml"), validProfile);
      },
      args: [
        "validate",
        "--file",
        "missing.md",
        "--profile",
        "profile.yaml",
      ],
      message: 'Unable to read "missing.md"',
    },
    {
      name: "directory markdown target",
      setup: async (cwd: string) => {
        await mkdir(join(cwd, "docs"));
        await writeFile(join(cwd, "profile.yaml"), validProfile);
      },
      args: ["validate", "--file", "docs", "--profile", "profile.yaml"],
      message: "Directories are not supported",
    },
    {
      name: "directory profile target",
      setup: async (cwd: string) => {
        await writeFile(join(cwd, "mission.md"), validMarkdown);
        await mkdir(join(cwd, "profiles"));
      },
      args: ["validate", "--file", "mission.md", "--profile", "profiles"],
      message: "Directories are not supported",
    },
  ])(
    "returns read errors with exit code 2: $name",
    async ({ args, message, setup }) => {
      const cwd = await makeTempDir();
      await setup(cwd);

      const { exitCode, stderr, stdout } = await runCliWithOutput({
        args,
        cwd,
      });

      expect(exitCode).toBe(2);
      expect(stdout.text()).toBe("");
      expect(stderr.text()).toContain(message);
    },
  );
});

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "markdown-engine-validation-cli-"));
  tempDirs.push(dir);
  return dir;
}

function parseStdout(output: string): Record<string, any> {
  return JSON.parse(output) as Record<string, any>;
}

function createTextOutput(): TextOutput & { text(): string } {
  let output = "";

  return {
    text: () => output,
    write: (chunk: string) => {
      output += chunk;
      return true;
    },
  };
}

async function runCliWithOutput(input: {
  args: string[];
  cwd: string;
}): Promise<{
  exitCode: number;
  stderr: TextOutput & { text(): string };
  stdout: TextOutput & { text(): string };
}> {
  const stdout = createTextOutput();
  const stderr = createTextOutput();
  const exitCode = await runCli({
    args: input.args,
    cwd: input.cwd,
    stderr,
    stdout,
  });

  return { exitCode, stderr, stdout };
}
