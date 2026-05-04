# WP-2 EVD-2: Target And Source Fixture Evidence

Date: 2026-05-04
Issue: BEL-947
Parent issue: BEL-938
Work package: 1.0 Rich IR WP-2C
Validation: VAL-2, VAL-6
Branch: `codex/bel-947-wp-2c-target-source-evidence`

## Objective

Close the WP-2 target/source evidence gate by recording durable fixture evidence
for deterministic node targets, node paths, source ranges, source slices, and
unsupported-offset omissions.

## Context / Constraints

BEL-945 / WP-2A merged in PR #25 on 2026-05-04 and landed the production
target/source substrate on `origin/main` at
`54c28f43db15701ed1d704da446d9e1412e51f14`.

BEL-946 remains conditional. WP-2A did not activate parser/frontmatter offset
plumbing work, and this evidence pass did not find a concrete offset gap that
requires source changes under `src/parser/**` or `src/frontmatter/**`.

This evidence stays inside BEL-947 scope. It does not implement WP-3 query
helper breadth, WP-4 annotation behavior, WP-5 compatibility or migration docs,
or any public API shape change.

## Materially Verifiable Success Criteria

- [x] `npm run test:rich-ir:targets` passes and exercises the representative
      target/source fixture through the production-like
      `parse -> normalize` flow.
- [x] Ten repeated evidence runs prove target IDs, node paths, source ranges,
      and source slices are stable for identical Markdown input and options.
- [x] Missing or unsupported source offsets are covered by deterministic
      omission evidence instead of guessed source text.
- [x] Snapshot evidence records fixture coverage, observed behavior,
      limitations, and dependency status.

## Snapshot Artifact

Target/source evidence snapshot:

- `snapshots/rich-ir/wp-2-target-source-fixtures.json`

The snapshot records:

- document target and source range for `fixtures/rich-ir/proving.md`
- representative heading, paragraph, link, table, nested task-list item, code,
  and raw HTML node targets
- node path, node type, source range, recovered source text, and
  `documentQueries.sourceSlice` result for each representative target
- deterministic target IDs and node paths when `preserveSourceLocations` is
  disabled
- deterministic source-slice omission for out-of-bounds offsets and ranges that
  lack offsets

## Validation Record

Run from `.worktrees/BEL-938-wp-2c-target-source-evidence` on 2026-05-04:

```sh
npm run build && npx vitest run tests/rich-ir-targets.test.ts -u "--exclude=.worktrees/**"
npm run test:rich-ir:targets
npm run test:rich-ir:proving
npm run typecheck
git diff --check
npm test
```

Observed result:

- snapshot update command: pass, 1 snapshot updated
- `npm run test:rich-ir:targets`: pass, 1 file and 4 tests
- `npm run test:rich-ir:proving`: pass, 1 file and 3 tests
- `npm run typecheck`: pass
- `git diff --check`: pass
- `npm test`: pass, 11 files and 56 tests

## Dependency Status

- BEL-945: complete and merged.
- BEL-946: not activated. No parser/frontmatter offset-plumbing change is
  required by this evidence pass.
- BEL-947: ready for review after final cleanup and consensus review.

## Boundary Notes

No production source file changed in this evidence closure. The target/source
behavior remains implemented by the landed WP-2A substrate. Unsupported offsets
preserve deterministic targets and source ranges while omitting source slices;
the evidence deliberately does not reconstruct or guess missing source text.
