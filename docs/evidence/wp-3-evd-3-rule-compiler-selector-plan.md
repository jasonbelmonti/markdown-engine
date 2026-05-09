# WP-3 EVD-3: Rule Compiler And Selector Plan Evidence

Issue: `BEL-979`
Date: 2026-05-09
Branch: `codex/bel-979-selector-evidence`
Worktree: `.worktrees/bel-979-declarative-validation-wp-3-compiler-selector-plan`

## Objective

Record evidence that declarative validation rules compile into private,
deterministic, data-only plans and that selector resolution covers the v1 public
selector vocabulary over normalized 1.0 `EngineDocument` structures.

## Scope

This evidence covers the WP-3 compiler and selector substrate:

- v1 selector targets: `document`, `section`, `heading`, `table`, `tableRow`,
  `tableCell`, `textSpan`, `link`, `list`, and `frontmatter`.
- v1 compiled assertion plan records: `sectionsRequired`, `sectionOrder`,
  `tableColumnsRequired`, `ids`, `references`, `text`,
  `textOccurrenceCount`, and `frontmatterRequired`.
- selector/assertion compatibility checks before rule evaluation.
- table header ordered-subsequence matching, table row predicates, table cell
  column selection, section-scoped rich IR selection, and frontmatter field
  selection.

This evidence does not claim WP-4 assertion evaluation completeness. The current
assertion evaluator still implements the existing `sectionsRequired` and
`text.contains` without `column` proof paths. Other compiled assertion records,
plus `text.column`, `text.containsExactlyOne`, and `text.excludes`, return a
deterministic unsupported-evaluator diagnostic if routed through
`validateWithProfile` before WP-4 rather than silently passing.

## Private Plan Closure

Compiled rule-plan types remain under
`src/declarative-validation/compiler/**`. The package root exports public
profile parsing and validation APIs, but it does not export
`CompiledDeclarativeValidationPlan`, compiled rule records, or selector result
records.

The compiler creates closed data records only:

- rule ID
- severity after defaulting
- parsed selector data
- assertion plan records with scalar, array, and plain-object fields

Direct typed profile containers, caller-owned arrays, rule metadata, selector
input, and assertion payloads are re-closed before plan creation, and
unsupported selector keys reject compilation rather than entering the private
plan.
The public `validateWithProfile` wrapper also materializes profile data before
reading profile metadata or generating evidence, so accessor-backed typed
profiles return deterministic diagnostics rather than executing profile code.

`tests/declarative-validation-compiler.test.ts` verifies that compiled plans do
not contain functions.

## Selector Compatibility

The compatibility matrix is encoded in
`src/declarative-validation/compiler/compatibility.ts` and verified by compiler
tests:

- document-only assertions reject section selectors before execution.
- column-scoped `text`, `ids`, and `textOccurrenceCount` assertions reject
  non-table selectors before execution.
- frontmatter-required assertions allow document selectors and unfiltered
  frontmatter selectors, but reject filtered frontmatter selectors.

Unsupported selector targets still emit `profile.compile.unsupportedSelector`
when a typed caller bypasses parser closure.

## Public Rich IR And Query Usage

Selector resolution stays on the public 1.0 document substrate:

- `documentQueries.sections()` for section and heading selectors.
- `documentQueries.tables()` plus public `EngineTable.cells` for table, row,
  and cell selectors.
- `documentQueries.textSpans()`, `documentQueries.links()`, and
  `documentQueries.lists()` for span, link, and list selectors.
- `documentQueries.nodes()` and `documentQueries.sourceSlice()` for section
  containment, selected text, and source slices.
- `EngineDocument.frontmatter` for inert frontmatter selection.

The implementation does not traverse raw parser AST, compile profile-provided
regular expressions, execute callbacks, import plugins, read additional files,
call the network, or encode profile-specific semantics.

## Verification

Commands run from
`.worktrees/bel-979-declarative-validation-wp-3-compiler-selector-plan`:

- `npm run typecheck`: pass.
- `npm run test:validation:compiler`: pass, 1 file and 19 tests.
- `npm run test:validation:selectors`: pass, 1 file and 5 tests.
- `npm run test:validation:assertions`: pass, 1 file and 6 tests.

## Result

BEL-979 expands the declarative validation compiler and selector substrate from
the WP-1B proof subset to the v1 selector vocabulary and compatibility matrix.
Compiled plans remain private and data-only, selector resolution uses public
rich IR/query helpers, and the remaining assertion-evaluation breadth is
explicitly documented for WP-4 follow-on work.
