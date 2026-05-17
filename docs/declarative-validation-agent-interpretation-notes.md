# Declarative Validation Agent Interpretation Notes

Status: planning notes
Last updated: 2026-05-16

These notes define the first target for an agent-facing guide that teaches how to
read a declarative validation profile and translate it into natural language.

## Objective

Give an unfamiliar agent a deterministic way to interpret profile YAML before it
edits, audits, explains, or generates rules.

The guide should not replace the public contract. It should sit above the
contract and explain how to read the grammar operationally.

## Core Interpretation Loop

For each rule:

1. Read `id` as the policy name.
2. Resolve `select` into a concrete target set.
3. Classify selector fields as scope filters, target filters, row filters, or
   extractors.
4. Run `assert` only against the selected target set.
5. Explain the failure mode as config failure, empty selection, or assertion
   failure.

Canonical rule summary format:

```text
Rule <id> selects <concrete targets> from <scope>. It asserts <predicate> against
those selected targets. Failure means <operational meaning>.
```

## Selector Field Roles

Selector fields should be interpreted by role, not just by name.

| Field | Applies to | Role | Interpretation |
| --- | --- | --- | --- |
| `target` | all selectors | target kind | Chooses the kind of document object to select. |
| `section` | table, tableRow, tableCell, textSpan, link, list | scope filter | Restricts matching to objects inside the named section. |
| `title` | section | target filter | Selects sections with the exact title. |
| `text` | heading, link | target filter | Selects headings or links with exact visible text. |
| `url` | link | target filter | Selects links with the exact URL. |
| `header` | table | table-shape filter | Restricts matching to tables whose header row contains the listed headers in order. |
| `tableHeader` | tableRow, tableCell | table-shape filter | Restricts matching to rows or cells in tables whose header row contains the listed headers in order. |
| `column` | tableCell | extractor | Selects cells from the named column after a table is matched. |
| `where` | tableRow | row filter | Keeps data rows whose predicate column satisfies `equals` and/or `includes`. |
| `rowWhere` | tableCell | row filter | Filters data rows before extracting the requested `column` cell. |
| `nodeType` | textSpan | target filter | Selects text spans produced from the named Markdown node type. |
| `textIncludes` | textSpan | target filter | Selects text spans whose normalized text contains the literal substring. |
| `ordered` | list | target filter | Selects ordered or unordered lists. |
| `depth` | section, heading, list | target filter | Restricts selection by structural depth. |

## Table Interpretation Rule

Agents should always separate table matching from table content extraction.

`header` and `tableHeader` answer:

```text
Which table shape must exist before this rule can apply?
```

`column` answers:

```text
Which column's data cells become the selected targets?
```

Example:

```yaml
select:
  target: tableCell
  section: 2. Objectives and Non-Objectives
  tableHeader:
    - ID
    - Statement
    - Measurement or decision horizon
  column: ID
assert:
  ids:
    prefix: OBJ
    unique: true
```

Canonical interpretation:

```text
This rule selects data cells in the ID column from tables in section
"2. Objectives and Non-Objectives" whose header row includes ID, Statement, and
Measurement or decision horizon in that order. It checks selected cell text for
unique OBJ-prefixed IDs.
```

## Common Misreads To Prevent

- `tableHeader` is not the same as `column`.
- `tableHeader` does not select cells; it filters matching tables.
- `column` on a `tableCell` selector is not an assertion modifier; it is part of
  selection.
- `where` filters rows selected by `target: tableRow`.
- `rowWhere` filters candidate rows before a `target: tableCell` selector
  extracts the requested column.
- `tableColumnsRequired` checks table shape.
- `tableCell` plus `ids`, `text`, `textOccurrenceCount`, or `textLength` checks
  selected cell content.
- Empty selection is different from an assertion failure. It means no target set
  was available for that assertion to evaluate.

## Candidate Guide Outline

1. Profile anatomy
2. Rule execution model
3. Selector roles
4. Assertion roles
5. Natural-language translation template
6. Annotated operational-spec profile
7. Annotated release-checklist profile
8. Annotated requirements-traceability profile
9. Common misreads and correction examples
10. Agent checklist before editing a profile

## Linear Tracking

Project: [Markdown Engine: Agent Profile Interpretation](https://linear.app/belmocorp/project/markdown-engine-agent-profile-interpretation-c515284aa65b)

Seed issues:

- [BEL-1071](https://linear.app/belmocorp/issue/BEL-1071/define-the-agent-facing-profile-interpretation-model):
  define the agent-facing profile interpretation model
- [BEL-1072](https://linear.app/belmocorp/issue/BEL-1072/document-selector-roles-and-common-profile-misreads):
  document selector roles and common profile misreads
- [BEL-1073](https://linear.app/belmocorp/issue/BEL-1073/annotate-shipped-fixture-profiles-with-natural-language-rule):
  annotate shipped fixture profiles with natural-language rule translations
- [BEL-1074](https://linear.app/belmocorp/issue/BEL-1074/link-the-agent-interpretation-guide-from-user-facing-docs):
  link the agent interpretation guide from user-facing docs

## Acceptance Target

The guide is successful when an agent can read an unfamiliar profile rule and
produce a reviewable natural-language explanation that distinguishes scope,
selection, assertion, and failure meaning without inspecting implementation code.
