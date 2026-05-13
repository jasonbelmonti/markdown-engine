# WP-4 EVD-4: Declarative Validation Assertion Semantics

Date: 2026-05-13
Issue: BEL-1002
Parent issue: BEL-980
Work package: Declarative Validation WP-4D
Branch: `codex/bel-1002-diagnostic-suite-fixtures-evidence`

## Scope

This evidence records the WP-4 assertion semantics after the BEL-999,
BEL-1000, BEL-1001, and BEL-1024 implementation slices landed. BEL-1002 does
not add new assertion vocabulary; it activates the diagnostics gate and records
the assertion behavior that must remain stable for MS-2 review.

## Assertion Semantics Covered

- `sectionsRequired` evaluates required headings against the normalized section
  tree and supports `order: strict` as ordered subsequence matching in source
  order.
- `text` evaluates normalized selected text with `contains` and `excludes`
  predicates.
- `textOccurrenceCount` counts exact non-overlapping occurrences per selected
  target.
- `frontmatterRequired` evaluates required fields against object frontmatter and
  reports missing fields for absent, empty, or non-object frontmatter.
- `tableColumnsRequired` evaluates required columns against normalized table
  header cells.
- `ids` enforces unique normalized ID tokens with optional prefix and
  case-sensitivity policy.
- `references` compares source IDs against required target sections while
  preventing source-definition rows from satisfying themselves.

## Known Non-Goals

- The engine does not interpret operational-design-spec, AGENTS.md, TASK.md, or
  downstream profile semantics.
- Declarative profiles remain inert data. The engine does not execute
  JavaScript, expressions, plugins, imports, network calls, LLM calls, file
  watchers, persistence, or user-supplied regular expressions.
- Missing source evidence does not block validation, but diagnostics must omit
  `sourceRange` rather than fabricate locations.
- Public CLI, evidence-hash, contract-doc, repeatability, and boundary-audit
  closeout remain WP-5 scope.

## Validation Record

Focused commands for BEL-1002:

```sh
npm run test:validation:assertions
npm run test:validation:diagnostics
```

Observed result:

- `npm run test:validation:assertions`: pass, 1 file and 94 tests.
- `npm run test:validation:diagnostics`: pass, 1 file and 3 tests.
- `npm run typecheck`: pass.
- `npm test`: pass, 25 files and 293 tests.
- `node scripts/check-boundaries.mjs`: pass, 0 forbidden dependency matches
  and 0 annotation semantic leakage matches.

`test:validation:diagnostics` is now a real Vitest gate over
`tests/declarative-validation-diagnostics.test.ts` instead of
`scripts/gate-placeholder.mjs`.

## Evidence Artifacts

- `tests/declarative-validation-assertions.test.ts`
- `tests/declarative-validation-diagnostics.test.ts`
- `fixtures/declarative-validation/assertions/diagnostics.md`
- `fixtures/declarative-validation/assertions/diagnostics-profile.yaml`
