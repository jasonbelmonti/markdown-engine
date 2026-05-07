# Markdown Engine Declarative Validation Syntax Execution Specification

## Document Control

| Field | Value |
| --- | --- |
| Title | Markdown Engine Declarative Validation Syntax Implementation |
| Status | Draft |
| Execution level | `E2` |
| Execution level justification | The work introduces durable author-facing validation syntax, public API and CLI behavior, validation result shape, diagnostic codes, evidence hashes, contract documentation, and release controls. It does not qualify for `E1` because another implementer or agent must be able to execute public contract and package changes from this artifact. It does not trigger `E3` because execution remains local and stateless, with no authentication, authorization, secret handling, live customer data, irreversible storage, safety control, financial control, network service, or constrained rollback. |
| Author(s) | Codex |
| Executor(s) | Markdown-engine implementer or assigned coding agents |
| Reviewers | Project owner, implementation reviewer, downstream profile/runtime consumer, boundary/security reviewer, CI/docs quality-gate reviewer |
| Decision owner | Project owner |
| Target branch, release, or milestone | Declarative validation syntax implementation branch after design and execution-spec approval |
| Last updated | 2026-05-07 |
| Related source docs | `docs/design/markdown-engine-declarative-validation-syntax-operational-design-spec.md`; `docs/contracts/api.md`; `docs/execution/markdown-engine-1.0-rich-ir-execution-spec.md`; `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md`; `RUNTIME_ARCHITECTURE.md` |
| Related tickets | none |

## 0. Execution Summary

Decision requested: Approve to execute

Approved outcome: Execute the declarative validation syntax implementation requested by `SRC-1`, bounded by `SRC-2` through `SRC-5`, so `markdown-engine` can parse closed validation profiles, compile them into engine-owned data-only rule plans, evaluate deterministic structural assertions over the 1.0 rich `EngineDocument`, and expose stable source-targeted diagnostics through public API and CLI contracts.

Execution approach: Use risk retirement through `WP-1` to prove the smallest parse-compile-evaluate-diagnose-serialize path, then use progressive value across `WP-2` through `WP-6` to harden profile schema closure, selector/assertion semantics, source-targeted diagnostics, API/CLI/evidence contracts, boundary audits, downstream operational-design-spec exercise, and release containment.

Entry condition: Execution shall not start until the project owner approves `SRC-1` and this execution specification; until that approval is recorded, implementation work is blocked at `DEP-1`.

Top risks or unknowns:

- RISK-1: Declarative validation syntax could drift into a scripting, plugin, regex, or semantic-evaluation language.
- RISK-2: The first selector/assertion vocabulary could be too narrow to prove operational-design-spec profile value.
- RISK-4: Syntax versioning, document versioning, public result shape, diagnostic precedence, evidence hashes, and CLI behavior could remain ambiguous without contract-first review.

Section status: Complete

## Layer 1: Execution Basis

## 1. Source Authority and Scope

| ID | Source | Authority | Execution implication |
| --- | --- | --- | --- |
| SRC-1 | `docs/design/markdown-engine-declarative-validation-syntax-operational-design-spec.md` | Draft R2 operational design requesting implementation approval for declarative validation syntax. | Execute only the closed YAML-compatible syntax, parser, compiler, selector, assertion, diagnostics, API, CLI, evidence, documentation, and validation behavior described in the design after project-owner approval. |
| SRC-2 | `docs/contracts/api.md` | Current public package contract for `0.1.0` plus the 1.0 draft rich IR contract notes. | Preserve package-root API discipline, 1.0 draft document-version behavior, deterministic serialization rules, diagnostic conventions, and compatibility constraints. |
| SRC-3 | `docs/execution/markdown-engine-1.0-rich-ir-execution-spec.md` | Current execution authority for the 1.0 rich IR substrate that declarative validation depends on. | Treat sections, tables, text spans, lists, links, source slices, annotation targets, document queries, and repeatability evidence as prerequisites and read-only source authority unless this plan explicitly assigns coordinated edits. |
| SRC-4 | `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md` | Design authority for the rich IR data model and engine boundary. | Build declarative validation over public `EngineDocument` data and query helpers without raw parser AST exposure or domain semantics. |
| SRC-5 | `RUNTIME_ARCHITECTURE.md` | Package decomposition and deterministic/semantic boundary authority. | Keep `markdown-engine` limited to deterministic local parsing, normalization, validation, diagnostics, and serialization; exclude `markdown-profile`, runtime lenses, MCP, agent adapters, and semantic evaluation. |
| SRC-6 | User request on 2026-05-07 to generate this execution spec from `SRC-1`. | Execution planning request. | Produce an implementation-ready execution artifact before coding begins. |

In scope: Validation profile parser, JSON-safe object input support, closed profile schema validation, syntax-version and document-version handling, rule ID uniqueness, severity/default handling, unsupported-key diagnostics, regex-like key rejection, internal compiled rule-plan records, selector resolution over public 1.0 `EngineDocument` fields and `documentQueries`, selector/assertion compatibility checks, required section/order/table/ID/reference/text/frontmatter assertions, deterministic source-targeted diagnostics, evidence hashes, repeatability proof, public API exports, CLI `validate --file --profile --format json` behavior, contract documentation, fixtures, snapshots, boundary audit, downstream operational-design-spec fixture exercise, release containment, and handoff evidence.

Out of scope: Operational-design-spec semantics in core engine code, AGENTS.md/TASK.md/profile-specific rule semantics, arbitrary JavaScript predicates, expression evaluation, user-supplied regular expression compilation, plugin loading, profile package implementation, runtime lens generation, MCP transport, agent adapters, LLM or semantic review, network calls, file watching, persistence, browser UI, database storage, and any new promise that node targets survive arbitrary author edits.

Definition of done: The implementation branch contains the approved declarative validation contract, tests, fixtures, docs, evidence, and release controls; a caller can parse a v1 profile, validate a normalized 1.0 draft `EngineDocument`, receive deterministic diagnostics and evidence through API and CLI paths, and run an operational-design-spec fixture without custom TypeScript profile code or engine-owned profile semantics; milestone approvals and release containment evidence are recorded.

Re-decision boundaries: Changing the v1 syntax vocabulary, allowing executable or regex-like declarations, exporting compiled rule plans, adding profile-specific semantics to core, changing CLI command names/defaults from `SRC-1`, changing public API function names/result shapes beyond `SRC-1`, weakening diagnostic precedence, dropping document-version mismatch behavior, changing evidence hash inputs, or releasing without `MS-3` approval requires project-owner review and an approved `DEV-*` record before execution continues.

Section status: Complete

## 2. Objectives and Non-Objectives

| ID | Statement | Completion horizon | Evidence |
| --- | --- | --- | --- |
| OBJ-1 | Deliver a closed declarative validation profile syntax that parses YAML text or JSON-safe object values into an engine-owned `ValidationProfile` model. | Before merge | EVD-1 / EVD-2 |
| OBJ-2 | Deliver deterministic compilation and evaluation over public 1.0 `EngineDocument` structures for the approved selector and assertion vocabulary. | Before merge | EVD-1 / EVD-3 / EVD-4 |
| OBJ-3 | Deliver source-targeted diagnostics, deterministic result ordering, and repeatable evidence hashes suitable for CI, review automation, and coding agents. | Before merge and release readiness | EVD-5 / EVD-6 |
| OBJ-4 | Deliver public API, CLI, diagnostic-code, and contract documentation that make compatibility and migration behavior explicit before release. | Before release or package tag | EVD-7 / EVD-10 |
| OBJ-5 | Prove the generic syntax can validate an operational-design-spec structural fixture without hard-coded operational-design-spec behavior in `markdown-engine`. | Before release readiness | EVD-8 / EVD-9 |
| OBJ-6 | Preserve the deterministic local engine boundary and reject scripts, plugins, network behavior, LLM calls, user-supplied regular expressions, and profile-specific core semantics. | Throughout execution | EVD-2 / EVD-8 |
| NG-1 | This execution will not implement operational-design-spec, AGENTS.md, TASK.md, or any downstream profile semantics in core engine code. | Boundary review | EVD-8 / EVD-9 |
| NG-2 | This execution will not introduce arbitrary JavaScript, expression evaluation, user-supplied regular expressions, plugins, network calls, file watching, persistence, or LLM-backed checks. | Boundary review | EVD-2 / EVD-8 |
| NG-3 | This execution will not replace existing fixed validation rule families or remove the current typed API. | Compatibility review | EVD-7 / EVD-10 |
| NG-4 | This execution will not publish, tag, or claim release completion until `MS-3` approves downstream exercise, repeatability, boundary, rollback, and handoff evidence. | Release gate | EVD-9 / EVD-10 |

Section status: Complete

## 3. Ownership, Roles, and Decision Points

| Role or person | Responsibility | Required action |
| --- | --- | --- |
| Project owner | Approves design authority, entry, milestone gates, public syntax/API/CLI compatibility decisions, deviations, release readiness, and final execution outcome. | Approve |
| Markdown-engine implementer | Executes work packages, maintains package boundaries, records evidence, and escalates blockers or deviations. | Execute |
| Implementation reviewer | Reviews source changes, tests, fixtures, snapshots, diagnostics, public contracts, package boundaries, and traceability. | Review |
| Downstream profile/runtime consumer | Reviews whether the syntax supports downstream profile compilation and operational-design-spec structural checks without core semantic leakage. | Review |
| Boundary/security reviewer | Confirms validation profiles remain inert data and execution excludes scripts, regex compilation, plugins, network calls, LLM behavior, persistence, and profile-specific semantics. | Review |
| CI/docs quality-gate user | Confirms CLI output, exit codes, and JSON result shape are usable in automated validation jobs. | Inform |

Decision points:

- DP-1: Entry approval before any implementation work starts.
- DP-2: `MS-1` critical-path proof approval before full parser/schema/assertion implementation proceeds.
- DP-3: `MS-2` implementation and public contract approval before merge.
- DP-4: `MS-3` release readiness approval before tag, package publication, or completion claim.

Escalation path: Any blocking dependency, incompatible rich IR substrate behavior, unsupported syntax pressure, public contract disagreement, diagnostic precedence ambiguity, forbidden dependency, repeatability failure, CLI contract drift, or downstream exercise failure stops the affected work package and escalates to the project owner with a `DEV-*` proposal, design revision, or explicit rejection path.

Section status: Complete

## 4. Constraints, Assumptions, and Dependencies

| ID | Type | Statement | Owner | Blocking? | Validation or resolution plan |
| --- | --- | --- | --- | --- | --- |
| CON-1 | Constraint | Declarative validation shall remain a closed deterministic vocabulary over public `EngineDocument` data and approved query helpers. | Implementer | No | Validate with schema closure tests, selector/assertion compatibility tests, and `VAL-8` boundary audit. |
| CON-2 | Constraint | Validation profiles shall be treated as inert local data and shall not execute scripts, expressions, plugins, imports, network calls, LLM calls, file watchers, persistence, or user-supplied regular expressions. | Implementer | No | Prove with unsupported-key fixtures, regex-like key rejection, source inspection, and `VAL-8`. |
| CON-3 | Constraint | Profile-specific concepts shall remain downstream-owned and shall not enter core assertion semantics, diagnostic codes, or selector behavior. | Implementer | No | Prove with boundary audit and the operational-design-spec exercise in `VAL-9`. |
| CON-4 | Invariant | Public diagnostics shall use existing `MarkdownDiagnostic` severity and source-range conventions where possible and shall never fabricate source ranges. | Implementer | No | Validate source-targeted diagnostics and unavailable-range behavior in `VAL-5`. |
| CON-5 | Constraint | Public syntax, API, result, diagnostic-code, evidence, and CLI changes require semver classification before release. | Project owner | No | Verify contract documentation and release notes in `VAL-7` and `MS-3`. |
| ASM-1 | Assumption | The current 1.0 draft rich IR exposes enough sections, tables, text spans, links, lists, frontmatter, targets, and source ranges for first-version declarative validation. | Implementer | No | Retire through `WP-1`, `WP-3`, `WP-4`, and `VAL-9`; if false, stop for design revision. |
| ASM-2 | Assumption | The existing `yaml` dependency and JSON-safe frontmatter helpers are sufficient for v1 profile parsing without introducing a new parser dependency. | Implementer | No | Confirm in `WP-2`; dependency additions require `CTRL-7`. |
| ASM-3 | Assumption | Existing package scripts can be extended with scoped declarative-validation checks without new CI infrastructure. | Implementer | No | Confirm command registry in `WP-1` and release verification in `WP-6`. |
| DEP-1 | Dependency | Project-owner approval of `SRC-1` and this execution spec is required before implementation starts. | Project owner | Yes | Record approval before `WP-1`; until resolved, section 18 remains `Not ready`. |
| DEP-2 | Dependency | 1.0 rich IR public contract and query helpers must be available on the implementation branch before full selector/assertion work begins. | Implementer | No for `WP-1` and `WP-2`; Yes before `WP-3` through `WP-6` | Verify substrate through `SRC-3`, `docs/contracts/api.md`, and `npm run test:rich-ir:contract`; record resolution before `WP-3` starts and include the verification result in `EVD-3` before `MS-2` approval. |

Section status: Complete

## Layer 2: Execution Plan

## 5. Evidence-Led Execution Model

Observable outcome: A consumer can provide a v1 validation profile and a normalized 1.0 draft `EngineDocument`, run declarative validation through API or CLI, and receive deterministic rule results, source-targeted diagnostics, and optional evidence hashes without writing TypeScript validators or invoking any executable profile behavior.

Core value proposition: Downstream profile packages and CI jobs can reuse the engine's rich IR, source targeting, diagnostics, and serialization instead of duplicating section traversal, table extraction, ID scanning, traceability checks, and line-based error reporting.

Critical path hypothesis: If one operational-design-spec-style fixture can flow through profile parsing, closed schema validation, rule compilation, selector resolution, assertion evaluation, source diagnostic targeting, deterministic serialization, and boundary audit without profile-specific engine semantics, then the rest of the implementation can expand vocabulary coverage and CLI/API contracts without reopening the design.

First proving slice: `WP-1` implements the narrowest end-to-end API path for one valid profile and one representative Markdown fixture using required sections, one table-column assertion, one ID uniqueness assertion, one failing diagnostic with a source target, and deterministic serialized output. The slice also adds the command registry needed for later validation evidence.

Sequencing principle: Retire execution-boundary, compatibility, and source-targeting risks before routine vocabulary expansion. After `MS-1`, proceed through profile schema closure, selector/compiler compatibility, assertion diagnostics, API/CLI/evidence contract hardening, downstream exercise, and release containment.

Validation cadence: Each `WP-*` produces mapped `VAL-*` evidence before dependent work proceeds. `MS-1` is due before broad implementation, `MS-2` before merge, and `MS-3` before release, tag, publication, or completion claim.

Deferred completeness: Exhaustive Markdown construct breadth, optional future selectors, non-JSON output formats, downstream package implementation, generated API docs polish, and release publication are deferred until the proving slice, contract review, and downstream exercise succeed.

Primary risks and unknowns:

| ID | Risk or unknown | Why it matters | Owner | Evidence required to retire | Decision gate |
| --- | --- | --- | --- | --- | --- |
| RISK-1 | Declarative syntax may drift into scripting, plugins, regex, or semantic evaluation. | Boundary drift would create a new execution/trust surface and invalidate the deterministic engine contract. | Implementer | VAL-2 / VAL-8 / EVD-2 / EVD-8 | MS-1 / MS-2 |
| RISK-2 | First-version selector/assertion vocabulary may be too narrow for real profile needs. | A syntax that cannot validate the motivating structural profile would add durable contract cost without value. | Downstream consumer / Implementer | VAL-4 / VAL-9 / EVD-4 / EVD-9 | MS-3 |
| RISK-3 | Diagnostics may be less source-specific than users expect. | CI users and coding agents need actionable locations, but missing or cross-section failures cannot always point to exact text. | Implementer | VAL-5 / EVD-5 | MS-2 |
| RISK-4 | Syntax versioning, document versioning, result shape, diagnostic precedence, evidence hashes, or CLI behavior may be ambiguous. | Ambiguity in public contract fields can break consumers and make review evidence non-repeatable. | Project owner / Implementer | VAL-6 / VAL-7 / VAL-10 / EVD-6 / EVD-7 / EVD-10 | MS-2 / MS-3 |
| RISK-5 | Core engine may absorb operational-design-spec or other profile-specific vocabulary during fixtures and examples. | Domain leakage would couple `markdown-engine` to one profile and block reuse by `markdown-profile`. | Implementer | VAL-8 / VAL-9 / EVD-8 / EVD-9 | MS-2 / MS-3 |
| RISK-6 | Regex-like matching could re-enter v1 and create denial-of-service risk. | User-supplied regular expressions can catastrophically backtrack against long spans or table cells. | Boundary reviewer / Implementer | VAL-2 / VAL-8 / EVD-2 / EVD-8 | MS-2 |

Section status: Complete

## 6. Change Surface Inventory

| ID | Surface | Change type | Owner | Read/write boundary | Review expectation |
| --- | --- | --- | --- | --- | --- |
| SURF-1 | `src/index.ts`, `src/api/**`, package-root exports | Code / Contract | Implementer | Writable by `WP-1` and `WP-5` for approved public API functions, types, result shapes, and export wiring. | Public API and compatibility review in `REV-1` / `REV-2`. |
| SURF-2 | New declarative validation modules under `src/declarative-validation/**` or approved equivalent focused submodules | Code / Schema | Implementer | Writable by `WP-1` through `WP-5`; subdirectories shall remain split by profile parsing, compiler/selectors, assertions, diagnostics, and evidence responsibilities. | Module-boundary and implementation review in `REV-2`. |
| SURF-3 | `src/config/**`, `src/rules/**`, `src/diagnostics/**`, `src/internal/**` | Code / Config / Diagnostics | Implementer | Writable only when shared config, diagnostic, JSON-safe, or deterministic helper reuse is necessary; no profile-specific semantics may enter existing fixed rule families. | Boundary and regression review in `REV-2` / `REV-4`. |
| SURF-4 | `src/ir/**`, `src/api/document-queries.ts`, rich IR types | Code / Contract | Implementer | Read-only by default; writable only through coordinated `DEV-*` if selector implementation exposes a substrate gap that cannot be solved through public query helpers. | Rich IR contract review in `REV-2` and project-owner approval for deviations. |
| SURF-5 | `src/cli/**` | Code / CLI Contract | Implementer | Writable by `WP-5` for `markdown-engine validate --file <markdown-file> --profile <profile-file> [--format json]`; parse/normalize CLI path must remain available. | CLI behavior and exit-code review in `REV-2` / `REV-5`. |
| SURF-6 | `src/serialize/**` and serializer helpers | Code / Data | Implementer | Writable by `WP-5` only if deterministic serialization or evidence hash canonicalization requires shared helper changes. | Repeatability and snapshot review in `REV-2`. |
| SURF-7 | `tests/**`, `fixtures/**`, `snapshots/**`, `scripts/**`, `package.json` scripts | Test / Evidence / Config | Implementer | Writable by all work packages for scoped tests, fixtures, command registry, repeatability proof, boundary audit, and release verification. | Validation evidence review in `REV-2`. |
| SURF-8 | `docs/contracts/**`, `README.md`, `CHANGELOG.md`, `SECURITY.md`, `docs/evidence/**` | Docs / Contract / Evidence | Implementer | Writable by `WP-5` and `WP-6` for syntax contract, CLI docs, migration notes, semver classification, evidence, rollback, and handoff. | Contract and release review in `REV-1` / `REV-3` / `REV-4`. |
| SURF-9 | `package.json`, lockfile, TypeScript config, release scripts | Config / Release | Implementer | Writable only for required command registry, dependency, build, typecheck, or release verification updates. | Dependency and release-readiness review in `REV-2` / `REV-4`. |

Section status: Complete

## 7. Agent-Focused Package Decomposition

Decomposition mission: Constrain agents to stable implementation boundaries that prove declarative validation value while preventing executable config, profile-specific semantics, rich IR contract drift, and shared-file contention.

| ID | Unit | Ladder level | Mission | Observable value enabled | Risk retired | Public interface | Validation command | Promotion blockers |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PKG-1 | Public declarative validation API and contract | 4 | Own package-root exports, public API names, public types, CLI-visible result contracts, and documentation. | Consumers can call declarative validation without private imports. | RISK-4 | `@jasonbelmonti/markdown-engine` exports, `docs/contracts/**`, CLI usage docs. | `npm run typecheck && npm run test:validation:contract` | Public syntax/API changes require `MS-2`; release remains blocked until `MS-3`. |
| PKG-2 | Profile parser and closed schema validator | 2 | Own YAML/object profile parsing, defaults, duplicate rule IDs, unsupported keys, invalid shapes, and config diagnostics. | Invalid or unsafe profiles fail before compilation or Markdown validation. | RISK-1 / RISK-6 | Internal parsed `ValidationProfile` model exposed only through `PKG-1` APIs. | `npm run test:validation:profile` | No parser dependency addition without `CTRL-7`; no partial unsupported behavior. |
| PKG-3 | Rule compiler and selector resolver | 2 | Own internal rule-plan records, selector/assertion compatibility, selector matching, and rich IR query usage. | Supported declarations become deterministic data-only plans over public document structure. | RISK-1 / RISK-2 / RISK-4 | Internal compiler entry point consumed by evaluator; compiled plans are not public. | `npm run test:validation:compiler && npm run test:validation:selectors` | Compiled plan export or raw parser access blocks promotion. |
| PKG-4 | Assertion evaluator and diagnostic targeter | 2 | Own assertion semantics, deterministic result ordering, source-target selection, and validation diagnostic emission. | Profiles produce actionable rule results and source-targeted diagnostics. | RISK-2 / RISK-3 / RISK-5 | Internal evaluator consumed by `PKG-1`; public output is `DeclarativeValidationResult`. | `npm run test:validation:assertions && npm run test:validation:diagnostics` | Fabricated source ranges or profile-specific assertions block promotion. |
| PKG-5 | CLI, evidence, and deterministic serialization adapter | 2 | Own CLI command behavior, JSON output union, exit codes, evidence hashes, and canonical serialization use. | CI users and reviewers can run the same validation semantics outside TypeScript code. | RISK-4 | `markdown-engine validate --file --profile [--format json]` and evidence fields. | `npm run test:validation:cli && npm run test:validation:repeatability` | Non-JSON v1 output or undocumented exit behavior requires design approval. |
| PKG-6 | Fixtures, boundary audit, downstream exercise, and release harness | 2 | Own fixtures, snapshots, scripts, docs evidence, boundary audit, downstream operational-design-spec exercise, and release readiness. | Reviewers can verify every claim before merge and release. | RISK-1 / RISK-2 / RISK-3 / RISK-4 / RISK-5 / RISK-6 | Test scripts and evidence artifacts only. | `npm run audit:declarative-validation-boundary && npm run release:verify` | Human milestone approvals cannot be replaced by automated evidence. |

### Package Boundary Card: PKG-1

Ladder level: 4

Mission: Public declarative validation API and contract.

Value / risk trace:

- Observable value enabled: Consumers call approved package-root functions and receive documented profile parse or validation results.
- Risk retired: RISK-4
- Validation evidence: VAL-1 / VAL-7 / VAL-10 / EVD-1 / EVD-7 / EVD-10
- Blocking unknowns: Final public API and CLI names remain gated by `MS-2`.

Owns:

- Files/directories: `src/index.ts`, public API modules under `src/api/**`, contract docs under `docs/contracts/**`.
- Concepts: exported API names, exported TypeScript types, public result shape, semver classification, CLI-facing public contract.
- Runtime responsibilities: Orchestrate profile parse, validation, and serialization through internal packages.

Does not own:

- Explicitly excluded behavior: profile parser internals, selector traversal internals, assertion semantics, evidence fixture generation, downstream profile semantics.
- Responsibilities delegated elsewhere: parsing/schema to `PKG-2`, compiler/selectors to `PKG-3`, assertions/diagnostics to `PKG-4`, CLI/evidence to `PKG-5`, fixtures/audits to `PKG-6`.

Public interface:

- Exported types: `ValidationProfile`, declarative rule/selector/assertion types, profile parse result, validation options, validation result, config-error result, evidence fields, diagnostic-related types, or final approved equivalents.
- Exported functions/classes/components: `parseValidationProfile`, `validateWithProfile`, and final approved package-root exports.
- Events/messages/contracts: diagnostic codes and serialized JSON result contracts.
- CLI/API surface: public API docs; CLI command contract through `PKG-5`.

Allowed dependencies:

- May import: public internal entry points from `PKG-2` through `PKG-5`, existing `src/api/**` document/result types, diagnostics, serializer helpers.
- May call: deterministic engine helpers with explicit inputs.
- May read configuration from: function arguments and explicit options only.

Forbidden dependencies:

- Must not import: raw parser AST types as public exports, downstream `markdown-profile`, runtime, MCP, agent, LLM, network, database, UI, or profile-specific modules.
- Must not call: network services, shell commands, dynamic plugins, LLM APIs, file traversal outside caller-provided CLI inputs.
- Must not know about: operational-design-spec semantics, AGENTS.md/TASK.md semantics, downstream profile IDs, entity registries, or issue-key policies.

State boundary:

- Owns state: none across calls.
- Reads state: explicit inputs only.
- Mutates state: invocation-local objects only.
- Persistence responsibility: none.

Agent ownership boundary:

- Agent editable paths: `src/index.ts`, public API files under `src/api/**`, public contract docs under `docs/contracts/**`.
- Agent read-only paths: `src/parser/**`, `src/frontmatter/**`, `src/ir/**`, `src/rules/**`, `src/config/**`, and internal declarative-validation modules owned by other packages unless assigned.
- Required coordination before editing: exported symbol names, option names, public result fields, diagnostic code inventory, public examples, CLI contract text.

Validation command: `npm run typecheck && npm run test:validation:contract`

Promotion blockers: `MS-2` must approve public contract; `MS-3` must approve release readiness before publication or tag.

### Package Boundary Card: PKG-2

Ladder level: 2

Mission: Profile parser and closed schema validator.

Value / risk trace:

- Observable value enabled: Profile authors receive deterministic config diagnostics before unsupported declarations can execute.
- Risk retired: RISK-1 / RISK-6
- Validation evidence: VAL-2 / EVD-2
- Blocking unknowns: Whether existing YAML helpers cover all profile parse needs; resolved in `WP-2`.

Owns:

- Files/directories: profile parser, schema, defaults, validation types, config diagnostics, and parser tests under `src/declarative-validation/**` or approved equivalent focused modules.
- Concepts: `syntaxVersion`, `documentVersion`, rule ID uniqueness, severity defaults, JSON-safe object handling, unsupported-key precedence, invalid shape rules, regex-like key rejection.
- Runtime responsibilities: Convert profile text/object input into a validated profile model or config diagnostics without compiling or evaluating rules.

Does not own:

- Explicitly excluded behavior: selector execution, assertion evaluation, CLI file reading, public export decisions.
- Responsibilities delegated elsewhere: compilation to `PKG-3`, validation diagnostics to `PKG-4`, public API names to `PKG-1`, CLI output to `PKG-5`.

Public interface:

- Exported types: only through `PKG-1`; direct internals remain package-private.
- Exported functions/classes/components: internal parse/schema validation function consumed by `PKG-1` and `PKG-3`.
- Events/messages/contracts: config diagnostic records using documented `profile.config.*` codes.
- CLI/API surface: none directly.

Allowed dependencies:

- May import: `yaml`, JSON-safe value helpers, diagnostics, plain-record helpers, declarative validation local types.
- May call: deterministic object traversal, key validation, defaulting, and diagnostic builders.
- May read configuration from: explicit parse options such as profile path only.

Forbidden dependencies:

- Must not import: compiler/evaluator internals for schema decisions, rich IR query helpers, CLI file readers, network/LLM/plugin modules, downstream profile packages.
- Must not call: dynamic import, `eval`, `Function`, regular-expression compilation from profile data, file system reads.
- Must not know about: operational-design-spec section names or downstream profile semantics.

State boundary:

- Owns state: invocation-local parse and diagnostic arrays.
- Reads state: supplied string or object profile input.
- Mutates state: cloned/resolved profile model only.
- Persistence responsibility: none.

Agent ownership boundary:

- Agent editable paths: `src/declarative-validation/profile/**`, `src/declarative-validation/diagnostics/profile-config-diagnostics.ts`, `tests/declarative-validation-profile.test.ts`, `fixtures/declarative-validation/profile/**`, `docs/evidence/wp-2-evd-2-profile-schema-closure.md`.
- Agent read-only paths: `src/declarative-validation/compiler/**`, `src/declarative-validation/selectors/**`, `src/declarative-validation/assertions/**`, `src/declarative-validation/cli/**`, `src/index.ts`, `src/api/**` except coordinated type wiring.
- Required coordination before editing: diagnostic code names, defaulting behavior, public profile type fields, YAML dependency behavior.

Validation command: `npm run test:validation:profile`

Promotion blockers: Any unsupported or regex-like key that reaches compilation blocks promotion.

### Package Boundary Card: PKG-3

Ladder level: 2

Mission: Rule compiler and selector resolver.

Value / risk trace:

- Observable value enabled: Supported declarations compile into deterministic data-only plans and select public document targets without raw parser traversal.
- Risk retired: RISK-1 / RISK-2 / RISK-4
- Validation evidence: VAL-3 / VAL-4 / EVD-3 / EVD-4
- Blocking unknowns: Selector coverage over the current rich IR; resolved by `MS-2`.

Owns:

- Files/directories: `src/declarative-validation/compiler/**`, `src/declarative-validation/selectors/**`, `tests/declarative-validation-compiler.test.ts`, `tests/declarative-validation-selectors.test.ts`, `fixtures/declarative-validation/selectors/**`, and `docs/evidence/wp-3-evd-3-rule-compiler-selector-plan.md`.
- Concepts: internal compiled rule plans, selector target matching, table header-array matching, table row predicates, selector empty-match behavior handoff, compatibility diagnostics.
- Runtime responsibilities: Compile parsed profiles into immutable invocation-local records and resolve selector matches over public `EngineDocument` and `documentQueries`.

Does not own:

- Explicitly excluded behavior: public export stability, profile syntax parsing, assertion pass/fail semantics, source diagnostic formatting, CLI exit codes.
- Responsibilities delegated elsewhere: parser/schema to `PKG-2`, assertion outcomes to `PKG-4`, API/CLI to `PKG-1` and `PKG-5`.

Public interface:

- Exported types: none; compiled rule-plan records are internal implementation details.
- Exported functions/classes/components: internal compiler and selector resolver entry points consumed by `PKG-4`.
- Events/messages/contracts: compile diagnostics using documented `profile.compile.*` codes.
- CLI/API surface: none directly.

Allowed dependencies:

- May import: parsed profile model, public `EngineDocument` types, `documentQueries`, diagnostics, target/source types.
- May call: public rich IR query helpers and deterministic local traversal helpers.
- May read configuration from: resolved profile rules and explicit validation options only.

Forbidden dependencies:

- Must not import: raw parser AST modules, downstream profile/runtime/MCP/agent modules, assertion private state from `PKG-4`.
- Must not call: user-provided callbacks, dynamic plugins, regular-expression compilation from profile data, file system, network services.
- Must not know about: ODS-specific headings or table semantics beyond generic fixture data.

State boundary:

- Owns state: invocation-local compiled plan and selector result arrays.
- Reads state: resolved profile and supplied `EngineDocument`.
- Mutates state: none outside returned compiled plan/result objects.
- Persistence responsibility: none.

Agent ownership boundary:

- Agent editable paths: `src/declarative-validation/compiler/**`, `src/declarative-validation/selectors/**`, `tests/declarative-validation-compiler.test.ts`, `tests/declarative-validation-selectors.test.ts`, `fixtures/declarative-validation/selectors/**`, `docs/evidence/wp-3-evd-3-rule-compiler-selector-plan.md`.
- Agent read-only paths: `src/declarative-validation/profile/**` unless coordinated, `src/declarative-validation/assertions/**` unless assigned, `src/ir/**` and `src/api/document-queries.ts` unless approved by `DEV-*`.
- Required coordination before editing: selector vocabulary, compatibility matrix, empty-selection contract, public `documentQueries` usage.

Validation command: `npm run test:validation:compiler && npm run test:validation:selectors`

Promotion blockers: Exported compiled plans, raw parser traversal, or selector behavior requiring rich IR contract changes without approval blocks promotion.

### Package Boundary Card: PKG-4

Ladder level: 2

Mission: Assertion evaluator and diagnostic targeter.

Value / risk trace:

- Observable value enabled: Rule failures emit deterministic rule results and actionable source-targeted diagnostics.
- Risk retired: RISK-2 / RISK-3 / RISK-5
- Validation evidence: VAL-4 / VAL-5 / EVD-4 / EVD-5
- Blocking unknowns: Source-targeting limits for cross-section and missing-target failures; documented by `MS-2`.

Owns:

- Files/directories: `src/declarative-validation/assertions/**`, `src/declarative-validation/diagnostics/validation-diagnostics.ts`, `src/declarative-validation/results/**`, `tests/declarative-validation-assertions.test.ts`, `tests/declarative-validation-diagnostics.test.ts`, `fixtures/declarative-validation/assertions/**`, `docs/evidence/wp-4-evd-4-assertion-semantics.md`, and `docs/evidence/wp-4-evd-5-diagnostic-targeting.md`.
- Concepts: required sections, section order, table columns, ID uniqueness, references, literal text predicates, occurrence counts, frontmatter fields, deterministic diagnostic sorting, no fabricated source ranges.
- Runtime responsibilities: Evaluate compiled rules against selector results and construct public validation diagnostics/results through `PKG-1`.

Does not own:

- Explicitly excluded behavior: syntax parsing, compiled plan schema visibility, CLI file I/O, evidence hash canonicalization, profile-specific semantics.
- Responsibilities delegated elsewhere: profile parsing to `PKG-2`, selector matching to `PKG-3`, CLI/evidence to `PKG-5`.

Public interface:

- Exported types: validation result and diagnostic shape only through `PKG-1`.
- Exported functions/classes/components: internal evaluator consumed by `PKG-1` and `PKG-5`.
- Events/messages/contracts: `profile.validation.*` diagnostic codes and rule results.
- CLI/API surface: none directly.

Allowed dependencies:

- May import: compiled plan types, selector result types, public document targets/source ranges, diagnostics, deterministic sort helpers.
- May call: target/source lookup helpers and stable serializer-compatible normalization helpers.
- May read configuration from: compiled rule records and explicit validation options.

Forbidden dependencies:

- Must not import: downstream profile/runtime/MCP/agent modules, LLM SDKs, raw parser AST modules, CLI file readers.
- Must not call: semantic evaluators, network services, external registries, regular-expression compilation from profile values.
- Must not know about: operational-design-spec approval meaning, profile scoring, or domain entity semantics.

State boundary:

- Owns state: invocation-local evaluation context.
- Reads state: compiled rules, selector results, `EngineDocument`, explicit options.
- Mutates state: returned diagnostics and rule result arrays only.
- Persistence responsibility: none.

Agent ownership boundary:

- Agent editable paths: `src/declarative-validation/assertions/**`, `src/declarative-validation/diagnostics/validation-diagnostics.ts`, `src/declarative-validation/results/**`, `tests/declarative-validation-assertions.test.ts`, `tests/declarative-validation-diagnostics.test.ts`, `fixtures/declarative-validation/assertions/**`, `docs/evidence/wp-4-evd-4-assertion-semantics.md`, `docs/evidence/wp-4-evd-5-diagnostic-targeting.md`.
- Agent read-only paths: `src/declarative-validation/profile/**`, `src/declarative-validation/compiler/**`, `src/declarative-validation/selectors/**`, `src/declarative-validation/cli/**`, `src/index.ts`, `src/api/**` unless type wiring is assigned.
- Required coordination before editing: diagnostic code inventory, result ordering, source-target selection policy, evidence field dependencies.

Validation command: `npm run test:validation:assertions && npm run test:validation:diagnostics`

Promotion blockers: Any assertion that embeds profile-specific semantics or fabricates source ranges blocks promotion.

### Package Boundary Card: PKG-5

Ladder level: 2

Mission: CLI, evidence, and deterministic serialization adapter.

Value / risk trace:

- Observable value enabled: CI users can invoke declarative validation and reviewers can compare stable JSON evidence.
- Risk retired: RISK-4
- Validation evidence: VAL-6 / VAL-7 / VAL-10 / EVD-6 / EVD-7 / EVD-10
- Blocking unknowns: None after `MS-2` approves public CLI/API contract.

Owns:

- Files/directories: `src/cli/**`, `src/declarative-validation/evidence/**`, `src/declarative-validation/cli/**`, serializer helper files under `src/serialize/**` only if needed, `tests/declarative-validation-cli.test.ts`, `tests/declarative-validation-repeatability.test.ts`, and API/CLI docs under `docs/contracts/**`.
- Concepts: profile-stage config-error JSON union, validation-result JSON union, exit codes, `inputHash`, `profileHash`, `includeEvidence`, documented path behavior, unsupported format handling.
- Runtime responsibilities: Read only caller-specified local files in CLI mode, run public parse/normalize/profile validation flow, serialize JSON in stable order, set documented exit codes.

Does not own:

- Explicitly excluded behavior: profile syntax decisions, assertion semantics, profile file discovery, directory traversal, non-JSON v1 formats.
- Responsibilities delegated elsewhere: parser/schema to `PKG-2`, compiler/selectors to `PKG-3`, evaluator to `PKG-4`, public type exports to `PKG-1`.

Public interface:

- Exported types: evidence and CLI JSON result types through `PKG-1`.
- Exported functions/classes/components: internal evidence builder and CLI run functions.
- Events/messages/contracts: stable JSON result union and exit codes.
- CLI/API surface: `markdown-engine validate --file <markdown-file> --profile <profile-file> [--format json]`.

Allowed dependencies:

- May import: public API functions, parser/normalizer, validator, serializer, diagnostics, Node CLI/file modules already approved for CLI code.
- May call: local file reads for explicit `--file` and `--profile` paths only, package-local deterministic hash and serializer helpers.
- May read configuration from: CLI arguments and explicit validation options only.

Forbidden dependencies:

- Must not import: parser AST internals, downstream profile/runtime/MCP/agent modules, network clients, LLM SDKs.
- Must not call: file discovery, directory traversal, network services, shell commands, nondeterministic timestamp generation for serialized evidence.
- Must not know about: downstream profile semantics or operational-design-spec-specific behavior.

State boundary:

- Owns state: invocation-local CLI result and evidence hash buffers.
- Reads state: caller-specified Markdown/profile files in CLI mode; explicit API inputs in library mode.
- Mutates state: stdout/stderr and process exit code in CLI mode only.
- Persistence responsibility: none.

Agent ownership boundary:

- Agent editable paths: `src/cli/**`, `src/declarative-validation/evidence/**`, `src/declarative-validation/cli/**`, `src/serialize/**` only if evidence serialization requires shared helpers, `tests/declarative-validation-cli.test.ts`, `tests/declarative-validation-repeatability.test.ts`, `docs/contracts/**`, `docs/evidence/wp-5-evd-6-declarative-validation-repeatability.md`, `docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md`.
- Agent read-only paths: `src/declarative-validation/profile/**`, `src/declarative-validation/compiler/**`, `src/declarative-validation/selectors/**`, `src/declarative-validation/assertions/**` unless coordinated.
- Required coordination before editing: CLI command names, exit codes, JSON field ordering, evidence hash inputs, serializer behavior.

Validation command: `npm run test:validation:cli && npm run test:validation:repeatability`

Promotion blockers: Any v1 CLI behavior not documented in `docs/contracts/**` blocks promotion.

### Package Boundary Card: PKG-6

Ladder level: 2

Mission: Fixtures, boundary audit, downstream exercise, and release harness.

Value / risk trace:

- Observable value enabled: Reviewers can approve implementation and release from evidence rather than intent.
- Risk retired: RISK-1 / RISK-2 / RISK-3 / RISK-4 / RISK-5 / RISK-6
- Validation evidence: VAL-1 through VAL-10 / EVD-1 through EVD-10
- Blocking unknowns: None; command names are finalized by `WP-1`.

Owns:

- Files/directories: `tests/**`, `fixtures/**`, `snapshots/**`, `scripts/**`, `docs/evidence/**`, package script registry.
- Concepts: proving fixture, invalid profile fixtures, selector/assertion fixtures, source diagnostic snapshots, repeatability runs, boundary audit, downstream ODS profile exercise, release verification.
- Runtime responsibilities: none in package runtime.

Does not own:

- Explicitly excluded behavior: production parser/compiler/evaluator logic.
- Responsibilities delegated elsewhere: implementation modules to `PKG-1` through `PKG-5`.

Public interface:

- Exported types: none.
- Exported functions/classes/components: none for package consumers.
- Events/messages/contracts: evidence artifacts and package scripts.
- CLI/API surface: validation scripts only.

Allowed dependencies:

- May import: package public API, focused internal test helpers when the test scope requires package-boundary unit coverage.
- May call: local package scripts, test runner, boundary audit scripts, repeatability scripts.
- May read configuration from: fixtures and explicit test config.

Forbidden dependencies:

- Must not import: private internals in public contract tests unless labeled as boundary-unit evidence.
- Must not call: network services, nondeterministic external systems, downstream app code as a hidden dependency.
- Must not know about: operational-design-spec semantics beyond static fixture text used to prove generic structure.

State boundary:

- Owns state: snapshots and evidence artifacts.
- Reads state: fixtures, source code, contract docs.
- Mutates state: snapshots and `docs/evidence/**` only when intentionally approved.
- Persistence responsibility: repository evidence files and CI logs if CI is used.

Agent ownership boundary:

- Agent editable paths: `tests/**`, `fixtures/**`, `snapshots/**`, `scripts/**`, `docs/evidence/**`, `package.json` script entries.
- Agent read-only paths: source modules unless a work package assigns them.
- Required coordination before editing: snapshot baselines, release verification commands, evidence file names, fixture coverage reductions.

Validation command: `npm run audit:declarative-validation-boundary && npm run release:verify`

Promotion blockers: Human milestone approval remains required; automated evidence alone cannot approve `MS-*`.

Dependency direction rules:

- Allowed direction: `PKG-1` orchestrates `PKG-2` through `PKG-5`; `PKG-3` consumes parsed profiles from `PKG-2` and public rich IR helpers; `PKG-4` consumes compiled plans from `PKG-3`; `PKG-5` consumes public API and serializer helpers; `PKG-6` consumes public APIs and assigned test helpers.
- Prohibited imports: production modules must not import `tests/**`, `fixtures/**`, `snapshots/**`, or `docs/evidence/**`; profile parser must not import evaluator internals; selector resolver must not import raw parser AST; assertion evaluator must not import downstream profile/runtime/MCP/agent modules.
- Allowed cross-boundary communication: typed function calls, public internal entry points, diagnostic records, JSON-safe values, public result objects.
- Disallowed cross-boundary communication: private deep imports, copied shared types, global mutable state, environment-variable side channels, executable profile hooks, profile-specific identifiers, raw parser AST public exposure.

State boundary rules:

- Package-owned state: invocation-local values only.
- Package-read state: explicit Markdown text, normalized documents, profile input, options, CLI arguments, and fixtures during tests.
- Package-mutated state: none in library runtime; stdout/stderr/exit code in CLI runtime; snapshots/evidence under `PKG-6`.
- Persistence ownership: no runtime persistence in `markdown-engine`.

Reusable package candidates:

| Candidate | Current level | Reuse rationale | Required decoupling | Promotion trigger |
| --- | --- | --- | --- | --- |
| Public `markdown-engine` package contract | 4 | The package is already public and declarative validation becomes a durable contract surface. | Complete syntax docs, diagnostic inventory, CLI docs, release notes, compatibility matrix, and release evidence. | `MS-3` approval and explicit release/tag decision. |
| Declarative validation schema/compiler | 2 | The parser/compiler may later be useful to `markdown-profile`. | Remove package-specific rich IR assumptions, define standalone compatibility policy, and prove a second repository consumer. | Future project-owner decision after `markdown-profile` needs it outside `markdown-engine`. |

Coupling tripwires:

- A package requires knowledge of another package's private file layout.
- Two packages must usually change together for one feature.
- A reusable candidate imports app, route, UI, database, deployment, profile/runtime, MCP, agent, LLM, or product-specific runtime code.
- Business rules or profile semantics live in CLI code, scripts, query helpers, or integration glue.
- A utility module collects unrelated parser, compiler, assertion, CLI, and evidence behavior without one mission.
- Package validation requires a full downstream app when package-level validation should be possible.
- Types are shared by copying instead of declared public exports or internal contract modules.
- Separate agents must edit the same files to complete nominally separate work packages.

N/A rationale: Not applicable; code, contracts, schemas, public APIs, CLI behavior, and potential multi-agent implementation are all in scope.

Section status: Complete

## 8. Work Packages and Sequencing

Planning strategy: `STRATEGIES.RISK_RETIREMENT` through `WP-1`, then `STRATEGIES.PROGRESSIVE_VALUE` with contract-first controls for `WP-2` through `WP-6`.

Critical path hypothesis: One representative fixture can travel through profile parsing, schema validation, compilation, selector resolution, assertion evaluation, source diagnostic targeting, stable serialization, and boundary audit without executable profile behavior or profile-specific engine semantics.

First proving slice: `WP-1` implements the minimum API path and representative fixture required to produce `EVD-1`.

Validation cadence: Each work package produces mapped `VAL-*` evidence before dependent work proceeds; `MS-1`, `MS-2`, and `MS-3` are human approval gates.

Deferred completeness: Full selector/assertion breadth, CLI hardening, docs polish, downstream exercise, release verification, and publication wait until `MS-1` and `MS-2` pass.

Required verification command registry: `WP-1` shall add or update package scripts for `npm run test:validation:proving`, `npm run test:validation:contract`, `npm run test:validation:profile`, `npm run test:validation:compiler`, `npm run test:validation:selectors`, `npm run test:validation:assertions`, `npm run test:validation:diagnostics`, `npm run test:validation:cli`, `npm run test:validation:repeatability`, `npm run test:validation:downstream`, `npm run audit:declarative-validation-boundary`, `npm run docs:declarative-validation-contract`, and `npm run release:verify`. These names are execution-gate labels and shall not force public TypeScript API names. Later work packages may change command internals but shall preserve script names unless a `DEV-*` deviation and `REV-2` approval update this spec and evidence plan.

| ID | Objective | Owner | Package boundary | Editable paths | Read-only paths | Inputs | Outputs | Dependencies | Observable value enabled | Risk retired | Milestone gate | Validation checkpoint | Completion criteria |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| WP-1 | Prove the declarative validation critical path on one representative fixture. | Implementer | PKG-1 / PKG-2 / PKG-3 / PKG-4 / PKG-5 / PKG-6 | `src/index.ts`, `src/api/**`, `src/declarative-validation/**`, `package.json`, `tests/declarative-validation-proving.test.ts`, `fixtures/declarative-validation/proving/**`, `snapshots/**`, `docs/evidence/wp-1-evd-1-declarative-validation-proving-slice.md` | `docs/design/**`, `docs/contracts/api.md`, `docs/execution/markdown-engine-1.0-rich-ir-execution-spec.md`, `RUNTIME_ARCHITECTURE.md`, `src/ir/**`, `src/api/document-queries.ts` | SRC-1 through SRC-6, current API contract, one representative ODS-style fixture | Minimal profile parse/compile/evaluate path, one table/ID/source diagnostic proof, deterministic serialized result, command registry, `EVD-1` | DEP-1 | A reviewer can inspect one end-to-end result and decide whether the architecture is viable. | RISK-1 / RISK-2 / RISK-3 / RISK-4 / RISK-5 | MS-1 | VAL-1 | `npm run test:validation:proving && npm run test:validation:contract` pass; output demonstrates parse, compile, select, assert, diagnose, serialize, and no executable/profile-specific behavior. |
| WP-2 | Harden profile parser, schema closure, defaults, and config diagnostics. | Implementer | PKG-2 / PKG-6 | `src/declarative-validation/profile/**`, `src/declarative-validation/diagnostics/profile-config-diagnostics.ts`, `tests/declarative-validation-profile.test.ts`, `fixtures/declarative-validation/profile/**`, `docs/evidence/wp-2-evd-2-profile-schema-closure.md` | `src/declarative-validation/compiler/**`, `src/declarative-validation/selectors/**`, `src/declarative-validation/assertions/**`, `src/declarative-validation/cli/**`, `src/index.ts`, `src/api/**` unless coordinated | WP-1 profile shape, SRC-1 schema closure rules | YAML/object input support, syntax-version and document-version handling, duplicate rule ID rejection, invalid shape diagnostics, unsupported-key precedence, regex-like key rejection, `EVD-2` | WP-1 / MS-1 | Unsafe or unsupported profiles fail deterministically before execution. | RISK-1 / RISK-6 / RISK-4 | MS-2 | VAL-2 | `npm run test:validation:profile` passes; invalid profiles produce documented diagnostics and no compiled plan. |
| WP-3 | Implement rule compiler, selector resolver, and compatibility matrix. | Implementer | PKG-3 / PKG-6 | `src/declarative-validation/compiler/**`, `src/declarative-validation/selectors/**`, `tests/declarative-validation-compiler.test.ts`, `tests/declarative-validation-selectors.test.ts`, `fixtures/declarative-validation/selectors/**`, `docs/evidence/wp-3-evd-3-rule-compiler-selector-plan.md` | `src/declarative-validation/profile/**` unless coordinated, `src/declarative-validation/assertions/**` unless assigned, `src/ir/**`, `src/api/document-queries.ts` unless approved | WP-2 parsed profile model, SRC-1 selector/assertion matrix, public rich IR queries | Data-only internal plans, selector target matching, table header and row predicate behavior, incompatible selector/assertion diagnostics, `EVD-3` | WP-2 / DEP-2 | Supported declarations can target public rich IR structures without raw traversal. | RISK-1 / RISK-2 / RISK-4 | MS-2 | VAL-3 / VAL-4 | `npm run test:validation:compiler && npm run test:validation:selectors` pass; compiled plans remain private and selector compatibility follows the documented matrix. |
| WP-4 | Implement assertion evaluator, source diagnostics, and deterministic result ordering. | Implementer | PKG-4 / PKG-6 | `src/declarative-validation/assertions/**`, `src/declarative-validation/diagnostics/validation-diagnostics.ts`, `src/declarative-validation/results/**`, `tests/declarative-validation-assertions.test.ts`, `tests/declarative-validation-diagnostics.test.ts`, `fixtures/declarative-validation/assertions/**`, `docs/evidence/wp-4-evd-4-assertion-semantics.md`, `docs/evidence/wp-4-evd-5-diagnostic-targeting.md` | `src/declarative-validation/profile/**`, `src/declarative-validation/compiler/**`, `src/declarative-validation/selectors/**`, `src/declarative-validation/cli/**` unless coordinated | WP-3 compiled plans and selector results, SRC-1 assertion semantics | Required-section/order/table/ID/reference/text/frontmatter assertions, empty-selection behavior, source-targeted diagnostics, deterministic ordering, `EVD-4` / `EVD-5` | WP-3 / DEP-2 | Profile authors receive actionable deterministic diagnostics for real structural policies. | RISK-2 / RISK-3 / RISK-5 | MS-2 | VAL-4 / VAL-5 | `npm run test:validation:assertions && npm run test:validation:diagnostics` pass; diagnostics use source ranges where available and never fabricate locations. |
| WP-5 | Finalize public API, CLI, evidence hashes, serialization, contract docs, and pre-merge boundary audit. | Implementer | PKG-1 / PKG-5 / PKG-6 | `src/index.ts`, `src/api/**`, `src/cli/**`, `src/declarative-validation/evidence/**`, `src/declarative-validation/cli/**`, `src/serialize/**` only if shared serialization helpers are required, `scripts/**` only for boundary-audit automation, `docs/contracts/**`, `README.md`, `CHANGELOG.md`, `tests/declarative-validation-cli.test.ts`, `tests/declarative-validation-repeatability.test.ts`, `docs/evidence/wp-5-evd-6-declarative-validation-repeatability.md`, `docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md`, `docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md` | `src/declarative-validation/compiler/**`, `src/declarative-validation/selectors/**`, `src/declarative-validation/assertions/**`, `src/ir/**` unless coordinated | WP-1 through WP-4 outputs, SRC-1 CLI/API/evidence contracts, SRC-2 serializer contract | Public API exports, CLI command and exit codes, stable JSON union, evidence hash implementation, contract docs, migration notes, pre-merge boundary audit, `EVD-6` / `EVD-7` / `EVD-8` | WP-4 / DEP-2 | Library and CI consumers can use documented validation semantics with boundary evidence before merge. | RISK-4 / RISK-1 / RISK-5 / RISK-6 | MS-2 | VAL-6 / VAL-7 / VAL-8 | `npm run test:validation:cli`, `npm run test:validation:repeatability`, `npm run docs:declarative-validation-contract`, and `npm run audit:declarative-validation-boundary` pass; docs define syntax, diagnostics, API, CLI, evidence, compatibility, non-goals, and boundary exclusions. |
| WP-6 | Complete downstream exercise, release verification, release containment, and handoff packet. | Implementer | PKG-6 / PKG-1 / PKG-5 | `tests/**`, `fixtures/declarative-validation/**`, `snapshots/**`, `scripts/**`, `docs/evidence/wp-6-evd-9-ods-profile-exercise.md`, `docs/evidence/wp-6-evd-10-declarative-validation-release-readiness.md`, `CHANGELOG.md`, `package.json` scripts if needed | all source modules, design docs, contract docs, pre-merge EVD-8 evidence | WP-1 through WP-5 evidence and `MS-2` approval | Boundary audit revalidation summarized in EVD-10, operational-design-spec fixture exercise, release readiness record, rollback/containment notes, handoff packet, `EVD-9` / `EVD-10` | WP-5 / MS-2 / DEP-2 | Maintainers can approve release readiness from evidence, not intent. | RISK-1 / RISK-2 / RISK-3 / RISK-4 / RISK-5 / RISK-6 | MS-3 | VAL-8 / VAL-9 / VAL-10 | `npm run audit:declarative-validation-boundary`, `npm run test:validation:downstream`, and `npm run release:verify` pass; boundary revalidation, release containment, and handoff are recorded. |

Execution sequence:

1. Resolve `DEP-1` entry approval.
2. Execute `WP-1`; stop at `MS-1` if the critical path fails or scope leaks executable/profile-specific behavior.
3. Execute `WP-2` after `MS-1` to harden profile parser and schema closure.
4. Resolve `DEP-2` by verifying the 1.0 rich IR public contract and query helpers before `WP-3` starts.
5. Execute `WP-3` after `WP-2` and `DEP-2` to stabilize compiler and selector behavior.
6. Execute `WP-4` after `WP-3` to complete assertion behavior and diagnostics.
7. Execute `WP-5` after public behavior exists and before merge approval.
8. Execute `WP-6` after `MS-2` evidence is complete and before release readiness.

Parallelization rules: No parallel source edits before `MS-1`. After `MS-1`, docs and fixtures may proceed in parallel with source work only when editable paths are disjoint and final API names are marked pending `MS-2`. Source implementation remains serialized across `WP-2`, `WP-3`, and `WP-4` unless the project owner approves disjoint editable paths and stable public interfaces.

Integration points: `MS-1` integrates the proving fixture and minimum public shape; `MS-2` integrates parser/schema, compiler/selectors, assertions/diagnostics, API, CLI, docs, tests, repeatability, and boundary audit before merge; `MS-3` integrates downstream exercise, boundary revalidation, release verification, rollback containment, and handoff.

Coordination triggers: Any exported API/type change, diagnostic code change, diagnostic precedence change, selector/assertion vocabulary change, evidence hash input change, CLI command/flag/exit-code change, rich IR query helper change, dependency addition, snapshot baseline update, shared editable path conflict, or profile-specific semantics request requires coordination before continuing.

Section status: Complete

## 9. Milestone Gates and Manual Verification

| ID | Gate objective | Covered work | Due point | Human verifier | Prerequisites | Review gate | Required evidence | Approval decision | Failure path |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MS-1 | Approve the declarative validation critical-path proof before broad implementation. | OBJ-1 / OBJ-2 / OBJ-3 / OBJ-6 / SURF-1 / SURF-2 / SURF-7 / PKG-1 through PKG-6 / WP-1 | Before WP-2, WP-3, WP-4, or WP-5 source implementation starts | Project owner or implementation reviewer | DEP-1 resolved, VAL-1 / EVD-1 | REV-1 / REV-2 / REV-4 | EVD-1 | Approve / Reject / Conditional approval | If rejected, stop execution and revise syntax scope, parser/compile/evaluation approach, source-targeting approach, or design authority before continuing. |
| MS-2 | Approve implementation completeness, public contract, and boundary evidence before merge. | OBJ-1 through OBJ-4 / OBJ-6 / SURF-1 through SURF-9 / PKG-1 through PKG-6 / WP-2 through WP-5 | Before merge | Project owner and implementation reviewer | VAL-2 through VAL-8 / EVD-2 through EVD-8 | REV-1 / REV-2 / REV-4 / REV-5 | EVD-2 / EVD-3 / EVD-4 / EVD-5 / EVD-6 / EVD-7 / EVD-8 | Approve / Reject / Conditional approval | If rejected, block merge and record required fixes, design revision, or approved deviations. |
| MS-3 | Approve release readiness, downstream exercise, rollback containment, and handoff. | OBJ-4 / OBJ-5 / OBJ-6 / NG-4 / SURF-7 through SURF-9 / WP-6 | Before tag, package publication, or completion claim | Project owner with downstream consumer and boundary/security review | VAL-6 through VAL-10 / EVD-6 through EVD-10 | REV-1 / REV-3 / REV-4 / REV-5 | EVD-6 / EVD-7 / EVD-8 / EVD-9 / EVD-10 | Approve / Reject / Conditional approval | If rejected, withhold release/tag and continue compatibility, documentation, downstream exercise, boundary, or containment fixes. |

Manual verification guide:

| Step ID | Milestone | Operator action | Expected result | Evidence artifact |
| --- | --- | --- | --- | --- |
| MV-1 | MS-1 | Run `npm run test:validation:proving` and inspect `docs/evidence/wp-1-evd-1-declarative-validation-proving-slice.md`. | Command passes and evidence shows profile parse, compile, selector resolution, assertion evaluation, one source-targeted diagnostic, deterministic serialization, and no executable/profile-specific behavior. | EVD-1 |
| MV-2 | MS-1 | Run `npm run typecheck && npm run test:validation:contract`, then inspect public exports and proving-slice serialized output. | Public API exposes only approved declarative validation entry points; compiled rule plans remain internal; no raw parser AST or downstream profile/runtime/MCP/agent identifiers appear. | EVD-1 |
| MV-3 | MS-2 | Run `npm run test:validation:profile`, `npm run test:validation:compiler`, `npm run test:validation:selectors`, `npm run test:validation:assertions`, `npm run test:validation:diagnostics`, `npm run test:validation:cli`, `npm run test:validation:repeatability`, `npm run docs:declarative-validation-contract`, `npm run audit:declarative-validation-boundary`, `npm run build`, and `npm run typecheck`. | Commands pass and each pre-merge evidence artifact exists under `docs/evidence/`. | EVD-2 through EVD-8 |
| MV-4 | MS-2 | Review `docs/contracts/**`, representative snapshots, CLI fixtures, diagnostic inventory referenced by `EVD-7`, and boundary-audit evidence referenced by `EVD-8`. | Syntax versioning, document-version mismatch, selector/assertion vocabulary, diagnostic precedence, evidence hashes, CLI JSON shape, exit codes, compatibility, non-goals, and boundary exclusions are documented. | EVD-7 / EVD-8 |
| MV-5 | MS-3 | Run `npm run audit:declarative-validation-boundary`, `npm run test:validation:downstream`, and `npm run release:verify`, then inspect `docs/evidence/wp-6-evd-9-ods-profile-exercise.md`. | Boundary audit revalidation passes, downstream ODS fixture validates generic structural requirements without semantic leakage, and release verification passes. | EVD-8 / EVD-9 / EVD-10 |
| MV-6 | MS-3 | Inspect release containment and handoff evidence under `docs/evidence/`. | Release/tag can be withheld or reverted at source/package-contract level, and handoff links all produced evidence plus unresolved non-blocking follow-ups. | EVD-10 |

Section status: Complete

## 10. Execution Controls and Drift Management

| ID | Trigger | Required action | Owner | Evidence |
| --- | --- | --- | --- | --- |
| CTRL-1 | Implementation requires changing an approved design requirement, non-objective, syntax vocabulary, API function name, CLI command, result field, or diagnostic code from `SRC-1`. | Stop the affected work package and request project-owner approval through `DEV-*` or design revision. | Implementer | DEV record or revised design/spec. |
| CTRL-2 | Profile execution, scripts, plugins, dynamic callbacks, user-supplied regular expressions, LLM behavior, network/persistent behavior, or semantic scoring appears in core code. | Remove the behavior or stop for project-owner decision; merge is blocked until resolved. | Implementer | VAL-2 / VAL-8 / REV-4 / EVD-2 / EVD-8. |
| CTRL-3 | Operational-design-spec, AGENTS.md, TASK.md, issue-key, profile ID, runtime lens, MCP, or agent-adapter semantics enter parser, compiler, assertion, or diagnostic logic. | Remove the semantics or escalate for design revision; downstream fixture data may remain only as generic structural test input. | Implementer | VAL-8 / VAL-9 / EVD-8 / EVD-9. |
| CTRL-4 | Public API, CLI, diagnostic precedence, evidence hash input, or serialized field ordering changes after `MS-1`. | Coordinate with `PKG-*` owners and update docs, tests, snapshots, and traceability before continuing. | Implementer | Updated EVD and `REV-2` approval. |
| CTRL-5 | Source ranges are unavailable or ambiguous for a diagnostic case. | Use nearest documented target or omit source range; do not fabricate a location. | Implementer | VAL-5 / EVD-5. |
| CTRL-6 | Snapshot, serialized output, evidence hash, or repeatability output changes unexpectedly. | Treat as contract drift; investigate before updating baselines. | Implementer | VAL-6 / EVD-6. |
| CTRL-7 | Work adds a dependency, touches rich IR internals, expands beyond listed surfaces, or exceeds the estimated blast radius. | Re-run execution estimation and stop if the estimator requires planning or decomposition; dependency additions require boundary review. | Implementer | Estimation output and updated execution decision. |
| CTRL-8 | A milestone due point arrives without required evidence or human approval. | Stop dependent work; milestone requirements are non-waivable and remain blocked until required evidence and approval are recorded, or until this execution spec is revised before the due point. | Project owner | MS approval, revised execution spec, or rejection record. |

Deviation rules: Any approved departure from source authority, package boundaries, milestone requirements, diagnostic precedence, syntax/API/CLI contracts, evidence hash semantics, compatibility policy, or validation evidence shall be recorded as `DEV-*` with owner, approver, rationale, impact, and evidence before merge or release.

Pause or escalation conditions: Pause on unresolved `DEP-1`, `MS-*` rejection, failed boundary audit, unsupported syntax reaching evaluation, regex compilation, source-targeting ambiguity without documented fallback, repeatability failure, public contract disagreement, downstream exercise failure, forbidden dependency, missing required evidence, or unapproved shared editable path conflict.

Section status: Complete

## 11. Data, Schema, Config, and Contract Handling

| Change | Impact | Compatibility | Reversibility | Validation |
| --- | --- | --- | --- | --- |
| `markdown-engine.validation@v1` profile syntax | Creates a durable author-facing config contract for declarative validation profiles. | Versioned by `syntaxVersion`; unsupported versions fail with documented diagnostics. | Reversible before release; semver-controlled after release. | VAL-2 / VAL-7 |
| `ValidationProfile` and declarative rule types | Adds public TypeScript types and YAML-compatible object shape. | Public names and fields freeze at `MS-2` before merge and `MS-3` before release. | Reversible before release; semver-controlled after release. | VAL-1 / VAL-2 / VAL-7 |
| Internal compiled rule-plan records | Adds private implementation schema for deterministic execution. | No public compatibility promise; plans are not exported or serialized. | Refactorable after release if public behavior is unchanged. | VAL-3 / VAL-8 |
| Selector and assertion vocabulary | Adds structural selectors and deterministic assertions over public rich IR. | v1 vocabulary is closed; unknown selectors/assertions fail explicitly. | Reversible before release; semver-controlled after release. | VAL-3 / VAL-4 / VAL-9 |
| Diagnostic codes and precedence | Adds `profile.config.*`, `profile.compile.*`, and `profile.validation.*` codes. | Codes are machine-readable public contract once released. | Reversible before release; semver-controlled after release. | VAL-2 / VAL-5 / VAL-7 |
| Evidence result fields and hashes | Adds optional validation evidence with canonical `inputHash` and `profileHash`. | Hash inputs and deterministic serialization rules are documented before release. | Reversible before release; semver-controlled after release. | VAL-6 / VAL-7 |
| Public API functions | Adds profile parse and declarative validation entry points to package-root exports. | API names and result shapes require `MS-2` approval and release notes. | Reversible before release; semver-controlled after release. | VAL-1 / VAL-7 / VAL-10 |
| CLI validation command | Adds `markdown-engine validate --file <markdown-file> --profile <profile-file> [--format json]`. | First-version output is JSON only; usage, read errors, config failures, validation failures, and exit codes are documented. | Reversible before release; semver-controlled after release. | VAL-10 |
| Existing fixed rule families | Must remain intact and not be replaced by declarative validation. | Existing `validate(document, config)` behavior remains available unless an approved design revision says otherwise. | Existing behavior is preserved; changes require compatibility review. | VAL-10 / release regression checks |

N/A rationale: No database schema, event stream, permission model, storage migration, network deployment, or backfill is in scope because `markdown-engine` remains a local stateless package.

Section status: Complete

## Layer 3: Validation, Release, and Handoff

## 12. Validation and Evidence Plan

| ID | Method | Claim verified | Timing | Owner | Evidence artifact and storage location |
| --- | --- | --- | --- | --- | --- |
| VAL-1 | Test / Snapshot / Review | The first proving slice demonstrates profile parse, compile, selector resolution, assertion evaluation, source diagnostic targeting, deterministic serialization, and no executable/profile-specific behavior. | Pre-merge before broad implementation | Implementer | EVD-1 at `docs/evidence/wp-1-evd-1-declarative-validation-proving-slice.md` |
| VAL-2 | Test / Boundary fixture | Invalid YAML, unsupported syntax version, invalid shapes, duplicate rule IDs, unsupported keys, regex-like keys, unsafe declarations, and document-version mismatch produce documented config diagnostics and no compiled rule plan. | Pre-merge | Implementer | EVD-2 at `docs/evidence/wp-2-evd-2-profile-schema-closure.md` |
| VAL-3 | Test / Inspection | Supported declarations compile into closed data-only rule-plan records that remain internal and operate over public `EngineDocument` fields and query helpers. | Pre-merge | Implementer | EVD-3 at `docs/evidence/wp-3-evd-3-rule-compiler-selector-plan.md` |
| VAL-4 | Test / Snapshot | Selector/assertion compatibility, section ordering, table header matching, table predicates, ID-token extraction, references, literal text predicates, occurrence counts, and frontmatter assertions evaluate with documented semantics. | Pre-merge | Implementer | EVD-4 at `docs/evidence/wp-4-evd-4-assertion-semantics.md` |
| VAL-5 | Test / Snapshot | Missing table column, duplicate ID, missing reference, empty selection, invalid table-cell, missing section, and unavailable-source cases emit deterministic diagnostics with source ranges when available and no fabricated locations. | Pre-merge | Implementer | EVD-5 at `docs/evidence/wp-4-evd-5-diagnostic-targeting.md` |
| VAL-6 | Measurement / Test | Ten repeated declarative validations produce byte-for-byte identical serialized results and evidence output, including stable SHA-256 `inputHash` and `profileHash` values from documented canonical inputs. | Pre-merge and pre-release | Implementer | EVD-6 at `docs/evidence/wp-5-evd-6-declarative-validation-repeatability.md` |
| VAL-7 | Review / Docs check | Contract docs cover syntax versioning, selectors, assertions, diagnostics, result shape, evidence fields, CLI behavior, compatibility, examples, migration notes, and non-goals. | Pre-merge and pre-release | Project owner / Implementation reviewer | EVD-7 at `docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md` |
| VAL-8 | Boundary audit | No arbitrary JavaScript, expression evaluation, user-supplied regular expression compilation, plugin loading, network call, LLM call, file watching, persistence, or profile-specific core semantics appear in declarative validation execution. | Pre-merge and pre-release | Implementer / Boundary reviewer | EVD-8 at `docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md`; pre-release revalidation is summarized in EVD-10. |
| VAL-9 | Downstream exercise | An operational-design-spec structural profile validates required headings, tables, IDs, text constraints, and traceability without hard-coded ODS engine semantics. | Pre-release | Downstream consumer / Implementer | EVD-9 at `docs/evidence/wp-6-evd-9-ods-profile-exercise.md` |
| VAL-10 | Build / Typecheck / CLI / Release verification | Public API, CLI JSON union, CLI exit codes, build, typecheck, full tests, release verification, and clean-diff checks pass before release readiness. | Pre-release | Implementer | EVD-10 at `docs/evidence/wp-6-evd-10-declarative-validation-release-readiness.md` |

Section status: Complete

## 13. Review Plan

| ID | Reviewer | Review scope | Blocking? | Completion evidence |
| --- | --- | --- | --- | --- |
| REV-1 | Project owner | Source authority, entry approval, public syntax/API/CLI decisions, compatibility policy, milestone decisions, deviations, release readiness, and final approval. | Yes | MS approval record and EVD review notes. |
| REV-2 | Implementation reviewer | Source changes across `SURF-1` through `SURF-9`, package boundaries, tests, snapshots, deterministic behavior, typecheck/build, and traceability to work packages. | Yes | Code review approval and validation evidence review. |
| REV-3 | Downstream profile/runtime consumer | Selector/assertion usefulness, operational-design-spec exercise, profile compiler fit, and absence of profile semantics in core engine code. | Yes for release | EVD-9 review approval or release blocker record. |
| REV-4 | Boundary/security reviewer | Inert profile handling, no scripts/plugins/regex compilation/network/LLM/persistence/file watching, dependency audit, and no executable config behavior. | Yes | EVD-8 approval or blocker record. |
| REV-5 | CI/docs quality-gate reviewer | CLI usage, JSON output union, exit codes, diagnostics, and evidence fields for automated validation workflows. | Yes for release | EVD-7 / EVD-10 approval or blocker record. |

Approval conditions: Implementation may start only after `DEP-1` is resolved. Merge requires `MS-1` and `MS-2` approval, all pre-merge `VAL-*` evidence including `VAL-8`, no open blocking `Q-*`, no unresolved blocker/major review findings, no unsupported syntax execution, and no unapproved deviations or waivers. Release or tag requires `MS-3`, `REV-3`, `REV-4`, `REV-5`, `VAL-8` revalidation, `VAL-9`, `VAL-10`, release containment evidence, and a separate explicit publish decision.

Section status: Complete

## 14. Rollout, Migration, Rollback, and Recovery

| ID | Action | Timing | Owner | Abort trigger | Evidence |
| --- | --- | --- | --- | --- | --- |
| REL-1 | Implement declarative validation on an implementation branch with no package publication during coding. | During WP-1 through WP-6 | Implementer | Failed `MS-1`, executable config behavior, forbidden dependency, or profile-specific semantic leakage | EVD-1 / EVD-8 |
| REL-2 | Merge implementation only after contract, compatibility, validation, and boundary evidence are approved. | Before merge | Project owner | Failed `MS-2`, missing evidence, unresolved blocker, ambiguous compatibility, failed repeatability, failed boundary audit | EVD-2 through EVD-8 |
| REL-3 | Prepare release/tag only after downstream exercise, boundary audit, repeatability, release verification, migration docs, and containment notes pass. | Before release/tag/publication | Project owner | Failed `MS-3`, failed downstream exercise, failed boundary audit, failed release verification, or missing rollback notes | EVD-6 / EVD-8 / EVD-9 / EVD-10 |
| REL-4 | Withhold or publish package according to the explicit `MS-3` decision. | Release decision | Project owner | Any unresolved release blocker or unapproved deviation | MS-3 approval record |

Rollback or containment plan: Before publication, rollback is source-level containment: withhold release, revert or supersede the implementation branch, and keep the latest approved package contract as the stable contract. After publication, recovery follows package semver practice: publish a compatible patch if possible, deprecate or supersede a broken release if contract-breaking, and document migration/rollback guidance. No data migration rollback is required because the package owns no persistent user data.

Recovery limit: Recovery is limited to package source, package metadata, docs, tags, and published package versions. It cannot preserve consumers that adopted unpublished or unapproved syntax outside the release gate.

Section status: Complete

## 15. Observability and Operational Readiness

| ID | Signal | Purpose | Consumer | Response |
| --- | --- | --- | --- | --- |
| OBS-1 | Profile parser fixture output | Detect invalid profile handling, unsupported-key precedence, defaults, and regex-like key rejection drift. | Implementer and reviewer | Block merge until fixed or formally deviated. |
| OBS-2 | Compiler and selector snapshots | Detect selector compatibility, matching, and compiled-plan closure drift. | Implementation reviewer | Approve intentional change or reject drift. |
| OBS-3 | Assertion and diagnostic snapshots | Detect assertion semantics, source-targeting, empty-selection, duplicate-ID, and missing-reference drift. | Project owner and CI user | Block merge until expected behavior is restored or contract is revised. |
| OBS-4 | Repeatability and evidence-hash output | Detect nondeterministic result ordering, serialization, or hash input behavior. | Project owner and implementation reviewer | Block merge/release until stable. |
| OBS-5 | Boundary audit output | Detect scripts, regex compilation, plugins, network/LLM/persistence/file watching, or profile-specific core semantics. | Boundary/security reviewer | Block merge/release until removed or escalated. |
| OBS-6 | CLI validation tests | Detect CLI JSON-shape, file-read, usage, format, and exit-code regressions. | CI/docs quality-gate user | Block release until fixed or explicitly descoped before publication. |
| OBS-7 | Operational-design-spec fixture exercise | Detect whether v1 vocabulary proves the motivating downstream structural profile. | Downstream consumer and project owner | Block release until addressed or formally deviated. |
| OBS-8 | Release verification output | Detect build, typecheck, full-test, clean-diff, boundary, and repeatability failures. | Maintainer | Block release/tag until fixed. |

Operator actions: Maintainers run validation commands, inspect snapshots and evidence artifacts, approve or reject milestone gates, classify public contract changes, review migration notes, and withhold release if any gate fails.

Monitoring window: From implementation branch start through the first release/tag decision and first downstream profile/runtime consumer review. No live service monitoring window is required.

N/A rationale: No production service, database, dashboard, alert, or on-call runbook is required because `markdown-engine` remains a local library.

Section status: Complete

## 16. Risks, Questions, Deviations, and Waivers

Risks:

| ID | Risk | Impact | Likelihood | Owner | Mitigation | Validation |
| --- | --- | --- | --- | --- | --- | --- |
| RISK-1 | Declarative syntax drifts into scripting, plugins, arbitrary expressions, or semantic evaluation. | Engine boundary fails and the package gains an execution/trust surface. | Medium | Implementer | Closed schema, unsupported-key rejection, no callbacks, no plugins, no semantic assertions, boundary audit. | VAL-2 / VAL-8 |
| RISK-2 | First-version selector/assertion vocabulary is too narrow for real profile needs. | Durable syntax ships without proving the motivating downstream value. | Medium | Downstream consumer / Implementer | Prove ODS structural fixture before release; keep unsupported assertions explicit. | VAL-4 / VAL-9 |
| RISK-3 | Diagnostics cannot always be source-specific. | CI users and agents may receive less actionable output than expected. | Medium | Implementer | Document targeting limits, target nearest available source, omit rather than fabricate unavailable ranges. | VAL-5 |
| RISK-4 | Versioning, result shape, diagnostic precedence, evidence hashes, or CLI behavior remains ambiguous. | Consumers may depend on undocumented behavior and repeatability evidence may lose value. | Medium | Project owner / Implementer | Contract-first docs, deterministic diagnostic inventory, hash input contract, CLI JSON union tests. | VAL-6 / VAL-7 / VAL-10 |
| RISK-5 | Core engine absorbs operational-design-spec or other profile-specific semantics. | `markdown-engine` becomes coupled to one downstream profile and blocks reuse. | Low | Implementer | Keep examples generic where possible, audit source for domain semantics, use ODS only as fixture data. | VAL-8 / VAL-9 |
| RISK-6 | Regex-like matching re-enters v1 and creates denial-of-service risk. | User-supplied regular expressions can catastrophically backtrack on large cells/spans. | Low | Boundary reviewer / Implementer | Reject `matches`, `pattern`, `regex`, and `regexp`; audit for profile-sourced regex compilation. | VAL-2 / VAL-8 |

Open questions:

None. Rationale: project-owner approval is represented as blocking `DEP-1`, not an open question. Final public names and any substrate gaps are bounded by `MS-1`, `MS-2`, and `DEV-*` controls.

Approved deviations:

None. Rationale: no deviations from this plan are approved at draft time.

Approved waivers:

None. Rationale: no review, milestone, validation, or compatibility requirements are waived.

Section status: Complete

## 17. Execution Traceability Matrix

| Source, objective, or evidence-led claim | Change surfaces | Package boundaries | Work packages | Milestones | Controls | Validation | Review | Release or ops | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SRC-1 / OBJ-1 / Closed validation profile syntax | SURF-1 / SURF-2 / SURF-7 / SURF-8 | PKG-1 / PKG-2 / PKG-6 | WP-1 / WP-2 / WP-5 | MS-1 / MS-2 | CTRL-1 / CTRL-2 / CTRL-7 | VAL-1 / VAL-2 / VAL-7 | REV-1 / REV-2 / REV-4 | REL-1 / REL-2 / OBS-1 | EVD-1 / EVD-2 / EVD-7 |
| SRC-1 / OBJ-2 / Compile and evaluate deterministic structural rules | SURF-2 / SURF-3 / SURF-4 / SURF-7 | PKG-3 / PKG-4 / PKG-6 | WP-1 / WP-3 / WP-4 | MS-1 / MS-2 | CTRL-2 / CTRL-3 / CTRL-4 | VAL-3 / VAL-4 | REV-2 / REV-4 | REL-1 / REL-2 / OBS-2 / OBS-3 | EVD-1 / EVD-3 / EVD-4 |
| SRC-1 / OBJ-3 / Diagnostics and repeatable evidence | SURF-2 / SURF-5 / SURF-6 / SURF-7 / SURF-8 | PKG-4 / PKG-5 / PKG-6 | WP-1 / WP-4 / WP-5 / WP-6 | MS-1 / MS-2 / MS-3 | CTRL-4 / CTRL-5 / CTRL-6 | VAL-5 / VAL-6 / VAL-10 | REV-2 / REV-5 | REL-2 / REL-3 / OBS-3 / OBS-4 / OBS-6 | EVD-5 / EVD-6 / EVD-10 |
| SRC-2 / SRC-3 / OBJ-4 / Public API, CLI, and compatibility | SURF-1 / SURF-5 / SURF-6 / SURF-8 / SURF-9 | PKG-1 / PKG-5 / PKG-6 | WP-5 / WP-6 | MS-2 / MS-3 | CTRL-1 / CTRL-4 / CTRL-6 | VAL-6 / VAL-7 / VAL-10 | REV-1 / REV-2 / REV-5 | REL-2 / REL-3 / REL-4 / OBS-6 / OBS-8 | EVD-6 / EVD-7 / EVD-10 |
| SRC-4 / SRC-5 / OBJ-6 / Boundary preservation | SURF-1 through SURF-9 | PKG-1 through PKG-6 | WP-1 / WP-2 / WP-3 / WP-4 / WP-5 / WP-6 | MS-1 / MS-2 / MS-3 | CTRL-2 / CTRL-3 / CTRL-7 | VAL-2 / VAL-8 / VAL-9 | REV-4 / REV-3 | REL-1 / REL-2 / REL-3 / OBS-5 / OBS-7 | EVD-2 / EVD-8 / EVD-9 |
| OBJ-5 / Downstream operational-design-spec exercise | SURF-7 / SURF-8 | PKG-3 / PKG-4 / PKG-6 | WP-6 | MS-3 | CTRL-3 / CTRL-7 | VAL-9 | REV-3 / REV-4 | REL-3 / OBS-7 | EVD-9 |
| First proving slice / Critical path hypothesis | SURF-1 / SURF-2 / SURF-7 | PKG-1 through PKG-6 | WP-1 | MS-1 | CTRL-1 / CTRL-2 / CTRL-3 / CTRL-4 / CTRL-5 | VAL-1 | REV-1 / REV-2 / REV-4 | REL-1 / OBS-1 / OBS-2 / OBS-3 | EVD-1 |
| RISK-1 / executable syntax drift | SURF-2 / SURF-3 / SURF-7 / SURF-8 / SURF-9 | PKG-2 / PKG-3 / PKG-6 | WP-1 / WP-2 / WP-3 / WP-5 / WP-6 | MS-1 / MS-2 / MS-3 | CTRL-2 / CTRL-7 | VAL-2 / VAL-8 | REV-4 | REL-1 / REL-2 / OBS-1 / OBS-5 | EVD-2 / EVD-8 |
| RISK-2 / vocabulary too narrow | SURF-2 / SURF-4 / SURF-7 / SURF-8 | PKG-3 / PKG-4 / PKG-6 | WP-1 / WP-3 / WP-4 / WP-6 | MS-1 / MS-2 / MS-3 | CTRL-1 / CTRL-3 | VAL-4 / VAL-9 | REV-3 / REV-2 | REL-3 / OBS-7 | EVD-4 / EVD-9 |
| RISK-3 / source diagnostic limits | SURF-2 / SURF-4 / SURF-7 / SURF-8 | PKG-4 / PKG-6 | WP-1 / WP-4 / WP-6 | MS-1 / MS-2 | CTRL-5 | VAL-5 | REV-2 / REV-5 | OBS-3 | EVD-5 |
| RISK-4 / public contract ambiguity | SURF-1 / SURF-5 / SURF-6 / SURF-8 / SURF-9 | PKG-1 / PKG-5 / PKG-6 | WP-1 / WP-5 / WP-6 | MS-1 / MS-2 / MS-3 | CTRL-1 / CTRL-4 / CTRL-6 | VAL-6 / VAL-7 / VAL-10 | REV-1 / REV-2 / REV-5 | REL-2 / REL-3 / OBS-4 / OBS-6 / OBS-8 | EVD-6 / EVD-7 / EVD-10 |
| RISK-5 / profile-specific semantic leakage | SURF-1 through SURF-8 | PKG-1 / PKG-3 / PKG-4 / PKG-6 | WP-1 / WP-4 / WP-5 / WP-6 | MS-1 / MS-2 / MS-3 | CTRL-3 | VAL-8 / VAL-9 | REV-3 / REV-4 | REL-1 / REL-2 / REL-3 / OBS-5 / OBS-7 | EVD-8 / EVD-9 |
| RISK-6 / regex-like matching risk | SURF-2 / SURF-7 | PKG-2 / PKG-6 | WP-2 / WP-5 / WP-6 | MS-2 / MS-3 | CTRL-2 | VAL-2 / VAL-8 | REV-4 | REL-2 / OBS-1 / OBS-5 | EVD-2 / EVD-8 |

Section status: Complete

## 18. Final Execution Gate

Entry gate: Blocked by `DEP-1`. The project owner must approve `docs/design/markdown-engine-declarative-validation-syntax-operational-design-spec.md` and this execution specification before `WP-1` starts.

Milestone approval gate: `MS-1`, `MS-2`, and `MS-3` are fully specified with verifier, due point, prerequisites, review gate, required evidence, approval decision, failure path, and manual verification guide. `MS-1` approval is required before broad source implementation; `DEP-2` resolution is required before `WP-3` starts and before `MS-2` approval; `VAL-8` / `EVD-8` boundary evidence is required before `MS-2` approval and merge; `MS-3` approval is required before release, tag, publication, or completion claim.

Completion gate: Completion requires all `WP-*` items complete, all pre-merge `VAL-*` evidence present, `MS-1` and `MS-2` approved, blocking reviews resolved, no open blocking `Q-*`, no unsupported syntax execution, no unapproved `DEV-*`, and no unapproved `WVR-*`.

Release gate: Release, tag, or package publication requires `MS-3` approval, `VAL-6` through `VAL-10` evidence, downstream consumer review, boundary/security review, CLI/docs quality-gate review, release containment notes, semver classification, clean release verification, and a separate explicit publish decision.

Handoff record: Handoff shall include links to `EVD-1` through `EVD-10`, final syntax/API/CLI/diagnostic/evidence docs, package command results, downstream ODS exercise notes, boundary audit, release/rollback decision, unresolved non-blocking follow-ups, and any approved deviations or waivers.

Final readiness state: Not ready. Rationale: `DEP-1` is a blocking entry dependency because the source design and this execution spec require project-owner approval before implementation starts. Once approval is recorded and no new blocking findings are open, the state may move to `Ready to execute`.

Section status: Complete
