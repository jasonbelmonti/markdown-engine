# Markdown Engine 1.0 Rich IR Execution Specification

## Document Control

| Field | Value |
| --- | --- |
| Title | Markdown Engine 1.0 Rich IR Implementation |
| Status | Draft |
| Execution level | `E2` |
| Execution level justification | The work changes durable public TypeScript API, IR schema, serialization, compatibility, query, annotation, and downstream-consumer contracts. It does not qualify for `E1` because another implementer or agent must be able to execute package and contract changes from this plan. It does not trigger `E3` because execution does not change authentication, authorization, secrets, live customer data, irreversible storage, payments, safety controls, or a high-volume production path. |
| Author(s) | Codex |
| Executor(s) | Markdown-engine implementer or assigned coding agents |
| Reviewers | Project owner, implementation reviewer, downstream SpecTrace/profile/runtime consumer, boundary/security reviewer |
| Decision owner | Project owner |
| Target branch, release, or milestone | `markdown-engine` 1.0 rich IR implementation branch before 1.0 release approval |
| Last updated | 2026-05-01 |
| Related source docs | `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md`; `docs/contracts/api.md`; `docs/design/markdown-engine-operational-design-spec.md`; `RUNTIME_ARCHITECTURE.md` |
| Related tickets | none |

## 0. Execution Summary

Decision status: Approved to execute

Approved outcome: Execute the 1.0 rich IR implementation authorized by `SRC-1`, producing a deterministic public `markdown-engine` contract with node targets, sections, source slices, text spans, table/list views, query helpers, annotation targets, compatibility gates, and release evidence.

Execution approach: Use risk retirement first, then progressive value. `WP-1` proves the narrowest 1.0 path through target identity, source grounding, section query, annotation target validation, serialization, and legacy compatibility on one representative fixture. Later work packages harden the source/target substrate, derived structural views, annotation and diagnostic behavior, compatibility documentation, repeatability, boundary safety, and downstream exercise evidence.

Entry condition: Satisfied on 2026-05-02 by project-owner approval recorded in Linear `BEL-932`. Implementation may proceed to `WP-1`; 1.0 tag, package publication, or release completion remains blocked until `MS-3`.

Top risks or unknowns:

- RISK-1: Rich IR scope may absorb SpecTrace, profile, runtime, or semantic behavior that belongs outside the engine.
- RISK-2: Public node target identity may be misunderstood as stable across arbitrary edits instead of deterministic for identical input and options.
- RISK-3: Parser source offsets may be incomplete or unstable for source slices and source-grounded derived views.

Section status: Complete

## Layer 1: Execution Basis

## 1. Source Authority and Scope

| ID | Source | Authority | Execution implication |
| --- | --- | --- | --- |
| SRC-1 | `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md` | R2 operational design requesting implementation approval for the 1.0 rich IR. | Execute public IR, API, query, annotation, compatibility, documentation, validation, and downstream exercise work only inside the design boundaries. |
| SRC-2 | `docs/contracts/api.md` | Current published `0.1.0` public API contract. | Preserve explicit legacy compatibility gates and semver-classify public contract changes before any 1.0 release. |
| SRC-3 | `docs/design/markdown-engine-operational-design-spec.md` and `RUNTIME_ARCHITECTURE.md` | Existing package boundary and architecture authority. | Keep `markdown-engine` a deterministic local TypeScript package that excludes profile, runtime, MCP, agent adapters, semantic evaluation, network services, and persistent storage. |
| SRC-4 | User request to generate an execution spec from `SRC-1`. | Execution planning request. | Produce an implementation-ready execution plan before coding starts. |

In scope: 1.0 public TypeScript types and API entry points, rich `EngineDocument` shape, deterministic `EngineTarget` generation, source range and source slice behavior, heading-derived section tree, text spans, table row/cell coordinates, list metadata, link views, query helpers, caller-owned annotation target validation, compatibility selectors or namespaces for 0.1.x behavior where retained, deterministic serialization, CLI output compatibility if affected, fixtures, snapshots, repeatability tests, boundary audits, API contract docs, migration notes, downstream SpecTrace-style exercise, release containment, and handoff evidence.

Public naming boundary: `rich IR` is an execution workstream label only. Public
TypeScript symbols, package-root exports, and source modules shall use
engine/document vocabulary such as `EngineDocument`, `EngineNode`,
`EngineTarget`, query helpers, annotation helpers, `parse`, `normalize`,
`validate`, and `serialize`. Do not introduce public `RichIr*`, `richIr`,
`queryRichIr`, `serializeRichIr`, `validateRichIr*`, or a separate public
`rich-ir` module without a `DEV-*` deviation and project-owner approval. The
required `test:rich-ir:*`, `audit:rich-ir-boundary`, and
`docs:rich-ir-contract` command names are execution-gate labels, not public API
naming precedent.

Out of scope: SpecTrace entity registries, canonical IDs, relationship graphs, issue-key policy, profile compilation, runtime lenses, MCP transport, agent adapters, LLM or semantic validators, graph database, persistent index, file-watching daemon, network service, browser UI, and any promise that node targets survive arbitrary author edits.

Definition of done: The 1.0 contract is implemented and documented; tests and snapshots prove targets, source slices, sections, spans, tables, lists, links, query helpers, annotations, compatibility gates, inert raw HTML/source behavior, and deterministic serialization; boundary audit shows no forbidden domain or runtime dependencies; a downstream SpecTrace-style fixture exercise proves the motivating structural use case; milestone approvals and release containment evidence are recorded.

Re-decision boundaries: Changing the 1.0 default contract, exposing raw parser AST as public API, redefining node identity semantics, moving domain semantics into core IR, dropping 0.1.x compatibility without explicit approval, adding network/persistent runtime behavior, or publishing/tagging without `MS-3` approval requires project-owner review before execution continues.

Section status: Complete

## 2. Objectives and Non-Objectives

| ID | Statement | Completion horizon | Evidence |
| --- | --- | --- | --- |
| OBJ-1 | Deliver a canonical 1.0 rich `EngineDocument` contract with deterministic node targets, source references, sections, text spans, tables, lists, links, and stable serialized output for identical input and options. | Before merge of the implementation branch | EVD-1 / EVD-2 / EVD-3 / EVD-6 |
| OBJ-2 | Deliver public query helpers and source-slice helpers that let consumers access sections, nodes, links, tables, lists, text spans, and source slices without raw parser traversal. | Before merge of the implementation branch | EVD-3 |
| OBJ-3 | Deliver caller-owned annotation target support that validates engine targets or source ranges while keeping annotation payload semantics opaque to `markdown-engine`. | Before merge of the implementation branch | EVD-4 / EVD-8 |
| OBJ-4 | Preserve deterministic 0.1.x-compatible behavior only through explicit documented compatibility gates and make 1.0 rich IR the root 1.0 contract. | Before release or package tag | EVD-5 / EVD-8 |
| OBJ-5 | Prove the 1.0 contract is useful to a downstream structural document app through a SpecTrace-style fixture exercise without adding SpecTrace semantics to the engine. | Before 1.0 release approval | EVD-9 |
| NG-1 | This execution will not implement SpecTrace registries, canonical entity IDs, relationship edges, issue-key policy, or profile semantics. | Boundary review | EVD-7 / EVD-9 |
| NG-2 | This execution will not implement `markdown-profile`, `markdown-runtime`, MCP transport, agent adapters, file watchers, network services, or persistent storage. | Boundary review | EVD-7 |
| NG-3 | This execution will not expose raw mdast/unified parser AST or YAML parser internals as stable public contracts. | Contract review | EVD-8 |
| NG-4 | This execution will not promise node target stability across arbitrary content edits. | Contract review | EVD-2 / EVD-8 |
| NG-5 | This execution will not publish or tag 1.0 until release readiness, downstream exercise evidence, and rollback containment are approved. | Release gate | EVD-10 |

Section status: Complete

## 3. Ownership, Roles, and Decision Points

| Role or person | Responsibility | Required action |
| --- | --- | --- |
| Project owner | Approves entry, milestone gates, public compatibility decisions, release readiness, deviations, and final execution outcome. | Approve |
| Markdown-engine implementer | Executes work packages, records validation evidence, and raises deviations or blockers. | Execute |
| Implementation reviewer | Reviews code, package boundaries, tests, snapshots, public API contracts, and migration evidence. | Review |
| Downstream SpecTrace/profile/runtime consumer | Reviews whether 1.0 structural APIs can replace downstream scanner duplication without semantic leakage. | Review |
| Boundary/security reviewer | Confirms raw HTML/source text remain inert local data and no forbidden domain, network, persistence, LLM, MCP, or runtime dependency enters the engine. | Consult |

Decision points:

- DP-1: Entry approval before `WP-1` starts.
- DP-2: `MS-1` critical-path proof approval before broad derived-view, compatibility, or annotation implementation proceeds.
- DP-3: `MS-2` implementation and contract approval before merge.
- DP-4: `MS-3` release readiness approval before any 1.0 tag, package publication, or completion claim.

Escalation path: Any blocking dependency, target identity failure, source offset failure, compatibility ambiguity, domain-semantics pressure, forbidden dependency, or public contract deviation stops the affected work package and escalates to the project owner with a `DEV-*` proposal, design revision, or explicit rejection path.

Section status: Complete

## 4. Constraints, Assumptions, and Dependencies

| ID | Type | Statement | Owner | Blocking? | Validation or resolution plan |
| --- | --- | --- | --- | --- | --- |
| CON-1 | Constraint | `markdown-engine` shall remain a deterministic local TypeScript package with no live service, database, network, MCP, agent, profile, runtime, or semantic-evaluation behavior. | Implementer | No | `VAL-7` boundary audit and `REV-4` review. |
| CON-2 | Constraint | Domain-specific entities and relationships shall remain outside core IR and may enter only as caller-owned annotation payloads. | Implementer | No | `VAL-4`, `VAL-7`, and `VAL-9`. |
| CON-3 | Constraint | Public 1.0 IR, API, diagnostic, query, annotation, and serialization changes shall be semver-classified before release. | Project owner | No | `VAL-8` and `MS-3`. |
| CON-4 | Invariant | Raw HTML, recovered source text, and source slices shall remain inert strings and shall not be rendered, fetched, sanitized, executed, or trusted by the engine. | Implementer | No | `VAL-7` tests and boundary review. |
| CON-5 | Invariant | Node targets and serialized output shall be deterministic for identical Markdown input, options, package version, and runtime version. | Implementer | No | `VAL-6` repeatability evidence. |
| ASM-1 | Assumption | Current parser and YAML dependencies can provide enough source positions for the 1.0 representative constructs. | Implementer | No | Retire through `WP-1`, `WP-2`, `VAL-1`, and `VAL-2`; revise scope if false. |
| ASM-2 | Assumption | Rich structural views can be derived from normalized engine IR without exposing raw parser AST publicly. | Implementer | No | Retire through `WP-1`, `WP-3`, and `VAL-3`. |
| ASM-3 | Assumption | Existing package scripts can be extended to prove build, typecheck, tests, boundary audit, repeatability, and release readiness without introducing a new CI platform requirement. | Implementer | No | Confirm in `WP-6` and `VAL-10`. |
| DEP-1 | Dependency | Project-owner approval of `SRC-1` and this execution spec is required before implementation starts. | Project owner | No (resolved) | Satisfied on 2026-05-02 by Linear `BEL-932`; implementation may proceed to `WP-1`. |
| DEP-2 | Dependency | The current `0.1.0` API contract and release scripts must remain available as a compatibility baseline during implementation. | Implementer | No | `VAL-5` legacy compatibility tests and contract review. |
| DEP-3 | Dependency | Downstream SpecTrace/profile/runtime consumer review is required before 1.0 release approval. | Project owner | No for coding; Yes for release | `MS-3`, `REV-3`, and `VAL-9`. |

Section status: Complete

## Layer 2: Execution Plan

## 5. Evidence-Led Execution Model

Observable outcome: A consumer can import the 1.0 `markdown-engine` package, normalize a representative Markdown document, query rich structural views, attach caller-owned annotations to valid targets, request source slices where offsets exist, and serialize deterministic output while 0.1.x-compatible behavior remains available only through explicit documented gates.

Core value proposition: Downstream document applications get a generic source-grounded structural substrate and no longer need brittle line scanners, raw parser traversal, or duplicated table/list/section logic.

Critical path hypothesis: If one representative document can travel through the existing parser/frontmatter path into deterministic node targets, source slices, section membership, a text span, a table/list view, a query helper, annotation target validation, 1.0 serialization, and an explicit legacy compatibility check without domain semantics entering the engine, then the remaining implementation can expand coverage and documentation without reopening the architecture.

First proving slice: `WP-1` implements the minimal 1.0 proving fixture that includes frontmatter, nested headings, a paragraph with inline text, a link, a GFM table, nested task list items, raw HTML, and a code fence. The slice produces target IDs, source ranges/slices where offsets exist, section body membership, one text span, one table cell coordinate, one list item coordinate, one query helper result, one valid annotation attachment, deterministic serialized output, and a legacy compatibility assertion.

Sequencing principle: Retire identity, source-grounding, compatibility, and boundary risks before broad structural coverage. After `MS-1`, execute progressively through source/target hardening, derived view/query expansion, annotation and diagnostic completion, compatibility docs, repeatability, downstream exercise, and release containment.

Validation cadence: Each `WP-*` must produce its mapped `VAL-*` evidence before dependent work starts. `MS-1` is due before broad implementation, `MS-2` is due before merge, and `MS-3` is due before release, tag, publication, or completion claim.

Deferred completeness: Exhaustive Markdown construct breadth, final public type names, generated API docs polish, downstream integration examples beyond the required fixture, and release publication are deferred until the proving slice, contract review, and downstream exercise succeed.

Primary risks and unknowns:

| ID | Risk or unknown | Why it matters | Owner | Evidence required to retire | Decision gate |
| --- | --- | --- | --- | --- | --- |
| RISK-1 | Rich IR may absorb domain semantics. | Domain leakage would invalidate the engine boundary and couple 1.0 to one downstream app. | Implementer | VAL-4 / VAL-7 / VAL-9 | MS-2 / MS-3 |
| RISK-2 | Node target identity may be brittle or overpromised. | Diagnostics and annotations need deterministic targets, but cross-edit stability cannot be implied. | Implementer | VAL-1 / VAL-2 / VAL-6 / VAL-8 | MS-1 / MS-2 |
| RISK-3 | Parser source offsets may not support source slices for all intended constructs. | Source-grounded diagnostics, text spans, and exact report targets depend on reliable offsets. | Implementer | VAL-1 / VAL-2 / VAL-3 | MS-1 / MS-2 |
| RISK-4 | 1.0 default behavior and 0.1.x compatibility behavior may become ambiguous. | Consumers need one canonical 1.0 path and explicit legacy gates. | Project owner | VAL-5 / VAL-8 | MS-2 / MS-3 |

Section status: Complete

## 6. Change Surface Inventory

| ID | Surface | Change type | Owner | Read/write boundary | Review expectation |
| --- | --- | --- | --- | --- | --- |
| SURF-1 | `src/index.ts`, `src/api/**` | Code / Contract | Implementer | Writable by `WP-1`, `WP-4`, and `WP-5` for public 1.0 API, query, annotation, compatibility, and serialization entry points. | Public API and compatibility review in `REV-1` / `REV-2`. |
| SURF-2 | `src/ir/**` | Code / Schema | Implementer | Writable by `WP-1`, `WP-2`, and `WP-3` for rich document, target, source, section, span, table, list, and link models. | IR/schema review in `REV-2`; contract approval in `MS-2`. |
| SURF-3 | `src/parser/**`, `src/frontmatter/**` | Code | Implementer | Writable by `WP-1` and `WP-2` only when source positions, parser adapter output, or frontmatter propagation require changes. | Parser/source grounding review in `REV-2`. |
| SURF-4 | `src/serialize/**`, `src/diagnostics/**` | Code / Data | Implementer | Writable by `WP-1`, `WP-4`, and `WP-5` for deterministic 1.0 output, target diagnostics, and compatibility diagnostics; read-only for `WP-6` unless an approved `DEV-*` expands release/handoff scope. | Snapshot and repeatability review in `REV-2`. |
| SURF-5 | `src/rules/**`, `src/config/**` | Code / Config | Implementer | Writable by `WP-4` only if rules or config must consume rich targets or preserve compatibility. | Boundary and deterministic-rule review in `REV-4`. |
| SURF-6 | `src/cli/**` | Code / Contract | Implementer | Writable by `WP-5` if CLI output or options need explicit 1.0/legacy behavior. | CLI compatibility review in `REV-2`. |
| SURF-7 | `tests/**`, `fixtures/**`, `snapshots/**`, `scripts/**` | Test / Evidence | Implementer | Writable by all work packages for scoped validation and evidence harness changes. | Validation evidence review in `REV-2`. |
| SURF-8 | `docs/contracts/**`, `README.md`, `CHANGELOG.md`, `SECURITY.md`, `docs/evidence/**` | Docs / Contract / Evidence | Implementer | Writable by `WP-5` and `WP-6` for public contract docs, migration notes, release evidence, and handoff. | Contract and release review in `REV-1` / `REV-3`. |
| SURF-9 | `package.json`, lockfile, TypeScript config, release scripts | Config / Contract | Implementer | Writable by `WP-1` for required verification script registration and by `WP-5` / `WP-6` for versioning, build, and release verification changes. | Release readiness review in `REV-1` / `REV-2`. |

Section status: Complete

## 7. Agent-Focused Package Decomposition

Decomposition mission: Constrain implementation agents to stable package boundaries that prove 1.0 rich IR value while preventing domain leakage, compatibility ambiguity, and shared-file contention.

| ID | Unit | Ladder level | Mission | Observable value enabled | Risk retired | Public interface | Validation command | Promotion blockers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PKG-1 | Public API and compatibility contract | 4 | Own the package root contract, exported types, versioned 1.0 behavior, and explicit legacy selectors or namespaces. | Consumers can adopt the 1.0 contract without depending on internals. | RISK-4 | `@jasonbelmonti/markdown-engine` root exports and contract docs. | `npm run typecheck && npm run test:rich-ir:contract` | 1.0 release remains blocked until `MS-3`. |
| PKG-2 | Source and target substrate | 2 | Own deterministic node target generation, source range propagation, and source-slice behavior. | Diagnostics, annotations, and review comments can target source-grounded structures. | RISK-2 / RISK-3 | Engine-owned target and source helpers consumed by public API. | `npm run test:rich-ir:targets` | Parser offset coverage and stability must pass `VAL-2`. |
| PKG-3 | Derived structural views and query helpers | 2 | Own sections, text spans, table/list/link views, and public query helpers derived from engine IR. | Downstream apps can replace duplicated line scanners and raw traversal. | RISK-1 / RISK-3 | Query helper exports and rich view types through `PKG-1`. | `npm run test:rich-ir:queries` | Query API naming and coverage require `MS-2` contract approval. |
| PKG-4 | Annotation target validation and diagnostics | 2 | Own caller-owned annotation attachment, target validation, and deterministic target diagnostics. | Downstream apps can enrich documents without pushing domain semantics into core IR. | RISK-1 / RISK-2 | Annotation target types and validation functions through `PKG-1`. | `npm run test:rich-ir:annotations && npm run audit:rich-ir-boundary` | Payload semantics must remain opaque; any semantic interpretation blocks promotion. |
| PKG-5 | Serialization, CLI, and migration surface | 2 | Own deterministic 1.0 serialization, CLI compatibility behavior if affected, semver notes, and migration docs. | Review and release evidence can compare stable output and guide consumers. | RISK-4 | Serializer API, CLI output contract if changed, docs. | `npm run test:rich-ir:compat && npm run test:rich-ir:repeatability` | Release docs and compatibility matrix must pass `VAL-8`. |
| PKG-6 | Fixture, evidence, and release harness | 2 | Own fixtures, snapshots, repeatability scripts, boundary audit, downstream exercise, release verification, and evidence artifacts. | Reviewers can verify claims before merge and release. | RISK-1 / RISK-2 / RISK-3 / RISK-4 | Test scripts, snapshots, evidence files, release verification commands. | `npm run release:verify` | Harness cannot replace human milestone approvals. |

### Package Boundary Card: PKG-1

Ladder level: 4

Mission: Public package API and compatibility contract for 1.0.

Value / risk trace:

- Observable value enabled: Consumers call stable 1.0 exports and explicit legacy gates.
- Risk retired: RISK-4
- Validation evidence: VAL-5 / VAL-8 / EVD-5 / EVD-8
- Blocking unknowns: None after `DEP-1`; release remains blocked until `MS-3`.

Owns:

- Files/directories: `src/index.ts`, `src/api/**`, public API portions of `docs/contracts/**`.
- Concepts: exported types, function names, option names, 1.0 default behavior, legacy selectors, semver classification, and public naming continuity with the existing engine/document contract.
- Runtime responsibilities: Invoke internal packages through explicit typed boundaries and expose result objects.

Does not own:

- Explicitly excluded behavior: parser internals, raw AST, domain semantics, profile/runtime/MCP behavior.
- Responsibilities delegated elsewhere: source/targets to `PKG-2`, derived views to `PKG-3`, annotations to `PKG-4`, serialization/docs harness to `PKG-5` / `PKG-6`.

Public interface:

- Exported types: 1.0 document, target, source range, section, span, table, list, link, annotation, query, diagnostic, compatibility, and result types.
- Exported functions/classes/components: parse, normalize, validate, serialize, query helpers, source-slice helper, annotation validation/attachment functions, or final approved equivalents.
- Public naming constraint: workstream labels such as `rich IR` shall not appear
  as public TypeScript prefixes, package-root API names, or standalone public
  module names. Contract review shall reject `RichIr*`, `richIr`, `queryRichIr`,
  `serializeRichIr`, `validateRichIr*`, or `src/api/rich-ir.ts` unless a
  recorded `DEV-*` deviation explicitly approves a parallel API.
- Events/messages/contracts: none.
- CLI/API surface: package root exports; CLI only through `PKG-5`.

Allowed dependencies:

- May import: `PKG-2` through `PKG-5` public internal entry points.
- May call: deterministic engine helpers.
- May read configuration from: explicit function options and arguments only.

Forbidden dependencies:

- Must not import: raw parser AST types as public exports, SpecTrace/profile/runtime/MCP/agent/LLM/network/database modules, UI routes.
- Must not call: network services, shell commands, dynamic plugins, LLM APIs, file traversal outside caller-provided inputs.
- Must not know about: downstream profile IDs, SpecTrace issue keys, application-specific entity semantics.

State boundary:

- Owns state: none across calls.
- Reads state: explicit inputs only.
- Mutates state: invocation-local objects only.
- Persistence responsibility: none.

Agent ownership boundary:

- Agent editable paths: `src/index.ts`, `src/api/**`, public API docs under `docs/contracts/**`.
- Agent read-only paths: `src/parser/**`, `src/frontmatter/**`, `src/ir/**`, `src/rules/**`, `src/config/**` unless assigned by another work package.
- Required coordination before editing: any exported symbol, option, result field, compatibility selector, or public contract text.

Validation command: `npm run typecheck && npm run test:rich-ir:contract`

Promotion blockers: No 1.0 release until `MS-3` approves release readiness and downstream exercise evidence.

### Package Boundary Card: PKG-2

Ladder level: 2

Mission: Deterministic source and target substrate.

Value / risk trace:

- Observable value enabled: Consumers can reference nodes and source slices consistently for identical input and options.
- Risk retired: RISK-2 / RISK-3
- Validation evidence: VAL-1 / VAL-2 / VAL-6 / EVD-1 / EVD-2 / EVD-6
- Blocking unknowns: Parser source offset coverage until `MS-1` and `MS-2`.

Owns:

- Files/directories: target/source modules under `src/ir/**`, necessary parser/frontmatter adapter source position plumbing in `src/parser/**` and `src/frontmatter/**`.
- Concepts: target IDs, node path, source ranges, source slices, source availability diagnostics, deterministic ordering.
- Runtime responsibilities: derive target/source metadata from engine-owned IR without exposing raw parser internals.

Does not own:

- Explicitly excluded behavior: section/query semantics, annotation payload semantics, serializer formatting policy.
- Responsibilities delegated elsewhere: derived views to `PKG-3`, annotations to `PKG-4`, public API naming to `PKG-1`.

Public interface:

- Exported types: target and source types through `PKG-1`.
- Exported functions/classes/components: internal target generator and source-slice helpers exposed only through approved API.
- Events/messages/contracts: target diagnostics.
- CLI/API surface: none directly.

Allowed dependencies:

- May import: engine IR types, diagnostics, parser adapter outputs.
- May call: deterministic path/range helpers.
- May read configuration from: explicit normalization/source options.

Forbidden dependencies:

- Must not import: query helper internals, annotations, rules, profile/runtime/MCP/agent code.
- Must not call: parser libraries directly except inside assigned adapter plumbing.
- Must not know about: domain token or entity semantics.

State boundary:

- Owns state: invocation-local target/source maps.
- Reads state: parsed Markdown body, normalized IR, parser source ranges.
- Mutates state: invocation-local normalized document enrichment only.
- Persistence responsibility: none.

Agent ownership boundary:

- Agent editable paths: `src/ir/**` target/source files, `src/parser/**` and `src/frontmatter/**` only for source position propagation, target/source fixtures and snapshots.
- Agent read-only paths: public API files unless coordination is approved, rules/config modules, docs outside target/source contract sections.
- Required coordination before editing: target ID format, `EngineTarget`, `SourceRange`, source-slice result shape, parser adapter result type.

Validation command: `npm run test:rich-ir:targets`

Promotion blockers: Source offset gaps must be documented or diagnosed before `MS-2`.

### Package Boundary Card: PKG-3

Ladder level: 2

Mission: Derived structural views and query helpers.

Value / risk trace:

- Observable value enabled: Consumers can query sections, spans, tables, lists, links, and source-backed nodes without raw traversal.
- Risk retired: RISK-1 / RISK-3
- Validation evidence: VAL-3 / VAL-9 / EVD-3 / EVD-9
- Blocking unknowns: Final public query names until `MS-2`.

Owns:

- Files/directories: derived view modules under `src/ir/**`, query modules under `src/api/**`, view/query fixtures and snapshots.
- Concepts: heading section hierarchy, body membership, text span extraction, table row/cell coordinates, list depth/item index semantics, link views, query result ordering.
- Runtime responsibilities: derive views from engine-owned IR and expose deterministic query results.

Does not own:

- Explicitly excluded behavior: target ID format, parser AST exposure, annotation payload semantics, legacy compatibility policy.
- Responsibilities delegated elsewhere: targets/source to `PKG-2`, annotations to `PKG-4`, compatibility docs to `PKG-5`.

Public interface:

- Exported types: section, text span, table, table row, table cell, list, list item, link, query result types through `PKG-1`.
- Exported functions/classes/components: approved query helpers for sections, nodes, source slices, links, tables, lists, and text spans.
- Events/messages/contracts: deterministic query result objects.
- CLI/API surface: none directly.

Allowed dependencies:

- May import: public IR/target/source types from `PKG-2`, diagnostics where needed.
- May call: deterministic traversal and source helpers.
- May read configuration from: explicit query options only.

Forbidden dependencies:

- Must not import: parser adapters directly, SpecTrace/profile/runtime/MCP/agent modules, rule implementations except public document types.
- Must not call: downstream scanners, network services, LLM APIs, file system walkers.
- Must not know about: issue keys, profile IDs, entity registries, relationship types.

State boundary:

- Owns state: invocation-local derived view indexes.
- Reads state: normalized document and target/source metadata.
- Mutates state: invocation-local document/query result structures only.
- Persistence responsibility: none.

Agent ownership boundary:

- Agent editable paths: `src/ir/**` derived view files, `src/api/**` query files, derived-view fixtures/snapshots/tests.
- Agent read-only paths: parser/frontmatter modules, rules/config modules, annotation modules unless assigned.
- Required coordination before editing: shared IR fields, query result types, table/list index semantics, section membership semantics.

Validation command: `npm run test:rich-ir:queries`

Promotion blockers: Query helpers must be documented and downstream-exercised before release.

### Package Boundary Card: PKG-4

Ladder level: 2

Mission: Caller-owned annotation target validation and deterministic target diagnostics.

Value / risk trace:

- Observable value enabled: Downstream apps can attach findings or metadata to engine targets without engine semantic interpretation.
- Risk retired: RISK-1 / RISK-2
- Validation evidence: VAL-4 / VAL-7 / VAL-9 / EVD-4 / EVD-7 / EVD-9
- Blocking unknowns: None after target shape is approved in `MS-1`.

Owns:

- Files/directories: annotation API modules under `src/api/**` or `src/ir/**`, annotation diagnostics, annotation tests and fixtures.
- Concepts: annotation target validation, malformed target diagnostics, opaque annotation payload preservation, deterministic annotation serialization ordering.
- Runtime responsibilities: validate target shape and existence where document context is available.

Does not own:

- Explicitly excluded behavior: interpreting annotation `kind` or payload `data`, entity registries, semantic validation, profile rules.
- Responsibilities delegated elsewhere: target generation to `PKG-2`, serialization policy to `PKG-5`, public export naming to `PKG-1`.

Public interface:

- Exported types: annotation record, annotation target, annotation result, target diagnostic types through `PKG-1`.
- Exported functions/classes/components: annotation validation or attachment helper names approved by `MS-2`.
- Events/messages/contracts: annotation target diagnostics.
- CLI/API surface: none directly unless `PKG-5` exposes serialized annotations.

Allowed dependencies:

- May import: public document, target, source range, diagnostics, serializer-normalized value helpers.
- May call: target lookup and source range validation helpers.
- May read configuration from: explicit annotation options only.

Forbidden dependencies:

- Must not import: SpecTrace/profile/runtime/MCP/agent modules, entity registries, LLM SDKs, rules that infer semantic meaning.
- Must not call: semantic evaluators, network services, external registries.
- Must not know about: annotation payload meaning beyond JSON-safe structural validation if approved.

State boundary:

- Owns state: invocation-local annotation validation results.
- Reads state: document target index and caller-provided annotation records.
- Mutates state: cloned result objects only.
- Persistence responsibility: none.

Agent ownership boundary:

- Agent editable paths: annotation modules under `src/api/**` or `src/ir/**`, annotation diagnostics, annotation tests/fixtures.
- Agent read-only paths: target/source internals unless coordination is approved.
- Required coordination before editing: annotation record shape, target diagnostic schema, serialized annotation ordering.

Validation command: `npm run test:rich-ir:annotations && npm run audit:rich-ir-boundary`

Promotion blockers: Any payload semantic interpretation blocks promotion and requires design review.

### Package Boundary Card: PKG-5

Ladder level: 2

Mission: Serialization, CLI compatibility, migration, and release-facing contract surface.

Value / risk trace:

- Observable value enabled: Consumers and reviewers can compare deterministic 1.0 output and migrate intentionally from 0.1.x.
- Risk retired: RISK-4
- Validation evidence: VAL-5 / VAL-6 / VAL-8 / EVD-5 / EVD-6 / EVD-8
- Blocking unknowns: Whether CLI needs new explicit 1.0 or legacy options is resolved in `WP-5`.

Owns:

- Files/directories: `src/serialize/**`, affected `src/cli/**`, compatibility docs under `docs/contracts/**`, release notes.
- Concepts: deterministic JSON output, version mismatch diagnostics, legacy selector documentation, CLI output behavior, migration notes.
- Runtime responsibilities: serialize approved public result shapes without nondeterministic ordering.

Does not own:

- Explicitly excluded behavior: target generation, derived view construction, annotation semantics.
- Responsibilities delegated elsewhere: public exports to `PKG-1`, evidence harness to `PKG-6`.

Public interface:

- Exported types: serializer and compatibility option types through `PKG-1`.
- Exported functions/classes/components: serialize and compatibility helpers through `PKG-1`.
- Events/messages/contracts: serialized JSON contract and CLI output if changed.
- CLI/API surface: `markdown-engine` CLI behavior if changed.

Allowed dependencies:

- May import: public document/result types, diagnostics, annotation results, deterministic object sorting helpers.
- May call: package-local serializer helpers.
- May read configuration from: explicit serializer/CLI options only.

Forbidden dependencies:

- Must not import: parser adapters, domain packages, network clients, environment-specific behavior except CLI argument parsing.
- Must not call: nondeterministic timestamp generation for serialized contract output, network services, shell commands during library serialization.
- Must not know about: downstream semantic IDs or app-specific annotation payloads.

State boundary:

- Owns state: invocation-local serialization buffers.
- Reads state: public result objects.
- Mutates state: none outside returned strings or CLI output.
- Persistence responsibility: none.

Agent ownership boundary:

- Agent editable paths: `src/serialize/**`, affected `src/cli/**`, `docs/contracts/**`, release notes.
- Agent read-only paths: target/source/query/annotation implementation unless coordination is approved.
- Required coordination before editing: serialized field ordering, versioning, compatibility selector, CLI public output.

Validation command: `npm run test:rich-ir:compat && npm run test:rich-ir:repeatability`

Promotion blockers: 1.0 migration docs and version compatibility matrix must be reviewed before release.

### Package Boundary Card: PKG-6

Ladder level: 2

Mission: Fixture, validation evidence, boundary audit, downstream exercise, and release harness.

Value / risk trace:

- Observable value enabled: Reviewers can inspect evidence for every objective before merge and release.
- Risk retired: RISK-1 / RISK-2 / RISK-3 / RISK-4
- Validation evidence: VAL-1 through VAL-10 / EVD-1 through EVD-10
- Blocking unknowns: None; evidence command names may be finalized during `WP-1` and recorded by `WP-6`.

Owns:

- Files/directories: `tests/**`, `fixtures/**`, `snapshots/**`, `scripts/**`, `docs/evidence/**`, release verification script changes.
- Concepts: proving fixture, structural fixtures, annotation fixtures, legacy compatibility fixtures, repeatability runs, boundary audit, downstream exercise, evidence packet.
- Runtime responsibilities: none in package execution.

Does not own:

- Explicitly excluded behavior: production package logic.
- Responsibilities delegated elsewhere: implementation modules to `PKG-1` through `PKG-5`.

Public interface:

- Exported types: none.
- Exported functions/classes/components: none for package consumers.
- Events/messages/contracts: evidence artifacts and package scripts.
- CLI/API surface: validation scripts only.

Allowed dependencies:

- May import: package public API and test utilities.
- May call: local package scripts, test runner, boundary audit scripts.
- May read configuration from: fixtures and explicit test config.

Forbidden dependencies:

- Must not import: private internals when validating public contract behavior unless the test is explicitly a package-boundary unit test.
- Must not call: network services, nondeterministic external systems, downstream app code as a hidden dependency.
- Must not know about: SpecTrace internals beyond the static downstream-style fixture format approved by `VAL-9`.

State boundary:

- Owns state: snapshots and evidence artifacts.
- Reads state: fixtures, source code, contract docs.
- Mutates state: snapshots and `docs/evidence/**` only when intentionally approved.
- Persistence responsibility: repository evidence files and CI logs if CI is used.

Agent ownership boundary:

- Agent editable paths: `tests/**`, `fixtures/**`, `snapshots/**`, `scripts/**`, `docs/evidence/**`.
- Agent read-only paths: source modules unless a work package assigns them.
- Required coordination before editing: snapshot baselines, release verification commands, fixture coverage reductions.

Validation command: `npm run release:verify`

Promotion blockers: Human milestone approval remains required; automated evidence alone cannot approve `MS-*`.

Dependency direction rules:

- Allowed direction: `PKG-1` orchestrates `PKG-2` through `PKG-5`; `PKG-3` consumes public target/source helpers from `PKG-2`; `PKG-4` consumes target/source lookup and public document types; `PKG-5` consumes public result shapes; `PKG-6` consumes public APIs and assigned test helpers.
- Prohibited imports: parser/frontmatter adapters must not import annotations or query helpers; derived views must not import rules/config; annotations must not import SpecTrace/profile/runtime/MCP/agent code; production modules must not import `tests/**`, `fixtures/**`, `snapshots/**`, or `docs/evidence/**`.
- Allowed cross-boundary communication: typed function calls, public internal entry points, public result objects, diagnostic records.
- Disallowed cross-boundary communication: private deep imports, copied shared types, global mutable state, environment-variable side channels, domain-specific identifiers, and raw parser AST public exposure.

State boundary rules:

- Package-owned state: invocation-local values only.
- Package-read state: explicit Markdown text, options, config, annotations, and fixtures during tests.
- Package-mutated state: none in package runtime; snapshots/evidence only under `PKG-6`.
- Persistence ownership: no runtime persistence in `markdown-engine`.

Reusable package candidates:

| Candidate | Current level | Reuse rationale | Required decoupling | Promotion trigger |
| --- | --- | --- | --- | --- |
| Public `markdown-engine` package contract | 4 | The package is already a public reusable package and 1.0 will become the durable rich IR contract. | Complete 1.0 docs, compatibility matrix, release notes, milestone evidence, and downstream exercise approval. | `MS-3` approval and 1.0 release/tag decision. |
| Target/source substrate | 2 | Target identity and source slices may later be reusable within related Markdown tooling. | Remove package-specific assumptions, expose a project-agnostic API, and define standalone compatibility policy. | A second repository requests the target/source module without the rest of `markdown-engine`. |

Coupling tripwires:

- A package requires knowledge of another package's internal file layout.
- Two packages must usually change together for one feature.
- A reusable candidate imports app, route, UI, database, deployment, profile/runtime, MCP, agent, or product-specific runtime code.
- Business rules or semantic recognition live primarily in UI, CLI, scripts, query helpers, or integration glue.
- A utility package collects unrelated behavior without a single mission.
- Package validation requires a full downstream application when package-level validation should be possible.
- Types are shared by copying instead of declared public exports or internal contract modules.
- Separate agents must edit the same files to complete nominally separate work packages.

N/A rationale: Not applicable; code, contracts, schemas, packages, public APIs, and potential multi-agent implementation are all in scope.

Section status: Complete

## 8. Work Packages and Sequencing

Planning strategy: `STRATEGIES.RISK_RETIREMENT` through `WP-1`, then `STRATEGIES.PROGRESSIVE_VALUE` with contract-first controls for `WP-2` through `WP-6`.

Critical path hypothesis: A representative document can flow through 1.0 target/source enrichment, derived views, query helpers, annotation target validation, deterministic serialization, and legacy compatibility checks without domain semantics entering the engine.

First proving slice: `WP-1` implements the minimum representative 1.0 fixture path and produces `EVD-1`.

Validation cadence: Each work package must produce mapped `VAL-*` evidence before dependent packages proceed; `MS-1`, `MS-2`, and `MS-3` are human gates.

Deferred completeness: Final fixture breadth, migration docs polish, release notes, downstream integration examples, and 1.0 publication wait until `MS-1` and `MS-2` pass.

Required verification command registry: `WP-1` shall add or update package scripts for `npm run test:rich-ir:proving`, `npm run test:rich-ir:contract`, `npm run test:rich-ir:targets`, `npm run test:rich-ir:queries`, `npm run test:rich-ir:annotations`, `npm run test:rich-ir:compat`, `npm run test:rich-ir:repeatability`, `npm run test:rich-ir:downstream`, `npm run audit:rich-ir-boundary`, and `npm run docs:rich-ir-contract` before `MS-1`. These script names are execution-gate labels only and shall not be copied into public TypeScript API names or module names. Later work packages may change command internals but shall preserve the script names unless a `DEV-*` deviation and `REV-2` approval update this spec and the evidence plan.

| ID | Objective | Owner | Package boundary | Editable paths | Read-only paths | Inputs | Outputs | Dependencies | Observable value enabled | Risk retired | Milestone gate | Validation checkpoint | Completion criteria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WP-1 | Prove the 1.0 critical path on one representative fixture. | Implementer | PKG-1 / PKG-2 / PKG-3 / PKG-4 / PKG-5 / PKG-6 | `src/api/**`, `src/ir/**`, necessary `src/parser/**` or `src/frontmatter/**`, `src/serialize/**`, `package.json`, `tests/**`, `fixtures/**`, `snapshots/**` | `docs/design/**`, existing `docs/contracts/**`, `RUNTIME_ARCHITECTURE.md` | SRC-1, SRC-2, current 0.1.0 API, representative fixture | Minimal 1.0 document, target/source metadata, section/query result, one span/table/list view, valid annotation target, deterministic serialization, legacy compatibility assertion, required verification command registry, `EVD-1` | DEP-1 / DEP-2 | A reviewer can inspect one end-to-end rich IR result and decide whether the architecture is viable. | RISK-1 / RISK-2 / RISK-3 / RISK-4 | MS-1 | VAL-1 | `npm run test:rich-ir:proving` passes; required verification scripts exist; output demonstrates the critical path; legacy compatibility assertion passes; no domain semantics or public workstream-label API names appear. |
| WP-2 | Harden target identity, source ranges, and source slices. | Implementer | PKG-2 / PKG-6 | `src/ir/**`, necessary `src/parser/**`, necessary `src/frontmatter/**`, target/source tests, fixtures, snapshots | `src/api/**`, `src/rules/**`, `docs/contracts/**` | WP-1 target/source shape and parser offset evidence | Deterministic target generator, source-slice helper behavior, missing-offset diagnostics, target/source fixture evidence, `EVD-2` | WP-1 / MS-1 | Diagnostics, annotations, and reports can target source-grounded nodes deterministically. | RISK-2 / RISK-3 | MS-2 | VAL-2 / VAL-6 | `npm run test:rich-ir:targets` passes; missing source ranges are diagnosed or documented; repeat target generation is stable. |
| WP-3 | Implement derived structural views and query helpers. | Implementer | PKG-3 / PKG-6 | `src/ir/**`, `src/api/**` query modules, view/query tests, fixtures, snapshots | parser/frontmatter internals, annotation modules, rule/config modules | WP-2 target/source substrate and `SRC-1` requirements | Sections, text spans, tables, lists, links, query helper results, structural fixture evidence, `EVD-3` | WP-2 | Downstream apps can replace line scanners and raw traversal for common structural access. | RISK-1 / RISK-3 | MS-2 | VAL-3 | `npm run test:rich-ir:queries` passes with nested heading, text span, table, list, link, and documented zero-based coordinate fixtures. |
| WP-4 | Implement annotation target validation and rich diagnostics without semantic leakage. | Implementer | PKG-4 / PKG-6 | annotation modules under `src/api/**` or `src/ir/**`, `src/diagnostics/**`, relevant `src/rules/**` or `src/config/**` only if rich targets affect diagnostics, tests/fixtures | target/source internals unless coordination is approved, derived view internals unless coordination is approved | WP-2 targets, WP-3 queries, `SRC-1` annotation target model | Annotation target API, malformed target diagnostics, opaque payload preservation, boundary evidence, `EVD-4` | WP-2 / WP-3 | Downstream annotations can bind to engine targets while semantics remain app-owned. | RISK-1 / RISK-2 | MS-2 | VAL-4 / VAL-7 | `npm run test:rich-ir:annotations` passes; malformed targets produce deterministic diagnostics; payload meaning is not interpreted; `npm run audit:rich-ir-boundary` reports no annotation semantic leakage. |
| WP-5 | Finalize 1.0 compatibility, serialization, CLI impact, contract docs, and migration notes. | Implementer | PKG-1 / PKG-5 / PKG-6 | `src/api/**`, `src/serialize/**`, affected `src/cli/**`, `docs/contracts/**`, `README.md`, `CHANGELOG.md`, package metadata/scripts if needed, tests/snapshots | parser/frontmatter internals, derived view internals unless coordination is approved | WP-1 through WP-4 outputs and `SRC-2` current API contract | 1.0 default contract docs, explicit legacy gates, semver classification, deterministic serialization, migration notes, CLI decision, `EVD-5` / `EVD-8` | WP-2 / WP-3 / WP-4 | Consumers can migrate intentionally and reviewers can compare stable 1.0 output. | RISK-4 | MS-2 / MS-3 | VAL-5 / VAL-6 / VAL-8 | `npm run test:rich-ir:compat`, `npm run test:rich-ir:repeatability`, and `npm run docs:rich-ir-contract` pass; docs define fields, helpers, annotations, compatibility, and non-goals. |
| WP-6 | Complete boundary audit, downstream exercise, release containment, and handoff packet. | Implementer | PKG-6 / PKG-1 / PKG-5 | `tests/**`, `fixtures/**`, `snapshots/**`, `scripts/**`, `docs/evidence/**`, release notes, package scripts if needed | all source modules, design docs, contract docs | WP-1 through WP-5 evidence | Repeatability record, boundary audit, downstream SpecTrace-style exercise, release/rollback notes, handoff packet, `EVD-6` through `EVD-10` | WP-5 / MS-2 | Maintainers can approve merge and release readiness from evidence rather than intent. | RISK-1 / RISK-2 / RISK-3 / RISK-4 | MS-3 | VAL-6 / VAL-7 / VAL-9 / VAL-10 | `npm run test:rich-ir:repeatability`, `npm run audit:rich-ir-boundary`, `npm run test:rich-ir:downstream`, and `npm run release:verify` pass; release containment and handoff are recorded. |

Execution sequence:

1. Resolve `DEP-1` entry approval.
2. Execute `WP-1`; stop at `MS-1` if the critical path fails or scope leaks domain semantics.
3. Execute `WP-2` after `MS-1` to harden targets and source grounding.
4. Execute `WP-3` after `WP-2` to expand derived views and query helpers.
5. Execute `WP-4` after target and query surfaces are stable enough to validate annotations.
6. Execute `WP-5` after public 1.0 behavior exists and before merge approval.
7. Execute `WP-6` after `MS-2` evidence is complete and before release readiness.

Parallelization rules: No parallel source edits before `MS-1`. After `MS-1`, `WP-5` documentation drafting may proceed in parallel with `WP-2` or `WP-3` only if it does not edit source files and marks final names pending `MS-2`; source implementation work remains serialized unless the project owner approves disjoint editable paths and shared public interfaces are frozen.

Integration points: `MS-1` integrates the proving fixture and minimum public shape; `MS-2` integrates targets, source slices, derived views, queries, annotations, compatibility, serialization, docs, and tests before merge; `MS-3` integrates repeatability, boundary audit, downstream exercise, release containment, and handoff.

Coordination triggers: Any exported API/type change, target ID format change, source range semantic change, table/list coordinate change, annotation record shape change, serializer field ordering change, CLI output change, compatibility selector change, dependency addition, snapshot baseline update, shared editable path conflict, or domain-semantics request requires coordination before continuing.

Section status: Complete

## 9. Milestone Gates and Manual Verification

| ID | Gate objective | Covered work | Due point | Human verifier | Prerequisites | Review gate | Required evidence | Approval decision | Failure path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MS-1 | Approve the rich IR critical-path proof before broad implementation. | OBJ-1 / OBJ-2 / OBJ-3 / OBJ-4 / SURF-1 through SURF-4 / SURF-7 / PKG-1 through PKG-6 / WP-1 | Before WP-2, WP-3, WP-4, or WP-5 source implementation starts | Project owner or implementation reviewer | VAL-1 / EVD-1 | REV-1 / REV-2 | EVD-1 | Approve / Reject / Conditional approval | If rejected, stop execution and revise target identity, source-slice approach, annotation boundary, compatibility approach, or design scope before continuing. |
| MS-2 | Approve implementation completeness and public contract before merge. | OBJ-1 through OBJ-4 / SURF-1 through SURF-9 / PKG-1 through PKG-6 / WP-2 through WP-5 | Before merge | Project owner and implementation reviewer | VAL-2 through VAL-8 / EVD-2 through EVD-8 | REV-1 / REV-2 / REV-4 | EVD-2 / EVD-3 / EVD-4 / EVD-5 / EVD-6 / EVD-7 / EVD-8 | Approve / Reject / Conditional approval | If rejected, block merge and record required fixes, design revision, or approved deviations. |
| MS-3 | Approve release readiness, downstream exercise, rollback containment, and handoff. | OBJ-4 / OBJ-5 / NG-5 / SURF-8 / SURF-9 / WP-6 | Before 1.0 tag, package publication, or completion claim | Project owner with downstream consumer review | VAL-6 through VAL-10 / EVD-6 through EVD-10 | REV-1 / REV-3 / REV-4 | EVD-6 / EVD-7 / EVD-8 / EVD-9 / EVD-10 | Approve / Reject / Conditional approval | If rejected, withhold release/tag and continue compatibility, documentation, downstream exercise, or containment fixes. |

Manual verification guide:

| Step ID | Milestone | Operator action | Expected result | Evidence artifact |
| --- | --- | --- | --- | --- |
| MV-1 | MS-1 | Run `npm run test:rich-ir:proving` and inspect `docs/evidence/wp-1-evd-1-rich-ir-proving-slice.md`. | Command passes and output contains 1.0 document version, target IDs, source ranges/slices where available, section body membership, one text span, one table cell coordinate, one list item coordinate, query result, annotation target validation, deterministic serialization, and legacy compatibility assertion. | EVD-1 |
| MV-2 | MS-1 | Run `npm run typecheck && npm run test:rich-ir:contract`, then inspect the public exports and proving-slice serialized output referenced by `docs/evidence/wp-1-evd-1-rich-ir-proving-slice.md`. | Raw parser AST is not exposed, annotation payload semantics are opaque, no SpecTrace/profile/runtime/MCP identifiers appear, and no public `RichIr*` or `richIr` API labels appear without approved deviation. | EVD-1 |
| MV-3 | MS-2 | Run `npm run test:rich-ir:targets`, `npm run test:rich-ir:queries`, `npm run test:rich-ir:annotations`, `npm run test:rich-ir:compat`, `npm run test:rich-ir:repeatability`, `npm run audit:rich-ir-boundary`, `npm run build`, and `npm run typecheck`. | Commands pass and each `VAL-2` through `VAL-8` evidence artifact exists under `docs/evidence/`. | EVD-2 through EVD-8 |
| MV-4 | MS-2 | Run `npm run docs:rich-ir-contract`, then review `docs/contracts/**`, migration notes, and representative snapshots referenced by `docs/evidence/wp-5-evd-8-contract-review.md`. | 1.0 default behavior, legacy gates, field semantics, target limits, source-slice limits, query helpers, annotations, and non-goals are documented. | EVD-5 / EVD-8 |
| MV-5 | MS-3 | Run `npm run release:verify` and `npm run test:rich-ir:downstream`, then inspect `docs/evidence/wp-6-evd-9-downstream-exercise.md`. | Full validation passes, downstream exercise proves structural use without semantic leakage, and release containment notes are present. | EVD-6 / EVD-9 / EVD-10 |
| MV-6 | MS-3 | Inspect `docs/evidence/wp-6-evd-10-release-readiness.md`, including rollback, release/tag decision, and handoff links. | Release/tag can be withheld or reverted at source/package-contract level, and handoff links all produced evidence. | EVD-10 |

Section status: Complete

## 10. Execution Controls and Drift Management

| ID | Trigger | Required action | Owner | Evidence |
| --- | --- | --- | --- | --- |
| CTRL-1 | Implementation requires changing an approved design requirement, non-objective, compatibility rule, or target identity guarantee. | Stop the affected work package and request project-owner approval through `DEV-*` or design revision. | Implementer | DEV record or revised design/spec. |
| CTRL-2 | Domain-specific semantics, SpecTrace/profile/runtime/MCP/agent identifiers, LLM behavior, or network/persistent behavior enters core code or public IR. | Remove the behavior or stop for project-owner decision; merge is blocked until resolved. | Implementer | VAL-7 / REV-4 / EVD-7. |
| CTRL-3 | A target/source/query/annotation public interface change is needed after `MS-1`. | Coordinate with owners of dependent packages and update docs, tests, snapshots, and traceability before continuing. | Implementer | Updated EVD and `REV-2` approval. |
| CTRL-4 | 0.1.x compatibility behavior changes or becomes ambiguous. | Add explicit selector/namespace/docs/tests or escalate for compatibility decision. | Implementer | VAL-5 / VAL-8 / EVD-5 / EVD-8. |
| CTRL-5 | Parser offsets are missing, inconsistent, or dependency-version sensitive for a required construct. | Emit deterministic diagnostics or revise source-slice scope; do not guess source text. | Implementer | VAL-2 / EVD-2. |
| CTRL-6 | Snapshot, serialization, or repeatability output changes unexpectedly. | Treat as contract drift; investigate before updating baselines. | Implementer | VAL-6 / EVD-6. |
| CTRL-7 | Work expands beyond this spec's surfaces, touches new trust boundaries, or exceeds the estimated blast radius. | Re-run execution estimation and stop if the estimator requires planning or decomposition. | Implementer | Estimation output and updated execution decision. |

Deviation rules: Any approved departure from source authority, package boundaries, milestone requirements, compatibility policy, target semantics, or validation evidence shall be recorded as `DEV-*` with owner, approver, rationale, impact, and evidence before merge or release.

Pause or escalation conditions: Pause on `MS-*` rejection, unresolved blocking `DEP-*`, failed repeatability, source-offset failure without diagnostic fallback, forbidden dependency, semantic leakage, ambiguous compatibility behavior, public contract disagreement, or missing required evidence at a milestone due point.

Section status: Complete

## 11. Data, Schema, Config, and Contract Handling

| Change | Impact | Compatibility | Reversibility | Validation |
| --- | --- | --- | --- | --- |
| 1.0 `EngineDocument` shape | Adds public sections, spans, tables, lists, links, targets, and source references to the canonical 1.0 contract. | 1.0 root API uses the evolved document shape; any 0.1.x-compatible path is explicit and documented. | Reversible before 1.0 release; semver-controlled after release. | VAL-1 / VAL-3 / VAL-8 |
| `EngineTarget` and target ID semantics | Adds public anchors for diagnostics, annotations, query results, and reports. | Deterministic for identical input/options only; no arbitrary edit-stability promise. | Reversible before 1.0 release; semver-controlled after release. | VAL-2 / VAL-6 / VAL-8 |
| Source ranges and source slices | Exposes source-grounded text where parser offsets exist. | Missing offsets produce diagnostics or omitted slices, not guessed text. | Reversible before 1.0 release; semver-controlled after release. | VAL-2 / VAL-7 |
| Section, text span, table, list, and link views | Adds derived public structural views. | Coordinate and membership semantics are documented before release. | Reversible before 1.0 release; semver-controlled after release. | VAL-3 / VAL-8 |
| Query helper API | Adds public traversal helpers over 1.0 IR. | Helper names and result shapes are frozen by `MS-2` before merge and `MS-3` before release. | Reversible before 1.0 release; semver-controlled after release. | VAL-3 / VAL-8 |
| Annotation target contract | Adds caller-owned annotation target validation and deterministic diagnostics. | Payload semantics remain app-owned and opaque to the engine. | Reversible before 1.0 release; semver-controlled after release. | VAL-4 / VAL-7 / VAL-9 |
| Serialization output | Changes stable JSON evidence for 1.0 public result objects. | 1.0 serialization is canonical for 1.0 results; legacy output requires explicit mode if retained. | Reversible before 1.0 release; semver-controlled after release. | VAL-5 / VAL-6 |
| CLI output or options if affected | May expose 1.0 or legacy output controls for command-line consumers. | Any CLI change is documented and semver-classified. | Reversible before 1.0 release; semver-controlled after release. | VAL-5 / VAL-8 |
| Package version and release metadata | Moves package toward 1.0 release readiness. | Tag/publication blocked until `MS-3`. | Reversible before publication; published version changes require standard package release handling. | VAL-10 |

N/A rationale: No database schema, event stream, permission model, storage migration, or backfill is in scope because the package remains a local stateless library.

Section status: Complete

## Layer 3: Validation, Release, and Handoff

## 12. Validation and Evidence Plan

| ID | Method | Claim verified | Timing | Owner | Evidence artifact and storage location |
| --- | --- | --- | --- | --- | --- |
| VAL-1 | Test / Snapshot / Review | The first proving slice demonstrates target identity, source grounding, one section query, one span/table/list view, one annotation target, deterministic serialization, and legacy compatibility without semantic leakage. | Pre-merge before broad implementation | Implementer | EVD-1 at `docs/evidence/wp-1-evd-1-rich-ir-proving-slice.md` |
| VAL-2 | Test / Snapshot | Target IDs, node paths, source ranges, source slices, missing-offset diagnostics, and repeated target generation are deterministic and source-grounded across representative constructs. | Pre-merge | Implementer | EVD-2 at `docs/evidence/wp-2-evd-2-target-source-fixtures.md` |
| VAL-3 | Test / Snapshot | Sections, text spans, tables, lists, links, and query helpers return documented deterministic structures and zero-based table/list coordinates. | Pre-merge | Implementer | EVD-3 at `docs/evidence/wp-3-evd-3-derived-view-query-fixtures.md` |
| VAL-4 | Test / Boundary inspection | Annotation targets validate correctly, malformed targets emit deterministic diagnostics, and annotation payloads remain opaque. | Pre-merge | Implementer | EVD-4 at `docs/evidence/wp-4-evd-4-annotation-target-validation.md` |
| VAL-5 | Test / Review | 0.1.x-compatible behavior is available only through explicit documented compatibility gates where retained, and mismatched version/compatibility requests are rejected or diagnosed. | Pre-merge and pre-release | Implementer | EVD-5 at `docs/evidence/wp-5-evd-5-compatibility-gates.md` |
| VAL-6 | Measurement / Test | Ten repeated 1.0 runs produce byte-for-byte identical serialized output, target IDs, derived views, and annotation validation results for fixed input/options/runtime. | Pre-merge and pre-release | Implementer | EVD-6 at `docs/evidence/wp-5-evd-6-repeatability.md` |
| VAL-7 | Audit / Test | No forbidden domain, profile, runtime, MCP, agent, LLM, network, database, raw HTML execution, rendering, fetching, sanitization, or source-text trust behavior enters the engine. | Pre-merge and pre-release | Implementer / Boundary reviewer | EVD-7 at `docs/evidence/wp-6-evd-7-boundary-audit.md` |
| VAL-8 | Review | Contract docs cover fields, helpers, annotations, target stability limits, source-slice behavior, compatibility gates, migration notes, semver classification, and non-goals. | Pre-merge and pre-release | Project owner / Implementation reviewer | EVD-8 at `docs/evidence/wp-5-evd-8-contract-review.md` |
| VAL-9 | Downstream exercise | A SpecTrace-style fixture can use 1.0 sections, spans, source slices, query helpers, and annotations while keeping entity registry semantics outside the engine. | Pre-release | Downstream consumer / Implementer | EVD-9 at `docs/evidence/wp-6-evd-9-downstream-exercise.md` |
| VAL-10 | Build / Typecheck / Full test / Release verification | Package build, typecheck, tests, snapshots, boundary audit, repeatability, release verification, and clean-diff checks pass before release readiness. | Pre-release | Implementer | EVD-10 at `docs/evidence/wp-6-evd-10-release-readiness.md` |

Section status: Complete

## 13. Review Plan

| ID | Reviewer | Review scope | Blocking? | Completion evidence |
| --- | --- | --- | --- | --- |
| REV-1 | Project owner | Source authority, milestone decisions, public 1.0 contract, compatibility policy, release readiness, deviations, and final approval. | Yes | MS approval record and EVD review notes. |
| REV-2 | Implementation reviewer | Source changes across `SURF-1` through `SURF-9`, package boundaries, tests, snapshots, serialization, typecheck/build, and traceability to work packages. | Yes | Code review approval and validation evidence review. |
| REV-3 | Downstream SpecTrace/profile/runtime consumer | Query helpers, source slices, annotations, migration guidance, and downstream fixture usefulness without semantic leakage. | Yes for release | EVD-9 review approval or release blocker record. |
| REV-4 | Boundary/security reviewer | Domain-neutral boundary, inert raw HTML/source text, dependency audit, absence of network/persistence/LLM/MCP/agent/runtime behavior. | Yes | EVD-7 approval or blocker record. |

Approval conditions: Merge requires `MS-1` and `MS-2` approval, all pre-merge `VAL-*` evidence, no open blocking `Q-*`, no unresolved blocker/major review findings, and no unapproved deviations or waivers. Release or tag requires `MS-3`, `REV-3`, `VAL-9`, `VAL-10`, and release containment evidence.

Section status: Complete

## 14. Rollout, Migration, Rollback, and Recovery

| ID | Action | Timing | Owner | Abort trigger | Evidence |
| --- | --- | --- | --- | --- | --- |
| REL-1 | Implement 1.0 rich IR on an implementation branch with no package publication during coding. | During WP-1 through WP-6 | Implementer | Failed `MS-1` or forbidden dependency/semantic leakage | EVD-1 / EVD-7 |
| REL-2 | Merge implementation only after contract, compatibility, validation, and boundary evidence are approved. | Before merge | Project owner | Failed `MS-2`, missing evidence, unresolved blocker, ambiguous compatibility | EVD-2 through EVD-8 |
| REL-3 | Prepare 1.0 release/tag only after downstream exercise, repeatability, release verification, migration docs, and containment notes pass. | Before 1.0 release/tag/publication | Project owner | Failed `MS-3`, failed downstream exercise, failed release verification, or missing rollback notes | EVD-6 / EVD-8 / EVD-9 / EVD-10 |
| REL-4 | Withhold or publish package according to `MS-3` decision. | Release decision | Project owner | Any unresolved release blocker or unapproved deviation | MS-3 approval record |

Rollback or containment plan: Before 1.0 publication, rollback is source-level containment: withhold release, revert or supersede the implementation branch, and keep `0.1.0` as the latest stable contract. After publication, recovery follows package semver practice: publish a patch if compatible, deprecate or supersede the release if contract-breaking, and document migration/rollback guidance. No data migration rollback is required because the package owns no persistent user data.

Recovery limit: Recovery is limited to package source, package metadata, docs, tags, and published package versions. It cannot preserve consumers that adopted an unpublished or unapproved 1.0 contract outside the release gate.

Section status: Complete

## 15. Observability and Operational Readiness

| ID | Signal | Purpose | Consumer | Response |
| --- | --- | --- | --- | --- |
| OBS-1 | Target/source fixture test output | Detect target identity, source slice, and offset failures. | Implementer and reviewer | Block merge until fixed, diagnosed, or explicitly descoped. |
| OBS-2 | Derived-view/query snapshots | Detect section, span, table, list, link, and query contract drift. | Contract reviewer | Approve intentional change or reject drift. |
| OBS-3 | Annotation diagnostic test output | Detect target validation errors or semantic leakage. | Boundary reviewer | Block merge until annotation payload remains opaque. |
| OBS-4 | Repeatability run output | Detect nondeterministic target, derived view, annotation, or serialization behavior. | Project owner and implementation reviewer | Block merge/release until stable. |
| OBS-5 | Boundary audit output | Detect forbidden dependencies or inert-data violations. | Boundary/security reviewer | Block merge/release until removed or escalated. |
| OBS-6 | Downstream SpecTrace-style exercise output | Detect whether the 1.0 contract actually supports the motivating structural use case. | Downstream consumer and project owner | Block release until addressed or formally deviated. |
| OBS-7 | Release verification command output | Detect build/typecheck/test/release readiness failures. | Maintainer | Block release/tag until fixed. |

Operator actions: Maintainers run validation commands, inspect snapshots and evidence artifacts, approve or reject milestone gates, classify public contract changes, review migration notes, and withhold release if any gate fails.

Monitoring window: From implementation branch start through the first 1.0 release decision and the first downstream consumer review. No live service monitoring window is required.

N/A rationale: No production service, database, dashboard, alert, or on-call runbook is required because `markdown-engine` remains a local library.

Section status: Complete

## 16. Risks, Questions, Deviations, and Waivers

Risks:

| ID | Risk | Impact | Likelihood | Owner | Mitigation | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| RISK-1 | Rich IR absorbs SpecTrace, profile, runtime, MCP, agent, or semantic behavior. | Engine boundary fails and 1.0 becomes coupled to downstream apps. | Medium | Implementer | Non-objectives, forbidden dependency controls, opaque annotations, downstream exercise boundary checks. | VAL-4 / VAL-7 / VAL-9 |
| RISK-2 | Node target identity is unstable or overpromised. | Diagnostics, annotations, reports, and docs may rely on anchors the engine cannot guarantee. | Medium | Implementer | Document identical-input limits, snapshot targets, repeat ten runs, diagnose unsupported cases. | VAL-2 / VAL-6 / VAL-8 |
| RISK-3 | Parser source offsets do not cover required source slices. | Source-grounded views become incomplete or wrong. | Medium | Implementer | Prove representative constructs early, emit diagnostics for unavailable offsets, avoid guessed slices. | VAL-1 / VAL-2 / VAL-3 |
| RISK-4 | Compatibility between 1.0 and 0.1.x remains ambiguous. | Consumers may break silently or depend on the wrong contract. | Medium | Project owner | Explicit legacy gates, version mismatch diagnostics, migration docs, semver review. | VAL-5 / VAL-8 |
| RISK-5 | Query helper scope becomes a broad parser abstraction. | Maintenance cost and public surface grow beyond the approved design. | Medium | Implementer | Derive helpers only from public IR and require `MS-2` approval for names/result shapes. | VAL-3 / VAL-8 |

Open questions:

None. Rationale: final public names, exact CLI impact, and source-slice gaps are implementation decisions bounded by `MS-1`, `MS-2`, and `MS-3`, not blockers to starting execution after `DEP-1` approval.

Approved deviations:

None. Rationale: no deviations from this plan are approved at draft time.

Approved waivers:

None. Rationale: no review, milestone, validation, or compatibility requirements are waived.

Section status: Complete

## 17. Execution Traceability Matrix

| Source, objective, or evidence-led claim | Change surfaces | Package boundaries | Work packages | Milestones | Controls | Validation | Review | Release or ops | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRC-1 / OBJ-1 / Rich IR contract | SURF-1 / SURF-2 / SURF-4 / SURF-7 / SURF-8 | PKG-1 / PKG-2 / PKG-3 / PKG-5 / PKG-6 | WP-1 / WP-2 / WP-3 / WP-5 | MS-1 / MS-2 | CTRL-1 / CTRL-3 / CTRL-6 | VAL-1 / VAL-2 / VAL-3 / VAL-6 / VAL-8 | REV-1 / REV-2 | REL-1 / REL-2 / OBS-1 / OBS-2 / OBS-4 | EVD-1 / EVD-2 / EVD-3 / EVD-6 / EVD-8 |
| SRC-1 / OBJ-2 / Query helpers | SURF-1 / SURF-2 / SURF-7 / SURF-8 | PKG-1 / PKG-3 / PKG-6 | WP-1 / WP-3 / WP-5 | MS-1 / MS-2 | CTRL-3 | VAL-1 / VAL-3 / VAL-8 | REV-2 / REV-3 | REL-2 / OBS-2 / OBS-6 | EVD-1 / EVD-3 / EVD-8 / EVD-9 |
| SRC-1 / OBJ-3 / Annotation target boundary | SURF-1 / SURF-2 / SURF-4 / SURF-7 | PKG-1 / PKG-2 / PKG-4 / PKG-6 | WP-1 / WP-4 | MS-1 / MS-2 | CTRL-2 / CTRL-3 | VAL-1 / VAL-4 / VAL-7 | REV-2 / REV-4 | REL-2 / OBS-3 / OBS-5 | EVD-1 / EVD-4 / EVD-7 |
| SRC-2 / OBJ-4 / Compatibility | SURF-1 / SURF-4 / SURF-6 / SURF-8 / SURF-9 | PKG-1 / PKG-5 / PKG-6 | WP-1 / WP-5 / WP-6 | MS-1 / MS-2 / MS-3 | CTRL-4 / CTRL-6 | VAL-1 / VAL-5 / VAL-6 / VAL-8 / VAL-10 | REV-1 / REV-2 | REL-2 / REL-3 / OBS-4 / OBS-7 | EVD-1 / EVD-5 / EVD-6 / EVD-8 / EVD-10 |
| SRC-1 / OBJ-5 / Downstream exercise | SURF-7 / SURF-8 | PKG-3 / PKG-4 / PKG-6 | WP-6 | MS-3 | CTRL-2 / CTRL-3 | VAL-9 | REV-3 / REV-4 | REL-3 / OBS-6 | EVD-9 |
| SRC-3 / Boundary preservation | SURF-1 through SURF-9 | PKG-1 through PKG-6 | WP-1 / WP-4 / WP-6 | MS-1 / MS-2 / MS-3 | CTRL-2 / CTRL-7 | VAL-4 / VAL-7 / VAL-9 | REV-4 | REL-1 / REL-2 / REL-3 / OBS-5 | EVD-4 / EVD-7 / EVD-9 |
| SRC-4 / Execution planning request | docs/execution | N/A | WP-6 | MS-3 | CTRL-1 | VAL-8 / VAL-10 | REV-1 | REL-3 | EVD-8 / EVD-10 |
| First proving slice | SURF-1 / SURF-2 / SURF-3 / SURF-4 / SURF-7 | PKG-1 through PKG-6 | WP-1 | MS-1 | CTRL-1 / CTRL-2 / CTRL-3 / CTRL-4 / CTRL-5 | VAL-1 | REV-1 / REV-2 | REL-1 / OBS-1 / OBS-2 / OBS-3 | EVD-1 |
| RISK-1 / semantic leakage | SURF-1 / SURF-2 / SURF-5 / SURF-7 / SURF-8 | PKG-1 / PKG-3 / PKG-4 / PKG-6 | WP-1 / WP-4 / WP-6 | MS-1 / MS-2 / MS-3 | CTRL-2 | VAL-4 / VAL-7 / VAL-9 | REV-4 / REV-3 | REL-1 / REL-2 / REL-3 / OBS-5 / OBS-6 | EVD-4 / EVD-7 / EVD-9 |
| RISK-2 / target identity | SURF-2 / SURF-4 / SURF-7 / SURF-8 | PKG-2 / PKG-4 / PKG-5 / PKG-6 | WP-1 / WP-2 / WP-4 / WP-5 | MS-1 / MS-2 | CTRL-3 / CTRL-6 | VAL-1 / VAL-2 / VAL-4 / VAL-6 / VAL-8 | REV-2 | OBS-1 / OBS-3 / OBS-4 | EVD-1 / EVD-2 / EVD-4 / EVD-6 / EVD-8 |
| RISK-3 / source offsets | SURF-2 / SURF-3 / SURF-7 | PKG-2 / PKG-3 / PKG-6 | WP-1 / WP-2 / WP-3 | MS-1 / MS-2 | CTRL-5 | VAL-1 / VAL-2 / VAL-3 | REV-2 | OBS-1 / OBS-2 | EVD-1 / EVD-2 / EVD-3 |
| RISK-4 / compatibility ambiguity | SURF-1 / SURF-4 / SURF-6 / SURF-8 / SURF-9 | PKG-1 / PKG-5 / PKG-6 | WP-1 / WP-5 / WP-6 | MS-1 / MS-2 / MS-3 | CTRL-4 / CTRL-6 | VAL-1 / VAL-5 / VAL-6 / VAL-8 / VAL-10 | REV-1 / REV-2 | REL-2 / REL-3 / OBS-4 / OBS-7 | EVD-1 / EVD-5 / EVD-6 / EVD-8 / EVD-10 |

Section status: Complete

## 18. Final Execution Gate

Entry gate: Satisfied on 2026-05-02 by project-owner approval recorded in Linear `BEL-932`. `DEP-1` no longer blocks implementation start; execution may proceed to `WP-1` under the Linear 1.0 Rich IR sequence.

Milestone approval gate: `MS-1`, `MS-2`, and `MS-3` are fully specified with verifier, due point, prerequisites, review gate, required evidence, approval decision, failure path, and manual verification guide. `MS-1` approval is required before broad source implementation; `MS-2` approval is required before merge; `MS-3` approval is required before release, tag, publication, or completion claim.

Completion gate: Completion requires all `WP-*` items complete, all pre-merge `VAL-*` evidence present, `MS-1` and `MS-2` approved, blocking reviews resolved, no open blocking `Q-*`, no unapproved `DEV-*`, and no unapproved `WVR-*`.

Release gate: Release, tag, or package publication requires `MS-3` approval, `VAL-6` through `VAL-10` evidence, downstream consumer review, release containment notes, semver classification, and a clean release verification result.

Handoff record: Handoff shall include links to `EVD-1` through `EVD-10`, final public API and migration docs, package command results, downstream exercise notes, boundary audit, release/rollback decision, unresolved non-blocking follow-ups, and any approved deviations or waivers.

Final readiness state: Ready for implementation start, not release-ready. Rationale: `DEP-1` entry approval is recorded, so `WP-1` may begin; release, tag, publication, and completion claims remain blocked until `MS-3` approval.

Section status: Complete
