# Conditional V2 EVD-1: Proving Slice

Issue: BEL-1089
Branch: `codex/bel-1089-cli-discrimination-evd-1`
Worktree: `.worktrees/bel-1089-cli-discrimination-evd-1`
Date: 2026-05-21

## Scope

EVD-1 records the MS-1 proving slice for the admitted flat v2 validation path.
The scope is limited to CLI JSON discrimination, existing v1 CLI JSON
compatibility, v2 flat validation JSON, profile-stage failure JSON, and
contract-doc inspection. Grouped rules, `when`, ID count bounds, and
table-column coverage remain out of scope for later packages.

## Command Results

Commands were run from `.worktrees/bel-1089-cli-discrimination-evd-1`.

```text
npm run test:validation:profile
PASS tests/declarative-validation-profile.test.ts (46 tests)
Test Files  1 passed (1)
Tests  46 passed (46)
```

```text
npm run test:validation:compiler
PASS tests/declarative-validation-compiler.test.ts (33 tests)
Test Files  1 passed (1)
Tests  33 passed (33)
```

```text
npm run test:validation:contract
PASS tests/declarative-validation-contract.test.ts (24 tests)
Test Files  1 passed (1)
Tests  24 passed (24)
```

```text
npm run test:validation:cli
PASS tests/declarative-validation-cli.test.ts (33 tests)
Test Files  1 passed (1)
Tests  33 passed (33)
```

```text
npm run docs:declarative-validation-contract
Declarative validation contract documentation gate PASS
Checked files: docs/contracts/declarative-validation.md, README.md, docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md, docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md, package.json
```

## CLI JSON Discrimination

The CLI JSON union is discriminated as follows:

- v1 validation output: `profile.syntaxVersion` is
  `"markdown-engine.validation@v1"` and v1 rule results do not include
  `status` or `evaluation`.
- v2 flat validation output: `profile.syntaxVersion` is
  `"markdown-engine.validation@v2"`, `profile.evaluatedRuleCount` and
  `profile.skippedRuleCount` are present, and flat rule results include
  `status` plus `evaluation.kind: "assertions"`.
- Profile-stage failure output: top-level `stage` is `"profile"` and the JSON
  contains no `profile` and no `evidence`.

The CLI tests in `tests/declarative-validation-cli.test.ts` assert all three
shapes.

## Representative V1 Excerpt

Command:

```sh
node dist/cli/index.js validate --file fixtures/declarative-validation/examples/operational-spec/pass.md --profile fixtures/declarative-validation/examples/operational-spec/profile.yaml --format json
```

Exit code: `0`

Excerpt:

```json
{
  "diagnostics": [],
  "profile": {
    "documentVersion": "1.0.0",
    "ruleCount": 12,
    "syntaxVersion": "markdown-engine.validation@v1"
  },
  "ruleResults": [
    {
      "diagnostics": [],
      "passed": true,
      "ruleId": "execution.list"
    }
  ],
  "valid": true
}
```

V1 compatibility note: the representative v1 rule result remains the flat
`ruleId` / `passed` / `diagnostics` shape. It has no `status`, no
`evaluation`, no `profile.evaluatedRuleCount`, and no `profile.skippedRuleCount`.

## Representative V2 Flat Excerpt

Temporary Markdown used for the excerpt:

```md
---
title: Mission Brief
---

# Mission Brief

REQ-1 is ready.
```

Temporary profile used for the excerpt:

```yaml
syntaxVersion: markdown-engine.validation@v2
rules:
  - id: v2.text.present
    select:
      target: document
    assert:
      text:
        contains: REQ-1
```

Command:

```sh
node dist/cli/index.js validate --file .tmp-bel-1089/mission.md --profile .tmp-bel-1089/v2-profile.yaml --format json
```

Exit code: `0`

Excerpt:

```json
{
  "diagnostics": [],
  "profile": {
    "documentVersion": "1.0.0",
    "evaluatedRuleCount": 1,
    "ruleCount": 1,
    "skippedRuleCount": 0,
    "syntaxVersion": "markdown-engine.validation@v2"
  },
  "ruleResults": [
    {
      "diagnostics": [],
      "evaluation": {
        "diagnostics": [],
        "kind": "assertions"
      },
      "passed": true,
      "ruleId": "v2.text.present",
      "status": "passed"
    }
  ],
  "valid": true
}
```

## Representative Profile-Stage Failure Excerpt

Temporary invalid profile used for the excerpt:

```yaml
syntaxVersion: markdown-engine.validation@v1
rules:
  - id: invalid
    select: [
```

Command:

```sh
node dist/cli/index.js validate --file .tmp-bel-1089/missing.md --profile .tmp-bel-1089/invalid-profile.yaml --format json
```

Exit code: `1`

Excerpt:

```json
{
  "diagnostics": [
    {
      "code": "profile.config.invalidYaml",
      "severity": "error"
    }
  ],
  "ruleResults": [],
  "stage": "profile",
  "valid": false
}
```

Profile-stage compatibility note: the CLI reads and rejects the profile before
reading Markdown. This output has no `profile` and no `evidence`.

## Contract Inspection

`docs/contracts/declarative-validation.md` already records the current v2 flat
surface, v1 preservation, v2 result metadata, v2 rule-result fields, evidence
rule-result cloning, CLI behavior, and the CLI JSON union. The docs gate passed
without additional contract skeleton changes.

## MS-1 Approval Input

MS-1 owner decision: pending project-owner review.

Approval inputs ready for review:

- Profile, compiler, contract, CLI, and contract-doc gates pass.
- V1 CLI JSON remains flat and syntax-versioned as v1.
- V2 flat CLI JSON is syntax-versioned as v2 and includes the flat v2 result
  shell.
- Profile-stage failures retain the existing `stage: "profile"` shape and do
  not read Markdown.
