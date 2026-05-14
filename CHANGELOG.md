# Changelog

## Unreleased

### Added

- Added a GitHub Pages consumer site under `docs/` with value proposition,
  workflow examples, and quickstart material for package 2.0 users.

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
