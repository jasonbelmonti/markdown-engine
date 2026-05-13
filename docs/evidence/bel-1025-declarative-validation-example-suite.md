# BEL-1025: Declarative Validation Example Suite

Date: 2026-05-13
Issue: BEL-1025
Work package: Declarative Validation WP-6D
Validation: Reader-facing example suite
Branch: `codex/bel-1025-declarative-validation-wp-6d-example-suite`
Baseline: `origin/main` at `9cf86a6`

## Scope

This evidence records the BEL-1025 declarative validation example suite. The
suite is reader-facing: it shows how to author practical Markdown/profile pairs
without adding domain-specific behavior to the `markdown-engine` core.

## Example Inventory

The committed suite lives under `fixtures/declarative-validation/examples/**`.

| Domain | Markdown fixtures | Profile | Primary coverage |
| --- | --- | --- | --- |
| Operational spec | `operational-spec/pass.md`, `operational-spec/fail.md` | `operational-spec/profile.yaml` | frontmatter, required sections, heading, section, table, table row, table cell, text span, link, list, literal text, occurrence count, ID uniqueness |
| Release checklist | `release-checklist/pass.md`, `release-checklist/fail.md` | `release-checklist/profile.yaml` | checklist lists, table gates, table row predicates, link selectors, duplicate ID diagnostics, excluded text diagnostics |
| Requirements traceability | `requirements-traceability/pass.md`, `requirements-traceability/fail.md` | `requirements-traceability/profile.yaml` | requirements tables, evidence tables, table-cell predicates, occurrence counts, ID uniqueness, reference coverage diagnostics |

Across the suite, the examples exercise every supported v1 selector target:
`document`, `section`, `heading`, `table`, `tableRow`, `tableCell`,
`textSpan`, `link`, and `list`.

Across the suite, the examples exercise every supported v1 assertion family:
`sectionsRequired`, `tableColumnsRequired`, `ids`, `references`, `text`,
`textOccurrenceCount`, and `frontmatterRequired`.

## Commands

Targeted validation commands:

```sh
npm run test:validation:examples
npm run test:validation:cli
npm run test:validation:contract
npm run docs:declarative-validation-contract
npm run audit:declarative-validation-boundary
npm run typecheck
npm run build
```

Reader-facing CLI examples:

```sh
node dist/cli/index.js validate --file fixtures/declarative-validation/examples/operational-spec/pass.md --profile fixtures/declarative-validation/examples/operational-spec/profile.yaml
node dist/cli/index.js validate --file fixtures/declarative-validation/examples/operational-spec/fail.md --profile fixtures/declarative-validation/examples/operational-spec/profile.yaml
```

## Expected Exit Codes

| Command | Expected exit code |
| --- | --- |
| `operational-spec/pass.md` with `operational-spec/profile.yaml` | `0` |
| `operational-spec/fail.md` with `operational-spec/profile.yaml` | `1` |
| `release-checklist/pass.md` with `release-checklist/profile.yaml` | `0` |
| `release-checklist/fail.md` with `release-checklist/profile.yaml` | `1` |
| `requirements-traceability/pass.md` with `requirements-traceability/profile.yaml` | `0` |
| `requirements-traceability/fail.md` with `requirements-traceability/profile.yaml` | `1` |

## Representative Diagnostics

The intentionally failing fixtures produce generic declarative validation
diagnostics:

```json
[
  "profile.validation.assertionFailed",
  "profile.validation.duplicateId",
  "profile.validation.frontmatterFieldMissing",
  "profile.validation.referenceMissing",
  "profile.validation.textExcluded",
  "profile.validation.textMissing"
]
```

The example test gate verifies the exact diagnostic codes and rule IDs for each
failing fixture. CLI coverage verifies exit code `0` for a passing fixture, exit
code `1` for an intentionally failing fixture, empty stderr, JSON result shape,
and evidence hash fields.

## Recorded Results

Recorded results are from the BEL-1025 branch after adding the suite:

```text
PASS: npm run test:validation:examples
  Test Files 1 passed (1)
  Tests 4 passed (4)

PASS: npm run test:validation:cli
  Test Files 1 passed (1)
  Tests 16 passed (16)

PASS: npm run test:validation:contract
  Test Files 1 passed (1)
  Tests 14 passed (14)

PASS: npm run docs:declarative-validation-contract
  Declarative validation contract documentation gate PASS

PASS: npm run audit:declarative-validation-boundary
  Declarative validation boundary audit PASS

PASS: npm run typecheck
PASS: npm run build
```

Package fixture availability check:

```text
PASS: npm pack --dry-run --json --ignore-scripts
  Package entry count: 466
  Expected example fixture files: 9
  Missing example fixture files: 0
```

Direct CLI spot check:

```text
PASS: operational-spec/pass.md exited 0 with valid=true and evidence present.
PASS: operational-spec/fail.md exited 1 with valid=false, evidence present, and diagnostics:
  - profile.validation.assertionFailed / execution.must.count
  - profile.validation.frontmatterFieldMissing / frontmatter.required
```

## Boundaries And Non-Goals

- The examples are deterministic and local-only.
- No parser, compiler, selector, assertion, diagnostic, CLI, or package-root API
  semantics were expanded for BEL-1025.
- The suite does not use profile discovery, globbing, network calls, file
  watching, persistence, plugins, JavaScript execution, expression evaluation,
  user-supplied regular expressions, or LLM calls.
- Domain-shaped strings such as release gates, requirements, and operational
  spec headings remain Markdown content only; the core engine does not attach
  domain-specific meaning to them.

## Conclusion

BEL-1025 is complete when the recorded validation commands pass and consensus
review approves the final diff.
