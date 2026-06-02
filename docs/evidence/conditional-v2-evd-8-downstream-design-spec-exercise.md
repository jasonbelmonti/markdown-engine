# Conditional V2 EVD-8: Downstream Design-Spec Exercise

Issue: BEL-1120
Parent issue: BEL-1084
Branch: `codex/bel-1120-conditional-v2-downstream-false-acceptance`
Worktree: `.worktrees/BEL-1120`
Baseline: `origin/main` at `380de0b`
Date: 2026-06-02

## Scope

EVD-8 records the Conditional V2 downstream design-spec exercise for BEL-1120.
The scope is limited to downstream fixture names, expected pass/fail cases,
false-acceptance negative coverage, command output, and downstream owner notes.

This record does not add release verification, changelog content, rollback
notes, handoff content, tag or publication readiness, or EVD-9 release
readiness evidence.

No production implementation files changed for this evidence. The false
acceptance negatives passed as expected, so no production bug-fix blocker was
discovered in this leaf.

## Fixture Harness

The downstream fixture harness is
`fixtures/declarative-validation/conditionals/harness.yaml` and is exercised by
`tests/declarative-validation-downstream.test.ts`.

Harness conventions:

- Case names follow `l8<leaf>-<capability>-<expectation>`.
- Rule IDs follow `conditionals.downstream.<capability>.<expectation>`.
- Expected output records aggregate validity, v2 profile counts, top-level
  diagnostics, rule status, compatibility `passed`, and nested evaluation
  shape.

## Expected Pass / Fail Cases

| Fixture | Expected | Coverage |
| --- | --- | --- |
| `l8a-table-column-coverage-pass` | pass | Every source ID appears in the configured target table column. |
| `l8a-table-column-coverage-fail` | fail | Narrative and non-target-column mentions do not satisfy target-column coverage. |
| `l8b-section4-table-pass` | pass | Section 4 constraints table branch is valid. |
| `l8b-section4-none-pass` | pass | Section 4 explicit `None / N/A` paragraph branch is valid. |
| `l8b-section4-neither-fail` | fail | Section 4 satisfies neither the required table branch nor the authorized none branch. |
| `l8c-section15-table-pass` | pass | Section 15 controls table branch is valid. |
| `l8c-section15-na-pass` | pass | Section 15 explicit `N/A` rationale paragraph branch is valid. |
| `l8c-section15-neither-fail` | fail | Section 15 satisfies neither the controls table branch nor the authorized N/A rationale branch. |
| `l8d-r1-traceability-standard-pass` | pass | R1 traceability satisfies the Section 11 standard matrix branch. |
| `l8d-r1-traceability-replacement-pass` | pass | R1 traceability satisfies the approved Section 17 replacement matrix branch. |
| `l8d-r1-traceability-neither-fail` | fail | R1 traceability satisfies neither Section 11 nor Section 17 target-column branch. |
| `l8e-mixed-id-count-pass` | pass | Mixed downstream ID families satisfy prefix-filtered count bounds. |
| `l8e-mixed-id-count-fail` | fail | A mixed downstream ID family exceeds its prefix-filtered count bound. |
| `l8e-section11-target-column-pass` | pass | Section 11 traces every source requirement ID in the configured target column. |
| `l8e-section11-target-column-fail` | fail | Section 11 narrative and non-target-column mentions do not satisfy the configured target column. |
| `l8e-section17-replacement-target-column-pass` | pass | Section 17 replacement traceability covers every source requirement ID in the configured target column. |
| `l8e-section17-replacement-target-column-fail` | fail | Section 17 narrative and non-target-column mentions do not satisfy the configured target column. |
| `l8f-section4-decoy-none-fail` | fail | Decoy `None / N/A` table-cell text does not satisfy the explicit Section 4 paragraph branch. |
| `l8f-section15-decoy-rationale-fail` | fail | Decoy `N/A rationale` table-cell text does not satisfy the explicit Section 15 paragraph branch. |
| `l8f-r1-traceability-dual-decoy-fail` | fail | R1 traceability with Section 11 and Section 17 narrative/non-target-column decoys satisfies neither target-column branch. |
| `l8f-mixed-id-count-decoy-fail` | fail | CTRL/EVD-family decoys do not prevent a prefix-filtered REQ max-count failure. |

## False-Acceptance Negative Coverage

BEL-1120 adds the L8-F false-acceptance consolidation fixtures:

| Fixture | Expected diagnostic proof |
| --- | --- |
| `l8f-section4-decoy-none-fail` | `profile.validation.noAlternativeMatched` at the grouped rule, with nested `profile.validation.assertionFailed` for missing Section 4 `ID` column and `profile.validation.emptySelection` for the absent authorized paragraph branch. |
| `l8f-section15-decoy-rationale-fail` | `profile.validation.noAlternativeMatched` at the grouped rule, with nested `profile.validation.assertionFailed` for missing Section 15 `Requirement` column and `profile.validation.emptySelection` for the absent authorized paragraph branch. |
| `l8f-r1-traceability-dual-decoy-fail` | `profile.validation.noAlternativeMatched` at the grouped rule, with nested `profile.validation.tableColumnCoverageIdMissing` diagnostics for both Section 11 and Section 17 target columns. |
| `l8f-mixed-id-count-decoy-fail` | `profile.validation.idCountTooHigh` proves non-REQ ID-family decoys do not alter prefix-filtered REQ count enforcement. |

The L8-F cases are intentionally negative. If any of these documents validated
successfully, the result would be a downstream false acceptance and a blocker
for release-readiness work. The downstream command passed with all L8-F cases
failing as expected.

## Command Results

Commands were run from `.worktrees/BEL-1120` on 2026-06-02.

```text
npm run test:validation:downstream
PASS tests/declarative-validation-downstream.test.ts (24 tests)
Test Files  1 passed (1)
Tests  24 passed (24)
```

```text
npm run test:validation:examples
PASS tests/declarative-validation-examples.test.ts (6 tests)
Test Files  1 passed (1)
Tests  6 passed (6)
```

## Downstream Owner Notes

The downstream exercise now covers Section 4 table-or-none, Section 15
table-or-N/A, R1 standard-or-replacement traceability, mixed ID-family counts,
Section 11 target-column coverage, Section 17 replacement target-column
coverage, and L8-F false-acceptance consolidation.

The L8-F cases specifically guard against decoy text in non-authorized
locations and decoy IDs from unrelated families. The expected failure
diagnostics are documented in the harness and were verified by
`npm run test:validation:downstream`.

This evidence is ready as MS-4 downstream proof input. It does not claim MS-4
approval, release readiness, rollback approval, changelog completion, handoff
completion, package publication readiness, or EVD-9 completion.

## Review Boundary

Review this evidence for BEL-1120 downstream exercise completeness, fixture
inventory accuracy, expected pass/fail accuracy, L8-F false-acceptance negative
coverage, command output accuracy, and downstream owner note clarity.

Release verification, rollback, changelog, handoff, tag or publication
readiness, EVD-9, and MS-4 approval are out of scope for this BEL-1120
evidence record.
