# BEL-967 Release Audit Track: Source Safety

Date: 2026-05-07 12:35 CDT / 2026-05-07 17:35 UTC
Issue: BEL-967
Parent audit: BEL-956
Baseline: `origin/main` at `3db1a2c`
Worktree: `.worktrees/BEL-967-source-safety`
Package: `@jasonbelmonti/markdown-engine@0.1.0`

## Scope

This audit verifies that source ranges, source slices, diagnostics, and
annotation source targets remain safe, bounded, cloned where required, and never
guessed beyond parser or document evidence.

This audit does not authorize a `v1.0.0` tag, npm publication, package version
promotion, release-completion claim, or any release-publication decision.

## Conclusion

No BEL-967 source-safety release blocker was found. The current implementation
keeps source slices behind strict offset validation, returns `undefined` rather
than reconstructing or guessing source text, clones diagnostic and annotation
range data at public boundaries, and bounds annotation source targets only
against available document evidence.

No production source, public contract, or focused test change was required for
BEL-967. Release publication remains withheld under the parent release audit
and related release-decision blockers.

## Audit Results

- PASS: Source slices require validated offsets before reading source text.
  `sourceOffsetBounds()` rejects missing, non-number, non-integer, negative,
  reversed, and out-of-bounds offsets before returning slice bounds
  (`src/ir/source-ranges.ts:15-35`). `sourceSliceForRange()` returns
  `undefined` when source locations are disabled, the range is absent, or
  offset validation fails; only validated offsets are passed to
  `String.prototype.slice()` (`src/ir/document-targets.ts:59-77`).
- PASS: Public source-slice queries do not reconstruct source text.
  `documentQueries.sourceSlice()` maps section targets to the owning heading
  target, then returns the precomputed node source slice by target ID; if no
  node source exists it returns `undefined` (`src/api/document-queries.ts:145-164`).
- PASS: Source-slice absence behavior is covered for unsafe offset classes.
  Focused tests assert that missing offsets, out-of-bounds offsets, non-integer
  offsets, and reversed offsets keep deterministic targets and source ranges
  but expose no `node.source` and no query source slice
  (`tests/rich-ir-targets.test.ts:159-232`,
  `tests/rich-ir-targets.test.ts:291-357`).
- PASS: Parser and frontmatter source-position evidence remains bounded by the
  available parser/YAML offsets. Markdown body positions are converted only when
  parser line and column data exist (`src/parser/engine-document.ts:237-279`).
  YAML diagnostic offsets are clamped to the raw frontmatter string and ordered
  with `Math.max(startOffset, endOffset)` before mapping back to Markdown source
  positions (`src/frontmatter/yaml-diagnostics.ts:112-185`).
- PASS: Rule diagnostics only carry source ranges available on normalized
  engine nodes and omit them where no safe source location exists. Code fence,
  link, and raw HTML rule diagnostics conditionally copy `node.sourceRange`
  through `makeDiagnostic()` (`src/rules/code-fence-languages.ts:42-58`,
  `src/rules/links-allowed-schemes.ts:41-47`,
  `src/rules/raw-html-policy.ts:20-34`). `makeDiagnostic()` and
  `cloneDiagnostics()` clone diagnostic source ranges (`src/diagnostics/index.ts:3-27`,
  `src/diagnostics/index.ts:35-39`).
- PASS: Annotation source bounds are validated only against available document
  evidence. `annotationTargetDiagnostics()` clones `document.sourceRange` when
  present and leaves bounds unavailable when absent
  (`src/api/annotation-target-validation.ts:39-60`). Source and node annotation
  target diagnostics reject malformed ranges, reversed line/column ranges,
  reversed offsets when both offsets are present, and ranges proven outside the
  cloned document source range (`src/api/annotation-target-validation.ts:169-267`,
  `src/api/annotation-target-validation.ts:623-675`).
- PASS: Annotation diagnostics and accepted targets are cloned and sorted
  deterministically. Diagnostics sort by optional source range, code, message,
  normalized target key, and original input order
  (`src/api/annotation-target-validation.ts:283-351`). Known annotation targets,
  node targets, source ranges, and source positions are cloned through known
  fields only, with extra fields stripped and invalid or unavailable optional
  fields rejected (`src/api/annotation-target-validation.ts:426-599`).
- PASS: Annotation coverage exercises deterministic ordering, clone isolation,
  partial offset bounds, optional node target source ranges, unsafe extra source
  fields, proxy-backed range data, and same-position diagnostics with offsets
  before diagnostics without offsets (`tests/rich-ir-annotations.test.ts:24-76`,
  `tests/rich-ir-annotations.test.ts:78-207`,
  `tests/rich-ir-annotations.test.ts:210-360`,
  `tests/rich-ir-annotations.test.ts:421-450`,
  `tests/rich-ir-annotations.test.ts:760-880`).
- PASS: Contract docs state source-slice and annotation-bound limits. The API
  contract says source slices require present, integer, ordered, non-negative,
  in-bounds offsets and that `sourceSlice()` returns `undefined` instead of
  guessing when offsets are absent, non-integer, reversed, negative,
  unsupported, or out of bounds (`docs/contracts/api.md:345-348`,
  `docs/contracts/api.md:391-395`). It also states that annotation bounds cannot
  be proven when `document.sourceRange` is absent and no document range is
  synthesized (`docs/contracts/api.md:419-427`).
- PASS: Source text and raw HTML remain inert local strings. Raw HTML policy
  docs state no execution, rendering, sanitization, fetching, or evaluation
  (`docs/contracts/api.md:177-189`), and the non-goals section excludes network
  services, persistence, rendering, sanitization, fetching, and raw HTML
  execution (`docs/contracts/api.md:492-505`). Parser text extraction copies
  string values into engine-owned text fields without rendering
  (`src/parser/engine-document.ts:196-222`), and the boundary audit reports 0
  forbidden dependency matches and 0 annotation semantic leakage matches.
- PASS: Completed dependency evidence aligns with this source-safety audit.
  BEL-959 records parser/frontmatter source-position correctness and raw HTML
  inertness. BEL-961 records target/source-slice strict offset gating. BEL-963
  records diagnostics cloning and located/unlocated rule diagnostic behavior.
  BEL-964 records annotation target validation, cloning, deterministic ordering,
  and containment. BEL-968 records deterministic local package boundary
  containment.

## Validation Results

- Execution estimation: pass. `schemaVersion` was `execution-estimation.v5`;
  mode was `proposal`; blast radius score was 0 and level was low;
  `execution.action` was `proceed`; adjusted story points were 5; decomposition
  was not recommended.
- `git fetch origin`: pass.
- `git worktree add .worktrees/BEL-967-source-safety -b codex/bel-967-source-safety origin/main`:
  pass; worktree baseline is `3db1a2c`.
- `npm run test:rich-ir:targets`: pass, 1 file and 5 tests.
- `npm run test:rich-ir:annotations`: pass, 1 file and 15 tests.
- `npm run test:rich-ir:queries`: pass, 1 file and 3 tests.
- `npm run typecheck`: pass.
- `npm run docs:rich-ir-contract`: pass; checked `docs/contracts/api.md`,
  `README.md`, `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md`,
  `docs/evidence/wp-5-evd-6-rich-ir-contract.md`, and
  `docs/evidence/wp-5-evd-8-compatibility-cli-impact.md`.
- `npm run audit:rich-ir-boundary`: pass; output included 8 direct dependencies
  scanned, 0 forbidden dependency matches, and 0 annotation semantic leakage
  matches.
- `git diff --check HEAD --`: pass.
- `git diff --check --no-index -- /dev/null docs/evidence/bel-967-release-audit-source-safety.md`:
  pass with expected no-index difference status and no whitespace findings.

`npm test` was not run because BEL-967 made no production source change.
`npm run release:verify` was not run because this audit does not authorize a
release action and its clean-diff gate rejects uncommitted evidence.

## Success Criteria Status

- [x] Missing, partial, reversed, non-integer, and out-of-bounds offsets are
  handled without unsafe source-slice synthesis.
- [x] Diagnostic ranges and annotation ranges are cloned, ordered, and bounded
  consistently.
- [x] Source text and raw HTML remain inert local data with no execution,
  rendering, fetching, sanitization, persistence, or network behavior.
- [x] Contract docs state when `sourceSlice` returns `undefined` and when
  annotation bounds cannot be proven.

## Required Next Decisions

No BEL-967 source-safety blocker requires a production source change. Before any
1.0 tag or npm publication, BEL-956 and the related release-decision blockers
must still explicitly authorize release versioning, package publication, and
final release-candidate validation.
