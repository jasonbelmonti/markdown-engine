# Markdown Engine Operational Design Specification

## Document Control

| Field | Value |
| --- | --- |
| Title | Markdown Engine Deterministic Parsing and Validation |
| Status | Draft |
| Rigor level | `R2` |
| Rigor justification | The work is intended for durable package use and introduces public API, IR, diagnostic, and config contracts. It does not qualify for `R1` because API and config contracts are material design outputs. It does not trigger `R3` because it does not change authentication, authorization, secret handling, live customer data, irreversible data, or a high-volume production path. |
| Author(s) | Codex |
| Reviewers | Project owner, markdown-engine implementer, downstream profile/runtime consumer |
| Decision owner | Project owner |
| Target milestone or release | Initial `markdown-engine` package implementation |
| Last updated | 2026-04-27 |
| Related docs | `RUNTIME_ARCHITECTURE.md`; current project decisions captured in the user thread |
| Related tickets | none |

## 0. Executive Summary

Decision requested: Approve for implementation

Problem summary: Downstream agent-document tooling is unable to depend on a reusable deterministic Markdown foundation because no standalone engine currently parses GitHub Flavored Markdown, YAML frontmatter, normalized structure, declarative validation rules, and source-located diagnostics behind one stable contract, resulting in each consumer needing to invent parser behavior and validation semantics independently.

Proposed outcome: A reusable package that parses GitHub Flavored Markdown and YAML frontmatter, normalizes documents into a stable IR, validates deterministic rules from YAML-friendly declarative config, and returns structured diagnostics and results for downstream profile and runtime packages.

Why now: The project has been decomposed into `markdown-engine` first and downstream profile/runtime packages later, so the engine boundary and contracts must be approved before implementation starts.

Top risks or unknowns:

- Parser substrate selection could produce an IR that is difficult to keep stable across dependency upgrades.
- Declarative config could become too expressive and blur deterministic validation with semantic judgment.
- Downstream profile/runtime needs could pressure `markdown-engine` to absorb product-specific behavior.

Section status: Complete

## Layer 1: Problem and Requirements

## 1. Problem Definition

Problem declaration: Agent-document tooling is unable to validate special Markdown files through a reusable deterministic contract because the project has no standalone GFM parsing, normalized IR, YAML frontmatter, or declarative validation engine, resulting in duplicated parser decisions, brittle document checks, and unclear boundaries for downstream profile/runtime systems.

Affected actors or systems: Project owner, `markdown-engine` implementers, downstream `markdown-types`, `markdown-runtime`, `markdown-mcp`, `agent-adapters`, and coding agents that consume typed Markdown files.

Current-state baseline: As of 2026-04-27 the repository has 1 tracked architecture note, 0 implementation source files, 0 package APIs, 0 validation rule implementations, and at least 6 identified downstream special Markdown filetypes that may need type-backed interpretation.

Evidence or source: Direct inspection of repository state; `RUNTIME_ARCHITECTURE.md`; user decision to start with `markdown-engine` while preserving package decomposition.

Consequence of inaction: If implementation starts without this approved boundary, the first package may mix parser, profile, runtime, and agent-specific concerns during the initial build cycle, making later decomposition more expensive before the first downstream profile is usable.

Decision deadline or trigger: Before scaffolding the initial `markdown-engine` package or implementing the first parser, IR, config, or validator contract.

Section status: Complete

## 2. Objectives and Non-Objectives

| ID | Statement | Measurement or decision horizon |
| --- | --- | --- |
| OBJ-1 | Provide a standalone deterministic Markdown parsing and validation package for GFM documents with YAML frontmatter. | Initial package implementation review |
| OBJ-2 | Establish stable contracts for normalized IR, config schema, public API, and diagnostics. | Initial package implementation review |
| OBJ-3 | Keep product-specific Markdown profiles and agent-runtime interpretation outside `markdown-engine`. | Architecture review and implementation review |
| OBJ-4 | Enable downstream profile/runtime packages to consume engine output without forking parser behavior. | First downstream profile integration |
| NG-1 | This effort will not implement the Markdown profile meta-spec package. | Initial package implementation review |
| NG-2 | This effort will not implement MCP servers, hooks, skills, or agent adapters. | Initial package implementation review |
| NG-3 | This effort will not perform LLM semantic evaluation or behavioral agent benchmarking. | Initial package implementation review |
| NG-4 | This effort will not introduce custom Markdown dialect behavior beyond explicit GFM/frontmatter support and deterministic validation policies. | Initial package implementation review |

Section status: Complete

## 3. Stakeholders and Decision Authorities

| Stakeholder or role | Interest | Required action |
| --- | --- | --- |
| Project owner | Approves the boundary, rigor level, and implementation readiness. | Approve |
| Markdown-engine implementer | Implements the package API, IR, parser adapter, config handling, validator, and tests. | Review |
| Downstream profile/runtime consumer | Confirms engine output can support future profile compilation and runtime lenses without product-specific behavior in the engine. | Review |
| Coding-agent workflow user | Depends on reliable validation and diagnostics for future special Markdown filetypes. | Inform |
| Security/data/legal reviewer | Confirms raw HTML is treated as inert data and no live data, auth, compliance, or secret handling is introduced. | Consult |

Decision owner: Project owner

Section status: Complete

## 4. Constraints, Invariants, and Assumptions

| ID | Type | Statement | Source or rationale | Validation or resolution plan |
| --- | --- | --- | --- | --- |
| CON-1 | Constraint | The engine boundary is limited to parsing, normalization, deterministic validation, and diagnostics. | Handoff and runtime architecture direction | Verify all public API proposals during implementation review against `OBJ-3` and `NG-1` through `NG-3`. |
| CON-2 | Constraint | The parser behavior must align with GitHub Flavored Markdown instead of a repo-local Markdown dialect. | User requirement and handoff direction | Validate parser output against GFM fixtures and selected `cmark-gfm` comparison cases before release. |
| CON-3 | Constraint | Frontmatter and engine config inputs use YAML-friendly authoring formats. | User answer in handoff context | Verify sample frontmatter and config fixtures in `VAL-2` and `VAL-4`. |
| CON-4 | Invariant | Deterministic validation must not use LLM calls, semantic rubrics, or agent behavior traces. | Two-phase deterministic then semantic architecture | Add negative tests that reject semantic-style rule declarations through `VAL-4`. |
| CON-5 | Invariant | Unsupported declarative rules must fail explicitly instead of being interpreted heuristically. | Runtime architecture decision | Verify unsupported-rule diagnostics through `VAL-4`. |
| CON-6 | Invariant | The normalized engine IR and diagnostics are the stable public contracts; the raw parser AST is not a stable public contract in v1. | Downstream packages need parser-independent contracts. | Inspect public API, generated documentation, and semver classification in `VAL-7`. |
| CON-7 | Invariant | Deterministic validation operates on parsed frontmatter and normalized engine IR, not directly on raw parser AST nodes. | Validation rules should remain stable across parser dependency changes. | Verify rule fixtures through `VAL-3`, `VAL-4`, and `VAL-5`. |
| ASM-1 | Assumption | TypeScript on Node.js is acceptable for the initial package implementation. | Existing ecosystem fit for unified, micromark, mdast, and YAML tooling | Confirm when package scaffolding is created; if false, revise sections 12 through 17 before implementation proceeds. |
| ASM-2 | Assumption | A unified/micromark/mdast stack can satisfy required GFM coverage while preserving source locations. | Prior technology review and ecosystem fit | Prove with parser fixture and source-position tests in `VAL-1` and `VAL-3`. |
| ASM-3 | Assumption | The initial package can avoid persistent storage and network behavior. | Package is a local parser/validator library | Confirm by dependency audit and implementation review; fail the review if a service, database, or network dependency appears. |

Section status: Complete

## 5. Requirements

| ID | Type | Priority | Requirement statement | Rationale | Verification |
| --- | --- | --- | --- | --- | --- |
| REQ-1 | Functional | Must | The system shall parse GitHub Flavored Markdown documents through an internal parser adapter before normalization. | GFM support is the base product requirement while stable consumers depend on engine IR. | VAL-1 |
| REQ-2 | Functional | Must | The system shall parse YAML frontmatter into structured data when frontmatter is present. | Profile and config workflows require frontmatter validation. | VAL-2 |
| REQ-3 | Functional | Must | The system shall normalize parsed documents into a stable engine IR containing hierarchy, node type, text, and source location fields. | Validators and downstream packages need a stable structure that is not tied directly to parser internals. | VAL-3 |
| REQ-4 | Functional | Must | The system shall validate documents against declarative YAML-friendly config limited to supported deterministic rules. | Users need machine-checkable validation without hidden semantic inference. | VAL-4 |
| REQ-5 | Functional | Must | The system shall reject unsupported rule declarations with explicit diagnostics. | Honest unsupported-rule failures prevent magic behavior. | VAL-4 |
| REQ-6 | Functional | Must | The system shall emit machine-readable diagnostics with rule ID, severity, message, and source location when available. | CI, editors, agents, and downstream runtimes need stable diagnostics. | VAL-6 |
| REQ-7 | Operability | Must | The system shall expose documented public API functions for parse, normalize, validate, and result serialization. | Consumers need a stable package surface. | VAL-7 |
| REQ-8 | Reliability | Must | The system shall produce byte-for-byte identical JSON validation output for identical input, config, package version, and runtime version. | Deterministic validation is the central product guarantee. | VAL-5 |
| REQ-9 | Security | Must | The system shall represent raw HTML as inert data and apply the configured raw-HTML policy without executing HTML. | Markdown files may contain raw HTML, but this package must not execute or trust it. | VAL-6 |
| REQ-10 | Compatibility | Must | The system shall version public IR, config schema, diagnostic schema, and API contract changes with semantic versioning. | Downstream profile/runtime packages need predictable compatibility. | VAL-7 |

Section status: Complete

## 6. Success Measures and Kill Criteria

| Measure | Baseline | Target or decision threshold | Evaluation date or decision event | Related IDs |
| --- | --- | --- | --- | --- |
| GFM parser fixture coverage | 0 parser fixtures in repository on 2026-04-27 | Initial implementation includes at least 30 representative Markdown fixtures covering headings, lists, task lists, tables, code fences, links, references, emphasis, blockquotes, and raw HTML. | Initial implementation review | OBJ-1 / REQ-1 |
| Frontmatter fixture coverage | 0 frontmatter parser fixtures in repository on 2026-04-27 | Initial implementation includes valid, absent, empty, and invalid YAML frontmatter cases with deterministic diagnostics. | Initial implementation review | OBJ-1 / REQ-2 |
| Deterministic output repeatability | 0 repeatability tests in repository on 2026-04-27 | The same fixture suite produces no JSON output diff across 10 repeated validation runs in the same runtime. | Initial implementation review | OBJ-2 / REQ-8 |
| Supported deterministic rule families | 0 validation rule implementations in repository on 2026-04-27 | Initial implementation includes at least 5 deterministic rule families from headings, sections, node allow/deny, code fence languages, links, task-list items, raw HTML policy, and frontmatter schema. | Initial implementation review | OBJ-2 / REQ-4 |
| Boundary preservation | Architecture-only baseline on 2026-04-27 | No implementation dependency on MCP, hooks, LLM calls, agent traces, or product-specific profile IDs appears in `markdown-engine`. | Initial implementation review | OBJ-3 / REQ-4 |

Section status: Complete

Layer 1 status: Complete

## Layer 2: Functional Specification

## 7. System Context and External Interfaces

System boundary: `markdown-engine` is a local library package that accepts Markdown text and validation config, then returns parse, normalize, validation, diagnostic, and serialization results. It does not run as a network service in this design.

External actors and systems: Package consumers, CI jobs, future `markdown-types`, future `markdown-runtime`, local file readers owned by callers, GFM parser dependency, YAML parser dependency. There is no database, remote service, or browser runtime dependency.

Trust or control boundaries: Markdown input, YAML frontmatter, and validation config cross from caller-controlled content into the engine as untrusted data. Raw HTML remains inert data. Dependency upgrades cross a package-maintainer boundary and must be controlled by tests.

| Interface | Owner | Consumer or dependency | Inputs | Outputs |
| --- | --- | --- | --- | --- |
| Public package API | `markdown-engine` | Package consumers, CI, downstream profile/runtime packages | Markdown text, optional path, optional config, API options | Parse result, IR, validation result, diagnostics, serialized JSON |
| Parser adapter | `markdown-engine` | GFM parser dependency | Markdown body text and parser options | Parser syntax tree with source positions where available |
| Frontmatter adapter | `markdown-engine` | YAML parser dependency | Frontmatter text | Structured frontmatter value or frontmatter diagnostic |
| Config schema loader | `markdown-engine` | Package consumers and downstream type compiler | YAML-friendly validation config | Validated config model or config diagnostics |
| Serialized result contract | `markdown-engine` | CI, editor tools, agents, downstream packages | Validation result object | Stable JSON result |

Section status: Complete

## 8. Operational Scenarios and Functional Behavior

| ID | Trigger | Preconditions | Behavior or outcome | Related requirements |
| --- | --- | --- | --- | --- |
| FLOW-1 | A caller validates a Markdown document with supported config. | Markdown text and config are supplied through the public API. | The caller receives parse metadata, normalized engine IR, pass or fail status, and deterministic diagnostics. | REQ-1 / REQ-3 / REQ-4 / REQ-6 / REQ-7 |
| FLOW-2 | A caller validates a document that violates a heading or section rule. | The config declares a supported structural rule. | The caller receives a failed validation result with rule ID, severity, message, and source location when available. | REQ-4 / REQ-6 / REQ-8 |
| FLOW-3 | A caller supplies an unsupported semantic-style rule. | The config contains a rule outside the supported deterministic vocabulary. | The caller receives a config diagnostic and the engine does not infer or execute the unsupported rule. | REQ-4 / REQ-5 |
| FLOW-4 | A caller validates Markdown containing raw HTML. | The config declares the raw-HTML policy or the default policy applies. | The caller receives inert HTML representation in IR and any policy diagnostics without HTML execution. | REQ-3 / REQ-6 / REQ-9 |
| FLOW-5 | A downstream package serializes validation output for CI or agent runtime use. | Validation completed successfully or with deterministic diagnostics. | The caller receives stable JSON output for the same input, config, package version, and runtime version. | REQ-6 / REQ-8 / REQ-10 |
| FUNC-1 | Public API parse or validate call is invoked. | Input text is supplied. | The API returns normalized engine IR and parse metadata; raw parser AST is not a stable public contract in v1. | REQ-1 / REQ-3 / REQ-7 |
| FUNC-2 | Validation config contains supported deterministic rules. | Config schema validation succeeds. | The API returns rule results and diagnostics without semantic inference. | REQ-4 / REQ-6 / REQ-8 |
| FUNC-3 | Validation config contains unsupported declarations. | Config schema validation detects an unsupported declaration. | The API returns explicit config diagnostics. | REQ-5 / REQ-6 |
| FUNC-4 | Frontmatter is present. | Markdown input begins with YAML frontmatter delimiters. | The API returns structured frontmatter or a frontmatter diagnostic. | REQ-2 / REQ-6 |
| FUNC-5 | Raw HTML appears in Markdown input. | Markdown input contains raw HTML nodes. | The API treats raw HTML as inert data and evaluates only the configured policy. | REQ-3 / REQ-9 |

Section status: Complete

## 9. State Model, Faults, and Misuse Cases

States and transitions: The engine is stateless across calls. Per invocation it transitions through InputReceived, FrontmatterParsed, MarkdownParsed, Normalized, ConfigValidated, RulesEvaluated, and ResultSerialized. Failed parsing or config validation transitions to ResultSerialized with diagnostics instead of persistent partial state.

| Scenario | Expected behavior | Invariant maintained | Related IDs |
| --- | --- | --- | --- |
| Fault-1 | Invalid YAML frontmatter returns a frontmatter diagnostic and does not crash the process for expected parser errors. | Untrusted input remains data and diagnostics are structured. | REQ-2 / REQ-6 / FUNC-4 |
| Fault-2 | Unsupported validation config returns config diagnostics and does not execute custom logic. | Deterministic rule vocabulary remains closed in v1. | REQ-4 / REQ-5 / FUNC-3 |
| Fault-3 | Parser dependency output changes after an upgrade and snapshot tests fail before release. | Public IR and diagnostics remain protected by compatibility tests. | REQ-3 / REQ-8 / REQ-10 |
| Misuse-1 | A consumer attempts to express semantic judgment as deterministic config. | The engine rejects unsupported declarations and reports the unsupported rule. | REQ-4 / REQ-5 / FUNC-3 |
| Misuse-2 | A document includes raw HTML that could be dangerous if rendered. | The engine records raw HTML as inert data and applies policy diagnostics without execution. | REQ-9 / FUNC-5 |

Section status: Complete

## 10. External Service Levels and Acceptance Cases

External service expectations: The package has no network availability service level. Externally visible expectations are local API determinism, stable result shape within a package version, no HTML execution, and test-covered behavior for documented supported rule families.

| ID | Acceptance case | Expected result | Covers |
| --- | --- | --- | --- |
| ACC-1 | Validate a representative GFM document with valid frontmatter and supported structural config. | The result contains normalized IR, parsed frontmatter, pass status, and zero error diagnostics. | REQ-1 / REQ-2 / REQ-3 / REQ-4 / FUNC-1 / FUNC-2 / FUNC-4 |
| ACC-2 | Validate a document missing a required heading declared in config. | The result has fail status and one or more diagnostics containing rule ID, severity, message, and source location when available. | REQ-4 / REQ-6 / FUNC-2 |
| ACC-3 | Validate a config containing an unsupported semantic rule. | The result reports a config diagnostic and does not attempt semantic interpretation. | REQ-5 / FUNC-3 |
| ACC-4 | Validate the same fixture and config 10 times in one runtime. | Serialized JSON output is byte-for-byte identical across all 10 runs. | REQ-8 / FUNC-2 |
| ACC-5 | Validate Markdown containing raw HTML with deny policy. | The result contains inert HTML IR data and a raw-HTML policy diagnostic without executing HTML. | REQ-9 / FUNC-5 |
| ACC-6 | Review a public contract change after initial implementation. | The change is classified under semantic versioning and includes compatibility notes. | REQ-10 |

Section status: Complete

## 11. Requirements-to-Behavior Traceability

| Requirement | Functional behaviors or flows | Acceptance coverage | Notes |
| --- | --- | --- | --- |
| REQ-1 | FLOW-1 / FUNC-1 | ACC-1 | GFM parsing is observable through normalized IR and parse metadata. |
| REQ-2 | FUNC-4 | ACC-1 | Frontmatter behavior is externally visible in parse/validate output. |
| REQ-3 | FLOW-1 / FLOW-4 / FUNC-1 / FUNC-5 | ACC-1 / ACC-5 | IR shape supports parser output and raw HTML representation. |
| REQ-4 | FLOW-1 / FLOW-2 / FLOW-3 / FUNC-2 | ACC-1 / ACC-2 / ACC-3 | Declarative deterministic validation is visible through validation results. |
| REQ-5 | FLOW-3 / FUNC-3 | ACC-3 | Unsupported-rule rejection is a first-class behavior. |
| REQ-6 | FLOW-1 / FLOW-2 / FLOW-4 / FLOW-5 / FUNC-2 / FUNC-3 / FUNC-4 | ACC-2 / ACC-3 / ACC-5 | Diagnostics are externally visible outputs. |
| REQ-7 | FLOW-1 / FLOW-5 / FUNC-1 | ACC-1 | API functions expose parse, normalize, validate, and serialization. |
| REQ-8 | FLOW-2 / FLOW-5 / FUNC-2 | ACC-4 | Repeatable output proves determinism. |
| REQ-9 | FLOW-4 / FUNC-5 | ACC-5 | Raw HTML behavior is externally visible. |
| REQ-10 | FLOW-5 | ACC-6 | Compatibility handling is externally visible during contract review. |

Section status: Complete

Layer 2 status: Complete

## Layer 3: Technical Specification

## 12. Architecture Overview

Architecture summary: `markdown-engine` will be a local TypeScript package with a staged pipeline: input ingestion, frontmatter extraction, GFM parsing, IR normalization, config loading, deterministic rule evaluation, diagnostic generation, and result serialization.

Major components and boundaries: The main components are public API, parser adapter, frontmatter adapter, IR normalizer, config schema loader, deterministic rule engine, diagnostic builder, and serialization layer. Boundaries exist between external parser/YAML dependencies and engine-owned IR, between caller-supplied config and validated config model, and between engine-owned deterministic validation and downstream semantic/profile/runtime packages. The raw parser AST remains adapter-internal in v1; normalized IR and diagnostics are the public compatibility contracts.

Deployment or runtime placement: The package runs in the caller's local Node.js process. It does not own file-system traversal, network service hosting, MCP transport, agent hooks, or persistent storage in this design.

Architecture rationale: A staged package architecture satisfies `REQ-1` through `REQ-10` by isolating parser dependency behavior behind adapters, making the engine IR stable for `FUNC-1`, keeping validation deterministic for `FUNC-2` and `FUNC-3`, and preserving downstream extension paths without making runtime packages part of the engine.

Section status: Complete

## 13. Technical Mechanisms and Allocation

| ID | Mechanism | Component or owner | Responsibility | Related behaviors |
| --- | --- | --- | --- | --- |
| TECH-1 | GFM parser adapter using the unified/micromark/mdast ecosystem | Parser adapter | Convert Markdown body text into internal parser-backed syntax with source positions where available. | FUNC-1 / FUNC-5 |
| TECH-2 | YAML frontmatter extraction and parser adapter | Frontmatter adapter | Detect frontmatter delimiters, parse YAML, and return structured values or diagnostics. | FUNC-4 |
| TECH-3 | Engine IR normalizer | IR normalizer | Convert parser output into stable engine-owned node, section, heading, link, list, code, raw HTML, and source-location structures. | FUNC-1 / FUNC-5 |
| TECH-4 | YAML-friendly config schema validator | Config schema loader | Validate supported config shape and reject unsupported declarations before rule evaluation. | FUNC-2 / FUNC-3 |
| TECH-5 | Closed deterministic rule registry | Deterministic rule engine | Evaluate supported rule families against frontmatter and normalized IR without plugins or LLM calls. | FUNC-2 / FUNC-3 / FUNC-5 |
| TECH-6 | Diagnostic builder and serializer | Diagnostic and serialization layer | Produce stable diagnostic objects and JSON output. | FUNC-2 / FUNC-3 / FUNC-4 / FUNC-5 |
| TECH-7 | Fixture, conformance, and snapshot harness | Test infrastructure | Prove GFM behavior, frontmatter behavior, IR stability, diagnostic shape, and deterministic output. | FUNC-1 / FUNC-2 / FUNC-3 / FUNC-4 / FUNC-5 |
| TECH-8 | Public TypeScript API and generated contract documentation | Public API | Expose parse, normalize, validate, and serialize functions with typed result contracts. | FUNC-1 / FUNC-2 |

Section status: Complete

## 14. Data, Schemas, and Compatibility

| Change | Type | Compatibility impact | Reversibility | Mitigation |
| --- | --- | --- | --- | --- |
| Engine IR schema | Schema | New public contract for downstream consumers; breaking field changes after first release require major version. | Reversible before first release; semver-controlled after release | Snapshot tests, contract documentation, and semantic versioning under `REQ-10`. |
| Validation config schema | Config | New author-facing and downstream-facing contract for deterministic rule declarations. | Reversible before first release; semver-controlled after release | Schema validation, unsupported-rule diagnostics, and examples. |
| Diagnostic schema | Schema | New CI/editor/agent-facing output contract. | Reversible before first release; semver-controlled after release | Stable diagnostic fields and snapshot tests. |
| Public API surface | API | New package import and function contract for consumers. | Reversible before first release; semver-controlled after release | Typed API, contract documentation, and compatibility review. |

Section status: Complete

## 15. Control Logic and Non-Functional Controls

Control logic summary: Each invocation follows a fixed order: extract frontmatter, parse Markdown, normalize IR, validate config, evaluate supported deterministic rules against parsed frontmatter and normalized IR, build diagnostics, and serialize results. Config validation occurs before rule execution. Unsupported declarations stop the unsupported rule path with diagnostics rather than fallback interpretation.

Concurrency and ordering model: The engine is stateless across calls. Callers may run independent invocations concurrently. Within one invocation, rule evaluation order is deterministic and result ordering is stable by source location, then rule ID, then insertion order for config-defined checks.

Failure recovery model: Expected input/config failures return structured diagnostics. Unexpected programming errors may throw typed internal errors during development, but documented public validation paths return result objects for parse/config/input errors.

| Requirement | Mechanism | Notes |
| --- | --- | --- |
| REQ-1 | TECH-1 / TECH-7 | Parser adapter behavior is fixture tested. |
| REQ-2 | TECH-2 / TECH-7 | Frontmatter parsing has valid and invalid fixtures. |
| REQ-3 | TECH-3 / TECH-7 | IR stability is protected by snapshots. |
| REQ-4 | TECH-4 / TECH-5 / TECH-7 | Config and rule vocabulary remain closed and deterministic. |
| REQ-5 | TECH-4 / TECH-6 / TECH-7 | Unsupported declarations become diagnostics. |
| REQ-6 | TECH-6 / TECH-7 | Diagnostic shape is contract tested. |
| REQ-7 | TECH-8 / TECH-7 | Public API is typed and documented. |
| REQ-8 | TECH-5 / TECH-6 / TECH-7 | Stable ordering and snapshot repeatability prove determinism. |
| REQ-9 | TECH-3 / TECH-5 / TECH-6 / TECH-7 | Raw HTML remains inert and policy-driven. |
| REQ-10 | TECH-7 / TECH-8 | Contract changes require semver review. |

Section status: Complete

## 16. Observability, Operations, Rollout, and Rollback

| Signal | Type | Purpose | Consumer |
| --- | --- | --- | --- |
| Unit test result | Metric | Prove parser, frontmatter, config, rule, and diagnostic behavior before release. | Implementer and reviewer |
| Fixture conformance result | Metric | Detect parser or dependency behavior drift. | Implementer and reviewer |
| Snapshot diff | Audit | Detect changes in IR, diagnostics, and serialized JSON. | Implementer and reviewer |
| Package build result | Metric | Prove package compiles and public types are valid. | Implementer and reviewer |
| Contract change log entry | Audit | Record semver classification for public contract changes. | Project owner and downstream consumers |

Rollout plan: Implement on a feature branch, add package scaffold and tests, review contract artifacts before first release, run fixture and snapshot suite in CI, then publish or tag only after downstream profile/runtime consumers confirm the IR and diagnostics are usable for the next package.

Rollback or containment plan: Trigger rollback if parser conformance, deterministic output, public API build, or contract review fails. The rollback action is to revert the feature branch or withhold package release. Reversibility is complete before first release because no persistent data or external service state is modified; after release, containment uses semver and deprecation rather than silent contract mutation.

Operator actions: Maintainers run the test suite, inspect snapshot diffs, review diagnostics for source locations, classify public contract changes under semantic versioning, run the dependency audit, and stop release if dependency audit or implementation review detects profile/runtime/MCP behavior inside `markdown-engine`.

Section status: Complete

## 17. Verification Strategy and Behavior-to-Mechanism Traceability

| ID | Verification method | What is verified | Related IDs |
| --- | --- | --- | --- |
| VAL-1 | Test / Analysis | GFM fixture parsing covers representative syntax and feeds normalization without exposing raw parser AST as a stable public contract. | REQ-1 / FUNC-1 / TECH-1 / TECH-7 |
| VAL-2 | Test | YAML frontmatter valid, absent, empty, and invalid cases produce expected structured values or diagnostics. | REQ-2 / FUNC-4 / TECH-2 / TECH-7 |
| VAL-3 | Test / Inspection | Normalized IR contains hierarchy, node type, text, raw HTML representation, and source location fields where available. | REQ-3 / FUNC-1 / FUNC-5 / TECH-3 / TECH-7 |
| VAL-4 | Test | Supported deterministic config evaluates correctly and unsupported declarations produce explicit diagnostics. | REQ-4 / REQ-5 / FUNC-2 / FUNC-3 / TECH-4 / TECH-5 / TECH-7 |
| VAL-5 | Test | Repeated validation runs produce byte-for-byte identical serialized JSON output for identical inputs. | REQ-8 / FUNC-2 / TECH-5 / TECH-6 / TECH-7 |
| VAL-6 | Test / Inspection | Diagnostics include stable rule ID, severity, message, and source location when available, and raw HTML policy does not execute HTML. | REQ-6 / REQ-9 / FUNC-2 / FUNC-3 / FUNC-4 / FUNC-5 / TECH-6 / TECH-7 |
| VAL-7 | Inspection / Test | Public API functions, typed result contracts, and semver classifications exist for parse, normalize, validate, and serialization. | REQ-7 / REQ-10 / FUNC-1 / FUNC-2 / TECH-8 |
| VAL-8 | Review / Measurement | Dependency audit finds no profile/runtime/MCP/agent-adapter/LLM/network-service direct dependency or alias target, and implementation review confirms no forbidden source-boundary drift in engine code. | OBJ-3 / NG-1 / NG-2 / NG-3 / ASM-3 |

| Behavior or requirement | Mechanisms | Verification |
| --- | --- | --- |
| FUNC-1 | TECH-1 / TECH-3 / TECH-8 | VAL-1 / VAL-3 / VAL-7 |
| FUNC-2 | TECH-4 / TECH-5 / TECH-6 / TECH-8 | VAL-4 / VAL-5 / VAL-6 / VAL-7 |
| FUNC-3 | TECH-4 / TECH-6 | VAL-4 / VAL-6 |
| FUNC-4 | TECH-2 / TECH-6 | VAL-2 / VAL-6 |
| FUNC-5 | TECH-1 / TECH-3 / TECH-5 / TECH-6 | VAL-3 / VAL-6 |
| REQ-1 | TECH-1 / TECH-7 | VAL-1 |
| REQ-2 | TECH-2 / TECH-7 | VAL-2 |
| REQ-3 | TECH-3 / TECH-7 | VAL-3 |
| REQ-4 | TECH-4 / TECH-5 / TECH-7 | VAL-4 |
| REQ-5 | TECH-4 / TECH-6 / TECH-7 | VAL-4 |
| REQ-6 | TECH-6 / TECH-7 | VAL-6 |
| REQ-7 | TECH-8 | VAL-7 |
| REQ-8 | TECH-5 / TECH-6 / TECH-7 | VAL-5 |
| REQ-9 | TECH-3 / TECH-5 / TECH-6 / TECH-7 | VAL-6 |
| REQ-10 | TECH-8 | VAL-7 |
| OBJ-3 / NG-1 / NG-2 / NG-3 / ASM-3 | Dependency audit / implementation review | VAL-8 |

Section status: Complete

## 18. Alternatives, Risks, Open Questions, and Final Exit

| Alternative | Reason considered | Reason rejected |
| --- | --- | --- |
| Build a custom Markdown parser | Maximum control over AST and diagnostics. | Higher implementation cost and higher conformance risk than using a standard GFM-capable parser ecosystem. |
| Use `markdown-it` as the core parser | Mature Markdown parser with broad plugin ecosystem. | Token stream and AST model are less aligned with stable structural validation than mdast-style trees. |
| Use `cmark-gfm` bindings as the primary parser | Strong GFM conformance reference. | Native binding and AST integration burden are higher for a TypeScript package; better suited as a conformance oracle. |
| Combine engine, type compiler, runtime lens, and MCP in one package | Faster path to a visible end-to-end demo. | Violates the chosen package decomposition and would blur deterministic engine behavior with agent-runtime semantics. |
| Add custom rule plugins in v1 | Maximizes flexibility for future downstream use cases. | Conflicts with closed deterministic validation, reproducibility, and unsupported-rule honesty. |

| ID | Statement | Likelihood | Consequence | Mitigation |
| --- | --- | --- | --- | --- |
| RISK-1 | Parser dependency output changes could break IR or diagnostics after an upgrade. | Medium | Medium | Pin major versions, use fixture conformance tests, and snapshot public IR/diagnostic output. |
| RISK-2 | Config vocabulary could grow into semantic judgment instead of deterministic validation. | Medium | High | Keep the rule registry closed in v1 and reject unsupported declarations through `REQ-5`. |
| RISK-3 | Downstream runtime needs could push agent-specific concepts into the engine. | Medium | Medium | Enforce `NG-1` through `NG-3` during review and keep runtime lenses in `markdown-runtime`. |
| RISK-4 | Source locations may be incomplete for some parser constructs. | Medium | Medium | Preserve locations where available, document unavailable cases, and test representative syntax. |

No open questions

Waivers: none

Final readiness statement: Ready for implementation

Section status: Complete

## Final Consistency Gate

1. Every section from 0 through 18 has `Section status` set to `Complete`, `Deferred`, or `N/A`; no required section is `Incomplete`.
2. Every `REQ-*` from section 5 appears in section 11 and appears at least once in section 17.
3. Every `FUNC-*` from section 8 appears in section 17.
4. Every `TECH-*` from section 13 appears in section 17.
5. Every `ACC-*` referenced anywhere in the document is defined in section 10.
6. Every `VAL-*` referenced anywhere in the document is defined in section 17.
7. No `Q-*` rows exist because the document states `No open questions`.
8. No section is marked `Deferred`.
9. No `R3` trigger applies to this design.
10. `Final readiness statement` is `Ready for implementation`, matching `R2`.
11. No `R3` waiver is applicable.

Consistency gate result: Pass

## Internal Review Record

| Field | Value |
| --- | --- |
| Proposed rigor level | `R2` |
| Reviewed rigor level | `R2` |
| Calibration result | Accept |
| Rationale | The design requests implementation approval for a durable package and public contracts. `R1` is not appropriate because API, config, diagnostic, and IR contracts are material. `R3` triggers are absent. |

| Finding ID | Severity | Status | Section | Finding | Required action | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| IR-1 | Major | Resolved | 0 / 4 / 5 | Initial framing risked treating the broader profile/runtime architecture as implementation scope. | Reframe `markdown-engine` as the first package and record profile/runtime/MCP/agent adapter work as explicit non-objectives. | Codex |
| IR-2 | Major | Resolved | 5 / 8 / 17 | Initial requirement coverage did not make raw HTML behavior and unsupported-rule rejection independently verifiable. | Add `REQ-5`, `REQ-9`, `FLOW-3`, `FLOW-4`, `ACC-3`, `ACC-5`, `VAL-4`, and `VAL-6`. | Codex |
| IR-3 | Minor | Resolved | 16 / 18 | Rollback language needed to distinguish pre-release reversibility from post-release semver containment. | Add pre-release rollback trigger/action and post-release semver containment language. | Codex |
| IR-4 | Major | Resolved | 4 / 8 / 12 / 15 | Initial contract language did not explicitly decide whether validators operate on raw parser AST or normalized engine structures. | Add `CON-6`, `CON-7`, revise `FUNC-1`, and state that raw parser AST is adapter-internal in v1. | Codex |

Semantic scores:

| Dimension | Score | Notes |
| --- | --- | --- |
| Problem validity | 3 | Problem is grounded in current repo state and package decomposition decisions. |
| Requirement quality | 3 | Requirements are atomic and map to verification. |
| Functional adequacy | 3 | Mainline, invalid config, invalid document, raw HTML, and serialization flows are covered. |
| Technical feasibility | 2 | Parser stack assumption is plausible and verified through fixtures, but final implementation may adjust dependency details. |
| Non-functional adequacy | 2 | Determinism, compatibility, and no-execution controls are specified for initial package scope. |
| Operational safety | 3 | No live service or persistent data is affected; rollback is branch/release containment. |
| Verification adequacy | 3 | Verification covers parser behavior, frontmatter, IR, diagnostics, determinism, API, and compatibility. |

Traceability result: Pass. Every `REQ-*`, `FUNC-*`, `TECH-*`, `ACC-*`, and `VAL-*` reference resolves within the document.

Readiness verdict: Approve for implementation.
