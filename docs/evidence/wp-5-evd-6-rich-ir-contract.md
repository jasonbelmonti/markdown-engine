# WP-5 EVD-6: Rich IR Contract Documentation Gate

Date: 2026-05-06
Issue: BEL-950
Work package: BEL-941 Slice 3 / WP-5
Validation: VAL-7 / EVD-6

## Scope

This evidence records the BEL-950 contract-documentation slice for the 1.0 rich
IR implementation lane. The slice replaces the placeholder
`docs:rich-ir-contract` gate with a documentation check and records the current
source-grounded migration contract.

The documentation is intentionally tied to the implementation state from the
compatibility and repeatability slices. It does not present unimplemented
behaviors as complete 1.0 release behavior.

## Reviewed documents

- `docs/contracts/api.md`: public package API, 1.0 document fields,
  `EngineNodeTarget`, structural views, source-slice behavior, query helpers,
  annotation target validation, compatibility selectors, migration guidance,
  CLI impact, and non-goals.
- `README.md`: package entry points, 1.0 selector summary, CLI limitation,
  and validation gate reference.
- `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md`:
  implementation-status note reconciling the provisional design shape with the
  current source-grounded contract.
- `scripts/check-rich-ir-contract-docs.mjs`: docs gate that fails if required
  headings and contract phrases disappear.
- `scripts/rich-ir-repeatability-cases.mjs`: repeatability fixture generator
  aligned with the current `{ kind: "node"; nodeTarget }` and
  `{ kind: "source"; sourceRange }` annotation target contract so the required
  repeatability gate exercises the documented shape.

## Commands

Required BEL-950 validation commands:

```sh
npm run docs:rich-ir-contract
npm run test:rich-ir:compat
npm run test:rich-ir:repeatability
npm run typecheck
git diff --check HEAD --
```

Recorded result:

- `npm run docs:rich-ir-contract`: pass.
- `npm run test:rich-ir:compat`: pass, 1 file and 6 tests.
- `npm run test:rich-ir:repeatability`: pass, 1 file and 2 tests.
- `npm run typecheck`: pass.
- `git diff --check HEAD --`: pass.

## Compatibility classification

- BEL-965 release cutover promotes the package version to `1.0.0`.
- The source-grounded 1.0 contract is selected with
  `normalize(parsed, { documentVersion: "1.0.0" })`.
- The 1.0 serialization gate is `serialize(result, { compatibilityMode:
  "default" })`; document-bearing results must carry version `"1.0.0"`.
- Retained 0.1.x-compatible document-bearing results use version `"0.0.0"` and
  are checked with `compatibilityMode: "legacy-0.1"`.
- Mismatched document-bearing compatibility requests throw
  `EngineCompatibilityError` with code
  `engine.compatibility.versionMismatch`.
- BEL-965 promotes the document version string to final `1.0.0`; flattened
  table cells, list item coordinates, and the CLI selector are part of the 1.0
  release contract.

## Remaining non-goals and limitations

- BEL-950 does not change parser, source, query, annotation, serializer, CLI, or
  validation internals.
- BEL-950 did not promote the document version string; BEL-965 records the
  release cutover to final `"1.0.0"`.
- BEL-950 did not add a CLI flag for final `documentVersion: "1.0.0"`; the
  final selector is recorded by the BEL-965 release cutover.
- Source text and raw HTML remain inert strings; the engine does not render,
  sanitize, fetch, execute, persist, or watch content.
- Source slices remain unavailable when parser offsets are absent, unsupported,
  or out of bounds.
- Annotation source-target bounds are checked only when the normalized document
  carries `sourceRange`; with source locations omitted, source annotations still
  require valid range shape and ordering but cannot be proven against document
  bounds.
- Node targets are deterministic for identical input and options, not stable
  anchors across arbitrary content edits.
- Profile compiler behavior, runtime lenses, MCP transport, agent adapters,
  semantic or LLM evaluation, arbitrary rule plugins, network services,
  persistence, file watching, graph storage, and domain-specific entity models
  remain out of scope.

## Conclusion

VAL-7 / EVD-6 passes for BEL-950. The docs gate is now a real repository
command, the contract docs identify the current 1.0 and retained 0.1.x
compatibility selectors, and the adjacent compatibility, repeatability,
typecheck, and whitespace checks pass in the worktree.
