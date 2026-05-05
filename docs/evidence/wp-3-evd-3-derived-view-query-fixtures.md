# WP-3 EVD-3: Derived View And Query Fixture Evidence

Date: 2026-05-04
Issue: BEL-939
Work package: 1.0 Rich IR WP-3
Validation: VAL-3
Branch: `codex/bel-939-wp-3-structural-views-query-helpers`

## Objective

Implement deterministic structural views and public query helpers for sections,
text spans, tables, lists, links, nodes, and source slices so downstream
consumers can use engine-owned IR instead of raw parser traversal or line
scanners.

## Context / Constraints

BEL-939 depends on the WP-2 target/source substrate already present on `main`.
This work is limited to derived views, query helpers, fixtures, snapshots, and
WP-3 evidence. Annotation behavior remains deferred to WP-4, and compatibility
or migration documentation remains deferred to WP-5 except for the WP-3 query
helper semantics recorded in the public API contract.

Structural views are derived from public `EngineDocument` nodes, targets, and
source metadata. The implementation does not import parser/frontmatter
internals, rules/config modules, downstream scanner logic, SpecTrace/profile
runtime behavior, MCP/agent modules, network services, or persistence.

## Materially Verifiable Success Criteria

- [x] `npm run test:rich-ir:queries` passes with nested heading, text span,
      table, list, link, node, and source-slice fixture coverage.
- [x] Query helper results are deterministic across 10 repeated evidence runs.
- [x] Table cells use zero-based row and column coordinates; the header row is
      row index `0`, and body rows continue at `1`, `2`, and so on.
- [x] List items use zero-based `itemIndex` scoped to the immediate list
      container and zero-based `depth` by list nesting level.
- [x] Structural views are derived from public IR/target/source metadata and do
      not depend on parser internals directly.

## Fixture And Snapshot Artifacts

Fixture:

- `fixtures/rich-ir/queries.md`

Snapshot:

- `snapshots/rich-ir/wp-3-derived-view-query-fixtures.json`

The snapshot records:

- heading-derived section hierarchy with parent, child, and body target IDs
- text spans for headings, paragraphs, inline code, table cells, list text, and
  links
- table cell text, target IDs, source ranges, zero-based row indexes,
  zero-based column indexes, and header state
- list ordered state, optional start value, item target IDs, zero-based item
  indexes, zero-based nesting depth, checked state, and source ranges
- link text, URL, optional title, target IDs, and source ranges
- concrete query-helper results for nested section lookup, text-span filtering,
  ordered-list filtering, relative-link filtering, section source slice lookup,
  and link source slice lookup

## Validation Record

Run from `.worktrees/BEL-939-wp-3-structural-views-query-helpers` on
2026-05-04:

```sh
npm run typecheck
npm run build && npx vitest run tests/rich-ir-queries.test.ts -u "--exclude=.worktrees/**"
npm run test:rich-ir:queries
npm run test:rich-ir:proving
npm run test:rich-ir:targets
npm run test:rich-ir:contract
node scripts/check-boundaries.mjs
npm test
git diff --check
```

Observed result:

- `npm run typecheck`: pass
- snapshot update command: pass, 1 snapshot written
- `npm run test:rich-ir:queries`: pass, 1 file and 3 tests
- `npm run test:rich-ir:proving`: pass, 1 file and 3 tests
- `npm run test:rich-ir:targets`: pass, 1 file and 4 tests
- `npm run test:rich-ir:contract`: pass, 1 file and 3 tests
- `node scripts/check-boundaries.mjs`: pass, no forbidden dependency matches
- `npm test`: pass, 12 files and 59 tests
- `git diff --check`: pass

## Boundary Notes

The production implementation splits derived structural view collection by
owned responsibility:

- `src/ir/document-text-spans.ts` owns text span collection.
- `src/ir/document-table-views.ts` owns table cell coordinate extraction.
- `src/ir/document-list-views.ts` owns list item coordinate extraction.
- `src/ir/document-link-views.ts` owns link view extraction.
- `src/ir/document-node-walk.ts` owns deterministic traversal and text
  aggregation over engine-owned nodes.

`src/api/document-queries.ts` remains the public query-helper adapter over the
document contract. It filters existing public structural views and maps section
source-slice requests to the section heading target. It does not reconstruct or
guess source text when offsets are unavailable.
