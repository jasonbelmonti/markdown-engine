# Conditional V2 EVD-4: Grouped Rules

Issue: BEL-1103
Parent issue: BEL-1084
Branch: `codex/bel-1103-grouped-evidence`
Worktree: `.worktrees/bel-1103-grouped-evidence`
Date: 2026-05-23

## Scope

EVD-4 records targeted evidence for Conditional V2 `anyOf` and `allOf`
grouped rules. The scope is limited to grouped-rule result shape, diagnostic
promotion, evidence cloning, deterministic branch order, and repeatability.

This evidence does not implement `when`, applicability/skipped-rule behavior,
downstream design-spec exercise, release readiness, tag, publish, parser
changes, rich IR changes, or source-range model changes.

## Fixture Coverage

The fixture suite is
`fixtures/declarative-validation/conditional-v2/grouped-rules.yaml`.

| Fixture | Contract |
| --- | --- |
| `anyof-selected-second-branch-pass` | Passing `anyOf` when branch 1 passes while branch 0 diagnostics remain nested. |
| `anyof-all-branches-fail` | Failing `anyOf` with one top-level summary diagnostic and deterministic nested branch diagnostics. |
| `allof-all-branches-pass` | Passing `allOf` when every branch passes in profile order. |
| `allof-one-branch-fail` | Failing `allOf` with one top-level summary diagnostic and deterministic nested failed-branch diagnostics. |

`tests/declarative-validation-grouped-rules-fixtures.test.ts` parses each
fixture profile, validates the fixture Markdown with evidence enabled, and
asserts that `evidence.ruleResults` equals `ruleResults` and
`evidence.diagnostics` equals top-level `diagnostics`.

## Representative JSON

Passing `anyOf` with selected branch 1:

```json
{
  "valid": true,
  "diagnostics": [],
  "ruleResults": [
    {
      "ruleId": "grouped.anyof.pass",
      "status": "passed",
      "passed": true,
      "diagnostics": [],
      "evaluation": {
        "kind": "anyOf",
        "selectedBranch": {
          "branchIndex": 1,
          "label": "explicit-none"
        },
        "branches": [
          {
            "branchIndex": 0,
            "label": "table",
            "status": "failed",
            "diagnostics": [
              {
                "code": "profile.validation.emptySelection",
                "ruleId": "grouped.anyof.pass",
                "message": "Rule selector did not match any document targets.",
                "severity": "error"
              }
            ]
          },
          {
            "branchIndex": 1,
            "label": "explicit-none",
            "status": "passed",
            "diagnostics": []
          }
        ]
      }
    }
  ],
  "evidence": {
    "inputHash": "32e9693d45d6cf48175db96e567f2ec99f65f5ad4f351741fc2eb662f68728f8",
    "profileHash": "682a300037a7c22e7972f917dd667dc4fb972f514daf298d99d0df9edaf93be0",
    "ruleResults": "same as result ruleResults",
    "diagnostics": []
  }
}
```

Failing `allOf` with one promoted summary diagnostic:

```json
{
  "valid": false,
  "diagnostics": [
    {
      "code": "profile.validation.groupRequirementFailed",
      "ruleId": "grouped.allof.fail",
      "message": "One or more allOf branches failed the grouped rule.",
      "severity": "error"
    }
  ],
  "ruleResults": [
    {
      "ruleId": "grouped.allof.fail",
      "status": "failed",
      "passed": false,
      "diagnostics": [
        {
          "code": "profile.validation.groupRequirementFailed",
          "ruleId": "grouped.allof.fail",
          "message": "One or more allOf branches failed the grouped rule.",
          "severity": "error"
        }
      ],
      "evaluation": {
        "kind": "allOf",
        "branches": [
          {
            "branchIndex": 0,
            "label": "heading",
            "status": "passed",
            "diagnostics": []
          },
          {
            "branchIndex": 1,
            "label": "table",
            "status": "failed",
            "diagnostics": [
              {
                "code": "profile.validation.assertionFailed",
                "ruleId": "grouped.allof.fail",
                "message": "Selected table must include column \"Owner\".",
                "severity": "error"
              }
            ]
          }
        ]
      }
    }
  ],
  "evidence": {
    "inputHash": "18618dad3d609a95a4971b9f881b39ba5696bfebfdab1afa5813e6c71c229825",
    "profileHash": "fdf2c460717bc92ea553f8edb567bbf181db6b0735c3afab7bc6b186c51d09e9",
    "ruleResults": "same as result ruleResults",
    "diagnostics": "same as result diagnostics"
  }
}
```

## Diagnostic Promotion Proof

- `anyof-selected-second-branch-pass` has no top-level diagnostics even though
  branch 0 fails with `profile.validation.emptySelection`; the failed branch
  diagnostic remains nested under `evaluation.branches[0].diagnostics`.
- `anyof-all-branches-fail` emits exactly one top-level
  `profile.validation.noAlternativeMatched` diagnostic. The branch-specific
  `emptySelection` and `textMissing` diagnostics remain nested in deterministic
  branch-index order.
- `allof-all-branches-pass` has no top-level diagnostics and records both
  branches as `passed` in profile order.
- `allof-one-branch-fail` emits exactly one top-level
  `profile.validation.groupRequirementFailed` diagnostic. The table branch's
  `profile.validation.assertionFailed` diagnostic remains nested under branch
  index 1.

## Repeatability Proof

`scripts/declarative-validation-repeatability-cases.mjs` now includes grouped
result and evidence cases. `tests/declarative-validation-repeatability.test.ts`
expects the grouped cases in stable order and verifies that grouped evidence
clones grouped result `ruleResults` and top-level `diagnostics`.

Observed grouped repeatability hashes from the 10-run proof:

| Case | SHA-256 | Bytes |
| --- | --- | --- |
| `declarative-validation:v2-grouped-result:compact` | `434182a8f5d8b4f977ebf56db94ec9749d8906cb2f751ebcc865c9b183c4f689` | 5744 |
| `declarative-validation:v2-grouped-result:pretty` | `8d35175871cb92c8e36f7db66938548694ac007f9341be8dbc11fff6f29a01ea` | 10583 |
| `declarative-validation:v2-grouped-evidence:compact` | `4be39724f0920e75e9a33fc124521e8145463f63ddce7f5fd60f53c8376d0404` | 2893 |
| `declarative-validation:v2-grouped-evidence:pretty` | `1c6c1805d7e20bb66119927b84a6df3fb529faadcfec15a9d179f1ab0ffe76ee` | 5115 |

## Command Results

Commands were run from `.worktrees/bel-1103-grouped-evidence`.

```text
npm run test:validation:profile
PASS tests/declarative-validation-profile.test.ts (54 tests)
Test Files  1 passed (1)
Tests  54 passed (54)
```

```text
npm run test:validation:compiler
PASS tests/declarative-validation-compiler.test.ts (36 tests)
Test Files  1 passed (1)
Tests  36 passed (36)
```

```text
npm run test:validation:assertions
PASS tests/declarative-validation-grouped-rules-fixtures.test.ts (5 tests)
PASS tests/declarative-validation-table-column-coverage-fixtures.test.ts (9 tests)
PASS tests/declarative-validation-assertions.test.ts (110 tests)
Test Files  3 passed (3)
Tests  124 passed (124)
```

```text
npm run test:validation:diagnostics
PASS tests/declarative-validation-diagnostics.test.ts (4 tests)
Test Files  1 passed (1)
Tests  4 passed (4)
```

```text
npm run test:validation:repeatability
PASS tests/declarative-validation-repeatability.test.ts (2 tests)
Declarative validation repeatability PASS
Runs: 10
Cases per run: 28
```

No approved deviations were used for MV-5.

## Approval Input

This evidence is ready as WP-4 / EVD-4 input for MS-3 grouped-rule review.
It does not claim MS-3 completion by itself because `when`, contract/CLI
compatibility closeout, repeatability/boundary closeout, and later MS-3
approval records remain outside BEL-1103.
