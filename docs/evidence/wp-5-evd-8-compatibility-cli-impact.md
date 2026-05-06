# WP-5 EVD-8: Compatibility and CLI Impact Closeout

Date: 2026-05-06
Issue: BEL-952
Work package: BEL-941 Slice 4 / WP-5
Validation: VAL-8 / EVD-8

## Scope

This evidence records the BEL-952 CLI rich IR cutover. It supersedes the
earlier BEL-951 no-change CLI decision and captures the default output change,
explicit legacy selector, semver classification, migration notes, validation
commands, and remaining release risks.

BEL-952 changes only the CLI policy layer. Parser, source, query, annotation,
serializer internals, and package root API signatures remain unchanged. The
source-grounded 1.0 rich IR contract remains `documentVersion:
"1.0.0-draft"` checked with `compatibilityMode: "default"` until final 1.0
release approval records the release version.

## Compatibility Behavior

- Current package version remains `0.1.0`.
- Default CLI document output is now `version: "1.0.0-draft"`.
- Retained legacy CLI document output remains explicit as `version: "0.0.0"`.
- Legacy document-bearing outputs remain checkable through
  `compatibilityMode: "legacy-0.1"`.
- The 1.0 draft rich IR path is selected with `documentVersion:
  "1.0.0-draft"` in the API and is the default CLI document version.
- Document-bearing 1.0 draft serialization remains checked with
  `compatibilityMode: "default"`.

## CLI Decision

CLI behavior is classified as changed.

The local CLI still accepts exactly one Markdown file through `--file` or
`--path`, runs parse and normalization through the existing CLI normalization
path, and writes pretty JSON. Directory traversal remains unsupported.

The CLI now accepts `--document-version` with these values:

- `1.0.0-draft`: default CLI output, containing rich IR fields such as
  `target` and `sections`.
- `0.0.0`: explicit legacy output without rich derived views.

Missing, invalid, or repeated `--document-version` selectors exit with code `2`
and usage text.

Semver classification: breaking CLI output-shape change for consumers that
parse default CLI JSON. Existing CLI users that require the legacy shape must
call `markdown-engine --document-version 0.0.0 --file <markdown-file>` or
`markdown-engine --document-version 0.0.0 --path <markdown-file>`.

## Migration Notes

Consumers ready for rich IR should remove legacy shape assumptions and read the
1.0 draft fields from the default CLI output: `target`, `sections`,
`textSpans`, `tables`, `lists`, `links`, and node-level `target` or `source`
where present.

Consumers not ready for rich IR should pin `--document-version 0.0.0` until
their downstream parser is updated. Consumers should not infer compatibility
from the absence of rich IR fields; use the explicit selector.

## Commands

Required BEL-952 validation commands:

```sh
npm run test:rich-ir:compat
npm run test:rich-ir:repeatability
npm run docs:rich-ir-contract
npm run typecheck
npm test
node scripts/check-boundaries.mjs
git diff --check HEAD --
```

Additional focused CLI command:

```sh
npm run build && npx vitest run tests/cli.test.ts "--exclude=.worktrees/**"
```

## Recorded Results

- `npm run build && npx vitest run tests/cli.test.ts "--exclude=.worktrees/**"`:
  pass, 1 file and 9 tests.
- `npm run test:rich-ir:compat`: pass, 1 file and 6 tests.
- `npm run test:rich-ir:repeatability`: pass, 1 file and 2 tests.
- `npm run docs:rich-ir-contract`: pass.
- `npm run typecheck`: pass.
- `npm test`: pass, 15 files and 94 tests.
- `node scripts/check-boundaries.mjs`: pass, 8 direct dependencies scanned, 0
  forbidden dependency matches, 0 annotation semantic leakage matches.
- `git diff --check HEAD --`: pass.

## Residual Risks

- The CLI remains a minimal local tool and is not yet a full workflow surface:
  it still processes one file only and does not traverse directories.
- The `1.0.0-draft` document version remains an implementation-lane contract
  until final 1.0 release approval records the final version string and release
  decision.
- Downstream CLI consumers that parse JSON by shape must update their fixtures
  or pin `--document-version 0.0.0`; this evidence does not prove every
  downstream consumer has migrated.
- This evidence proves representative compatibility and CLI behavior through
  the current validation gates. It does not exhaustively prove every Markdown
  input shape.

## Conclusion

BEL-952 makes 1.0 draft rich IR the default CLI output and preserves legacy CLI
output through `--document-version 0.0.0`. The change is breaking for default
CLI JSON consumers and has an explicit migration path.
