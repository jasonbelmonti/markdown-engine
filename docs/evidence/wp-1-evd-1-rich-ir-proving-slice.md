# WP-1 EVD-1: Rich IR Proving Slice

Issue: BEL-936
Work package: 1.0 Rich IR WP-1C
Evidence date: 2026-05-03
Branch: `codex/bel-936-wp-1c-annotation-serialization-evd`
Baseline: `origin/main` at `3937e59`

## Objective

Complete the MS-1 proving slice by demonstrating that the representative
fixture can carry 1.0 target/source/query behavior, caller-owned annotation
targets, deterministic serialization, and an explicit legacy compatibility
assertion without domain semantics entering `markdown-engine`.

## Context / Constraints

The representative fixture is
`fixtures/rich-ir/proving.md`. It includes frontmatter, nested headings,
paragraph text, a link, a GFM table, nested task list items, raw HTML, and a code
fence.

This evidence is scoped to MS-1 only. It does not start WP-2 target hardening,
broader derived-view coverage, migration documentation, downstream exercise, or
release containment. 1.0 tag, package publication, and release-completion claims
remain blocked until MS-3.

## Materially Verifiable Success Criteria

- [x] The representative fixture validates one annotation target and preserves
  opaque caller-owned annotation payload meaning.
- [x] Deterministic 1.0 serialization and a legacy compatibility assertion are
  covered by `npm run test:rich-ir:proving`.
- [x] `npm run test:rich-ir:contract` passes with no raw parser AST or forbidden
  domain/runtime exports in the public contract check.
- [x] This EVD-1 record documents target/source/query, annotation,
  serialization, and compatibility evidence for MS-1 review.

## Execution Notes

`tests/rich-ir-proving.test.ts` proves the target/source/query path landed in
BEL-935 and extends it with:

- `validateAnnotations(document, annotations)` accepting real node, section, and
  source-range targets from the fixture and returning annotation payloads
  unchanged.
- deterministic rejection of an unknown node target with
  `annotation.target.unknown`, a malformed node target with
  `annotation.target.invalidKind`, and an invalid source range with
  `annotation.target.invalidRange`.
- `serialize(annotatedDocument, { pretty: true })` producing identical output
  for repeated calls.
- an explicit legacy compatibility assertion through
  `normalize(parsed, { documentVersion: "0.0.0" })`, which keeps the legacy
  document shape free of 1.0 target, section, and annotation fields.

Public API naming remains in the engine/document vocabulary:
`validateAnnotations`, `documentQueries`, `EngineDocument`, `EngineTarget`, and
`serialize`. No public `RichIr*`, `richIr`, `queryRichIr`,
`serializeRichIr`, `validateRichIr*`, or `src/api/rich-ir.ts` surface was added.

## Validation Record

Run from the BEL-936 worktree on 2026-05-03:

```sh
npm run test:rich-ir:proving
npm run test:rich-ir:contract
```

Observed result: both commands passed. The proving test contains three
contract scenarios: target/source/derived views, annotation target validation,
and deterministic serialization plus explicit legacy compatibility.

## MS-1 Handoff

BEL-936 completes the remaining WP-1C evidence needed before the BEL-937 MS-1
gate can review the critical-path proof. If MS-1 rejects target identity,
source-slice behavior, annotation target handling, serialization shape, or
compatibility approach, downstream WP-2 through WP-5 implementation must remain
blocked until the issue is fixed or an approved deviation is recorded.
