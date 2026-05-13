# WP-4 EVD-5: Declarative Validation Diagnostic Targeting

Date: 2026-05-13
Issue: BEL-1002
Parent issue: BEL-980
Work package: Declarative Validation WP-4D
Branch: `codex/bel-1002-diagnostic-suite-fixtures-evidence`

## Scope

This evidence records the WP-4 diagnostic targeting policy for declarative
validation assertions. Diagnostics are deterministic, source-targeted when the
selected engine target has source evidence, and source-less when no reliable
range is available.

## Source-Targeting Policy

- Source-targeted assertion diagnostics use the nearest selected target or
  assertion-owned token source evidence.
- Empty-selection diagnostics do not include `sourceRange` because no document
  target matched the selector.
- Missing table-column diagnostics use table source evidence when present.
- Duplicate-ID diagnostics use the duplicate occurrence source range when
  available.
- Missing-reference diagnostics use source ID evidence when available.
- Section text diagnostics use section source evidence when available.
- Unavailable-source cases omit `sourceRange`; the engine does not guess a line
  or column.

## Deterministic Ordering Policy

Rule results are sorted by `ruleId`. Assertion diagnostics are sorted by rule
ID, assertion index, available source range, source-less target order,
diagnostic code, message, severity, target order, and diagnostic order. This
keeps source-targeted diagnostics stable while preserving declared order for
source-less diagnostics that otherwise compare equally.

## Validation Record

Focused command:

```sh
npm run test:validation:diagnostics
```

Observed result: pass, 1 file and 3 tests. Follow-up verification also passed
`npm run typecheck`, `npm test` with 25 files and 293 tests, and
`node scripts/check-boundaries.mjs`.

The fixture-backed diagnostic gate covers:

- source-targeted section text diagnostics
- unavailable-source fallback behavior
- empty-selection diagnostics
- duplicate-ID diagnostics
- missing-reference diagnostics
- missing-column diagnostics
- deterministic result and evidence diagnostic ordering

## Evidence Artifacts

- `tests/declarative-validation-diagnostics.test.ts`
- `fixtures/declarative-validation/assertions/diagnostics.md`
- `fixtures/declarative-validation/assertions/diagnostics-profile.yaml`
