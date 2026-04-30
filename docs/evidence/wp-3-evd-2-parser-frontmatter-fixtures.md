# WP-3 EVD-2: Parser And Frontmatter Fixture Report

Date: 2026-04-30
Issue: BEL-885
Work package: WP-3
Validation: VAL-1, VAL-2

## Scope

This evidence records expanded parser/frontmatter fixture coverage for core GFM
and YAML frontmatter behavior. It preserves the public API boundary by driving
the package through `parse` and `normalize`; it does not expose raw parser AST
objects as public contracts.

## Fixture Corpus

The parser fixture corpus contains 30 Markdown files under `fixtures/parser/`:

- `01-atx-heading.md`
- `02-setext-heading.md`
- `03-paragraph-soft-break.md`
- `04-thematic-break.md`
- `05-blockquote-nested.md`
- `06-unordered-list.md`
- `07-ordered-list.md`
- `08-nested-list.md`
- `09-task-list-checked.md`
- `10-task-list-unchecked.md`
- `11-fenced-code-info-meta.md`
- `12-indented-code.md`
- `13-inline-code.md`
- `14-emphasis-strong.md`
- `15-strikethrough.md`
- `16-inline-link-title.md`
- `17-autolink-literal.md`
- `18-reference-link.md`
- `19-image.md`
- `20-table-alignment.md`
- `21-raw-html-block.md`
- `22-raw-html-inline.md`
- `23-escaped-punctuation.md`
- `24-hard-break.md`
- `25-html-comment.md`
- `26-footnote.md`
- `27-frontmatter-basic.md`
- `28-frontmatter-empty.md`
- `29-frontmatter-nested.md`
- `30-frontmatter-scalars.md`

Covered behavior includes headings, paragraphs, thematic breaks, blockquotes,
unordered/ordered/nested lists, GFM task lists, fenced and indented code,
inline code, emphasis/strong text, strikethrough, inline links, autolink
literals, reference links, images, GFM tables, raw HTML blocks and inline HTML,
escaped punctuation, hard breaks, HTML comments, footnotes, and valid/empty/
nested/scalar YAML frontmatter.

## cmark-gfm Comparison Cases

Selected comparison cases are checked with the `cmark-gfm` dev-only conformance
oracle at version `0.29.0.gfm.0`.

Comparison fixtures:

- `09-task-list-checked.md`
- `11-fenced-code-info-meta.md`
- `15-strikethrough.md`
- `16-inline-link-title.md`
- `17-autolink-literal.md`
- `20-table-alignment.md`
- `21-raw-html-block.md`
- `26-footnote.md`

The test suite asserts exact `cmark-gfm` HTML for those fixtures and separately
asserts equivalent engine-owned IR semantics through the public API.

Comparison output snapshot:

- `snapshots/cmark-gfm/selected-comparison-output.json`

## Commands

Snapshot update command:

```sh
npx vitest run tests/parser-fixtures.test.ts -u
```

Result:

```text
tests/parser-fixtures.test.ts (5 tests) passed
Snapshots: 5 written, then 1 updated after ASCII escaping for generated oracle output
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

## Failure Notes

No parser/frontmatter fixture failures remain.

`cmark-gfm` is included only as a devDependency for selected comparison tests.
The runtime parser remains `remark-parse` plus `remark-gfm`; no production
parser dependency or public API surface changed for the comparison oracle.
