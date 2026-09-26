---
type: ExecutionPlan
title: Implement opt-in table body row completeness
plan_id: table-row-completeness
artifact_version: "2.0"
revision: "1"
created_at: "2026-09-25T14:00:00+00:00"
updated_at: "2026-09-25T14:00:00+00:00"
target_repo: /Users/jasonbelmonti/Documents/Development/markdown-engine
target_worktree: /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task
target_branch: codex/table-row-validation-task
baseline_ref: f490a2fdc9925977e918f29c8a921e5453c49146
source_contract: docs/tasks/table-row-completeness.md revision 1 SHA-256 10b252a47e8ec4cf049610f4aee8537a160a6d7fb283562b90532c1e2defb4f3
validation_profile: /Users/jasonbelmonti/.codex/skills/execution-plan/profiles/execution-plan.yaml
---

## Plan Control

| Plan state | Planning depth | Source status | Baseline status | State rationale |
| --- | --- | --- | --- | --- |
| READY | standard | current | inspected | Source and route audits pass; final candidate requires both validators and checksum promotion before execution. |

## Source Contract

| Source ID | Source reference | Version / fingerprint | Authority | Status | Planning implication |
| --- | --- | --- | --- | --- | --- |
| EP-SRC-1 | docs/tasks/table-row-completeness.md | revision 1; SHA-256 10b252a47e8ec4cf049610f4aee8537a160a6d7fb283562b90532c1e2defb4f3 | Completion contract; latest user instructions take precedence | current | Preserve five criteria and exclusions. |
| EP-SRC-2 | User handoff and supplied AGENTS.md operating manual | 2026-09-25 conversation | Repository operation and authorization | current | Use prepared worktree; preserve existing files; no merge, publication or runtime installation. |
| EP-SRC-3 | docs/contracts/declarative-validation.md; src/declarative-validation/assertions/table-columns-exact.ts; src/ir/document-table-views.ts; tests/declarative-validation-table-columns-exact.test.ts | f490a2fdc9925977e918f29c8a921e5453c49146 | Existing public semantics and compatibility baseline | current | Reuse normalized cells; retain existing headers, selection and text behavior. |
| EP-SRC-4 | /Users/jasonbelmonti/Documents/Development/delegation-planner/.worktrees/bounded-context-task/skills/delegation-planner/scripts/artifact_structure.py; same checkout tests/test_structure.py and skills/delegation-planner/references/bundle-format.md | bc11ace3e50315313d428f3b681424fee910aef3 | Read-only consumer reproducer; not Engine architecture authority | current | Adapt missing-dynamic-row-cell fixture; do not migrate consumer. |

## Outcome Anchors

| Outcome ID | Source IDs | Source location | Required observable | Proof obligation |
| --- | --- | --- | --- | --- |
| EP-OUT-1 | EP-SRC-1 | TD-SC-1 | Opt-in rejects missing/excess cells and accepts complete rows | Independent Markdown oracle through typed API, YAML and real CLI; escaped pipes, code, Unicode and nested tables |
| EP-OUT-2 | EP-SRC-1 | TD-SC-2 | Shape is separate from content, existence and scope | Empty cells, header-only, unmatched and unselected malformed tables; composed nonblank and row count |
| EP-OUT-3 | EP-SRC-1 | TD-SC-3 | Stable findings identify rule, table, row and shape | Literal expected coordinates and marked lines across repeated API/CLI; absent ranges omitted |
| EP-OUT-4 | EP-SRC-1 | TD-SC-4 | Public parser, types, compiler and evaluator agree | Positive typed/YAML inputs; wrong selectors and malformed assertions fail at public boundaries |
| EP-OUT-5 | EP-SRC-1 | TD-SC-5 | Existing profiles and consumer example retain compatibility | Header and normalization regressions; old/new/repaired downstream fixture and documented example |

## Baseline Findings

| Finding ID | Repository evidence | Current behavior / constraint | Planning implication | Confidence |
| --- | --- | --- | --- | --- |
| EP-FIND-1 | git status; HEAD; fetched origin/main; local main ancestry | HEAD and origin/main are f490a2f; local main 76f920f is ancestor; only untracked prepared docs exist | Preserve prepared task/handoff/validation files; no baseline merge needed | confirmed |
| EP-FIND-2 | src/ir/document-table-views.ts tableCells; baseline normalize probe | Normalized cells retain short and excess rows, explicit empties, row/column indexes and source ranges | Compare coordinates without parser or IR changes | confirmed |
| EP-FIND-3 | profile/assertion-schema.ts; compiler/assertion-builders.ts; assertions/evaluator.ts under src/declarative-validation | Separate v2 admission lists, builder registry, compatibility switch and evaluator dispatch | Wire a true-only v2 capability across existing seams with focused new modules | confirmed |
| EP-FIND-4 | src/declarative-validation/selectors/table-targets.ts; assertions/diagnostics.ts | Table selection already scopes headers and descendant sections; diagnostics accept explicit ranges | Use selected tables and available body-cell range; include table ID and row index in message | confirmed |
| EP-FIND-5 | package.json; package-lock.json; installed markdown-engine; npm ci | Engine 3.6.0 task profile passes; local dependencies installed; build succeeds | Use installed runtime only for plan validation; local build for feature proof | confirmed |

## Preconditions

| Precondition ID | Required state / input | Verification | Unmet trigger ID |
| --- | --- | --- | --- |
| EP-PRE-1 | Unchanged task and approved READY plan, matching baseline and preserved prepared files | Verify adjacent SHA-256 files, git status and HEAD; inspect source drift | EP-TRIG-1 |
| EP-PRE-2 | Local locked dependencies and Node runtime available | npm ci completed; node --version; npm run build | EP-TRIG-2 |

## Implementation Decisions

| Decision ID | Kind | Decision or assumption | Finding IDs | Evidence / rationale | Affected action IDs | Replan trigger ID |
| --- | --- | --- | --- | --- | --- | --- |
| EP-DEC-1 | decision | Add v2 tableRowsComplete: true only for table selectors | EP-FIND-3 | Standalone opt-in avoids silently strengthening tableColumnsExact; a boolean avoids unused configuration. Reject v1 and all non-true payloads. | EP-ACT-1 | EP-TRIG-1 |
| EP-DEC-2 | decision | Compare sorted body-cell column indexes with each table header; emit one assertionFailed per bad row | EP-FIND-2, EP-FIND-4 | Reuse Engine model, not delimiter splitting; deterministic message includes table target ID, row index, expected and actual coordinates. Use first available row-cell range, otherwise omit range. Header-only passes. | EP-ACT-1, EP-ACT-2 | EP-TRIG-1 |
| EP-DEC-3 | decision | Use independent literal expectations and public entry points in focused tests plus regression suite | EP-FIND-5 | Private helper-only checks cannot establish reachability. Baseline old-profile acceptance establishes opt-in gap. | EP-ACT-2, EP-ACT-3 | EP-TRIG-2 |

## Execution Phases

| Phase ID | Phase objective | Entry precondition IDs | Safe intermediate state |
| --- | --- | --- | --- |
| EP-PH-1 | Public capability with focused proof | EP-PRE-1, EP-PRE-2 | Buildable opt-in assertion with passing public API and CLI cases |
| EP-PH-2 | Consumer adoption documentation and regression evidence | EP-PRE-1, EP-PRE-2 | Review-ready retained changes with all criteria mapped to applicable results |

## Execution Route

| Step ID | Kind | Phase ID | Required prior Step IDs |
| --- | --- | --- | --- |
| EP-ACT-1 | action | EP-PH-1 | None |
| EP-ACT-2 | action | EP-PH-1 | EP-ACT-1 |
| EP-GATE-1 | gate | EP-PH-1 | EP-ACT-2 |
| EP-ACT-3 | action | EP-PH-2 | EP-GATE-1 |
| EP-GATE-2 | gate | EP-PH-2 | EP-ACT-3 |

## Execution Actions

| Action ID | Precondition IDs | Outcome IDs | Targets | Concrete action | Observable postcondition | Evidence to capture | Failure response ID |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EP-ACT-1 | EP-PRE-1, EP-PRE-2 | EP-OUT-1, EP-OUT-2, EP-OUT-3, EP-OUT-4, EP-OUT-5 | src/declarative-validation profile, compiler and assertions modules | Add exported true-only property, v2 schema admission, focused builder, compatible table dispatch and row evaluator | Public validation invokes shape checking without altering parser, IR or old assertions | Source diff and build output | EP-RESP-1 |
| EP-ACT-2 | EP-PRE-1, EP-PRE-2 | EP-OUT-1, EP-OUT-2, EP-OUT-3, EP-OUT-4, EP-OUT-5 | tests/declarative-validation-table-rows-complete*.test.ts; tests/declarative-validation-contract.test.ts; fixtures/declarative-validation/examples/table-rows-complete | Author static input oracle and typed/API/CLI regression cases including downstream adaptation | Tests distinguish missing, excess, explicit empty, scoped and header-only outcomes with exact row identities and source lines | Fixture bytes and focused reports under docs/validation/table-row-completeness/implementation | EP-RESP-1 |
| EP-ACT-3 | EP-PRE-1, EP-PRE-2 | EP-OUT-4, EP-OUT-5 | docs/contracts/declarative-validation.md; example README and YAML; package.json; scripts/check-declarative-validation-contract-docs.mjs | Document syntax, diagnostics and composition; include assertion tests in focused script and documentation check | Runnable consumer example states old-profile pass, new-profile fail and repaired pass; existing command checks include capability | Documentation diff and example CLI JSON/exits | EP-RESP-1 |

## Change Footprint

| Path / component | Action IDs | Change type | Purpose | Confidence | Risk / ownership note |
| --- | --- | --- | --- | --- | --- |
| src/declarative-validation/profile/index.ts and assertion-schema.ts | EP-ACT-1 | modify | Export and admit v2 true-only property | confirmed | Small additions to existing admission dispatch |
| src/declarative-validation/compiler/{assertions,assertion-builders,compatibility,plan}.ts and table-rows-complete.ts | EP-ACT-1 | modify/add | Compile and validate capability in focused builder | confirmed | Preserve deterministic existing assertion order |
| src/declarative-validation/assertions/{evaluator,table-rows-complete}.ts | EP-ACT-1 | modify/add | Compare normalized coordinates and locate failures | confirmed | No parser, selector or IR mutations |
| tests/declarative-validation-table-rows-complete*.test.ts and declarative-validation-contract.test.ts | EP-ACT-2 | add/modify | Public behavior and exported compile contract | confirmed | Independent oracle, no snapshot regeneration |
| fixtures/declarative-validation/examples/table-rows-complete | EP-ACT-2, EP-ACT-3 | add | Consumer example and static downstream fixture | confirmed | Read-only adaptation from separate repository |
| docs/contracts/declarative-validation.md; scripts/check-declarative-validation-contract-docs.mjs; package.json | EP-ACT-3 | modify | Document and wire focused regression checks | confirmed | No dependency, release or installation changes |
| docs/validation/table-row-completeness/implementation | EP-ACT-1, EP-ACT-2, EP-ACT-3 | add | Retain evidence, checksums and tested state | confirmed | Never overwrite prepared validation records |

## Validation Gates

| Gate ID | Outcome IDs | Command or check | Expected observation | Evidence capture | Evidence artifact | Evidence verification | Failure response ID |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EP-GATE-1 | EP-OUT-1, EP-OUT-2, EP-OUT-3, EP-OUT-4, EP-OUT-5 | npm run build; npx vitest run tests/declarative-validation-table-rows-complete*.test.ts --exclude=.worktrees/**; npx tsc -p tsconfig.declarative-validation-contract.json | Complete passes; short/long fail on independently marked rows; empty passes shape but fails nonblank; row-count and selection independent; v1/bad payload/selector rejected; repeated diagnostics stable | Capture stdout, stderr and exit statuses; fingerprint src, tests, fixtures, package files, scripts and configuration before and after checks; retain generated dist hashes and Node/npm versions. Unexpected input drift invalidates result. | docs/validation/table-row-completeness/implementation/focused.log and tested-state manifests | Require expected exits and assertions; compare before/after manifests. Recheck affected gates after code, fixture, test, shared dependency or configuration changes; preserve historical failures and reuse only demonstrably unaffected results. | EP-RESP-1 |
| EP-GATE-2 | EP-OUT-1, EP-OUT-2, EP-OUT-3, EP-OUT-4, EP-OUT-5 | npm run typecheck; npm test; npm run docs:declarative-validation-contract; npm run docs:rich-ir-contract; node scripts/check-boundaries.mjs; npm run audit:declarative-validation-boundary; node dist/cli/index.js validate on documented old/new/repaired fixtures | All applicable checks pass; real CLI exits 0/1/0 for consumer old/new/repaired; no old header or normalization regressions; inspect full diff for scope and ownership | Capture stdout, stderr and exit statuses; fingerprint src, tests, fixtures, package files, scripts and configuration before and after checks; retain generated dist hashes and Node/npm versions. Unexpected input drift invalidates result. | docs/validation/table-row-completeness/implementation/regression.log, consumer reports, final-state manifest and review.md | Require expected exits and assertions; compare before/after manifests. Recheck affected gates after code, fixture, test, shared dependency or configuration changes; preserve historical failures and reuse only demonstrably unaffected results. | EP-RESP-1 |

## Failure and Replan Controls

| Response ID | Trigger | Containment | Exact recovery / rollback procedure | Single restored safe state | Verification | Escalation trigger ID |
| --- | --- | --- | --- | --- | --- | --- |
| EP-RESP-1 | Any action or proving gate fails | Stop dependent route steps; retain logs and changes locally | Save git diff and untracked fingerprints to implementation evidence; repair only task-owned changes and rerun affected gate; do not reset prepared artifacts | Preserved local worktree with failed evidence excluded from admission | git status plus comparison with initial prepared-file hashes; passing affected gate required for continuation | EP-TRIG-2 |

| Trigger ID | Observable trigger | Stopped Step IDs | Evidence to preserve | Required decision / input | Exact resume condition |
| --- | --- | --- | --- | --- | --- |
| EP-TRIG-1 | Task integrity mismatch or behavior requires parser/legacy semantic changes | EP-ACT-1, EP-ACT-2, EP-ACT-3, EP-GATE-1, EP-GATE-2 | Current hashes, diff and source comparison | Owner clarification or restored exact source | Verified authority and revalidated route permit implementation |
| EP-TRIG-2 | Build/check failure, unexpected source drift or unavailable tool | EP-ACT-2, EP-ACT-3, EP-GATE-1, EP-GATE-2 | Failure logs and input manifests | Implementer diagnosis within scope; owner if scope changes | Fixed inputs and applicable affected gate pass; revise route if targets/order change |

### Compatibility and Versioning

EP-ACT-1 adds an opt-in v2 assertion. EP-GATE-2 preserves v1 and existing v2 behavior. Older runtimes reject the new assertion; consumers retain their helper until separately approved runtime adoption. EP-RESP-1 and EP-TRIG-1 stop any need to change existing semantics. No publication or installed runtime activation belongs to this route.

## Plan Readiness

| Decision | Reviewed at | Evidence / rationale | Required revision or blocker |
| --- | --- | --- | --- |
| PASS | 2026-09-25T14:00:00+00:00 Codex | Bounded self-audit: five exact TD-SC anchors map to public proving actions and gates; inspected model preserves coordinates; twelve route-audit questions pass. Source/task validation is current; ordered phases end in gates; independent expected outcomes and input fingerprints prevent circular or stale proof; recovery preserves existing changes. | None. |

## Revision Log

| Revision | Timestamp | Actor | Material change | Reason / source | Checksum reference |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-09-25T14:00:00+00:00 | Codex | Create opt-in row completeness route | Task revision 1 and inspected f490a2f baseline | execution-plan.sha256 |
