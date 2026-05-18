# Conditional Declarative Validation V2 Execution Specification

## Document Control

| Field | Value |
| --- | --- |
| Title | Conditional Declarative Validation V2 Implementation |
| Status | Draft |
| Execution level | `E2` |
| Execution level justification | The work changes durable public profile grammar, API result types, CLI JSON, diagnostics, evidence payloads, contract docs, fixtures, and release validation for a published local package. It does not qualify for `E1` because execution crosses multiple package boundaries and must be executable by another engineer or agent. It does not trigger `E3` because the package remains local, stateless, reversible before release, and does not change authentication, authorization, cryptography, secret handling, payments, live customer data, regulated workflows, safety controls, irreversible storage, or network operations. The source design nevertheless mandates heightened controls, so this E2 plan applies those controls explicitly. |
| Author(s) | Codex |
| Executor(s) | Markdown-engine implementer or assigned coding agents |
| Reviewers | Project owner, implementation reviewer, independent contract/API reviewer, downstream design-spec profile owner, boundary/security reviewer, CI/docs quality-gate reviewer |
| Decision owner | Project owner |
| Target branch, release, or milestone | `markdown-engine.validation@v2` implementation branch after design and execution-spec approval |
| Last updated | 2026-05-18 |
| Related source docs | `docs/design/conditional-declarative-validation-v2-design-spec.md`; `docs/design/conditional-declarative-validation-design-spec-agent-brief.md`; `docs/design/conditional-declarative-validation-grammar-design-brief.md`; `docs/contracts/declarative-validation.md`; `docs/design/markdown-engine-declarative-validation-syntax-operational-design-spec.md`; `docs/execution/markdown-engine-declarative-validation-syntax-execution-spec.md`; `docs/design/conditional-declarative-validation-proposed-files.txt` |
| Related tickets | `BEL-1075`; `BEL-1076`; follow-up implementation tickets required for grouped rules, rule-level `when`, v2 result contract, downstream design-spec profile exercise, and release-readiness closure before those packages start |

## 0. Execution Summary

Decision requested: Approve to execute

Approved outcome: Execute the `markdown-engine.validation@v2` conditional declarative validation design authorized by `SRC-1`, preserving `markdown-engine.validation@v1` behavior while adding v2 grouped rules, rule-level applicability, ID-family count bounds, table-column coverage, hierarchical result/evidence semantics, deterministic CLI JSON, contract documentation, downstream fixture proof, and release containment.

Execution approach: Use risk retirement first. `WP-1` proves the narrowest v2 critical path through syntax-version dispatch, a v2 flat rule, public result/evidence shape, CLI JSON discrimination, and unchanged v1 compatibility. `WP-2` through `WP-5` then add ID cardinality, table-column coverage, grouped `anyOf`/`allOf`, and `when` skipped semantics under targeted gates. `WP-6` closes pre-merge contract, CLI, repeatability, and boundary evidence before `MS-3`. `WP-7` closes downstream design-spec exercise and release readiness before `MS-4`.

Entry condition: Implementation shall not start until the project owner approves `SRC-1` and this execution specification, and until package-specific tickets exist or are explicitly approved as unnecessary for the work package being started.

Top risks or unknowns:

- RISK-1: V2 public result, CLI JSON, and evidence changes can break consumers that assume flat v1 rule results.
- RISK-2: Nested branch and applicability diagnostics can make aggregate validity too strict or too permissive if promotion rules drift.
- RISK-3: The implementation surface can become an undifferentiated patch across schema, compiler, evaluator, evidence, CLI, docs, and downstream fixtures unless package gates are enforced.

Section status: Complete

## Layer 1: Execution Basis

## 1. Source Authority and Scope

| ID | Source | Authority | Execution implication |
| --- | --- | --- | --- |
| SRC-1 | `docs/design/conditional-declarative-validation-v2-design-spec.md` | R3 design authority with final readiness `Approve with heightened controls`. | Execute v2 grammar, result, diagnostic, evidence, CLI, compatibility, verification, and rollout behavior exactly inside the approved design boundaries. |
| SRC-2 | `docs/design/conditional-declarative-validation-grammar-design-brief.md` | Seed brief documenting the downstream precision gap and recommended decomposition. | Preserve the motivating cases: Section 4 table-or-none, Section 15 table-or-N/A, R1 standard-or-replacement traceability, mixed ID counts, and Section 11 target-column coverage. |
| SRC-3 | `docs/design/conditional-declarative-validation-design-spec-agent-brief.md` | Handoff source recording user preference for clean v2 semantics, controlled consumers, and required implementation surfaces. | Prefer a clean syntax-versioned v2 API/result shape while retaining v1 compatibility and direct-control migration assumptions. |
| SRC-4 | `docs/contracts/declarative-validation.md` | Current public v1 contract for profile syntax, API, CLI, diagnostics, evidence, and boundary non-goals. | V1 parse, compile, validation, diagnostics, CLI JSON, evidence hashes, and fixtures shall remain unchanged unless a project-owner-approved compatibility deviation exists. |
| SRC-5 | `docs/design/markdown-engine-declarative-validation-syntax-operational-design-spec.md` and `docs/execution/markdown-engine-declarative-validation-syntax-execution-spec.md` | Existing design and execution authority for v1 declarative validation architecture, package boundaries, and release gates. | Build v2 on the current local deterministic validation boundary and reuse established command, evidence, and audit patterns. |
| SRC-6 | `docs/design/conditional-declarative-validation-proposed-files.txt` and `SRC-1` execution estimation references | Implementation surface and risk authority. The v2 design records a 38-path, high-blast-radius, `decompose-first`, 13 adjusted story point implementation estimate. | Do not implement as one broad patch; enforce package gates, targeted evidence, independent contract review, and final release verification. |
| SRC-7 | User request on 2026-05-17 to draft an execution spec from `SRC-1` and surrounding docs. | Execution planning request. | Produce an implementation-ready execution artifact before coding starts. |

In scope: V2 syntax-version dispatch; v2 flat rule support; non-recursive `anyOf` and `allOf` branch rules; rule-level `when`; explicit `skipped` rule status; `ids.minCount`; `ids.maxCount`; `tableColumnCoverage`; branch, applicability, ID-count, and coverage diagnostics; v2 result and CLI JSON union; v2 evidence payload and hash compatibility; v1 compatibility verification; contract docs; README or changelog updates required for migration; tests; conditionals fixtures; repeatability proof; boundary audit; downstream design-spec-style exercise; release readiness evidence; rollback and handoff records.

Out of scope: Markdown parser changes, rich IR extraction changes, source-range model changes, unrelated CLI behavior, v1 behavior reinterpretation, `not` groups, recursive groups, regex execution, expression evaluation, callbacks, plugins, imports, network calls, LLM calls, file watching, persistence, design-spec domain semantics in core engine code, and silent v1-to-v2 profile upgrades.

Definition of done: The implementation branch contains approved v2 public contract updates, source changes, tests, fixtures, evidence, and release controls; v1 validation behavior remains unchanged; v2 profiles can express the motivating conditional and coverage cases; API, CLI, and evidence output are deterministic; milestone approvals are recorded before merge and release; and final release verification passes or the release is explicitly contained.

Re-decision boundaries: Changing the approved v2 result shape, aggregate validity rule, diagnostic promotion rule, evidence hash inputs, syntax-version model, `tableColumnCoverage` compatibility model, ID count semantics, v1 compatibility requirement, `not` exclusion, branch recursion exclusion, or local deterministic boundary requires project-owner review and an approved `DEV-*` record before execution continues.

Section status: Complete

## 2. Objectives and Non-Objectives

| ID | Statement | Completion horizon | Evidence |
| --- | --- | --- | --- |
| OBJ-1 | Deliver a v2 declarative grammar that expresses structurally different valid alternatives in one profile rule. | Before merge | EVD-1 / EVD-4 / EVD-8 |
| OBJ-2 | Deliver rule-level applicability so one profile can encode rigor-specific or document-shape-specific rules without profile duplication. | Before merge | EVD-5 / EVD-8 |
| OBJ-3 | Deliver deterministic ID-family cardinality checks after prefix filtering and occurrence de-duplication. | `BEL-1075` package approval and before merge | EVD-2 |
| OBJ-4 | Deliver source-ID-to-target-table-column coverage without falling back to whole-section text. | `BEL-1076` package approval and before merge | EVD-3 / EVD-8 |
| OBJ-5 | Preserve v1 profile parsing, validation, diagnostics, CLI JSON, evidence, fixtures, examples, downstream tests, and contract behavior unchanged. | Every package gate and before merge | EVD-1 / EVD-6 / EVD-9 |
| OBJ-6 | Deliver clean v2 public result, CLI JSON, and evidence semantics that distinguish failed, passed, and skipped rules with deterministic nested branch evidence. | Before merge and release readiness | EVD-1 / EVD-4 / EVD-5 / EVD-6 / EVD-7 |
| NG-1 | This execution will not change Markdown parsing, rich IR extraction, table extraction, source-range calculation, or unrelated CLI behavior. | Throughout execution | EVD-7 / EVD-9 |
| NG-2 | This execution will not introduce regex execution, expression evaluation, callbacks, plugins, network calls, LLM calls, file watching, persistence, or arbitrary code predicates. | Boundary review | EVD-7 |
| NG-3 | This execution will not include `not` groups, recursive branch groups, or nested `when` clauses in the first v2 release. | Grammar and contract review | EVD-1 / EVD-6 |
| NG-4 | This execution will not encode design-spec, AGENTS.md, TASK.md, or other downstream domain semantics in core engine code. | Boundary and downstream review | EVD-7 / EVD-8 |
| NG-5 | This execution will not remove, reinterpret, silently upgrade, or otherwise change v1 profiles. | Compatibility review | EVD-1 / EVD-6 / EVD-9 |

Section status: Complete

## 3. Ownership, Roles, and Decision Points

| Role or person | Responsibility | Required action |
| --- | --- | --- |
| Project owner | Approves source authority, execution entry, deviations, public compatibility decisions, milestone gates, release readiness, and final execution outcome. | Approve |
| Markdown-engine implementer | Executes work packages, keeps edits inside package boundaries, records evidence, and escalates blockers. | Execute |
| Implementation reviewer | Reviews source changes, tests, fixtures, snapshots, diagnostics, package boundaries, and traceability to this spec. | Review |
| Independent contract/API reviewer | Reviews public v2 grammar, TypeScript result types, CLI JSON union, diagnostic codes, evidence fields, compatibility notes, and migration guidance. | Review |
| Downstream design-spec profile owner | Verifies motivating downstream cases work without warning-only workarounds or profile duplication. | Review |
| Boundary/security reviewer | Confirms v2 profile data remains inert local data and excludes executable predicates, regex execution, network, LLM, persistence, and domain semantics. | Review |
| CI/docs quality-gate reviewer | Verifies package scripts, CLI behavior, docs gates, release verification, and evidence artifacts are reviewable by automation consumers. | Review |
| CI and coding-agent consumers | Consume documented validation JSON and migration notes. | Inform |

Decision points:

- DP-1: Entry approval before implementation starts.
- DP-2: `MS-1` approval of the v2 proving slice before feature packages start.
- DP-3: `MS-2` approval of ID cardinality and table-column coverage before grouped/applicability work can merge.
- DP-4: `MS-3` approval of grouped rules, `when`, result/evidence, contract, and boundary completeness before final merge.
- DP-5: `MS-4` release readiness approval before tag, publish, downstream adoption claim, or completion claim.

Escalation path: Any v1 compatibility regression, unresolved public contract disagreement, branch diagnostic promotion ambiguity, evidence nondeterminism, forbidden dependency, rich IR change requirement, boundary audit failure, downstream false acceptance, package gate without evidence, or shared-file contention stops the affected work package and escalates to the project owner with a `DEV-*` proposal, source design revision, or rejection path.

Section status: Complete

## 4. Constraints, Assumptions, and Dependencies

| ID | Type | Statement | Owner | Blocking? | Validation or resolution plan |
| --- | --- | --- | --- | --- | --- |
| CON-1 | Constraint | V2 grammar shall be selected only by `syntaxVersion: markdown-engine.validation@v2`; v1 profiles shall not silently opt into v2 behavior. | Implementer | No | Prove through `VAL-1`, `VAL-2`, `VAL-10`, and contract docs. |
| CON-2 | Invariant | V1 declarative validation parse, compile, validation, diagnostics, CLI JSON, evidence, fixtures, examples, downstream behavior, and contract text shall remain unchanged except additive documentation that explicitly preserves v1. | Implementer | No | Run v1 gates at `MS-1`, `MS-3`, and `MS-4`; record EVD-1, EVD-6, and EVD-9. |
| CON-3 | Constraint | V2 profile input remains closed, JSON-safe, deterministic, and inert at top-level, rule, branch, `when`, selector, assertion, and nested assertion object boundaries. | Implementer | No | Validate unsupported, regex-like, executable-like, and direct-object cases through `VAL-2` and `VAL-12`. |
| CON-4 | Constraint | Top-level diagnostics shall remain outcome-bearing and shall not include failed branch diagnostics from a successful `anyOf`. | Implementer | No | Validate promotion behavior through `VAL-6`, `VAL-8`, and `VAL-9`. |
| CON-5 | Invariant | Evidence output shall clone the same deterministic v2 nested rule-result structure exposed through API and CLI result contracts. | Implementer | No | Validate through `VAL-8`, `VAL-9`, and `VAL-11`. |
| CON-6 | Constraint | Package gates are non-optional because `SRC-1` records high blast radius and `decompose-first` estimation for the implementation surface. | Project owner / Implementer | No | Enforce `MS-1` through `MS-4`, `CTRL-1`, and `VAL-14`. |
| ASM-1 | Assumption | Known consumers are directly controlled and can adopt a clean syntax-versioned v2 result shape while existing v1 profiles stay on the v1 result shape. | Project owner | No | Validate with contract review and downstream exercise in `VAL-10`, `VAL-11`, and `VAL-13`. |
| ASM-2 | Assumption | Existing table-cell selectors and table-column ID extraction machinery are sufficient for `tableColumnCoverage` without changing rich IR. | Implementer | No | Prove in `WP-3` and `VAL-5`; stop for design revision if false. |
| ASM-3 | Assumption | One non-recursive branch level is enough for the first v2 release. | Project owner / Downstream owner | No | Prove through motivating fixtures in `VAL-13`; future recursion requires a new design. |
| DEP-1 | Dependency | Project-owner approval of `SRC-1` and this execution spec is required before implementation starts. | Project owner | Yes | Record approval before `WP-1`; until resolved, section 18 remains `Not ready`. |
| DEP-2 | Dependency | Implementation tickets or approved no-ticket decisions are required before starting grouped rules, `when`, v2 result contract, downstream exercise, and release-readiness packages. | Project owner | Yes for corresponding package starts | Create/update tickets before `WP-1`, `WP-4`, `WP-5`, `WP-6`, and `WP-7` start, or record project-owner approval to execute from this spec alone. |
| DEP-3 | Dependency | 1.0 rich IR table, section, selector, source-target, and document-version behavior shall remain available and compatible. | Implementer | No for `WP-1`; Yes before `WP-3` and downstream exercise | Verify through existing rich IR and validation tests; any substrate gap triggers `CTRL-6`. |

Section status: Complete

## Layer 2: Execution Plan

## 5. Evidence-Led Execution Model

Observable outcome: A consumer can validate one Markdown document with either a v1 or v2 declarative profile, receive syntax-versioned deterministic API/CLI JSON and evidence, use v2 to express structural alternatives, applicability, ID count bounds, and target-column coverage, and continue using v1 profiles without observable behavior changes.

Core value proposition: Downstream profile owners can encode strict document contracts in one reusable profile instead of weakening optional alternatives to warnings, duplicating profile files, or relying on broad section-text traceability checks.

Critical path hypothesis: If one v2 flat-rule profile can pass through profile materialization, syntax-version dispatch, closed schema validation, rule compilation, selector resolution, assertion evaluation, diagnostic aggregation, public result/evidence serialization, CLI JSON discrimination, and v1 compatibility gates without changing the v1 contract, then the remaining v2 features can be added as controlled extensions without reopening the architecture.

First proving slice: `WP-1` implements the smallest v2 vertical slice: `markdown-engine.validation@v2` profile parsing for a flat `select` plus `assert` rule, one reused assertion path, the v2 `status`/`passed`/`evaluation.kind: "assertions"` result shape, v2 profile counts, evidence cloning for that shape, CLI JSON discrimination, contract skeleton, and unchanged v1 fixture proof. It intentionally excludes `anyOf`, `allOf`, `when`, ID count bounds, and `tableColumnCoverage`.

Sequencing principle: Retire public contract, compatibility, evidence, and diagnostic-shape risks before feature breadth. After the v2 shell proves the critical path, add local assertion extensions (`WP-2`, `WP-3`) before grouped and applicability control flow (`WP-4`, `WP-5`), close pre-merge contract and boundary evidence (`WP-6`), then close downstream and release evidence (`WP-7`).

Validation cadence: Each `WP-*` produces one or more `EVD-*` artifacts before dependent work starts. `MS-1` is due before feature packages; `MS-2` is due before grouped/applicability work merges; `MS-3` is due before final merge; `MS-4` is due before release, tag, publication, downstream adoption claim, or completion claim.

Deferred completeness: Recursive groups, `not` predicates, non-JSON output formats, generalized downstream profile packages, public compiled-plan exports, parser/rich-IR changes, generated API-doc polish, and package publication are deferred until the v2 proving slice, feature packages, downstream exercise, and release gates pass.

Primary risks and unknowns:

| ID | Risk or unknown | Why it matters | Owner | Evidence required to retire | Decision gate |
| --- | --- | --- | --- | --- | --- |
| RISK-1 | V2 public result, CLI JSON, and evidence changes can break consumers that assume flat v1 rule results. | Machine consumers depend on stable JSON and evidence; uncontrolled shape drift makes validation output unreliable. | Contract/API reviewer / Implementer | VAL-1 / VAL-8 / VAL-10 / VAL-11 / EVD-1 / EVD-6 | MS-1 / MS-3 |
| RISK-2 | Nested branch and applicability diagnostics can make aggregate validity too strict or too permissive if promotion rules drift. | Failed alternatives must remain inspectable without invalidating successful alternatives or hiding failed groups. | Implementer / Contract reviewer | VAL-6 / VAL-7 / VAL-8 / VAL-9 / EVD-4 / EVD-5 / EVD-7 | MS-3 |
| RISK-3 | The 38-path implementation surface can exceed review capacity if shipped as one broad patch. | Broad undifferentiated changes obscure compatibility regressions and boundary drift. | Project owner / Implementer | VAL-14 / package evidence / milestone approvals | MS-1 / MS-4 |
| RISK-4 | `tableColumnCoverage` can accidentally fall back to whole-section text or require a rich IR change. | The motivating traceability gap is specifically column-scoped; whole-section fallback preserves false acceptance. | Implementer / Downstream owner | VAL-5 / VAL-13 / EVD-3 / EVD-8 | MS-2 / MS-4 |
| RISK-5 | `ids.minCount` and `ids.maxCount` can be confused between raw occurrences, occurrence keys, and unique comparison values. | Incorrect count semantics would falsely accept or reject mixed-ID tables. | Implementer | VAL-4 / EVD-2 | MS-2 |
| RISK-6 | V2 nested structures can reopen executable or profile-specific data paths. | Conditional validation must not create a scripting, regex, plugin, network, LLM, or domain-semantic boundary. | Boundary/security reviewer / Implementer | VAL-2 / VAL-12 / EVD-7 | MS-3 / MS-4 |

Section status: Complete

## 6. Change Surface Inventory

| ID | Surface | Change type | Owner | Read/write boundary | Review expectation |
| --- | --- | --- | --- | --- | --- |
| SURF-1 | `docs/contracts/declarative-validation.md`, `README.md`, `CHANGELOG.md`, `SECURITY.md` where needed | Docs / Contract | Implementer | Writable for v2 grammar, result, CLI, evidence, compatibility, migration, and boundary notes; v1 contract text must remain explicitly preserved. | Contract/API review in `REV-1`; docs quality review in `REV-5`. |
| SURF-2 | `src/api/declarative-validation.ts`, `src/index.ts`, `src/declarative-validation/results/index.ts`, `src/declarative-validation/evidence/index.ts` | Code / Contract | Implementer | Writable for syntax-versioned public API types, result/evidence union, validation orchestration, and package-root exports. | Public API and compatibility review in `REV-1` / `REV-2`. |
| SURF-3 | `src/declarative-validation/profile/**` | Code / Schema | Implementer | Writable for v2 schema, branch shape, `when`, assertion extensions, syntax dispatch, JSON-safe closure, direct-object diagnostics, and unsupported-key coverage. | Schema and boundary review in `REV-2` / `REV-4`. |
| SURF-4 | `src/declarative-validation/compiler/**` | Code / Schema | Implementer | Writable for v2 compiled plan unions, flat/group/applicability plan builders, selector/assertion compatibility, and deterministic branch order. | Compiler and package-boundary review in `REV-2`. |
| SURF-5 | `src/declarative-validation/assertions/**`, `src/declarative-validation/selectors/**`, `src/declarative-validation/diagnostics/**` | Code / Diagnostics | Implementer | Writable for ID count semantics, table-column coverage, grouped/applicability evaluation, diagnostic construction, source evidence, and deterministic ordering. | Assertion, diagnostic, and boundary review in `REV-2` / `REV-4`. |
| SURF-6 | `src/cli/**` | Code / CLI Contract | Implementer | Writable for v2 validation-result JSON union, profile-stage behavior preservation, and CLI tests; unrelated parse/normalize CLI behavior remains out of scope. | CLI contract review in `REV-1` / `REV-5`. |
| SURF-7 | `tests/**`, `fixtures/declarative-validation/**`, `snapshots/**` where applicable | Test / Evidence | Implementer | Writable for targeted v1/v2 compatibility, schema, compiler, assertion, diagnostics, CLI, downstream, contract, examples, and repeatability coverage. | Validation evidence review in `REV-2` / `REV-5`. |
| SURF-8 | `scripts/**`, `package.json`, TypeScript configs, release scripts | Config / Release | Implementer | Writable only for required docs checks, boundary audit updates, targeted test commands, and release verification wiring. | Release and boundary review in `REV-4` / `REV-5`. |
| SURF-9 | `docs/evidence/**` | Docs / Evidence | Implementer | Writable for package evidence, milestone approvals, repeatability, boundary, downstream exercise, rollback, release readiness, and handoff records. | Milestone and release review in `REV-3` / `REV-5`. |
| SURF-10 | Markdown parser, rich IR extraction, source-range calculation, unrelated fixed validation rule families | Code / Contract | Implementer | Read-only by default; writable only through approved `DEV-*` if `WP-3` proves a substrate gap that cannot be solved through public v1/v2 validation boundaries. | Project-owner approval and adjacent-boundary review required before any edit. |

Section status: Complete

## 7. Agent-Focused Package Decomposition

Decomposition mission: Constrain implementation agents to public contract, schema/compiler, evaluator/assertion, validation evidence, and release-harness boundaries so v2 value is delivered without v1 regression, executable profile behavior, rich IR drift, or shared-file contention.

| ID | Unit | Ladder level | Mission | Observable value enabled | Risk retired | Public interface | Validation command | Promotion blockers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PKG-1 | Public v2 API, result, evidence, CLI JSON, and contract boundary | 4 | Own syntax-versioned public contract, exported types/functions, CLI JSON union, evidence fields, and migration docs. | Consumers can distinguish v1 and v2 outputs and migrate without private imports. | RISK-1 / RISK-2 | Package-root API exports, `docs/contracts/declarative-validation.md`, CLI JSON contract. | `npm run test:validation:contract && npm run test:validation:cli && npm run docs:declarative-validation-contract` | Public shape changes require `MS-3`; release blocked until `MS-4`. |
| PKG-2 | V2 profile schema and compiler plan boundary | 2 | Own v2 syntax dispatch, closed schema, branch/applicability shape validation, unsupported-key handling, and internal compiled plan records. | Valid v2 profiles become deterministic closed plans while unsafe or invalid profiles fail before evaluation. | RISK-1 / RISK-3 / RISK-6 | Internal parsed profile and compiled plan APIs consumed by public validation orchestration. | `npm run test:validation:profile && npm run test:validation:compiler` | Compiled plans must remain internal; no parser dependency or executable config without approval. |
| PKG-3 | Selector, assertion, diagnostic, and evaluation semantics | 2 | Own ID count evaluation, table-column coverage, branch/applicability evaluation, diagnostic promotion, source evidence, and deterministic ordering. | V2 rules produce correct outcomes and source-grounded diagnostics without domain semantics. | RISK-2 / RISK-4 / RISK-5 / RISK-6 | Internal evaluator consumed by `PKG-1`; public output is result/evidence through `PKG-1`. | `npm run test:validation:assertions && npm run test:validation:diagnostics && npm run test:validation:selectors` | Rich IR edits, whole-section fallback for column coverage, or fabricated source ranges block promotion. |
| PKG-4 | Test fixtures, downstream exercise, and repeatability evidence | 2 | Own v1/v2 fixtures, conditionals examples, downstream design-spec exercise, contract tests, CLI tests, and repeatability proof. | Reviewers can inspect behavior before merge and release. | RISK-1 / RISK-2 / RISK-3 / RISK-4 / RISK-5 | Test commands and fixture data; no runtime API beyond public package use. | `npm run test:validation:downstream && npm run test:validation:repeatability` | Synthetic tests that do not exercise public API/CLI or motivating cases block promotion. |
| PKG-5 | Boundary audit, release harness, rollback, and handoff evidence | 2 | Own boundary scripts, release verification wiring, evidence files, milestone records, rollback notes, and handoff packet. | Maintainers can decide merge/release from evidence instead of implementation claims. | RISK-3 / RISK-6 | Package scripts, audit reports, release evidence, and handoff docs. | `npm run audit:declarative-validation-boundary && npm run release:verify` | Automated gates cannot replace human milestone approvals; missing evidence blocks promotion. |

### Package Boundary Card: PKG-1

Ladder level: 4

Mission: Public v2 API, result, evidence, CLI JSON, and contract boundary.

Value / risk trace:

- Observable value enabled: Consumers receive documented syntax-versioned v1/v2 API, CLI, and evidence output.
- Risk retired: RISK-1 / RISK-2
- Validation evidence: VAL-1 / VAL-8 / VAL-10 / VAL-11 / EVD-1 / EVD-6
- Blocking unknowns: None in design; public output changes still require `MS-3`.

Owns:

- Files/directories: `docs/contracts/declarative-validation.md`; `README.md`; `CHANGELOG.md`; `SECURITY.md` if affected; `src/api/declarative-validation.ts`; `src/index.ts`; `src/declarative-validation/results/index.ts`; `src/declarative-validation/evidence/index.ts`; `src/cli/**`.
- Concepts: syntax-versioned public result types, v2 rule result shape, profile counts, evidence fields, CLI JSON union, migration notes, public diagnostic code documentation.
- Runtime responsibilities: Public validation orchestration and serialization boundaries that call internal schema/compiler/evaluator packages with explicit inputs.

Does not own:

- Explicitly excluded behavior: schema traversal internals, compiled-plan internals, assertion algorithms, selector traversal internals, boundary audit scripts, downstream profile semantics.
- Responsibilities delegated elsewhere: schema/compiler to `PKG-2`, evaluation semantics to `PKG-3`, fixtures/repeatability to `PKG-4`, release evidence to `PKG-5`.

Public interface:

- Exported types: v1 and v2 validation profile/result/evidence types, config-error result, CLI JSON union, diagnostic-related types already public by contract.
- Exported functions/classes/components: `parseValidationProfile`, `validateWithProfile`, package-root exports approved by `SRC-1`.
- Events/messages/contracts: profile diagnostic codes, validation diagnostic codes, evidence hash fields, CLI exit-code semantics.
- CLI/API surface: `markdown-engine validate --file <markdown-file> --profile <profile-file> [--format json]`.

Allowed dependencies:

- May import: public document, diagnostic, validation, serializer, stable JSON, internal schema/compiler/evaluator entry points.
- May call: deterministic local validation helpers with explicit arguments.
- May read configuration from: function arguments and CLI arguments only.

Forbidden dependencies:

- Must not import: downstream design-spec profile code, runtime/MCP/agent packages, network, database, browser, LLM, or private deep imports from test fixtures.
- Must not call: shell commands, plugin loaders, network services, LLM APIs, file traversal outside caller-provided CLI paths.
- Must not know about: design-spec section semantics beyond generic examples and docs.

State boundary:

- Owns state: invocation-local result and evidence assembly.
- Reads state: supplied `EngineDocument`, parsed profile, explicit options, CLI argument values.
- Mutates state: none outside local result objects.
- Persistence responsibility: none.

Agent ownership boundary:

- Agent editable paths: `docs/contracts/declarative-validation.md`; `README.md`; `CHANGELOG.md`; `SECURITY.md`; `src/api/declarative-validation.ts`; `src/index.ts`; `src/declarative-validation/results/index.ts`; `src/declarative-validation/evidence/index.ts`; `src/cli/**`.
- Agent read-only paths: `src/declarative-validation/profile/**`; `src/declarative-validation/compiler/**`; `src/declarative-validation/assertions/**`; `src/declarative-validation/selectors/**`; existing v1 fixtures unless a work package grants writes.
- Required coordination before editing: any `src/api/**` or CLI change that requires schema/compiler/evaluator behavior not yet owned by the active work package.

Validation command: `npm run test:validation:contract && npm run test:validation:cli && npm run docs:declarative-validation-contract`

Promotion blockers: Public v2 result ambiguity, v1 result drift, undocumented CLI JSON, missing migration notes, or evidence hash ambiguity.

### Package Boundary Card: PKG-2

Ladder level: 2

Mission: V2 profile schema and compiler plan boundary.

Value / risk trace:

- Observable value enabled: Profile authors can submit valid v2 grammar while invalid or unsafe grammar fails deterministically before evaluation.
- Risk retired: RISK-1 / RISK-3 / RISK-6
- Validation evidence: VAL-2 / VAL-3 / EVD-1 / EVD-4 / EVD-5
- Blocking unknowns: None; rich IR substrate edits are prohibited unless `CTRL-6` fires.

Owns:

- Files/directories: `src/declarative-validation/profile/**`; `src/declarative-validation/compiler/**`.
- Concepts: syntax dispatch, v2 profile/rule/branch/applicability schema, unsupported-key precedence, internal compiled plan records, selector/assertion compatibility.
- Runtime responsibilities: Convert inert profile data into closed parsed profiles and internal compiled plans or deterministic diagnostics.

Does not own:

- Explicitly excluded behavior: public CLI output, public evidence serialization, assertion evaluation algorithms, selector target extraction, downstream semantics.
- Responsibilities delegated elsewhere: public contract to `PKG-1`, evaluation to `PKG-3`, fixtures to `PKG-4`.

Public interface:

- Exported types: Public parsed profile types only when approved through `PKG-1`; compiled plan types remain internal.
- Exported functions/classes/components: internal parser/compiler entry points.
- Events/messages/contracts: config and compile diagnostics.
- CLI/API surface: none directly; consumed by `PKG-1`.

Allowed dependencies:

- May import: plain-record and JSON-safe helpers, diagnostic builders, public profile selector/assertion types, compiler compatibility helpers.
- May call: deterministic schema and compile helper functions.
- May read configuration from: parsed profile input only.

Forbidden dependencies:

- Must not import: CLI runtime, evidence serialization runtime, assertion evaluator internals except declared assertion shape types, downstream profile/domain modules, network/LLM/plugin packages.
- Must not call: assertion evaluation, file IO, network IO, dynamic imports, regex compilation from profile input.
- Must not know about: design-spec rules other than generic grammar examples.

State boundary:

- Owns state: invocation-local parse diagnostics and compiled plan objects.
- Reads state: profile input and supported grammar constants.
- Mutates state: none outside local construction.
- Persistence responsibility: none.

Agent ownership boundary:

- Agent editable paths: `src/declarative-validation/profile/**`; `src/declarative-validation/compiler/**`; related profile/compiler tests when assigned by a work package.
- Agent read-only paths: `src/api/declarative-validation.ts`; `src/declarative-validation/assertions/**`; `src/declarative-validation/evidence/index.ts`; `src/cli/**`.
- Required coordination before editing: public exported profile type names, diagnostic code additions, or compatibility changes visible to `PKG-1`.

Validation command: `npm run test:validation:profile && npm run test:validation:compiler`

Promotion blockers: Exported compiled plans, unsupported executable keys, schema recursion beyond `SRC-1`, silent v1 behavior changes, or unresolved invalid-shape diagnostics.

### Package Boundary Card: PKG-3

Ladder level: 2

Mission: Selector, assertion, diagnostic, and evaluation semantics.

Value / risk trace:

- Observable value enabled: V2 rules evaluate deterministically and produce source-grounded diagnostics for ID counts, column coverage, grouped alternatives, and applicability.
- Risk retired: RISK-2 / RISK-4 / RISK-5 / RISK-6
- Validation evidence: VAL-4 / VAL-5 / VAL-6 / VAL-7 / VAL-8 / EVD-2 / EVD-3 / EVD-4 / EVD-5
- Blocking unknowns: `ASM-2` must hold before `tableColumnCoverage` can complete.

Owns:

- Files/directories: `src/declarative-validation/assertions/**`; `src/declarative-validation/selectors/**`; `src/declarative-validation/diagnostics/**`.
- Concepts: assertion evaluation, ID token counting, table-column coverage, branch and applicability evaluation, diagnostic promotion, source-range use, deterministic diagnostic ordering.
- Runtime responsibilities: Evaluate compiled plans against selected public document targets and return outcome-bearing diagnostics plus nested explanatory diagnostics.

Does not own:

- Explicitly excluded behavior: public result type declarations, CLI JSON, schema validation, compiled plan construction, fixture authoring beyond evaluator-specific fixtures.
- Responsibilities delegated elsewhere: public contract to `PKG-1`, schema/compiler to `PKG-2`, tests/fixtures to `PKG-4`.

Public interface:

- Exported types: none beyond internal evaluator records approved by compiler/API packages.
- Exported functions/classes/components: internal evaluator functions consumed by API orchestration.
- Events/messages/contracts: validation diagnostic codes through `PKG-1` docs.
- CLI/API surface: none directly.

Allowed dependencies:

- May import: public document/query types, compiled assertion/plan types, selector result records, diagnostic builders, stable ordering helpers.
- May call: selector resolution helpers and assertion-specific pure evaluators.
- May read configuration from: compiled plans and selected document targets.

Forbidden dependencies:

- Must not import: public CLI runtime, docs fixtures, downstream profile packages, raw parser ASTs, network/LLM/plugin packages.
- Must not call: file IO, network IO, dynamic plugins, profile-supplied regex execution, design-spec semantic classifiers.
- Must not know about: downstream section names except in fixtures owned by `PKG-4`.

State boundary:

- Owns state: invocation-local evaluation diagnostics and nested branch/applicability results.
- Reads state: compiled plans and resolved selectors.
- Mutates state: none outside local result construction.
- Persistence responsibility: none.

Agent ownership boundary:

- Agent editable paths: `src/declarative-validation/assertions/**`; `src/declarative-validation/selectors/**`; `src/declarative-validation/diagnostics/**`; targeted assertion/diagnostic tests when assigned.
- Agent read-only paths: `src/declarative-validation/profile/**`; `src/declarative-validation/compiler/**`; `src/api/**`; docs contracts unless assigned through `PKG-1`.
- Required coordination before editing: selector compatibility changes, diagnostic code additions, table target semantics, or any proposed rich IR edit.

Validation command: `npm run test:validation:assertions && npm run test:validation:diagnostics && npm run test:validation:selectors`

Promotion blockers: Whole-section fallback for `tableColumnCoverage`, fabricated source ranges, domain-specific assertion semantics, nondeterministic ordering, or aggregate validity drift.

### Package Boundary Card: PKG-4

Ladder level: 2

Mission: Test fixtures, downstream exercise, and repeatability evidence.

Value / risk trace:

- Observable value enabled: Reviewers can inspect real pass/fail behavior for v1 compatibility and v2 motivating cases before merge.
- Risk retired: RISK-1 / RISK-2 / RISK-3 / RISK-4 / RISK-5
- Validation evidence: VAL-1 through VAL-14 / EVD-1 through EVD-9
- Blocking unknowns: None; missing downstream fixture proof blocks release readiness.

Owns:

- Files/directories: `tests/**` validation files; `tests/support/declarative-validation-repeatability.ts`; `fixtures/declarative-validation/conditionals/**`; validation snapshots where applicable.
- Concepts: acceptance fixtures, fail/pass examples, CLI JSON snapshots, repeatability cases, downstream design-spec exercise.
- Runtime responsibilities: none in package runtime; tests exercise public API and CLI.

Does not own:

- Explicitly excluded behavior: production implementation semantics, public contract decisions, release approval.
- Responsibilities delegated elsewhere: source behavior to `PKG-1` through `PKG-3`, release evidence to `PKG-5`.

Public interface:

- Exported types: none.
- Exported functions/classes/components: test support helpers only.
- Events/messages/contracts: expected JSON and evidence snapshots.
- CLI/API surface: exercised but not owned.

Allowed dependencies:

- May import: public package API, CLI helpers only where existing tests already use them, test support utilities, fixture loaders.
- May call: npm validation commands and local CLI entry points through tests.
- May read configuration from: fixtures and test-local profiles.

Forbidden dependencies:

- Must not import: private implementation modules solely to make tests pass unless existing package testing pattern requires it and reviewer approves.
- Must not call: network services, external profile sources, LLMs, file watching, persistent stores.
- Must not know about: implementation internals as assertions when public behavior can be asserted.

State boundary:

- Owns state: test-local temp files, fixture contents, evidence documents.
- Reads state: repository fixtures and generated build output during tests.
- Mutates state: only test outputs and approved snapshots/evidence.
- Persistence responsibility: none outside repository fixtures/evidence.

Agent ownership boundary:

- Agent editable paths: `tests/declarative-validation*.test.ts`; `tests/support/**`; `fixtures/declarative-validation/conditionals/**`; validation snapshots where approved.
- Agent read-only paths: production `src/**` unless the active work package grants code edits.
- Required coordination before editing: snapshot updates, fixture contract changes, or test assertions that imply public contract changes.

Validation command: `npm run test:validation:downstream && npm run test:validation:repeatability`

Promotion blockers: Tests that only assert private internals, missing false-acceptance fixtures, missing deterministic repeatability coverage, or lack of v1 regression coverage.

### Package Boundary Card: PKG-5

Ladder level: 2

Mission: Boundary audit, release harness, rollback, and handoff evidence.

Value / risk trace:

- Observable value enabled: Maintainers can make merge and release decisions from evidence, rollback notes, and audit output.
- Risk retired: RISK-3 / RISK-6
- Validation evidence: VAL-10 / VAL-12 / VAL-14 / EVD-6 / EVD-7 / EVD-9
- Blocking unknowns: None; missing approvals keep final readiness `Not ready`.

Owns:

- Files/directories: `scripts/check-declarative-validation-boundary.mjs`; docs check scripts if affected; `package.json` scripts; `docs/evidence/**`.
- Concepts: boundary audit patterns, release verification command wiring, milestone evidence, rollback containment, handoff record.
- Runtime responsibilities: none in library runtime; scripts run during validation/release.

Does not own:

- Explicitly excluded behavior: production validation semantics, public grammar decisions, source code package boundaries.
- Responsibilities delegated elsewhere: runtime changes to `PKG-1` through `PKG-3`, fixtures to `PKG-4`.

Public interface:

- Exported types: none.
- Exported functions/classes/components: none.
- Events/messages/contracts: audit output, docs gate output, release readiness records.
- CLI/API surface: release scripts only.

Allowed dependencies:

- May import: Node standard library, existing audit helper patterns, repository-local scripts.
- May call: npm scripts and local node scripts.
- May read configuration from: repository files and package scripts.

Forbidden dependencies:

- Must not import: runtime validation modules into docs/evidence artifacts, external network dependencies, LLM APIs, browser automation.
- Must not call: destructive git commands, package publish commands, network uploads, or external services as part of validation evidence.
- Must not know about: downstream domain semantics except as evidence labels for public fixtures.

State boundary:

- Owns state: generated evidence markdown and audit records.
- Reads state: repository source, tests, package scripts.
- Mutates state: docs/evidence and approved package script/audit script files.
- Persistence responsibility: evidence artifacts committed to the repository.

Agent ownership boundary:

- Agent editable paths: `scripts/check-declarative-validation-boundary.mjs`; docs check scripts if affected; `package.json`; `docs/evidence/**`.
- Agent read-only paths: production `src/**`, tests, fixtures unless assigned by a work package.
- Required coordination before editing: package script changes, release verification changes, or audit pattern changes that affect existing gates.

Validation command: `npm run audit:declarative-validation-boundary && npm run release:verify`

Promotion blockers: Missing human approvals, missing rollback notes, failing boundary audit, undocumented script changes, or release verification failure.

Dependency direction rules:

- Allowed direction: `PKG-1` may call declared entry points from `PKG-2` and `PKG-3`; `PKG-2` may depend on public profile/diagnostic helpers; `PKG-3` may consume compiled plan types from `PKG-2`; `PKG-4` may exercise public API/CLI and targeted internal helpers only by existing test convention; `PKG-5` may inspect all packages but must not become runtime dependency.
- Prohibited imports: runtime source must not import tests, fixtures, docs, evidence, audit scripts, downstream profile packages, network/LLM/plugin packages, or raw parser ASTs as public contracts.
- Allowed cross-boundary communication: typed parsed profiles, compiled plan records, resolved selector records, validation diagnostics, public result/evidence records.
- Disallowed cross-boundary communication: private deep imports across peer packages, implicit shared mutable state, profile-supplied executable behavior, domain-specific semantic callbacks.

State boundary rules:

- Package-owned state: invocation-local parse, compile, evaluation, result, and evidence objects.
- Package-read state: supplied Markdown-derived `EngineDocument`, caller profile input, explicit options, repository fixtures during tests.
- Package-mutated state: none in runtime; docs/evidence and snapshots only during approved validation work.
- Persistence ownership: no runtime persistence; evidence artifacts live under `docs/evidence/**`.

Reusable package candidates:

| Candidate | Current level | Reuse rationale | Required decoupling | Promotion trigger |
| --- | --- | --- | --- | --- |
| V2 validation result/evidence model | 4 inside published package | Public package consumers rely on the shape through package exports and CLI JSON. | Keep syntax-version discrimination, docs, compatibility review, and release policy explicit. | Already public when released; any breaking change requires semver review. |
| Table-column coverage evaluator | 2 | Could be useful across profiles inside this package. | Remove product-specific section names and require explicit selector/config inputs. | Two or more generic profile examples use it without design-spec semantics. |
| Boundary audit rules | 2 | Useful for future validation syntax expansions. | Keep audit patterns grammar-agnostic and documented. | Future syntax release reuses the audit without source changes. |

Coupling tripwires:

- A v2 package requires knowledge of another package's private file layout.
- Two independent agents must edit the same source file in parallel.
- V2 result or evidence code needs to know design-spec section semantics.
- `tableColumnCoverage` uses section text fallback instead of configured target-column tokens.
- Branch diagnostics appear in top-level diagnostics for successful `anyOf`.
- Profile schema accepts regex-like or executable-like keys at a nested v2 boundary.
- Rich IR source files require edits to satisfy the v2 design.
- Package validation requires only `npm run release:verify` when a targeted command should catch the change earlier.

N/A rationale: Not applicable. Code, contracts, schema, package boundaries, CLI contracts, tests, and release scripts are affected, so package decomposition is required.

Section status: Complete

## 8. Work Packages and Sequencing

Planning strategy: Risk retirement followed by progressive value. Prove the public v2 shell and v1 compatibility first, then add local assertion features, then grouped/applicability control flow, then downstream/release evidence.

Critical path hypothesis: One v2 flat profile can traverse parse, schema, compile, selector, evaluator, result, evidence, CLI, and v1 compatibility without changing v1 behavior.

First proving slice: `WP-1` creates the minimal v2 flat-rule vertical slice and compatibility harness.

Validation cadence: Each work package produces named `EVD-*` evidence and targeted command output before the next dependent package starts.

Deferred completeness: Recursive groups, `not`, non-JSON formats, design-spec-specific core semantics, generalized downstream profile packaging, public compiled-plan exports, and public release are deferred.

| ID | Objective | Owner | Package boundary | Editable paths | Read-only paths | Inputs | Outputs | Dependencies | Observable value enabled | Risk retired | Milestone gate | Validation checkpoint | Completion criteria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WP-1 | Implement v2 contract-first proving slice with flat rule support, v2 result/evidence shell, CLI JSON discrimination, and unchanged v1 compatibility proof. | Implementer | PKG-1 / PKG-2 / PKG-3 / PKG-4 | `docs/contracts/declarative-validation.md`; `src/api/declarative-validation.ts`; `src/declarative-validation/results/index.ts`; `src/declarative-validation/evidence/index.ts`; `src/declarative-validation/profile/**`; `src/declarative-validation/compiler/**`; `src/declarative-validation/assertions/**` only for reused flat assertion path; `src/cli/**`; targeted tests/fixtures | `SRC-1` through `SRC-6`; rich IR/parser internals; existing v1 evidence files | Approved design, current v1 contract, current API/result/evidence code, proposed files list | `EVD-1`; v2 shell tests; v1 compatibility output; docs skeleton | DEP-1 / DEP-2 | A reviewer can see a minimal syntax-versioned v2 result and evidence path without v1 drift. | RISK-1 / RISK-3 / RISK-6 | MS-1 | VAL-1 / VAL-2 / VAL-3 / VAL-8 / VAL-10 / VAL-11 / VAL-14 | V2 flat rule path passes targeted tests, v1 compatibility gates pass unchanged, CLI JSON discriminates v1/v2/profile-stage results, and project owner approves `MS-1`. |
| WP-2 | Implement `ids.minCount` and `ids.maxCount` for `BEL-1075`. | Implementer | PKG-2 / PKG-3 / PKG-4 | `src/declarative-validation/profile/assertion-schema.ts`; `src/declarative-validation/profile/index.ts`; `src/declarative-validation/compiler/assertions.ts`; `src/declarative-validation/compiler/assertion-builders.ts`; `src/declarative-validation/compiler/assertion-shapes.ts`; `src/declarative-validation/assertions/ids.ts`; `src/declarative-validation/assertions/id-targets.ts`; targeted tests/fixtures/evidence | `src/api/declarative-validation.ts`; CLI runtime except result compatibility checks; rich IR/parser internals | WP-1 v2 shell, `BEL-1075`, ID token and duplicate semantics | `EVD-2`; targeted ID count fixtures and diagnostics | WP-1 / MS-1 | Mixed ID tables can require at least or at most one prefix-filtered family without treating prefix as a full-column predicate. | RISK-5 | MS-2 | VAL-4 / VAL-14 | Counts apply to unique comparison values after prefix filtering and occurrence de-duplication; duplicate-ID behavior remains compatible. |
| WP-3 | Implement `tableColumnCoverage` for `BEL-1076` without whole-section fallback. | Implementer | PKG-2 / PKG-3 / PKG-4 | `src/declarative-validation/profile/assertion-schema.ts`; `src/declarative-validation/profile/index.ts`; `src/declarative-validation/compiler/assertions.ts`; `src/declarative-validation/compiler/assertion-builders.ts`; `src/declarative-validation/compiler/assertion-shapes.ts`; `src/declarative-validation/assertions/references.ts`; `src/declarative-validation/assertions/id-targets.ts`; new or existing coverage evaluator under `src/declarative-validation/assertions/**`; `src/declarative-validation/selectors/table-targets.ts` only if needed; targeted tests/fixtures/evidence | Rich IR/parser internals; unrelated selector behavior; CLI runtime except public output checks | WP-1 v2 shell, `BEL-1076`, current table selectors and ID targets | `EVD-3`; target-column coverage fixtures and structural diagnostics | WP-1 / MS-1; coordinate after WP-2 if shared assertion schema files are in flight | Source IDs must appear in the configured target table column, and mentions elsewhere do not satisfy coverage. | RISK-4 | MS-2 | VAL-5 / VAL-14 | Missing target section, missing target column, and missing target-column ID diagnostics are deterministic and source-grounded where possible; no rich IR change is required. |
| WP-4 | Implement non-recursive `anyOf` and `allOf` grouped rule evaluation with nested branch results and diagnostic promotion rules. | Implementer | PKG-1 / PKG-2 / PKG-3 / PKG-4 | `src/declarative-validation/profile/**`; `src/declarative-validation/compiler/**`; `src/declarative-validation/assertions/evaluator.ts`; `src/declarative-validation/assertions/diagnostics.ts`; `src/declarative-validation/results/index.ts`; `src/declarative-validation/evidence/index.ts`; docs/tests/fixtures/evidence | CLI argument parser except result serialization; rich IR/parser internals | WP-1 result/evidence shell, design branch semantics | `EVD-4`; grouped-rule fixtures and result/evidence snapshots | WP-1 / MS-1; WP-2 and WP-3 may be merged first to reduce shared schema churn | A profile can express structurally different valid alternatives in one rule. | RISK-2 / RISK-3 | MS-3 | VAL-2 / VAL-3 / VAL-6 / VAL-8 / VAL-9 / VAL-14 | Successful `anyOf` keeps failed branch diagnostics nested; failed groups emit one deterministic top-level summary diagnostic; branch order is stable. |
| WP-5 | Implement rule-level `when`, matched/not-matched applicability, explicit skipped results, and skipped evidence semantics. | Implementer | PKG-1 / PKG-2 / PKG-3 / PKG-4 | `src/declarative-validation/profile/**`; `src/declarative-validation/compiler/**`; `src/declarative-validation/assertions/evaluator.ts`; `src/declarative-validation/results/index.ts`; `src/declarative-validation/evidence/index.ts`; docs/tests/fixtures/evidence | Rich IR/parser internals; downstream profile code | WP-1 result/evidence shell, WP-4 nested result conventions if merged first | `EVD-5`; applicability fixtures and skipped result snapshots | WP-1 / MS-1; coordinate with WP-4 on shared nested result model | One profile can encode rigor-specific or document-shape-specific rules without profile duplication. | RISK-1 / RISK-2 / RISK-6 | MS-3 | VAL-3 / VAL-7 / VAL-8 / VAL-9 / VAL-14 | Non-matching `when` produces `status: "skipped"`, `passed: true`, `evaluation.kind: "skipped"`, skipped counts, nested `when` diagnostics, and no top-level diagnostics. |
| WP-6 | Complete pre-merge v2 contract docs, CLI parity, repeatability, and boundary audit evidence. | Implementer / Contract reviewer / Boundary reviewer | PKG-1 / PKG-4 / PKG-5 | `docs/contracts/declarative-validation.md`; `README.md`; `SECURITY.md`; `src/cli/**` if parity gaps remain; `tests/**`; `scripts/**`; `package.json`; `docs/evidence/**` | Production implementation files except bug fixes approved by `DEV-*`; rich IR/parser internals; downstream exercise fixtures except read-only motivating examples | WP-1 through WP-5 outputs, contract review comments, boundary review comments | `EVD-6`; `EVD-7`; pre-merge contract, CLI, repeatability, and boundary evidence | WP-2 through WP-5 and MS-2 prerequisites | Maintainers can approve or reject final implementation merge from complete public contract and boundary evidence without waiting for release-only downstream proof. | RISK-1 / RISK-2 / RISK-3 / RISK-6 | MS-3 | VAL-1 / VAL-2 / VAL-8 / VAL-9 / VAL-10 / VAL-11 / VAL-12 / VAL-14 | Contract docs pass, CLI parity passes, v1 compatibility remains intact, repeatability proves deterministic v2 API/CLI/evidence, and boundary audit passes before `MS-3`. |
| WP-7 | Complete downstream design-spec exercise, release readiness, rollback notes, and handoff evidence. | Implementer / Downstream owner / CI-docs quality reviewer | PKG-4 / PKG-5 | `README.md`; `CHANGELOG.md`; `fixtures/declarative-validation/conditionals/**`; `tests/**`; `scripts/**`; `package.json`; `docs/evidence/**` | Production implementation files except bug fixes approved by `DEV-*`; rich IR/parser internals | WP-1 through WP-6 outputs, `MS-3` approval, downstream motivating profile cases | `EVD-8`; `EVD-9`; downstream exercise and release-readiness handoff | WP-6 / MS-3 | Maintainers can decide release, containment, and downstream adoption from complete downstream proof and release verification. | RISK-1 / RISK-3 / RISK-4 / RISK-6 | MS-4 | VAL-1 / VAL-13 / VAL-14 | Downstream exercise passes/fails expected cases, release verification passes, rollback and handoff evidence are recorded, and project owner approves `MS-4`. |

Execution sequence:

1. Resolve `DEP-1` and package-ticket `DEP-2`.
2. Execute `WP-1`; stop for `MS-1` approval before feature packages start.
3. Execute `WP-2` and `WP-3` serially when they share assertion schema/compiler files; allow parallel fixture drafting only if editable paths are disjoint.
4. Stop for `MS-2` approval after ID cardinality and table-column coverage evidence.
5. Execute `WP-4` and `WP-5` serially unless `PKG-1` result/evidence interfaces are frozen and editable paths are disjoint.
6. Execute `WP-6`; stop for `MS-3` approval before final merge.
7. Execute `WP-7`; stop for `MS-4` before release, tag, publication, downstream adoption claim, or completion claim.

Parallelization rules: Parallel work is allowed only after `MS-1` and only for disjoint editable paths. No two agents may edit the same source file concurrently. Fixture-only work may proceed in parallel with implementation only when it consumes already-approved public contracts and cannot force contract changes without a coordination trigger.

Integration points: `WP-1` establishes v2 public result/evidence and schema dispatch; `WP-2` and `WP-3` integrate through assertion schema/compiler/evaluator contracts; `WP-4` and `WP-5` integrate through nested result/evidence contracts; `WP-6` integrates implementation packages through CLI, docs, repeatability, and boundary gates; `WP-7` integrates approved packages through downstream and release gates.

Coordination triggers: Public type changes, diagnostic code changes, evidence hash input changes, shared assertion schema edits, selector compatibility changes, CLI JSON changes, fixture expectation changes, or package script changes require affected package owners to pause and confirm the interface before continuing. Any rich IR edit requires `CTRL-6`.

Section status: Complete

## 9. Milestone Gates and Manual Verification

| ID | Gate objective | Covered work | Due point | Human verifier | Prerequisites | Review gate | Required evidence | Approval decision | Failure path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MS-1 | Approve the v2 critical-path proving slice and v1 compatibility baseline. | OBJ-5 / OBJ-6 / SURF-1 through SURF-7 / PKG-1 through PKG-4 / WP-1 | Before `WP-2`, `WP-3`, `WP-4`, or `WP-5` starts | Project owner with independent contract/API reviewer | VAL-1 / VAL-2 / VAL-3 / VAL-8 / VAL-10 / VAL-11 / EVD-1 at `docs/evidence/conditional-v2-evd-1-proving-slice.md` | REV-1 / REV-2 | EVD-1 at `docs/evidence/conditional-v2-evd-1-proving-slice.md` | Approve / Reject / Conditional approval | Stop feature packages, fix or redesign v2 shell, and record `DEV-*` if public contract or compatibility changes. |
| MS-2 | Approve local assertion extension packages for ID cardinality and table-column coverage. | OBJ-3 / OBJ-4 / SURF-3 through SURF-7 / PKG-2 through PKG-4 / WP-2 / WP-3 | Before grouped/applicability implementation can merge and before final merge | Implementation reviewer and downstream design-spec profile owner | VAL-4 / VAL-5 / EVD-2 at `docs/evidence/conditional-v2-evd-2-id-count-bounds.md` / EVD-3 at `docs/evidence/conditional-v2-evd-3-table-column-coverage.md` | REV-2 / REV-3 | EVD-2 at `docs/evidence/conditional-v2-evd-2-id-count-bounds.md` / EVD-3 at `docs/evidence/conditional-v2-evd-3-table-column-coverage.md` | Approve / Reject / Conditional approval | Stop grouped/applicability merge, fix assertion semantics, or return to design if rich IR changes are required. |
| MS-3 | Approve grouped rules, `when`, v2 result/evidence, public contract, and boundary completeness before final merge. | OBJ-1 / OBJ-2 / OBJ-5 / OBJ-6 / SURF-1 through SURF-8 / PKG-1 through PKG-5 / WP-4 / WP-5 / WP-6 | Before final implementation merge | Project owner, independent contract/API reviewer, boundary/security reviewer | VAL-1 / VAL-2 / VAL-3 / VAL-6 / VAL-7 / VAL-8 / VAL-9 / VAL-10 / VAL-11 / VAL-12 / EVD-4 at `docs/evidence/conditional-v2-evd-4-grouped-rules.md` / EVD-5 at `docs/evidence/conditional-v2-evd-5-when-skipped-rules.md` / EVD-6 at `docs/evidence/conditional-v2-evd-6-contract-cli-compatibility.md` / EVD-7 at `docs/evidence/conditional-v2-evd-7-repeatability-boundary.md` | REV-1 / REV-2 / REV-4 / REV-5 | EVD-4 / EVD-5 / EVD-6 / EVD-7 at section 12 registry paths | Approve / Reject / Conditional approval | Block merge, resolve diagnostics/result/boundary findings, and rerun affected package gates. |
| MS-4 | Approve release readiness, downstream proof, rollback containment, and handoff. | All objectives / SURF-1 through SURF-9 / PKG-1 through PKG-5 / WP-7 | Before release, tag, publication, downstream adoption claim, or completion claim | Project owner with downstream design-spec profile owner and CI/docs quality-gate reviewer | VAL-1 through VAL-14 / EVD-1 through EVD-9 at section 12 registry paths / successful `npm run release:verify` | REV-1 through REV-5 | EVD-8 at `docs/evidence/conditional-v2-evd-8-downstream-design-spec-exercise.md` / EVD-9 at `docs/evidence/conditional-v2-evd-9-release-readiness-handoff.md` | Approve / Reject / Conditional approval | Do not release or claim completion; contain to v1, fix package, or record approved rollback/deviation. |

Manual verification guide:

| Step ID | Milestone | Operator action | Expected result | Evidence artifact |
| --- | --- | --- | --- | --- |
| MV-1 | MS-1 | Run `npm run test:validation:profile`, `npm run test:validation:compiler`, `npm run test:validation:contract`, and `npm run test:validation:cli`; paste command results plus one v1 and one v2 representative validation JSON excerpt into `docs/evidence/conditional-v2-evd-1-proving-slice.md`. | All commands pass; the v2 excerpt shows `status`, derived `passed`, `evaluation.kind: "assertions"`, profile counts, and evidence; the v1 excerpt retains the v1 flat rule-result shape. | EVD-1 at `docs/evidence/conditional-v2-evd-1-proving-slice.md` |
| MV-2 | MS-1 | Run `npm run docs:declarative-validation-contract`; inspect `docs/contracts/declarative-validation.md` sections for v1 preservation, v2 discrimination, flat-rule result semantics, CLI JSON, and evidence fields; record inspection notes in EVD-1. | Docs gate passes; contract explicitly preserves v1, defines v2 as syntax-versioned, and keeps unimplemented v2 feature breadth assigned to later work packages. | EVD-1 at `docs/evidence/conditional-v2-evd-1-proving-slice.md` |
| MV-3 | MS-2 | Run `npm run test:validation:compiler` and `npm run test:validation:assertions`; inspect the `BEL-1075` cases for `ids.minCount`, `ids.maxCount`, duplicate filtered IDs, and case sensitivity; record command output and fixture names in `docs/evidence/conditional-v2-evd-2-id-count-bounds.md`. | ID count cases pass and prove counts use unique comparison values after prefix filtering and occurrence de-duplication; existing duplicate-ID behavior remains intact. | EVD-2 at `docs/evidence/conditional-v2-evd-2-id-count-bounds.md` |
| MV-4 | MS-2 | Run `npm run test:validation:compiler`, `npm run test:validation:selectors`, `npm run test:validation:assertions`, and the column-coverage subset in `npm run test:validation:downstream`; record command output and fixture names in `docs/evidence/conditional-v2-evd-3-table-column-coverage.md`. | Coverage fails when IDs are absent from the configured target column, not when they appear elsewhere in the section; missing target section and missing target column diagnostics are deterministic and source-grounded where possible. | EVD-3 at `docs/evidence/conditional-v2-evd-3-table-column-coverage.md` |
| MV-5 | MS-3 | Run `npm run test:validation:profile`, `npm run test:validation:compiler`, `npm run test:validation:assertions`, `npm run test:validation:diagnostics`, and `npm run test:validation:repeatability`; record grouped-rule fixture names, representative result JSON, and command output in `docs/evidence/conditional-v2-evd-4-grouped-rules.md`. | Successful `anyOf` has no top-level failed-branch diagnostics; failed `anyOf` and failed `allOf` each emit one top-level summary diagnostic and retain nested branch diagnostics in deterministic order. | EVD-4 at `docs/evidence/conditional-v2-evd-4-grouped-rules.md` |
| MV-6 | MS-3 | Run `npm run test:validation:profile`, `npm run test:validation:compiler`, `npm run test:validation:assertions`, `npm run test:validation:diagnostics`, and `npm run test:validation:repeatability`; record matched and not-matched `when` fixture names, representative skipped result JSON, and command output in `docs/evidence/conditional-v2-evd-5-when-skipped-rules.md`. | Non-matching applicability returns `status: "skipped"`, `passed: true`, skipped counts, nested `when` diagnostics, and no top-level diagnostics. | EVD-5 at `docs/evidence/conditional-v2-evd-5-when-skipped-rules.md` |
| MV-7 | MS-3 | Run `npm run test:validation:contract`, `npm run test:validation:cli`, `npm run docs:declarative-validation-contract`, `npm run test:validation:repeatability`, and `npm run audit:declarative-validation-boundary`; record command output in EVD-6 and EVD-7. | Contract, CLI, docs, repeatability, and boundary gates pass; boundary audit reports no executable predicates, regex execution, network/LLM/persistence behavior, or domain-specific core semantics. | EVD-6 at `docs/evidence/conditional-v2-evd-6-contract-cli-compatibility.md` / EVD-7 at `docs/evidence/conditional-v2-evd-7-repeatability-boundary.md` |
| MV-8 | MS-4 | Run `npm run test:validation:downstream` and `npm run test:validation:examples`; inspect `fixtures/declarative-validation/conditionals/**` for Section 4, Section 15, R1 traceability, mixed ID counts, and Section 11/17 column-coverage pass/fail cases; record fixture names and results in `docs/evidence/conditional-v2-evd-8-downstream-design-spec-exercise.md`. | Valid alternatives pass without warning-only workarounds; documents satisfying neither branch fail with documented diagnostics; false acceptance cases are represented. | EVD-8 at `docs/evidence/conditional-v2-evd-8-downstream-design-spec-exercise.md` |
| MV-9 | MS-4 | Run `npm run release:verify`; inspect EVD-1 through EVD-8 for required approval records; record release verification output, rollback decision, milestone approvals, and handoff notes in `docs/evidence/conditional-v2-evd-9-release-readiness-handoff.md`. | Full release gate passes; rollback containment, milestone approvals, unresolved follow-ups, exact branch or commit, and handoff evidence are complete. | EVD-9 at `docs/evidence/conditional-v2-evd-9-release-readiness-handoff.md` |

Section status: Complete

## 10. Execution Controls and Drift Management

| ID | Trigger | Required action | Owner | Evidence |
| --- | --- | --- | --- | --- |
| CTRL-1 | A work package attempts to combine unrelated schema, compiler, evaluator, CLI, docs, and downstream fixture changes without package evidence. | Stop the package, split by this spec's `WP-*` boundaries, and rerun targeted estimation if the new scope is materially different. | Implementer / Project owner | DEV-* or updated package plan; VAL-14 evidence |
| CTRL-2 | V1 output, diagnostics, CLI JSON, evidence hashes, examples, or fixtures change. | Stop and classify as regression or explicit compatibility decision; continue only with project-owner-approved `DEV-*`. | Implementer | EVD-1 or EVD-6 delta review |
| CTRL-3 | Branch or applicability diagnostics appear in top-level diagnostics contrary to `SRC-1`. | Stop grouped/applicability work and repair promotion rules before proceeding. | Implementer / Contract reviewer | EVD-4 / EVD-5 |
| CTRL-4 | V2 profile schema accepts regex-like, executable-like, plugin, import, callback, network, LLM, or domain-specific keys. | Stop and add schema closure and boundary audit coverage before continuing. | Boundary/security reviewer / Implementer | EVD-7 |
| CTRL-5 | `tableColumnCoverage` requires whole-section fallback, parser changes, or rich IR changes. | Stop `WP-3`, escalate to project owner, and either revise design or record approved `DEV-*`; do not silently broaden coverage semantics. | Implementer | EVD-3 / DEV-* if approved |
| CTRL-6 | Any work package needs to edit rich IR, parser, source-range, or unrelated fixed validation code. | Pause implementation, run adjacent-boundary review, document why public query/selectors cannot solve it, and require project-owner approval. | Implementer / Project owner | DEV-* and adjacent review record |
| CTRL-7 | Evidence or repeatability output is nondeterministic across repeated runs. | Stop release preparation, isolate ordering/hash input drift, fix before merge, and rerun repeatability. | Implementer | EVD-7 / EVD-9 |
| CTRL-8 | Two agents need the same editable path for separate work packages. | Serialize the work or redesign boundaries before edits; do not merge parallel changes without integration owner review. | Implementation reviewer | Updated execution note or DEV-* |
| CTRL-9 | A milestone due point arrives without required evidence or human approval. | Block dependent work, merge, release, or completion claim until approval or rejection is recorded. | Project owner | MS approval record |

Deviation rules: Any approved departure from source authority, package boundaries, milestone requirements, v1 compatibility, diagnostic promotion rules, evidence hash inputs, boundary exclusions, or validation gates shall be recorded as `DEV-*` with owner, approver, rationale, impact, and evidence before merge or release.

Pause or escalation conditions: unresolved `DEP-*`; failed v1 compatibility; failed boundary audit; failed repeatability; ambiguous result/evidence contract; rich IR edit requirement; downstream false acceptance; missing milestone evidence; release verification failure; or unapproved public contract change.

Section status: Complete

## 11. Data, Schema, Config, and Contract Handling

| Change | Impact | Compatibility | Reversibility | Validation |
| --- | --- | --- | --- | --- |
| `markdown-engine.validation@v2` syntax version | Adds a syntax-versioned profile contract for v2 behavior. | Additive; v1 profiles remain on v1 parser and behavior. | Reversible before public release; semver-controlled after release. | VAL-1 / VAL-2 / VAL-10 / VAL-11 |
| V2 flat, `anyOf`, `allOf`, and `when` rule shape | Adds branch and applicability grammar with one-level branch depth. | Additive for v2; invalid in v1. | Reversible before release; breaking after release without semver review. | VAL-2 / VAL-3 / VAL-6 / VAL-7 |
| `ids.minCount` and `ids.maxCount` | Adds count bounds after prefix filtering and occurrence de-duplication. | Additive for v2; v1 `ids` shape unchanged. | Reversible before release. | VAL-4 |
| `tableColumnCoverage` | Adds source-ID-to-target-column coverage. | Additive for v2; v1 `references.mustAppearIn` remains section-scoped. | Reversible before release. | VAL-5 / VAL-13 |
| V2 result shape with `status`, `passed`, `when`, `evaluation`, branch results, and counts | Changes public output for v2 only and introduces syntax-version-discriminated union. | V1 result shape unchanged; v2 consumers must branch on `profile.syntaxVersion`. | Reversible before release; semver-controlled after release. | VAL-8 / VAL-10 / VAL-11 |
| V2 evidence with nested rule results and top-level diagnostics | Adds evidence payload for v2 nested result structure. | V1 evidence unchanged; v2 hashes follow documented inputs. | Reversible before release; semver-controlled after release. | VAL-8 / VAL-9 |
| V2 diagnostic codes | Adds public v2 validation diagnostics for alternatives, groups, ID counts, and coverage. | Additive; existing v1 diagnostic codes unchanged. | Reversible before release. | VAL-6 / VAL-7 / VAL-10 |
| CLI JSON union for v1, v2, and profile-stage failures | Allows CLI consumers to receive documented v2 JSON after profile compilation. | V1 CLI JSON unchanged; profile-stage failure shape preserved. | Reversible before release. | VAL-11 |
| Boundary audit and release scripts | Extends audit/docs gates for v2 nested surfaces. | Existing release gates remain; v2 checks are additive. | Reversible before release. | VAL-12 / VAL-14 |

N/A rationale: Not applicable. Data, schema, config, API, CLI, evidence, and contract surfaces are affected.

Section status: Complete

## Layer 3: Validation, Release, and Handoff

## 12. Validation and Evidence Plan

| ID | Method | Claim verified | Timing | Owner | Evidence artifact |
| --- | --- | --- | --- | --- | --- |
| VAL-1 | Test | Existing v1 declarative validation profile, compiler, assertion, CLI, examples, downstream, repeatability, and contract tests pass unchanged. | Every package gate, pre-merge, pre-release | Implementer | EVD-1 at `docs/evidence/conditional-v2-evd-1-proving-slice.md`; EVD-6 at `docs/evidence/conditional-v2-evd-6-contract-cli-compatibility.md`; EVD-9 at `docs/evidence/conditional-v2-evd-9-release-readiness-handoff.md` |
| VAL-2 | Test | V2 parser/schema accepts valid flat/grouped/applicability profiles and rejects unsupported, recursive, ambiguous, regex-like, and executable-like shapes. | Pre-merge | Implementer | EVD-1 at `docs/evidence/conditional-v2-evd-1-proving-slice.md`; EVD-4 at `docs/evidence/conditional-v2-evd-4-grouped-rules.md`; EVD-5 at `docs/evidence/conditional-v2-evd-5-when-skipped-rules.md`; EVD-7 at `docs/evidence/conditional-v2-evd-7-repeatability-boundary.md` |
| VAL-3 | Test | Compiler produces closed v2 plans for flat rules, `anyOf`, `allOf`, and `when`, with deterministic compile diagnostics for invalid shapes. | Pre-merge | Implementer | EVD-1 at `docs/evidence/conditional-v2-evd-1-proving-slice.md`; EVD-4 at `docs/evidence/conditional-v2-evd-4-grouped-rules.md`; EVD-5 at `docs/evidence/conditional-v2-evd-5-when-skipped-rules.md` |
| VAL-4 | Test | `ids.minCount` and `ids.maxCount` apply to unique comparison values after prefix filtering and occurrence de-duplication. | Before MS-2 and pre-merge | Implementer | EVD-2 at `docs/evidence/conditional-v2-evd-2-id-count-bounds.md` |
| VAL-5 | Test | `tableColumnCoverage` resolves source IDs, target section, target column, missing structural cases, and missing target-column ID coverage without whole-section fallback. | Before MS-2 and pre-merge | Implementer | EVD-3 at `docs/evidence/conditional-v2-evd-3-table-column-coverage.md` |
| VAL-6 | Test | `anyOf` and `allOf` produce deterministic branch results, selected branch metadata, nested branch diagnostics, and exactly one top-level summary diagnostic on group failure. | Before MS-3 and pre-merge | Implementer | EVD-4 at `docs/evidence/conditional-v2-evd-4-grouped-rules.md` |
| VAL-7 | Test | `when` produces matched and not-matched applicability results, explicit skipped rule status, skipped counts, and no top-level diagnostics for non-matching applicability. | Before MS-3 and pre-merge | Implementer | EVD-5 at `docs/evidence/conditional-v2-evd-5-when-skipped-rules.md` |
| VAL-8 | Test / Snapshot | V2 API result shape exposes `status`, derived `passed`, skipped evaluation placeholders, error-severity aggregate validity, nested evaluation, `evaluatedRuleCount`, and `skippedRuleCount`. | Before MS-3 and pre-merge | Implementer / Contract reviewer | EVD-1 at `docs/evidence/conditional-v2-evd-1-proving-slice.md`; EVD-4 at `docs/evidence/conditional-v2-evd-4-grouped-rules.md`; EVD-5 at `docs/evidence/conditional-v2-evd-5-when-skipped-rules.md`; EVD-6 at `docs/evidence/conditional-v2-evd-6-contract-cli-compatibility.md` |
| VAL-9 | Test / Measurement | V2 API, CLI, and evidence JSON are byte-for-byte deterministic across 10 repeated runs, including nested branch and skipped-rule cases. | Pre-merge and pre-release | Implementer | EVD-7 at `docs/evidence/conditional-v2-evd-7-repeatability-boundary.md` |
| VAL-10 | Inspection / Docs gate | Contract docs define v2 grammar, result shape, diagnostics, CLI JSON, evidence hashes, examples, compatibility, migration, and non-goals. | Before MS-3 and pre-release | Contract/API reviewer | EVD-6 at `docs/evidence/conditional-v2-evd-6-contract-cli-compatibility.md` |
| VAL-11 | Test | CLI emits unchanged v1 JSON for v1 profiles and documented v2 JSON for v2 profiles, with profile-stage failures preserved. | Before MS-3 and pre-release | CI/docs quality-gate reviewer | EVD-6 at `docs/evidence/conditional-v2-evd-6-contract-cli-compatibility.md` |
| VAL-12 | Inspection / Audit | Boundary audit finds no scripts, plugins, callbacks, expression evaluators, user-supplied regex execution, network calls, LLM calls, persistence, or design-spec-specific core semantics. | Before MS-3 and pre-release | Boundary/security reviewer | EVD-7 at `docs/evidence/conditional-v2-evd-7-repeatability-boundary.md` |
| VAL-13 | Manual / Test | Downstream design-spec-like fixtures prove Section 4 table-or-none, Section 15 table-or-N/A, R1 standard-or-replacement traceability, mixed ID counts, and Section 11/17 target-column coverage. | Before MS-4 and pre-release | Downstream design-spec profile owner | EVD-8 at `docs/evidence/conditional-v2-evd-8-downstream-design-spec-exercise.md` |
| VAL-14 | Inspection | Package evidence shows package gates were executed before final merge and `npm run release:verify` passes before release. | Before MS-1 through MS-4 as applicable | Project owner / Implementation reviewer | EVD-1 through EVD-9 at the registry paths below |

Evidence artifact registry:

| ID | Path | Required contents | Produced by |
| --- | --- | --- | --- |
| EVD-1 | `docs/evidence/conditional-v2-evd-1-proving-slice.md` | WP-1 command outputs, v1 compatibility summary, v2 flat-rule API/CLI JSON excerpts, contract skeleton inspection notes, and `MS-1` approval decision. | WP-1 / MS-1 |
| EVD-2 | `docs/evidence/conditional-v2-evd-2-id-count-bounds.md` | WP-2 command outputs, fixture names, `ids.minCount` and `ids.maxCount` pass/fail cases, duplicate/case-sensitivity notes, and `MS-2` ID-count approval input. | WP-2 / MS-2 |
| EVD-3 | `docs/evidence/conditional-v2-evd-3-table-column-coverage.md` | WP-3 command outputs, fixture names, target-column-only pass/fail cases, missing target section/column diagnostics, no-whole-section-fallback proof, and downstream owner notes. | WP-3 / MS-2 |
| EVD-4 | `docs/evidence/conditional-v2-evd-4-grouped-rules.md` | WP-4 command outputs, grouped-rule fixture names, representative `anyOf` and `allOf` result JSON, diagnostic promotion proof, and `MS-3` grouped-rule approval input. | WP-4 / MS-3 |
| EVD-5 | `docs/evidence/conditional-v2-evd-5-when-skipped-rules.md` | WP-5 command outputs, matched/not-matched `when` fixture names, representative skipped result JSON, skipped count proof, and `MS-3` applicability approval input. | WP-5 / MS-3 |
| EVD-6 | `docs/evidence/conditional-v2-evd-6-contract-cli-compatibility.md` | Contract docs gate output, CLI contract output, v1/v2 JSON compatibility notes, reviewer approval notes, and migration documentation evidence. | WP-6 / MS-3 |
| EVD-7 | `docs/evidence/conditional-v2-evd-7-repeatability-boundary.md` | Repeatability command output, 10-run deterministic evidence notes, boundary audit output, executable-key rejection summary, and boundary/security reviewer notes. | WP-6 / MS-3 |
| EVD-8 | `docs/evidence/conditional-v2-evd-8-downstream-design-spec-exercise.md` | Downstream fixture names, Section 4/15/R1/mixed-ID/Section 11/17 pass/fail results, false-acceptance coverage notes, and downstream owner approval input. | WP-7 / MS-4 |
| EVD-9 | `docs/evidence/conditional-v2-evd-9-release-readiness-handoff.md` | `npm run release:verify` output, milestone approval log, rollback decision, release or containment decision, unresolved follow-ups, exact branch or commit, and handoff record. | WP-7 / MS-4 |

Section status: Complete

## 13. Review Plan

| ID | Reviewer | Review scope | Blocking? | Completion evidence |
| --- | --- | --- | --- | --- |
| REV-1 | Independent contract/API reviewer | V2 grammar, public TypeScript types, result/evidence shape, CLI JSON union, diagnostic codes, aggregate validity, evidence hash inputs, v1 compatibility, and migration docs. | Yes | Review approval recorded in EVD-6 or milestone approval. |
| REV-2 | Implementation reviewer | Source changes across `SURF-2` through `SURF-7`, package boundaries, tests, snapshots, deterministic ordering, and traceability to `WP-*`. | Yes | Code review approval and package evidence review. |
| REV-3 | Downstream design-spec profile owner | Section 4, Section 15, R1 traceability, mixed ID counts, and Section 11/17 target-column coverage fixtures. | Yes for MS-2 and MS-4 | EVD-3 / EVD-8 approval notes. |
| REV-4 | Boundary/security reviewer | Inert data closure, unsupported executable keys, regex exclusion, domain-semantic exclusion, boundary audit script, and no network/LLM/persistence paths. | Yes | EVD-7 boundary audit review. |
| REV-5 | CI/docs quality-gate reviewer | Package scripts, CLI exit codes, docs checks, release verification, repeatability, evidence locations, and handoff completeness. | Yes before MS-4 | EVD-6 / EVD-7 / EVD-9 approval notes. |

Approval conditions: All blocking reviews pass; `MS-1` through `MS-4` are approved at their due points; no required validation remains failing; no `DEV-*` is open without approval; no `Q-*` blocking item is open; and release verification passes before release or completion claim.

Section status: Complete

## 14. Rollout, Migration, Rollback, and Recovery

| ID | Action | Timing | Owner | Abort trigger | Evidence |
| --- | --- | --- | --- | --- | --- |
| REL-1 | Keep v2 hidden behind `syntaxVersion: markdown-engine.validation@v2` and preserve v1 as the default existing contract. | Throughout implementation | Implementer | Any v1 profile emits v2 output or any v1 test changes unexpectedly. | EVD-1 / EVD-6 |
| REL-2 | Merge only after package gates, blocking reviews, and `MS-3` approval are complete. | Before final merge | Project owner | Missing milestone approval, failing targeted gate, unresolved compatibility or boundary finding. | EVD-1 through EVD-7 |
| REL-3 | Run downstream design-spec exercise and record migration guidance before claiming v2 solves the motivating profile. | Before release/adoption claim | Downstream owner / Implementer | False acceptance, false rejection, warning-only workaround remains necessary, or undocumented migration behavior. | EVD-8 |
| REL-4 | Run `npm run release:verify` and record release readiness, rollback, and handoff before tag or publication. | Before release/tag/publication/completion claim | Implementer / Project owner | Release verification failure, dirty release check, missing rollback notes, missing handoff evidence. | EVD-9 |
| REL-5 | After release, treat v2 result shape, diagnostic codes, CLI JSON, and evidence fields as public contract. | Post-release | Project owner | Consumer-impacting change without semver and migration review. | Contract docs and changelog |

Rollback or containment plan: Before public release, revert or pause the failing work package and keep v1 as the only stable documented syntax. If a package fails after partial merge but before release, revert the affected package commits or apply a targeted fix and rerun the package's gate plus v1 compatibility. After public release, preserve v1 behavior, treat v2 regressions as public contract defects, ship a patch that restores documented behavior, and document migration if any observable v2 correction is unavoidable.

Recovery limit: Runtime rollback is straightforward because no live service, database, migration, or persistent state is introduced. Contract rollback after public release is constrained by semver and consumer migration, so any post-release v2 correction requires contract review and patch-release evidence.

Section status: Complete

## 15. Observability and Operational Readiness

| ID | Signal | Purpose | Consumer | Response |
| --- | --- | --- | --- | --- |
| OBS-1 | V1 compatibility test output | Detect regressions to current public v1 behavior. | Project owner / Implementation reviewer | Block merge and classify as regression or approved compatibility deviation. |
| OBS-2 | V2 parser/compiler test output | Detect invalid schema acceptance, valid schema rejection, or unsafe nested key acceptance. | Implementer / Boundary reviewer | Fix schema/compiler before dependent packages proceed. |
| OBS-3 | Branch/applicability result snapshots | Detect diagnostic promotion, skipped result, or aggregate validity drift. | Contract/API reviewer | Block `MS-3` until snapshots match contract. |
| OBS-4 | V2 repeatability hashes | Prove deterministic API, CLI, and evidence output. | Project owner / CI consumers | Block release until nondeterminism is isolated and fixed. |
| OBS-5 | Boundary audit output | Detect executable predicates, regex execution, network/LLM/persistence paths, or domain-specific core semantics. | Boundary/security reviewer | Block merge/release and repair boundary or record rejected design. |
| OBS-6 | Downstream design-spec fixture results | Prove motivating cases work without warnings-as-workaround or profile duplication. | Downstream design-spec profile owner | Block release/adoption claim until false acceptance and false rejection cases are covered. |
| OBS-7 | `npm run release:verify` output | Confirm full package readiness before release/tag/completion. | Project owner / CI/docs reviewer | Block release until all gates pass. |

Operator actions: Maintainers run targeted commands at package gates, inspect evidence artifacts, compare v1/v2 CLI JSON, review contract docs, approve or reject milestone gates, contain failed packages to v1 behavior, and withhold release if any required evidence or approval is missing.

Monitoring window: No live production monitoring window is required because the package is local and stateless. A release-candidate validation window is required from `MS-3` approval through `MS-4`, and the first downstream design-spec profile adoption run shall be treated as post-release smoke evidence if v2 is published before downstream migration completes.

N/A rationale: Not applicable. The package can affect CI and downstream validation behavior after release, so operational readiness signals are required even without a live service.

Section status: Complete

## 16. Risks, Questions, Deviations, and Waivers

Risks:

| ID | Risk | Impact | Likelihood | Owner | Mitigation | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| RISK-1 | V2 public result, CLI JSON, and evidence changes can break consumers that assume flat v1 rule results. | High | Medium | Contract/API reviewer | Preserve v1 shape, discriminate v2 by syntax version, document migration, and test CLI/API output. | VAL-1 / VAL-8 / VAL-10 / VAL-11 |
| RISK-2 | Nested branch and applicability diagnostics can make aggregate validity too strict or too permissive. | High | Medium | Implementer / Contract reviewer | Keep top-level diagnostics outcome-bearing, nest explanatory diagnostics, and snapshot success/failure cases. | VAL-6 / VAL-7 / VAL-8 / VAL-9 |
| RISK-3 | Implementation blast radius can exceed review capacity. | High | High | Project owner / Implementer | Enforce package gates, milestones, evidence artifacts, and independent contract review. | VAL-14 |
| RISK-4 | `tableColumnCoverage` can accidentally fall back to whole-section text or require rich IR changes. | High | Medium | Implementer / Downstream owner | Use target-column-only fixtures, structural missing diagnostics, and `CTRL-5` stop condition. | VAL-5 / VAL-13 |
| RISK-5 | ID count semantics can be confused between raw occurrences, occurrence keys, and unique comparison values. | Medium | Medium | Implementer | Specify and test unique comparison values after prefix filtering and occurrence de-duplication. | VAL-4 |
| RISK-6 | V2 nested structures can reopen executable or profile-specific behavior. | High | Low | Boundary/security reviewer | Add unsupported/executable-key coverage at all nested boundaries and run boundary audit. | VAL-2 / VAL-12 |

Open questions: None. Rationale: `SRC-1` resolved the design questions about v2 shape, branch depth, `allOf`, skipped counts, ID count semantics, diagnostic promotion, and target-column coverage. Future disagreements are deviations, not open questions.

Approved deviations: None. Rationale: no departure from source authority is approved in this draft.

Approved waivers: None. Rationale: no milestone, validation, boundary, review, or compatibility rule is waived.

Section status: Complete

## 17. Execution Traceability Matrix

Evidence cells use `EVD-*` identifiers. The binding storage path for each `EVD-*` item is the Section 12 evidence artifact registry, and reviewers shall treat those paths as part of this traceability matrix.

| Source, objective, or evidence-led claim | Change surfaces | Package boundaries | Work packages | Milestones | Controls | Validation | Review | Release or ops | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRC-1 / Approved v2 design | SURF-1 through SURF-9 | PKG-1 through PKG-5 | WP-1 through WP-7 | MS-1 through MS-4 | CTRL-1 through CTRL-9 | VAL-1 through VAL-14 | REV-1 through REV-5 | REL-1 through REL-5 / OBS-1 through OBS-7 | EVD-1 through EVD-9 |
| SRC-2 / Motivating downstream grammar gap | SURF-3 / SURF-5 / SURF-7 | PKG-2 / PKG-3 / PKG-4 | WP-2 / WP-3 / WP-4 / WP-5 / WP-7 | MS-2 / MS-4 | CTRL-3 / CTRL-5 | VAL-4 / VAL-5 / VAL-6 / VAL-7 / VAL-13 | REV-3 | REL-3 / OBS-6 | EVD-2 / EVD-3 / EVD-4 / EVD-5 / EVD-8 |
| SRC-3 / Controlled consumers and clean v2 API preference | SURF-1 / SURF-2 / SURF-6 | PKG-1 | WP-1 / WP-4 / WP-5 / WP-6 | MS-1 / MS-3 | CTRL-2 / CTRL-3 | VAL-8 / VAL-10 / VAL-11 | REV-1 / REV-5 | REL-1 / REL-5 / OBS-3 | EVD-1 / EVD-6 |
| SRC-4 / Current v1 public contract | SURF-1 / SURF-2 / SURF-6 / SURF-7 | PKG-1 / PKG-4 | WP-1 / WP-6 / WP-7 | MS-1 / MS-3 / MS-4 | CTRL-2 | VAL-1 / VAL-10 / VAL-11 | REV-1 / REV-5 | REL-1 / OBS-1 | EVD-1 / EVD-6 / EVD-9 |
| SRC-5 / Existing declarative validation architecture | SURF-2 through SURF-8 | PKG-1 through PKG-5 | WP-1 through WP-7 | MS-1 through MS-4 | CTRL-4 / CTRL-6 | VAL-1 / VAL-12 / VAL-14 | REV-2 / REV-4 | REL-2 / OBS-5 | EVD-7 / EVD-9 |
| SRC-6 / High-blast-radius proposed implementation surface | SURF-1 through SURF-9 | PKG-1 through PKG-5 | WP-1 through WP-7 | MS-1 through MS-4 | CTRL-1 / CTRL-8 / CTRL-9 | VAL-14 | REV-2 / REV-5 | REL-2 / REL-4 | EVD-1 through EVD-9 |
| SRC-7 / User request for execution spec | SURF-9 | PKG-5 | WP-7 | MS-4 | CTRL-9 | VAL-14 | REV-5 | REL-4 | EVD-9 |
| OBJ-1 / Grouped alternatives | SURF-3 / SURF-4 / SURF-5 / SURF-7 | PKG-2 / PKG-3 / PKG-4 | WP-4 / WP-6 / WP-7 | MS-3 / MS-4 | CTRL-3 | VAL-2 / VAL-3 / VAL-6 / VAL-8 / VAL-9 / VAL-13 | REV-1 / REV-2 / REV-3 | REL-3 / OBS-3 / OBS-6 | EVD-4 / EVD-8 |
| OBJ-2 / Rule-level applicability | SURF-3 / SURF-4 / SURF-5 / SURF-7 | PKG-2 / PKG-3 / PKG-4 | WP-5 / WP-6 / WP-7 | MS-3 / MS-4 | CTRL-3 / CTRL-4 | VAL-3 / VAL-7 / VAL-8 / VAL-9 / VAL-13 | REV-1 / REV-2 / REV-3 | REL-3 / OBS-3 / OBS-6 | EVD-5 / EVD-8 |
| OBJ-3 / ID count bounds | SURF-3 / SURF-4 / SURF-5 / SURF-7 | PKG-2 / PKG-3 / PKG-4 | WP-2 / WP-7 | MS-2 / MS-4 | CTRL-1 | VAL-4 / VAL-13 | REV-2 / REV-3 | REL-3 / OBS-6 | EVD-2 / EVD-8 |
| OBJ-4 / Table-column coverage | SURF-3 / SURF-4 / SURF-5 / SURF-7 | PKG-2 / PKG-3 / PKG-4 | WP-3 / WP-7 | MS-2 / MS-4 | CTRL-5 / CTRL-6 | VAL-5 / VAL-13 | REV-2 / REV-3 | REL-3 / OBS-6 | EVD-3 / EVD-8 |
| OBJ-5 / Preserve v1 behavior | SURF-1 / SURF-2 / SURF-6 / SURF-7 | PKG-1 / PKG-4 | WP-1 / WP-6 / WP-7 | MS-1 / MS-3 / MS-4 | CTRL-2 | VAL-1 / VAL-11 / VAL-14 | REV-1 / REV-5 | REL-1 / OBS-1 | EVD-1 / EVD-6 / EVD-9 |
| OBJ-6 / Clean v2 public result/evidence semantics | SURF-1 / SURF-2 / SURF-6 / SURF-7 | PKG-1 / PKG-4 | WP-1 / WP-4 / WP-5 / WP-6 / WP-7 | MS-1 / MS-3 / MS-4 | CTRL-3 / CTRL-7 | VAL-8 / VAL-9 / VAL-10 / VAL-11 | REV-1 / REV-5 | REL-5 / OBS-3 / OBS-4 | EVD-1 / EVD-4 / EVD-5 / EVD-6 / EVD-7 |
| Critical path hypothesis / First proving slice | SURF-1 through SURF-7 | PKG-1 through PKG-4 | WP-1 | MS-1 | CTRL-1 / CTRL-2 / CTRL-4 | VAL-1 / VAL-2 / VAL-3 / VAL-8 / VAL-10 / VAL-11 | REV-1 / REV-2 | REL-1 / OBS-1 / OBS-2 | EVD-1 |
| RISK-1 | SURF-1 / SURF-2 / SURF-6 / SURF-7 | PKG-1 / PKG-4 | WP-1 / WP-4 / WP-5 / WP-6 / WP-7 | MS-1 / MS-3 / MS-4 | CTRL-2 / CTRL-7 | VAL-1 / VAL-8 / VAL-10 / VAL-11 | REV-1 / REV-5 | REL-1 / REL-5 | EVD-1 / EVD-6 / EVD-7 |
| RISK-2 | SURF-2 / SURF-5 / SURF-7 | PKG-1 / PKG-3 / PKG-4 | WP-4 / WP-5 / WP-6 | MS-3 | CTRL-3 / CTRL-7 | VAL-6 / VAL-7 / VAL-8 / VAL-9 | REV-1 / REV-2 | OBS-3 / OBS-4 | EVD-4 / EVD-5 / EVD-7 |
| RISK-3 | SURF-1 through SURF-9 | PKG-1 through PKG-5 | WP-1 through WP-7 | MS-1 through MS-4 | CTRL-1 / CTRL-8 / CTRL-9 | VAL-14 | REV-2 / REV-5 | REL-2 / REL-4 | EVD-1 through EVD-9 |
| RISK-4 | SURF-3 / SURF-5 / SURF-7 / SURF-10 | PKG-2 / PKG-3 / PKG-4 | WP-3 / WP-7 | MS-2 / MS-4 | CTRL-5 / CTRL-6 | VAL-5 / VAL-13 | REV-2 / REV-3 | REL-3 / OBS-6 | EVD-3 / EVD-8 |
| RISK-5 | SURF-3 / SURF-5 / SURF-7 | PKG-2 / PKG-3 / PKG-4 | WP-2 / WP-7 | MS-2 / MS-4 | CTRL-1 | VAL-4 / VAL-13 | REV-2 / REV-3 | REL-3 | EVD-2 / EVD-8 |
| RISK-6 | SURF-3 / SURF-5 / SURF-8 / SURF-10 | PKG-2 / PKG-3 / PKG-5 | WP-1 / WP-4 / WP-5 / WP-6 | MS-1 / MS-3 | CTRL-4 / CTRL-6 | VAL-2 / VAL-12 | REV-4 | OBS-5 | EVD-7 |

Section status: Complete

## 18. Final Execution Gate

Entry gate: `DEP-1` project-owner approval of `SRC-1` and this execution spec is required before `WP-1`; `DEP-2` package-ticket readiness or approved no-ticket decision is required before the corresponding package starts; no implementation work is approved until entry approval is recorded.

Milestone approval gate: `MS-1` approval is required before feature package execution; `MS-2` approval is required before ID/cardinality and coverage work can be considered merge-ready; `MS-3` approval is required before final merge; `MS-4` approval is required before release, tag, publication, downstream adoption claim, or completion claim.

Completion gate: Completion requires all `WP-*` outputs, all required `EVD-*` artifacts, passing `VAL-1` through `VAL-14`, approval from all blocking reviewers, no unapproved `DEV-*`, no approved waiver gaps, and no unresolved blocking dependency.

Release gate: Release requires `npm run release:verify`, contract docs, boundary audit, v1 compatibility, v2 repeatability, downstream exercise, rollback notes, handoff record, and project-owner `MS-4` approval.

Handoff record: `EVD-9` at `docs/evidence/conditional-v2-evd-9-release-readiness-handoff.md` shall include the final command results, milestone approvals, release/rollback decision, downstream adoption notes, unresolved follow-ups, and exact commit or branch under review.

Final readiness state: Not ready. Rationale: this is a draft execution specification and `DEP-1` approval has not yet been recorded.

Section status: Complete
