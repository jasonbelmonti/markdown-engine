# Markdown Engine Execution Specification

## Document Control

| Field | Value |
| --- | --- |
| Title | Markdown Engine Initial Package Implementation |
| Status | Draft |
| Execution level | `E2` |
| Execution level justification | The work implements a durable TypeScript package with public API, IR, config, diagnostic, and compatibility contracts. It does not qualify for `E1` because package and contract surfaces require another engineer or agent to execute from a complete plan. It does not trigger `E3` because execution does not change authentication, authorization, secrets, live customer data, one-way migrations, payments, safety controls, or a high-volume production path. |
| Author(s) | Codex |
| Executor(s) | Markdown-engine implementer or assigned coding agents |
| Reviewers | Project owner, implementation reviewer, downstream profile/runtime consumer |
| Decision owner | Project owner |
| Target branch, release, or milestone | Initial `markdown-engine` implementation branch after PR #1 approval |
| Last updated | 2026-04-28 |
| Related source docs | `RUNTIME_ARCHITECTURE.md`; `docs/design/markdown-engine-operational-design-spec.md`; PR #1 consensus review record in thread |
| Related tickets | none |

## 0. Execution Summary

Decision requested: Approve to execute

Approved outcome: Execute the `markdown-engine` initial package implementation authorized by `SRC-1` and bounded by `SRC-2`, producing a reusable deterministic Markdown parsing and validation package for downstream profile/runtime work.

Execution approach: Use a risk-retirement sequence. First prove the parser/frontmatter-to-normalized-IR critical path with one representative fixture and minimal deterministic rule, then stabilize public contracts, expand deterministic validation rule coverage, prove repeatable diagnostics/serialization, and finish with contract review and release containment evidence across `WP-1` through `WP-6`.

Entry condition: Execution shall not start until PR #1 or an equivalent project-owner approval records acceptance of the operational design and this execution spec.

Top risks or unknowns:

- Parser dependency output may not provide stable source-position data for every required construct.
- Validation config scope may drift into semantic judgment instead of deterministic rule evaluation.
- Public contract shape may block downstream profile/runtime consumers if it is not reviewed before broad implementation.

Section status: Complete

## Layer 1: Execution Basis

## 1. Source Authority and Scope

| ID | Source | Authority | Execution implication |
| --- | --- | --- | --- |
| SRC-1 | `docs/design/markdown-engine-operational-design-spec.md` | R2 design artifact approved by internal review and consensus review. | Execute the initial `markdown-engine` package as a local TypeScript library with stable IR, config, diagnostics, API, validation, and compatibility controls. |
| SRC-2 | `RUNTIME_ARCHITECTURE.md` | Package decomposition direction. | Keep profile compiler, runtime lenses, MCP transport, agent adapters, and semantic evaluation outside this implementation. |
| SRC-3 | PR #1 consensus review record in thread | Review evidence. | Treat current design direction as reviewable and implementation-ready after project-owner approval. |
| SRC-4 | User request on 2026-04-28 to draft the execution spec. | Execution planning request. | Produce a source-authorized execution plan before implementation starts. |

In scope: Initial package scaffold, GFM parser adapter, YAML frontmatter adapter, normalized engine IR, deterministic config schema loader, closed rule registry, diagnostics, result serialization, contract documentation, fixtures, conformance tests, snapshot tests, repeatability tests, and release-readiness evidence.

Out of scope: Markdown profile meta-spec implementation, runtime lens generation, MCP server, Codex/Claude hooks or skills, semantic LLM evaluation, behavioral agent benchmark harness, network service hosting, persistent storage, and custom Markdown dialects beyond explicit GFM/frontmatter support.

Definition of done: The package exposes documented parse, normalize, validate, and serialize APIs; fixture tests cover representative GFM/frontmatter cases; deterministic rule families and unsupported-rule diagnostics are verified; raw HTML remains inert; serialized output is repeatable; contract docs and semver notes are reviewed; all milestone gates have approval evidence.

Re-decision boundaries: Parser ecosystem replacement, exposing raw parser AST as a public contract, adding plugin execution, accepting semantic/LLM rules, adding MCP/runtime/profile behavior, or changing public compatibility policy requires project-owner review before execution continues.

Section status: Complete

## 2. Objectives and Non-Objectives

| ID | Statement | Completion horizon | Evidence |
| --- | --- | --- | --- |
| OBJ-1 | Deliver a local TypeScript `markdown-engine` package that parses GFM and YAML frontmatter into normalized engine IR. | Before merge of implementation branch | EVD-1 / EVD-2 / EVD-3 |
| OBJ-2 | Deliver deterministic declarative validation over parsed frontmatter and normalized IR. | Before merge of implementation branch | EVD-4 / EVD-5 |
| OBJ-3 | Deliver stable public API, IR, config, diagnostic, and serialization contracts suitable for downstream profile/runtime packages. | Before release or package tag | EVD-6 / EVD-7 |
| OBJ-4 | Preserve the package boundary that excludes profile, runtime, MCP, agent-adapter, and semantic-eval behavior from `markdown-engine`. | Throughout execution | EVD-8 |
| NG-1 | This execution will not implement `markdown-profile`, `markdown-runtime`, `markdown-mcp`, `agent-adapters`, or `agent-eval-harness`. | Completion review | EVD-8 |
| NG-2 | This execution will not expose raw parser AST as a stable public contract in v1. | Contract review | EVD-6 |
| NG-3 | This execution will not add arbitrary rule plugins or LLM-backed semantic validators. | Validation review | EVD-4 / EVD-8 |
| NG-4 | This execution will not publish a package release until contract review and downstream-consumer confirmation are complete. | Release gate | EVD-7 / EVD-11 |

Section status: Complete

## 3. Ownership, Roles, and Decision Points

| Role or person | Responsibility | Required action |
| --- | --- | --- |
| Project owner | Approves entry, milestone gates, public contract decisions, and release readiness. | Approve |
| Markdown-engine implementer | Executes work packages, records evidence, and raises deviations. | Execute |
| Implementation reviewer | Reviews code, tests, contracts, package boundaries, and validation evidence. | Review |
| Downstream profile/runtime consumer | Reviews whether IR, diagnostics, and config output can support future profile/runtime packages. | Review |
| Security/data/legal reviewer | Confirms raw HTML is inert and no live data, secret, compliance, or auth behavior is introduced. | Consult |

Decision points:

- DP-1: Entry approval before implementation starts.
- DP-2: `MS-1` critical-path proof approval before routine rule expansion proceeds.
- DP-3: `MS-2` contract approval before merge.
- DP-4: `MS-3` completion/release-readiness approval before package tag or publication.

Escalation path: Any blocking dependency, public contract deviation, parser-substrate failure, forbidden dependency, or semantic-rule pressure stops execution and escalates to the project owner with a `DEV-*` proposal or design-spec revision.

Section status: Complete

## 4. Constraints, Assumptions, and Dependencies

| ID | Type | Statement | Owner | Blocking? | Validation or resolution plan |
| --- | --- | --- | --- | --- | --- |
| CON-1 | Constraint | Execution shall preserve the engine boundary: parse, normalize, validate deterministic rules, diagnose, and serialize. | Implementer | No | `VAL-8` boundary inspection and `REV-3` scope review. |
| CON-2 | Constraint | Validation shall operate on parsed frontmatter and normalized engine IR, not directly on public raw parser AST. | Implementer | No | `VAL-3`, `VAL-4`, and contract review in `MS-2`. |
| CON-3 | Constraint | Raw HTML shall be represented as inert data and shall not be executed. | Implementer | No | `VAL-6` raw-HTML policy tests. |
| CON-4 | Constraint | Config and frontmatter authoring inputs shall remain YAML-friendly. | Implementer | No | `VAL-2` and `VAL-4` fixtures. |
| ASM-1 | Assumption | TypeScript on Node.js remains the implementation platform. | Project owner | No | Confirm during `WP-1`; if false, stop and revise this execution spec. |
| ASM-2 | Assumption | The unified/micromark/mdast ecosystem can provide sufficient GFM parse data and source locations for initial IR. | Implementer | No | Retire through `WP-1`, `VAL-1`, and `MS-1`. |
| ASM-3 | Assumption | No persistent storage, network service, database, or browser runtime is required. | Implementer | No | `VAL-8` dependency and boundary review. |
| DEP-1 | Dependency | Project-owner approval of PR #1 or equivalent approval record is required before implementation starts. | Project owner | Yes | Entry gate in section 18 remains unsatisfied until approval evidence exists. |
| DEP-2 | Dependency | Package manager and Node runtime choices must be established in `WP-1`. | Implementer | No | Record chosen versions in scaffold files and `EVD-1`. |

Section status: Complete

## Layer 2: Execution Plan

## 5. Evidence-Led Execution Model

Observable outcome: A consumer can import `markdown-engine`, validate a representative Markdown document with YAML frontmatter and deterministic config, and receive normalized IR, structured diagnostics, and stable serialized output without profile/runtime/MCP or semantic-eval behavior.

Core value proposition: The package gives downstream Markdown profile and agent-runtime systems a deterministic foundation they can trust without forking parser behavior or interpreting raw Markdown themselves.

Critical path hypothesis: If `WP-1` can scaffold the package and prove a representative Markdown+frontmatter fixture flows through parse, normalize, validate, diagnose, and serialize with stable output, then the remaining implementation can expand rule coverage and contract hardening without reopening the core architecture.

First proving slice: `WP-1` implements a minimal end-to-end path for one representative fixture containing frontmatter, headings, a code fence, a link, a task-list item, raw HTML data, a minimal config schema, and one deterministic rule, then proves the output has normalized IR, one deterministic validation result, diagnostics shape, and serialized JSON.

Sequencing principle: Execute by risk retirement first, then progressive value. The parser/frontmatter/IR path, minimal deterministic rule execution, and public result shape are the highest-risk assumptions, so they precede broad rule families, documentation, and release hardening.

Validation cadence: Each work package must produce `VAL-*` evidence before the next dependent work package starts. `MS-1` is due before broad rule expansion, `MS-2` is due before merge, and `MS-3` is due before release or tag.

Deferred completeness: Exhaustive GFM fixture coverage, all candidate rule families, generated API docs polish, downstream integration examples, and release publication are deferred until the first proving slice and contract review succeed.

Primary risks and unknowns:

| ID | Risk or unknown | Why it matters | Owner | Evidence required to retire | Decision gate |
| --- | --- | --- | --- | --- | --- |
| RISK-1 | Parser source locations may be incomplete or unstable for some GFM constructs. | Diagnostics and IR stability depend on usable location data. | Implementer | VAL-1 / VAL-3 / EVD-1 / EVD-3 | MS-1 |
| RISK-2 | Validation config vocabulary may drift into semantic judgment. | Semantic checks would break deterministic guarantees. | Implementer | VAL-4 / VAL-8 / EVD-4 / EVD-8 | MS-2 |
| RISK-3 | Public contract shape may not support downstream profile/runtime packages. | The first package exists to serve those consumers. | Project owner | VAL-7 / EVD-6 / EVD-7 | MS-2 |
| RISK-4 | Work packages may leak profile/runtime/MCP concerns into engine code. | Boundary drift would invalidate the package decomposition. | Implementer | VAL-8 / EVD-8 | MS-2 |

Section status: Complete

## 6. Change Surface Inventory

| ID | Surface | Change type | Owner | Read/write boundary | Review expectation |
| --- | --- | --- | --- | --- | --- |
| SURF-1 | `package.json`, lockfile, TypeScript/package config | Config / Contract | Implementer | Writable by `WP-1`; read-only for later work except dependency or script updates requiring coordination. | Build and dependency review in `REV-1`. |
| SURF-2 | `src/index.ts`, `src/api/**`, `src/types/**` | Code / Contract | Implementer | Writable by `WP-1` for the proving-slice API stub and by `WP-2` for contract stabilization; later changes require `MS-2` contract review. | Public API review in `REV-2`. |
| SURF-3 | `src/parser/**`, `src/frontmatter/**` | Code | Implementer | Writable by `WP-1` and `WP-3`; interface changes require coordination with `PKG-1` and `PKG-3`. | Parser adapter review in `REV-2`. |
| SURF-4 | `src/ir/**`, `src/diagnostics/**`, `src/serialize/**` | Code / Schema | Implementer | Writable by `WP-1`, `WP-2`, `WP-3`, and `WP-5` with serialized contract snapshots. | Contract and snapshot review in `REV-2`. |
| SURF-5 | `src/config/**`, `src/rules/**` | Code / Config | Implementer | Writable by `WP-1` for minimal proving-slice config/rule proof and by `WP-4` for full rule-family coverage; must not import agent/runtime/profile packages. | Deterministic validation review in `REV-3`. |
| SURF-6 | `tests/**`, `fixtures/**`, `snapshots/**` | Test | Implementer | Writable by all work packages when evidence belongs to their scope. | Test evidence review in `REV-1`. |
| SURF-7 | `docs/contracts/**`, `README.md`, package usage docs | Docs / Contract | Implementer | Writable by `WP-2` for contract docs and by `WP-6` for final release/handoff docs; contract changes require `MS-2`. | Documentation review in `REV-2`. |
| SURF-8 | `.github/workflows/**` if CI is introduced | Infra | Implementer | Writable by `WP-6`; N/A if no CI workflow is added in the first implementation PR. | CI review in `REV-1`. |

Section status: Complete

## 7. Agent-Focused Package Decomposition

Decomposition mission: Keep implementation agents inside explicit package boundaries while preserving `markdown-engine` as a reusable deterministic core and excluding downstream profile/runtime behavior.

| ID | Unit | Ladder level | Mission | Observable value enabled | Risk retired | Public interface | Validation command | Promotion blockers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PKG-1 | Public package contract | 3 | Expose stable parse, normalize, validate, and serialize APIs for reusable consumption. | Consumers can call the package without knowing internal parser details. | RISK-3 | `src/index.ts` exports and documented TypeScript types. | `npm test -- --run contract` or equivalent package script. | No release process, changelog, and compatibility policy for level 4. |
| PKG-2 | Parser and frontmatter adapters | 2 | Isolate external parser/YAML dependencies behind engine-owned adapter contracts. | GFM and frontmatter input enter the engine through one controlled boundary. | RISK-1 | Internal adapter functions returning engine-owned intermediate data. | `npm test -- --run parser` or equivalent package script. | Depends on selected parser APIs and is not project-agnostic enough for standalone reuse. |
| PKG-3 | Normalized IR, diagnostics, and serialization | 2 | Own stable engine data structures, source locations, diagnostic shape, and JSON serialization. | Downstream packages receive stable IR and diagnostics. | RISK-1 / RISK-3 | IR/diagnostic types and serializer called through `PKG-1`. | `npm test -- --run ir` or equivalent package script. | Contract is not independently versioned outside `markdown-engine`. |
| PKG-4 | Config schema and deterministic rule engine | 2 | Validate YAML-friendly config and evaluate closed deterministic rule families. | Users get deterministic validation and explicit unsupported-rule diagnostics. | RISK-2 / RISK-4 | Config schema types and internal rule registry called through `PKG-1`. | `npm test -- --run rules` or equivalent package script. | Rule vocabulary is engine-specific and not yet a standalone profile compiler. |
| PKG-5 | Fixture and evidence harness | 2 | Provide scoped fixtures, snapshots, repeatability checks, and boundary inspections. | Reviewers can verify parser behavior, determinism, and contract stability. | RISK-1 / RISK-2 / RISK-4 | Test fixtures, snapshot baselines, and evidence scripts. | `npm test` and `git diff --check main...HEAD`. | Harness is project-specific until package release process exists. |

### Package Boundary Card: PKG-1

Ladder level: 3

Mission: Public reusable package contract for `markdown-engine`.

Value / risk trace:

- Observable value enabled: Consumers can validate Markdown through a stable API.
- Risk retired: RISK-3
- Validation evidence: VAL-7 / EVD-6
- Blocking unknowns: DEP-1 entry approval before implementation starts.

Owns:

- Files/directories: `src/index.ts`, `src/api/**`, `src/types/**`, public contract docs.
- Concepts: API entry points, exported types, public result shape, semver classification.
- Runtime responsibilities: Call orchestration and result exposure.

Does not own:

- Explicitly excluded behavior: Profile semantics, runtime lenses, MCP tools, agent hooks, semantic evals.
- Responsibilities delegated elsewhere: Parser dependency integration to `PKG-2`; rules to `PKG-4`; evidence harness to `PKG-5`.

Public interface:

- Exported types: parse options, normalized IR, validation config, diagnostics, validation result.
- Exported functions/classes/components: `parse`, `normalize`, `validate`, `serializeResult` or final approved equivalents.
- Events/messages/contracts: None.
- CLI/API surface: No CLI in initial implementation unless approved by deviation.

Allowed dependencies:

- May import: engine-owned modules from `PKG-2`, `PKG-3`, and `PKG-4`.
- May call: internal orchestration functions.
- May read configuration from: explicit function arguments only.

Forbidden dependencies:

- Must not import: `markdown-profile`, `markdown-runtime`, MCP, agent adapters, application routes, UI, database, environment-specific runtime modules.
- Must not call: LLM APIs, network services, shell commands, file traversal owned by callers.
- Must not know about: product-specific profile IDs such as `task/basic@v1`.

State boundary:

- Owns state: None across calls.
- Reads state: Explicit input arguments.
- Mutates state: None outside invocation-local objects.
- Persistence responsibility: None.

Agent ownership boundary:

- Agent editable paths: `src/index.ts`, `src/api/**`, `src/types/**`, `docs/contracts/**`.
- Agent read-only paths: `RUNTIME_ARCHITECTURE.md`, `docs/design/**`, parser/rule internals unless assigned.
- Required coordination before editing: Any exported symbol, result field, or public contract documented in `docs/contracts/**`.

Validation command: `npm test -- --run contract` or equivalent package script.

Promotion blockers: No published version, changelog, compatibility policy, or owning maintainer process yet.

### Package Boundary Card: PKG-2

Ladder level: 2

Mission: Parser and frontmatter adapter boundary.

Value / risk trace:

- Observable value enabled: GFM and YAML input become engine-owned data.
- Risk retired: RISK-1
- Validation evidence: VAL-1 / VAL-2 / EVD-1 / EVD-2
- Blocking unknowns: Parser source-location sufficiency until `MS-1`.

Owns:

- Files/directories: `src/parser/**`, `src/frontmatter/**`.
- Concepts: external parser configuration, frontmatter delimiters, parser diagnostics, adapter result type.
- Runtime responsibilities: Convert raw input to adapter outputs without exposing raw AST publicly.

Does not own:

- Explicitly excluded behavior: Public API contract, rule evaluation, semantic validation.
- Responsibilities delegated elsewhere: Normalized IR to `PKG-3`; public API to `PKG-1`.

Public interface:

- Exported types: Internal adapter result types only.
- Exported functions/classes/components: Parser/frontmatter adapter functions consumed by `PKG-3` and `PKG-1`.
- Events/messages/contracts: None.
- CLI/API surface: None.

Allowed dependencies:

- May import: approved parser and YAML dependencies, engine diagnostic helpers.
- May call: parser/YAML library APIs.
- May read configuration from: explicit parser options passed by `PKG-1`.

Forbidden dependencies:

- Must not import: rules, profile/runtime/MCP packages, file-system traversal, network clients.
- Must not call: LLM APIs, shell commands, HTML execution/rendering.
- Must not know about: validation rule families or downstream profile schemas.

State boundary:

- Owns state: Invocation-local parser output only.
- Reads state: Markdown text and frontmatter text.
- Mutates state: None outside invocation-local structures.
- Persistence responsibility: None.

Agent ownership boundary:

- Agent editable paths: `src/parser/**`, `src/frontmatter/**`, parser/frontmatter fixtures.
- Agent read-only paths: public API and IR contract files unless coordination is approved.
- Required coordination before editing: Adapter result type consumed by `PKG-3` or `PKG-1`.

Validation command: `npm test -- --run parser` or equivalent package script.

Promotion blockers: Parser APIs and diagnostics are engine-specific and not independently versioned.

### Package Boundary Card: PKG-3

Ladder level: 2

Mission: Normalized IR, diagnostics, and serialization.

Value / risk trace:

- Observable value enabled: Stable result objects for callers and downstream packages.
- Risk retired: RISK-1 / RISK-3
- Validation evidence: VAL-3 / VAL-5 / VAL-6 / EVD-3 / EVD-5
- Blocking unknowns: Source-location completeness for selected constructs.

Owns:

- Files/directories: `src/ir/**`, `src/diagnostics/**`, `src/serialize/**`, snapshots.
- Concepts: normalized nodes, sections, headings, links, lists, code fences, raw HTML representation, diagnostic fields, deterministic output ordering.
- Runtime responsibilities: Convert adapter data and rule results into stable engine-owned structures.

Does not own:

- Explicitly excluded behavior: Parser dependency calls, config schema vocabulary, public API naming.
- Responsibilities delegated elsewhere: Parser adapters to `PKG-2`; rule execution to `PKG-4`; API exposure to `PKG-1`.

Public interface:

- Exported types: IR and diagnostic types through `PKG-1`.
- Exported functions/classes/components: internal normalization and serialization helpers.
- Events/messages/contracts: JSON result shape.
- CLI/API surface: None.

Allowed dependencies:

- May import: internal adapter types, engine utility functions.
- May call: no external network or renderer APIs.
- May read configuration from: explicit normalization and serialization options.

Forbidden dependencies:

- Must not import: profile/runtime/MCP, agent adapters, rule definitions except rule result types.
- Must not call: parser libraries directly except through `PKG-2`.
- Must not know about: product-specific document profiles or runtime lenses.

State boundary:

- Owns state: Invocation-local normalized structures.
- Reads state: Adapter output and rule results.
- Mutates state: None outside invocation-local structures.
- Persistence responsibility: None.

Agent ownership boundary:

- Agent editable paths: `src/ir/**`, `src/diagnostics/**`, `src/serialize/**`, related snapshots.
- Agent read-only paths: parser adapters, rules, public API unless coordination is approved.
- Required coordination before editing: Any public IR, diagnostic, or serialized JSON field.

Validation command: `npm test -- --run ir` or equivalent package script.

Promotion blockers: Contract is not independently versioned outside the package.

### Package Boundary Card: PKG-4

Ladder level: 2

Mission: YAML-friendly config schema and closed deterministic rule engine.

Value / risk trace:

- Observable value enabled: Supported deterministic rules pass/fail with explicit diagnostics.
- Risk retired: RISK-2 / RISK-4
- Validation evidence: VAL-4 / VAL-6 / VAL-8 / EVD-4 / EVD-8
- Blocking unknowns: Minimal proving-slice rule is required by `MS-1`; final supported v1 rule-family set remains open until `MS-2`.

Owns:

- Files/directories: `src/config/**`, `src/rules/**`, rule fixtures.
- Concepts: config schema, supported rule declarations, unsupported-rule diagnostics, rule evaluation order.
- Runtime responsibilities: Validate config and evaluate supported deterministic rules against frontmatter and normalized IR.

Does not own:

- Explicitly excluded behavior: Semantic rubrics, LLM calls, custom plugin execution, profile compiler behavior.
- Responsibilities delegated elsewhere: IR shape to `PKG-3`; public API exposure to `PKG-1`.

Public interface:

- Exported types: config schema types through `PKG-1`.
- Exported functions/classes/components: internal config validation and rule evaluation helpers.
- Events/messages/contracts: Rule result and diagnostic contracts through `PKG-3`.
- CLI/API surface: None.

Allowed dependencies:

- May import: engine IR and diagnostic types, YAML/schema libraries approved in scaffold.
- May call: deterministic pure rule helpers.
- May read configuration from: explicit config object only.

Forbidden dependencies:

- Must not import: LLM SDKs, runtime lens packages, MCP packages, agent adapters, product-specific profiles.
- Must not call: network services, dynamic plugin loaders, arbitrary user code.
- Must not know about: downstream workflow-specific filetypes beyond generic Markdown structure.

State boundary:

- Owns state: Invocation-local rule results.
- Reads state: parsed frontmatter, normalized IR, validated config.
- Mutates state: None outside invocation-local rule result accumulation.
- Persistence responsibility: None.

Agent ownership boundary:

- Agent editable paths: `src/config/**`, `src/rules/**`, rule fixtures.
- Agent read-only paths: public API, IR internals, parser adapters unless coordination is approved.
- Required coordination before editing: Rule result shape, diagnostic schema, or config schema public fields.

Validation command: `npm test -- --run rules` or equivalent package script.

Promotion blockers: Rule vocabulary is engine-specific and not a standalone profile compiler.

### Package Boundary Card: PKG-5

Ladder level: 2

Mission: Fixture, conformance, snapshot, repeatability, and boundary evidence harness.

Value / risk trace:

- Observable value enabled: Reviewers can inspect proof that the package behavior is deterministic and boundary-safe.
- Risk retired: RISK-1 / RISK-2 / RISK-4
- Validation evidence: VAL-1 through VAL-8 / EVD-1 through EVD-10
- Blocking unknowns: Final command names until `WP-1` scaffold chooses tooling.

Owns:

- Files/directories: `tests/**`, `fixtures/**`, `snapshots/**`, test scripts, CI workflow if introduced.
- Concepts: fixture coverage, snapshot baselines, repeatability runs, boundary inspections.
- Runtime responsibilities: None outside test execution.

Does not own:

- Explicitly excluded behavior: Production package logic.
- Responsibilities delegated elsewhere: Implementation modules to `PKG-1` through `PKG-4`.

Public interface:

- Exported types: None.
- Exported functions/classes/components: None.
- Events/messages/contracts: Evidence artifacts.
- CLI/API surface: package test scripts only.

Allowed dependencies:

- May import: package public API and test utilities.
- May call: package scripts and local test runner.
- May read configuration from: test fixtures and explicit test config.

Forbidden dependencies:

- Must not import: private package internals when public API tests are intended.
- Must not call: network services or nondeterministic external systems.
- Must not know about: profile/runtime/MCP implementation details.

State boundary:

- Owns state: Test output artifacts and snapshots.
- Reads state: fixture files and source code under test.
- Mutates state: snapshots only when intentionally approved.
- Persistence responsibility: test artifacts in repository or CI logs.

Agent ownership boundary:

- Agent editable paths: `tests/**`, `fixtures/**`, `snapshots/**`, `.github/workflows/**` if introduced.
- Agent read-only paths: source modules unless assigned through a `WP-*`.
- Required coordination before editing: Snapshot updates, CI workflow changes, or fixture coverage reductions.

Validation command: `npm test` and `git diff --check main...HEAD`.

Promotion blockers: Harness is not independently useful without the package implementation.

Dependency direction rules:

- Allowed direction: `PKG-1` may orchestrate `PKG-2`, `PKG-3`, and `PKG-4`; `PKG-3` may consume `PKG-2` adapter output; `PKG-4` may consume parsed frontmatter and `PKG-3` IR types; `PKG-5` may consume public APIs and test-specific helpers.
- Prohibited imports: `PKG-2` must not import `PKG-4`; `PKG-4` must not import parser internals; implementation packages must not import test harness files.
- Allowed cross-boundary communication: typed function calls and engine-owned result objects.
- Disallowed cross-boundary communication: private deep imports, copied shared types, global mutable state, environment-variable side channels, and product-specific profile identifiers.

State boundary rules:

- Package-owned state: invocation-local values only.
- Package-read state: explicit Markdown text, config object, options, and fixtures during tests.
- Package-mutated state: none in package execution; snapshots only under `PKG-5` control.
- Persistence ownership: no runtime persistence in `markdown-engine`.

Reusable package candidates:

| Candidate | Current level | Reuse rationale | Required decoupling | Promotion trigger |
| --- | --- | --- | --- | --- |
| Public `markdown-engine` package contract | 3 | The package is intended to be reusable outside this repo and outside agent-specific workflows. | Add versioning, changelog, public docs, release process, owner, and compatibility policy. | First published release or cross-repository consumer. |

Coupling tripwires:

- A package requires knowledge of another package's internal file layout.
- Two packages must usually change together for one feature.
- A reusable candidate imports app, route, UI, database, deployment, or product-specific runtime code.
- Business rules live primarily in scripts or integration glue instead of `PKG-4`.
- A utility package collects unrelated behavior without a single mission.
- Package validation requires a full external application when package-level validation should be possible.
- Types are shared by copying instead of declared public exports or internal contract modules.
- Separate agents must edit the same files to complete nominally separate work packages.

N/A rationale: Not applicable; package decomposition applies because code, contracts, schemas, packages, and potential multi-agent implementation are in scope.

Section status: Complete

## 8. Work Packages and Sequencing

Planning strategy: `STRATEGIES.RISK_RETIREMENT` for `WP-1`, then `STRATEGIES.PROGRESSIVE_VALUE` with contract-first controls before parallel work.

Critical path hypothesis: A representative fixture can travel through parser/frontmatter adapters, normalized IR, a deterministic validation rule, diagnostics, and serialization without exposing raw parser AST publicly.

First proving slice: `WP-1` implements package scaffold plus one end-to-end fixture path with minimal deterministic config/rule execution and produces `EVD-1` plus `EVD-4`.

Validation cadence: Each `WP-*` produces its `VAL-*` evidence before dependent work starts; `MS-1`, `MS-2`, and `MS-3` are human gates.

Deferred completeness: Full fixture breadth, all selected rule families, docs polish, and release publication wait until `WP-1` and `MS-1` pass.

| ID | Objective | Owner | Package boundary | Editable paths | Read-only paths | Inputs | Outputs | Dependencies | Observable value enabled | Risk retired | Milestone gate | Validation checkpoint | Completion criteria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WP-1 | Prove the end-to-end parser/frontmatter-to-result critical path. | Implementer | PKG-1 / PKG-2 / PKG-3 / PKG-4 / PKG-5 | `package.json`, lockfile, TypeScript config, `src/index.ts`, `src/parser/**`, `src/frontmatter/**`, `src/ir/**`, `src/diagnostics/**`, `src/config/**`, `src/rules/**`, `tests/**`, `fixtures/**` | `RUNTIME_ARCHITECTURE.md`, `docs/design/**`, `docs/execution/**` | SRC-1, SRC-2, representative fixture definition | Scaffold, minimal API, minimal adapter, minimal IR, minimal config schema, one deterministic rule, serialized output, proving-slice test evidence | DEP-1 / DEP-2 | A caller can validate one representative Markdown document and inspect stable JSON. | RISK-1 / RISK-2 / RISK-3 | MS-1 | VAL-1 / VAL-2 / VAL-3 / VAL-4 / VAL-5 | Proving fixture test passes; output has frontmatter, IR, minimal deterministic config/rule result, diagnostics shape, and stable serialization. |
| WP-2 | Stabilize public API and contract docs. | Implementer | PKG-1 / PKG-3 | `src/index.ts`, `src/api/**`, `src/types/**`, `docs/contracts/**` | `src/parser/**`, `src/frontmatter/**`, `src/rules/**`, `tests/**` | WP-1 output and operational design requirements | Public parse/normalize/validate/serialize contract and docs | WP-1 / MS-1 | Consumers know what contract to depend on before broad implementation. | RISK-3 | MS-2 | VAL-7 | Public API/types documented and reviewed; raw parser AST excluded from stable contract. |
| WP-3 | Expand parser, frontmatter, IR, raw HTML, and diagnostic fixtures. | Implementer | PKG-2 / PKG-3 / PKG-5 | `src/parser/**`, `src/frontmatter/**`, `src/ir/**`, `src/diagnostics/**`, `tests/**`, `fixtures/**`, `snapshots/**` | public API docs, `src/rules/**` | WP-1 scaffold and WP-2 contract direction | Representative GFM/frontmatter coverage, selected `cmark-gfm` comparison coverage, and IR/diagnostic snapshots | WP-1 / MS-1 | Parser and IR behavior is demonstrably stable across core Markdown constructs. | RISK-1 | MS-2 | VAL-1 / VAL-2 / VAL-3 / VAL-6 | At least 30 representative parser fixtures exist; selected `cmark-gfm` comparison cases, frontmatter, and raw HTML cases pass. |
| WP-4 | Implement YAML-friendly config schema and deterministic rule families. | Implementer | PKG-4 / PKG-5 | `src/config/**`, `src/rules/**`, rule fixtures, relevant diagnostics tests | `src/parser/**`, `src/frontmatter/**`, `src/ir/**`, public contract docs | WP-1 minimal config/rule proof, WP-2 contract, and WP-3 IR behavior | Expanded closed rule registry, supported rule tests, unsupported-rule diagnostics | WP-1 / WP-2 / WP-3 | Users can enforce deterministic structure without semantic inference. | RISK-2 / RISK-4 | MS-2 | VAL-4 / VAL-6 / VAL-8 | At least 5 rule families pass; semantic-style rules are rejected explicitly. |
| WP-5 | Prove deterministic serialization, repeatability, and boundary safety. | Implementer | PKG-3 / PKG-5 | `src/serialize/**`, snapshots, repeatability tests, boundary-inspection tests/scripts | `src/parser/**`, `src/config/**`, `src/rules/**`, public docs | WP-2, WP-3, WP-4 | Repeatability evidence, snapshot stability, boundary inspection output | WP-2 / WP-3 / WP-4 | Reviewers can prove identical input/config produce identical JSON and no forbidden dependencies exist. | RISK-2 / RISK-4 | MS-2 | VAL-5 / VAL-8 | Ten-run repeatability check passes; boundary inspection reports no forbidden deps. |
| WP-6 | Finalize docs, review evidence, release containment, and handoff. | Implementer | PKG-1 / PKG-5 | `README.md`, `docs/contracts/**`, `docs/execution/**`, `.github/workflows/**` if introduced | all source modules | WP-1 through WP-5 evidence | Review packet, release readiness notes, rollback/containment record, handoff notes | MS-2 | Maintainers can review, merge, and withhold or tag the package with clear evidence. | RISK-3 / RISK-4 | MS-3 | VAL-7 / VAL-8 | All validation evidence exists; release gate records publish/tag decision and containment plan. |

Execution sequence:

1. Resolve `DEP-1` entry approval.
2. Execute `WP-1`; stop at `MS-1` if the critical path fails.
3. Execute `WP-2` before broad parallel implementation.
4. Execute `WP-3` and `WP-4`; they may proceed in parallel only after `WP-2` contract interfaces are stable enough for coordination.
5. Execute `WP-5` after rule and IR behavior exists.
6. Execute `WP-6` after `MS-2` approval.

Parallelization rules: No parallel source edits before `MS-1`. After `MS-1`, `WP-3` and `WP-4` may run in parallel only if editable paths remain disjoint and public contract changes go through `WP-2` coordination. `WP-5` and `WP-6` are serialized after implementation evidence exists.

Integration points: `MS-1` integrates parser/frontmatter/IR/API and minimal config/rule proof; `MS-2` integrates public contract, parser coverage, expanded rules, diagnostics, repeatability, and boundary inspection; `MS-3` integrates release readiness and handoff.

Coordination triggers: Any exported type/function change, IR/diagnostic field change, config schema change, parser adapter result change, snapshot baseline update, dependency addition, CI workflow addition, or shared editable-path conflict requires coordination before continuing.

Section status: Complete

## 9. Milestone Gates and Manual Verification

| ID | Gate objective | Covered work | Due point | Human verifier | Prerequisites | Review gate | Required evidence | Approval decision | Failure path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MS-1 | Approve critical-path proof before routine implementation expands. | OBJ-1 / OBJ-2 / SURF-1 / SURF-2 / SURF-3 / SURF-4 / SURF-5 / PKG-1 / PKG-2 / PKG-3 / PKG-4 / PKG-5 / WP-1 | Before WP-2, WP-3, or WP-4 starts | Project owner or implementation reviewer | VAL-1 / VAL-2 / VAL-3 / VAL-4 / VAL-5 / EVD-1 / EVD-4 | REV-1 / REV-3 | EVD-1 / EVD-4 | Approve / Reject / Conditional approval | If rejected, stop execution and revise parser substrate, IR target, deterministic validation substrate, or execution plan. |
| MS-2 | Approve implementation contract and validation completeness before merge. | OBJ-1 / OBJ-2 / OBJ-3 / OBJ-4 / SURF-2 through SURF-6 / PKG-1 through PKG-5 / WP-2 through WP-5 | Before merge | Project owner and implementation reviewer | VAL-1 through VAL-8 / EVD-2 through EVD-8 | REV-1 / REV-2 / REV-3 | EVD-2 / EVD-3 / EVD-4 / EVD-5 / EVD-6 / EVD-7 / EVD-8 | Approve / Reject / Conditional approval | If rejected, block merge and file required fixes or approved deviations. |
| MS-3 | Approve completion, release containment, and handoff. | OBJ-3 / OBJ-4 / SURF-7 / SURF-8 / WP-6 | Before package tag, publication, or completion claim | Project owner | VAL-7 / VAL-8 / EVD-7 / EVD-9 / EVD-10 / EVD-11 | REV-2 / REV-4 | EVD-7 / EVD-9 / EVD-10 / EVD-11 | Approve / Reject / Conditional approval | If rejected, withhold release/tag and continue documentation, contract, or evidence fixes. |

Manual verification guide:

| Step ID | Milestone | Operator action | Expected result | Evidence artifact |
| --- | --- | --- | --- | --- |
| MV-1 | MS-1 | Run the proving-slice test command and inspect the representative fixture output. | Command passes and output includes parsed frontmatter, normalized IR, minimal deterministic rule result, diagnostics shape, and stable serialized JSON. | EVD-1 / EVD-4 |
| MV-2 | MS-1 | Inspect public exports from the proving slice. | Raw parser AST is not exposed as a stable public contract. | EVD-1 |
| MV-3 | MS-2 | Run the full parser, frontmatter, IR, rule, diagnostic, repeatability, build/typecheck, and boundary validation commands. | All commands pass and evidence artifacts are present. | EVD-2 / EVD-3 / EVD-4 / EVD-5 / EVD-7 / EVD-8 |
| MV-4 | MS-2 | Review contract docs and representative serialized output. | API, IR, config, diagnostic, and serialization contracts are coherent and semver-classified. | EVD-6 |
| MV-5 | MS-3 | Review release containment and handoff notes. | Release/tag decision, rollback limit, downstream notes, and evidence links are recorded. | EVD-9 / EVD-10 / EVD-11 |

Section status: Complete

## 10. Execution Controls and Drift Management

| ID | Trigger | Required action | Owner | Evidence |
| --- | --- | --- | --- | --- |
| CTRL-1 | Implementation needs to expose raw parser AST publicly. | Stop and request project-owner decision or design revision. | Implementer | DEV-* or updated design record |
| CTRL-2 | A rule requires LLM calls, custom plugins, semantic rubrics, or arbitrary user code execution. | Reject the rule from `markdown-engine` and record unsupported-rule behavior. | Implementer | EVD-4 / EVD-8 |
| CTRL-3 | Profile/runtime/MCP/agent-adapter behavior appears in engine code. | Remove the behavior or escalate a package-boundary deviation before merge. | Implementer | EVD-8 |
| CTRL-4 | Two work packages require editing the same source path. | Serialize those work packages or assign one owner and record coordination. | Implementer | Updated work package notes or DEV-* |
| CTRL-5 | Parser dependency cannot provide required location data for representative constructs. | Stop after `MS-1` failure and decide whether to change parser, adjust IR guarantees, or revise diagnostics. | Project owner | EVD-1 and decision record |
| CTRL-6 | Snapshot or contract output changes after `MS-2`. | Treat as contract change requiring reviewer approval. | Implementer | EVD-6 or DEV-* |

Deviation rules: Any change to execution level, parser substrate, public contract strategy, package decomposition, supported v1 rule-family minimum, or release gate requires a `DEV-*` record with owner, approver, rationale, impact, and evidence before merge.

Pause or escalation conditions: Pause for unresolved `DEP-1`, failed `MS-1`, missing source locations that break diagnostics, need for semantic validators, forbidden dependencies, missing repeatability evidence, public contract disagreement, or any unreviewed contract-breaking change.

Section status: Complete

## 11. Data, Schema, Config, and Contract Handling

| Change | Impact | Compatibility | Reversibility | Validation |
| --- | --- | --- | --- | --- |
| Public API surface | New import and function contract for consumers. | Breaking changes after first release require major version. | Reversible before first release; semver-controlled after release. | VAL-7 / REV-2 |
| Engine IR schema | New public contract for downstream profile/runtime packages. | Field removals or semantic changes require major version after first release. | Reversible before first release; semver-controlled after release. | VAL-3 / VAL-5 / VAL-7 |
| Validation config schema | New YAML-friendly deterministic rule declaration contract. | Unsupported or removed declarations require compatibility classification. | Reversible before first release; semver-controlled after release. | VAL-4 / VAL-7 |
| Diagnostic schema | New CI/editor/agent-facing result contract. | Field removals or severity semantics changes require compatibility classification. | Reversible before first release; semver-controlled after release. | VAL-6 / VAL-7 |
| Package dependency and script config | New local build, test, and package-management behavior. | Tooling changes affect contributors and CI. | Reversible through branch revert before release. | VAL-1 / VAL-8 |

N/A rationale: Runtime data stores, migrations, backfills, permissions, events, and live environment config are not affected.

Section status: Complete

## Layer 3: Validation, Release, and Handoff

## 12. Validation and Evidence Plan

| ID | Method | Claim verified | Timing | Owner | Evidence artifact |
| --- | --- | --- | --- | --- | --- |
| VAL-1 | Test / Analysis | GFM fixture parsing covers representative syntax, selected `cmark-gfm` comparison cases, and feeds normalization. | Pre-merge | Implementer | EVD-1 / EVD-2 |
| VAL-2 | Test | YAML frontmatter valid, absent, empty, and invalid cases produce expected values or diagnostics. | Pre-merge | Implementer | EVD-2 |
| VAL-3 | Test / Inspection | Normalized IR contains hierarchy, node type, text, raw HTML representation, and source locations where available. | Pre-merge | Implementer | EVD-1 / EVD-3 |
| VAL-4 | Test | Minimal proving-slice deterministic config and expanded supported deterministic config evaluate correctly; unsupported declarations produce explicit diagnostics. | Pre-merge | Implementer | EVD-4 |
| VAL-5 | Test | Repeated validation runs produce byte-for-byte identical serialized JSON for identical inputs. | Pre-merge | Implementer | EVD-5 |
| VAL-6 | Test / Inspection | Diagnostics include rule ID, severity, message, source location where available, and raw HTML is not executed. | Pre-merge | Implementer | EVD-3 / EVD-4 |
| VAL-7 | Review / Test | Public API functions, result contracts, semver classifications, package build, and typecheck are documented and reviewable. | Pre-merge / Pre-release | Implementer | EVD-6 / EVD-7 |
| VAL-8 | Review / Measurement | Boundary inspection finds no MCP, runtime, agent-adapter, LLM, network-service, or product-profile dependency in engine code. | Pre-merge / Pre-release | Implementer | EVD-8 |

Evidence artifact register:

| ID | Evidence artifact | Required contents |
| --- | --- | --- |
| EVD-1 | Critical-path proof record | Proving-slice command, representative fixture, serialized output, minimal deterministic validation output, and reviewer notes from `MS-1`. |
| EVD-2 | Parser/frontmatter fixture report | Fixture list, parser/frontmatter test output, selected `cmark-gfm` comparison output, and failure notes if any. |
| EVD-3 | IR and diagnostic snapshot report | Snapshot diff status, source-location coverage notes, and raw HTML representation evidence. |
| EVD-4 | Config and rule validation report | Minimal proving-slice rule output, supported rule-family test output, and unsupported-rule diagnostic examples. |
| EVD-5 | Deterministic repeatability report | Ten-run serialized JSON comparison output and command used. |
| EVD-6 | Public contract review packet | API exports, IR schema, config schema, diagnostic schema, serialization contract, and review notes. |
| EVD-7 | Semver and release-readiness record | Compatibility classification, package version decision, build/typecheck output, and release/tag recommendation. |
| EVD-8 | Boundary inspection report | Evidence that no profile/runtime/MCP/agent-adapter/LLM/network-service dependency entered engine code. |
| EVD-9 | Merge readiness record | Branch status, review approvals, milestone approval status, and merge decision. |
| EVD-10 | Rollback and containment record | Revert path, release withholding decision, or post-release containment notes. |
| EVD-11 | Downstream consultation and handoff notes | Downstream profile/runtime feedback, plus implementation handoff notes. |

Section status: Complete

## 13. Review Plan

| ID | Reviewer | Review scope | Blocking? | Completion evidence |
| --- | --- | --- | --- | --- |
| REV-1 | Implementation reviewer | Scaffold, dependencies, test commands, build/typecheck output, parser/frontmatter fixtures, selected `cmark-gfm` comparisons, repeatability evidence, and `git diff --check`. | Yes | EVD-1 / EVD-2 / EVD-5 / EVD-7 |
| REV-2 | Project owner or designated contract reviewer | Public API, IR, config, diagnostics, serialization, docs, and semver classification. | Yes | EVD-6 / EVD-7 |
| REV-3 | Boundary reviewer | Deterministic-only rule engine, unsupported-rule behavior, no profile/runtime/MCP/agent-adapter scope drift. | Yes | EVD-4 / EVD-8 |
| REV-4 | Downstream profile/runtime consumer | Whether the engine output can support future profile compilation and runtime lenses without parser forking. | No | EVD-7 / EVD-11 |

Approval conditions: Merge requires passing `REV-1`, `REV-2`, and `REV-3`, approval of `MS-2`, no blocking `Q-*`, no open `Blocker` or `Major` review findings, and no unapproved deviations from this spec. Release or tag requires `REV-4` downstream-consumer confirmation.

Section status: Complete

## 14. Rollout, Migration, Rollback, and Recovery

| ID | Action | Timing | Owner | Abort trigger | Evidence |
| --- | --- | --- | --- | --- | --- |
| REL-1 | Implement on a feature branch or worktree separate from `main`. | During execution | Implementer | Branch contains unrelated changes or unapproved scope. | EVD-9 |
| REL-2 | Merge implementation only after `MS-2` approval. | Pre-merge | Project owner | Missing validation evidence, contract review rejection, or failed boundary inspection. | EVD-9 |
| REL-3 | Withhold package tag/publication until `MS-3` approval. | Pre-release | Project owner | Downstream contract concern, missing release notes, or unresolved semver classification. | EVD-10 / EVD-11 |
| REL-4 | Revert or withhold release if package behavior fails after merge but before publication. | Recovery | Implementer | Failing CI, fixture regression, or contract issue discovered before release. | EVD-10 |

Rollback or containment plan: Before first release, rollback is branch revert or merge revert. After a package tag or publication, containment uses semver, deprecation notes, and a corrective patch or major-version plan; silent public contract mutation is prohibited.

Recovery limit: No persistent user data or live service state exists, so recovery is limited to source/package contract correction and release containment.

Section status: Complete

## 15. Observability and Operational Readiness

| ID | Signal | Purpose | Consumer | Response |
| --- | --- | --- | --- | --- |
| OBS-1 | Package test result | Detect parser, frontmatter, rule, diagnostic, and serialization failures. | Implementer and reviewer | Block merge until fixed. |
| OBS-2 | Snapshot diff | Detect IR, diagnostic, and serialized output contract changes. | Contract reviewer | Approve intentional changes or reject drift. |
| OBS-3 | Boundary inspection result | Detect forbidden dependencies and scope drift. | Boundary reviewer | Block merge and remove dependency or approve deviation. |
| OBS-4 | Package build/typecheck result | Detect public type or build failures. | Implementer and reviewer | Block merge until fixed. |
| OBS-5 | Downstream contract feedback | Detect unusable IR/diagnostic/config shape before release. | Project owner | Block release until addressed or formally deviated. |

Operator actions: Maintainers run validation commands, review evidence artifacts, approve or reject milestone gates, classify contract changes, and withhold release if gates fail.

Monitoring window: From implementation PR open through the first downstream profile/runtime integration or first package release decision, whichever occurs later.

N/A rationale: No live production service, database, alerting dashboard, or on-call runbook is required for the local package implementation.

Section status: Complete

## 16. Risks, Questions, Deviations, and Waivers

Risks:

| ID | Risk | Impact | Likelihood | Owner | Mitigation | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| RISK-1 | Parser source locations are insufficient or unstable. | Diagnostics become weaker or IR guarantee must change. | Medium | Implementer | Prove representative constructs in `WP-1` and expand fixtures in `WP-3`. | VAL-1 / VAL-3 |
| RISK-2 | Rule vocabulary drifts into semantic judgment. | Deterministic guarantee is compromised. | Medium | Implementer | Closed rule registry, unsupported-rule diagnostics, boundary review. | VAL-4 / VAL-8 |
| RISK-3 | Public contracts do not meet downstream profile/runtime needs. | Later packages may fork parser behavior or require rework. | Medium | Project owner | Contract review and downstream consultation before release. | VAL-7 / REV-4 |
| RISK-4 | Engine absorbs profile/runtime/MCP concerns. | Package decomposition fails. | Medium | Implementer | Non-objectives, forbidden dependencies, boundary inspection. | VAL-8 |

Open questions:

None. Rationale: parser/runtime/tooling decisions are bounded by assumptions and milestone gates rather than open blockers; `DEP-1` entry approval remains the only blocking dependency.

Approved deviations:

None. Rationale: no deviations from the plan are approved at draft time.

Approved waivers:

None. Rationale: no review or milestone requirements are waived.

Section status: Complete

## 17. Execution Traceability Matrix

| Source, objective, or evidence-led claim | Change surfaces | Package boundaries | Work packages | Milestones | Controls | Validation | Review | Release or ops | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRC-1 / OBJ-1 / Critical path | SURF-1 / SURF-2 / SURF-3 / SURF-4 / SURF-5 / SURF-6 | PKG-1 / PKG-2 / PKG-3 / PKG-4 / PKG-5 | WP-1 / WP-3 / WP-4 | MS-1 / MS-2 | CTRL-2 / CTRL-5 | VAL-1 / VAL-2 / VAL-3 / VAL-4 | REV-1 / REV-2 / REV-3 | REL-1 / OBS-1 / OBS-2 | EVD-1 / EVD-2 / EVD-3 / EVD-4 |
| SRC-1 / OBJ-2 | SURF-5 / SURF-6 | PKG-4 / PKG-5 | WP-4 / WP-5 | MS-2 | CTRL-2 / CTRL-6 | VAL-4 / VAL-5 / VAL-6 | REV-1 / REV-3 | REL-2 / OBS-1 / OBS-2 | EVD-4 / EVD-5 |
| SRC-1 / OBJ-3 | SURF-2 / SURF-4 / SURF-7 | PKG-1 / PKG-3 | WP-2 / WP-6 | MS-2 / MS-3 | CTRL-1 / CTRL-6 | VAL-7 | REV-2 / REV-4 | REL-3 / OBS-5 | EVD-6 / EVD-7 / EVD-11 |
| SRC-2 / OBJ-4 / Boundary claim | SURF-2 / SURF-5 / SURF-6 / SURF-7 | PKG-1 / PKG-4 / PKG-5 | WP-4 / WP-5 / WP-6 | MS-2 / MS-3 | CTRL-2 / CTRL-3 / CTRL-4 | VAL-8 | REV-3 | REL-2 / OBS-3 | EVD-8 |
| SRC-3 / Review authority | all writable surfaces | PKG-1 through PKG-5 | WP-1 through WP-6 | MS-1 / MS-2 / MS-3 | CTRL-1 through CTRL-6 | VAL-1 through VAL-8 | REV-1 through REV-4 | REL-1 through REL-4 | EVD-1 through EVD-11 |
| SRC-4 / Execution planning request | docs/execution | N/A | WP-6 | MS-3 | CTRL-4 | VAL-7 / VAL-8 | REV-2 | REL-3 | EVD-9 / EVD-11 |
| First proving slice | SURF-1 / SURF-2 / SURF-3 / SURF-4 / SURF-5 / SURF-6 | PKG-1 / PKG-2 / PKG-3 / PKG-4 / PKG-5 | WP-1 | MS-1 | CTRL-2 / CTRL-5 | VAL-1 / VAL-2 / VAL-3 / VAL-4 / VAL-5 | REV-1 / REV-3 | REL-1 / OBS-1 | EVD-1 / EVD-4 |
| RISK-1 | SURF-3 / SURF-4 / SURF-6 | PKG-2 / PKG-3 / PKG-5 | WP-1 / WP-3 | MS-1 / MS-2 | CTRL-5 | VAL-1 / VAL-3 | REV-1 / REV-2 | OBS-1 / OBS-2 | EVD-1 / EVD-3 |
| RISK-2 | SURF-5 / SURF-6 | PKG-4 / PKG-5 | WP-4 / WP-5 | MS-2 | CTRL-2 / CTRL-6 | VAL-4 / VAL-8 | REV-3 | OBS-3 | EVD-4 / EVD-8 |
| RISK-3 | SURF-2 / SURF-4 / SURF-7 | PKG-1 / PKG-3 | WP-2 / WP-6 | MS-2 / MS-3 | CTRL-1 / CTRL-6 | VAL-7 | REV-2 / REV-4 | REL-3 / OBS-5 | EVD-6 / EVD-7 / EVD-11 |
| RISK-4 | SURF-2 / SURF-5 / SURF-6 | PKG-1 / PKG-4 / PKG-5 | WP-4 / WP-5 / WP-6 | MS-2 / MS-3 | CTRL-2 / CTRL-3 / CTRL-4 | VAL-8 | REV-3 | REL-2 / OBS-3 | EVD-8 |

Section status: Complete

## 18. Final Execution Gate

Entry gate: Not satisfied. `DEP-1` requires project-owner approval of PR #1 or an equivalent approval record before implementation starts.

Milestone approval gate: `MS-1`, `MS-2`, and `MS-3` are fully specified with verifier, due point, evidence, approval decision, and failure path. No due milestone has arrived because implementation has not started.

Completion gate: Completion requires all `WP-*` items complete, `MS-2` approved, blocking reviews resolved, `VAL-*` evidence captured, no open blocking `Q-*`, no unapproved `DEV-*`, and no unapproved `WVR-*`.

Release gate: Release or package tag requires `MS-3` approval, `REL-3` evidence, semver classification, downstream-consumer confirmation, and containment notes.

Handoff record: Handoff shall include links to `EVD-1` through `EVD-11`, final package commands, public contract docs, release/rollback notes, unresolved non-blocking follow-ups, and downstream profile/runtime integration notes.

Final readiness state: Not ready

Section status: Complete
