# Markdown Engine 1.0 Rich IR Operational Design Specification

## Document Control

| Field | Value |
| --- | --- |
| Title | Markdown Engine 1.0 Rich IR |
| Status | Draft |
| Rigor level | `R2` |
| Rigor justification | The work changes durable public IR, API, serialization, and downstream-consumer contracts. It does not qualify for `R1` because schema and API compatibility are material outputs. It does not trigger `R3` because it does not change authentication, authorization, secrets, live customer data, irreversible storage, payments, safety controls, or a high-volume production path. |
| Author(s) | Codex |
| Reviewers | Project owner, markdown-engine implementer, downstream SpecTrace/profile/runtime consumer |
| Decision owner | Project owner |
| Target milestone or release | `markdown-engine` 1.0 release design approval |
| Last updated | 2026-05-01 |
| Related docs | `RUNTIME_ARCHITECTURE.md`; `docs/design/markdown-engine-operational-design-spec.md`; SpecTrace R0 design and BEL-905 scanner worktree observations |
| Related tickets | none |

## 0. Executive Summary

Decision requested: Approve for implementation

Problem summary: Downstream document applications are unable to build reliable structural tools on `markdown-engine` because the current IR exposes a generic node tree without stable node identity, section scope, source text recovery, table coordinates, generic text spans, query helpers, or an annotation target model, resulting in each downstream project re-deriving Markdown structure with brittle line scanners or parser-specific logic.

Proposed outcome: A 1.0 IR contract that provides deterministic structural views, source-grounded spans, stable node targeting, table/list models, query helpers, and app-owned annotations while keeping domain semantics outside the engine.

Why now: `markdown-engine` 0.1.0 has proved parse, normalize, validate, serialize, deterministic output, and boundary safety; SpecTrace now shows the first concrete downstream pressure for richer generic structure before additional apps duplicate scanners.

Top risks or unknowns:

- RISK-1: A richer IR could absorb domain semantics and weaken the engine boundary.
- RISK-2: Stable node identifiers could become brittle across harmless document edits.
- RISK-3: Source-text and span support could expand the public contract faster than tests can protect.

Section status: Complete

## Layer 1: Problem and Requirements

## 1. Problem Definition

Problem declaration: Downstream Markdown applications are unable to consume `markdown-engine` as a complete structural substrate because the current IR lacks stable node targeting, section boundaries, source text recovery, table coordinates, text span extraction, and app annotation targets, resulting in duplicated scanners, inconsistent diagnostics, and weaker review evidence.

Affected actors or systems: SpecTrace, future `markdown-profile`, future `markdown-runtime`, docs quality gates, knowledge-base ingestion tools, migration tools, audit packet generators, review bots, and maintainers of `markdown-engine`.

Current-state baseline: As of 2026-05-01 `markdown-engine` exposes 1 public document tree shape with `type`, optional `text`, optional `attributes`, optional `children`, and optional `sourceRange`; it has 0 public section tree APIs, 0 public node ID contracts, 0 public source-slice APIs, 0 public table coordinate contracts, 0 generic token span APIs, and 0 annotation target contracts. SpecTrace has 1 R0 registry model and a BEL-905 worktree with at least 8 scanner/validation modules that re-derive line, section, label, range, and issue-key facts outside `markdown-engine`.

Evidence or source: Direct inspection of `src/api/document.ts`, `src/parser/engine-document.ts`, current `docs/contracts/api.md`, SpecTrace R0 docs, and SpecTrace `.worktrees/bel-905-valid-path/src/spectrace/markdown/**`.

Consequence of inaction: Before the next downstream document app or SpecTrace implementation slice, each consumer will continue writing its own section scanner, token detector, source locator, and report target logic, increasing drift from the engine contract and making future compatibility harder to prove.

Decision deadline or trigger: Before approving a second downstream app or any SpecTrace integration that depends on robust Markdown structure beyond the current generic node tree.

Section status: Complete

## 2. Objectives and Non-Objectives

| ID | Statement | Measurement or decision horizon |
| --- | --- | --- |
| OBJ-1 | Provide a generic rich IR that can support structural document apps without domain-specific parsing. | 1.0 implementation review |
| OBJ-2 | Provide stable source-grounded target identities for diagnostics, annotations, and downstream reports. | 1.0 implementation review |
| OBJ-3 | Preserve `markdown-engine` as a deterministic substrate that excludes SpecTrace, profile, runtime, MCP, and semantic-evaluation behavior. | Architecture and boundary review |
| OBJ-4 | Reduce downstream line-scanner duplication by exposing sections, spans, tables, lists, source slices, and query helpers. | First SpecTrace or profile integration using 1.0 IR |
| NG-1 | This design will not implement SpecTrace entity registries, canonical IDs, relationship edges, or issue-key policy. | 1.0 implementation review |
| NG-2 | This design will not implement profile compilation, runtime lenses, MCP transport, agent adapters, or semantic validation. | 1.0 implementation review |
| NG-3 | This design will not introduce a graph database, persistent index, network service, or file-watching daemon. | 1.0 implementation review |
| NG-4 | This design will not promise stable node IDs across arbitrary content edits. | 1.0 implementation review |

Section status: Complete

## 3. Stakeholders and Decision Authorities

| Stakeholder or role | Interest | Required action |
| --- | --- | --- |
| Project owner | Approves 1.0 IR scope, compatibility policy, and implementation readiness. | Approve |
| Markdown-engine implementer | Implements IR, query, annotation, compatibility, and test changes. | Review |
| SpecTrace consumer | Confirms 1.0 generic IR can replace brittle Markdown line scanning where appropriate. | Review |
| Future profile/runtime consumer | Confirms 1.0 IR supports profile compilation and runtime lens generation without parser forking. | Review |
| Security/data/legal reviewer | Confirms source text and raw HTML remain inert local data and introduce no new live-data or trust boundary. | Consult |

Decision owner: Project owner

Section status: Complete

## 4. Constraints, Invariants, and Assumptions

| ID | Type | Statement | Source or rationale | Validation or resolution plan |
| --- | --- | --- | --- | --- |
| CON-1 | Invariant | `markdown-engine` remains domain-neutral and deterministic. | Runtime architecture boundary | Verify with boundary tests and contract review in `VAL-8`. |
| CON-2 | Constraint | App-specific entities, graph edges, profile semantics, issue-key policy, and LLM-backed checks remain outside core IR. | SpecTrace and runtime decomposition | Verify no SpecTrace/profile/runtime identifiers enter source or public contracts in `VAL-8`. |
| CON-3 | Constraint | Public 1.0 IR changes are semver-classified before release or tag. | Existing API contract policy | Verify compatibility notes and 1.0 migration guidance in `VAL-7`. |
| CON-4 | Invariant | Source text and raw HTML are represented as inert strings only. | Existing raw HTML containment model | Verify no rendering, sanitization, fetching, or execution behavior in `VAL-6` and `VAL-8`. |
| CON-5 | Invariant | Stable node targeting is deterministic for identical input and options. | Repeatable diagnostics and reports require stable targets. | Verify repeated serialization and node target stability in `VAL-5`. |
| ASM-1 | Assumption | Parser source positions are sufficient to produce source slices for the targeted GFM constructs. | 0.1.x source ranges are already present for representative fixtures. | Validate through expanded source-slice fixtures in `VAL-3`. |
| ASM-2 | Assumption | Structural section and span views can be derived from normalized IR without exposing raw parser AST. | Current heading and text nodes already contain enough structure for the first slice. | Validate through query helper tests in `VAL-2` and `VAL-4`. |
| ASM-3 | Assumption | Downstream apps can keep semantic annotations in their own packages if the engine provides stable targets. | SpecTrace needs targetable definitions and references but owns entity meaning. | Validate through a SpecTrace-style fixture exercise in `VAL-9`. |

Section status: Complete

## 5. Requirements

| ID | Type | Priority | Requirement statement | Rationale | Verification |
| --- | --- | --- | --- | --- | --- |
| REQ-1 | Functional | Must | The system shall assign deterministic public node targets to normalized IR nodes for identical input and options. | Diagnostics, annotations, and reports need stable anchors. | VAL-3 / VAL-5 |
| REQ-2 | Functional | Must | The system shall expose a heading-derived section tree with parent, child, and body membership. | Downstream tools need section scope without line scanners. | VAL-2 / VAL-4 |
| REQ-3 | Functional | Must | The system shall expose source ranges and optional source text slices for source-addressable public nodes. | Exact definition matching and review comments need source grounding. | VAL-3 |
| REQ-4 | Functional | Must | The system shall expose normalized text spans with source ranges for text-bearing blocks and inline content. | Token, reference, and range detectors need generic span input. | VAL-4 |
| REQ-5 | Functional | Must | The system shall expose table rows and cells with normalized cell text, zero-based row index, zero-based column index, and header state. | Execution specs and docs often define identifiers in tables. | VAL-4 |
| REQ-6 | Functional | Must | The system shall expose list containers and list items with zero-based nesting depth, zero-based item index scoped to the immediate list container, ordered state, ordered start value where available, and checked state where available. | Workflow documents often encode task structure in lists. | VAL-4 |
| REQ-7 | Functional | Must | The system shall provide query helpers for sections, nodes, links, tables, lists, text spans, and source slices. | Apps should not reimplement traversal for common structural access. | VAL-4 |
| REQ-8 | Functional | Must | The system shall support caller-owned annotations that target node targets or source ranges without changing core node semantics. | Downstream apps need enrichment without engine domain leakage. | VAL-9 |
| REQ-9 | Compatibility | Must | The system shall make the rich IR the canonical 1.0 package contract while preserving 0.1.x parse, normalize, validate, and serialize behavior through explicit legacy compatibility gates. | Existing consumers and evidence snapshots need controlled migration. | VAL-7 |
| REQ-10 | Reliability | Must | The system shall produce byte-for-byte identical serialized 1.0 output for identical input, options, package version, and runtime version. | 1.0 remains a deterministic review and CI substrate. | VAL-5 |
| REQ-11 | Security | Must | The system shall keep raw HTML and recovered source text inert without rendering, fetching, sanitizing, or executing it. | Rich source support must not create an execution boundary. | VAL-6 / VAL-8 |
| REQ-12 | Operability | Must | The system shall document 1.0 IR fields, query helpers, annotation targets, migration behavior, and non-goals before release. | Durable consumers need a contract rather than source-code inference. | VAL-7 |

Public naming and API continuity constraint: `rich IR` is the initiative and
workstream label, not a public TypeScript namespace, API prefix, or module
boundary. The 1.0 contract shall evolve the existing `markdown-engine` public
vocabulary: `EngineDocument`, `EngineNode`, `EngineTarget`, query helpers,
annotation helpers, `parse`, `normalize`, `validate`, and `serialize`. Public
exports shall not introduce `RichIr*`, `richIr`, `queryRichIr`,
`serializeRichIr`, `validateRichIr*`, or a separate `rich-ir` public module
unless an explicit design revision approves a parallel API. This constraint does
not apply to execution-only script names or evidence labels such as
`test:rich-ir:*`.

Section status: Complete

## 6. Success Measures and Kill Criteria

| Measure | Baseline | Target or decision threshold | Evaluation date or decision event | Related IDs |
| --- | --- | --- | --- | --- |
| Section scanner replacement | SpecTrace BEL-905 scanner worktree contains line-based section extraction. | A SpecTrace-style fixture can identify section-owned references using 1.0 section/query APIs without raw line section scanning. | First 1.0 downstream exercise | OBJ-1 / OBJ-4 / REQ-2 / REQ-7 |
| Source target stability | 0.1.x has source ranges but no public node target contract. | A 10-run repeatability test produces identical node targets and serialized 1.0 JSON for representative fixtures. | 1.0 implementation review | OBJ-2 / REQ-1 / REQ-10 |
| Table structural coverage | 0.1.x has table nodes but no public row or cell coordinate contract. | Table fixture snapshots include cell text, row index, column index, and header state. | 1.0 implementation review | OBJ-1 / REQ-5 |
| Boundary preservation | 0.1.x boundary audit reports no forbidden dependencies or semantic scope drift. | 1.0 boundary audit reports no SpecTrace/profile/runtime/MCP/agent/LLM/network-service direct dependency or domain-specific IR field. | 1.0 implementation review | OBJ-3 / REQ-8 / REQ-11 |
| Contract documentation | 0.1.x has API/frontmatter contracts but no 1.0 rich IR guide. | 1.0 contract docs include migration notes, field definitions, query helpers, annotation target rules, and app non-goals. | 1.0 release readiness review | OBJ-1 / REQ-9 / REQ-12 |

Section status: Complete

Layer 1 status: Complete

## Layer 2: Functional Specification

## 7. System Context and External Interfaces

System boundary: `markdown-engine` remains a local TypeScript library that accepts Markdown text and options, returns normalized IR and diagnostics, and offers deterministic query and serialization helpers over engine-owned data structures.

External actors and systems: Package consumers, CI jobs, SpecTrace, future `markdown-profile`, future `markdown-runtime`, docs tooling, local caller-owned file readers, GFM parser dependency, YAML parser dependency. SpecTrace and future profile/runtime packages have no control authority over engine internals.

Trust or control boundaries: Caller-controlled Markdown, YAML frontmatter, validation config, annotations, and source text enter as untrusted local data. Raw HTML and source slices remain inert strings. Parser and YAML dependency upgrades cross a maintainer-controlled dependency boundary.

| Interface | Owner | Consumer or dependency | Inputs | Outputs |
| --- | --- | --- | --- | --- |
| 1.0 public package API | `markdown-engine` | Package consumers and CI | Markdown text, path, parse/normalize options, validation config | 1.0 parse, normalize, validate, query, annotation, and serialization results |
| 1.0 IR contract | `markdown-engine` | SpecTrace, profile/runtime, docs tools | Parsed Markdown and normalization options | 1.0 `EngineDocument` tree, sections, spans, tables, lists, node targets, source references |
| Query helper API | `markdown-engine` | Downstream apps | 1.0 document and query options | Sections, nodes, spans, links, tables, lists, source slices |
| Annotation target API | `markdown-engine` | Downstream apps | App-owned annotation records and target references | Validated annotation attachment result or target diagnostics |
| Parser adapter | `markdown-engine` | GFM parser dependency | Markdown body text and parser options | Parser output converted to engine-owned 1.0 IR |
| Serialization contract | `markdown-engine` | CI, agents, review tools | 1.0 public result objects | Stable JSON output |

Section status: Complete

## 8. Operational Scenarios and Functional Behavior

| ID | Trigger | Preconditions | Behavior or outcome | Related requirements |
| --- | --- | --- | --- | --- |
| FLOW-1 | A caller normalizes Markdown with 1.0 options. | Markdown text is supplied through the public API. | The caller receives rich IR with deterministic node targets, source ranges, sections, spans, tables, and lists. | REQ-1 / REQ-2 / REQ-3 / REQ-4 / REQ-5 / REQ-6 |
| FLOW-2 | A downstream app asks for the body of a heading section. | A 1.0 document contains headings. | The query helper returns the section node, child sections, and body node targets without raw line scanning. | REQ-2 / REQ-7 |
| FLOW-3 | A downstream app scans for domain tokens. | A 1.0 document contains normalized text spans with source ranges. | The app receives text spans and computes app-owned tokens outside core IR. | REQ-4 / REQ-7 / REQ-8 |
| FLOW-4 | A downstream app annotates detected entities. | The app provides annotations targeting node targets or source ranges. | The engine validates target shape and serializes annotations without interpreting domain meaning. | REQ-8 / REQ-10 |
| FLOW-5 | A caller serializes 1.0 output for review evidence. | 1.0 normalization, validation, query, or annotation processing completed. | The caller receives deterministic JSON for identical input and options. | REQ-9 / REQ-10 |
| FUNC-1 | 1.0 normalization is invoked. | Input Markdown is parseable. | The API returns rich structural IR as the 1.0 contract while preserving 0.1.x-compatible parse and validation behavior under documented legacy gates. | REQ-1 / REQ-9 |
| FUNC-2 | Section query is invoked. | A 1.0 document has heading nodes. | The API returns section hierarchy and body membership derived from heading depth. | REQ-2 / REQ-7 |
| FUNC-3 | Text span query is invoked. | A 1.0 document has text-bearing nodes. | The API returns normalized text spans with node targets and source ranges. | REQ-3 / REQ-4 / REQ-7 |
| FUNC-4 | Table or list query is invoked. | A 1.0 document contains tables or lists. | The API returns normalized table/list structures with coordinates or item metadata. | REQ-5 / REQ-6 / REQ-7 |
| FUNC-5 | Annotation attachment is invoked. | Caller provides annotation records. | The API accepts valid targets and rejects malformed targets without interpreting app semantics. | REQ-8 |
| FUNC-6 | Raw HTML or source text appears in input. | Markdown contains raw HTML or source-addressable text. | The API exposes inert string data only and performs no render, fetch, sanitize, or execute action. | REQ-11 |

Section status: Complete

## 9. State Model, Faults, and Misuse Cases

States and transitions: The engine remains stateless across calls. Per invocation it transitions through InputReceived, Parsed, Normalized1_0, DerivedViewsBuilt, ConfigValidated, RulesEvaluated, AnnotationsChecked, and Serialized. Faults produce diagnostics inside the returned result and do not mutate persistent state.

| Scenario | Expected behavior | Invariant maintained | Related IDs |
| --- | --- | --- | --- |
| Fault-1 | Parser source positions are missing for a construct. | The IR omits unavailable source text for that target and emits a diagnostic or coverage note where applicable. | REQ-3 / FUNC-3 |
| Fault-2 | Caller requests a source slice for a target without offsets. | The query helper returns a target diagnostic instead of guessing a slice. | REQ-3 / REQ-7 |
| Fault-3 | Caller attaches an annotation to an unknown node target. | The annotation API rejects the annotation with a deterministic target diagnostic. | REQ-8 / FUNC-5 |
| Fault-4 | 1.0 output differs across repeated identical runs. | Release readiness fails until ordering or identity generation is corrected. | REQ-1 / REQ-10 |
| Misuse-1 | A downstream package attempts to add SpecTrace entity meaning to core IR fields. | Boundary review blocks the change and moves the semantics into annotations or the downstream package. | REQ-8 / FUNC-5 |
| Misuse-2 | A caller treats raw HTML or source text as trusted rendered content. | The engine documentation and output contract identify the data as inert and local only. | REQ-11 / FUNC-6 |

Section status: Complete

## 10. External Service Levels and Acceptance Cases

External service expectations: The package has no network availability service level. Externally visible expectations are deterministic local API output, source-grounded query results, bounded compatibility behavior, no execution of Markdown content, and documented public contracts.

| ID | Acceptance case | Expected result | Covers |
| --- | --- | --- | --- |
| ACC-1 | Normalize a representative execution-spec Markdown fixture with 1.0 enabled. | The result includes stable node targets, section hierarchy, source ranges, text spans, table/list structures where present, and no parse diagnostics. | REQ-1 / REQ-2 / REQ-3 / REQ-4 / REQ-5 / REQ-6 / FUNC-1 |
| ACC-2 | Query the `WP-1` section body in a SpecTrace-style fixture. | The result includes body nodes through nested headings and stops before the next sibling or parent section. | REQ-2 / REQ-7 / FUNC-2 |
| ACC-3 | Query text spans from the same fixture. | The result contains source-grounded spans sufficient for a downstream app to detect `WP-1`, `CON-1 through CON-3`, and `BEL-858` without engine domain semantics. | REQ-4 / REQ-7 / REQ-8 / FUNC-3 |
| ACC-4 | Query table cells from a GFM table fixture. | Each public cell result includes normalized text, zero-based row index, zero-based column index, header state, and header-row counting semantics. | REQ-5 / FUNC-4 |
| ACC-5 | Attach caller-owned annotations to valid node targets and source ranges. | Valid annotations serialize deterministically and malformed targets produce diagnostics. | REQ-8 / REQ-10 / FUNC-5 |
| ACC-6 | Run 1.0 serialization 10 times over the same fixture and options. | All serialized bytes are identical across the 10 runs. | REQ-1 / REQ-10 / FUNC-1 / FUNC-5 |
| ACC-7 | Review 1.0 docs and migration guidance before release. | The contract docs identify fields, query helpers, annotation targets, compatibility gates, and non-goals. | REQ-9 / REQ-12 |
| ACC-8 | Inspect raw HTML and source-slice handling. | The engine exposes inert strings and performs no render, fetch, sanitize, or execute action. | REQ-11 / FUNC-6 |

Section status: Complete

## 11. Requirements-to-Behavior Traceability

| Requirement | Functional behaviors or flows | Acceptance coverage | Notes |
| --- | --- | --- | --- |
| REQ-1 | FLOW-1 / FLOW-5 / FUNC-1 | ACC-1 / ACC-6 | Node targeting is observable in 1.0 IR and serialization. |
| REQ-2 | FLOW-1 / FLOW-2 / FUNC-2 | ACC-1 / ACC-2 | Section hierarchy replaces downstream section line scanning. |
| REQ-3 | FLOW-1 / FUNC-3 | ACC-1 / ACC-3 | Source slices and source ranges support exact report targets. |
| REQ-4 | FLOW-1 / FLOW-3 / FUNC-3 | ACC-1 / ACC-3 | Text spans support downstream token detection. |
| REQ-5 | FLOW-1 / FUNC-4 | ACC-1 / ACC-4 | Table coordinates are externally observable. |
| REQ-6 | FLOW-1 / FUNC-4 | ACC-1 | List structure is externally observable in 1.0 IR. |
| REQ-7 | FLOW-2 / FLOW-3 / FUNC-2 / FUNC-3 / FUNC-4 | ACC-2 / ACC-3 / ACC-4 | Query helpers expose common traversal operations. |
| REQ-8 | FLOW-3 / FLOW-4 / FUNC-5 | ACC-3 / ACC-5 | Annotations carry domain semantics outside core IR. |
| REQ-9 | FLOW-1 / FLOW-5 / FUNC-1 | ACC-7 | Compatibility gates and migration behavior are contract-visible. |
| REQ-10 | FLOW-5 / FUNC-5 | ACC-5 / ACC-6 | Determinism is verified through repeat serialization. |
| REQ-11 | FUNC-6 | ACC-8 | Inert data behavior is externally inspectable. |
| REQ-12 | FLOW-5 | ACC-7 | Documentation is a release acceptance condition. |

Section status: Complete

Layer 2 status: Complete

## Layer 3: Technical Specification

## 12. Architecture Overview

Architecture summary: 1.0 extends the current parse and normalize pipeline with deterministic derived views over engine-owned IR: node targets, section tree, source map, text spans, table/list views, query helpers, annotation target validation, and stable serialization.

Major components and boundaries: The top-level components are public API, parser adapter, 1.0 IR normalizer, node target generator, section builder, source map, span index, structural view builders, query helpers, annotation target validator, serializer, and compatibility documentation. Boundaries remain between external parser/YAML dependencies and engine-owned IR, between core IR and app-owned annotations, and between `markdown-engine` structure and downstream domain semantics.

Deployment or runtime placement: The package runs in the caller's local Node.js process. It owns no file traversal, network service, database, daemon, MCP transport, or persistent cache.

Architecture rationale: Derived structural views satisfy `REQ-1` through `REQ-8` while preserving the deterministic package boundary required by `REQ-9` through `REQ-12`; downstream apps receive enough generic structure to build specific behavior without importing raw parser AST or pushing domain meaning into the engine.

Section status: Complete

## 13. Technical Mechanisms and Allocation

| ID | Mechanism | Component or owner | Responsibility | Related behaviors |
| --- | --- | --- | --- | --- |
| TECH-1 | 1.0 document contract | Public API and IR types | Define public fields for node targets, sections, source references, spans, tables, lists, and annotations. | FUNC-1 |
| TECH-2 | Deterministic node target generator | IR normalizer | Assign stable per-document node targets from structural path, node type, sibling ordinal, and source range where available. | FUNC-1 / FUNC-5 |
| TECH-3 | Section tree builder | Derived view builder | Build heading-derived section hierarchy, body membership, and section query indexes. | FUNC-2 |
| TECH-4 | Source map and source-slice helper | Source map layer | Provide source ranges and exact source slices when offsets are available. | FUNC-3 / FUNC-6 |
| TECH-5 | Text span index | Span layer | Produce normalized text spans with target, source range, node ancestry, and text value. | FUNC-3 |
| TECH-6 | Table and list structural views | Structural view builder | Add zero-based row/cell coordinates, header-row counting, zero-based list item indices, zero-based nesting depth, ordered state, ordered start value, and checked state. | FUNC-4 |
| TECH-7 | Query helper module | Public query API | Expose stable functions for common structural access without raw traversal duplication. | FUNC-2 / FUNC-3 / FUNC-4 |
| TECH-8 | Annotation target validator | Annotation API | Validate caller-owned annotation targets and keep annotation payload semantics opaque to the engine. | FUNC-5 |
| TECH-9 | Compatibility and serializer controls | Serialization and contract layer | Make the 1.0 document contract the canonical root API behavior, expose any 0.1.x-compatible behavior only through explicit legacy selectors or namespaces, reject version mismatches, and serialize deterministic public results. | FUNC-1 / FUNC-5 |
| TECH-10 | Boundary and fixture harness | Test infrastructure | Prove repeatability, source grounding, downstream-style fixture behavior, and absence of domain leakage. | FUNC-1 / FUNC-2 / FUNC-3 / FUNC-4 / FUNC-5 / FUNC-6 |

Section status: Complete

## 14. Data, Schemas, and Compatibility

Provisional 1.0 public shape:

```ts
interface EngineDocument {
  kind: "markdown-document";
  version: "1.0.0";
  path?: string;
  frontmatter?: unknown;
  children: EngineNode[];
  sections: readonly EngineSection[];
  textSpans: readonly EngineTextSpan[];
  tables: readonly EngineTable[];
  lists: readonly EngineList[];
  links: readonly EngineLink[];
  sourceRange?: SourceRange;
}

interface EngineNode {
  target: EngineTarget;
  type: string;
  text?: string;
  sourceText?: string;
  attributes?: Record<string, unknown>;
  sourceRange?: SourceRange;
  children?: EngineNode[];
}

interface EngineTarget {
  id: string;
  documentPath?: string;
  nodePath: readonly number[];
  sourceRange?: SourceRange;
}

interface EngineSection {
  target: EngineTarget;
  headingTarget: EngineTarget;
  depth: number;
  title: string;
  bodyTargets: readonly EngineTarget[];
  childSections: readonly EngineSection[];
  sourceRange?: SourceRange;
}

interface EngineTextSpan {
  target: EngineTarget;
  text: string;
  sourceRange?: SourceRange;
  ancestorTargets: readonly EngineTarget[];
}

interface EngineTable {
  target: EngineTarget;
  rows: readonly EngineTableRow[];
  sourceRange?: SourceRange;
}

interface EngineTableRow {
  target: EngineTarget;
  rowIndex: number;
  isHeader: boolean;
  cells: readonly EngineTableCell[];
  sourceRange?: SourceRange;
}

interface EngineTableCell {
  target: EngineTarget;
  rowIndex: number;
  columnIndex: number;
  isHeader: boolean;
  text: string;
  textSpans: readonly EngineTextSpan[];
  sourceRange?: SourceRange;
  sourceText?: string;
}

interface EngineList {
  target: EngineTarget;
  ordered: boolean;
  start?: number;
  depth: number;
  items: readonly EngineListItem[];
  sourceRange?: SourceRange;
}

interface EngineListItem {
  target: EngineTarget;
  listTarget: EngineTarget;
  itemIndex: number;
  depth: number;
  checked?: boolean;
  text: string;
  bodyTargets: readonly EngineTarget[];
  childListTargets: readonly EngineTarget[];
  sourceRange?: SourceRange;
  sourceText?: string;
}

interface EngineLink {
  target: EngineTarget;
  url: string;
  title?: string;
  text: string;
  sourceRange?: SourceRange;
}

interface EngineAnnotation {
  target: EngineTarget | SourceRange;
  kind: string;
  data: Record<string, unknown>;
}

interface EngineTableQueryResult {
  tables: readonly EngineTable[];
  rows: readonly EngineTableRow[];
  cells: readonly EngineTableCell[];
}

interface EngineListQueryResult {
  lists: readonly EngineList[];
  items: readonly EngineListItem[];
}

interface EngineSourceSliceResult {
  target: EngineTarget | SourceRange;
  text?: string;
  sourceRange?: SourceRange;
  diagnostics: readonly MarkdownDiagnostic[];
}
```

The exact TypeScript names may change during implementation, but the released
contract shall preserve explicit public surfaces for sections, text spans,
tables, table rows, table cells, lists, list items, links, annotations, and
source-slice query results. `VAL-7` shall freeze the released names and
migration notes before 1.0 approval.

Naming rule for this shape: use engine/document vocabulary for public symbols.
The implementation may use `rich IR` as an execution-program phrase in docs,
scripts, and evidence, but public TypeScript declarations and package-root API
names must read as the normal 1.0 `markdown-engine` contract. If an implementer
believes a separate `richIr` namespace or module is required, that is a
re-decision boundary requiring project-owner approval before coding continues.

Indexing and coordinate semantics: All public structural indexes are zero-based
non-negative integers. `EngineTable.rows` includes the GFM header row when one is
present; the header row has `rowIndex: 0` and `isHeader: true`, and body rows
continue at `rowIndex: 1`. `EngineTableCell.rowIndex` must equal its containing
row's `rowIndex`; `EngineTableCell.columnIndex` is the zero-based cell position
within that row after parser normalization. `EngineList.depth` is zero for a
top-level list and increments by one for each nested list level. `EngineListItem`
uses the same `depth` as its containing list, and `itemIndex` is zero-based
within the immediate `EngineList.items` array and resets to zero for each list
container. `EngineList.start` preserves an ordered list's author-facing start
number when the parser exposes one; it does not change `itemIndex` semantics.

Compatibility gate decision: Package version 1.0 makes the rich IR the
canonical public contract. Calling `parse`, `normalize`, `validate`, or
`serialize` through the 1.0 root API returns or accepts 1.0 document shapes
according to the public API contract. Any 0.1.x-compatible behavior must be
explicit through a documented legacy selector or namespace; it must not be the
default 1.0 path and must not create a second compatibility policy. A 1.0
document must carry `version: "1.0.0"`, and validation or serialization must
reject or diagnose a mismatch between the requested compatibility mode and the
document version. Migration documentation in `VAL-7` shall list the exact 1.0
entry points, any 0.1.x compatibility entry points, option names, and semver
classification before release approval.

| Change | Type | Compatibility impact | Reversibility | Mitigation |
| --- | --- | --- | --- | --- |
| 1.0 `EngineDocument` contract | Schema | Makes the evolved document shape the stable public contract for 1.0 consumers. | Reversible before 1.0 release; semver-controlled after release | Version the document contract and preserve explicit 0.1.x compatibility gates until migration is approved. |
| Node target format | Schema | New public target identifier used by diagnostics and annotations. | Reversible before 1.0 release; semver-controlled after release | Document target stability limits and snapshot representative fixtures. |
| Section, span, table, and list views | Schema | New derived views become public downstream contracts. | Reversible before 1.0 release; semver-controlled after release | Treat as the 1.0 contract with compatibility docs and fixture snapshots. |
| Query helper API | API | New package functions or namespaces for structural access. | Reversible before 1.0 release; semver-controlled after release | Add typed API tests and docs before release. |
| Annotation target contract | API / Schema | New app-owned extension surface for domain annotations. | Reversible before 1.0 release; semver-controlled after release | Keep annotation payload opaque and validate only target shape. |
| Serialization output | Data | 1.0 output changes snapshots and downstream review evidence. | Reversible before 1.0 release; semver-controlled after release | Require explicit 1.0 serialization mode and repeatability evidence. |

Section status: Complete

## 15. Control Logic and Non-Functional Controls

Control logic summary: 1.0 normalization first creates the engine-owned node tree, then derives node targets, source-map entries, section hierarchy, text spans, table/list views, query indexes, and optional annotation attachment results in deterministic order. Validation rules continue to operate on normalized public IR and do not gain semantic execution.

Concurrency and ordering model: The engine remains invocation-local and single-result deterministic. Derived views sort by document order, structural path, and target ID. Annotation output preserves caller order only after target validation succeeds; diagnostics sort by source order and then stable code.

Failure recovery model: Missing parser offsets, malformed annotation targets, unsupported 1.0 options, or incompatible serialization requests produce diagnostics or typed errors documented by the public API. No persistent recovery action is required because the engine mutates no external state.

| Requirement | Mechanism | Notes |
| --- | --- | --- |
| REQ-1 | TECH-1 / TECH-2 / TECH-9 | Target generation and serialization prove deterministic identity for identical inputs. |
| REQ-2 | TECH-3 / TECH-7 | Section builder and query helpers expose heading scope. |
| REQ-3 | TECH-4 / TECH-7 | Source slices are available only when offsets exist. |
| REQ-4 | TECH-5 / TECH-7 | Text spans provide generic input for downstream token detection. |
| REQ-5 | TECH-6 / TECH-7 | Table structure is normalized before query output. |
| REQ-6 | TECH-6 / TECH-7 | List structure is normalized before query output. |
| REQ-7 | TECH-7 | Query helpers are the public traversal surface. |
| REQ-8 | TECH-8 | Annotation target validation keeps app semantics external. |
| REQ-9 | TECH-1 / TECH-9 | Versioning and explicit legacy compatibility gates protect 0.1.x consumers. |
| REQ-10 | TECH-2 / TECH-9 / TECH-10 | Repeatability tests protect deterministic output. |
| REQ-11 | TECH-4 / TECH-10 | Source text and raw HTML remain inert strings. |
| REQ-12 | TECH-9 | Contract docs are required before release. |

Section status: Complete

## 16. Observability, Operations, Rollout, and Rollback

| Signal | Type | Purpose | Consumer |
| --- | --- | --- | --- |
| 1.0 fixture test output | Log | Show that rich IR fixtures pass and snapshots are stable. | Implementer and reviewer |
| 1.0 repeatability output | Log | Show that node targets and serialized output are stable across repeated runs. | Reviewer |
| Boundary audit output | Audit | Show no forbidden domain, runtime, MCP, agent, LLM, or network dependency entered the engine. | Project owner and boundary reviewer |
| Contract review checklist | Audit | Show that 1.0 IR, query helpers, annotations, and migration notes are documented. | Project owner and downstream consumers |
| SpecTrace-style fixture exercise | Log | Show whether 1.0 IR supports section and span use cases that motivated the design. | SpecTrace consumer |

Rollout plan: Implement the 1.0 document contract as the root API behavior with
explicit document versioning and deterministic serialization. If 0.1.x compatibility is
retained, expose it only through a documented legacy selector or namespace and
test it alongside the 1.0 contract. Add representative fixture snapshots; update
contract docs; run 0.1.x compatibility and 1.0 test suites together; run a
SpecTrace-style fixture exercise; request downstream review before any 1.0 tag
or publication.

Rollback or containment plan: Trigger rollback if 0.1.x behavior changes without explicit approval, 1.0 repeatability fails, boundary audit detects domain leakage, or downstream review rejects the target model. The rollback action is to withhold 1.0 release and revert 1.0 contract changes on the branch; containment limit is source/package contract state because no persistent user data exists.

Operator actions: Run build, typecheck, root test suite, 1.0 targeted tests, repeatability script, boundary audit, contract review checklist, and SpecTrace-style fixture exercise before requesting approval.

Section status: Complete

## 17. Verification Strategy and Behavior-to-Mechanism Traceability

| ID | Verification method | What is verified | Related IDs |
| --- | --- | --- | --- |
| VAL-1 | Test | 0.1.x parse, normalize, validate, and serialize behavior remains unchanged when an explicit legacy compatibility mode is used. | REQ-9 / TECH-9 |
| VAL-2 | Test | Section tree and section query helpers return correct parent, child, and body membership across nested headings and fenced examples. | REQ-2 / REQ-7 / FUNC-2 / TECH-3 / TECH-7 |
| VAL-3 | Test / Snapshot | Node targets, source ranges, and source slices are stable and correct for representative headings, paragraphs, links, code, raw HTML, and tables. | REQ-1 / REQ-3 / FUNC-1 / FUNC-3 / TECH-2 / TECH-4 |
| VAL-4 | Test / Snapshot | Text spans, table views, list views, links, query helpers, and table/list index semantics return deterministic structural data. | REQ-4 / REQ-5 / REQ-6 / REQ-7 / FUNC-3 / FUNC-4 / TECH-5 / TECH-6 / TECH-7 |
| VAL-5 | Test | Ten repeated 1.0 runs produce byte-for-byte identical serialized output, node targets, derived views, and annotation attachment results. | REQ-1 / REQ-10 / TECH-2 / TECH-9 / TECH-10 |
| VAL-6 | Inspection / Test | Raw HTML and source slices remain inert local strings and no render, fetch, sanitize, execute, or network behavior exists. | REQ-11 / FUNC-6 / TECH-4 / TECH-10 |
| VAL-7 | Review | 1.0 contract docs cover fields, helpers, annotations, migration behavior, exact 1.0-default and 0.1.x compatibility entry points, compatibility classification, and non-goals. | REQ-9 / REQ-12 / TECH-1 / TECH-9 |
| VAL-8 | Boundary audit | No SpecTrace/profile/runtime/MCP/agent/LLM/network dependency, identifier family, or semantic rule behavior entered core engine code. | REQ-8 / REQ-11 / CON-1 / CON-2 / TECH-10 |
| VAL-9 | Test / Downstream exercise | A SpecTrace-style fixture can use 1.0 sections, spans, and annotation targets while keeping entity registry semantics outside the engine. | REQ-2 / REQ-4 / REQ-8 / FUNC-2 / FUNC-3 / FUNC-5 / TECH-3 / TECH-5 / TECH-8 |

| Behavior or requirement | Mechanisms | Verification |
| --- | --- | --- |
| REQ-1 | TECH-1 / TECH-2 / TECH-9 / TECH-10 | VAL-3 / VAL-5 |
| REQ-2 | TECH-3 / TECH-7 | VAL-2 / VAL-9 |
| REQ-3 | TECH-4 / TECH-7 | VAL-3 |
| REQ-4 | TECH-5 / TECH-7 | VAL-4 / VAL-9 |
| REQ-5 | TECH-6 / TECH-7 | VAL-4 |
| REQ-6 | TECH-6 / TECH-7 | VAL-4 |
| REQ-7 | TECH-7 | VAL-2 / VAL-4 |
| REQ-8 | TECH-8 / TECH-10 | VAL-8 / VAL-9 |
| REQ-9 | TECH-1 / TECH-9 | VAL-1 / VAL-7 |
| REQ-10 | TECH-2 / TECH-9 / TECH-10 | VAL-5 |
| REQ-11 | TECH-4 / TECH-10 | VAL-6 / VAL-8 |
| REQ-12 | TECH-9 | VAL-7 |
| FUNC-1 | TECH-1 / TECH-2 / TECH-9 | VAL-1 / VAL-3 / VAL-5 |
| FUNC-2 | TECH-3 / TECH-7 | VAL-2 / VAL-9 |
| FUNC-3 | TECH-4 / TECH-5 / TECH-7 | VAL-3 / VAL-4 / VAL-9 |
| FUNC-4 | TECH-6 / TECH-7 | VAL-4 |
| FUNC-5 | TECH-8 / TECH-9 | VAL-5 / VAL-9 |
| FUNC-6 | TECH-4 / TECH-10 | VAL-6 / VAL-8 |

Section status: Complete

## 18. Alternatives, Risks, Open Questions, and Final Exit

| Alternative | Reason considered | Reason rejected |
| --- | --- | --- |
| Keep 0.1.x IR and let downstream apps scan raw Markdown | Lowest engine churn and fastest downstream experimentation. | Duplicates section, span, source, and table logic in every app and weakens the engine as the deterministic substrate. |
| Move SpecTrace entities directly into engine IR | Would make the first downstream use case easy to query. | Violates the domain-neutral boundary and would couple engine releases to one app's semantics. |
| Expose raw parser AST as the advanced API | Gives consumers maximum parser detail immediately. | Breaks parser-substrate independence and makes downstream contracts depend on dependency internals. |
| Build a graph/index service first | Could support rich cross-document apps. | Adds persistence and operational scope before local deterministic IR proves enough value. |
| Use hidden Markdown comments as primary structural markers | Provides explicit anchors for apps. | Changes authoring conventions before proving generic source-grounded IR and annotations are insufficient. |

| ID | Statement | Likelihood | Consequence | Mitigation |
| --- | --- | --- | --- | --- |
| RISK-1 | 1.0 IR may become too broad and absorb app semantics. | Medium | High | Enforce `CON-1`, `CON-2`, `VAL-8`, and annotation payload opacity. |
| RISK-2 | Node target stability may be misunderstood as cross-edit identity. | Medium | Medium | Document stability limits and verify only identical-input determinism. |
| RISK-3 | Source-slice support may expose inconsistent offsets across parser dependency versions. | Medium | Medium | Snapshot source-map fixtures and gate dependency upgrades with compatibility review. |
| RISK-4 | Query helpers may become a second parser abstraction with unclear ownership. | Low | Medium | Keep helpers derived from public IR only and require contract docs for each helper. |
| RISK-5 | 1.0 default behavior and 0.1.x compatibility behavior may be ambiguous for consumers. | Medium | Medium | Require migration docs, explicit options, and 0.1.x/1.0 tests in `VAL-1` and `VAL-7`. |

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
| Review mode | Author-mode revision after external review pass |
| Proposed rigor level | `R2` |
| Reviewed rigor level | `R2` |
| Calibration result | Accept |
| Rationale | The design requests implementation approval for durable public IR/API/schema changes. It is too broad for `R1` and has no `R3` trigger. |
| Structural review result | Pass after revision; external table/list/query, index semantics, and compatibility-gate findings resolved |
| Semantic review result | Pass after revision |
| Traceability review result | Pass after explicit schema, index semantics, gate, and misuse-ID corrections |
| Final verdict | Approve for implementation, pending project-owner review |

| Finding ID | Severity | Status | Section | Finding | Required action | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| ST-1 | Major | Resolved | 14 | The initial draft named 1.0 schema surfaces but did not provide enough provisional public shape detail for `R2` implementation review. | Add provisional 1.0 public shape definitions and require `VAL-7` to freeze names before release approval. | Codex |
| EXT-1 | Major | Resolved | 14 | External review found that table, list, and query result contracts were not implementation-ready. | Add explicit public table, row, cell, list, list item, link, and query result shapes or equivalent minimum contract surfaces. | Codex |
| EXT-2 | Major | Resolved | 14 / 16 / 17 | External review found that the 1.0 compatibility gate was underspecified. | Record that rich IR is the 1.0 default, any 0.1.x compatibility path must be explicit, and mismatch checks and documentation gates are required. | Codex |
| EXT-3 | Minor | Resolved | 9 | External review found that `Misuse-1` referenced `CON-2` where the row should use `REQ-* / FUNC-*` trace IDs. | Replace the constraint-only related ID with `FUNC-5`. | Codex |
| CR-1 | Major | Resolved | 5 / 10 / 13 / 14 / 17 | Consensus review found that table/list public indexes lacked origin, header-row counting, and nested-list reset semantics. | Define zero-based table/list indexes, header-row counting, list depth, item-index reset behavior, ordered-list start handling, and verification coverage. | Codex |
| SM-1 | Observation | Closed | 18 | The design correctly excludes SpecTrace semantics from the engine but depends on a downstream exercise to prove the annotation boundary is usable. | Keep `VAL-9` as a required downstream exercise before 1.0 release approval. | Project owner |

Semantic scores:

| Dimension | Score | Notes |
| --- | --- | --- |
| Problem validity | 3 | Grounded in current 0.1.x IR and SpecTrace scanner pressure. |
| Requirement quality | 3 | Requirements now carry explicit table/list/query, index semantics, and compatibility-gate contract surfaces for implementation approval; final names remain frozen by `VAL-7`. |
| Functional adequacy | 3 | Layer 2 covers normalization, query, annotation, serialization, and inert data behavior. |
| Technical feasibility | 3 | Mechanisms are plausible from current IR and parser positions, with explicit derived-view and coordinate contracts plus source-slice completeness validated by fixtures. |
| Non-functional adequacy | 3 | Determinism, compatibility, default-1.0 behavior, and boundary controls are explicit. |
| Operational safety | 3 | Local library only, no persistent state or live external mutation. |
| Verification adequacy | 3 | Verification targets the high-risk claims: compatibility, determinism, source grounding, and boundary leakage. |
