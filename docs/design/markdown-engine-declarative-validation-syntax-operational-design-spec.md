# Markdown Engine Declarative Validation Syntax Operational Design Specification

## Document Control

| Field | Value |
| --- | --- |
| Title | Markdown Engine Declarative Validation Syntax |
| Status | Draft |
| Rigor level | `R2` |
| Rigor justification | The work creates a durable author-facing configuration syntax, compiler contract, validation result shape, diagnostic behavior, and CLI/API behavior for downstream consumers. It does not qualify for `R1` because config and public contract decisions are material outputs. It does not trigger `R3` because it introduces no authentication, authorization, secret handling, live customer data, irreversible storage, safety control, financial control, or network service. |
| Author(s) | Codex |
| Reviewers | Project owner, markdown-engine implementer, downstream profile/runtime consumer |
| Decision owner | Project owner |
| Target milestone or release | Declarative validation syntax implementation approval |
| Last updated | 2026-05-07 |
| Related docs | `RUNTIME_ARCHITECTURE.md`; `docs/contracts/api.md`; `docs/design/markdown-engine-operational-design-spec.md`; `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md` |
| Related tickets | none |

## 0. Executive Summary

Decision requested: Approve for implementation

Problem summary: `markdown-engine` consumers are unable to express reusable document-structure validation policies without TypeScript code because the current validation surface exposes only five hard-coded rule families, resulting in duplicated validators, profile-specific line scanners, and weaker source-targeted review evidence.

Proposed outcome: A closed declarative validation syntax that lets consumers define deterministic structural policies over the 1.0 rich IR, compile those policies into engine-owned rule plans, and receive stable source-targeted diagnostics without executing arbitrary code or adding profile semantics to the engine.

Why now: The 1.0 rich IR already exposes sections, text spans, tables, lists, source slices, annotations, and deterministic serialization, so the next leverage point is allowing downstream profiles to reuse that structure through declarative policy instead of custom code.

Top risks or unknowns:

- RISK-1: The syntax could expand into a scripting language and violate the deterministic engine boundary.
- RISK-2: The selector and assertion vocabulary could be too narrow to prove real profile value.
- RISK-4: Syntax versioning, document versioning, result shape, and diagnostic code contracts could create ambiguous compatibility expectations before the 1.0 package boundary is finalized.

Section status: Complete

## Layer 1: Problem and Requirements

## 1. Problem Definition

Problem declaration: Downstream Markdown profile authors are unable to define reusable deterministic document-structure validation policies because `markdown-engine` currently exposes only 5 fixed rule families and no declarative selector/assertion syntax over the 1.0 rich IR, resulting in repeated custom validators, duplicated table and section traversal, and inconsistent source-targeted diagnostics.

Affected actors or systems: Project owner, markdown-engine implementers, future `markdown-profile`, future `markdown-runtime`, docs quality gates, CI validation jobs, coding agents that need deterministic feedback, and maintainers of profile-backed Markdown filetypes.

Current-state baseline: As of 2026-05-07, direct inspection shows 5 supported deterministic rule families in `src/rules/index.ts`, 7 public rich IR query helper methods in `src/api/document-queries.ts`, 0 declarative profile syntax modules, 0 generic table-column validation rules, 0 generic ID-family validation rules, and 0 traceability validation rules.

Evidence or source: Direct inspection of `src/rules/index.ts`, `src/api/document-queries.ts`, `docs/contracts/api.md`, `RUNTIME_ARCHITECTURE.md`, and prior live analysis of `docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md` showing 26 sections, 23 tables, 1276 text spans, and source-addressable nodes available through the existing rich IR.

Consequence of inaction: Before the next profile-backed filetype or operational design spec validator is built, each consumer will continue implementing its own syntax, section traversal, table extraction, ID scanning, and traceability checks outside the engine, increasing contract drift before the 1.0 validation surface is stabilized.

Decision deadline or trigger: Before implementing operational-design-spec validation, AGENTS.md validation, TASK.md validation, or any downstream profile compiler that needs structural policies beyond the current fixed rule families.

Section status: Complete

## 2. Objectives and Non-Objectives

| ID | Statement | Measurement or decision horizon |
| --- | --- | --- |
| OBJ-1 | Provide a closed declarative syntax for deterministic structural validation over `EngineDocument` 1.0 rich IR. | Implementation review |
| OBJ-2 | Let downstream profiles express common section, table, ID, reference, text, and frontmatter policies without writing TypeScript validators. | First profile-backed validation exercise |
| OBJ-3 | Preserve `markdown-engine` as a deterministic local substrate with no arbitrary code execution, semantic judgment, or profile-specific meaning in core validation. | Boundary review |
| OBJ-4 | Produce stable diagnostics and evidence packets that are suitable for CI, review automation, and coding-agent consumption. | CLI/API acceptance review |
| NG-1 | This effort will not implement operational-design-spec, AGENTS.md, TASK.md, or any other profile semantics in core engine code. | Implementation review |
| NG-2 | This effort will not introduce arbitrary JavaScript, expression evaluation, user-supplied regular expressions, plugins, network calls, file watching, persistence, or LLM-backed checks. | Boundary review |
| NG-3 | This effort will not replace the existing typed API or remove the current fixed rule families. | Compatibility review |
| NG-4 | This effort will not decide runtime lens generation, MCP transport, agent adapters, or semantic review scoring. | Downstream package review |

Section status: Complete

## 3. Stakeholders and Decision Authorities

| Stakeholder or role | Interest | Required action |
| --- | --- | --- |
| Project owner | Approves syntax scope, boundary rules, and release posture. | Approve |
| Markdown-engine implementer | Implements syntax parsing, compilation, validation, diagnostics, and tests. | Review |
| Downstream profile/runtime consumer | Confirms the syntax can support profile compilation without domain leakage. | Review |
| CI/docs quality-gate user | Needs stable machine-readable validation output. | Inform |
| Security/data reviewer | Confirms declarative config remains inert local data and does not create a new execution boundary. | Consult |

Decision owner: Project owner

Section status: Complete

## 4. Constraints, Invariants, and Assumptions

| ID | Type | Statement | Source or rationale | Validation or resolution plan |
| --- | --- | --- | --- | --- |
| CON-1 | Invariant | The declarative syntax remains a closed deterministic vocabulary over public `EngineDocument` data. | `RUNTIME_ARCHITECTURE.md` defines deterministic validation as the engine boundary. | Validate with unsupported-key tests, boundary audit, and syntax schema tests in `VAL-2` and `VAL-8`. |
| CON-2 | Constraint | The syntax does not execute arbitrary code, compile user-supplied regular expressions, import plugins, call networks, read additional files, invoke LLMs, or evaluate semantic quality. | Prevents trust-boundary, performance, and product-scope drift. | Verify with implementation inspection and negative tests in `VAL-8`. |
| CON-3 | Constraint | Profile-specific concepts remain in downstream packages or caller-owned rule IDs, not in core rule semantics. | Existing rich IR design excludes SpecTrace/profile/runtime semantics. | Verify no profile-specific identifiers or hard-coded operational-design-spec logic enters engine modules in `VAL-8`. |
| CON-4 | Invariant | Validation diagnostics use existing `MarkdownDiagnostic` severity and source-range conventions where possible. | API contract already defines diagnostic shape. | Validate source-targeted fixtures in `VAL-5`. |
| CON-5 | Constraint | Public syntax, result, and diagnostic changes require semver classification before release. | Config syntax becomes a durable author-facing contract. | Verify contract docs and migration notes in `VAL-7`. |
| ASM-1 | Assumption | A small selector/assertion vocabulary can cover the first operational-design-spec structural checks. | Prior analysis found the current rich IR exposes required headings, tables, IDs, spans, and traceability source text. | Validate with an operational-design-spec fixture exercise in `VAL-9`. |
| ASM-2 | Assumption | YAML is the correct first serialized syntax because current config examples and frontmatter behavior are YAML-friendly. | Existing validation config examples use YAML-compatible object shapes. | Validate parser and JSON-equivalent object API coverage in `VAL-1` and `VAL-2`. |
| ASM-3 | Assumption | Existing rich IR source ranges are sufficient for first-pass source-targeted diagnostics. | Source slices and annotation targets are already present in the 1.0 draft path. | Validate duplicate ID, missing table column, and unresolved reference diagnostics in `VAL-5`. |

Section status: Complete

## 5. Requirements

| ID | Type | Priority | Requirement statement | Rationale | Verification |
| --- | --- | --- | --- | --- | --- |
| REQ-1 | Functional | Must | The system shall parse a YAML-compatible declarative validation document into an engine-owned validation profile model. | Consumers need a stable authoring format that does not require TypeScript validators. | VAL-1 / VAL-2 |
| REQ-2 | Functional | Must | The system shall reject unsupported syntax keys and invalid rule shapes with deterministic config diagnostics. | Unsupported declarations must fail honestly instead of being interpreted heuristically. | VAL-2 |
| REQ-3 | Functional | Must | The system shall compile declarative rules into a closed rule plan over public `EngineDocument` fields and query helpers. | Compilation separates authoring syntax from deterministic execution. | VAL-3 / VAL-8 |
| REQ-4 | Functional | Must | The system shall support selectors for document, section, heading, table, table row, table cell, text span, link, list, and frontmatter targets. | Common profile policies need structural selection without custom traversal. | VAL-3 / VAL-4 |
| REQ-5 | Functional | Must | The system shall support assertions for required sections, section order, required table columns, ID uniqueness, reference definition, text containment, exact text occurrence count, and frontmatter required fields. | These primitives cover the first target class of deterministic profile checks. | VAL-4 / VAL-9 |
| REQ-6 | Functional | Must | The system shall emit source-targeted diagnostics for validation failures when source ranges are available. | CI, editors, and agents need actionable locations. | VAL-5 |
| REQ-7 | Reliability | Must | The system shall produce byte-for-byte identical serialized validation results for identical input, profile, options, package version, and runtime version. | Declarative validation must remain suitable for evidence snapshots. | VAL-6 |
| REQ-8 | Security | Must | The system shall treat validation profiles as inert data without executing scripts, expressions, user-supplied regular expressions, imports, plugins, or network calls. | Declarative syntax must not create a new execution or denial-of-service boundary. | VAL-2 / VAL-8 |
| REQ-9 | Compatibility | Must | The system shall document syntax versioning, compatibility behavior, result shape, diagnostic codes, and migration limits before release. | Durable profiles need a contract rather than source-code inference. | VAL-7 |
| REQ-10 | Operability | Must | The system shall expose declarative validation through both public API and CLI entry points. | Library consumers and CI users need the same validation semantics. | VAL-10 |

Section status: Complete

## 6. Success Measures and Kill Criteria

| Measure | Baseline | Target or decision threshold | Evaluation date or decision event | Related IDs |
| --- | --- | --- | --- | --- |
| Structural profile coverage | 0 declarative profile syntax modules and 0 traceability rules as of 2026-05-07. | One operational-design-spec fixture validates required headings, table columns, ID uniqueness, text rules, and traceability without custom TypeScript profile code. | First profile exercise review | OBJ-1 / OBJ-2 / REQ-4 / REQ-5 |
| Boundary preservation | Existing boundary audit excludes profile/runtime/MCP/LLM behavior from core. | Boundary audit reports no scripts, plugins, network calls, LLM calls, user-supplied regular expression compilation, or profile-specific semantics in declarative validation execution. | Implementation review | OBJ-3 / REQ-8 |
| Diagnostic actionability | Current fixed rules emit source ranges only for some node-backed failures. | Representative fixtures show source ranges for missing table columns, duplicate IDs, missing references, empty selections, and invalid table cells where offsets exist. | Diagnostic fixture review | OBJ-4 / REQ-6 |
| Deterministic evidence | Existing engine has repeatability scripts and snapshots for parse/normalize/validation. | Ten repeated declarative validations produce identical serialized results and evidence packets. | Release readiness review | OBJ-4 / REQ-7 |
| Contract readiness | API docs currently list fixed validation rule families only. | Contract docs define syntax version, rule plan behavior, selector vocabulary, assertion vocabulary, diagnostic codes, CLI usage, and non-goals. | Contract review | REQ-9 / REQ-10 |

Section status: Complete

Layer 1 status: Complete

## Layer 2: Functional Specification

## 7. System Context and External Interfaces

System boundary: `markdown-engine` remains a local TypeScript package that accepts Markdown text, parsed/normalized documents, and caller-supplied validation profile data, then returns deterministic validation results and diagnostics.

External actors and systems: Package consumers, CLI users, CI jobs, downstream `markdown-profile`, future `markdown-runtime`, local file readers owned by callers, YAML parser dependency, and existing Markdown parser dependency. No remote service, database, daemon, runtime lens generator, MCP server, or agent adapter is part of this design.

Trust or control boundaries: Markdown input and validation profile data cross from caller-controlled content into the engine as untrusted local data. Validation profiles are parsed and validated as data only. Raw HTML, source slices, and profile values remain inert strings or JSON-safe values.

| Interface | Owner | Consumer or dependency | Inputs | Outputs |
| --- | --- | --- | --- | --- |
| Declarative validation API | `markdown-engine` | Package consumers and downstream profile compiler | `EngineDocument`, validation profile object, validation options | Validation result, rule results, diagnostics, optional evidence packet |
| Profile syntax parser | `markdown-engine` | YAML parser dependency and package consumers | YAML-compatible profile text or object value | Parsed profile model or config diagnostics |
| Rule compiler | `markdown-engine` | Internal validation pipeline | Parsed profile model and syntax version | Internal closed compiled rule plan or compile diagnostics |
| Rule evaluator | `markdown-engine` | Declarative validation API and CLI | Compiled rule plan and `EngineDocument` | Deterministic diagnostics and per-rule results |
| CLI validation command | `markdown-engine` | CI jobs, agents, local users | Markdown file path, profile config path, output format | Exit code and stable JSON validation output |
| Serialization and evidence output | `markdown-engine` | CI, review automation, agents | Validation result and options | Stable JSON evidence output |

Section status: Complete

## 8. Operational Scenarios and Functional Behavior

| ID | Trigger | Preconditions | Behavior or outcome | Related requirements |
| --- | --- | --- | --- | --- |
| FLOW-1 | A caller validates Markdown with a declarative profile. | Markdown text and profile data are supplied through the public API. | The caller receives deterministic rule results and diagnostics without writing custom validation code. | REQ-1 / REQ-3 / REQ-4 / REQ-5 / REQ-6 |
| FLOW-2 | A CLI user validates a file in CI. | The Markdown file and profile file are readable by the caller-owned CLI process. | The CLI emits stable output and exits non-zero when error-severity diagnostics exist. | REQ-7 / REQ-10 |
| FLOW-3 | A profile contains unsupported syntax. | The profile includes an unknown selector, assertion, or key. | The engine emits config diagnostics and does not execute partial unsupported behavior. | REQ-2 / REQ-8 |
| FLOW-4 | A downstream profile needs operational-design-spec structural checks. | The document uses numbered headings, tables, and ID families. | The profile validates required sections, table columns, ID uniqueness, and traceability through generic selectors and assertions. | REQ-4 / REQ-5 / REQ-9 |
| FLOW-5 | A validation failure is tied to a table cell or text span. | The normalized document contains source ranges for the selected target. | The diagnostic includes the nearest source range and a stable code. | REQ-6 / REQ-7 |
| FUNC-1 | Profile parsing is invoked. | The profile input is a YAML string or object value. | The API returns a parsed profile model or config diagnostics. | REQ-1 / REQ-2 |
| FUNC-2 | Rule compilation is invoked. | Profile parsing completed without error-severity diagnostics. | The engine creates an internal closed compiled rule plan that references public selectors and assertions only, or returns compile diagnostics when compilation fails. | REQ-3 / REQ-8 |
| FUNC-3 | Declarative validation is invoked. | A compiled rule plan and normalized document are supplied. | The API evaluates supported structural assertions and returns deterministic rule results. | REQ-4 / REQ-5 / REQ-7 |
| FUNC-4 | Source-targeted diagnostics are requested. | Validation failures occur on source-addressable targets. | Diagnostics include source ranges where available and omit locations rather than guessing. | REQ-6 |
| FUNC-5 | CLI validation is invoked. | Caller supplies file and profile paths. | The CLI reads local files, runs parse, normalize, compile, validate, and writes selected output format. | REQ-10 |
| FUNC-6 | Evidence serialization is invoked. | Validation completed. | The API serializes rule results, diagnostics, profile metadata, and deterministic hashes in stable key order. | REQ-7 / REQ-9 |

Section status: Complete

## 9. State Model, Faults, and Misuse Cases

States and transitions: The engine remains stateless across calls. Each validation run transitions through ProfileInputReceived, ProfileParsed, RulePlanCompiled, MarkdownParsed, DocumentNormalized, RulesEvaluated, EvidenceSerialized, and ResultReturned. Faults produce diagnostics or typed errors and do not mutate persistent state.

| Scenario | Expected behavior | Invariant maintained | Related IDs |
| --- | --- | --- | --- |
| Fault-1 | Profile YAML is invalid. | The API returns config diagnostics and no compiled rule plan. | REQ-1 / REQ-2 / FUNC-1 |
| Fault-2 | Profile syntax version is unsupported. | The API rejects the profile with a syntax-version diagnostic. | REQ-2 / REQ-9 / FUNC-1 |
| Fault-3 | Selector matches no nodes. | The rule returns a deterministic failure, warning, or empty-selection result according to the assertion contract. | REQ-4 / REQ-6 / FUNC-3 |
| Fault-4 | Source range is unavailable for a failed assertion. | The diagnostic omits source range and does not fabricate a location. | REQ-6 / FUNC-4 |
| Fault-5 | CLI cannot read the profile file. | The CLI exits with an operational error and does not emit a validation pass. | REQ-10 / FUNC-5 |
| Misuse-1 | A profile attempts to include script text, imports, plugin references, regular expression patterns, or network URLs as executable behavior. | The engine treats the values as unsupported config and does not execute or compile them. | REQ-2 / REQ-8 / FUNC-1 |
| Misuse-2 | A profile author attempts to encode semantic approval quality as deterministic syntax. | The engine rejects unsupported semantic assertions and leaves semantic review to downstream systems. | REQ-2 / REQ-8 / FUNC-2 |
| Misuse-3 | A downstream package tries to add operational-design-spec-specific rule semantics to core engine execution. | Boundary review blocks the change and keeps the meaning in a downstream profile package. | REQ-8 / REQ-9 / FUNC-2 |

Section status: Complete

## 10. External Service Levels and Acceptance Cases

External service expectations: The package has no network availability service level. Externally visible expectations are local deterministic execution, stable result shape for a given package version, explicit unsupported-syntax diagnostics, inert profile handling, and source-targeted diagnostics when source ranges are available.

| ID | Acceptance case | Expected result | Covers |
| --- | --- | --- | --- |
| ACC-1 | Parse a valid YAML profile with 3 rules using section, table, and ID assertions. | The API returns a parsed profile model with no diagnostics. | REQ-1 / FUNC-1 |
| ACC-2 | Parse a profile containing `script`, `plugin`, regex-like `matches` or `pattern` keys, or unknown assertion keys. | The API returns config diagnostics and no executable behavior or regular expression compilation. | REQ-2 / REQ-8 / FUNC-1 / FUNC-2 |
| ACC-3 | Compile a profile containing only supported selectors and assertions. | Internal inspection or test evidence shows a closed rule plan with no raw function callbacks or external handles. | REQ-3 / FUNC-2 |
| ACC-4 | Validate a document missing a required section. | The result contains an error diagnostic for the missing section. | REQ-4 / REQ-5 / FUNC-3 |
| ACC-5 | Validate a table whose required column is missing. | The result contains an error diagnostic targeted to the nearest table source range. | REQ-5 / REQ-6 / FUNC-4 |
| ACC-6 | Validate a duplicate `REQ-*` ID in a table cell. | The result contains deterministic duplicate-ID diagnostics with source ranges for duplicate occurrences where available. | REQ-5 / REQ-6 / FUNC-4 |
| ACC-7 | Validate the same document and profile 10 times. | Serialized validation output is byte-for-byte identical across all runs. | REQ-7 / FUNC-6 |
| ACC-8 | Review contract documentation before release. | Docs define syntax versioning, examples, selector vocabulary, assertion vocabulary, diagnostics, CLI behavior, and non-goals. | REQ-9 / FUNC-6 |
| ACC-9 | Run CLI validation with `--format json` on an invalid profile and on a failing document. | The CLI emits the documented profile-stage JSON shape for invalid profiles, emits the documented validation-result JSON shape for parsed profiles, and exits non-zero for error-severity findings. | REQ-2 / REQ-10 / FUNC-1 / FUNC-5 |
| ACC-10 | Run an operational-design-spec fixture profile. | The generic declarative syntax validates structural ODS requirements without hard-coded ODS semantics in core engine code. | REQ-4 / REQ-5 / REQ-8 / FUNC-3 |

Section status: Complete

## 11. Requirements-to-Behavior Traceability

| Requirement | Functional behaviors or flows | Acceptance coverage | Notes |
| --- | --- | --- | --- |
| REQ-1 | FLOW-1 / FUNC-1 | ACC-1 | Profile parsing is externally observable. |
| REQ-2 | FLOW-3 / FUNC-1 | ACC-2 | Unsupported syntax fails deterministically. |
| REQ-3 | FLOW-1 / FUNC-2 | ACC-3 | Compilation produces the execution model. |
| REQ-4 | FLOW-1 / FLOW-4 / FUNC-3 | ACC-4 / ACC-10 | Structural selectors provide generic access. |
| REQ-5 | FLOW-1 / FLOW-4 / FUNC-3 | ACC-4 / ACC-5 / ACC-6 / ACC-10 | Assertion vocabulary covers the first profile needs. |
| REQ-6 | FLOW-5 / FUNC-4 | ACC-5 / ACC-6 | Diagnostics are source-targeted where possible. |
| REQ-7 | FLOW-2 / FUNC-3 / FUNC-6 | ACC-7 | Repeatable output supports evidence use. |
| REQ-8 | FLOW-3 / FUNC-2 | ACC-2 / ACC-3 / ACC-10 | Inert config and closed compilation preserve the boundary. |
| REQ-9 | FLOW-4 / FUNC-6 | ACC-8 | Documentation is a release acceptance condition. |
| REQ-10 | FLOW-2 / FUNC-5 | ACC-9 | CLI behavior is externally visible. |

Section status: Complete

Layer 2 status: Complete

## Layer 3: Technical Specification

## 12. Architecture Overview

Architecture summary: Declarative validation adds a profile parser, syntax validator, rule compiler, selector resolver, assertion evaluator, diagnostic targeter, CLI entry point, and evidence serializer on top of the existing parse, normalize, query, validate, and serialize pipeline.

Major components and boundaries: The main components are profile syntax parser, profile schema validator, compiled rule-plan model, selector resolver, assertion evaluator, diagnostic builder, CLI adapter, and contract documentation. Boundaries remain between untrusted profile data and validated profile model, between profile compiler behavior and core deterministic execution, between structural assertions and downstream semantic review, and between local file reading in CLI code and pure API functions.

Deployment or runtime placement: The package runs in the caller's local Node.js process. The API path owns no file traversal, network service, database, daemon, LLM call, plugin loader, or persistent cache. The CLI reads only caller-specified local files.

Architecture rationale: A parser/compile/evaluate architecture satisfies `REQ-1` through `REQ-10` by keeping authoring syntax separate from execution, restricting execution to closed deterministic mechanisms, reusing existing rich IR queries, and preserving stable diagnostics and serialization.

Section status: Complete

## 13. Technical Mechanisms and Allocation

| ID | Mechanism | Component or owner | Responsibility | Related behaviors |
| --- | --- | --- | --- | --- |
| TECH-1 | Profile syntax version and schema | Profile parser | Define top-level fields such as `syntaxVersion`, `documentVersion`, `rules`, `id`, `severity`, `select`, and `assert`. | FUNC-1 |
| TECH-2 | YAML-compatible profile parser | Profile parser | Accept YAML text or object values and return a JSON-safe profile model. | FUNC-1 |
| TECH-3 | Closed rule compiler | Rule compiler | Convert supported selector/assertion declarations into immutable rule-plan records. | FUNC-2 |
| TECH-4 | Selector resolver | Selector layer | Resolve document, section, table, row, cell, text span, link, list, and frontmatter selections from public `EngineDocument` fields. | FUNC-3 |
| TECH-5 | Assertion evaluator | Rule evaluator | Evaluate required sections, order, table columns, ID uniqueness, references, text predicates, occurrence counts, and frontmatter fields. | FUNC-3 |
| TECH-6 | Diagnostic target resolver | Diagnostic builder | Select the best available source range or target for each rule failure. | FUNC-4 |
| TECH-7 | Deterministic evidence serializer | Serialization layer | Serialize profile metadata, rule results, diagnostics, and stable hashes in deterministic key order. | FUNC-6 |
| TECH-8 | CLI validation command | CLI adapter | Read local Markdown and profile files, invoke parse/normalize/compile/validate, write selected output, and set exit code. | FUNC-5 |
| TECH-9 | Boundary and compatibility audit | Test and review harness | Verify no arbitrary execution, profile-specific core semantics, network calls, or undocumented contract changes appear. | FUNC-2 / FUNC-6 |
| TECH-10 | Contract and examples | Documentation | Publish syntax, selectors, assertions, diagnostics, CLI usage, examples, and migration rules. | FUNC-1 / FUNC-5 / FUNC-6 |

Section status: Complete

## 14. Data, Schemas, and Compatibility

First-version authoring shape:

```yaml
syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0-draft
rules:
  - id: required-ods-sections
    severity: error
    select:
      target: document
    assert:
      sectionsRequired:
        order: strict
        headings:
          - Document Control
          - 0. Executive Summary
          - 5. Requirements
          - 17. Verification Strategy and Behavior-to-Mechanism Traceability

  - id: requirement-table-shape
    severity: error
    select:
      target: table
      section: 5. Requirements
      header:
        - ID
        - Type
        - Priority
        - Requirement statement
        - Rationale
        - Verification
    assert:
      ids:
        column: ID
        prefix: REQ
        unique: true
      text:
        column: Requirement statement
        containsExactlyOne: shall
        excludes:
          - and/or

  - id: req-traceability
    severity: error
    select:
      target: document
    assert:
      references:
        idsFrom:
          section: 5. Requirements
          column: ID
          prefix: REQ
        mustAppearIn:
          - 11. Requirements-to-Behavior Traceability
          - 17. Verification Strategy and Behavior-to-Mechanism Traceability
```

First-version public API and schema contract:

```ts
type DeclarativeValidationSeverity = "error" | "warning" | "info";
type DeclarativeOutputFormat = "json";
type DeclarativeSectionOrder = "none" | "strict";
type JsonSafeValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonSafeValue[]
  | { readonly [key: string]: JsonSafeValue };

interface ValidationProfile {
  syntaxVersion: "markdown-engine.validation@v1";
  /** Defaults to "1.0.0-draft" when omitted. */
  documentVersion?: EngineDocumentVersion;
  rules: readonly DeclarativeValidationRule[];
}

interface DeclarativeValidationRule {
  id: string;
  /** Defaults to "error" when omitted. */
  severity?: DeclarativeValidationSeverity;
  select: DeclarativeSelector;
  assert: DeclarativeAssertion;
}

type DeclarativeSelector =
  | { target: "document" }
  | { target: "section"; title?: string; depth?: number }
  | { target: "heading"; text?: string; depth?: number }
  | {
      target: "table";
      section?: string;
      header?: readonly string[];
    }
  | {
      target: "tableRow";
      section?: string;
      tableHeader?: readonly string[];
      where?: DeclarativeTableCellPredicate;
    }
  | {
      target: "tableCell";
      section?: string;
      tableHeader?: readonly string[];
      column: string;
      rowWhere?: DeclarativeTableCellPredicate;
    }
  | {
      target: "textSpan";
      section?: string;
      nodeType?: EngineNode["type"];
      textIncludes?: string;
    }
  | { target: "link"; section?: string; text?: string; url?: string }
  | { target: "list"; section?: string; ordered?: boolean; depth?: number }
  | { target: "frontmatter"; field?: string };

interface DeclarativeTableCellPredicate {
  column: string;
  equals?: string;
  includes?: string;
}

interface DeclarativeAssertion {
  sectionsRequired?: {
    headings: readonly string[];
    order?: DeclarativeSectionOrder;
  };
  sectionOrder?: {
    headings: readonly string[];
  };
  tableColumnsRequired?: {
    columns: readonly string[];
  };
  ids?: {
    column?: string;
    prefix?: string;
    unique?: boolean;
    caseSensitive?: boolean;
  };
  references?: {
    idsFrom: DeclarativeIdSource;
    mustAppearIn: readonly string[];
  };
  text?: {
    column?: string;
    contains?: string;
    containsExactlyOne?: string;
    excludes?: readonly string[];
  };
  textOccurrenceCount?: {
    text: string;
    count: number;
    column?: string;
  };
  frontmatterRequired?: {
    fields: readonly string[];
  };
}

interface DeclarativeIdSource {
  section?: string;
  column?: string;
  prefix?: string;
}

interface DeclarativeValidationApi {
  parseValidationProfile(
    input: string | JsonSafeValue,
    options?: { path?: string },
  ): DeclarativeProfileParseResult;
  validateWithProfile(
    document: EngineDocument,
    profile: ValidationProfile,
    options?: DeclarativeValidationOptions,
  ): DeclarativeValidationResult;
}

interface DeclarativeProfileParseResult {
  profile?: ValidationProfile;
  diagnostics: readonly MarkdownDiagnostic[];
}

type DeclarativeValidationCliJsonResult =
  | DeclarativeValidationResult
  | DeclarativeValidationConfigErrorResult;

interface DeclarativeValidationConfigErrorResult {
  valid: false;
  stage: "profile";
  diagnostics: readonly MarkdownDiagnostic[];
  ruleResults: readonly [];
  profile?: undefined;
  evidence?: undefined;
}

interface DeclarativeValidationOptions {
  path?: string;
  includeEvidence?: boolean;
}

interface DeclarativeValidationResult extends ValidationResult {
  profile: {
    syntaxVersion: "markdown-engine.validation@v1";
    documentVersion: EngineDocumentVersion;
    ruleCount: number;
  };
  evidence?: DeclarativeValidationEvidence;
}

interface DeclarativeValidationEvidence {
  /** SHA-256 of the canonical serialized EngineDocument validation input, excluding document.path. */
  inputHash: string;
  /** SHA-256 of the canonical resolved ValidationProfile after defaults. */
  profileHash: string;
  engineVersion: string;
  runtimeVersion: string;
  ruleResults: readonly ValidationRuleResult[];
  diagnostics: readonly MarkdownDiagnostic[];
}
```

Schema closure and validation rules:

- Top-level profile keys are exactly `syntaxVersion`, `documentVersion`, and `rules`.
- Profile `documentVersion` is optional and defaults to `1.0.0-draft` before compilation. Declarative validation requires a normalized `EngineDocument` whose `version` equals the resolved profile `documentVersion`; mismatch emits `profile.config.documentVersionMismatch` and does not evaluate rules.
- Rule keys are exactly `id`, `severity`, `select`, and `assert`.
- Rule `severity` is optional and defaults to `error` before compilation and evaluation. Unsupported severity values produce `profile.config.invalidShape` diagnostics.
- Selector objects, known assertion objects, and nested config objects are closed; unsupported keys produce `profile.config.unsupportedKey` diagnostics and stop compilation.
- `assert` contains at least one supported assertion member. Multiple assertion members in one rule are evaluated in stable object-key order after unsupported-key validation.
- Unknown first-level assertion members under `assert` produce `profile.compile.unsupportedAssertion` diagnostics, except regex-like keys whose unsupported-key diagnostic precedence is defined below. Unsupported `select.target` values produce `profile.compile.unsupportedSelector` diagnostics. Supported selectors combined with incompatible supported assertions produce `profile.compile.incompatibleSelectorAssertion` diagnostics. These three compile diagnostics take precedence over `profile.config.invalidShape` for selector and assertion vocabulary errors.
- `profile.config.invalidShape` covers missing required fields, wrong primitive/container types, empty required arrays, invalid scalar values such as unsupported `severity` or `order`, table predicates with neither `equals` nor `includes`, and empty required strings.
- First-version matching is limited to exact string equality, substring inclusion, prefix selection, and exact occurrence counts. Regex-like keys such as `matches`, `pattern`, `regex`, and `regexp` are not part of the v1 vocabulary; their presence produces `profile.config.unsupportedKey` diagnostics and stops compilation. This unsupported-key precedence applies wherever those keys appear in the profile, including as first-level members under `assert`, so `assert.matches` emits `profile.config.unsupportedKey` rather than `profile.compile.unsupportedAssertion`.
- String comparisons use deterministic Unicode code point comparison over normalized `EngineDocument` text. Heading, section, header, column, `equals`, and frontmatter field names match exactly. `includes`, `contains`, `containsExactlyOne`, `excludes`, and `textOccurrenceCount.text` use non-overlapping literal substring matching. `containsExactlyOne` requires exactly one non-overlapping occurrence per selected target, or per selected cell when `column` is set.
- Table row predicates use the named `column` in the candidate row. `column` and each supplied `equals` or `includes` value must be non-empty strings. At least one of `equals` or `includes` is required. When both are present, the predicate matches only when both tests pass; evaluation order is `equals` and then `includes`. A missing predicate column makes that row fail the predicate rather than emitting a diagnostic. `where` filters `tableRow` selector results. `rowWhere` filters candidate rows before a `tableCell` selector selects its required `column`. If filtering removes every candidate target, the rule follows the empty selector behavior below.
- ID assertions collect ID tokens from the selected target text, or from the specified table `column` when `column` is set. `prefix: REQ` matches complete tokens that start with `REQ-`; the default ID token grammar is `[A-Za-z][A-Za-z0-9]*-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*`. `ids.caseSensitive` defaults to `true`; when `false`, prefix filtering and ID uniqueness comparison are case-insensitive, while emitted diagnostics preserve original text.
- `references.idsFrom` collects source IDs using the same ID-token rules. When `idsFrom.column` is set, only cells in that column within the optional `idsFrom.section` contribute source IDs; other references in the same section do not create additional source IDs.
- `references.mustAppearIn` values are exact section titles. For each source ID and each listed target section, the target section body must contain at least one complete ID-token occurrence equal to that source ID. Matching is case-sensitive. If a source section is also a target section, the source occurrence itself does not satisfy the reference requirement. A missing reference diagnostic targets the source ID location when available, otherwise the target section heading, and never fabricates a source range.
- Empty selector result behavior is assertion-specific: required-section and required-frontmatter assertions evaluate against the document, while table, ID, reference, text, and occurrence assertions fail with `profile.validation.emptySelection` unless explicitly documented otherwise.

Selector/assertion compatibility:

| Assertion | Compatible selector targets | Additional compatibility rules |
| --- | --- | --- |
| `sectionsRequired` | `document` | Evaluates the document section tree. Any other selector target produces `profile.compile.incompatibleSelectorAssertion`. |
| `sectionOrder` | `document` | Evaluates the document section tree. Any other selector target produces `profile.compile.incompatibleSelectorAssertion`. |
| `tableColumnsRequired` | `table` | Evaluates each selected table. Any other selector target produces `profile.compile.incompatibleSelectorAssertion`. |
| `ids` without `column` | `document`, `section`, `heading`, `table`, `tableRow`, `tableCell`, `textSpan`, `link`, `list` | Collects ID tokens from selected target text. `frontmatter` is incompatible. |
| `ids` with `column` | `table`, `tableRow` | Collects ID tokens from the named column in selected tables or rows. Any non-table selector, including `tableCell`, produces `profile.compile.incompatibleSelectorAssertion`. |
| `references` | `document` | `idsFrom` and `mustAppearIn` define source and target sections. Any other selector target produces `profile.compile.incompatibleSelectorAssertion`. |
| `text` without `column` | `document`, `section`, `heading`, `table`, `tableRow`, `tableCell`, `textSpan`, `link`, `list` | Evaluates literal text predicates against selected target text. `frontmatter` is incompatible. |
| `text` with `column` | `table`, `tableRow` | Evaluates literal text predicates against the named column in selected tables or rows. Any non-table selector, including `tableCell`, produces `profile.compile.incompatibleSelectorAssertion`. |
| `textOccurrenceCount` without `column` | `document`, `section`, `heading`, `table`, `tableRow`, `tableCell`, `textSpan`, `link`, `list` | Counts non-overlapping literal occurrences in selected target text. `frontmatter` is incompatible. |
| `textOccurrenceCount` with `column` | `table`, `tableRow` | Counts non-overlapping literal occurrences in the named column in selected tables or rows. Any non-table selector, including `tableCell`, produces `profile.compile.incompatibleSelectorAssertion`. |
| `frontmatterRequired` | `document`, `frontmatter` | Evaluates document frontmatter fields. If the selector is `frontmatter`, its optional `field` filter must be omitted; otherwise the pair produces `profile.compile.incompatibleSelectorAssertion`. |

When one rule contains multiple assertion members, every assertion member must be compatible with the selector. Compilation stops before evaluation when any member is incompatible.

Evidence hash contract: `inputHash` and `profileHash` are lowercase hexadecimal SHA-256 digests over UTF-8 bytes. `inputHash` hashes the stable JSON serialization of the canonical `EngineDocument` validation input: the `EngineDocument` supplied to `validateWithProfile` after omitting the top-level `document.path` field. The name refers to the validation input after parsing and normalization, not raw Markdown bytes. Structural node target paths such as `target.path` remain part of the canonical input because they are document structure, not caller file paths. `profileHash` hashes the stable JSON serialization of the resolved `ValidationProfile` after applying `documentVersion` and rule `severity` defaults. Both serializations use the same deterministic object-key ordering and `undefined` omission rules as the public `serialize` API. Raw Markdown bytes, raw YAML bytes, YAML comments, top-level `EngineDocument.path`, and caller file paths are not part of the first-version evidence hash contract. `DeclarativeValidationOptions.includeEvidence` controls whether evidence is emitted and is not included in either hash. `DeclarativeValidationOptions.path` is accepted for API symmetry but has no first-version effect on diagnostics, result fields, or evidence hashes; any future path-bearing result behavior requires an explicit contract update.

Compiled rule-plan records are internal implementation details. They are not exported from the package root, are not serialized in public results, and carry no semver stability guarantee. Public compatibility applies only to the authoring profile syntax, public API function names and result shapes, CLI flags and output formats, diagnostic codes, and documented evidence fields.

First-version diagnostic inventory:

| Code | Severity source | Emitted when |
| --- | --- | --- |
| `profile.config.invalidYaml` | `error` | YAML text cannot be parsed into a JSON-safe profile value. |
| `profile.config.unsupportedSyntaxVersion` | `error` | `syntaxVersion` is missing or is not `markdown-engine.validation@v1`. |
| `profile.config.invalidShape` | `error` | A required field is missing, a field has the wrong type, a required array or string is empty, an invalid scalar value is supplied, or a table predicate omits both `equals` and `includes`. |
| `profile.config.documentVersionMismatch` | `error` | The resolved profile `documentVersion` does not equal the supplied `EngineDocument.version`. |
| `profile.config.unsupportedKey` | `error` | A closed profile, rule, selector, known assertion object, or nested object contains an unknown key, including unsupported regex-like keys such as `matches`, `pattern`, `regex`, or `regexp`. |
| `profile.compile.unsupportedSelector` | `error` | `select.target` is not one of the first-version supported targets. |
| `profile.compile.unsupportedAssertion` | `error` | A first-level member of `assert` is not one of the first-version supported assertions. |
| `profile.compile.incompatibleSelectorAssertion` | `error` | A supported selector target is paired with a supported assertion member or column option that the compatibility matrix does not allow. |
| `profile.validation.emptySelection` | Rule severity | A rule cannot evaluate because its selector matches no applicable target. |
| `profile.validation.assertionFailed` | Rule severity | A supported assertion evaluates and fails. |
| `profile.validation.referenceMissing` | Rule severity | A reference assertion finds an ID token that is absent from a required target section. |
| `profile.validation.duplicateId` | Rule severity | An ID uniqueness assertion finds repeated IDs. |

First-version CLI contract: declarative validation is exposed as `markdown-engine validate --file <markdown-file> --profile <profile-file> [--format json]`. The only first-version output format is `json`; unsupported `--format` values exit with code `2` and usage text. JSON output is the stable serialized `DeclarativeValidationCliJsonResult` union above, using deterministic key order. Profile parse, shape, syntax-version, unsupported-key, unsupported-selector, unsupported-assertion, and incompatible selector/assertion failures emit `DeclarativeValidationConfigErrorResult` with `stage: "profile"`, `valid: false`, config or compile diagnostics, empty `ruleResults`, no `profile`, and no `evidence`; the CLI does not parse or validate the Markdown file after a profile-stage failure. A successfully parsed and compiled profile emits `DeclarativeValidationResult` whether document validation passes or fails. Error-severity config or validation diagnostics exit with code `1`; CLI usage and local file read errors exit with code `2`; successful validation exits with code `0`. The existing parse/normalize CLI path remains available for rich IR output and is not replaced by this command.

| Change | Type | Compatibility impact | Reversibility | Mitigation |
| --- | --- | --- | --- | --- |
| Declarative validation syntax | Config | Creates a durable author-facing syntax version and examples. | Reversible before release; semver-controlled after release | Add explicit `syntaxVersion`, contract docs, fixture snapshots, and unsupported-syntax diagnostics. |
| Compiled rule-plan model | Internal schema | Remains private implementation detail with no public compatibility promise. | Reversible before release and refactorable after release if public behavior is unchanged | Do not export compiled plan types, do not serialize plans, and test public behavior rather than internal record layout. |
| Validation result evidence shape | Schema | Extends validation output for profile metadata and deterministic evidence. | Reversible before release; semver-controlled after release | Document result fields and serialize with stable key order. |
| CLI validation command | API / CLI | Adds new command behavior, JSON output, and exit codes. | Reversible before release; semver-controlled after release | Add CLI usage docs, tests, and compatibility notes. |
| Diagnostic codes | Schema | Adds new machine-readable diagnostic codes for profile and rule failures. | Reversible before release; semver-controlled after release | Maintain diagnostic inventory and snapshot tests. |

Section status: Complete

## 15. Control Logic and Non-Functional Controls

Control logic summary: Each validation run parses the profile, validates syntax version and schema, rejects unsupported executable or regex-like declarations, compiles supported rules into data-only rule-plan records, resolves selectors against a normalized `EngineDocument`, evaluates assertions in document order, builds diagnostics with deterministic ordering, and serializes results with stable key order.

Concurrency and ordering model: The engine remains invocation-local. Rule evaluation follows profile rule order, selector matches follow document order, diagnostics sort by source range when present and then by rule ID, diagnostic code, message, and stable target ID. No shared mutable state is used.

Failure recovery model: Invalid profile syntax, unsupported keys, compilation failures, selector misses, and validation failures return diagnostics. CLI local file read failures return operational errors. The engine performs no persistent mutation, so rollback is to withhold release or revert the implementation branch.

| Requirement | Mechanism | Notes |
| --- | --- | --- |
| REQ-1 | TECH-1 / TECH-2 | Profile parsing is data-only and YAML-compatible. |
| REQ-2 | TECH-1 / TECH-2 / TECH-3 | Unsupported config stops before evaluation. |
| REQ-3 | TECH-3 / TECH-9 | Rule plans restrict executable behavior to closed records. |
| REQ-4 | TECH-4 | Selectors resolve over public rich IR views. |
| REQ-5 | TECH-5 | Assertions remain deterministic structural predicates. |
| REQ-6 | TECH-6 | Diagnostic targeting uses available source ranges and targets. |
| REQ-7 | TECH-7 | Serialization and stable ordering protect repeatability. |
| REQ-8 | TECH-3 / TECH-9 | Boundary audit and closed compiler prevent executable config and user-supplied regular expression compilation. |
| REQ-9 | TECH-10 | Contract docs define compatibility and syntax behavior. |
| REQ-10 | TECH-8 / TECH-10 | CLI and docs expose validation for CI users. |

Section status: Complete

## 16. Observability, Operations, Rollout, and Rollback

| Signal | Type | Purpose | Consumer |
| --- | --- | --- | --- |
| Profile parser fixture output | Log | Show valid and invalid syntax behavior. | Implementer and reviewer |
| Declarative rule diagnostic snapshots | Audit | Show source-targeted rule failures and stable diagnostic codes. | Project owner and CI users |
| Repeatability output | Log | Show identical serialized results over repeated runs. | Reviewer |
| Boundary audit output | Audit | Show no scripts, plugins, network calls, LLM calls, user-supplied regular expression compilation, or profile-specific semantics entered core execution. | Project owner |
| CLI validation test output | Log | Show CLI exit codes and formats. | CI user and implementer |
| Contract documentation checklist | Audit | Show syntax, results, diagnostics, examples, and non-goals are documented. | Downstream consumers |

Rollout plan: Implement the syntax behind the explicit syntax version `markdown-engine.validation@v1` and the CLI contract `markdown-engine validate --file <markdown-file> --profile <profile-file> [--format json]` with `json` as the only first-version output format. Add parser, compiler, evaluator, diagnostic, repeatability, evidence-hash, selector/assertion compatibility, table-predicate, CLI, regex-rejection, reference-semantics, and boundary tests before documenting the syntax as stable. Keep existing fixed rule families intact. Require project-owner approval before changing public syntax names, API function names, CLI flags, or CLI defaults from this specification.

Rollback or containment plan: Trigger rollback if unsupported syntax is evaluated, user-supplied regular expressions are compiled, arbitrary code execution appears, profile-specific semantics enter core engine code, deterministic output fails, or downstream review rejects the vocabulary as unusable. The rollback action is to withhold release and revert declarative validation changes on the implementation branch; containment limit is package source and documentation because no persistent user data exists.

Operator actions: Run targeted profile parser tests, declarative validation tests, selector/assertion compatibility tests, table-predicate tests, evidence-hash repeatability tests, regex-rejection tests, reference-semantics tests, CLI tests, repeatability proof, boundary audit, typecheck, package build, and contract documentation check before requesting release approval.

Section status: Complete

## 17. Verification Strategy and Behavior-to-Mechanism Traceability

| ID | Verification method | What is verified | Related IDs |
| --- | --- | --- | --- |
| VAL-1 | Test | Valid YAML-compatible profile input parses into the public profile model. | REQ-1 / FUNC-1 / TECH-1 / TECH-2 |
| VAL-2 | Test | Invalid syntax, unsupported keys, unsupported versions, unsupported selector targets, unsupported assertion members, incompatible selector/assertion pairs, invalid table predicates, regex-like keys, and unsafe declarations produce the documented config or compile diagnostics and no compiled rule plan. | REQ-2 / REQ-8 / FUNC-1 / TECH-1 / TECH-2 / TECH-3 |
| VAL-3 | Test | Supported declarations compile into closed data-only rule-plan records over public `EngineDocument` fields. | REQ-3 / REQ-4 / FUNC-2 / TECH-3 / TECH-4 |
| VAL-4 | Test / Snapshot | Section, table, table-predicate, ID-token, reference, literal-text, and frontmatter assertions evaluate with the documented matching, cardinality, and source-targeting semantics against representative rich IR fixtures. | REQ-4 / REQ-5 / FUNC-3 / TECH-4 / TECH-5 |
| VAL-5 | Test / Snapshot | Missing table column, duplicate ID, missing reference, empty selection, and invalid table-cell failures emit deterministic diagnostics with source ranges when available and no fabricated locations when unavailable. | REQ-6 / FUNC-4 / TECH-6 |
| VAL-6 | Test | Ten repeated validations produce byte-for-byte identical serialized result and evidence output, including stable SHA-256 `inputHash` and `profileHash` values from the documented canonical inputs. | REQ-7 / FUNC-6 / TECH-7 |
| VAL-7 | Review | Contract docs cover syntax versioning, selectors, assertions, diagnostics, result shape, examples, CLI behavior, compatibility, and non-goals. | REQ-9 / FUNC-6 / TECH-10 |
| VAL-8 | Boundary audit | No arbitrary JavaScript, user-supplied regular expression compilation, plugin loading, network call, LLM call, file watching, persistence, or profile-specific core semantic behavior appears in declarative validation execution; a `^(a+)+$` profile fixture is rejected as unsupported config. | REQ-3 / REQ-8 / FUNC-2 / TECH-3 / TECH-9 |
| VAL-9 | Downstream exercise | An operational-design-spec structural profile validates required headings, tables, IDs, text constraints, and traceability without hard-coded ODS engine semantics. | REQ-4 / REQ-5 / REQ-8 / FUNC-3 / TECH-4 / TECH-5 / TECH-9 |
| VAL-10 | Test | CLI validation reads caller-specified local files, emits the selected output format, emits the profile-stage JSON shape for profile parse or compile failures, emits the validation-result JSON shape after profile compilation succeeds, and sets exit code from error-severity diagnostics. | REQ-2 / REQ-10 / FUNC-1 / FUNC-5 / TECH-8 / TECH-10 |

| Behavior or requirement | Mechanisms | Verification |
| --- | --- | --- |
| REQ-1 | TECH-1 / TECH-2 | VAL-1 |
| REQ-2 | TECH-1 / TECH-2 / TECH-3 | VAL-2 |
| REQ-3 | TECH-3 / TECH-9 | VAL-3 / VAL-8 |
| REQ-4 | TECH-4 | VAL-3 / VAL-4 / VAL-9 |
| REQ-5 | TECH-5 | VAL-4 / VAL-9 |
| REQ-6 | TECH-6 | VAL-5 |
| REQ-7 | TECH-7 | VAL-6 |
| REQ-8 | TECH-3 / TECH-9 | VAL-2 / VAL-8 / VAL-9 |
| REQ-9 | TECH-10 | VAL-7 |
| REQ-10 | TECH-8 / TECH-10 | VAL-10 |
| FUNC-1 | TECH-1 / TECH-2 | VAL-1 / VAL-2 |
| FUNC-2 | TECH-3 / TECH-9 | VAL-3 / VAL-8 |
| FUNC-3 | TECH-4 / TECH-5 | VAL-4 / VAL-9 |
| FUNC-4 | TECH-6 | VAL-5 |
| FUNC-5 | TECH-8 / TECH-10 | VAL-10 |
| FUNC-6 | TECH-7 / TECH-10 | VAL-6 / VAL-7 |

Section status: Complete

## 18. Alternatives, Risks, Open Questions, and Final Exit

| Alternative | Reason considered | Reason rejected |
| --- | --- | --- |
| Add more hard-coded rule families only | Lowest implementation complexity and matches current rule registry. | Does not let profiles express reusable structural contracts without new engine code for every rule. |
| Put operational-design-spec validation directly in core engine | Fastest path for the motivating use case. | Violates the domain-neutral boundary and would couple engine releases to one profile. |
| Expose arbitrary JavaScript predicates in config | Maximizes flexibility. | Creates an execution boundary, weakens determinism, and introduces security review scope. |
| Allow caller-supplied regular expressions in first-version matching | Improves flexible text and ID matching. | JavaScript regular expressions can catastrophically backtrack against long spans or table cells; first-version syntax uses exact, literal, and token matching instead. |
| Build declarative syntax only in downstream `markdown-profile` | Keeps core engine smaller. | Duplicates rich IR traversal and diagnostic targeting outside the engine, reducing value of the core package. |
| Use JSON Schema as the only validation language | Familiar ecosystem and tooling. | JSON Schema does not naturally express Markdown sections, source ranges, table cell coordinates, or traceability over rich IR. |

| ID | Statement | Likelihood | Consequence | Mitigation |
| --- | --- | --- | --- | --- |
| RISK-1 | Declarative syntax may drift into a general scripting or plugin language. | Medium | High | Enforce `CON-1`, `CON-2`, `REQ-8`, `TECH-3`, and `VAL-8`. |
| RISK-2 | The first selector/assertion vocabulary may be too narrow for real profile needs. | Medium | Medium | Prove value with `VAL-9` before release and keep unsupported assertions explicit. |
| RISK-3 | Diagnostics may be less source-specific than users expect for missing or cross-section failures. | Medium | Medium | Document source-targeting limits and validate nearest-target behavior in `VAL-5`. |
| RISK-4 | Syntax versioning, document versioning, result shape, and diagnostic code compatibility may create ambiguous implementation or migration expectations. | Medium | Medium | Use separate `syntaxVersion` and `documentVersion` fields, deterministic diagnostic precedence, documented evidence hashes, and contract review coverage in `VAL-7`. |
| RISK-5 | Engine core may absorb profile-specific vocabulary during examples and tests. | Low | High | Keep examples generic where possible and require boundary audit in `VAL-8`. |
| RISK-6 | Regex-like matching could re-enter the v1 vocabulary and create denial-of-service risk through catastrophic backtracking. | Low | High | Keep `matches`, `pattern`, `regex`, and `regexp` unsupported in v1, reject them through `VAL-2`, and audit for regular expression compilation in `VAL-8`. |

No open questions

Waivers: none

Final readiness statement: Ready for implementation

Section status: Complete

## Final Consistency Gate

| Check | Status |
| --- | --- |
| Every section from 0 through 18 has an allowed section status. | Pass |
| Every `REQ-*` from section 5 appears in section 11 and section 17. | Pass |
| Every `FUNC-*` from section 8 appears in section 17. | Pass |
| Every `TECH-*` from section 13 appears in section 17. | Pass |
| Every `ACC-*` referenced anywhere in the document is defined in section 10. | Pass |
| Every `VAL-*` referenced anywhere in the document is defined in section 17. | Pass |
| Every `Q-*` row has owner, due date, and resolution plan, or no open questions is stated. | Pass |
| No section is marked `Deferred`. | Pass |
| No `R3` trigger applies. | Pass |
| Final readiness statement matches selected `R2` rigor level. | Pass |

## Internal Review Record

| Field | Value |
| --- | --- |
| Review mode | Author-mode internal review after first draft |
| Proposed rigor level | `R2` |
| Reviewed rigor level | `R2` |
| Calibration result | Accept |
| Rationale | The design requests implementation approval for durable syntax, config, CLI/API, and diagnostic contracts. It is too contract-heavy for `R1` and has no `R3` trigger because it remains local, data-only, reversible before release, and does not touch safety, auth, secrets, compliance, live data, irreversible storage, or broad production operations. |
| Structural review result | Pass after revision |
| Semantic review result | Pass after revision |
| Traceability review result | Pass after revision |
| Final verdict | Approve for implementation, pending project-owner review |

| Finding ID | Severity | Status | Section | Finding | Required action | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| ST-1 | Major | Resolved | 14 | The initial draft described the syntax concept but did not include enough first-version schema detail to support implementation review. | Add first-version YAML and TypeScript shapes, explicit syntax versioning, and compatibility impacts. | Codex |
| ST-2 | Major | Resolved | 17 | The initial draft did not prove that every required behavior mapped to mechanisms and verification. | Add complete `REQ-*` and `FUNC-*` traceability rows in section 17. | Codex |
| SM-1 | Major | Resolved | 5 / 8 / 13 | The initial draft risked making the syntax too broad because selector and assertion vocabularies were not bounded. | Define a closed first vocabulary and explicit unsupported-syntax behavior. | Codex |
| SM-2 | Minor | Resolved | 16 | The initial rollout text did not state enough containment triggers for boundary violations. | Add rollback triggers for arbitrary execution, profile-specific semantics, and repeatability failure. | Codex |
| TR-1 | Major | Resolved | 11 / 17 | The initial draft omitted CLI and evidence behavior from one traceability path. | Add `REQ-10`, `FUNC-5`, `FUNC-6`, `ACC-9`, `VAL-10`, and corresponding mechanism mappings. | Codex |
| CR-1 | Major | Resolved | 14 / 16 | Consensus review found that the R2 contract left selector/assertion schemas, compiled plan visibility, evidence/result shape, diagnostic inventory, and CLI/API defaults unresolved. | Define the first-version closed schema, declare compiled plans internal, define result/evidence fields, define diagnostic codes, fix CLI/API contracts, and make public names/defaults explicit. | Codex |
| CR-2 | Major | Resolved | 14 | Consensus review found that the first-version YAML example violated the closed selector/assertion schema and that omitted rule severity had no defined behavior. | Align the YAML example with the target-discriminated table selector and `references` assertion, and define omitted severity as defaulting to `error`. | Codex |
| CR-3 | Major | Resolved | 14 / 16 | Review found that optional `documentVersion` had no default or mismatch behavior, and that first-version CLI promised text and SARIF without defining their contracts. | Default omitted `documentVersion` to `1.0.0-draft`, add document-version mismatch diagnostics, and narrow first-version CLI output to stable JSON only. | Codex |
| SM-3 | Major | Resolved | 14 / 15 / 17 | External review found that regex-like `matches` and `pattern` fields were unbounded and could undermine deterministic local validation through catastrophic backtracking. | Remove regex-like fields from the v1 schema, define them as unsupported keys, add acceptance and verification coverage for rejection, and audit that declarative validation performs no user-supplied regular expression compilation. | Codex |
| SM-4 | Major | Resolved | 14 / 17 | External review found that reference assertions did not define ID extraction, token matching, target section cardinality, case behavior, or source targeting. | Define ID-token grammar, source ID collection, `mustAppearIn` section matching, at-least-one cardinality, case sensitivity, self-reference handling, and missing-reference diagnostic targets. | Codex |
| CR-4 | Major | Resolved | 14 / 17 | Consensus review found remaining public-contract gaps in selector/assertion compatibility, diagnostic-code precedence, evidence hash semantics, and table predicate matching. | Add a selector/assertion compatibility matrix, deterministic diagnostic precedence, canonical SHA-256 evidence hash semantics, table predicate matching rules, and verification coverage. | Codex |
| CR-5 | Minor | Resolved | 0 / 6 / 18 | Follow-up review found that the executive summary referenced the wrong `RISK-*` ID for compatibility ambiguity and that diagnostic actionability referenced unsupported link-scheme evidence outside the v1 assertion vocabulary. | Align the executive-summary top risk with `RISK-4`, expand the `RISK-4` ledger row, and replace unsupported link-scheme evidence with v1 diagnostic cases. | Codex |
| CR-6 | Major | Resolved | 10 / 14 / 17 | Consensus review found that CLI JSON output for profile parse or config failures could not satisfy the required `DeclarativeValidationResult` shape because no parsed profile exists yet. | Define the `DeclarativeValidationCliJsonResult` union, add an explicit profile-stage config-error result shape, state when each CLI JSON shape is emitted, and add acceptance and verification coverage. | Codex |
| CR-7 | Major | Resolved | 14 / 17 | Consensus review found that regex-like first-level assertion keys such as `assert.matches` could be classified as either `profile.compile.unsupportedAssertion` or `profile.config.unsupportedKey`. | Define regex-like unsupported-key precedence as applying everywhere in the profile, including first-level assertion members, so `assert.matches` deterministically emits `profile.config.unsupportedKey`. | Codex |
| CR-8 | Major | Resolved | 14 | External review found that hashing the supplied `EngineDocument` conflicted with excluding caller file paths because normalized documents can contain top-level `path`. | Define the canonical `inputHash` document as the supplied `EngineDocument` with top-level `document.path` omitted while preserving structural node target paths. | Codex |

Semantic scores:

| Dimension | Score | Notes |
| --- | --- | --- |
| Problem validity | 3 | The problem is grounded in direct repo facts: 5 current fixed rule families, rich IR already available, and no declarative profile syntax. |
| Requirement quality | 3 | Requirements are atomic, deterministic, and bounded by explicit non-goals. |
| Functional adequacy | 3 | Layer 2 covers parse, compile, evaluate, diagnostics, CLI, and evidence flows. |
| Technical feasibility | 3 | Mechanisms build on existing parser, normalizer, rich IR queries, diagnostics, and serialization. |
| Non-functional adequacy | 3 | Determinism, inert data handling, compatibility, diagnostic precedence, evidence hash semantics, regex rejection, and boundary control are explicit. |
| Operational safety | 3 | The package remains local and stateless with clear rollback and containment triggers. |
| Verification adequacy | 3 | Verification targets syntax parsing, unsupported declarations including regex-like keys, selector/assertion compatibility, table predicates, reference semantics, closed compilation, source diagnostics, evidence hashes, repeatability, boundary audit, downstream exercise, and CLI behavior. |
