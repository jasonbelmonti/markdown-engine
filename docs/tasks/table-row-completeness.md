---
type: TaskDefinition
title: Validate table body completeness through Markdown Engine profiles
task_id: profile-table-row-completeness
artifact_version: "3.0"
revision: "1"
created_at: "2026-09-25T12:47:21+00:00"
updated_at: "2026-09-25T12:47:21+00:00"
validation_profile: skills/task-definition/profiles/task-definition.yaml
---

## Task Control

| Contract state | Execution route | State rationale |
| --- | --- | --- |
| READY | PLAN_REQUIRED | Source, structural, semantic and post-draft gates pass. Public profile integration and compatibility proof require an execution plan before implementation. |

## Objective

Let profile authors reject incomplete or oversized table body rows through Markdown Engine's public validation API and CLI, so consumers no longer need to implement that structural check themselves. Preserve existing header-validation and blank-cell semantics.

## Context / Constraints

The owner requested this task after inspecting delegation-planner's supplemental table validator on 2026-09-25. Engine 3.6.0 checks exact header columns but does not require each body row to contain those columns. The delegation helper compares normalized row/column coordinates separately. This is a reusable Engine concern; delegation section names and readiness decisions remain consumer policy.

Use an opt-in profile capability. A physically present empty cell satisfies row shape; a required nonblank value is separately enforced by existing text assertions. Use Engine's structural model and source locations, without a second Markdown parser. Do not change GFM parsing, silently strengthen existing profiles, or activate a new installed runtime. Calibration: TD1 Standard.

## Source Authority

| Source | Authority | Status | Task implication |
| --- | --- | --- | --- |
| Owner request, 2026-09-25: draft a Markdown Engine task for upstreaming table validation fixes. | Outcome and boundary. | Captured in this objective and scope. | Deliver generic row completeness, not delegation-specific policy. |
| Engine at `f490a2fdc9925977e918f29c8a921e5453c49146`: table and text assertion clauses in `docs/contracts/declarative-validation.md`, `src/declarative-validation/assertions/table-columns-exact.ts`, `src/ir/document-table-views.ts`. | Current public semantics and implementation baseline. | Relevant contract clauses and complete named modules read at remote main; package 3.6.0. | Preserve header matching and use existing normalized row/cell evidence. |
| Same Engine revision: `tests/declarative-validation-table-columns-exact.test.ts`. | Existing compatibility proof. | Read. | Exact-header and required-column behavior must remain unchanged. |
| `jasonbelmonti/delegation-planner` at `bc11ace3e50315313d428f3b681424fee910aef3`: `skills/delegation-planner/scripts/artifact_structure.py`, `tests/test_structure.py`, and `skills/delegation-planner/references/bundle-format.md`. | Reproducer and consumer boundary, not Engine architecture authority. | Read from matching source checkout. | Reproduce the missing-dynamic-row-cell gap; preserve selection scope and separate blank-value checks. |

Repository names identify their existing Git remotes. Read these sources at the recorded revisions, reconcile current repository instructions and relevant drift, and inspect additional implementation only as the selected route requires.

## Task Scope

| Scope item | Classification | Approval impact | Notes |
| --- | --- | --- | --- |
| Opt-in body-row completeness in the supported declarative profile, compiler, public types, evaluator and CLI. | In scope | Blocking | Each selected table's body rows must have exactly its header's column positions. |
| Located diagnostics, contract documentation and consumer-facing examples. | In scope | Blocking | Describe missing versus empty cells, excess cells, empty tables and selection scope. |
| Existing profile/API behavior and focused downstream proof. | In scope | Blocking | Prove the generic capability replaces the helper's row-shape decision for representative fixtures. |
| Reserved-marker/raw-source exclusion, delegation section vocabulary and semantic readiness. | Out of scope | Non-blocking | These are distinct behaviors, not prerequisites for row completeness. |
| Editing installed skills, Fleet pins, capsule runtime or consumer helper migration. | Follow-up | Non-blocking | Engine capability may land independently; consumers retain their helper until compatible runtime adoption. |

## Materially Verifiable Success Criteria

| ID | Criterion | Proof | Required before done |
| --- | --- | --- | --- |
| TD-SC-1 | An explicitly enabled profile rejects body rows missing any header column or containing extra columns, and accepts complete rows. | Public API and real CLI checks on independently authored complete, truncated and excess-cell Markdown; compare validity and failing row against the fixture oracle. | Yes |
| TD-SC-2 | Row shape remains distinct from content, row existence and table selection. | An explicit empty cell passes shape but fails a composed nonblank rule; a header-only table passes shape unless a separate row-count rule forbids it; no matched tables follows existing empty-selection failure; unselected malformed tables do not fail the rule. | Yes |
| TD-SC-3 | Each shape failure identifies its rule and offending table/row with deterministic expected/actual shape and truthful available source evidence. | Multiple malformed rows yield stable located findings across repeated API/CLI runs; compare locations to marked source lines; unavailable ranges are not invented. | Yes |
| TD-SC-4 | The capability is admitted consistently by the profile parser, exported contract and evaluator, with invalid configurations rejected through existing profile error behavior. | YAML and typed API positive cases plus wrong selector and malformed assertion cases exercise public entry points, rather than only a private helper. | Yes |
| TD-SC-5 | Existing profiles retain their behavior, and the documented new profile covers the delegation reproducer without consumer-side shape checking. | Preserve exact/required-header checks and ordinary normalization; run the documented example and an adapted missing-dynamic-row-cell fixture directly through Engine, showing old-profile pass and opt-in failure followed by repaired pass. | Yes |

## Incremental Value Delivery

| Slice | Value proven | Risk retired | Evidence | Stop / continue decision |
| --- | --- | --- | --- | --- |
| Generic structural decision | Selected malformed rows fail with usable evidence. | Header correctness masking body truncation. | TD-SC-1 through TD-SC-3. | Continue when real Markdown fixtures establish shape/content separation. |
| Public consumer adoption | The assertion is usable without a supplemental row parser or helper. | Unreachable feature or incompatible profile change. | TD-SC-4 and TD-SC-5. | Review when all required proof applies to the final state. |

## Review Boundary

| Boundary | In scope for review | Out of scope / follow-up | Approval impact |
| --- | --- | --- | --- |
| Correctness and compatibility | Selected-row decisions, public profile reachability, diagnostic evidence and preserved existing behavior. | Consumer-specific section names, raw marker rules and runtime rollout. | Incorrect decisions, silent compatibility changes or unusable public entry points block. |
| Maintainability and proof | Cohesive Engine ownership, reuse of its parser/model and independently specified observations. | Unrelated validation refactors and additional framework layers. | Concrete coupling, regressions or proof gaps caused by this change block; stylistic preferences do not. |

## Validation / Evidence

| Criterion ID | Check | Evidence | Runner / owner | Required before done |
| --- | --- | --- | --- | --- |
| TD-SC-1 | Exercise public API and CLI on complete, short and long rows. | Fixture bytes, expected outcomes, reports and exits; include escaped pipes, inline code, Unicode and nested tables where supported, so string-splitting implementations cannot pass by accident. | Implementer; reviewer inspects independent oracle. | Yes |
| TD-SC-2 | Compose shape with existing text/selection assertions. | Paired empty versus missing-cell cases, header-only and empty-selection cases, and selected/unselected table observations. | Implementer. | Yes |
| TD-SC-3 | Compare diagnostics with source locations and repeated output. | Expected row identities, expected/actual column observations, truthful ranges and stable ordering for multiple failures. | Implementer; reviewer. | Yes |
| TD-SC-4 | Validate schema, exported types and public runtime agreement. | Focused parser/compiler/API/CLI tests, typecheck and affected contract-document checks; invalid inputs must fail at the documented boundary. | Implementer. | Yes |
| TD-SC-5 | Run affected regressions and the documented downstream example. | Old/new profile contrast on the delegation reproducer, repaired pass, unchanged normalization/header behavior and applicable package/repository checks. | Implementer; independent task reviewer. | Yes |

Identify tested commits or retained changes, relevant fixtures/profile hashes, dependency lockfile and runtime versions. Implementation evidence is not yet available; task-profile validation is not feature proof.

## Execution Notes

Selected preparation route after readiness: PLAN_REQUIRED. The outcome is bounded, but profile contract, compiler/evaluator integration and public compatibility proof need an execution plan. The plan chooses syntax, placement and check sequencing; this task does not prescribe them.

Read this complete task and its listed controlling sources before reliance. Verify the adjacent checksum and reconcile against current main in a dedicated `codex/` worktree under this repository's `.worktrees/`. The task governs implementation acceptance; merge, publication and active runtime installation remain separate. Stop if the desired assertion requires changing existing parsing or profile semantics beyond this boundary.

### Execution Checkpoint

| Execution status | Current proving slice | Evidence admitted | Next action | Blockers / stop condition |
| --- | --- | --- | --- | --- |
| not-started | Prepare the public row-completeness implementation route. | None admitted. | After contract readiness, create the required execution plan against the reconciled baseline. | Stop on missing source authority or a required incompatible behavior change. |

## Follow-up / Non-blocking Work

After Engine delivery and approved runtime adoption, delegation-planner can move its owned-table selection into its profile and remove only the redundant row-shape check. Keep marker vocabulary, resource integrity and semantic readiness in their owning layers. Generic raw-source exclusion is a separate potential Engine task; native capsule references and context sizing are unrelated to this task.
