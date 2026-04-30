# WP-3 EVD-3: IR And Diagnostic Snapshot Report

Date: 2026-04-30
Issue: BEL-885
Work package: WP-3
Validation: VAL-3, VAL-6

## Scope

This evidence records normalized IR snapshots, diagnostic snapshots, source
location coverage notes, and raw HTML representation evidence for the WP-3
fixture expansion.

WP-3 does not implement raw-HTML policy rule diagnostics. The execution spec
assigns configured raw-HTML policy diagnostics to WP-4 rule work; this WP-3
evidence verifies that raw HTML is represented as inert engine-owned data and
that diagnostic snapshot coverage exists for parser/frontmatter failures.

## Snapshot Artifacts

IR snapshots:

- `snapshots/ir/table-alignment.json`
- `snapshots/ir/raw-html-block.json`
- `snapshots/ir/frontmatter-nested.json`

Diagnostic snapshot:

- `snapshots/diagnostics/frontmatter-duplicate-key.json`

cmark-gfm comparison snapshot:

- `snapshots/cmark-gfm/selected-comparison-output.json`

## Source Location Coverage

The IR snapshots preserve source ranges where the parser provides positions.
The table snapshot includes source ranges for the table, rows, cells, and text
nodes. The raw HTML snapshot includes a block HTML source range. The nested
frontmatter snapshot verifies that body source locations are offset after YAML
frontmatter extraction.

The fixture suite also asserts that public normalized results do not expose raw
parser `position` fields.

## Raw HTML Representation

Raw HTML fixtures:

- `fixtures/parser/21-raw-html-block.md`
- `fixtures/parser/22-raw-html-inline.md`
- `fixtures/parser/25-html-comment.md`

Raw HTML is represented as `html` IR nodes with text payloads. The package does
not render, execute, sanitize, fetch, or evaluate the HTML. The selected
`cmark-gfm` comparison for `21-raw-html-block.md` is used only as an oracle for
GFM parsing comparison, not as runtime rendering behavior.

## Diagnostic Snapshot Coverage

The duplicate-key frontmatter diagnostic snapshot verifies:

- stable diagnostic code: `frontmatter.yaml.invalid`
- stable severity: `error`
- stable human-readable message
- source range when the YAML parser provides offsets

Existing parser/frontmatter tests continue to cover invalid YAML, unresolved
aliases, non-string keys, non-finite numbers, alias expansion limits, cyclic
aliases, and YAML warnings.

## Commands

Snapshot update command:

```sh
npx vitest run tests/parser-fixtures.test.ts -u
```

Full validation command:

```sh
npm test
```

Result:

```text
Test Files  4 passed (4)
Tests       30 passed (30)
```

## Snapshot Diff Status

New snapshots were added intentionally for WP-3. No unexpected snapshot drift
remains after the final full validation run.
