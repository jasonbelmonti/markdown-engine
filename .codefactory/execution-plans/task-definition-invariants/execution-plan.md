---
type: ExecutionPlan
title: Enforce Task Definition deterministic invariants
plan_id: task-definition-invariants
artifact_version: "2.0"
revision: "2"
created_at: 2026-09-13T07:55:47-05:00
updated_at: 2026-09-13T07:55:47-05:00
target_repo: /Users/jasonbelmonti/Documents/Development/markdown-engine
target_worktree: /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants
target_branch: codex/task-definition-invariants
baseline_ref: ec9c5bfe5ecb9c5c8cc4a075f5d4e46e599fcd30
source_contract: /Users/jasonbelmonti/Documents/Codex/2026-09-13/can/outputs/markdown-engine-handoff/task-definition.md sha256 a0b4449baf21de3ecc7da2df07a56895b4757e81d9736ef378dc32970af2afb0
validation_profile: /Users/jasonbelmonti/.codex/skills/execution-plan/profiles/execution-plan.yaml
---

## Plan Control

| Plan state | Planning depth | Source status | Baseline status | State rationale |
| --- | --- | --- | --- | --- |
| READY | standard | current | inspected | Sources reconciled; route audit and both candidate validators pass; checksum verified before execution. |

## Source Contract

| Source ID | Source reference | Version / fingerprint | Authority | Status | Planning implication |
| --- | --- | --- | --- | --- | --- |
| EP-SRC-1 | /Users/jasonbelmonti/Documents/Codex/2026-09-13/can/outputs/markdown-engine-handoff/task-definition.md | a0b4449baf21de3ecc7da2df07a56895b4757e81d9736ef378dc32970af2afb0 | Task contract controls outcomes; snapshots subordinate to latest user instruction | current | Preserve the six criteria and optional checkpoint contract. |
| EP-SRC-2 | /Users/jasonbelmonti/Documents/Codex/2026-09-13/can/outputs/markdown-engine-handoff/sources/task-definition.SKILL.md | 7df492c2db1c686499ddd7907bc42fe5e1b72f984f05999028d7b8cc7aee8373 | Task contract controls outcomes; snapshots subordinate to latest user instruction | current | Preserve the six criteria and optional checkpoint contract. |
| EP-SRC-3 | /Users/jasonbelmonti/Documents/Codex/2026-09-13/can/outputs/markdown-engine-handoff/sources/task-definition-authoring-guide.md | 8f223b980e7b63022a39c1620502c9a7ef3dfaaf3a98bbcbfcfffc8fbe117627 | Task contract controls outcomes; snapshots subordinate to latest user instruction | current | Preserve the six criteria and optional checkpoint contract. |
| EP-SRC-4 | /Users/jasonbelmonti/Documents/Codex/2026-09-13/can/outputs/markdown-engine-handoff/sources/task-definition-review-guide.md | 1d93d428a9d3958d97e793337691f1db2f63e05c304692dfc77115a21cb97b03 | Task contract controls outcomes; snapshots subordinate to latest user instruction | current | Preserve the six criteria and optional checkpoint contract. |
| EP-SRC-5 | /Users/jasonbelmonti/Documents/Codex/2026-09-13/can/outputs/markdown-engine-handoff/sources/task-definition.baseline.yaml | 57d8498e8fc14641ffef404bd48d4f5604d49ac45a07419b08dbd2c8010f6cdc | Task contract controls outcomes; snapshots subordinate to latest user instruction | current | Preserve the six criteria and optional checkpoint contract. |
| EP-SRC-6 | /Users/jasonbelmonti/Documents/Codex/2026-09-13/can/outputs/markdown-engine-handoff/sources/run-profile-validation.baseline.sh | 89390950b35e3374ddf361c3eb5320235aa9cf94ccaf26c888dd2ee827197ea2 | Task contract controls outcomes; snapshots subordinate to latest user instruction | current | Preserve the six criteria and optional checkpoint contract. |
| EP-SRC-7 | /Users/jasonbelmonti/Documents/Codex/2026-09-13/can/outputs/markdown-engine-handoff/repro/README.md | 462e4ec36778ccaad4ccc61f3ed50d040d0cda44ad6bf70b227f8e87764bec6f | Task contract controls outcomes; snapshots subordinate to latest user instruction | current | Preserve the six criteria and optional checkpoint contract. |
| EP-SRC-8 | User supplied AGENTS.md and handoff request | 2026-09-13 current task | Repository operation and latest authority | current | Use project-local worktrees; plan before implementation; do not publish. |
| EP-SRC-9 | /Users/jasonbelmonti/Documents/Development/task-definition/.worktrees/task-definition-invariants | 040fb2b740f52459a8e55cbb0fe2e08ee691109b | Maintained consumer baseline | current | Profile and guides match packet; installed cache is not edited. |

## Outcome Anchors

| Outcome ID | Source IDs | Source location | Required observable | Proof obligation |
| --- | --- | --- | --- | --- |
| EP-OUT-1 | EP-SRC-1 | TD-SC-1 | Exactly one control authority table and data row; blocked detail table allowed. | CLI positive and negative fixtures, hashes, diagnostics and relevant regression output. |
| EP-OUT-2 | EP-SRC-1 | TD-SC-2 | Optional checkpoint; one heading at depth three within Execution Notes, one table and row. | CLI positive and negative fixtures, hashes, diagnostics and relevant regression output. |
| EP-OUT-3 | EP-SRC-1 | TD-SC-3 | Allowed status and visibly nonempty checkpoint cells; preserve valid sentinels. | CLI positive and negative fixtures, hashes, diagnostics and relevant regression output. |
| EP-OUT-4 | EP-SRC-1 | TD-SC-4 | Only declared evidence IDs; review-ready covers required criteria in evidence cell only. | CLI positive and negative fixtures, hashes, diagnostics and relevant regression output. |
| EP-OUT-5 | EP-SRC-1 | TD-SC-5 | Two supplied positives pass, four negatives fail, consumer and runtime compatibility pass. | CLI positive and negative fixtures, hashes, diagnostics and relevant regression output. |
| EP-OUT-6 | EP-SRC-1 | TD-SC-6 | Deliver consumer enforcement, committed tests, actionable diagnostics and capability explanation. | CLI positive and negative fixtures, hashes, diagnostics and relevant regression output. |

## Baseline Findings

| Finding ID | Repository evidence | Current behavior / constraint | Planning implication | Confidence |
| --- | --- | --- | --- | --- |
| EP-FIND-1 | Engine origin/main ec9c5bf; package.json; evidence/before.json | 3.5.0 reproduces all six passes; main checkout is stale 3.4.0 with unrelated untracked files. | Use clean worktree at fetched 3.5.0; preserve main checkout. | confirmed |
| EP-FIND-2 | /Users/jasonbelmonti/Documents/Development/task-definition/.worktrees/task-definition-invariants/skills/task-definition/profiles/task-definition.yaml | Byte-identical to frozen profile; maintained authoring and review guides match. | Edit consumer worktree directly and provide portable patch. | confirmed |
| EP-FIND-3 | src/declarative-validation/selectors/table-targets.ts; assertions/text-length.ts; sections-required.ts | selectionCount, exact columns, anyOf, when and scoped tables support shape/status; tables can be counted globally and in both ancestor and checkpoint. | Use existing profile primitives for shape and status; no parent-selector extension. | confirmed |
| EP-FIND-4 | assertions/table-column-coverage.ts; profile/assertion-schema.ts; compiler/assertion-shapes.ts | Coverage reads all source rows, fails on empty ID source, has no sibling filter. Text length counts raw HTML and spaces. | Add opt-in coverage source rowWhere and allowEmptySource; text.nonBlank checks visible normalized node text. | confirmed |

## Preconditions

| Precondition ID | Required state / input | Verification | Unmet trigger ID |
| --- | --- | --- | --- |
| EP-PRE-1 | Frozen packet, isolated engine and consumer worktrees, Node and Python | Verify SHA256SUMS; git status; npm run build; compare profile hash | EP-TRIG-1 |

## Implementation Decisions

| Decision ID | Kind | Decision or assumption | Finding IDs | Evidence / rationale | Affected action IDs | Replan trigger ID |
| --- | --- | --- | --- | --- | --- | --- |
| EP-DEC-1 | decision | Reuse cardinality, table scoping, exact columns, existing predicates and conditional groups for shape and statuses. | EP-FIND-3 | One global matching table plus counts in both required sections proves shared containment; blanket section table limits would reject blocker details. | EP-ACT-1 | EP-TRIG-1 |
| EP-DEC-2 | decision | Extend coverage with source.rowWhere and allowEmptySource, and text with opt-in nonBlank using node text excluding raw HTML. | EP-FIND-4 | Finite ID enumeration would constrain declared IDs; unfiltered coverage rejects optional criteria. Blanket HTML exclusion rejects visible prose/code. Preserve old defaults. | EP-ACT-2, EP-ACT-3 | EP-TRIG-1 |
| EP-DEC-3 | decision | Edit maintained consumer in separate worktree; deliver patch and tested profile with evidence. | EP-FIND-1, EP-FIND-2 | Direct consumer enforcement is required; no release, wrapper activation, or fleet changes. | EP-ACT-4 | EP-TRIG-1 |

## Execution Phases

| Phase ID | Phase objective | Entry precondition IDs | Safe intermediate state |
| --- | --- | --- | --- |
| EP-PH-1 | Prove consumer control and checkpoint shape | EP-PRE-1 | Shape/status enforcement uses unchanged engine and valid controls survive. |
| EP-PH-2 | Close coverage and visibility gaps and deliver compatible changes | EP-PRE-1 | All required fixtures and compatibility gates pass with concrete delivery. |

## Execution Route

| Step ID | Kind | Phase ID | Required prior Step IDs |
| --- | --- | --- | --- |
| EP-ACT-1 | action | EP-PH-1 | None |
| EP-GATE-1 | gate | EP-PH-1 | EP-ACT-1 |
| EP-ACT-2 | action | EP-PH-2 | EP-GATE-1 |
| EP-ACT-3 | action | EP-PH-2 | EP-ACT-2 |
| EP-ACT-4 | action | EP-PH-2 | EP-ACT-3 |
| EP-GATE-2 | gate | EP-PH-2 | EP-ACT-4 |

## Execution Actions

| Action ID | Precondition IDs | Outcome IDs | Targets | Concrete action | Observable postcondition | Evidence to capture | Failure response ID |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EP-ACT-1 | EP-PRE-1 | EP-OUT-1, EP-OUT-2, EP-OUT-3 | /Users/jasonbelmonti/Documents/Development/task-definition/.worktrees/task-definition-invariants/skills/task-definition/profiles/task-definition.yaml and tests | Add control counts, checkpoint global and scoped counts, exact columns and allowed statuses; add CLI fixture matrix for shape. | Shape/status negatives fail; positive controls pass. | Profile diff and shape fixture JSON | EP-RESP-1 |
| EP-ACT-2 | EP-PRE-1 | EP-OUT-3, EP-OUT-4, EP-OUT-5 | src/declarative-validation/profile, compiler, selectors/table-targets.ts, assertions/table-column-coverage.ts and text.ts; new focused helper modules and tests | Add generic opt-in source row filtering and empty-source policy, plus visible text nonBlank predicate through parse/compile/evaluate surfaces. | New profiles express required invariants; unchanged profiles retain existing semantics. | Engine diff and focused runtime test output | EP-RESP-1 |
| EP-ACT-3 | EP-PRE-1 | EP-OUT-3, EP-OUT-4, EP-OUT-5 | /Users/jasonbelmonti/Documents/Development/task-definition/.worktrees/task-definition-invariants/skills/task-definition/profiles/task-definition.yaml and tests | Wire nonBlank and conditional coverage rules; add all required status, cell, reference, optional and formatting cases. | Every supplied and expanded case matches the contract through ordinary validate. | Expanded matrix JSON with profile and input hashes, exit status and diagnostics | EP-RESP-1 |
| EP-ACT-4 | EP-PRE-1 | EP-OUT-1, EP-OUT-2, EP-OUT-3, EP-OUT-4, EP-OUT-5, EP-OUT-6 | docs/contracts/declarative-validation.md; consumer maintenance notes; evidence and delivery artifacts | Document capability ownership and structural limits, run full regressions, capture before/after results, commit both changes and emit applicable consumer patch. | Delivery identifies engine and consumer commits, profile fingerprint, regression results and blockers. | Patch, corrected YAML, report, command outputs and commit metadata | EP-RESP-1 |

## Change Footprint

| Path / component | Action IDs | Change type | Purpose | Confidence | Risk / ownership note |
| --- | --- | --- | --- | --- | --- |
| /Users/jasonbelmonti/Documents/Development/task-definition/.worktrees/task-definition-invariants/skills/task-definition/profiles/task-definition.yaml | EP-ACT-1, EP-ACT-3 | modify | Enforce deterministic consumer invariants | confirmed | Separate consumer repository; no installed cache changes. |
| src/declarative-validation/profile and compiler | EP-ACT-2 | modify | Parse and compile opt-in fields with closed schemas | confirmed | Keep typed and file-profile validation consistent. |
| src/declarative-validation/assertions and selectors/table-targets.ts | EP-ACT-2 | modify | Evaluate filtered coverage and visible text | confirmed | Preserve default empty-source failure and existing text behavior. |
| tests and consumer skills/task-definition/tests | EP-ACT-1, EP-ACT-2, EP-ACT-3 | add | CLI contract matrix and engine compatibility regressions | confirmed | No external proof verification. |
| docs/contracts/declarative-validation.md; consumer maintenance notes; delivery | EP-ACT-4 | add or modify | Document capability contract and tested integration | confirmed | No publishing or fleet activation. |

## Validation Gates

| Gate ID | Outcome IDs | Command or check | Expected observation | Evidence capture | Evidence artifact | Evidence verification | Failure response ID |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EP-GATE-1 | EP-OUT-1, EP-OUT-2, EP-OUT-3 | Run consumer shape matrix via Python and dist/cli/index.js validate; run existing consumer run-profile-validation.sh | Shape/status failures identify intended rules; valid controls and blocker table pass. | Save JSON matrix and shell stdout with exit status | evidence/shape.json and evidence/consumer-shape.log | Check every case matches expected validity and intended rule; shell exits zero. | EP-RESP-1 |
| EP-GATE-2 | EP-OUT-1, EP-OUT-2, EP-OUT-3, EP-OUT-4, EP-OUT-5, EP-OUT-6 | npm run typecheck; npm test; boundary and contract doc checks; consumer shell suite and expanded Python matrix; packet repro/run.py --expect fixed | All required negatives reject with diagnostics, valid documents pass, compatibility suite green. | Retain logs and runner JSON, tested commits and profile SHA256; inspect patch with git apply --check against named baseline. | evidence/after.json, evidence/matrix.json, evidence/regressions.log and delivery report | Verify allMatched, exit statuses, diagnostic rule IDs, fingerprints and clean applicable patch. | EP-RESP-1 |

## Failure and Replan Controls

| Response ID | Trigger | Containment | Exact recovery / rollback procedure | Single restored safe state | Verification | Escalation trigger ID |
| --- | --- | --- | --- | --- | --- | --- |
| EP-RESP-1 | Required fixture or compatibility failure | Stop dependent actions; preserve diff and output in worktree. | Repair only owned changed files; if route cannot be repaired, retain isolated worktree and compare clean baseline with git diff ec9c5bf. | Original checkout and installed runtime remain unchanged. | git status in original repositories; compare installed wrapper before any resumed work. | EP-TRIG-1 |

| Trigger ID | Observable trigger | Stopped Step IDs | Evidence to preserve | Required decision / input | Exact resume condition |
| --- | --- | --- | --- | --- | --- |
| EP-TRIG-1 | Source conflict, required shape change, incompatible default behavior, or missing tool prevents gate | EP-ACT-1, EP-ACT-2, EP-ACT-3, EP-ACT-4, EP-GATE-1, EP-GATE-2 | Diff, baseline and failed CLI JSON | Task owner authority for source changes; route revision for compatible technical repair | Reload resolved source or repaired tools, revise and validate plan before dependent work. |

### Compatibility and Versioning

EP-ACT-2 preserves unspecified-field behavior. EP-ACT-3 requires the modified engine revision; EP-ACT-4 records that commit and the profile hash without declaring a published version. EP-GATE-2 verifies old consumers. EP-RESP-1 contains failures; EP-TRIG-1 blocks incompatible runtime changes.

## Plan Readiness

| Decision | Reviewed at | Evidence / rationale | Required revision or blocker |
| --- | --- | --- | --- |
| PASS | 2026-09-13T07:55:47-05:00 Codex | Bounded self-audit: six source anchors mapped; inspected targets justify extensions; route is ordered and gated; isolated reversible changes; compatibility proof and recovery specified. No product or approval decision remains. | None. |

## Revision Log

| Revision | Timestamp | Actor | Material change | Reason / source | Checksum reference |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-09-13T07:55:47-05:00 | Codex | Create source-bounded route after baseline reproduction and capability inspection. | User PLAN_REQUIRED contract and inspected 3.5.0/040fb2b sources. | execution-plan.sha256 |
| 2 | 2026-09-13T07:55:47-05:00 | Codex | Correct planning timestamp to observed local clock; preserve route. | Metadata correction; outcome and route unchanged. | execution-plan.sha256 |
