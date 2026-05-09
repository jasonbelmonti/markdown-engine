# BEL-978: Declarative Validation DEP-2 Rich IR Substrate Verification

Date: 2026-05-08 20:51 CDT
Issue: BEL-978
Baseline: `origin/main` at `36a6fd0e257299cda52f44050aa5803bbd23498f`
Branch: `codex/bel-978-rich-ir-substrate-verification`
Scope: DEP-2 verification evidence only

## Objective

Verify that the final 1.0 rich IR public contract and query helpers are
sufficient for declarative validation selector and assertion work before
BEL-979 / WP-3 starts.

## Context / Constraints

The declarative validation execution specification defines DEP-2 as the
requirement that the 1.0 rich IR public contract and query helpers be available
on the implementation branch before full selector/assertion work begins.

This pass is evidence-only. It does not change `src/ir/**`,
`src/api/document-queries.ts`, public contract docs, package metadata, tests, or
runtime behavior.

## Materially Verifiable Success Criteria

- [x] `npm run test:rich-ir:contract` passes from the implementation branch
      baseline.
- [x] `docs/contracts/api.md` and rich IR evidence confirm sections, tables,
      text spans, lists, links, source slices, annotation targets,
      `documentQueries`, compatibility, and repeatability evidence are
      available.
- [x] No substrate gap was found that blocks BEL-979 / WP-3 or requires a
      `DEV-*` deviation before selector and assertion work starts.

## Validation Record

Run from `.worktrees/BEL-978-declarative-validation-dep-2-rich-ir-substrate-verification`
on 2026-05-08:

```sh
npm run test:rich-ir:contract
```

Observed result:

- `npm run build`: pass.
- `tsc -p tsconfig.document-contract.json`: pass.
- `vitest run tests/document-contract.test.ts "--exclude=.worktrees/**"`:
  pass, 1 file and 3 tests.

The focused contract test verifies the required rich IR implementation-lane
command registry, the 1.0 document/target/query/annotation/compatibility public
types, and the absence of raw parser, downstream runtime, and `richIr` labels
from public contract modules.

## Inspection Record

Reviewed sources:

- `docs/execution/markdown-engine-declarative-validation-syntax-execution-spec.md`
- `docs/contracts/api.md`
- `src/api/document.ts`
- `src/api/document-queries.ts`
- `src/api/contracts.ts`
- `tests/document-contract.test.ts`
- `docs/evidence/wp-2-evd-2-target-source-fixtures.md`
- `docs/evidence/wp-3-evd-3-derived-view-query-fixtures.md`
- `docs/evidence/wp-4-evd-4-annotation-target-validation.md`
- `docs/evidence/wp-5-evd-5-repeatability.md`
- `docs/evidence/wp-5-evd-6-rich-ir-contract.md`
- `docs/evidence/wp-5-evd-8-compatibility-cli-impact.md`
- `docs/evidence/wp-6-evd-9-downstream-exercise.md`
- `docs/evidence/wp-6-evd-10-release-readiness.md`

Capability review:

| Capability | Verification |
| --- | --- |
| 1.0 document selector | `docs/contracts/api.md` documents `normalize(..., { documentVersion: "1.0.0" })`; package version is `1.0.0`; release readiness records the BEL-965 final cutover. |
| Targets and source slices | `EngineNodeTarget`, node `source`, `sourceRange`, and `documentQueries.sourceSlice` are public; WP-2 evidence records deterministic targets, paths, source ranges, source slices, and omission behavior for unsupported offsets. |
| Sections | `EngineSection` and `documentQueries.sections` are public; WP-3 and downstream evidence prove nested section lookup and section body target ownership. |
| Text spans | `EngineTextSpan` and `documentQueries.textSpans` are public; WP-3 and downstream evidence prove text-span filtering and source-grounded paragraph lookup. |
| Tables | `EngineTable` and flattened `EngineTableCell` coordinates are public; WP-3 evidence records zero-based row and column behavior with header row index `0`. |
| Lists | `EngineList`, `EngineListItem`, and `documentQueries.lists` are public; WP-3 evidence records zero-based item indexes, nesting depth, ordered state, and checked state. |
| Links | `EngineLink` and `documentQueries.links` are public; WP-3 evidence records URL/text filtering and link source-slice lookup. |
| Annotation targets | `EngineAnnotationTarget` supports node and source addressing; `validateAnnotations` is public; WP-4 evidence records valid, malformed, hostile, unknown, out-of-bounds, and deterministic diagnostic behavior. |
| Query helpers | `documentQueries` exposes `nodes`, `sections`, `textSpans`, `tables`, `lists`, `links`, and `sourceSlice`; helpers operate over public `EngineDocument` fields and do not expose raw parser traversal. |
| Compatibility | `compatibilityMode: "default"` gates 1.0 document-bearing results and `compatibilityMode: "legacy-0.1"` gates retained legacy results; compatibility / CLI impact evidence records the final 1.0 selector and explicit legacy selector. |
| Repeatability | WP-5 repeatability evidence records ten-run byte-for-byte repeatability for public rich IR documents, annotated documents, and annotation diagnostics; release readiness repeats the 10-run proof through `release:verify`. |

## DEP-2 Decision

DEP-2 is resolved for BEL-979 / WP-3.

The available rich IR substrate is sufficient for declarative validation
selector and assertion implementation to begin under the existing execution
specification. Selector work can depend on public `EngineDocument` fields and
`documentQueries` for sections, tables, text spans, lists, links, node targets,
and source slices. Assertion and diagnostic work can depend on public source
ranges and annotation target validation behavior, with the documented constraint
that source slices are unavailable when parser offsets are absent or unusable.

No blocker, public contract change, rich IR source edit, new dependency, release
operation, or `DEV-*` deviation is required before WP-3 starts.

## Boundary Notes

- Continue treating `src/ir/**` and `src/api/document-queries.ts` as read-only
  for declarative validation unless a future selector implementation finds a
  concrete substrate defect and records an approved deviation.
- Do not fabricate source ranges or source slices. `documentQueries.sourceSlice`
  intentionally returns `undefined` when offsets are missing, unsupported,
  invalid, or out of bounds.
- Do not treat target IDs as stable anchors across arbitrary Markdown edits.
  The contract promises deterministic IDs only for identical input, parser
  behavior, normalization options, package version, and runtime version.
- Historical rich IR evidence that mentions `1.0.0-draft` is superseded for
  DEP-2 by the current API contract, compatibility / CLI impact evidence, and
  release-readiness evidence recording the final `1.0.0` cutover.
