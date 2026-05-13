# WP-6A EVD-9: ODS Profile Exercise

Date: 2026-05-13
Issue: BEL-988
Work package: Declarative Validation WP-6A
Validation: VAL-9 / EVD-9
Branch: `codex/BEL-988-declarative-validation-wp-6a-ods-downstream-exercise`
Baseline: `origin/main` at `31111ad`

## Scope

This evidence records the downstream operational-design-spec structural
exercise for declarative validation v1. The exercise proves that an ODS-shaped
Markdown fixture can be validated with generic profile syntax and without
adding operational-design-spec behavior to parser, compiler, selector,
assertion, diagnostic, or public API code.

## Fixture Input

Fixture:
`fixtures/declarative-validation/downstream/operational-design-spec.md`

The fixture contains:

- YAML frontmatter fields: `title`, `owner`, and `status`.
- Required ODS-shaped headings: `Objective`, `Context / Constraints`,
  `Functional Requirements`, `Validation Matrix`, `Traceability`, and
  `Decision Log`.
- Requirement, validation, and decision tables with ID columns.
- Literal text constraints in section body text and a requirement statement
  table cell.
- Traceability text that references every `ODS-REQ-*` and `ODS-VAL-*` source
  ID.

The ODS-shaped tokens are Markdown text only. The engine does not classify them
as operational-design-spec entities, relationships, approvals, semantic claims,
or runtime facts.

## Profile Input

Profile:
`fixtures/declarative-validation/downstream/operational-design-spec-profile.yaml`

The profile uses only the public declarative validation v1 vocabulary:

- `frontmatterRequired` over the `document` selector.
- `sectionsRequired` over the `document` selector with `order: strict`.
- `tableColumnsRequired` over `table` selectors scoped by section and header.
- `ids.unique` over `tableCell` selectors scoped by section and column.
- `text.contains` over `section` and `tableCell` selectors.
- `references` over the `document` selector using table-column source IDs and
  required target sections.

## Command Result

Command:

```sh
npm run test:validation:downstream
```

Recorded result:

```text
PASS tests/declarative-validation-downstream.test.ts
Test Files 1 passed (1)
Tests 2 passed (2)
```

## Diagnostics

Passing fixture diagnostics:

```json
[]
```

The test also exercises an intentionally incomplete traceability fixture by
removing the `ODS-REQ-3` reference from `Traceability`. That controlled failure
emits the generic diagnostic:

```json
[
  {
    "code": "profile.validation.referenceMissing",
    "ruleId": "traceability.requirements",
    "message": "ID \"ODS-REQ-3\" must appear in section \"Traceability\".",
    "severity": "error"
  }
]
```

The diagnostic source range points at the source `ODS-REQ-3` requirement table
row rather than fabricating a target range.

## Semantic-Boundary Observations

- No core source modules were changed for this exercise.
- The fixture and profile may contain ODS-shaped strings, but executable engine
  behavior remains generic declarative validation syntax.
- The profile does not use scripts, expressions, user-supplied regular
  expressions, plugins, imports, network behavior, LLM calls, persistence, file
  watching, runtime adapters, or operational-design-spec-specific assertions.
- The validation proves structural coverage for headings, tables, IDs, literal
  text constraints, frontmatter, and traceability without profile-specific core
  semantics.

## Conclusion

VAL-9 passes for BEL-988. The declarative validation v1 vocabulary can validate
the motivating ODS-shaped structural fixture using generic `markdown-engine`
behavior. If a later operational-design-spec profile needs semantic review,
entity registries, relationship graphs, approval quality scoring, or runtime
lenses, that behavior remains downstream-owned and outside this package.
