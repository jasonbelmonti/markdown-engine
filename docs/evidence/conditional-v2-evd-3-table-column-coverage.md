# Conditional V2 EVD-3: Table Column Coverage

Issue: BEL-1097
Parent issue: BEL-1084
Branch: `codex/bel-1097-table-column-coverage-fixtures`
Worktree: `.worktrees/BEL-1097-table-column-coverage`
Date: 2026-05-22

## Scope

EVD-3 records targeted fixture coverage for `tableColumnCoverage` after the
BEL-1096 implementation package. The scope is limited to target-column-only
coverage proof, deterministic structural diagnostics, compiled-plan coverage,
and the MV-4 downstream command subset.

Grouped rules, `when`, release readiness, full downstream design-spec exercise
breadth, parser changes, rich IR changes, and whole-section fallback are out of
scope for this leaf.

## Fixture Coverage

The fixture suite is
`fixtures/declarative-validation/conditional-v2/table-column-coverage.yaml`.

| Fixture | Contract |
| --- | --- |
| `coverage-pass` | Passing coverage when every source ID appears in the configured target table column. |
| `wrong-target-column-fail` | Failing coverage when a source ID appears in an unrelated target-table column but not the configured target column. |
| `narrative-text-fail` | Failing coverage when a source ID appears in target-section narrative text but not the configured target column. |
| `missing-target-section` | Source-grounded diagnostic when the configured target section is absent. |
| `missing-target-column` | Source-grounded diagnostic when the configured target column is absent. |
| `source-less-missing-id` | Diagnostic omits source ranges instead of borrowing target ranges when source evidence is unavailable. |
| `later-duplicate-source-evidence` | Duplicate source ID handling keeps later source evidence when the first occurrence lacks a source range. |
| `case-insensitive-pass` | Source `caseSensitive: false` controls source/target ID comparison. |

## Compiled-Plan Coverage

`tests/declarative-validation-table-column-coverage-fixtures.test.ts` parses
each fixture profile, compiles it with `compileValidationProfile`, and verifies
the private compiled `tableColumnCoverage` assertion shape for every fixture
rule.

The compiled-plan checks cover:

- `source.section`, `source.column`, `source.prefix`, and
  `source.caseSensitive`.
- `target.section`, optional `target.tableHeader`, and `target.column`.
- `require: "everySourceId"`.
- Default source `caseSensitive: true` materialization.

## Diagnostics Notes

- `profile.validation.tableColumnCoverageIdMissing` is covered by
  `wrong-target-column-fail`, `narrative-text-fail`,
  `source-less-missing-id`, and `later-duplicate-source-evidence`.
- `profile.validation.tableColumnCoverageTargetSectionMissing` is covered by
  `missing-target-section`.
- `profile.validation.tableColumnCoverageTargetColumnMissing` is covered by
  `missing-target-column`.
- Diagnostics use source-ID evidence where available and omit source ranges
  when source evidence is unavailable.

## No Whole-Section Fallback Proof

`wrong-target-column-fail` places `REQ-2` in the target table's `Evidence`
column while the configured target column is `Requirement`. The fixture fails,
which proves unrelated columns do not satisfy coverage.

`narrative-text-fail` places `REQ-2` in narrative text inside the target
`Traceability` section while the configured target column omits it. The fixture
fails, which proves target-section text does not satisfy coverage.

The downstream MV-4 subset in `tests/declarative-validation-downstream.test.ts`
uses a v2 `tableColumnCoverage` profile and verifies both a passing target
column case and a false-acceptance failure where `ODS-REQ-2` appears in
target-section narrative text and an unrelated `Evidence` cell.

## Command Results

Commands were run from `.worktrees/BEL-1097-table-column-coverage`.

```text
npm run test:validation:compiler
PASS tests/declarative-validation-compiler.test.ts (35 tests)
Test Files  1 passed (1)
Tests  35 passed (35)
```

```text
npm run test:validation:selectors
PASS tests/declarative-validation-selectors.test.ts (7 tests)
Test Files  1 passed (1)
Tests  7 passed (7)
```

```text
npm run test:validation:assertions
PASS tests/declarative-validation-table-column-coverage-fixtures.test.ts (9 tests)
PASS tests/declarative-validation-assertions.test.ts (104 tests)
Test Files  2 passed (2)
Tests  113 passed (113)
```

```text
npm run test:validation:downstream
PASS tests/declarative-validation-downstream.test.ts (3 tests)
Test Files  1 passed (1)
Tests  3 passed (3)
```

## Downstream Owner Notes

The downstream command now includes only the MV-4 column-coverage subset needed
for BEL-1097. It does not attempt the full Conditional V2 downstream
design-spec exercise; that remains deferred to EVD-8 / MS-4.

This evidence is ready as MS-2 input alongside EVD-2. MS-2 approval remains a
project-owner and downstream-owner decision, not an automatic approval from
these command results alone.
