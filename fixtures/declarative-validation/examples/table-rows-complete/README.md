# Table body completeness

`tableRowsComplete: true` is an opt-in v2 assertion for `table` selectors. It
compares each body row's normalized column positions with its table's header.
Missing and excess cells fail. Header validation remains independent.

From the repository root, build and run the example:

```sh
npm run build
node dist/cli/index.js validate --file fixtures/declarative-validation/examples/table-rows-complete/consumer-missing.md --profile fixtures/declarative-validation/examples/table-rows-complete/legacy.yaml --format json
node dist/cli/index.js validate --file fixtures/declarative-validation/examples/table-rows-complete/consumer-missing.md --profile fixtures/declarative-validation/examples/table-rows-complete/profile.yaml --format json
node dist/cli/index.js validate --file fixtures/declarative-validation/examples/table-rows-complete/consumer-repaired.md --profile fixtures/declarative-validation/examples/table-rows-complete/profile.yaml --format json
```

Expected exits are **0, 1, 0**. The second command reports rule `sources.columns`,
body row 2 at source line 20, expected `[0,1,2,3]`, actual `[0,1,2]`. Its range
locates the first available cell of the failing row. Table and row identities
remain in the message when cell ranges are unavailable; no location is invented.

`consumer-missing.md` is copied unchanged from delegation-planner commit
`bc11ace3e50315313d428f3b681424fee910aef3`,
`skills/delegation-planner/validation/fixtures/missing-dynamic-row-cell.md`.
`consumer-repaired.md` adds the missing execution-plan identity cell.
`legacy.yaml` checks the exact source-table header; `profile.yaml` adds only the
row-completeness assertion. This focused adaptation proves Engine's shape decision
without invoking or migrating the consumer helper. It does not claim to validate
all delegation policy, source integrity, reserved markers or semantic readiness.

`oracle.json` records independently authored valid/invalid decisions, row indexes,
source lines and actual column positions for the small Markdown fixtures. API and
real CLI tests use these expectations. Fixtures include escaped pipes, inline code,
Unicode, a blockquote table, excess and truncated rows, and explicit empty cells.

An explicit empty cell (`| x | |`) passes shape. Require nonblank values separately:

```yaml
- id: values.required
  select:
    target: tableCell
    column: B
  assert:
    text:
      nonBlank: true
```

A header-only table also passes shape. To require body rows, compose:

```yaml
- id: rows.required
  select:
    target: tableRow
  assert:
    selectionCount:
      min: 1
```

Apply the same section/header scope to composed rules when appropriate. Unmatched
table selection fails with `profile.validation.emptySelection`; unselected
malformed tables do not affect the rule. Section selection includes descendant
sections. The Engine parser and normalized document remain unchanged.

Older runtimes reject this assertion. These commands use the local build;
release, installed-runtime adoption and consumer-helper removal are separate work.
