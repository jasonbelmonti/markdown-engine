# Changelog

## Unreleased

### Added

- Added the 1.0 rich IR downstream exercise gate and WP-6 release-readiness
  evidence for the implementation lane.

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
