# BEL-961 Release Audit Group 3: Rich IR Target And Source Substrate

Date: 2026-05-07 08:59 CDT / 2026-05-07 13:59 UTC
Issue: BEL-961
Parent audit: BEL-956
Baseline: `origin/main` at `0b5f566`
Worktree: `.worktrees/BEL-961-release-audit-group-3`

## Current Status

This is a dated BEL-956 release-audit record. The `0.1.0` package,
`1.0.0-draft` document lane, and release-withhold statements below describe the
2026-05-07 audit baseline. As of the current repository state, package metadata
is `@jasonbelmonti/markdown-engine@2.0.0` and the current public document
contract uses `documentVersion: "1.0.0"`.

## Scope

This audit verifies the 1.0 draft rich IR target/source substrate before any 1.0
tag or npm publication. The owned surface is target IDs, node paths, source
ranges, source slices, source-slice absence behavior, and the corresponding
public contract documentation.

This audit does not authorize a tag, npm publication, version promotion from
`"1.0.0-draft"` to `"1.0.0"`, or any release-completion claim.

## Conclusion

No BEL-961 release blocker was found. The current implementation produces
deterministic node targets for identical Markdown input, parser behavior,
normalization options, package version, and runtime version; omits ranges and
slices when `preserveSourceLocations: false`; and only produces source slices
when parser offsets are present, integer, ordered, non-negative, and contained
within the source text.

The audit closed one coverage/documentation gap: focused tests now assert that
non-integer and reversed offsets do not synthesize source slices, and the public
API contract states the exact source-slice offset requirements.

Release publication remains outside this audit's authority and still withheld
under BEL-944/BEL-956. The package remains
`@jasonbelmonti/markdown-engine@0.1.0`.

## Audit Results

- PASS: Draft targets are deterministic from structural path and node type.
  `targetFor()` emits `node:<path-or-root>:<nodeType>`, clones the structural
  path, and clones source ranges instead of reusing caller/parser objects
  (`src/ir/document-targets.ts:33-49`). `withNodeMetadata()` applies the rule
  recursively with zero-based child indexes (`src/ir/document-targets.ts:14-30`).
- PASS: The document-level target uses the same deterministic target path.
  `buildDraftDocumentViews()` assigns `targetFor("document", [], ...)`, so the
  root target ID is `node:root:document` (`src/ir/document-derived-views.ts:13-35`).
- PASS: Section targets remain deterministic derivatives of heading targets.
  `buildSections()` derives section target IDs as `section:<heading-target-id>`
  and preserves the owning `headingTarget` for query/source-slice resolution
  (`src/ir/document-sections.ts:18-57`, `src/ir/document-sections.ts:68-88`).
- PASS: The 1.0 draft target/source substrate is only built for the 1.0 draft
  document lane. `normalizeParsedMarkdown()` calls `buildDraftDocumentViews()`
  only when `version === "1.0.0-draft"` (`src/ir/document.ts:8-39`).
- PASS: `preserveSourceLocations: false` removes normalized source ranges before
  draft metadata is built, while target IDs still derive from path and type
  (`src/ir/document.ts:12-35`, `src/ir/document-targets.ts:33-49`).
- PASS: Source slices are produced only after strict offset validation.
  `sourceOffsetBounds()` rejects missing, non-number, non-integer, negative,
  reversed, and out-of-bounds offsets (`src/ir/source-ranges.ts:15-35`).
  `sourceSliceForRange()` returns `undefined` when source locations are disabled,
  the range is absent, or offset validation fails; otherwise it slices the
  original Markdown source by validated offsets (`src/ir/document-targets.ts:59-77`).
- PASS: Query behavior does not reconstruct or guess source text.
  `documentQueries.sourceSlice()` returns the precomputed node source slice by
  target ID and returns `undefined` when no node source exists
  (`src/api/document-queries.ts:145-164`).
- PASS: Existing target/source tests cover repeated deterministic snapshots,
  representative heading/paragraph/link/table/list/code/html targets, cloned
  ranges, document-level target, nested paths, `preserveSourceLocations: false`,
  missing offsets, and out-of-bounds offsets
  (`tests/rich-ir-targets.test.ts:81-192`, `tests/rich-ir-targets.test.ts:254-288`).
- PASS: BEL-961 added focused coverage for the audit gap. Non-integer and
  reversed offsets retain deterministic targets and source ranges but expose no
  source slice through either `node.source` or `documentQueries.sourceSlice()`
  (`tests/rich-ir-targets.test.ts:194-232`,
  `tests/rich-ir-targets.test.ts:330-357`).
- PASS: Contract docs state the target stability limits and source-slice absence
  behavior. The public API contract states that target IDs are deterministic
  only for identical Markdown input, parser behavior, normalization options,
  package version, and runtime version, and are not stable across arbitrary
  edits, parser upgrades, or final 1.0 contract promotion
  (`docs/contracts/api.md:339-343`). It now states that source slices require
  present, integer, ordered, non-negative, in-bounds offsets and return
  `undefined` instead of guessing when offsets are absent, non-integer, reversed,
  negative, unsupported, or out of bounds (`docs/contracts/api.md:345-348`,
  `docs/contracts/api.md:391-395`).

## Validation Results

- Execution estimation: pass. `schemaVersion` was `execution-estimation.v5`;
  mode was `proposal`; blast radius was medium with score 4; action was
  `proceed-with-controls`; decomposition was not recommended.
- `git fetch --all --prune`: pass.
- `git worktree add .worktrees/BEL-961-release-audit-group-3 -b codex/bel-961-release-audit-group-3 origin/main`:
  pass; worktree baseline is `0b5f566`.
- `npm run test:rich-ir:targets`: pass, 1 file and 5 tests.
- `npm run docs:rich-ir-contract`: pass.
- `npm run typecheck`: pass.
- `git diff --check HEAD --`: pass.
- `git diff --no-index --check /dev/null docs/evidence/bel-961-release-audit-group-3.md`:
  pass.

`npm test` and `npm run release:verify` were not run because this audit changed
only focused tests, contract wording, and evidence. No production source,
snapshot, package metadata, or public runtime contract behavior changed.

## Success Criteria Status

- [x] Document and node targets are deterministic for identical Markdown input,
  parser behavior, normalization options, package version, and runtime version.
- [x] Source slices are produced only when offsets are present, integer,
  ordered, and contained within the source text.
- [x] `preserveSourceLocations: false` removes ranges/slices without removing
  deterministic target IDs from the 1.0 draft path.
- [x] Contract docs clearly state target stability limits and source-slice
  absence behavior.

## Required Next Decisions

No BEL-961 target/source blocker requires a production source change. Before any
1.0 tag or npm publication, BEL-956/BEL-944 must still explicitly authorize
release versioning, package publication, and final release-candidate validation.
