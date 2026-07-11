# Declarative Validation Profile Interpretation Guide

Status: non-normative agent interpretation guide
Last verified: 2026-07-11

This guide gives an agent a deterministic way to translate Markdown Engine
validation profile YAML into natural language before editing, auditing, or
explaining it.

## Authority and scope

The [declarative validation contract](../contracts/declarative-validation.md)
is the normative source for supported syntax, exact matching behavior,
compatibility, diagnostics, and result shapes. This guide explains that contract
operationally. It does not add syntax, relax closed profile shapes, or change
runtime semantics. If this guide and the contract disagree, follow the
contract.

This is Track 2 interpretation guidance. It is not a developer setup guide or a
profile-authoring cookbook.

## Profile anatomy

The profile envelope establishes compatibility before any rule is selected:

```yaml
syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0
rules: ...
```

- `syntaxVersion` selects the admitted v1 or v2 grammar.
- `documentVersion`, when present, states the expected normalized document
  contract version. A mismatch stops rule evaluation.
- `rules` contains the policies to interpret.

A flat rule has four distinct concerns:

```yaml
- id: risk.ids.unique       # rule identity
  severity: warning         # diagnostic severity; error when omitted
  when:                     # optional v2 applicability gate
    select: ...
    assert: ...
  select: ...               # target selection
  assert: ...               # behavior required of the assertion input
```

- `id` is the policy name carried into results, diagnostics, and evidence. It
  must be unique within the profile. It does not select content or define a
  predicate.
- `severity` controls the severity of validation diagnostics. A warning or info
  diagnostic can fail a rule without making the aggregate result invalid.
- `when` is an optional v2 gate. Its own `select -> assert` cycle decides
  whether the rule applies.
- `select` resolves document structure into concrete assertion input.
- `assert` evaluates one or more predicates. Every configured assertion member
  must pass.

V2 `anyOf` and `allOf` rules replace the flat rule's top-level `select` and
`assert` with branches. Every branch still has its own `select -> assert`
cycle.

## The select -> assert execution model

Read every executable rule or branch in this order:

```text
identity -> optional applicability -> select -> assert -> failure meaning
```

1. Complete profile admission, document-version compatibility, and compilation.
   Invalid shape, unsupported keys, incompatible selector/assertion pairs, and
   document-version mismatch are configuration or compile failures. They stop
   the validation run before rule evaluation, so no rules evaluate.
2. Read `id` as identity, not behavior.
3. For a v2 rule with `when`, resolve and assert the applicability input first.
   A matching gate continues; a non-matching gate skips the rule body.
4. Resolve `select` once into a concrete target set. Selection fields only
   decide which objects become assertion input.
5. Evaluate every member of `assert` against that input. Per-target assertions
   check every selected target, not merely one target.
6. Classify the result. Do not use “the rule failed” as the complete
   explanation.

The result classes are:

| Result class | Operational meaning |
| --- | --- |
| Configuration or compile failure | A profile-stage admission, compatibility, configuration, or compile check stopped validation before rule evaluation. This includes invalid or unsupported shape, incompatible selector/assertion pairing, and document-version mismatch. No rules evaluate. |
| Skipped (v2) | The rule's `when` select/assert gate did not match, so the rule body was not evaluated. |
| Empty selection | No usable assertion input was available. Usually `select` resolved zero targets. Document-scoped `references` and `tableColumnCoverage` can also emit this result when their assertion-owned source extraction finds no IDs. |
| Assertion failure | Assertion input existed, but at least one configured predicate was false. |
| Passed | Assertion input existed and all configured predicates produced no diagnostics. |

An empty selection is not evidence that a content predicate was false. For
example, if no table matches `tableHeader`, an ID assertion never receives
cells whose IDs it could check.

## Selector field roles

Start with `target`. It is the required target-kind discriminator and chooses
one candidate object kind: `document`, `section`, `heading`, `table`,
`tableRow`, `tableCell`, `textSpan`, `link`, or `list`. It is separate from
the five optional-field roles below.

Classify every remaining selector field by its role and by the target on which
it appears:

| Role | Selector fields | Agent interpretation |
| --- | --- | --- |
| Scope filter | `section` on `table`, `tableRow`, `tableCell`, `textSpan`, `link`, and `list` | Keep candidates contained in an exact-title named section, including its descendants. |
| Target filter | `title` and `depth` on `section`; `text` and `depth` on `heading`; `nodeType` and `textIncludes` on `textSpan`; `text` and `url` on `link`; `ordered` and `depth` on `list` | Keep candidates whose relevant attributes match. For `list`, `ordered` matches the list container, while `depth` keeps a list when at least one item has that depth. Equality is exact and literal; `textIncludes` is a literal substring test. Multiple fields all apply. |
| Table-shape filter | `header` on `table`; `tableHeader` on `tableRow` and `tableCell` | Keep only tables whose header cells contain the listed exact titles in the listed order. Unlisted columns may appear before, between, or after them. |
| Row filter | `where` on `tableRow`; `rowWhere` on `tableCell` | Keep data rows whose predicate-column cell passes `equals` and/or `includes`. If both are present, both must pass. A missing predicate column makes the row non-matching. |
| Extractor | Top-level `column` on `tableCell` | After table and row filtering, emit non-header data cells from the exact-title named column. |

The nested `column` inside `where` or `rowWhere` identifies predicate input; it
is part of the row filter. Only the top-level `select.column` on
`target: tableCell` is the cell extractor.

Read filters conjunctively. A link selector with `section`, `text`, and `url`
selects only links satisfying all three fields.

## Table selector pipeline

Table selection is easiest to read as a fixed pipeline:

```text
target: table
tables -> section -> header -> selected tables

target: tableRow
tables -> section -> tableHeader -> data rows -> where -> selected rows

target: tableCell
tables -> section -> tableHeader -> data rows -> rowWhere -> column -> selected cells
```

`header` and `tableHeader` answer:

> Which table shapes are eligible?

The top-level table-cell `column` answers:

> Which data cells become assertion input?

For example:

```yaml
select:
  target: tableCell
  section: Risk Register
  tableHeader:
    - ID
    - Mitigation
    - Status
  column: ID
assert:
  ids:
    prefix: OPS-RISK
    unique: true
```

Natural-language selection:

> Select non-header cells from the `ID` column of tables contained in
> `Risk Register` whose headers contain `ID`, `Mitigation`, and `Status` in
> that order.

Only after that selection does the runtime check the selected cell text for
duplicate `OPS-RISK` ID tokens.

## Assertion behavior

Selector fields determine input; assertion fields determine required behavior.
When an `assert` object contains multiple members, all of them evaluate against
the same selection and all must pass.

| Assertion | What it requires |
| --- | --- |
| `exists` | At least one selected target. It must be written as `true`. |
| `sectionsRequired` | The selected document contains the listed headings, optionally as an ordered subsequence when `order: strict`. |
| `tableColumnsRequired` | Every selected table contains each exact-title named column. This checks table shape after selection. |
| `ids` | ID tokens found across selected target text satisfy the configured predicates. `unique: true` rejects duplicate comparison values; v2 `minCount` and `maxCount` bound the unique comparison-value count without implicitly enabling uniqueness diagnostics. `prefix` filters tokens. `caseSensitive` defaults to `true` and controls prefix matching plus case-sensitive or case-insensitive comparison; it does not filter tokens by letter case. |
| `references` | IDs extracted from the assertion's `idsFrom` source appear in each configured target section. The assertion owns these secondary lookups. |
| `tableColumnCoverage` | Every unique source-column comparison value remaining after optional prefix filtering and configured case comparison appears in the target table column. This document-scoped v2 assertion owns both table-column inputs. |
| `frontmatterShape` | Document frontmatter satisfies v2 presence, top-level field requirement, value-type, and non-empty-string constraints. |
| `text` | Every selected target's normalized text contains the required literal and/or excludes all forbidden literals. |
| `textOccurrenceCount` | Every selected target contains exactly the configured number of non-overlapping literal occurrences. |
| `textLength` | Every selected target's normalized text has JavaScript string length within the inclusive configured bounds. |
| `textFormat` | Every selected target's normalized text matches the supported v2 format; `isoDate` is an exact real `YYYY-MM-DD` calendar date. |
| `frontmatterRequired` | The selected document has each listed own top-level frontmatter field. |

`tableColumnsRequired` differs from `tableHeader` even though both mention
headers:

- `tableHeader` is a selector. A non-matching table is removed before
  assertion evaluation.
- `tableColumnsRequired` is an assertion. A selected table missing a required
  column is assertion input that fails a predicate.

## Conditional and grouped v2 rules

The same interpretation loop nests inside v2 structures.

### `when`

Translate `when` as:

> Apply this rule only when the `when.select` input passes
> `when.assert`.

A matching gate proceeds to the rule. Any applicability diagnostic, including
empty selection, makes the gate non-matching. The runtime returns a skipped rule
with the applicability diagnostics nested under `when`; it does not evaluate
the flat assertion or grouped branches.

### `anyOf` and `allOf`

Interpret every branch independently:

> Branch <label or index> selects <targets>. It asserts <predicate>.

All branches are evaluated. `anyOf` passes when at least one branch passes and
records the first passing branch as selected. `allOf` passes only when every
branch passes. An empty branch selection is a failed branch; the group operator
then determines the rule result.

## Natural-language translation template

Use this canonical form for a flat rule or branch:

```text
Rule <id> selects <concrete targets> from <scope>, after applying
<target/table-shape/row filters and extractors>. It asserts <all predicates>
against <each target or the aggregate input>. Empty input means <selection
meaning>; input that exists but violates the predicate means <assertion meaning>.
```

Add this prefix when `when` is present:

```text
Rule <id> applies only when <applicability translation>; otherwise it is skipped.
```

Before accepting a translation, verify that it answers four separate
questions:

1. What policy does `id` name?
2. Which exact objects does `select` produce?
3. What does `assert` require of those objects?
4. Does each possible non-pass mean invalid configuration, skipped
   applicability, empty input, or a false assertion?

## Annotated shipped profile

The shipped
[operational-spec profile](../../fixtures/declarative-validation/examples/operational-spec/profile.yaml)
is a v1 profile with twelve rules. It covers all nine selector target kinds.
The translations below account for every rule in file order.

### 1. `frontmatter.required`

Select the document. Require own top-level frontmatter fields named `title`,
`owner`, and `status`. Failure means at least one field is absent; this
assertion does not require particular values or non-empty strings. The document
selector itself is never empty.

### 2. `sections.required`

Select the document. Require `Objective`, `Context / Constraints`,
`Execution Plan`, `Risk Register`, and `Handoff Links` to occur in that order
as an ordered subsequence of the section tree. Failure means a required heading
is missing or the required order cannot be satisfied.

### 3. `objective.text`

Select every section whose title exactly equals `Objective`. Require every
selected section's normalized text to contain the literal `Mission control`.
No exact-title section means empty selection; a selected section lacking the
literal means assertion failure.

### 4. `objective.length`

Select every section whose title exactly equals `Objective`. Require every
selected section's normalized text length to be between 80 and 180 inclusive.
No exact-title section means empty selection; text outside the bounds means
assertion failure.

### 5. `risk.heading.text`

Select every heading whose visible text exactly equals `Risk Register`.
Require every selected heading's text to contain `Risk Register`. Exact
equality already implies that containment, so the meaningful runtime failure is
an empty selection when no such heading exists.

### 6. `risk.table.columns`

Select tables contained in `Risk Register` whose header contains `ID`,
`Mitigation`, and `Status` in that order. Require each selected table to
contain columns with those names. The selector already filters for the same
three headers, so a table missing one is excluded before the assertion runs. If
no other table matches, failure is empty selection. This rule does not inspect
data-cell content.

### 7. `risk.ids.unique`

Select data cells from the `ID` column of tables contained in `Risk Register`
whose header contains `ID`, `Mitigation`, and `Status` in that order.
`tableHeader` is the table-shape filter; top-level `column` is the extractor.
Require case-sensitive `OPS-RISK`-prefixed ID tokens found across the selected
cells to be unique. Failure means no cells were selected or a matching ID
repeats. Non-matching ID families are ignored, and `prefix` is not a presence
requirement.

### 8. `tracked.risk.row`

Select complete data rows from tables contained in `Risk Register` whose header
contains `ID`, `Mitigation`, and `Status` in that order, keeping only rows
whose `Status` cell exactly equals `tracked`. `where` keeps whole row targets.
Require every selected row's normalized text to contain `OPS-RISK-1`. No
qualifying row means empty selection; any qualifying row lacking that literal
means assertion failure.

### 9. `execution.must.count`

Select every section whose title exactly equals `Execution Plan`. Require
every selected section to contain exactly two non-overlapping literal
occurrences of `MUST`. No matching section means empty selection; any other
count means assertion failure.

### 10. `execution.list`

Select unordered lists contained in `Execution Plan`. Require every selected
list's normalized text to contain `Validate profile`. No unordered list means
empty selection; any selected list lacking the literal means assertion failure.

### 11. `handoff.paragraph`

Select paragraph text spans contained in `Handoff Links` whose normalized text
already includes `handoff packet`. `section`, `nodeType`, and `textIncludes`
are all selection filters. Require every selected span also to contain
`follow-up`. No qualifying span means empty selection; a qualifying span
lacking `follow-up` means assertion failure.

### 12. `handoff.link`

Select links contained in `Handoff Links` whose visible text exactly equals
`handoff packet` and whose URL exactly equals `./handoff-packet.md`. Assert
that at least one such link exists. Failure means empty selection: no link
matches every filter.

## Common misreads

### `tableHeader` versus `column`

Incorrect:

> `tableHeader` tells the ID assertion which columns to inspect.

Correct:

> `tableHeader` filters eligible table shapes. The top-level table-cell
> `column` extracts the data cells passed to the ID assertion.

If the extracted column does not exist on any eligible table, the cell
selection is empty. The missing column is not an assertion modifier.

### `where` versus `rowWhere`

Both fields filter data rows, but they produce different final targets:

- `target: tableRow` with `where` returns each surviving whole row.
- `target: tableCell` with `rowWhere` filters rows first, then top-level
  `column` returns one cell from each surviving row.

The shipped
[release-checklist profile](../../fixtures/declarative-validation/examples/release-checklist/profile.yaml)
shows the contrast. `ready.gate.row` uses `where` to select whole rows where
`Gate` equals `Contract docs`. `status.ready.count` uses `rowWhere` to keep
rows where `ID` equals `REL-GATE-1`, then extracts the `Status` cell for the
occurrence-count assertion.

### Table-shape checks versus table-cell content checks

Do not translate every column-looking field as a content assertion:

- `header` and `tableHeader` filter candidate tables by shape.
- `tableColumnsRequired` asserts table shape on tables that survived selection.
- `target: tableCell` plus `ids`, `text`, `textOccurrenceCount`,
  `textLength`, or `textFormat` asserts selected cell content.
- `tableColumnCoverage` is a document-scoped v2 assertion that owns source and
  target table-column extraction for a source-to-target coverage check. The
  inputs may resolve in the same table or in different tables.

### Empty selection versus assertion failure

Suppose a rule selects tables with headers `ID` and `Status`, then asserts that
selected tables also contain `Owner`:

- If no table has `ID` and `Status` in the required order, selection is empty.
  The `Owner` predicate had no table to inspect.
- If a table passes the selector but lacks `Owner`, input exists and
  `tableColumnsRequired` fails.

Moving `Owner` from the assertion into `header` or `tableHeader` changes which
tables are selected and can change failure meaning from assertion failure to
empty selection. It does not strengthen the same assertion.

Inside v2 `when`, an empty applicability selection means the gate did not match,
so the main rule is skipped. It is not reported as a top-level validation
failure.

## Agent checklist

Before editing or explaining a profile:

1. Open the public contract for the profile's `syntaxVersion`.
2. Record the rule `id` and effective severity.
3. Translate `when` first when present.
4. Name the `target` kind.
5. Label every optional selector field as scope filter, target filter,
   table-shape filter, row filter, or extractor.
6. For tables, read shape matching, row filtering, and extraction as separate
   stages.
7. State whether the assertion checks each target, the aggregate selection, or
   assertion-owned document inputs.
8. Translate every member of `assert`; multiple members all apply.
9. Explain empty input separately from a false predicate.
10. For v2 groups, translate every branch before applying `anyOf` or `allOf`.
11. Use the canonical sentence and verify it does not describe a selector as an
    assertion modifier.
