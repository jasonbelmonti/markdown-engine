# WP-5 EVD-8: Compatibility and CLI Impact Closeout

Date: 2026-05-06
Issue: BEL-951
Work package: BEL-941 Slice 4 / WP-5
Validation: VAL-8 / EVD-8

## Scope

This evidence closes the BEL-951 compatibility and CLI impact decision for
BEL-941. It records the retained 0.1.x-compatible behavior, the CLI semver
classification, the validation commands run, and remaining release risks.

BEL-951 does not change parser, source, query, annotation, serializer, package
root API, or CLI runtime behavior. The package root API remains the
source-grounded 1.0 rich IR contract surface by calling `normalize` with
`documentVersion: "1.0.0-draft"` and `serialize` with
`compatibilityMode: "default"` until final 1.0 release approval records the
release version.

## Compatibility Behavior

- Current package version remains `0.1.0`.
- Retained legacy document output remains explicit as `version: "0.0.0"`.
- Legacy document-bearing outputs remain checkable through
  `compatibilityMode: "legacy-0.1"`.
- The 1.0 draft rich IR path remains API-only for this slice and is selected
  with `documentVersion: "1.0.0-draft"`.
- Document-bearing 1.0 draft serialization remains checked with
  `compatibilityMode: "default"`.

## CLI Decision

CLI behavior is classified as unchanged.

The local CLI still accepts exactly one Markdown file through `--file` or
`--path`, runs parse and normalization through the existing CLI normalization
path, and writes pretty JSON. Directory traversal remains unsupported. The CLI
does not accept a `documentVersion: "1.0.0-draft"` selector in BEL-951.

Semver classification: no CLI runtime behavior change for the current `0.1.0`
package line. No migration is required for existing CLI users. API consumers
who need the 1.0 draft rich IR contract should use the package root API and the
document/serialization selectors documented in `docs/contracts/api.md`.

## Commands

Required BEL-951 validation commands:

```sh
npm run test:rich-ir:compat
npm run test:rich-ir:repeatability
npm run docs:rich-ir-contract
npm run typecheck
node scripts/check-boundaries.mjs
git diff --check HEAD --
```

Additional focused CLI command:

```sh
npm run build && npx vitest run tests/cli.test.ts "--exclude=.worktrees/**"
```

## Recorded Results

- `npm run build && npx vitest run tests/cli.test.ts "--exclude=.worktrees/**"`:
  pass, 1 file and 5 tests.
- `npm run test:rich-ir:compat`: pass, 1 file and 6 tests.
- `npm run test:rich-ir:repeatability`: pass, 1 file and 2 tests.
- `npm run docs:rich-ir-contract`: pass.
- `npm run typecheck`: pass.
- `node scripts/check-boundaries.mjs`: pass, 8 direct dependencies scanned, 0
  forbidden dependency matches, 0 annotation semantic leakage matches.
- `git diff --check HEAD --`: pass.

## Residual Risks

- The CLI remains a minimal local tool and is not yet the complete 1.0 rich IR
  contract surface. A later CLI cutover must semver-classify any new selector,
  output-shape, or traversal behavior.
- The `1.0.0-draft` document version remains an implementation-lane contract
  until final 1.0 release approval records the final version string and release
  decision.
- This evidence proves representative compatibility and CLI behavior through
  the current validation gates. It does not exhaustively prove every Markdown
  input shape.

## Conclusion

BEL-951 keeps CLI behavior unchanged and records no required CLI migration for
current users. The 1.0 rich IR migration path remains the package API contract
documented in `docs/contracts/api.md`.
