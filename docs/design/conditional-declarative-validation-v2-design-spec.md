# Conditional Declarative Validation V2 Design Specification

## Document Control

| Field | Value |
| --- | --- |
| Title | Conditional Declarative Validation V2 |
| Status | Future design artifact |
| Rigor level | `R3` |
| Rigor justification | The design changes a shared validation engine's public profile grammar, API and CLI result contracts, diagnostics, evidence payloads, and compatibility behavior. Failure can falsely accept or falsely reject downstream controlled design-spec documents. Rollback is possible because known consumers are directly controlled, but the public contract and cross-module implementation surface create high blast radius and require heightened controls. |
| Author(s) | Codex |
| Reviewers | Project owner, markdown-engine implementer, downstream design-spec profile owner, independent contract/API reviewer |
| Decision owner | Project owner |
| Target milestone or release | `markdown-engine.validation@v2` implementation approval |
| Last updated | 2026-05-17 |
| Related docs | `docs/contracts/declarative-validation.md`; `docs/design/markdown-engine-declarative-validation-syntax-operational-design-spec.md`; `docs/execution/markdown-engine-declarative-validation-syntax-execution-spec.md`; `docs/execution/conditional-declarative-validation-v2-execution-spec.md` |
| Related tickets | `BEL-1075`; `BEL-1076`; proposed follow-up tickets for grouped rules, rule-level `when`, v2 result contract, and downstream design-spec profile exercise |

## Current Authority

This document is retained as a future design artifact for conditional
declarative validation v2 behavior. Current runtime behavior does not implement
grouped rules, rule-level `when`, ID count bounds, `tableColumnCoverage`,
nested v2 results/evidence, or v2 CLI/evaluator behavior. The current public
contract only admits `markdown-engine.validation@v2` for the flat rule profile
shape documented in `docs/contracts/declarative-validation.md`.

## 0. Executive Summary

Decision requested: Approve with heightened controls

Problem summary: Downstream validation profiles are unable to strictly express authorized structural alternatives, conditional applicability, ID-family cardinality, and column-scoped traceability because `markdown-engine.validation@v1` only supports flat selector/assertion rules and section-scoped reference checks, resulting in warning-only workarounds and broad traceability checks that cannot enforce the intended document contracts.

Proposed outcome: `markdown-engine.validation@v2` provides deterministic grouped validation, rule applicability, ID count bounds, column-scoped ID coverage, explicit skipped-rule results, nested branch evidence, and documented coexistence with unchanged v1 behavior.

Why now: The `design-spec` validation profile already had to weaken optional Section 4 and Section 15 checks to warnings, and the next strict profile revision needs v2 grammar before it can enforce table-or-none and target-column traceability without duplicated profile files.

Top risks or unknowns:

- RISK-1: V2 result shape changes can break API or CLI consumers that assume flat v1 `ruleResults`.
- RISK-2: Branch diagnostic promotion can make aggregate validity either too strict or too permissive if nested diagnostics are not separated from outcome-bearing diagnostics.
- RISK-3: A broad implementation can mix schema, evaluator, evidence, and downstream profile changes in one patch unless execution is decomposed.

Section status: Complete

## Layer 1: Problem and Requirements

## 1. Problem Definition

Problem declaration: Downstream validation profile authors are unable to enforce conditional structural document contracts because `markdown-engine.validation@v1` provides only flat rules with one selector and one assertion payload, resulting in warning-only alternatives, duplicated profile files, and traceability checks that can pass by finding IDs outside the required table column.

Affected actors or systems: `markdown-engine` maintainers, design-spec profile owners, CLI validation users, CI quality gates, coding agents consuming validation JSON, and downstream packages that rely on deterministic profile output.

Current-state baseline: As of 2026-05-16, direct inspection shows 1 public declarative syntax version (`markdown-engine.validation@v1`), 1 flat rule shape, 9 supported selector targets, 9 supported assertion members, 0 grouped-rule constructs, 0 rule-level applicability constructs, 0 ID count bound fields, and 0 column-scoped reference coverage assertions. The proposed implementation surface lists 38 planned paths spanning public contract, API/result/evidence, profile schema, compiler, evaluator, CLI, test, documentation, and fixture paths across `docs`, `src`, `tests`, and `fixtures`; execution estimation for that implementation returned `decompose-first`, 13 adjusted story points, high blast radius, and heightened controls required.

Evidence or source: Embedded source-context summary in this specification; `docs/contracts/declarative-validation.md`; `src/declarative-validation/profile/index.ts`; `src/declarative-validation/profile/schema.ts`; `src/declarative-validation/profile/assertion-schema.ts`; `src/declarative-validation/assertions/evaluator.ts`; `src/declarative-validation/assertions/ids.ts`; `src/declarative-validation/assertions/references.ts`; `src/declarative-validation/selectors/table-targets.ts`.

Consequence of inaction: Before the next strict design-spec profile revision, Section 4 and Section 15 alternatives remain warning-only, Section 11 traceability remains whole-section rather than target-column scoped, and profile authors must either split controlled profiles by rigor path or accept false positives and false negatives in deterministic validation.

Decision deadline or trigger: Before implementing `BEL-1075`, `BEL-1076`, grouped conditional validation, or a design-spec profile revision that claims strict Section 4, Section 15, Section 11, or R1 replacement-matrix enforcement.

Section status: Complete

## 2. Objectives and Non-Objectives

| ID | Statement | Measurement or decision horizon |
| --- | --- | --- |
| OBJ-1 | Provide a v2 declarative grammar that can express structurally different valid alternatives in one rule. | V2 grouped-rule contract review |
| OBJ-2 | Provide rule-level applicability so one profile can encode rigor-specific or document-shape-specific rules without profile duplication. | V2 `when` implementation review |
| OBJ-3 | Provide deterministic ID-family cardinality checks after prefix filtering and occurrence de-duplication. | `BEL-1075` acceptance review |
| OBJ-4 | Provide source-ID-to-target-table-column coverage for traceability matrices without falling back to whole-section text. | `BEL-1076` acceptance review |
| OBJ-5 | Preserve v1 profile parsing, validation, diagnostics, CLI JSON, evidence, and fixtures unchanged. | Compatibility gate before final merge |
| OBJ-6 | Produce clean v2 public result and evidence semantics that distinguish failed, passed, and skipped rules. | Contract/API review |
| NG-1 | This effort will not change Markdown parsing, rich IR extraction, table extraction, source-range calculation, or unrelated CLI behavior. | Implementation review |
| NG-2 | This effort will not introduce regex execution, expression evaluation, callbacks, plugins, network calls, LLM calls, file watching, or arbitrary code predicates. | Boundary audit |
| NG-3 | This effort will not include `not` groups in the first v2 release. | Grammar review |
| NG-4 | This effort will not encode design-spec domain semantics in core engine code. | Boundary audit |
| NG-5 | This effort will not remove, reinterpret, or silently upgrade v1 profiles. | Compatibility gate |

Section status: Complete

## 3. Stakeholders and Decision Authorities

| Stakeholder or role | Interest | Required action |
| --- | --- | --- |
| Project owner | Approves public grammar scope, result semantics, rollout controls, and release posture. | Approve |
| Markdown-engine implementer | Owns schema, compiler, evaluator, diagnostics, evidence, tests, and docs implementation. | Review |
| Downstream design-spec profile owner | Confirms v2 grammar solves Section 4, Section 15, Section 11, and R1 traceability needs without profile duplication. | Review |
| Independent contract/API reviewer | Challenges public API, CLI JSON, evidence hash, and compatibility decisions independently of the implementer. | Review |
| CI and coding-agent consumers | Depend on stable machine-readable validation output and exit codes. | Inform |
| Security/boundary reviewer | Confirms v2 profile data remains inert local data with no executable predicates. | Consult |

Decision owner: Project owner

Section status: Complete

## 4. Constraints, Invariants, and Assumptions

| ID | Type | Statement | Source or rationale | Validation or resolution plan |
| --- | --- | --- | --- | --- |
| CON-1 | Invariant | V1 behavior shall remain unchanged for `markdown-engine.validation@v1` profiles. | Existing public contract and compatibility requirement. | Run v1 parser, compiler, assertion, CLI, examples, repeatability, downstream, and contract tests in `VAL-1` and `VAL-11`. |
| CON-2 | Constraint | V2 grammar shall be selected only by `syntaxVersion: markdown-engine.validation@v2`. | Prevents silent behavior changes for existing profiles. | Schema and CLI tests in `VAL-2` and `VAL-10`. |
| CON-3 | Invariant | Profile input remains closed, JSON-safe, deterministic, and inert. | Existing v1 security and boundary contract. | Unsupported-key, executable-key, regex-like-key, and boundary audit coverage in `VAL-2` and `VAL-12`. |
| CON-4 | Constraint | Top-level validation diagnostics shall remain outcome-bearing and shall not include failed branch diagnostics from a successful `anyOf`. | Prevents nested explanatory diagnostics from making aggregate validity false. | Result-shape and branch-diagnostic contract tests in `VAL-6` and `VAL-9`. |
| CON-5 | Invariant | Evidence output shall use the same deterministic nested rule-result structure exposed by v2 API and CLI results. | Evidence currently clones rule results and diagnostics. | Evidence snapshot and repeatability tests in `VAL-9`. |
| CON-6 | Constraint | Implementation shall be decomposed before coding because execution estimation returned `decompose-first` for the expanded implementation surface. | Estimator output for 38 proposed paths: 13 adjusted story points, high blast radius, heightened controls required. | Use package gates in section 16 and section 17 before merge. |
| ASM-1 | Assumption | Known consumers are directly controlled and can adopt a clean v2 result shape while retaining v1 compatibility for existing profiles. | Current thread source states few consumers and preference for ideal API. | Validate with downstream design-spec profile exercise in `VAL-13`. |
| ASM-2 | Assumption | Existing table-cell selectors and table-column ID extraction machinery are sufficient for `tableColumnCoverage` without changing rich IR. | Seed brief and code inspection show table-cell selectors and column ID extraction exist. | Prove in `BEL-1076` tests and `VAL-5`; stop if rich IR change is required. |
| ASM-3 | Assumption | One non-recursive branch level is enough for the first v2 release. | Current motivating cases require alternative branches but not nested boolean logic. | Confirm through Section 4, Section 15, R1 traceability, and Section 11 fixtures in `VAL-13`. |

Section status: Complete

## 5. Requirements

| ID | Type | Priority | Requirement statement | Rationale | Verification |
| --- | --- | --- | --- | --- | --- |
| REQ-1 | Functional | Must | The system shall parse v2 profiles only when `syntaxVersion` equals `markdown-engine.validation@v2`. | Syntax-version discrimination prevents silent v1 behavior changes. | VAL-2 / VAL-10 |
| REQ-2 | Compatibility | Must | The system shall preserve v1 profile parsing, compilation, validation, diagnostics, CLI JSON, evidence, and fixtures without observable changes. | Existing consumers depend on the v1 contract. | VAL-1 / VAL-11 |
| REQ-3 | Functional | Must | The system shall support v2 flat rules with one `select` payload and one `assert` payload. | V2 must remain usable for simple rules and migration. | VAL-2 / VAL-3 |
| REQ-4 | Functional | Must | The system shall support branch-level `anyOf` rules where each branch owns one selector and one assertion payload. | Structural alternatives often require different selectors. | VAL-3 / VAL-6 / VAL-13 |
| REQ-5 | Functional | Must | The system shall support branch-level `allOf` rules where every branch owns one selector and one assertion payload. | Shared grouped-result machinery can express required grouped checks without compound flat rules. | VAL-3 / VAL-6 |
| REQ-6 | Functional | Must | The system shall reject recursive grouped rules within v2 branches. | First-release determinism and reviewability require bounded group depth. | VAL-2 / VAL-3 |
| REQ-7 | Functional | Must | The system shall support rule-level applicability through one `when` selector/assertion clause. | One profile must express rigor-specific and document-shape-specific rules. | VAL-3 / VAL-7 / VAL-13 |
| REQ-8 | Functional | Must | The system shall represent non-matching applicability as an explicit skipped rule result. | Consumers need to distinguish passed checks from non-applicable checks. | VAL-7 / VAL-8 |
| REQ-9 | Functional | Must | The system shall keep failed `anyOf` branch diagnostics nested when at least one branch passes. | Failed alternatives are explanatory and must not invalidate successful alternatives. | VAL-6 / VAL-9 |
| REQ-10 | Functional | Must | The system shall emit one top-level outcome diagnostic when no `anyOf` branch passes. | Aggregate validity needs one deterministic, outcome-bearing failure. | VAL-6 / VAL-9 |
| REQ-11 | Functional | Must | The system shall emit one top-level outcome diagnostic when one or more `allOf` branches fail. | Aggregate validity needs one deterministic, outcome-bearing failure for grouped requirements. | VAL-6 / VAL-9 |
| REQ-12 | Functional | Must | The system shall expose nested branch diagnostics through v2 rule results and evidence. | Reviewers need branch-level explanation without polluting top-level diagnostics. | VAL-6 / VAL-9 |
| REQ-13 | Functional | Must | The system shall support `ids.minCount` and `ids.maxCount` after prefix filtering and occurrence de-duplication. | Mixed ID tables need cardinality without treating prefix as a full-column predicate. | VAL-4 |
| REQ-14 | Functional | Must | The system shall support `tableColumnCoverage` from a source ID set to one target table column. | Traceability matrices require column-scoped coverage. | VAL-5 / VAL-13 |
| REQ-15 | Reliability | Must | The system shall produce byte-for-byte identical v2 API, CLI, and evidence JSON for identical input, profile, options, package version, and runtime version. | Evidence and CI output must remain deterministic. | VAL-9 |
| REQ-16 | Security | Must | The system shall treat v2 profile data as inert data without executing scripts, expressions, user-supplied regex, imports, plugins, callbacks, network calls, or LLM calls. | V2 conditionals must not create a code execution boundary. | VAL-2 / VAL-12 |
| REQ-17 | Operability | Must | The system shall document v2 grammar, result shape, diagnostics, CLI behavior, evidence hash inputs, migration notes, and examples before release. | Consumers need a contract rather than source inference. | VAL-10 |
| REQ-18 | Operability | Must | The implementation shall be delivered through reviewable packages with targeted gates and stop conditions. | Estimation requires decomposition and heightened controls. | VAL-14 |

Section status: Complete

## 6. Success Measures and Kill Criteria

| Measure | Baseline | Target or decision threshold | Evaluation date or decision event | Related IDs |
| --- | --- | --- | --- | --- |
| Strict alternative validation | 0 v1 grammar constructs can express table-or-none or table-or-N/A with distinct selectors. | V2 fixtures prove Section 4 table-or-none and Section 15 table-or-N/A pass both valid branches and fail documents satisfying neither branch. | Downstream exercise review | OBJ-1 / REQ-4 / REQ-10 / REQ-13 |
| Applicability precision | 0 v1 grammar constructs can skip a rule based on a document fact. | V2 fixtures prove R1 standard-or-replacement traceability rules skip, pass, and fail with explicit statuses. | Applicability package review | OBJ-2 / REQ-7 / REQ-8 |
| ID cardinality | V1 `ids.prefix` filters tokens but has 0 count bounds. | `BEL-1075` fixtures prove `minCount` and `maxCount` after prefix filtering and occurrence de-duplication. | ID cardinality package review | OBJ-3 / REQ-13 |
| Column coverage | V1 `references.mustAppearIn` checks section text, not a required table column. | `BEL-1076` fixtures prove every Section 5 `REQ-*` appears in the Section 11 or Section 17 `Requirement` column as configured. | Column coverage package review | OBJ-4 / REQ-14 |
| Compatibility | V1 fixtures currently define public syntax, result, diagnostics, CLI, and evidence behavior. | All existing v1 validation and contract gates pass unchanged after v2 implementation. | Final merge gate | OBJ-5 / REQ-2 |
| Deterministic output | V1 repeatability exists, but v2 nested branch results do not. | Ten repeated v2 validations produce byte-for-byte identical API, CLI, and evidence JSON. | Release readiness review | OBJ-6 / REQ-15 |
| Kill criterion | Implementation estimate is high blast radius and `decompose-first`. | Stop implementation if contract/API semantics, branch diagnostic promotion, or evidence hash inputs cannot be specified before coding a package. | Before package execution | REQ-16 / REQ-18 |

Section status: Complete

## Layer 1 Exit

Layer 1 status: Complete

## Layer 2: Functional Specification

## 7. System Context and External Interfaces

System boundary: `markdown-engine` remains a local TypeScript package that accepts normalized Markdown documents and caller-supplied validation profiles, then returns deterministic diagnostics, rule results, metadata, optional evidence, CLI JSON, and exit codes.

External actors and systems: Package API consumers, CLI users, CI jobs, downstream design-spec profile maintainers, coding agents reading validation JSON, YAML parser dependency, Node.js runtime, and local file system access owned by the CLI caller. No remote service, database, network transport, plugin runtime, or agent adapter is part of this design.

Trust or control boundaries: Caller-controlled Markdown and profile data cross into the engine as untrusted local data. V2 `when`, `anyOf`, `allOf`, and `tableColumnCoverage` are declarative data only. Parser and YAML dependency upgrades cross a maintainer-controlled dependency boundary. API and CLI output cross a public contract boundary to consumers.

| Interface | Owner | Consumer or dependency | Inputs | Outputs |
| --- | --- | --- | --- | --- |
| Declarative validation API | `markdown-engine` | Package consumers and downstream profile compilers | `EngineDocument`, v1 or v2 `ValidationProfile`, validation options | V1 or v2 validation result, diagnostics, profile metadata, optional evidence |
| Profile parser and schema | `markdown-engine` | YAML parser dependency and API consumers | YAML-compatible profile text or JSON-safe value | Parsed v1/v2 profile or config diagnostics |
| Rule compiler | `markdown-engine` | Internal validation pipeline | Parsed profile and syntax version | Closed compiled plan or compile diagnostics |
| Selector resolver | `markdown-engine` | Rule evaluator | Public `EngineDocument` and declarative selector | Deterministic target set |
| Assertion evaluator | `markdown-engine` | Rule evaluator | Compiled assertions, selections, and document context | Branch diagnostics, rule diagnostics, rule status |
| Evidence serializer | `markdown-engine` | API/CLI consumers and review tooling | Validation result, document, resolved profile, runtime version | Stable hashes and cloned nested rule results |
| CLI validation command | `markdown-engine` | CI jobs, local users, coding agents | Markdown path, profile path, output format | Stable JSON union and exit code |
| Contract documentation | `markdown-engine` | Human reviewers and consumers | Public contract decisions and examples | Versioned grammar, result, diagnostics, evidence, migration notes |

Section status: Complete

## 8. Operational Scenarios and Functional Behavior

| ID | Trigger | Preconditions | Behavior or outcome | Related requirements |
| --- | --- | --- | --- | --- |
| FLOW-1 | A caller validates a v1 profile. | The profile declares `markdown-engine.validation@v1`. | The caller receives the unchanged v1 result shape, diagnostics, evidence, and metadata. | REQ-1 / REQ-2 |
| FLOW-2 | A caller validates a simple v2 rule. | The profile declares `markdown-engine.validation@v2` and the rule has `select` plus `assert`. | The caller receives a v2 rule result with `status`, derived `passed`, top-level diagnostics, and assertion evaluation details. | REQ-1 / REQ-3 / REQ-15 |
| FLOW-3 | A caller validates a v2 `anyOf` rule. | Branches are non-recursive and each branch has `select` plus `assert`. | The rule passes when any branch passes; failed branch diagnostics remain nested unless all branches fail. | REQ-4 / REQ-6 / REQ-9 / REQ-10 / REQ-12 |
| FLOW-4 | A caller validates a v2 `allOf` rule. | Branches are non-recursive and each branch has `select` plus `assert`. | The rule passes only when every branch passes; failed branch diagnostics remain nested and one top-level summary diagnostic determines the outcome. | REQ-5 / REQ-6 / REQ-11 / REQ-12 |
| FLOW-5 | A caller validates a rule with `when`. | The applicability clause is valid and uses one selector/assertion pair. | The rule evaluates only when `when` matches; otherwise it returns `status: "skipped"`, `passed: true`, and no top-level diagnostics. | REQ-7 / REQ-8 |
| FLOW-6 | A profile checks mixed ID tables. | A selector resolves table cells or other ID-bearing targets. | `ids.minCount` and `ids.maxCount` apply to unique comparison values after prefix filtering and occurrence de-duplication. | REQ-13 |
| FLOW-7 | A profile checks traceability matrix coverage. | Source and target table columns are configured. | The engine fails when a source ID is missing from the configured target column, not merely from unrelated section text. | REQ-14 |
| FLOW-8 | A CLI user validates with v2. | The CLI can read the supplied Markdown and profile files. | The CLI emits documented v2 JSON, includes evidence, and uses the same exit-code semantics as v1 for top-level error diagnostics. | REQ-15 / REQ-17 |
| FLOW-9 | A profile contains unsupported or executable-like v2 syntax. | The profile includes unknown keys, regex-like keys, callbacks, expressions, plugins, or scripts. | The parser/compiler emits deterministic config diagnostics and does not execute or compile the payload. | REQ-16 |
| FUNC-1 | Syntax-version dispatch is invoked. | Profile input is materialized as JSON-safe data. | The parser routes v1 and v2 profile shapes explicitly and rejects missing or unsupported syntax versions. | REQ-1 / REQ-2 |
| FUNC-2 | V2 flat rule evaluation is invoked. | The rule has exactly `select` plus `assert`, with optional `when`. | The evaluator returns an assertion evaluation result and top-level diagnostics only for outcome-bearing failures. | REQ-3 / REQ-7 / REQ-8 |
| FUNC-3 | V2 grouped rule evaluation is invoked. | The rule has exactly one of `anyOf` or `allOf`, with optional `when`. | The evaluator returns deterministic branch results, selected branch metadata for `anyOf`, and summary top-level diagnostics when the group fails. | REQ-4 / REQ-5 / REQ-9 / REQ-10 / REQ-11 / REQ-12 |
| FUNC-4 | ID count evaluation is invoked. | ID tokens are extracted from selected targets. | The evaluator applies prefix filtering, occurrence de-duplication, unique comparison value counting, and count diagnostics. | REQ-13 |
| FUNC-5 | Table-column coverage evaluation is invoked. | Source and target table selectors are resolvable. | The evaluator compares source IDs against tokens in the target column and emits structural or coverage diagnostics. | REQ-14 |
| FUNC-6 | V2 evidence serialization is invoked. | Validation completed with `includeEvidence` or CLI validation. | Evidence contains the same nested v2 rule results, top-level diagnostics, stable hashes, engine version, and runtime version. | REQ-15 / REQ-17 |
| FUNC-7 | Compatibility verification is invoked. | Existing v1 fixtures and contract tests are available. | The validation suite proves no observable v1 regression. | REQ-2 / REQ-18 |

Section status: Complete

## 9. State Model, Faults, and Misuse Cases

States and transitions: The engine remains stateless across calls. A validation invocation transitions through ProfileInputReceived, JsonSafeMaterialized, SyntaxVersionDispatched, ProfileParsed, RulePlanCompiled, ApplicabilityEvaluated, RuleOrGroupEvaluated, DiagnosticsAggregated, EvidenceSerialized, and ResultReturned. Config and compile failures stop before validation. A non-matching `when` transitions to RuleSkipped, not RulePassed.

| Scenario | Expected behavior | Invariant maintained | Related IDs |
| --- | --- | --- | --- |
| Fault-1 | V2 profile is missing `syntaxVersion` or declares an unsupported syntax version. | The parser returns `profile.config.unsupportedSyntaxVersion` and no rule evaluation occurs. | REQ-1 / FUNC-1 |
| Fault-2 | V2 rule declares more than one evaluation shape, such as `select` plus `anyOf`. | The parser/compiler emits `profile.config.invalidShape` and no partial rule execution occurs. | REQ-3 / REQ-4 / REQ-5 / FUNC-1 |
| Fault-3 | A v2 branch omits `select` or `assert`, uses duplicate labels, or contains nested groups. | The parser/compiler emits deterministic config diagnostics and rejects the profile. | REQ-4 / REQ-5 / REQ-6 / FUNC-3 |
| Fault-4 | `when` selector matches nothing or its assertion fails. | The rule result is `status: "skipped"`, `passed: true`, and `diagnostics: []`; applicability diagnostics remain nested under `when`. | REQ-7 / REQ-8 / FUNC-2 |
| Fault-5 | All `anyOf` branches fail. | The rule result is `status: "failed"`, one top-level `profile.validation.noAlternativeMatched` diagnostic is emitted, and branch diagnostics remain nested. | REQ-10 / REQ-12 / FUNC-3 |
| Fault-6 | One or more `allOf` branches fail. | The rule result is `status: "failed"`, one top-level `profile.validation.groupRequirementFailed` diagnostic is emitted, and branch diagnostics remain nested. | REQ-11 / REQ-12 / FUNC-3 |
| Fault-7 | `ids.minCount` or `ids.maxCount` is not satisfied. | The rule emits `profile.validation.idCountTooLow` or `profile.validation.idCountTooHigh` with best available source evidence. | REQ-13 / FUNC-4 |
| Fault-8 | `tableColumnCoverage` target section or column is absent. | The rule emits `profile.validation.targetSectionMissing` or `profile.validation.targetColumnMissing` and does not fall back to whole-section text. | REQ-14 / FUNC-5 |
| Fault-9 | A source ID is absent from the target column. | The rule emits `profile.validation.targetColumnReferenceMissing` with source ID evidence when available. | REQ-14 / FUNC-5 |
| Fault-10 | Source ranges are unavailable for nested branch or coverage diagnostics. | Diagnostics omit source ranges rather than fabricating locations. | REQ-15 / FUNC-3 / FUNC-5 |
| Misuse-1 | A profile author attempts to use regex-like, script, plugin, callback, import, or expression keys in v2. | The engine rejects the keys as inert unsupported config and does not execute them. | REQ-16 / FUNC-1 |
| Misuse-2 | A consumer computes aggregate validity from nested branch diagnostics rather than top-level diagnostics. | Contract docs state aggregate `valid` is derived from top-level diagnostics only. | REQ-9 / REQ-10 / REQ-11 / REQ-17 |
| Misuse-3 | An implementer attempts to bundle all v2 features and downstream fixtures in one patch. | The implementation plan blocks merge until package gates are satisfied separately. | REQ-18 / FUNC-7 |

Section status: Complete

## 10. External Service Levels and Acceptance Cases

External service expectations: The package has no network availability service level. Required externally visible properties are local deterministic execution, syntax-versioned result contracts, v1 compatibility, stable CLI JSON, explicit unsupported-syntax diagnostics, source-grounded diagnostics where possible, and repeatable evidence for identical inputs.

| ID | Acceptance case | Expected result | Covers |
| --- | --- | --- | --- |
| ACC-1 | Validate an existing v1 profile and fixture suite after v2 support is added. | Output, diagnostics, evidence, and CLI behavior remain unchanged for v1. | REQ-2 / FUNC-7 |
| ACC-2 | Parse a v2 flat rule with `select` and `assert`. | The parsed model and compiled plan contain one assertion evaluation shape. | REQ-1 / REQ-3 / FUNC-1 / FUNC-2 |
| ACC-3 | Parse a v2 rule with both `select` and `anyOf`. | The parser/compiler rejects the rule with deterministic invalid-shape diagnostics. | REQ-3 / REQ-4 / REQ-5 / FUNC-1 |
| ACC-4 | Validate Section 4 constraints table-or-explicit-none using `anyOf`. | A constraints table passes, explicit `none` text passes, and a document with neither path fails with one summary diagnostic. | REQ-4 / REQ-10 / REQ-12 / FUNC-3 |
| ACC-5 | Validate Section 15 controls table-or-permitted-N/A using `anyOf`. | A valid controls table passes, permitted `N/A` rationale passes, and missing rationale fails. | REQ-4 / REQ-10 / FUNC-3 |
| ACC-6 | Validate R1 standard-or-replacement traceability under `when`. | Non-R1 documents skip the R1-specific rule; R1 documents pass one configured traceability path or fail with deterministic diagnostics. | REQ-7 / REQ-8 / FUNC-2 / FUNC-3 |
| ACC-7 | Validate mixed objective and non-objective ID counts. | `OBJ-*` and `NG-*` `minCount` checks pass or fail after prefix filtering without requiring every selected cell to share the prefix. | REQ-13 / FUNC-4 |
| ACC-8 | Validate Section 11 target-column coverage. | Every Section 5 `REQ-*` must appear in the Section 11 `Requirement` column; mentions elsewhere in Section 11 do not satisfy coverage. | REQ-14 / FUNC-5 |
| ACC-9 | Validate the same v2 profile and document 10 times through API and CLI. | Serialized results and evidence are byte-for-byte identical across repeated runs. | REQ-15 / FUNC-6 |
| ACC-10 | Parse a v2 profile containing `regex`, `expression`, `plugin`, or `callback`. | The profile fails as unsupported inert config with no execution. | REQ-16 / FUNC-1 |
| ACC-11 | Inspect v2 contract documentation before release. | Docs define grammar, result shape, skipped semantics, branch diagnostic promotion, evidence hash inputs, CLI JSON, migration, and examples. | REQ-17 / FUNC-6 |
| ACC-12 | Review implementation package gates before final merge. | Each package has targeted validation evidence and the final merge gate passes `npm run release:verify`. | REQ-18 / FUNC-7 |

Section status: Complete

## 11. Requirements-to-Behavior Traceability

| Requirement | Functional behaviors or flows | Acceptance coverage | Notes |
| --- | --- | --- | --- |
| REQ-1 | FLOW-2 / FUNC-1 | ACC-2 | Syntax-version dispatch is externally visible through parser output. |
| REQ-2 | FLOW-1 / FUNC-7 | ACC-1 | V1 compatibility is a release gate. |
| REQ-3 | FLOW-2 / FUNC-2 | ACC-2 / ACC-3 | Flat rules remain supported in v2. |
| REQ-4 | FLOW-3 / FUNC-3 | ACC-4 / ACC-5 | `anyOf` supports structural alternatives. |
| REQ-5 | FLOW-4 / FUNC-3 | ACC-3 / ACC-12 | `allOf` shares grouped-result semantics. |
| REQ-6 | FLOW-3 / FLOW-4 / FUNC-3 | ACC-3 | Non-recursive branch depth is enforced. |
| REQ-7 | FLOW-5 / FUNC-2 | ACC-6 | `when` controls applicability. |
| REQ-8 | FLOW-5 / FUNC-2 | ACC-6 | Skipped status is observable. |
| REQ-9 | FLOW-3 / FUNC-3 | ACC-4 / ACC-9 | Successful `anyOf` branch failures remain nested. |
| REQ-10 | FLOW-3 / FUNC-3 | ACC-4 | Failed `anyOf` has one top-level summary diagnostic. |
| REQ-11 | FLOW-4 / FUNC-3 | ACC-12 | Failed `allOf` has one top-level summary diagnostic. |
| REQ-12 | FLOW-3 / FLOW-4 / FUNC-3 / FUNC-6 | ACC-4 / ACC-9 | Branch diagnostics remain inspectable. |
| REQ-13 | FLOW-6 / FUNC-4 | ACC-7 | ID count behavior is externally visible. |
| REQ-14 | FLOW-7 / FUNC-5 | ACC-8 | Column-scoped traceability is externally visible. |
| REQ-15 | FLOW-8 / FUNC-6 | ACC-9 | Determinism covers API, CLI, and evidence. |
| REQ-16 | FLOW-9 / FUNC-1 | ACC-10 | Inert data boundary is externally testable. |
| REQ-17 | FLOW-8 / FUNC-6 | ACC-11 | Contract docs are release artifacts. |
| REQ-18 | FUNC-7 | ACC-12 | Decomposition gates govern implementation; misuse bundling is covered separately by `Misuse-3` and section 17. |

Section status: Complete

## Layer 2 Exit

Layer 2 status: Complete

## Layer 3: Technical Specification

## 12. Architecture Overview

Architecture summary: V2 extends the declarative validation pipeline with syntax-versioned profile types, non-recursive grouped rule plans, rule-level applicability plans, ID count assertions, table-column coverage assertions, v2 result/evidence serializers, v2 CLI JSON discrimination, and contract documentation while leaving v1 execution unchanged.

Major components and boundaries: The main components are profile parser/schema, rule compiler, selector resolver, assertion evaluators, grouped-rule evaluator, applicability evaluator, diagnostic builder, result serializer, evidence serializer, CLI adapter, contract docs, and test fixtures. Boundaries remain between untrusted profile data and closed validated profile models, v1 and v2 syntax contracts, nested explanatory diagnostics and top-level outcome diagnostics, public output contracts and internal compiled plans, and core engine structure versus downstream design-spec semantics.

Deployment or runtime placement: The package runs in the caller's local Node.js process. API validation performs no file reads, network calls, persistence, plugin loading, LLM calls, or background work. CLI validation reads only caller-specified local Markdown and profile files.

Architecture rationale: Syntax-versioned parsing satisfies `REQ-1` and `REQ-2`; a bounded grouped-rule plan satisfies `REQ-4` through `REQ-12` without recursive boolean complexity; assertion-specific extensions satisfy `REQ-13` and `REQ-14`; stable result and evidence serializers satisfy `REQ-15` and `REQ-17`; package decomposition satisfies `REQ-18`.

Section status: Complete

## 13. Technical Mechanisms and Allocation

| ID | Mechanism | Component or owner | Responsibility | Related behaviors |
| --- | --- | --- | --- | --- |
| TECH-1 | Syntax-versioned profile schema | Profile parser/schema | Dispatch v1 and v2 profile models explicitly and reject unsupported syntax versions. | FUNC-1 |
| TECH-2 | V2 rule-shape validator | Profile parser/schema | Enforce exactly one evaluation shape per rule: flat `select`/`assert`, `anyOf`, or `allOf`, with optional `when`. | FUNC-1 / FUNC-2 / FUNC-3 |
| TECH-3 | Non-recursive branch schema | Profile parser/schema | Require branches to contain only `label`, `select`, and `assert`; reject nested groups, nested `when`, empty labels, and duplicate labels. | FUNC-3 |
| TECH-4 | Applicability compiler | Rule compiler | Compile `when` clauses using the same selector/assertion machinery as validation branches while keeping config errors fatal. | FUNC-2 |
| TECH-5 | Grouped-rule compiler | Rule compiler | Compile flat, `anyOf`, and `allOf` rule plans into closed internal records with deterministic branch order. | FUNC-3 |
| TECH-6 | Applicability evaluator | Rule evaluator | Evaluate `when`, return matched or not-matched status, and prevent non-matching applicability diagnostics from reaching top-level diagnostics. | FUNC-2 |
| TECH-7 | Grouped-rule evaluator | Rule evaluator | Evaluate branches in profile order, preserve nested diagnostics, select successful `anyOf` branch deterministically, and emit summary diagnostics for failed groups. | FUNC-3 |
| TECH-8 | ID count evaluator | ID assertion evaluator | Apply `minCount` and `maxCount` to unique comparison values after prefix filtering and occurrence de-duplication. | FUNC-4 |
| TECH-9 | Table-column coverage evaluator | New assertion evaluator | Extract source ID set, resolve target table column, compare target-column tokens, and emit structural or coverage diagnostics. | FUNC-5 |
| TECH-10 | V2 result model | API result layer | Expose `status`, derived `passed`, nested `when`, nested `evaluation`, branch results, and v2 profile counts. | FUNC-2 / FUNC-3 / FUNC-6 |
| TECH-11 | Diagnostic promotion rules | Diagnostic builder | Keep top-level diagnostics outcome-bearing and keep branch/applicability explanations nested unless a summary diagnostic is required. | FUNC-2 / FUNC-3 / FUNC-5 |
| TECH-12 | Evidence serializer update | Evidence layer | Clone nested v2 rule results, top-level diagnostics, resolved profile hash input, input hash input, engine version, and runtime version deterministically. | FUNC-6 |
| TECH-13 | CLI JSON union update | CLI adapter | Emit v1 or v2 validation-result JSON based on profile syntax version and retain profile-stage failure behavior. | FUNC-6 |
| TECH-14 | Contract documentation and examples | Documentation | Publish v2 grammar, result shape, diagnostics, evidence, migration, and motivating examples. | FUNC-1 / FUNC-6 |
| TECH-15 | Decomposed package gates | Test/review harness | Enforce staged implementation packages, targeted validation commands, compatibility gates, and final release verification. | FUNC-7 |

Technical feasibility evidence:

| Feasibility claim | Existing implementation evidence | Residual implementation gap | Verification gate |
| --- | --- | --- | --- |
| Syntax-versioned schema dispatch can be added without silent v1 changes. | V1 syntax, selector, assertion, closed-key, and direct-profile validation already live in `src/declarative-validation/profile/index.ts`, `src/declarative-validation/profile/schema.ts`, `src/declarative-validation/profile/selector-schema.ts`, `src/declarative-validation/profile/assertion-schema.ts`, and `src/declarative-validation/profile/direct-profile-diagnostics.ts`, with coverage in `tests/declarative-validation-profile.test.ts` and `tests/declarative-validation-contract.test.ts`. | Add a discriminated v2 schema branch while keeping the v1 parser and diagnostics unchanged. | `VAL-1` / `VAL-2` / `VAL-10` |
| Flat, grouped, and applicability plans can reuse the existing selector/assertion compiler boundary. | Existing compiled rule plans and assertion dispatch are isolated in `src/declarative-validation/compiler/plan.ts`, `src/declarative-validation/compiler/index.ts`, `src/declarative-validation/compiler/assertions.ts`, `src/declarative-validation/compiler/assertion-builders.ts`, and `src/declarative-validation/compiler/compatibility.ts`. | Extend the internal plan union for flat v2 rules, `anyOf`, `allOf`, and `when` without exporting compiled plans from the package root. | `VAL-3` / `VAL-6` / `VAL-7` |
| ID count bounds can be implemented without changing ID token extraction. | Current ID token, target, duplicate, prefix, and case-sensitivity behavior is isolated in `src/declarative-validation/assertions/ids.ts`, `src/declarative-validation/assertions/id-targets.ts`, and `src/declarative-validation/assertions/id-tokens.ts`, with broad assertion coverage in `tests/declarative-validation-assertions.test.ts`. | Apply `minCount` and `maxCount` after existing prefix filtering and occurrence de-duplication. | `VAL-4` |
| Column-scoped coverage can be implemented without changing rich IR extraction. | Table row and cell selectors already exist in `src/declarative-validation/selectors/table-targets.ts`; reference-source and table-ID behavior already exists in `src/declarative-validation/assertions/references.ts` and `src/declarative-validation/assertions/id-targets.ts`. | Add a dedicated `tableColumnCoverage` evaluator that reads only the configured target table column and never falls back to whole-section text. | `VAL-5` / `VAL-13` |
| V2 result and evidence serialization can remain deterministic. | Public result types live in `src/declarative-validation/results/index.ts`; evidence hashing and stable JSON serialization are centralized in `src/declarative-validation/evidence/index.ts`; repeatability coverage exists in `tests/declarative-validation-repeatability.test.ts` and `tests/support/declarative-validation-repeatability.ts`. | Clone nested v2 rule results, skipped evaluations, and branch diagnostics while preserving v1 result and evidence shapes. | `VAL-8` / `VAL-9` / `VAL-11` |
| V2 conditionals can remain inert profile data. | JSON-safe profile closure and boundary checks already exist in `src/declarative-validation/profile/materialization.ts`, `src/declarative-validation/profile/data-closure.ts`, and `scripts/check-declarative-validation-boundary.mjs`. | Add unsupported and executable-key coverage at each new v2 nested object boundary. | `VAL-2` / `VAL-12` |

Feasibility conclusion: The design maps each high-risk v2 mechanism to an existing module boundary and an explicit package gate. This supports a technical feasibility score of `3` at the design-spec level, while `CON-6` still prohibits implementing the 38-path surface as one broad patch.

Section status: Complete

## 14. Data, Schemas, and Compatibility

V2 profile shape:

```ts
type DeclarativeValidationSyntaxVersion =
  | "markdown-engine.validation@v1"
  | "markdown-engine.validation@v2";

interface ValidationProfileV2 {
  syntaxVersion: "markdown-engine.validation@v2";
  documentVersion?: EngineDocumentVersion;
  rules: readonly DeclarativeValidationRuleV2[];
}

interface DeclarativeValidationRuleV2 {
  id: string;
  severity?: "error" | "warning" | "info";
  when?: DeclarativeApplicabilityClause;
  select?: DeclarativeSelector;
  assert?: DeclarativeAssertionV2;
  anyOf?: readonly DeclarativeValidationBranchV2[];
  allOf?: readonly DeclarativeValidationBranchV2[];
}

interface DeclarativeApplicabilityClause {
  select: DeclarativeSelector;
  assert: DeclarativeAssertionV2;
}

interface DeclarativeValidationBranchV2 {
  label?: string;
  select: DeclarativeSelector;
  assert: DeclarativeAssertionV2;
}
```

V2 rule-shape constraints:

- A v2 rule shall declare exactly one evaluation shape: `select` plus `assert`, `anyOf`, or `allOf`.
- `when` is optional and may appear with any one evaluation shape.
- `when` shall contain only `select` and `assert`.
- A branch shall contain only `label`, `select`, and `assert`.
- Branch groups are one level deep; branches shall not contain `when`, `anyOf`, or `allOf`.
- `anyOf` and `allOf` arrays shall be non-empty.
- Branch labels are optional; when provided they shall be non-empty and unique within the containing group.
- Omitted branch labels use deterministic zero-based branch indexes for result identifiers and diagnostics.

V2 assertion extensions:

```ts
interface DeclarativeAssertionV2 extends DeclarativeAssertionV1 {
  ids?: {
    prefix?: string;
    unique?: true;
    caseSensitive?: boolean;
    minCount?: number;
    maxCount?: number;
  };
  tableColumnCoverage?: {
    source: {
      section: string;
      column: string;
      prefix?: string;
      caseSensitive?: boolean;
    };
    target: {
      section: string;
      tableHeader?: readonly string[];
      column: string;
    };
    require: "everySourceId";
  };
}
```

ID count semantics:

- `prefix` filtering applies before counting.
- Occurrence de-duplication uses the existing occurrence-key model before counting.
- Counts are based on unique comparison values after prefix filtering and occurrence de-duplication.
- `minCount` and `maxCount` are non-negative integers.
- When both bounds are present, `minCount` shall be less than or equal to `maxCount`.
- `unique: true` keeps existing duplicate-ID behavior and may be combined with count bounds.

Table-column coverage semantics:

- `tableColumnCoverage` is compatible with a `document` selector only because the assertion owns its source and target table-column inputs.
- `source.section` and `source.column` identify the source table column used to derive the source ID set.
- `source.prefix` uses the same ID token prefix filtering as `ids` and `references`.
- `target.section`, optional `target.tableHeader`, and `target.column` identify the target table column used for coverage.
- `require: "everySourceId"` passes only when every unique source ID comparison value appears at least once in the configured target column.
- Missing target section emits `profile.validation.targetSectionMissing`.
- Missing target column emits `profile.validation.targetColumnMissing`.
- Missing source-to-target coverage emits `profile.validation.targetColumnReferenceMissing`.
- Missing source IDs emit `profile.validation.emptySelection`, preserving the existing no-source behavior for ID/reference assertions.

V2 result shape:

```ts
type RuleStatus = "passed" | "failed" | "skipped";

interface DeclarativeValidationResultV2 extends ValidationResult {
  valid: boolean;
  diagnostics: readonly MarkdownDiagnostic[];
  ruleResults: readonly ValidationRuleResultV2[];
  profile: {
    syntaxVersion: "markdown-engine.validation@v2";
    documentVersion: EngineDocumentVersion;
    ruleCount: number;
    evaluatedRuleCount: number;
    skippedRuleCount: number;
  };
  evidence?: DeclarativeValidationEvidenceV2;
}

interface ValidationRuleResultV2 {
  ruleId: string;
  status: RuleStatus;
  passed: boolean;
  diagnostics: readonly MarkdownDiagnostic[];
  when?: ApplicabilityResult;
  evaluation: RuleEvaluationResult;
}

interface ApplicabilityResult {
  status: "matched" | "notMatched";
  diagnostics: readonly MarkdownDiagnostic[];
}

type RuleEvaluationResult =
  | { kind: "skipped"; reason: "whenNotMatched" }
  | { kind: "assertions"; diagnostics: readonly MarkdownDiagnostic[] }
  | {
      kind: "anyOf";
      selectedBranch?: BranchReference;
      branches: readonly BranchResult[];
    }
  | {
      kind: "allOf";
      branches: readonly BranchResult[];
    };

interface BranchReference {
  branchIndex: number;
  label?: string;
}

interface BranchResult {
  branchIndex: number;
  label?: string;
  status: "passed" | "failed";
  diagnostics: readonly MarkdownDiagnostic[];
}
```

Result compatibility rules:

- V1 `DeclarativeValidationResult` remains unchanged.
- Public API and CLI JSON become a syntax-version-discriminated union of v1 result, v2 result, and profile-stage config error result.
- `passed` remains a derived compatibility convenience. It is `true` when `status` is `passed` or `skipped`; it is `false` when `status` is `failed`.
- A skipped rule result shall include `evaluation: { kind: "skipped", reason: "whenNotMatched" }` and shall not serialize the unevaluated planned rule body as an evaluated result.
- `profile.ruleCount` counts all configured rules, including skipped rules.
- `profile.evaluatedRuleCount` counts configured rules whose applicability matched or that have no `when`.
- `profile.skippedRuleCount` counts configured rules whose applicability did not match.
- Aggregate `valid` is `false` only when one or more top-level diagnostics have `severity: "error"`, matching v1 behavior. Top-level warning and info diagnostics may produce `status: "failed"` and `passed: false` for an individual rule without making aggregate `valid` false.
- Nested branch and applicability diagnostics are explanatory unless promoted through a top-level summary diagnostic.

Diagnostic promotion rules:

- Flat assertion failures appear in the rule's top-level `diagnostics` and the aggregate top-level result `diagnostics`.
- A non-matching `when` produces `status: "skipped"`, `passed: true`, `evaluation.kind: "skipped"`, no top-level diagnostics, and nested `when.diagnostics`.
- A successful `anyOf` produces `status: "passed"`, no top-level diagnostics, a `selectedBranch`, and nested failed-branch diagnostics where applicable.
- A failed `anyOf` produces `status: "failed"` and one top-level `profile.validation.noAlternativeMatched` diagnostic.
- A successful `allOf` produces `status: "passed"` and no top-level diagnostics.
- A failed `allOf` produces `status: "failed"` and one top-level `profile.validation.groupRequirementFailed` diagnostic.

V2 diagnostic additions:

| Code | Severity source | Emitted when |
| --- | --- | --- |
| `profile.validation.noAlternativeMatched` | Rule severity | A v2 `anyOf` rule has no passing branch. |
| `profile.validation.groupRequirementFailed` | Rule severity | A v2 `allOf` rule has one or more failed branches. |
| `profile.validation.idCountTooLow` | Rule severity | Unique ID count after filtering is lower than `ids.minCount`. |
| `profile.validation.idCountTooHigh` | Rule severity | Unique ID count after filtering is higher than `ids.maxCount`. |
| `profile.validation.targetSectionMissing` | Rule severity | `tableColumnCoverage.target.section` cannot be resolved. |
| `profile.validation.targetColumnMissing` | Rule severity | `tableColumnCoverage.target.column` cannot be resolved in the target table. |
| `profile.validation.targetColumnReferenceMissing` | Rule severity | A source ID is absent from the configured target table column. |

Evidence compatibility:

- V1 evidence remains unchanged.
- V2 evidence contains `inputHash`, `profileHash`, `engineVersion`, `runtimeVersion`, nested v2 `ruleResults`, and top-level `diagnostics`.
- `inputHash` remains the SHA-256 of the stable JSON serialization of the normalized `EngineDocument` after omitting only top-level `document.path`.
- `profileHash` is the SHA-256 of the stable JSON serialization of the resolved v2 profile after applying resolved `documentVersion` and default rule severity.
- `includeEvidence` remains excluded from hashes.
- Nested branch results, skipped results, and applicability results are part of the evidence payload but not part of `inputHash` or `profileHash`.

Example Section 4 table-or-none:

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

Example Section 15 table-or-N/A:

```yaml
rules:
  - id: section15.controls-or-na
    anyOf:
      - label: controls-table
        select:
          target: table
          section: 15. Control Logic and Non-Functional Controls
          header:
            - Requirement
            - Mechanism
            - Notes
        assert:
          tableColumnsRequired:
            columns:
              - Requirement
              - Mechanism
              - Notes
      - label: explicit-na-rationale
        select:
          target: textSpan
          section: 15. Control Logic and Non-Functional Controls
          textIncludes: N/A
        assert:
          text:
            contains: rationale
```

Example R1 standard-or-replacement traceability:

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
          target: document
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
      - label: section17-replacement
        select:
          target: document
        assert:
          tableColumnCoverage:
            source:
              section: 5. Requirements
              column: ID
              prefix: REQ
            target:
              section: 17. Verification Strategy and Behavior-to-Mechanism Traceability
              column: Requirement
            require: everySourceId
```

Example mixed ID family counts:

```yaml
rules:
  - id: section2.objectives-present
    select:
      target: tableCell
      section: 2. Objectives and Non-Objectives
      column: ID
    assert:
      ids:
        prefix: OBJ
        unique: true
        minCount: 1
  - id: section2.non-objectives-present
    select:
      target: tableCell
      section: 2. Objectives and Non-Objectives
      column: ID
    assert:
      ids:
        prefix: NG
        unique: true
        minCount: 1
```

Example Section 11 target-column coverage:

```yaml
rules:
  - id: section11.requirement-column-covers-reqs
    select:
      target: document
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

| Change | Type | Compatibility impact | Reversibility | Mitigation |
| --- | --- | --- | --- | --- |
| `markdown-engine.validation@v2` syntax version | Config | Additive; v1 profiles remain on v1 parser and behavior. | Reversible before release; semver-controlled after release | Syntax-version dispatch tests and v1 compatibility suite. |
| V2 rule shape with flat, `anyOf`, `allOf`, and `when` | Schema | Additive for v2; invalid in v1. | Reversible before release | Contract docs, schema tests, unsupported-key diagnostics. |
| `ids.minCount` and `ids.maxCount` | Schema | Additive for v2; invalid in v1. | Reversible before release | `BEL-1075` targeted fixtures and count semantics docs. |
| `tableColumnCoverage` | Schema | Additive for v2; invalid in v1. | Reversible before release | `BEL-1076` targeted fixtures and diagnostic docs. |
| V2 nested result and evidence shape | API | Additive union; consumers that handle only v1 must branch on profile syntax version. | Reversible before release; semver-controlled after release | Contract tests, CLI JSON tests, migration notes, controlled downstream exercise. |
| V2 diagnostic codes | API | Additive public codes for v2. | Reversible before release | Diagnostic snapshot tests and contract docs. |

Section status: Complete

## 15. Control Logic and Non-Functional Controls

Control logic summary: Validation dispatches by syntax version. V1 uses the existing parser, compiler, evaluator, result serializer, evidence serializer, CLI JSON, and diagnostics. V2 validates profile shape, compiles optional applicability, compiles exactly one rule evaluation shape, evaluates applicability before the rule body, evaluates branches in profile order, promotes only outcome-bearing diagnostics to top-level diagnostics, serializes nested rule results deterministically, and derives aggregate `valid` from top-level diagnostics.

Concurrency and ordering model: The engine remains invocation-local and stateless. Rule order follows profile order unless existing v1 sorting requires otherwise for v1; v2 branch order follows array order; diagnostics sort by existing deterministic diagnostic ordering plus rule order, branch index, assertion index, target key, and diagnostic order. No concurrent worker, cache, retry, timeout, network, or shared mutable state is introduced.

Failure recovery model: Config and compile failures return profile-stage diagnostics and do not evaluate rules. Validation failures return structured rule results and top-level diagnostics. Missing source evidence omits locations rather than fabricating them. A v2 regression can be contained by routing consumers back to v1 profiles or pinning the previous package version before public release; after release, rollback requires semver-compatible preservation or a new v2 patch that restores documented behavior.

| Requirement | Mechanism | Notes |
| --- | --- | --- |
| REQ-1 | TECH-1 / TECH-2 | Syntax dispatch and schema validation control v1/v2 separation. |
| REQ-2 | TECH-1 / TECH-13 / TECH-15 | V1 gates must pass unchanged. |
| REQ-3 | TECH-2 / TECH-5 / TECH-10 | Flat rules use v2 result shape without grouping. |
| REQ-4 | TECH-3 / TECH-5 / TECH-7 / TECH-11 | `anyOf` branch evaluation and diagnostic promotion are bounded. |
| REQ-5 | TECH-3 / TECH-5 / TECH-7 / TECH-11 | `allOf` uses the same branch result model. |
| REQ-6 | TECH-3 | Non-recursive schema limits group complexity. |
| REQ-7 | TECH-4 / TECH-6 | Applicability uses shared selector/assertion machinery. |
| REQ-8 | TECH-6 / TECH-10 | Skipped status is explicit and compatibility `passed` is derived. |
| REQ-9 | TECH-7 / TECH-11 | Successful `anyOf` branch diagnostics stay nested. |
| REQ-10 | TECH-7 / TECH-11 | Failed `anyOf` emits summary diagnostic. |
| REQ-11 | TECH-7 / TECH-11 | Failed `allOf` emits summary diagnostic. |
| REQ-12 | TECH-10 / TECH-12 | Nested diagnostics are available in results and evidence. |
| REQ-13 | TECH-8 | Count behavior is isolated to the ID evaluator. |
| REQ-14 | TECH-9 | Coverage behavior is isolated to a new assertion evaluator. |
| REQ-15 | TECH-10 / TECH-12 / TECH-13 | Deterministic serialization covers API, evidence, and CLI JSON. |
| REQ-16 | TECH-1 / TECH-2 / TECH-15 | Closed schema and boundary audit prevent executable behavior. |
| REQ-17 | TECH-14 | Contract docs become release input. |
| REQ-18 | TECH-15 | Implementation packages, gates, and stop conditions control blast radius. |

Section status: Complete

## 16. Observability, Operations, Rollout, and Rollback

| Signal | Type | Purpose | Consumer |
| --- | --- | --- | --- |
| V1 compatibility test result | Audit | Detect regressions to existing public behavior. | Project owner, implementer |
| V2 parser/compiler test result | Audit | Detect invalid schema acceptance or valid schema rejection. | Implementer |
| V2 branch/result snapshot diff | Audit | Detect unstable nested diagnostics or result shape drift. | Contract/API reviewer |
| V2 repeatability output hash | Audit | Prove deterministic API, CLI, and evidence JSON. | Project owner, CI users |
| Boundary audit result | Audit | Detect executable predicates, profile-specific semantics, or cross-boundary imports. | Security/boundary reviewer |
| Downstream design-spec fixture result | Audit | Prove motivating cases work without warnings-as-workaround. | Downstream profile owner |

Rollout plan: Execute implementation in six packages. Each package requires targeted tests before the next package starts, and final merge requires `npm run release:verify`.

| Package | Scope | Primary implementation surface | Exit gate | Stop condition |
| --- | --- | --- | --- | --- |
| PKG-1 | V2 contract, syntax dispatch, schema, result/evidence scaffolding, and v1 compatibility harness. | `docs/contracts/declarative-validation.md`; `src/api/declarative-validation.ts`; `src/declarative-validation/profile/*`; `src/declarative-validation/results/index.ts`; `src/declarative-validation/evidence/index.ts`; CLI JSON types. | `VAL-1` / `VAL-2` / `VAL-8` / `VAL-10` / `VAL-11` | Stop if any v1 parse, result, CLI, diagnostic, or evidence fixture changes without an explicit compatibility decision. |
| PKG-2 | `ids.minCount` and `ids.maxCount` for `BEL-1075`. | `src/declarative-validation/compiler/assertions.ts`; `src/declarative-validation/compiler/assertion-builders.ts`; `src/declarative-validation/compiler/assertion-shapes.ts`; `src/declarative-validation/assertions/ids.ts`; `src/declarative-validation/assertions/id-targets.ts`. | `VAL-4` plus existing ID uniqueness and prefix tests. | Stop if count behavior requires changing existing ID token grammar or duplicate-ID semantics. |
| PKG-3 | `tableColumnCoverage` for `BEL-1076`. | `src/declarative-validation/profile/assertion-schema.ts`; `src/declarative-validation/compiler/assertions.ts`; `src/declarative-validation/assertions/references.ts`; `src/declarative-validation/assertions/id-targets.ts`; `src/declarative-validation/selectors/table-targets.ts`. | `VAL-5` / targeted `VAL-13` column-coverage fixture. | Stop if target-column coverage cannot be proven without whole-section fallback or a rich IR contract change. |
| PKG-4 | `anyOf` and `allOf` grouped evaluation. | `src/declarative-validation/compiler/plan.ts`; `src/declarative-validation/compiler/index.ts`; `src/declarative-validation/assertions/evaluator.ts`; `src/declarative-validation/assertions/diagnostics.ts`; v2 result serialization. | `VAL-3` / `VAL-6` / `VAL-9` | Stop if branch diagnostics cannot stay nested while preserving aggregate validity semantics. |
| PKG-5 | Rule-level `when`, matched/not-matched applicability, and skipped result semantics. | `src/declarative-validation/compiler/plan.ts`; `src/declarative-validation/compiler/index.ts`; `src/declarative-validation/assertions/evaluator.ts`; `src/declarative-validation/results/index.ts`; `src/declarative-validation/evidence/index.ts`. | `VAL-7` / `VAL-8` / `VAL-9` | Stop if skipped rules require serializing unevaluated planned rule bodies or emitting top-level diagnostics. |
| PKG-6 | Downstream design-spec fixtures, CLI parity, repeatability, documentation, boundary audit, and release hardening. | `tests/declarative-validation-downstream.test.ts`; `tests/declarative-validation-cli.test.ts`; `tests/declarative-validation-repeatability.test.ts`; `fixtures/declarative-validation/conditionals/`; contract docs; boundary scripts. | `VAL-1` through `VAL-14`; `npm run release:verify` | Stop if any heightened-control gate lacks evidence or downstream fixtures show false acceptance. |

Rollback or containment plan: Before public release, revert or pause the failing implementation package and keep v1 validation as the only documented public syntax. After public release, preserve v1 behavior, treat v2 regressions as contract defects, ship a patch that restores documented v2 behavior, and document any consumer migration if a v2 correction changes observable output. Trigger rollback or containment on any v1 compatibility regression, v2 evidence nondeterminism, branch diagnostic promotion ambiguity, executable-profile boundary violation, or downstream fixture false acceptance.

Operator actions: Maintainers review failing package gates, inspect contract diffs, rerun targeted validation commands, compare v1 and v2 CLI JSON snapshots, update contract docs only with reviewer approval, and stop final merge if any heightened-control gate lacks evidence.

Heightened controls:

| Control ID | Applies through | Control | Owner | Verification |
| --- | --- | --- | --- | --- |
| HC-1 | Implementation | Split execution by package boundary and do not merge a broad undifferentiated patch. | Implementer | `VAL-14` package evidence |
| HC-2 | Implementation | Include an independent contract/API reviewer for v2 result, evidence, and CLI JSON. | Project owner | Review record before final merge |
| HC-3 | Launch | Run v1 compatibility gates and v2 targeted gates before final release verification. | Implementer | `VAL-1` through `VAL-13` |
| HC-4 | Launch | Exercise downstream design-spec fixtures for Section 4, Section 15, R1 traceability, mixed ID counts, and Section 11 coverage. | Downstream profile owner | `VAL-13` |
| HC-5 | Steady state | Treat v2 result shape and diagnostic codes as public contract after release. | Project owner | Contract docs and changelog |

Section status: Complete

## 17. Verification Strategy and Behavior-to-Mechanism Traceability

| ID | Verification method | What is verified | Related IDs |
| --- | --- | --- | --- |
| VAL-1 | Test | Existing v1 declarative validation profile, compiler, assertion, CLI, examples, downstream, repeatability, and contract tests pass unchanged. | REQ-2 / TECH-1 / TECH-13 / TECH-15 |
| VAL-2 | Test | V2 parser/schema accepts valid flat/grouped/applicability profiles and rejects unsupported, recursive, ambiguous, regex-like, and executable-like shapes. | REQ-1 / REQ-3 / REQ-4 / REQ-5 / REQ-6 / REQ-16 / TECH-1 / TECH-2 / TECH-3 |
| VAL-3 | Test | Compiler produces closed v2 plans for flat rules, `anyOf`, `allOf`, and `when`, and emits deterministic compile diagnostics for invalid shapes. | REQ-3 / REQ-4 / REQ-5 / REQ-7 / TECH-4 / TECH-5 |
| VAL-4 | Test | `ids.minCount` and `ids.maxCount` apply to unique comparison values after prefix filtering and occurrence de-duplication. | REQ-13 / TECH-8 / BEL-1075 |
| VAL-5 | Test | `tableColumnCoverage` resolves source IDs, target section, target column, missing structural cases, and missing target-column ID coverage. | REQ-14 / TECH-9 / BEL-1076 |
| VAL-6 | Test | `anyOf` and `allOf` produce deterministic branch results, selected branch metadata, nested branch diagnostics, and exactly one top-level summary diagnostic on group failure. | REQ-4 / REQ-5 / REQ-9 / REQ-10 / REQ-11 / REQ-12 / TECH-7 / TECH-11 |
| VAL-7 | Test | `when` produces matched and not-matched applicability results, explicit skipped rule status, and no top-level diagnostics for non-matching applicability. | REQ-7 / REQ-8 / TECH-4 / TECH-6 |
| VAL-8 | Test | V2 public API result shape exposes `status`, derived `passed`, skipped evaluation placeholders, error-severity aggregate validity, nested evaluation, `evaluatedRuleCount`, and `skippedRuleCount`. | REQ-8 / REQ-15 / TECH-10 |
| VAL-9 | Test | V2 API, CLI, and evidence JSON are byte-for-byte deterministic across 10 repeated runs, including nested branch and skipped-rule cases. | REQ-9 / REQ-10 / REQ-11 / REQ-12 / REQ-15 / TECH-10 / TECH-12 / TECH-13 |
| VAL-10 | Inspection | Contract docs define v2 grammar, result shape, diagnostics, CLI JSON, evidence hashes, examples, compatibility, migration, and non-goals. | REQ-1 / REQ-17 / TECH-14 |
| VAL-11 | Test | CLI emits unchanged v1 JSON for v1 profiles and documented v2 JSON for v2 profiles, with profile-stage failures preserved. | REQ-2 / REQ-15 / REQ-17 / TECH-13 |
| VAL-12 | Inspection | Boundary audit finds no scripts, plugins, callbacks, expression evaluators, user-supplied regex execution, network calls, LLM calls, or design-spec-specific core semantics. | REQ-16 / TECH-15 |
| VAL-13 | Manual / Test | Downstream design-spec-like fixtures prove Section 4 table-or-none, Section 15 table-or-N/A, R1 standard-or-replacement traceability, mixed ID counts, and Section 11 target-column coverage. | REQ-4 / REQ-7 / REQ-13 / REQ-14 / TECH-7 / TECH-8 / TECH-9 |
| VAL-14 | Inspection | Implementation package evidence shows package gates were executed before final merge and `npm run release:verify` passes. | REQ-18 / TECH-15 |

Minimum targeted commands:

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

| Behavior or requirement | Mechanisms | Verification |
| --- | --- | --- |
| FUNC-1 | TECH-1 / TECH-2 | VAL-2 / VAL-10 |
| FUNC-2 | TECH-2 / TECH-4 / TECH-6 / TECH-10 | VAL-3 / VAL-7 / VAL-8 |
| FUNC-3 | TECH-3 / TECH-5 / TECH-7 / TECH-10 / TECH-11 | VAL-3 / VAL-6 / VAL-8 / VAL-9 |
| FUNC-4 | TECH-8 | VAL-4 |
| FUNC-5 | TECH-9 | VAL-5 |
| FUNC-6 | TECH-10 / TECH-12 / TECH-13 / TECH-14 | VAL-8 / VAL-9 / VAL-10 / VAL-11 |
| FUNC-7 | TECH-15 | VAL-1 / VAL-12 / VAL-14 |
| REQ-1 | TECH-1 / TECH-2 | VAL-2 / VAL-10 |
| REQ-2 | TECH-1 / TECH-13 / TECH-15 | VAL-1 / VAL-11 |
| REQ-3 | TECH-2 / TECH-5 / TECH-10 | VAL-2 / VAL-3 |
| REQ-4 | TECH-3 / TECH-5 / TECH-7 / TECH-11 | VAL-3 / VAL-6 / VAL-13 |
| REQ-5 | TECH-3 / TECH-5 / TECH-7 / TECH-11 | VAL-3 / VAL-6 |
| REQ-6 | TECH-3 | VAL-2 / VAL-3 |
| REQ-7 | TECH-4 / TECH-6 | VAL-3 / VAL-7 / VAL-13 |
| REQ-8 | TECH-6 / TECH-10 | VAL-7 / VAL-8 |
| REQ-9 | TECH-7 / TECH-11 / TECH-12 | VAL-6 / VAL-9 |
| REQ-10 | TECH-7 / TECH-11 | VAL-6 / VAL-9 |
| REQ-11 | TECH-7 / TECH-11 | VAL-6 / VAL-9 |
| REQ-12 | TECH-10 / TECH-12 | VAL-6 / VAL-9 |
| REQ-13 | TECH-8 | VAL-4 / VAL-13 |
| REQ-14 | TECH-9 | VAL-5 / VAL-13 |
| REQ-15 | TECH-10 / TECH-12 / TECH-13 | VAL-8 / VAL-9 / VAL-11 |
| REQ-16 | TECH-1 / TECH-2 / TECH-15 | VAL-2 / VAL-12 |
| REQ-17 | TECH-14 | VAL-10 / VAL-11 |
| REQ-18 | TECH-15 | VAL-14 |

Section status: Complete

## 18. Alternatives, Risks, Open Questions, and Final Exit

| Alternative | Reason considered | Reason rejected |
| --- | --- | --- |
| Keep v1 and weaken optional checks to warnings | Lowest engine change cost and already used by the current design-spec profile workaround. | It preserves false acceptance risk and cannot strictly encode authorized alternatives or column-scoped traceability. |
| Split downstream profiles by rigor level or document shape | Avoids engine conditionals. | It duplicates large profile files, increases drift, and still cannot express table-or-none branches cleanly in one rule. |
| Add assertion-only `anyOf` under one selector | Smaller grammar than branch-level groups. | The motivating cases require different selectors per valid branch. |
| Extend v1 in place | Avoids a new syntax version. | It risks silent behavior changes and result-shape ambiguity for existing consumers. |
| Add `not` in the first v2 release | Could express absence and negative predicates. | Deterministic diagnostics and source evidence are not required for current cases and would broaden first-release risk. |
| Overload `references` for target columns | Reuses existing assertion name. | A new `tableColumnCoverage` assertion keeps section-level references and table-column coverage separate and easier to review. |
| Promote all failed branch diagnostics to top-level diagnostics | Gives immediate detail in aggregate output. | It would make successful `anyOf` alternatives look failed and could incorrectly affect aggregate validity. |

| ID | Statement | Likelihood | Consequence | Mitigation |
| --- | --- | --- | --- | --- |
| RISK-1 | V2 result shape can break consumers that assume flat v1 rule results. | Medium | High | Preserve v1 result shape, discriminate v2 by `profile.syntaxVersion`, document migration, and run CLI/API contract tests. |
| RISK-2 | Nested branch diagnostics can be misinterpreted as aggregate failures. | Medium | High | Define aggregate validity from top-level diagnostics only and test successful `anyOf` with failed nested branches. |
| RISK-3 | Implementation blast radius can exceed review capacity. | High | High | Enforce package decomposition, independent contract review, targeted gates, and final `release:verify`. |
| RISK-4 | `tableColumnCoverage` can accidentally fall back to whole-section text. | Medium | High | Require missing target structural diagnostics and target-column-only fixtures. |
| RISK-5 | `ids.minCount` semantics can be confused between raw occurrences and unique IDs. | Medium | Medium | Specify unique comparison values after prefix filtering and occurrence de-duplication; test duplicate and case-sensitive cases. |
| RISK-6 | `when` can hide invalid documents if skipped semantics are unclear. | Medium | High | Expose `status: "skipped"`, `when.status`, skipped counts, and downstream fixtures that show matched, not-matched, pass, and fail cases. |
| RISK-7 | Profile data hardening can regress when v2 adds nested structures. | Low | High | Reuse v1 JSON-safe materialization and add unsupported/executable-key tests at every new nested object boundary. |

No open questions

Waivers: none

Final readiness statement: Ready with heightened controls

Section status: Complete

## Final Consistency Gate

| Gate | Result |
| --- | --- |
| Every section from 0 through 18 has a valid status and no required section is incomplete. | Pass |
| Every `REQ-*` appears in section 11 and section 17. | Pass |
| Every `FUNC-*` appears in section 17. | Pass |
| Every `TECH-*` appears in section 17. | Pass |
| Every `ACC-*` referenced is defined in section 10. | Pass |
| Every `VAL-*` referenced is defined in section 17. | Pass |
| No open `Q-*` items remain. | Pass |
| No section is marked `Deferred`. | Pass |
| R3 triggers are present and selected rigor is `R3`. | Pass |
| Final readiness statement matches `R3`. | Pass |
| No R3 waiver is required. | Pass |

## Internal Review Record

| Field | Value |
| --- | --- |
| Document | `docs/design/conditional-declarative-validation-v2-design-spec.md` |
| Review date | 2026-05-17 |
| Moderator | Codex internal review |
| Decision owner | Project owner |
| Proposed rigor level | `R3` |
| Reviewed rigor level | `R3` |
| Calibration result | Accept |
| Structural result | Pass after revision |
| Semantic result | Pass after revision |
| Traceability result | Pass after revision |
| Baseline validation result | Passed after revision with `markdown-engine validate --file docs/design/conditional-declarative-validation-v2-design-spec.md --profile /Users/jasonbelmonti/.codex/skills/design-spec/references/design-spec-validation-profile.yaml --format json` |
| Verdict | Approve with heightened controls |
| Open findings | none |
| Resolved findings verified in this decision | `ST-1`; `SM-1`; `TR-1`; `CR-1`; `CR-2`; `CR-3`; `CR-4`; `DV-1`; `FS-1` |
| Reviewed waivers | none |
| Required heightened controls | `HC-1` / `HC-2` / `HC-3` / `HC-4` / `HC-5` |
| Approval conditions | none |
| Top blockers | none |
| Required follow-ups | Create or update implementation tickets for grouped rules, `when`, v2 result contract, and downstream design-spec profile exercise before coding those packages. |

### Calibration

| Field | Value |
| --- | --- |
| Proposed rigor level | `R3` |
| Reviewed rigor level | `R3` |
| Calibration result | Accept |
| Rationale | The design changes public profile grammar, result shape, diagnostics, evidence, CLI JSON, and compatibility behavior for a shared validation engine. Execution estimation for implementation returned high blast radius and `decompose-first`; heightened controls are required. |

### Findings Addressed

| Finding ID | Severity | Status | Section | Finding | Required action | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| ST-1 | Major | Resolved | 14 / 15 | Initial draft risked ambiguity between nested branch diagnostics and aggregate top-level diagnostics. | Define explicit diagnostic promotion rules, aggregate validity source, and result/evidence nesting. | Codex |
| SM-1 | Major | Resolved | 14 / 18 | Initial draft carried open design questions about `allOf`, branch labels, skipped counts, and ID count semantics. | Convert open questions into design decisions and record no open questions. | Codex |
| TR-1 | Major | Resolved | 11 / 17 | Initial draft needed complete traceability from all `REQ-*` items to behaviors, mechanisms, and verification. | Add complete section 11 and section 17 matrices. | Codex |
| CR-1 | Blocker | Resolved | 14 | Consensus review found `tableColumnCoverage` selector compatibility contradicted the R1 example. | Keep `tableColumnCoverage` document-selector compatibility and change the R1 example branches to `target: document`. | Codex |
| CR-2 | Blocker | Resolved | 14 | Consensus review found skipped-rule result serialization underspecified because `evaluation` was required. | Add `evaluation.kind: "skipped"` with `reason: "whenNotMatched"` and state skipped results do not serialize unevaluated planned bodies. | Codex |
| CR-3 | Blocker | Resolved | 14 / 17 | Consensus review found aggregate `valid` ambiguous for warning/info top-level diagnostics. | Define v2 aggregate validity as false only for top-level error diagnostics, matching v1, and add result-shape verification coverage. | Codex |
| CR-4 | Blocker | Resolved | 1 / proposed files | Consensus review found the proposed implementation surface list incomplete relative to API, result, evidence, and CLI scope in the final spec. | Expand the implementation surface captured in this spec to include public contract, API/result/evidence, CLI, profile, compiler, evaluator, tests, docs, and fixtures; update estimation references to the 38-path proposed surface. | Codex |
| DV-1 | Blocker | Resolved | Layer 1 Exit / Layer 2 Exit | Baseline deterministic validation failed because required `Layer 1 Exit` and `Layer 2 Exit` sections were missing. | Add the required exit headings before the existing layer status lines and rerun baseline validation. | Codex |
| FS-1 | Minor | Resolved | 13 / 16 / semantic score | Technical feasibility was scored `2` because implementation evidence was source-grounded but still broad. | Add a source-grounded feasibility evidence matrix, expand package-level rollout gates, and update technical feasibility to `3` without claiming implementation slices were executed. | Codex |

### Semantic Scores

| Dimension | Score | Notes |
| --- | --- | --- |
| Problem validity | 3 | Problem is grounded in the v1 contract and downstream design-spec workaround. |
| Requirement quality | 3 | Requirements are atomic, use one `shall`, and cover grammar, compatibility, diagnostics, evidence, and controls. |
| Functional adequacy | 3 | Layer 2 covers v1, v2 flat rules, groups, applicability, ID counts, column coverage, CLI, and misuse. |
| Technical feasibility | 3 | Source-grounded mechanism allocation maps v2 schema, compiler, evaluator, result, evidence, CLI, and boundary work to existing modules and package gates; no implementation slice has been executed. |
| Non-functional adequacy | 3 | Determinism, inert config, compatibility, and boundary controls are explicit. |
| Operational safety | 3 | Rollout, rollback, containment, heightened controls, and stop conditions are specified. |
| Verification adequacy | 3 | Verification covers v1 compatibility, v2 grammar, result semantics, evidence, boundary audit, downstream fixtures, and release gates. |

### Traceability Result

Traceability result: Pass. Every `REQ-*` appears in section 11 and section 17, every `FUNC-*` maps to `TECH-*` and `VAL-*`, every `TECH-*` appears in section 17, and every high-risk claim has at least one verification item.

### Readiness Verdict

Readiness verdict: Approve with heightened controls. The design is ready to govern implementation only if the heightened controls in section 16 are enforced and implementation is decomposed before coding.
