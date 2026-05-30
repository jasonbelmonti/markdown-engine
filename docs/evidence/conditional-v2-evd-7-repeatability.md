# Conditional V2 EVD-7: Repeatability Harness

Issue: BEL-1111
Parent issue: BEL-1084
Blocked-by leaf: BEL-1110, completed 2026-05-28
Branch: `codex/BEL-1111-repeatability`
Worktree: `.worktrees/BEL-1111-repeatability`
Baseline: `origin/main` at `cf693b5`
Date: 2026-05-30

## Scope

EVD-7 records repeatability evidence for Conditional V2 API result JSON, CLI
validation JSON, and standalone evidence JSON. The scope is limited to the
repeatability harness, stable fixtures, proof-script diagnostics, and observed
10-run output.

This evidence does not change Conditional V2 grammar semantics, public output
shape, boundary audit checks, downstream design-spec exercise breadth, release
verification, tag creation, package publication, or MS-3 approval.

## Harness Coverage

`scripts/declarative-validation-repeatability-cases.mjs` covers the existing v1
and v2 repeatability cases. The BEL-1111 Conditional V2 cases are isolated in
`scripts/declarative-validation-conditional-v2-repeatability-cases.mjs` and
cover:

- v2 ID count API result and standalone evidence JSON;
- v2 table-column coverage API result and standalone evidence JSON;
- a composite v2 profile that exercises flat assertion, grouped `anyOf`,
  skipped `when`, ID count, and table-column coverage paths;
- CLI validation JSON for the same composite v2 profile.

The stable composite fixture inputs are:

- `fixtures/declarative-validation/conditional-v2/repeatability.md`
- `fixtures/declarative-validation/conditional-v2/repeatability-profile.yaml`

The composite profile has five configured rules. Four rules are evaluated and
one `when` rule is skipped, producing `evaluatedRuleCount: 4` and
`skippedRuleCount: 1`.

## Command

Run from `.worktrees/BEL-1111-repeatability` on 2026-05-30:

```sh
npm run test:validation:repeatability
```

The package script runs:

```sh
npm run build
vitest run tests/declarative-validation-repeatability.test.ts "--exclude=.worktrees/**"
node scripts/prove-declarative-validation-repeatability.mjs --runs 10
```

## Recorded Result

```text
tests/declarative-validation-repeatability.test.ts (2 tests) passed
Declarative validation repeatability PASS
Runs: 10
Cases per run: 45
```

## New BEL-1111 Repeatability Hashes

| Case | SHA-256 | Bytes |
| --- | --- | --- |
| `declarative-validation:v2-id-count-result:compact` | `d05a901565739b686c50f815f63d55c420ee9058de278f0a1c47150f93615d18` | 719 |
| `declarative-validation:v2-id-count-result:pretty` | `97adc25c2c4e1838149ef31918f38b9e9b576c9e0d69f116222d72fc618974cd` | 994 |
| `declarative-validation:v2-id-count-evidence:compact` | `82552c27775848c058e6c8d4ba7d4e97eb930cc2b49bdb4b5018e93347a5b12f` | 381 |
| `declarative-validation:v2-id-count-evidence:pretty` | `6b6147814af343b49758b7653b946499a21364d788527350bd5ac9642ef87603` | 486 |
| `declarative-validation:v2-table-column-coverage-result:compact` | `c48b5114d3314d7cf5542791ca261bf1dcf31a416018cbe335c61427606852fc` | 741 |
| `declarative-validation:v2-table-column-coverage-result:pretty` | `c68a15368bcf7e25dcbfb94e781f03716392d842541d4f796a31efb6fe91e1e4` | 1016 |
| `declarative-validation:v2-table-column-coverage-evidence:compact` | `5375ddca0762ffbac136227ed07b51b211af04b1100fa40ae06288aad31a6ce9` | 392 |
| `declarative-validation:v2-table-column-coverage-evidence:pretty` | `fb8540a84551931957835e3556dd5d84395610d52001fae701f032b3387d459d` | 497 |
| `declarative-validation:v2-composite-result:compact` | `5a8a30af0c089e376d53dc7eb4a38330f981f68528d69a21864533a8100b1f9d` | 3039 |
| `declarative-validation:v2-composite-result:pretty` | `51a009b67f379aa9aa79a54a24d77bc6d78e51905369709aeb9f9f8b58d92573` | 4970 |
| `declarative-validation:v2-composite-evidence:compact` | `2bffed5953228e07e178b02c187ae77b0d9b10608ff6c84b2e5fdbe95e833c6d` | 1541 |
| `declarative-validation:v2-composite-evidence:pretty` | `f6e086609e2a04e3c0748ec09f82037fdd9dd4773ee0855d1c66094a63dd4da0` | 2399 |
| `declarative-validation:v2-composite-cli-json` | `69f624440dd8378dbe4acab11f2be9a3093d16257545117f7e8510fcb3ee3f00` | 4971 |

Observed composite evidence hashes:

```text
v2-composite inputHash: 5a30ac5ef9348f32760eec7224a34401b45ab4d6723a9b90e2a7917a69ad3655
v2-composite profileHash: 87753d6efc394efdae86ce16dc05e8bf3b0514d0ce6d2c1b4aacdea5ee5f7899
```

The CLI JSON case validates the built CLI against the same stable composite
fixture paths. It exits `0`, emits no stderr, and is compared byte-for-byte
against the baseline output across the 10-run proof.

## Failure Diagnostics

`scripts/prove-declarative-validation-repeatability.mjs` now reports expected
and actual SHA-256 plus byte length for an unstable case. When the case names
match but bytes differ, it also reports the first differing byte offset. When
case order changes, it reports the expected and actual case names.

## Review Boundary

Review BEL-1111 for repeatability harness coverage, deterministic API result
JSON, deterministic CLI validation JSON, deterministic standalone evidence
JSON, actionable proof-script failures, and the accuracy of this evidence
record. Boundary audit checks, downstream design-spec exercise breadth, release
verification, tag creation, package publication, and MS-3 approval remain out of
scope unless this diff contradicts or prevents those later gates.

## Residual Risks

- This evidence proves deterministic output for representative Conditional V2
  inputs, not exhaustive determinism for all possible Markdown/profile inputs.
- The CLI repeatability case depends on `npm run build` producing
  `dist/cli/index.js` before the proof script runs; that dependency is already
  part of `npm run test:validation:repeatability`.
- Boundary audit evidence remains BEL-1112 scope.

## Conclusion

BEL-1111 repeatability evidence passes. Conditional V2 API result JSON, CLI
validation JSON, and standalone evidence JSON are byte-for-byte deterministic
across ten repeated runs for the covered flat, grouped, skipped-rule, ID count,
and table-column coverage paths.
