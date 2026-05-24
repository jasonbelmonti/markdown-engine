# Conditional V2 EVD-5: `when` Skipped Rules

Issue: BEL-1107
Parent issue: BEL-1084
Branch: `codex/bel-1107-when-matched-path`
Worktree: `.worktrees/BEL-1107`
Baseline: `origin/main` at `ca4b6ed`
Date: 2026-05-24

## Scope

EVD-5 records targeted evidence for Conditional V2 rule-level `when` across
flat and grouped rule paths. The scope is limited to matched applicability,
not-matched applicability, skipped result shape, skipped/evaluated counts,
top-level diagnostic suppression for skipped rules, evidence cloning, and
repeatability.

This evidence does not implement public contract or CLI parity, boundary audit,
downstream design-spec exercise breadth, release readiness, tag, publication,
parser changes, rich IR changes, or source-range model changes.

## Fixture Coverage

The fixture suite is
`fixtures/declarative-validation/conditional-v2/when-skipped-rules.yaml`.

| Fixture | Contract |
| --- | --- |
| `flat-when-matched-pass` | Execute a flat rule when rule-level applicability matches. |
| `flat-when-not-matched-skipped` | Skip a flat rule when rule-level applicability does not match. |
| `anyof-when-matched-pass` | Execute grouped `anyOf` branches when rule-level applicability matches. |
| `anyof-when-not-matched-skipped` | Skip grouped `anyOf` branches when rule-level applicability does not match. |
| `allof-when-matched-pass` | Execute grouped `allOf` branches when rule-level applicability matches. |
| `allof-when-not-matched-skipped` | Skip grouped `allOf` branches when rule-level applicability does not match. |

`tests/declarative-validation-when-skipped-rules-fixtures.test.ts` parses each
fixture profile, validates the fixture Markdown with evidence enabled, and
asserts:

- matched flat rules continue into assertions evaluation;
- matched grouped rules continue into established `anyOf` and `allOf`
  evaluation semantics;
- skipped flat and grouped rules return `status: "skipped"`, `passed: true`,
  `evaluation.kind: "skipped"`, `reason: "whenNotMatched"`, nested
  `when.diagnostics`, and no top-level diagnostics;
- skipped cases report `evaluatedRuleCount: 0` and `skippedRuleCount: 1`;
- `evidence.ruleResults` equals `ruleResults` and `evidence.diagnostics` equals
  top-level `diagnostics`.

## Representative Skipped JSON

Skipped grouped `anyOf` fixture:

```json
{
  "valid": true,
  "diagnostics": [],
  "ruleResults": [
    {
      "ruleId": "when.anyof.skipped",
      "status": "skipped",
      "passed": true,
      "diagnostics": [],
      "when": {
        "status": "notMatched",
        "diagnostics": [
          {
            "code": "profile.validation.emptySelection",
            "ruleId": "when.anyof.skipped",
            "message": "Rule selector did not match any document targets.",
            "severity": "error"
          }
        ]
      },
      "evaluation": {
        "kind": "skipped",
        "reason": "whenNotMatched"
      }
    }
  ],
  "profile": {
    "syntaxVersion": "markdown-engine.validation@v2",
    "documentVersion": "1.0.0",
    "ruleCount": 1,
    "evaluatedRuleCount": 0,
    "skippedRuleCount": 1
  },
  "evidence": {
    "ruleResults": "same as result ruleResults",
    "diagnostics": []
  }
}
```

The flat and grouped `allOf` skipped fixtures use the same skipped result shape
with their own rule IDs:

- `when.flat.skipped`
- `when.allof.skipped`

## Skipped Count Proof

Each not-matched fixture validates one configured rule and reports:

| Fixture | `ruleCount` | `evaluatedRuleCount` | `skippedRuleCount` | Top-level diagnostics |
| --- | --- | --- | --- | --- |
| `flat-when-not-matched-skipped` | 1 | 0 | 1 | `[]` |
| `anyof-when-not-matched-skipped` | 1 | 0 | 1 | `[]` |
| `allof-when-not-matched-skipped` | 1 | 0 | 1 | `[]` |

The skipped fixtures deliberately include rule bodies that would fail if
evaluated. The observed `evaluation.kind: "skipped"` output proves those flat
or grouped rule bodies are not evaluated when applicability does not match.

## Repeatability Proof

`scripts/declarative-validation-repeatability-cases.mjs` includes a
representative `v2-when` result with one matched flat rule and one skipped
grouped rule. `tests/declarative-validation-repeatability.test.ts` verifies the
new cases are present in stable order and that the evidence payload clones the
result `ruleResults` and top-level `diagnostics`.

Observed `v2-when` repeatability hashes from the 10-run proof:

| Case | SHA-256 | Bytes |
| --- | --- | --- |
| `declarative-validation:v2-when-result:compact` | `b0d39218a1aae02a3c6d458ae4e1d5a21ff0ea30263b000d0add2b589bf50a37` | 1425 |
| `declarative-validation:v2-when-result:pretty` | `b837d6c39978a8f953b3a35a2a0abc68ffe5d812dc41b87a4600dc9241d48d13` | 2140 |
| `declarative-validation:v2-when-evidence:compact` | `66ac1d1feac22ad62220b40776003c4863b65d6c6a972cdf29fc9eba68e183d4` | 734 |
| `declarative-validation:v2-when-evidence:pretty` | `db7fbe066d22daca89bf2b31385c6c6fa3f6ddaa8c64cc23ef0c1462b600ff7a` | 1038 |

## MV-6 Command Output

All required MV-6 commands passed on 2026-05-24 in
`.worktrees/BEL-1107`.

```text
$ npm run test:validation:profile
Test Files  1 passed (1)
Tests  55 passed (55)

$ npm run test:validation:compiler
Test Files  1 passed (1)
Tests  38 passed (38)

$ npm run test:validation:assertions
Test Files  4 passed (4)
Tests  135 passed (135)

$ npm run test:validation:diagnostics
Test Files  1 passed (1)
Tests  4 passed (4)

$ npm run test:validation:repeatability
Test Files  1 passed (1)
Tests  2 passed (2)
Declarative validation repeatability PASS
Runs: 10
Cases per run: 32
```

## Review Boundary

Review BEL-1107 for `when` matched/skipped behavior, fixture coverage,
evidence correctness, repeatability coverage, and regressions introduced by
this diff. Public contract/CLI parity, boundary audit, downstream
design-spec exercise, release readiness, and final MS-3 handoff evidence remain
out of scope for this leaf unless this diff changes or prevents those later
work items.
