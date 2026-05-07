# BEL-962 Release Audit Group 4: Structural Views And Query Helpers

Date: 2026-05-07 10:15 CDT / 2026-05-07 15:15 UTC
Issue: BEL-962
Parent audit: BEL-956
Baseline: `origin/main` at `340fa6ed85a9`
Worktree: `.worktrees/BEL-962-release-audit-group-4`

## Scope

This audit verifies the 1.0 draft rich IR structural views and public query
helpers before any 1.0 tag or npm publication. The owned surface is sections,
text spans, tables, lists, links, recursive node queries, source-slice lookup,
fixture coverage, snapshot evidence, and the matching public API contract.

This audit does not authorize a tag, npm publication, package-version change,
promotion from `"1.0.0-draft"` to `"1.0.0"`, target ID format changes,
annotation payload semantics, domain-specific interpretation, or raw parser AST
exposure.

## Conclusion

No BEL-962 release blocker was found. The current implementation exposes
domain-neutral structural views from engine-owned `EngineDocument` nodes,
targets, and source metadata. Public query helpers operate over the public rich
IR document shape and do not require consumers to import parser AST types or
internal traversal modules.

The audit closed one evidence gap: focused tests and the durable WP-3 snapshot
now explicitly cover additional target ID and exact text query filters across
sections, text spans, tables, lists, and links.

Release publication remains outside this audit's authority and still withheld
under BEL-944/BEL-956. The package remains
`@jasonbelmonti/markdown-engine@0.1.0`.

## Audit Results

- PASS: Heading-derived sections model hierarchy and body ownership from the
  ordered public node stream. `buildSections()` maintains a heading-depth stack,
  assigns parent/child section targets, records immediate section body targets,
  and derives section target IDs from owning heading targets
  (`src/ir/document-sections.ts:18-57`, `src/ir/document-sections.ts:68-88`).
- PASS: Section source-slice behavior is target-addressed and bounded by public
  source metadata. `documentQueries.sourceSlice()` maps section targets to their
  owning heading targets, then returns the precomputed node source slice or
  `undefined` without reconstructing source text
  (`src/api/document-queries.ts:145-164`).
- PASS: Text span, table, list, and link views match the public field contract.
  Collectors emit targets plus normalized public fields only: text spans expose
  target/text/range; table cells expose text, zero-based row/column coordinates,
  header state, and range; list items expose zero-based item index, zero-based
  depth, checked state, and range; links expose URL, text, title, and range
  (`src/ir/document-text-spans.ts:4-22`,
  `src/ir/document-table-views.ts:9-41`,
  `src/ir/document-list-views.ts:8-50`,
  `src/ir/document-link-views.ts:4-28`).
- PASS: Query helpers expose deterministic public filters for nodes, sections,
  text spans, tables, lists, and links. The implementation filters by target ID,
  node type, heading target ID, parent section target ID, title, depth, exact
  text, included text, ordered state, item depth, URL, and link text over public
  document fields (`src/api/document-queries.ts:31-143`).
- PASS: The public API contract documents the structural view fields and query
  helper filter surface, including section hierarchy fields, table coordinate
  semantics, list item coordinate semantics, link fields, and source-slice
  absence behavior (`docs/contracts/api.md:352-395`).
- PASS: Existing fixture and snapshot evidence covers nested headings, table
  cells, nested task lists, inline links, source slices, and deterministic result
  ordering. The fixture is `fixtures/rich-ir/queries.md`; the durable snapshot
  is `snapshots/rich-ir/wp-3-derived-view-query-fixtures.json`.
- PASS: BEL-962 added focused coverage for the audit gap. Tests now assert exact
  text plus target ID filtering for text spans, target ID plus item-depth
  filtering for nested lists, and target ID plus text filtering for links
  (`tests/rich-ir-queries.test.ts:94-122`,
  `tests/rich-ir-queries.test.ts:160-193`). Snapshot evidence now records
  section, text-span, table, list, and link target-filter query results
  (`tests/rich-ir-queries.test.ts:255-284`).
- PASS: No query helper requires consumers to depend on raw parser AST or
  internal traversal modules. The package root exports `documentQueries`; the
  public API contract marks raw mdast/unified parser AST nodes and raw parser
  `position` fields as internal-only. Internal traversal remains an implementation
  detail behind `src/api/document-queries.ts`.

## Validation Results

- Execution estimation: pass. `schemaVersion` was `execution-estimation.v5`;
  mode was `proposal`; blast radius was medium with score 4; action was
  `proceed-with-controls`; decomposition was not recommended.
- `git fetch --all --prune`: pass.
- `git worktree add .worktrees/BEL-962-release-audit-group-4 -b codex/bel-962-release-audit-group-4 origin/main`:
  pass; worktree baseline is `340fa6ed85a9`.
- Baseline `npm run test:rich-ir:queries`: pass, 1 file and 3 tests.
- `npx vitest run tests/rich-ir-queries.test.ts -u "--exclude=.worktrees/**"`:
  pass, 1 file and 3 tests, 1 snapshot updated.
- `npm run test:rich-ir:queries`: pass, 1 file and 3 tests.
- `npm run docs:rich-ir-contract`: pass.
- `npm run typecheck`: pass.
- `git diff --check HEAD --`: pass.
- `git diff --no-index --check /dev/null docs/evidence/bel-962-release-audit-group-4.md`
  with expected no-index diff status handling: pass, no whitespace output.

`npm test` and `npm run release:verify` were not run because this audit changed
only focused query tests, one derived-view query snapshot, and evidence. No
production source, package metadata, release script, or public runtime behavior
changed.

## Success Criteria Status

- [x] Heading-derived sections correctly model parent/child hierarchy, depth,
  title, body target membership, and source-slice behavior.
- [x] Text spans, table cells, list items, and link views match the documented
  public field contract and deterministic ordering.
- [x] Query filters return predictable results by target ID, node type, title,
  depth, text, URL, ordered state, and item depth.
- [x] No query helper requires consumers to depend on raw parser AST or internal
  traversal modules.

## Required Next Decisions

No BEL-962 structural-view or query-helper blocker requires a production source
change. Before any 1.0 tag or npm publication, BEL-956/BEL-944 must still
explicitly authorize release versioning, package publication, and final release
candidate validation.
