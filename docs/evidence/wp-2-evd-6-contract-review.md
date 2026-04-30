# WP-2 EVD-6 Contract Review Packet

Issue: `BEL-884`
Date: 2026-04-30
Branch: `codex/bel-884-wp-2-contract-docs`

## Scope

WP-2 stabilizes the public API and contract documentation before WP-3 parser
fixture expansion and WP-4 deterministic rule expansion proceed.

This packet maps to `VAL-7` from the execution specification:

> Public API functions, result contracts, semver classifications, package
> build, and typecheck are documented and reviewable.

## Reviewed Public Contract

Contract documents:

- `docs/contracts/api.md`
- `docs/contracts/frontmatter.md`

Public package export:

- `src/index.ts`
- `src/api/contracts.ts`

Public API functions:

- `parse`
- `normalize`
- `validate`
- `serialize`

Public result and schema types:

- `ParseOptions`, `ParsedMarkdown`, `ParseResult`, `ParseFunction`
- `NormalizeOptions`, `NormalizeResult`, `NormalizeFunction`
- `ValidationConfig`, `ValidateOptions`, `ValidationRuleResult`,
  `ValidationResult`, `ValidateFunction`
- `SerializableMarkdownEngineResult`, `SerializeOptions`,
  `SerializeFunction`
- `EngineDocument`, `EngineNode`
- `MarkdownDiagnostic`, `MarkdownDiagnosticSeverity`, `SourcePosition`,
  `SourceRange`

## Contract Decisions

- The package root is the public entrypoint. Consumers should import from
  `markdown-engine`.
- The public API is limited to parse, normalize, validate, serialize, and the
  exported types from `src/api/**`.
- Raw mdast/unified parser AST nodes and raw parser `position` fields are not
  part of the stable public contract.
- Raw `yaml` parser documents, CST, tokens, warnings, and errors are internal.
- Parsed frontmatter must be JSON-safe when exposed publicly.
- `frontmatter.required` is the only supported deterministic rule family in
  this contract slice. Its public config requires a non-empty `fields` array of
  non-empty strings and accepts optional `severity` values of `error`,
  `warning`, or `info`, defaulting to `error`.
- `ValidateOptions.path` is accepted by the public type but is not currently
  used to add validation result fields.
- Unsupported deterministic or semantic-style rule declarations produce
  explicit diagnostics instead of fallback interpretation.
- Serialized output is JSON with normalized plain-object key ordering and no
  `undefined` fields.

## Semver Classification

Current package version: `0.0.0`.

Before first release, contract changes remain review-gated by WP-2 and MS-2.
After release, these changes require compatibility classification:

- API signature or exported type removals: major
- public result field removal or semantic change: major
- diagnostic code or severity semantic change: major
- added optional result fields: minor
- added supported deterministic rule families: minor
- bug fixes that preserve public shape and semantics: patch

No package tag or publication is authorized by this packet.

## VAL-7 Evidence

Automated evidence:

```sh
npm run typecheck
npm test -- --run tests/api.contract.test.ts
npm test
git diff --check
```

Recorded results:

- `npm run typecheck`: pass.
- `npm test -- --run tests/api.contract.test.ts`: pass, 1 file and 3 tests.
- `npm test`: pass, 3 files and 25 tests.
- `git diff --check`: pass.
- Code-boundary grep over `src` and `tests`: no forbidden dependency or scope
  matches.

Manual review checklist:

- [X] `docs/contracts/api.md` documents parse, normalize, validate, and
      serialize.
- [X] `docs/contracts/api.md` names public result and diagnostic fields.
- [X] `docs/contracts/frontmatter.md` remains the source for YAML frontmatter
      behavior.
- [X] Public docs exclude raw parser AST and raw YAML parser internals.
- [X] Public docs preserve the package boundary: no profile/runtime/MCP,
      agent-adapter, network-service, persistence, LLM, semantic-rubric, or
      arbitrary-plugin behavior.

## Boundary Notes

This WP-2 packet documents the current public contract. It does not implement
WP-3 fixture breadth, WP-4 rule-family breadth, WP-5 repeatability evidence, or
WP-6 release containment.
