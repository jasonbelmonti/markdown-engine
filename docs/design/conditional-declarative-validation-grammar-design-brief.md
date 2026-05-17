# Design Brief: Conditional Declarative Validation Grammar

You are taking over design work for `markdown-engine` declarative validation grammar. Treat this as a source-grounded seed brief for an actual design spec, not as implementation approval.

As of 2026-05-16 America/Chicago:

## Objective

Improve `markdown-engine` declarative validation precision so downstream profiles can express conditional structural contracts, ID-family cardinality, and column-scoped traceability coverage without weakening valid documents to warnings or splitting into many duplicated profile files.

The immediate pressure comes from the `design-spec` skill validation profile. Its current single-profile workaround can validate mandatory structure, but it cannot precisely encode template-authorized alternatives such as "table exists OR section explicitly says `none`", rigor-specific rules such as R1 replacement traceability, or traceability coverage that requires every `REQ-*` to appear in a specific matrix column. That forced optional Section 4 and Section 15 checks to become warning-only in `jasonbelmonti/design-spec#8`, preserving pass/fail safety but losing strictness, and leaves Section 11 requirements-to-behavior coverage too broad to enforce structurally.

## Authoritative Sources

- Current thread, 2026-05-16: User asked what engine grammar would improve precision, then requested a brief to hand off to the `markdown-engine` maintainer.
- `jasonbelmonti/design-spec#8`, head `2f4f377`: Demonstrates downstream need. The profile now bundles structural validation, but optional Section 4 and Section 15 rules are warnings because v1 grammar lacks conditional alternatives.
- `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/design-spec-validation-profile/docs/contracts/declarative-validation.md`: Current public v1 grammar and result contract.
- `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/design-spec-validation-profile/src/declarative-validation/**`: Current profile schema, compiler, selector, and assertion implementation.
- Execution estimation run on proposed engine files: action `decompose-first`, high blast radius, 13 adjusted story points, heightened controls required.

No `AGENTS.md` was found in the markdown-engine worktree. The markdown-engine worktree was dirty when inspected (`README.md`, `tests/declarative-validation-examples.test.ts`, and untracked `fixtures/declarative-validation/examples/design-spec/`), so do not overwrite those changes without first determining ownership.

## Current Status

Planning / PM:
- No ticket is attached in this thread.
- This brief is a seed for a design, not a request to immediately implement.

Design:
- v1 profiles have top-level `rules`, each with `id`, optional `severity`, one `select`, and one `assert`.
- Supported assertions include `exists`, `sectionsRequired`, `tableColumnsRequired`, `ids`, `references`, `text`, `textOccurrenceCount`, `textLength`, and `frontmatterRequired`.
- `ids.prefix` currently filters extracted ID tokens before uniqueness checks. It is not a predicate requiring every selected token to match the prefix.
- Warning diagnostics can fail a rule result without making aggregate `valid` false.

Implementation:
- Likely surfaces: `docs/contracts/declarative-validation.md`, `src/declarative-validation/profile/**`, `src/declarative-validation/compiler/**`, `src/declarative-validation/assertions/**`, `src/declarative-validation/selectors/**`, validation tests, repeatability cases, and example fixtures.
- Existing scripts include `npm run test:validation:profile`, `test:validation:compiler`, `test:validation:assertions`, `test:validation:cli`, `test:validation:examples`, `test:validation:repeatability`, `docs:declarative-validation-contract`, `audit:declarative-validation-boundary`, and `release:verify`.

Validation:
- Downstream `design-spec` profile currently works, but only by weakening optional table checks to warnings.
- The current profile can require `REQ-*` mentions in broad target sections, but cannot require those IDs to appear in the `Requirement` column of the Section 11 traceability matrix or Section 17 replacement matrix.
- The engine does not currently support branch-level alternatives, rule-level applicability conditions, ID count bounds after prefix filtering, or column-scoped reference targets.

## Core Problem

The v1 grammar can express "run this assertion against this selector." It cannot express:

- A valid document may satisfy one of multiple structurally different paths.
- A rule only applies when another document fact is true.
- A prefix-filtered ID family must contain at least one matching ID.
- A source ID family must appear in a specific target table column, not merely somewhere in a selected section's text.

Because alternatives often require different selectors, assertion-only `anyOf` is insufficient. For example, Section 4 needs to validate either:

- a table target with required columns and optional ID-family checks, or
- a section/text target that explicitly states `none`.

Those cannot share one existing `select`.

Because traceability matrices are columnar contracts, section-level references are also insufficient. For example, Section 11 should be able to require every Section 5 `REQ-*` ID to appear in the Section 11 `Requirement` column. A document should not pass by mentioning the same IDs elsewhere in Section 11 narrative text or in an unrelated column.

## Proposed Grammar Direction

Introduce `markdown-engine.validation@v2` while preserving v1 behavior unchanged. Treat the requested scope as three engine changes:

1. Conditional/grouped validation: branch-level `anyOf` / `allOf` plus rule-level `when`.
2. Prefix-filtered ID cardinality: `ids.minCount` / `ids.maxCount`.
3. Column-scoped reference coverage: source IDs must appear in a configured target table column.

### 1. Branch-level `anyOf` and `allOf`

Prefer a new grouped rule shape that allows each branch to carry its own selector and assertion:

```yaml
syntaxVersion: markdown-engine.validation@v2
documentVersion: 1.0.0
rules:
  - id: section4.constraints-or-none
    anyOf:
      - label: constraints-table
        select:
          target: table
          section: 4. Constraints, Invariants, and Assumptions
          header:
            - ID
            - Type
            - Statement
            - Source or rationale
            - Validation or resolution plan
        assert:
          tableColumnsRequired:
            columns:
              - ID
              - Type
              - Statement
              - Source or rationale
              - Validation or resolution plan
      - label: explicit-none
        select:
          target: textSpan
          section: 4. Constraints, Invariants, and Assumptions
          textIncludes: none
        assert:
          exists: true
```

Recommended semantics:
- `anyOf` passes when at least one branch passes with zero diagnostics.
- `allOf` passes when every branch passes.
- If all `anyOf` branches fail, emit one summary diagnostic such as `profile.validation.noAlternativeMatched`.
- Preserve branch diagnostics in evidence or a structured `causes` field if the public diagnostic/result contract can support it cleanly. Do not flood top-level diagnostics unless a design decision says branch detail is required.
- Branch evaluation and output ordering must be deterministic.
- Branch `label` is optional but recommended for diagnostics and evidence; labels must be non-empty and unique within a group when provided.

Do not include `not` in the first implementation unless the design can specify clear diagnostics and source evidence. `not` is useful but not required to solve the current downstream problem.

### 2. Rule-level `when`

Add applicability conditions so one profile can express rigor-level or document-shape-specific rules:

```yaml
rules:
  - id: r1.traceability.standard-or-replacement
    when:
      select:
        target: tableCell
        section: Document Control
        tableHeader:
          - Field
          - Value
        column: Value
        rowWhere:
          column: Field
          equals: Rigor level
      assert:
        text:
          contains: R1
    anyOf:
      - label: section11-standard
        select:
          target: table
          section: 11. Requirements-to-Behavior Traceability
          header:
            - Requirement
            - Functional behaviors or flows
            - Acceptance coverage
            - Notes
        assert:
          tableColumnsRequired:
            columns:
              - Requirement
              - Functional behaviors or flows
              - Acceptance coverage
              - Notes
      - label: section17-replacement
        select:
          target: table
          section: 17. Verification Strategy and Behavior-to-Mechanism Traceability
          header:
            - Requirement
            - Functional behaviors or flows
            - Acceptance coverage
            - Mechanisms
            - Verification
        assert:
          tableColumnsRequired:
            columns:
              - Requirement
              - Functional behaviors or flows
              - Acceptance coverage
              - Mechanisms
              - Verification
```

Recommended semantics:
- `when` uses the same selector/assertion machinery as validation branches.
- If `when` passes, evaluate the rule.
- If `when` fails by empty selection or assertion failure, skip the rule without producing a validation diagnostic.
- Extend rule results with a deterministic skipped state if needed, for example `{ passed: true, skipped: true, skipReason: "whenNotMatched" }`. If changing public result shape is too large, document the chosen compatibility behavior explicitly.
- Config/compile errors inside `when` remain errors.

### 3. `ids.minCount` and `ids.maxCount`

Extend `ids` so prefix-filtered ID families can require presence:

```yaml
assert:
  ids:
    prefix: NG
    unique: true
    minCount: 1
```

Recommended semantics:
- Apply `prefix` filtering first, as v1 already does.
- `unique` checks duplicates among the filtered token set.
- `minCount` and `maxCount` apply to the filtered token set after duplicate occurrence de-duplication.
- Emit targeted diagnostics such as `profile.validation.idCountTooLow` and `profile.validation.idCountTooHigh`.
- Keep `unique: true` behavior backward-compatible.

This lets downstream profiles enforce "at least one `OBJ-*` and one `NG-*`" in mixed tables without misinterpreting the prefix as a full-column predicate.

### 4. Column-scoped reference coverage

Extend `references` or add a narrowly scoped coverage assertion so profile authors can compare source IDs with a specific target table column. Existing `references` can prove that IDs appear in required target sections, but it cannot prove that they appear in the semantically required traceability column.

One compatible extension direction:

```yaml
assert:
  references:
    idsFrom:
      section: 5. Requirements
      column: ID
      prefix: REQ
    mustAppearIn:
      - section: 11. Requirements-to-Behavior Traceability
        column: Requirement
```

Alternative explicit assertion direction:

```yaml
assert:
  tableColumnCoverage:
    source:
      section: 5. Requirements
      column: ID
      prefix: REQ
    target:
      section: 11. Requirements-to-Behavior Traceability
      column: Requirement
    require: everySourceId
```

Recommended semantics:
- Extract the source ID set using the same token grammar and prefix/case handling as `ids` / `references`.
- Resolve the target section and target table column deterministically. If the target section or column is absent, emit a structural validation diagnostic rather than silently falling back to section text.
- Pass only when every source ID has at least one matching token in the configured target column.
- Do not count source definitions in the same source table as satisfying target coverage unless the target points at that same table intentionally.
- Keep diagnostics source-grounded: missing target column diagnostics should point to the target table or section when available; missing ID diagnostics should point to the source ID definition when available.
- Preserve existing v1 `references.mustAppearIn: string[]` behavior. If extending `references`, use a syntax-versioned v2 shape so old profiles remain valid and old output remains deterministic.

This closes the Section 11 gap: R2/R3 specs, and R1 specs using the standard path, can require every Section 5 `REQ-*` to appear in the Section 11 `Requirement` column. R1 specs using the replacement path can instead require every Section 5 `REQ-*` to appear in the Section 17 replacement matrix `Requirement` column under an `anyOf` / `when` rule.

## Example Design-Spec Rules Enabled

The new grammar should allow the design-spec profile to express these exactly:

- Section 4: constraints/assumptions table exists with correct shape and IDs, or the section explicitly states `none`.
- Section 15: controls mapping table exists, or the section is marked `N/A` with rationale for rigor levels where the template permits it.
- Section 11: standard traceability table exists and every Section 5 `REQ-*` appears in its `Requirement` column, or for permitted R1 documents the Section 17 replacement matrix exists and every Section 5 `REQ-*` appears in its `Requirement` column.
- Mixed ID tables: require at least one `OBJ-*` and one `NG-*`; at least one `FLOW-*` and one `FUNC-*`; optionally one `CON-*` or `ASM-*` unless the explicit `none` path is chosen.
- Rigor-specific strictness: R2/R3 can require controls, rollback, verification, and waiver structures that R0/R1 may mark `N/A` or defer with rationale.

## Context / Constraints

- Preserve `markdown-engine.validation@v1` behavior and existing fixtures.
- Use `markdown-engine.validation@v2` for new grouped/conditional grammar unless the design explicitly chooses a compatible v1 extension and documents older-engine behavior.
- Keep profile data JSON-safe and closed. Unsupported keys must still be rejected deterministically.
- Do not introduce regex execution or arbitrary code predicates.
- Keep diagnostics deterministic, source-grounded where possible, and non-fabricated where source ranges are unavailable.
- Do not require downstream profile authors to duplicate large profile files for every rigor level if conditionals can avoid it.

## Materially Verifiable Success Criteria

- [ ] A v2 profile can express Section 4 "constraints table OR explicit `none`" and validate both passing branches without warnings-as-workaround.
- [ ] A v2 profile can express Section 15 "controls table OR permitted `N/A` rationale" and fail only documents that satisfy neither branch.
- [ ] A v2 profile can apply rules conditionally based on the Document Control `Rigor level` table cell.
- [ ] `ids.minCount` can require at least one matching prefix after current `ids.prefix` filtering semantics.
- [ ] A v2 profile can require every Section 5 `REQ-*` to appear in the Section 11 `Requirement` column for standard traceability.
- [ ] A v2 profile can require every Section 5 `REQ-*` to appear in the Section 17 replacement matrix `Requirement` column when the R1 replacement path is selected.
- [ ] Existing v1 validation fixtures and public behavior continue to pass unchanged.
- [ ] Diagnostics and rule results for grouped rules are deterministic and documented, including all-branches-failed behavior.
- [ ] CLI JSON output remains parseable by existing consumers for v1 profiles; any v2 result-shape extension is documented and covered by contract tests.

## Suggested Decomposition

The execution estimator returned `decompose-first` with high blast radius. Do not implement this as one undifferentiated patch.

Recommended design and implementation slices:

1. Design slice: write the v2 grammar and diagnostic/result semantics before code.
2. ID count slice: implement `ids.minCount` / `ids.maxCount` because it is relatively local and independently useful.
3. Column coverage slice: implement source-ID-to-target-column coverage for `references` or a new `tableColumnCoverage` assertion, including diagnostics and repeatability tests.
4. Grouped rule slice: implement branch-level `anyOf` / `allOf`, branch labels, compiler shape, evaluator behavior, diagnostics, and evidence.
5. Applicability slice: implement rule-level `when` and skipped-rule result semantics.
6. Downstream exercise slice: add a design-spec-style fixture that proves Section 4, Section 15, mixed ID counts, Section 11 target-column coverage, and R1 replacement matrix cases.

## Agentic Execution Contract

- First action: inspect `docs/contracts/declarative-validation.md`, `src/declarative-validation/profile/index.ts`, `src/declarative-validation/profile/schema.ts`, `src/declarative-validation/profile/assertion-schema.ts`, `src/declarative-validation/compiler/plan.ts`, `src/declarative-validation/compiler/assertion-builders.ts`, `src/declarative-validation/assertions/evaluator.ts`, `src/declarative-validation/assertions/references.ts`, and `src/declarative-validation/assertions/id-targets.ts`.
- Ownership boundary: declarative validation grammar, compiler, evaluator, diagnostics, docs, tests, and fixtures. Do not change Markdown parsing, rich IR section/table extraction, or unrelated CLI behavior unless design proves it is required.
- Validation gates: at minimum run targeted validation tests, contract docs check, boundary audit, repeatability proof for affected cases, and then `npm run release:verify` before final merge.
- Stop conditions: stop before implementation if result-shape compatibility is unresolved, if v2 syntax versioning is disputed, if existing dirty worktree changes conflict, or if deterministic diagnostics for failed alternatives cannot be specified cleanly.

## Recommended First Steps

1. Create a design spec or RFC in the markdown-engine repo for `markdown-engine.validation@v2` conditional declarative validation.
2. Add minimal examples for the motivating downstream cases: Section 4 `none`, Section 15 `N/A`, Section 11 target-column traceability, and R1 standard-or-replacement traceability.
3. Decide the public result-shape contract for grouped rules and skipped `when` rules before writing compiler/evaluator code.
4. Only after design approval, implement the smallest vertical slice with fixtures and contract tests.

## Open Questions

- Should grouped branch diagnostics appear in top-level `diagnostics`, only in `evidence`, or in a new structured `causes` field?
- Should `when` produce a `skipped` rule result, or should skipped rules be omitted from `ruleResults`?
- Should v2 allow nested groups recursively, or only one group level for deterministic simplicity?
- Should `allOf` be implemented in the same release as `anyOf`, or should the MVP ship only `anyOf` plus simple rule branches?
- Should `ids.minCount` count unique comparison values or source occurrences? Recommendation: count unique de-duplicated tokens after existing occurrence de-duplication, but confirm in design.
- Should target-column coverage extend the existing `references` assertion, or should it be a new `tableColumnCoverage` assertion to keep section-level references and table-column coverage separate?
