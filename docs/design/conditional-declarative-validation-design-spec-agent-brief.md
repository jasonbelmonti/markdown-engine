# Agent Brief: Conditional Declarative Validation Design Spec

You are taking over design-spec authoring for `markdown-engine` conditional declarative validation. Treat this brief as the current source-grounded snapshot and handoff guidance for creating a complete controlled design specification. Do not implement engine changes from this brief.

As of 2026-05-16 America/Chicago:

## Objective

Author a complete `R3` design spec for `markdown-engine.validation@v2` conditional declarative validation so the engine can express conditional structural contracts, ID-family cardinality, column-scoped traceability coverage, and clean public result semantics without weakening valid documents to warnings or duplicating downstream profile files.

The immediate downstream need is the `design-spec` skill validation profile. Its current workaround can validate mandatory structure, but optional Section 4 and Section 15 table checks had to be downgraded to warnings because v1 grammar cannot express "required table OR explicit none/N/A". Section 11 traceability also cannot require every `REQ-*` to appear in the semantically required matrix column.

## Requested Output

Create a complete Markdown design spec using the design-spec skill at:

`/Users/jasonbelmonti/Documents/Development/design-spec/skills/design-spec/SKILL.md`

Suggested output path:

`/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/conditional-validation-grammar-design-brief/docs/design/conditional-declarative-validation-v2-design-spec.md`

The completed spec must follow the controlled template, include Document Control and sections 0 through 18, run the mandatory internal review pass, revise once, and include the Internal Review Record required by the skill.

## Authoritative Sources

- Current thread, 2026-05-16 America/Chicago: User requested a handoff brief for an agent that will author a complete design spec. User also stated there are few consumers, all directly controlled, and clean semantics plus ideal API should be prioritized over preserving the exact v1 result shape for v2.
- Project operating instructions from current thread: Always use Execution Estimation before new work tasks; prefer worktrees under `/.worktrees`; project-management tickets must use `Objective`, `Context / Constraints`, `Materially verifiable success criteria`, and `Execution notes`.
- Existing grammar seed brief: `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/conditional-validation-grammar-design-brief/docs/design/conditional-declarative-validation-grammar-design-brief.md`
- Proposed implementation surface list: `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/conditional-validation-grammar-design-brief/docs/design/conditional-declarative-validation-proposed-files.txt`
- Current v1 public contract: `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/conditional-validation-grammar-design-brief/docs/contracts/declarative-validation.md`
- Existing v1 profile, compiler, selector, assertion, result, evidence, and CLI code under `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/conditional-validation-grammar-design-brief/src/declarative-validation/**` and `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/conditional-validation-grammar-design-brief/src/api/declarative-validation.ts`
- Linear `BEL-1075`: Add `ids.minCount` and `ids.maxCount` to declarative validation.
- Linear `BEL-1076`: Add `tableColumnCoverage` assertion for column-scoped ID coverage.
- Execution estimation: proposed implementation is high blast radius and requires planning before execution. Earlier full proposed implementation estimated `decompose-first`, 13 adjusted story points. A scoped planning artifact estimate still returned `plan-first` because public schema/API contract surfaces are involved.

## Current Status

Planning / PM:
- `BEL-1075` tracks the local ID cardinality slice.
- `BEL-1076` tracks the column-scoped coverage assertion slice.
- No Linear issue has been created yet for grouped rules, `when`, or the full v2 public result contract. The design spec should either propose those issues or include them in a recommended implementation package breakdown.

Design:
- v1 profiles have top-level `rules`; each rule has `id`, optional `severity`, exactly one `select`, and one `assert`.
- v1 supported assertions are `exists`, `sectionsRequired`, `tableColumnsRequired`, `ids`, `references`, `text`, `textOccurrenceCount`, `textLength`, and `frontmatterRequired`.
- v1 `ids.prefix` filters extracted ID tokens before uniqueness checks. It is not a predicate requiring every selected token to match the prefix.
- v1 `references.mustAppearIn` is section-scoped. It cannot require source IDs to appear in a specific table column.
- v1 warning diagnostics can fail a rule result without making aggregate `valid` false.
- The user prefers clean v2 semantics and an ideal API because all known consumers are directly controlled.

Implementation:
- The current worktree is `codex/conditional-validation-grammar-design-brief`.
- Current worktree has untracked planning artifacts only:
  - `docs/design/conditional-declarative-validation-grammar-design-brief.md`
  - `docs/design/conditional-declarative-validation-proposed-files.txt`
- Likely implementation surfaces include:
  - `docs/contracts/declarative-validation.md`
  - `src/api/declarative-validation.ts`
  - `src/declarative-validation/results/index.ts`
  - `src/declarative-validation/evidence/index.ts`
  - `src/declarative-validation/profile/index.ts`
  - `src/declarative-validation/profile/schema.ts`
  - `src/declarative-validation/profile/materialization.ts`
  - `src/declarative-validation/profile/direct-profile-diagnostics.ts`
  - `src/declarative-validation/profile/assertion-schema.ts`
  - `src/declarative-validation/compiler/plan.ts`
  - `src/declarative-validation/compiler/assertion-builders.ts`
  - `src/declarative-validation/compiler/compatibility.ts`
  - `src/declarative-validation/assertions/evaluator.ts`
  - `src/declarative-validation/assertions/ids.ts`
  - `src/declarative-validation/assertions/id-targets.ts`
  - `src/declarative-validation/assertions/references.ts`
  - `src/declarative-validation/selectors/table-targets.ts`
  - validation profile, compiler, assertion, CLI, downstream, contract, and repeatability tests
  - `fixtures/declarative-validation/conditionals/` or a similar conditionals fixture folder

Validation:
- Existing scripts include:
  - `npm run test:validation:profile`
  - `npm run test:validation:compiler`
  - `npm run test:validation:assertions`
  - `npm run test:validation:cli`
  - `npm run test:validation:examples`
  - `npm run test:validation:repeatability`
  - `npm run test:validation:downstream`
  - `npm run docs:declarative-validation-contract`
  - `npm run audit:declarative-validation-boundary`
  - `npm run release:verify`
- The design spec should define which gates are required per implementation slice and before final merge.

## Rigor Calibration Guidance

Review this as `R3`.

Rationale:
- The design changes public profile grammar, serialized API/CLI result shape, diagnostics, evidence content, and compatibility behavior.
- The package is a shared validation engine, and failure can produce false acceptance or false rejection of downstream design-spec documents.
- Rollback is controllable because consumers are directly controlled, but the contract surface is public and high blast radius inside the package.
- Execution estimation flagged high blast radius and planning required.

The design spec should request `Approve with heightened controls`.

## Problem Statement Seed

Downstream validation profiles are unable to express authorized structural alternatives, conditional applicability, ID-family cardinality, and column-scoped traceability because `markdown-engine.validation@v1` only supports flat selector/assertion rules, resulting in warning-only workarounds and broad section-level reference checks that cannot strictly enforce the intended document contracts.

## Proposed Design Direction

Introduce `markdown-engine.validation@v2` while preserving v1 behavior for existing profiles.

The v2 design should cover four behavior groups:

1. Grouped rules with branch-level `anyOf` and possibly `allOf`.
2. Rule-level `when` applicability conditions.
3. `ids.minCount` and `ids.maxCount` cardinality bounds.
4. A new `tableColumnCoverage` assertion for source-ID-to-target-column coverage.

Do not include `not` in the first release unless the design can specify deterministic diagnostics and source evidence without ambiguity.

## Preferred Public Result Semantics

Because consumers are controlled, prefer a clean v2 hierarchical API over forcing conditional semantics into the flat v1 rule result.

Recommended model:

```ts
type RuleStatus = "passed" | "failed" | "skipped";

interface ValidationRuleResultV2 {
  ruleId: string;
  status: RuleStatus;
  passed: boolean;
  diagnostics: MarkdownDiagnostic[];
  when?: ApplicabilityResult;
  evaluation: RuleEvaluationResult;
}

interface ApplicabilityResult {
  status: "matched" | "notMatched";
  diagnostics: MarkdownDiagnostic[];
}

type RuleEvaluationResult =
  | { kind: "assertions"; diagnostics: MarkdownDiagnostic[] }
  | { kind: "anyOf"; selectedBranch?: string; branches: BranchResult[] }
  | { kind: "allOf"; branches: BranchResult[] };

interface BranchResult {
  label?: string;
  status: "passed" | "failed";
  diagnostics: MarkdownDiagnostic[];
}
```

Recommended semantics:
- `passed` remains as a derived compatibility convenience for consumers that only need pass/fail.
- `status: "skipped"` is distinct from `status: "passed"`.
- A failed `when` means the rule does not apply. It should produce `status: "skipped"`, `passed: true`, and no top-level validation diagnostic.
- Successful `anyOf` means the rule passes. Failed branch diagnostics stay nested under `evaluation.branches`; they do not appear in top-level `diagnostics`.
- Failed `anyOf` emits one outcome-bearing summary diagnostic, such as `profile.validation.noAlternativeMatched`; branch diagnostics remain nested for explanation.
- `allOf` fails if any branch fails. The design should choose whether failed branch diagnostics are promoted, summarized, or both, but should keep top-level diagnostics outcome-bearing.
- Top-level result diagnostics should include only diagnostics that determine invalidity or warnings/info that intentionally determine the visible rule outcome.
- Evidence should include the same deterministic nested rule result structure, and the design should explicitly define evidence hash inputs.

## Example v2 Grammar Seeds

Grouped alternative:

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

Applicability condition:

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

ID family count:

```yaml
assert:
  ids:
    prefix: NG
    unique: true
    minCount: 1
```

Column-scoped coverage:

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

## Context / Constraints

- Preserve `markdown-engine.validation@v1` behavior and existing fixtures.
- Use `markdown-engine.validation@v2` for grouped and conditional grammar.
- Keep profile data JSON-safe and closed.
- Unsupported keys must be rejected deterministically.
- Do not introduce regex execution, expression evaluation, callbacks, plugins, network calls, LLM calls, or arbitrary code predicates.
- Keep diagnostics deterministic, source-grounded where possible, and non-fabricated when source ranges are unavailable.
- Do not require downstream profile authors to duplicate large profile files for each rigor level if conditionals can avoid it.
- Do not change Markdown parsing, rich IR extraction, or unrelated CLI behavior unless the design proves it is required.
- Treat branch labels as optional but recommended. If provided, labels should be non-empty and unique within the containing group.
- Keep output ordering deterministic for rules, branches, diagnostics, evidence, and CLI JSON.

## Materially Verifiable Success Criteria For The Design Spec

- [ ] The design spec uses `R3` or explicitly justifies a different rigor level against the R3 triggers.
- [ ] The spec defines v2 grammar for flat assertions, `anyOf`, `allOf` if included, `when`, `ids.minCount`, `ids.maxCount`, and `tableColumnCoverage`.
- [ ] The spec defines public v2 result shape, skipped-rule semantics, branch diagnostics semantics, top-level diagnostic promotion rules, evidence shape, and evidence hash compatibility.
- [ ] The spec preserves v1 behavior and defines how v1 and v2 profile parsing, compiling, validation, CLI JSON, and docs coexist.
- [ ] The spec includes examples for Section 4 table-or-none, Section 15 table-or-N/A, R1 standard-or-replacement traceability, mixed ID family counts, and Section 11 target-column coverage.
- [ ] The spec defines diagnostic codes and source evidence behavior for failed alternatives, skipped applicability, ID count too low/high, missing target section, missing target column, and missing target-column ID coverage.
- [ ] The spec decomposes implementation into reviewable packages with validation gates and stop conditions.
- [ ] The spec includes traceability from `REQ-*` requirements to `FLOW-*` / `FUNC-*` behaviors, `TECH-*` mechanisms, and `VAL-*` verification items.
- [ ] The mandatory design-spec internal review pass is recorded, actionable Blocker/Major findings are addressed, and unresolved issues are captured as `Q-*` or explicit stop conditions.

## Required Design-Spec Content

The full design spec should include at least these requirements:

- `REQ-*`: v2 profiles shall support branch-level alternatives where each branch owns its own selector and assertion payload.
- `REQ-*`: v2 profiles shall support rule-level applicability via `when`.
- `REQ-*`: skipped applicability shall be represented explicitly in rule results.
- `REQ-*`: top-level validation diagnostics shall remain outcome-bearing and shall not include failed branch diagnostics from a successful `anyOf`.
- `REQ-*`: branch diagnostics shall remain inspectable through structured rule results and evidence.
- `REQ-*`: v2 `ids` shall support `minCount` and `maxCount` after prefix filtering and de-duplicated occurrence semantics.
- `REQ-*`: v2 shall support source-ID-to-target-table-column coverage without falling back to whole-section text.
- `REQ-*`: v1 profile behavior, diagnostics, CLI JSON, and fixtures shall remain unchanged.
- `REQ-*`: v2 CLI JSON and API results shall be deterministic and documented.
- `REQ-*`: profile data shall remain inert, JSON-safe, and closed.

## Suggested Implementation Decomposition For The Spec

The design spec should propose implementation packages similar to:

1. Contract and schema foundation:
   - Add v2 syntax versioning, public result contracts, docs, config hardening, and parser/compiler shape tests.
2. ID cardinality:
   - Implement `ids.minCount` and `ids.maxCount`.
   - Tie to `BEL-1075`.
3. Table-column coverage:
   - Implement `tableColumnCoverage`.
   - Tie to `BEL-1076`.
4. Grouped rule evaluation:
   - Implement `anyOf`, branch labels, nested branch results, summary diagnostics, evidence, and repeatability.
5. Applicability:
   - Implement `when`, skipped rule results, applicability result evidence, and CLI/API compatibility.
6. Downstream exercise:
   - Add design-spec-like fixtures proving Section 4, Section 15, mixed ID counts, Section 11 target-column coverage, and R1 replacement matrix behavior.

## Validation Gates To Include In The Design Spec

Minimum targeted gates:

```sh
npm run test:validation:profile
npm run test:validation:compiler
npm run test:validation:assertions
npm run test:validation:cli
npm run test:validation:downstream
npm run test:validation:repeatability
npm run docs:declarative-validation-contract
npm run audit:declarative-validation-boundary
```

Final merge gate:

```sh
npm run release:verify
```

The spec should also require contract tests for v1 unchanged behavior and v2 result-shape stability.

## Agentic Execution Contract

- First action: read the design-spec skill, authoring guide, template, and review process. Then inspect the existing grammar brief, v1 contract, and relevant code paths named in this brief.
- Ownership boundary: author a complete design spec only. Do not implement engine code unless the user explicitly changes scope.
- Required artifact: a complete Markdown design spec with sections 0 through 18 and an Internal Review Record.
- Validation gates for this design-authoring task: verify the spec includes all required template sections, includes stable IDs, includes traceability matrices, records the internal review pass, and resolves or explicitly tracks every Blocker/Major finding.
- Stop conditions: stop before finalizing if result-shape semantics are unresolved, if the chosen rigor level is below R3 without explicit justification, if v1/v2 coexistence is not specified, if branch diagnostic promotion rules are ambiguous, or if any required source is unavailable.

## Confirmed Facts

- Current v1 public result shape only supports `ruleId`, `passed`, and `diagnostics` for each rule result.
- Current declarative validation result includes `valid`, `diagnostics`, `ruleResults`, `profile`, and optional `evidence`.
- Evidence currently clones `ruleResults` and `diagnostics`, so new v2 fields and nested branch results affect deterministic evidence output.
- Current table-cell selectors and table-column ID extraction machinery already exist.
- Current `references` assertion is section-scoped and has extensive tests around source definitions, target sections, duplicate rows, and same-section references.
- Linear issues `BEL-1075` and `BEL-1076` exist and should be cited as related tickets.

## Assumptions / Inferences

- `tableColumnCoverage` should be a new assertion rather than a v2 overload of `references`, because it keeps section-level references and table-column coverage separate.
- `anyOf` should be the minimum grouped-rule feature needed for the motivating downstream cases. `allOf` may be included if it shares the same rule-result model cleanly.
- `not` should remain out of scope for the first v2 release.
- The next agent can assume controlled consumers allow a cleaner v2 API, but the spec should still define migration impact and compatibility for v1 profiles.

## Open Questions / Missing Inputs

- Should `allOf` ship in the first v2 release, or should MVP scope be `anyOf` plus simple assertion rules?
- Should v2 allow nested groups recursively, or only one branch level for deterministic simplicity?
- Should branch diagnostics be nested only in rule results/evidence, or should failed `allOf` branch diagnostics also be promoted to top-level diagnostics?
- Should skipped rules count toward `profile.ruleCount`, and should the result include a separate evaluated-rule count?
- Should `ids.minCount` and `ids.maxCount` count unique comparison values, unique occurrence keys, or raw occurrences? Current recommendation: unique comparison values after prefix filtering and occurrence de-duplication.
- What exact diagnostic codes should be used for missing target section, missing target column, and missing target-column coverage?
- Should grouped-rule branch labels be required for v2, or optional with deterministic generated branch indices?

## Recommended First Steps For The Next Agent

1. Open `/Users/jasonbelmonti/Documents/Development/design-spec/skills/design-spec/SKILL.md`.
2. Read `references/design-doc-template.md`, `references/design-doc-authoring-guide.md`, and `references/design-spec-review-process.md` from the design-spec skill.
3. Inspect `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/conditional-validation-grammar-design-brief/docs/design/conditional-declarative-validation-grammar-design-brief.md`.
4. Inspect `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/conditional-validation-grammar-design-brief/docs/contracts/declarative-validation.md`.
5. Inspect the current result/evidence code paths:
   - `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/conditional-validation-grammar-design-brief/src/api/declarative-validation.ts`
   - `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/conditional-validation-grammar-design-brief/src/api/validate.ts`
   - `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/conditional-validation-grammar-design-brief/src/declarative-validation/results/index.ts`
   - `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/conditional-validation-grammar-design-brief/src/declarative-validation/evidence/index.ts`
6. Draft the complete R3 design spec at the suggested output path.
7. Run the mandatory internal review pass from the design-spec skill, revise once, and record the review result.
