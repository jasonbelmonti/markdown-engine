# Changelog

## Unreleased

No unreleased changes.

## 3.5.0 - 2026-08-16

### Added

- Added v2-only `frontmatterShape.fields[]` predicates for exact string
  equality, non-blank string values, and forbidden direct frontmatter fields,
  with deterministic API and CLI diagnostics, non-coercing runtime semantics,
  and Task Definition-shaped fixture coverage.

## 3.4.0 - 2026-08-15

### Added

- Added the v2-only `tableColumnsExact` assertion for exact comparison of a
  selected table's complete normalized header sequence, including deterministic
  source-grounded API and CLI diagnostics for additional, missing, reordered,
  renamed, and duplicated columns.

## 3.3.0 - 2026-08-12

### Added

- Added the v2-only, selector-generic `selectionCount` assertion for bounding
  the number of matched targets with inclusive `min` and `max` values,
  including zero-selection evaluation and deterministic CLI/API evidence.

## 3.2.0 - 2026-07-12

### Added

- Added the v2-only, document-scoped `sourceLength` assertion for bounding the
  complete original Markdown source with JavaScript UTF-16 string-length
  semantics, including API/CLI source provenance, fail-closed missing-source
  diagnostics, and measurement-aware evidence hashing.

### Changed

- Moved exact bundled CLI installer version and hash alignment from ordinary
  source tests into a dedicated release verification gate.

## 3.1.1 - 2026-07-03

### Fixed

- Corrected the constrained-harness installer pin to use the 3.1.1 bundled CLI
  package version and artifact hash.
- Corrected declarative validation evidence so `engineVersion` records the
  package version that produced the JSON.

## 3.1.0 - 2026-07-03

### Added

- Added `validateDocumentSet(...)` as a public API for validating multiple
  Markdown documents with declarative validation profiles.
- Added Declarative Validation V2 support for `frontmatterShape` and
  `textFormat: isoDate` across profile schema validation, compiler contracts,
  runtime evaluation, API contracts, and fixtures.
- Added OKF profile examples, role-profile fixtures, document-set proof tests,
  and release-readiness evidence for profile-backed validation workflows.

### Changed

- Expanded the GitHub Pages consumer site and docs with conditional validation,
  OKF profile composition, repair-loop, and policy-validation guidance.
- Made the standalone CLI installer provider-neutral and removed its runtime
  dependency on `npx markdown-engine`.

## 3.0.0 - 2026-06-05

### Added

- Added a GitHub Pages consumer site under `docs/` with value proposition,
  workflow examples, and quickstart material for package users.
- Added Conditional V2 release-readiness notes for MS-4 review, summarizing the
  explicit `markdown-engine.validation@v2` opt-in, retained v1 profile
  compatibility, v2 grouped-rule and `when` behavior, ID count and table-column
  coverage evidence, downstream false-acceptance proof, and BEL-1121 release
  verification handoff. This is documentation readiness only and does not claim
  a tag, npm publication, npm dist-tag mutation, GitHub Release, downstream
  adoption, release completion, or MS-4 approval.
- Added Conditional V2 public validation support behind explicit
  `markdown-engine.validation@v2` profile opt-in, including ID count bounds,
  table column coverage, non-recursive `anyOf` / `allOf` grouped rules,
  rule-level `when` applicability, skipped-rule result metadata, downstream
  false-acceptance proof, repeatability evidence, and boundary-audit coverage.

### Changed

- Promoted package metadata to `@jasonbelmonti/markdown-engine@3.0.0` while
  retaining the serialized rich IR document contract at
  `documentVersion: "1.0.0"`.
- Preserved v1 declarative validation profile behavior and result shape;
  Conditional V2 behavior is selected only by
  `syntaxVersion: markdown-engine.validation@v2`.

## 2.0.0 - 2026-05-13

### Changed

- Promoted package metadata to `@jasonbelmonti/markdown-engine@2.0.0` while
  retaining the serialized rich IR document contract at
  `documentVersion: "1.0.0"`.
- Changed `normalize(parsed)` to default to the rich IR `1.0.0` document shape.
  Callers that still need the retained `0.1.0`-compatible shape must pass
  `documentVersion: "0.0.0"` explicitly.
- Added `docs/contracts/**` to the npm package artifact and included the rich
  IR contract documentation gate in `release:verify`.

### Fixed

- Closed the direct-object `parseValidationProfile(...)` ingestion path before
  schema traversal so unsafe accessors, proxies, cyclic values, sparse arrays,
  functions, non-finite numbers, explicit `undefined`, and `__proto__` payloads
  are rejected as inert profile data instead of being read by schema logic.

## 1.0.0 - 2026-05-07

### Added

- Added the 1.0 rich IR document contract with deterministic targets,
  structural views, source slices, query helpers, table/list/link models, and
  caller-owned annotation target validation.
- Added compatibility gates for final `1.0.0` document-bearing results and the
  retained `0.1.0`-compatible `0.0.0` document shape.
- Added CLI `--document-version` selection with final `1.0.0` output by default
  and explicit `0.0.0` legacy output.
- Added release-readiness, downstream exercise, repeatability, and audit
  evidence for the 1.0 release lane.

### Changed

- Promoted package metadata to `@jasonbelmonti/markdown-engine@1.0.0`.
- Promoted the public rich IR document version from the implementation-lane
  draft selector to final `1.0.0`.
- Classified the CLI default JSON output change as a breaking 1.0 behavior;
  consumers that need the legacy shape must pass `--document-version 0.0.0`.

## 0.1.0 - 2026-05-01

Initial public release for `@jasonbelmonti/markdown-engine`.

### Added

- Public package root exports for `parse`, `normalize`, `validate`, and
  `serialize`.
- Engine-owned normalized Markdown document and node contracts.
- YAML frontmatter extraction with JSON-safe materialization and structured
  diagnostics.
- Deterministic validation rule families:
  - `frontmatter.required`
  - `headings.required`
  - `codeFences.languages`
  - `links.allowedSchemes`
  - `rawHtml.policy`
- Stable JSON serialization for public parse, normalize, and validation
  results.
- Parser/frontmatter fixtures, cmark-gfm comparison coverage, deterministic
  repeatability proof, and dependency boundary audit tooling.

### Release Status

This version is the first published npm package version. The next planned
release target is `1.0.0` with the feature-complete rich IR contract described
in `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md`.
