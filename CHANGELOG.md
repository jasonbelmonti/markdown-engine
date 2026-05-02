# Changelog

## 0.1.0 - 2026-05-01

Initial public release candidate for `@jasonbelmonti/markdown-engine`.

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

This version is prepared as the first public package version. Publication still
requires MS-3 approval, downstream confirmation or owner waiver, final
release-candidate validation, and npm publish verification.
