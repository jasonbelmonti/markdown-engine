Review the provided PR or diff as an independent reviewer.

## Packet Metadata
| Skill version | Packet schema version | Context sizing tier | Context sizing rationale |
| --- | --- | --- | --- |
| 2.2.0 | convergent-review.packet.v5 | standard | One additive assertion across existing profile/compile/evaluation boundaries; five fixed outcome criteria and compatibility proof. |

## Task Definition
Every value in this section is part of the frozen contract SHA-256.
- Objective: Let profile authors reject incomplete or oversized table body rows through public Markdown Engine validation API and CLI, preserving existing header-validation and blank-cell semantics.
- Intended behavior change: An opt-in v2 tableRowsComplete: true assertion checks selected table body rows against their own header column positions and returns located deterministic failures for missing/excess cells.
- In scope:
  - Public profile parser, compiler, exported types, evaluator and CLI reachability.
  - Located diagnostics, contract documentation, independently specified fixtures and consumer example.
  - Existing profile compatibility and focused downstream proof.
- Out of scope / non-goals:
  - Raw-source/reserved-marker validation; delegation vocabulary and semantic readiness.
  - Consumer helper migration, Fleet activation, capsule changes, runtime publication or installation.
  - Unrelated refactoring, architecture expansion, full release clean-tree acceptance or additional frameworks.
- Constraints / accepted tradeoffs:
  - Physically present empty cells satisfy shape; nonblank values and row existence require separate existing assertions.
  - Use the existing normalized model and available body-cell ranges; do not parse raw Markdown a second time or fabricate missing ranges.
  - Older installed runtimes reject the new opt-in assertion; deployment and consumer-helper removal are separate work.
  - Prepared task revision 1 is preserved unchanged; its preparation checkpoint is historical, with execution evidence recorded externally.
- Existing capability evidence:
  - src/ir/document-table-views.ts preserves actual cell coordinates, including short/excess rows.
  - Existing tableColumnsExact checks only normalized headers; table selectors already scope sections/header subsequences, and text.nonBlank/selectionCount supply independent composition.
  - The unchanged delegation missing-dynamic-row-cell fixture passes the legacy profile; the new assertion rejects it directly through public Engine entry points.

## Planning Context
| Planning artifact status |
| --- |
| found |
- Planned follow-up work:
  - Raw-source/reserved-marker validation; delegation vocabulary and semantic readiness.
  - Consumer helper migration, Fleet activation, capsule changes, runtime publication or installation.
  - Unrelated refactoring, architecture expansion, full release clean-tree acceptance or additional frameworks.

## Review Boundary
Judge only correctness and compatibility of selected-row decisions, public reachability, diagnostic evidence, preserved existing behavior, cohesive Engine ownership and independent proof. Incorrect decisions, silent compatibility changes, unusable public entry points or concrete coupling/regressions/proof gaps caused by this change block. Style preferences, broader cleanup and explicitly deferred consumer/raw-marker/runtime work do not block.

## Review Scope
Review the retained changes against the baseline, including new untracked production modules, tests, fixtures, contract documentation and recorded evidence. Use the reviewed-head manifest to identify exact bytes. Inspect directly relevant unchanged callers and normalized-model contracts as necessary. Task/plan scope stays frozen; no source edits, merge, publication, active installation or consumer migration in this review round.

## Cycle Control
| Cycle | Round | Maximum rounds | Contract SHA-256 | Baseline | Prior reviewed head | Reviewed head |
| --- | --- | --- | --- | --- | --- | --- |
| table-row-completeness-20260925 | 1 | 3 | 9399d70c4c9f751df9549ac2be678c11e69e2ae20d0842782c1b51e1b2ce5449 | git at https://github.com/jasonbelmonti/markdown-engine.git (revision f490a2fdc9925977e918f29c8a921e5453c49146) | git at https://github.com/jasonbelmonti/markdown-engine.git (revision f490a2fdc9925977e918f29c8a921e5453c49146) | worktree-manifest at /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task/.codefactory/convergent-reviews/table-row-completeness/round-1/reviewed-head.json (sha256 5277434428f2b47dd3833b99371dd76794278ae7ac39c876c4387c15a67e8481) |

- Artifact identity control: Review only the artifact identified by the Cycle Control reviewed head (worktree-manifest at /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task/.codefactory/convergent-reviews/table-row-completeness/round-1/reviewed-head.json (sha256 5277434428f2b47dd3833b99371dd76794278ae7ac39c876c4387c15a67e8481)); apply every frozen contract requirement artifact-relatively to that head.

## Frozen Acceptance Contract
- Baseline: git at https://github.com/jasonbelmonti/markdown-engine.git (revision f490a2fdc9925977e918f29c8a921e5453c49146)
- Criteria:
  - TD-SC-1: An explicitly enabled profile rejects body rows missing any header column or containing extra columns, and accepts complete rows. Required proof: Public API and real CLI checks on independently authored complete, truncated and excess-cell Markdown; compare validity and failing row against the fixture oracle.
    - Blocking justification: Accepting an incomplete or excess row or rejecting a complete row defeats the structural-validation objective.
  - TD-SC-2: Row shape remains distinct from content, row existence and table selection. Required proof: An explicit empty cell passes shape but fails a composed nonblank rule; a header-only table passes shape unless a separate row-count rule forbids it; no matched tables follows existing empty-selection failure; unselected malformed tables do not fail the rule.
    - Blocking justification: Conflating empty content, row existence or selection with row shape breaks supported composition and scopes.
  - TD-SC-3: Each shape failure identifies its rule and offending table/row with deterministic expected/actual shape and truthful available source evidence. Required proof: Multiple malformed rows yield stable located findings across repeated API/CLI runs; compare locations to marked source lines; unavailable ranges are not invented.
    - Blocking justification: Unstable or false row identity/shape/source evidence makes structural failures unactionable or misleading.
  - TD-SC-4: The capability is admitted consistently by the profile parser, exported contract and evaluator, with invalid configurations rejected through existing profile error behavior. Required proof: YAML and typed API positive cases plus wrong selector and malformed assertion cases exercise public entry points, rather than only a private helper.
    - Blocking justification: Unreachable or inconsistently admitted public behavior prevents consumers using the capability reliably.
  - TD-SC-5: Existing profiles retain their behavior, and the documented new profile covers the delegation reproducer without consumer-side shape checking. Required proof: Preserve exact/required-header checks and ordinary normalization; run the documented example and an adapted missing-dynamic-row-cell fixture directly through Engine, showing old-profile pass and opt-in failure followed by repaired pass.
    - Blocking justification: Legacy regressions or inability to cover the documented reproducer prevent compatible consumer adoption.
- Supported workflows:
  - Normalize real GFM Markdown through public parse/normalize then validateWithProfile, using typed or YAML/JSON-safe profiles.
  - Run the built CLI validate command with JSON output on complete, missing, excess, empty, header-only and scoped fixtures.
  - Compose assertions with existing nonblank, row-count, grouped and applicability behavior; preserve v1/v2 existing profiles.
  - Run the documented delegation example with legacy pass, opt-in fail, repaired pass, without consumer-side shape checking.
- Supported environment:
  - Repository package engines: Node ^20.19.0 or >=22.12.0; reviewed validation environment is macOS arm64, Node v22.20.0 and npm 11.13.0 with package-lock dependencies.
  - Public document 1.0.0 and v2 profile syntax; v1 remains unsupported for the new assertion. No new platform-support obligation.
- Threat model:
  - None; this cycle has no adversarial threat model.
- Non-goals:
  - Raw-source/reserved-marker validation; delegation vocabulary and semantic readiness.
  - Consumer helper migration, Fleet activation, capsule changes, runtime publication or installation.
  - Unrelated refactoring, architecture expansion, full release clean-tree acceptance or additional frameworks.
- Validation gates:
  - VG-1: Establish EP-GATE-1 against the reviewed artifact: build, 38 focused table-rows-complete tests through public API/real CLI, and tsc -p tsconfig.declarative-validation-contract.json pass. Retained results may be used only after checking their consumed source/test/fixture/dependency/generated-input fingerprints remain applicable.
  - VG-2: Establish EP-GATE-2 against the reviewed artifact: package typecheck, full tests, both contract-document checks, both boundary audits, documented consumer CLI exits 0/1/0, and bounded diff inspection pass. Confirm retained before/after manifests and current inputs; stale evidence requires affected rechecks, not broad new obligations.
- Frozen review boundary: Judge only correctness and compatibility of selected-row decisions, public reachability, diagnostic evidence, preserved existing behavior, cohesive Engine ownership and independent proof. Incorrect decisions, silent compatibility changes, unusable public entry points or concrete coupling/regressions/proof gaps caused by this change block. Style preferences, broader cleanup and explicitly deferred consumer/raw-marker/runtime work do not block.
- Frozen review scope: Review the retained changes against the baseline, including new untracked production modules, tests, fixtures, contract documentation and recorded evidence. Use the reviewed-head manifest to identify exact bytes. Inspect directly relevant unchanged callers and normalized-model contracts as necessary. Task/plan scope stays frozen; no source edits, merge, publication, active installation or consumer migration in this review round.

## Blocker Ledger
| Ledger status |
| --- |
| empty |

## Remediation Boundary
Round 1 performs broad review within the frozen contract; no remediation delta applies.
- Approval-affecting review is limited to the fix delta, ledger reproductions, frozen validation, and directly affected context.
- Novel unchanged-code claims block only when they prove a frozen criterion fails on the reviewed head.

## Expected Outcome
- Return a round recommendation of COMPLETE, REMEDIATE, or ESCALATE.

## Review Standard
- Judge the reviewed head only against the frozen acceptance contract and admissible blocker test.
- A blocker must reproduce material failure or corruption of a named criterion, demonstrate that criterion's frozen blocking justification applies, and run in a supported workflow on the reviewed head.
- Evaluate a supported-workflow reproduction without assuming hostile intent. If it materially violates a frozen criterion and its blocking justification applies, it may block regardless of who triggers it or whether the threat model is empty.
- If the blocker case instead depends on hostile intent or attacker-controlled preconditions to reproduce the failure or establish material impact, those conditions must be named in a non-empty frozen threat model; otherwise the finding is non-blocking.
- Classify speculation, unsupported environments, hardening, missing tests without demonstrated impact, and architecture preference as non-blocking.
- In remediation rounds, limit approval-affecting review to the fix delta, open ledger reproductions, frozen validation gates, and directly affected context.
- A novel unchanged-code claim may block only when it proves a frozen criterion fails on the reviewed head.
- Do not expand the frozen contract during a cycle; request ESCALATE when contract change is necessary.

## Explicit Review Criteria
- TD-SC-1: An explicitly enabled profile rejects body rows missing any header column or containing extra columns, and accepts complete rows. Required proof: Public API and real CLI checks on independently authored complete, truncated and excess-cell Markdown; compare validity and failing row against the fixture oracle.
  - Blocking justification: Accepting an incomplete or excess row or rejecting a complete row defeats the structural-validation objective.
- TD-SC-2: Row shape remains distinct from content, row existence and table selection. Required proof: An explicit empty cell passes shape but fails a composed nonblank rule; a header-only table passes shape unless a separate row-count rule forbids it; no matched tables follows existing empty-selection failure; unselected malformed tables do not fail the rule.
  - Blocking justification: Conflating empty content, row existence or selection with row shape breaks supported composition and scopes.
- TD-SC-3: Each shape failure identifies its rule and offending table/row with deterministic expected/actual shape and truthful available source evidence. Required proof: Multiple malformed rows yield stable located findings across repeated API/CLI runs; compare locations to marked source lines; unavailable ranges are not invented.
  - Blocking justification: Unstable or false row identity/shape/source evidence makes structural failures unactionable or misleading.
- TD-SC-4: The capability is admitted consistently by the profile parser, exported contract and evaluator, with invalid configurations rejected through existing profile error behavior. Required proof: YAML and typed API positive cases plus wrong selector and malformed assertion cases exercise public entry points, rather than only a private helper.
  - Blocking justification: Unreachable or inconsistently admitted public behavior prevents consumers using the capability reliably.
- TD-SC-5: Existing profiles retain their behavior, and the documented new profile covers the delegation reproducer without consumer-side shape checking. Required proof: Preserve exact/required-header checks and ordinary normalization; run the documented example and an adapted missing-dynamic-row-cell fixture directly through Engine, showing old-profile pass and opt-in failure followed by repaired pass.
  - Blocking justification: Legacy regressions or inability to cover the documented reproducer prevent compatible consumer adoption.

## Test Or Risk Context
- Earlier full gate reports 56 files / 722 tests passing and focused gate reports 38 passing; verify applicability and inspect oracle adequacy independently.
- Primary risks are incorrect row decisions, selection leakage, fabricated ranges, inconsistent public admission and silently stronger legacy semantics.

## Planning Artifacts
| Content status |
| --- |
| provided |

```text
## Task and plan authority
language: text

Read complete task /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task/docs/tasks/table-row-completeness.md revision 1, SHA-256 10b252a47e8ec4cf049610f4aee8537a160a6d7fb283562b90532c1e2defb4f3. Verify its adjacent checksum from docs/tasks. Read its full listed controlling sources. Engine baseline files are retrievable via git show of the Cycle Control baseline; compare current contract changes. Consumer checkout is /Users/jasonbelmonti/Documents/Development/delegation-planner/.worktrees/bounded-context-task at bc11ace3e50315313d428f3b681424fee910aef3. Read skills/delegation-planner/scripts/artifact_structure.py, tests/test_structure.py, skills/delegation-planner/references/bundle-format.md; reference only, never edit.
Read complete plan /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task/.codefactory/execution-plans/table-row-completeness/execution-plan.md revision 1, SHA-256 a7bb61c3261cc917ccafa0827d7c865efa9309a5a00a2ea7ec6b06bd4f4ccf88 and verify adjacent checksum. Task/plan readiness and earlier self-review do not determine your recommendation.
```

## Repo Or Local Instructions
| Content status |
| --- |
| provided |

```text
## Applicable operating instructions
language: text

Read the full task, plan and controlling sources before reliance; verify existing checksums. Source authority controls scope; summaries do not override it. Use installed /Users/jasonbelmonti/.codex/skills/task-definition/SKILL.md in REVIEW mode for the task-backed review and its review guide/profile as required. Review-only work must not mutate source artifacts. All five task criteria and the stated review boundary are fixed. A blocking maintainability finding must identify a concrete problem caused by the current change, affected code/contract and practical consequence; style and out-of-scope cleanup are non-blocking. Preserve existing changes. Work in the prepared worktree named below. No merge, publication, active runtime installation, consumer edits, Fleet or capsule changes. The supervisor already dispatched exactly three reviewers; perform your own independent review without spawning further reviewers or communicating with peers. Do not rebuild, npm install, or run scripts that overwrite implementation evidence in the shared checkout. Inspect verified dist or run focused read-only tests; use a temporary directory for additional reproduction. Return your evidence in the final answer; the supervisor persists reviewer outputs.
```

## Review Artifacts
| Content status |
| --- |
| provided |

```diff
## Current checkout and frozen identity verification
language: text

Worktree: /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task
Immutable reviewed artifact record is the manifest at /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task/.codefactory/convergent-reviews/table-row-completeness/round-1/reviewed-head.json. Read it, verify its SHA-256 against Cycle Control and compare listed file/directory hashes before relying on current contents. It includes tracked and untracked inputs plus generated dist hashes; a Git HEAD alone does not identify the reviewed changes. git diff shows tracked edits; changed-paths.json also names new files. Do not treat previous implementation conclusions as independent proof.
Changed path inventory: /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task/docs/validation/table-row-completeness/implementation/changed-paths.json
Tracked diff: /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task/docs/validation/table-row-completeness/implementation/tracked.patch (compare with current git diff)
Implementation report, logs, fixture outcomes and provenance: /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task/docs/validation/table-row-completeness/implementation/review.md, focused.log, focused-state.json, regression.log, regression-state.json, examples-state.json, final-state.json.
Additional context can be read from the repository as required by the frozen boundary.

## Source requirements and next-review instructions
language: text

Read complete task /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task/docs/tasks/table-row-completeness.md revision 1, SHA-256 10b252a47e8ec4cf049610f4aee8537a160a6d7fb283562b90532c1e2defb4f3. Verify its adjacent checksum from docs/tasks. Read its full listed controlling sources. Engine baseline files are retrievable via git show of the Cycle Control baseline; compare current contract changes. Consumer checkout is /Users/jasonbelmonti/Documents/Development/delegation-planner/.worktrees/bounded-context-task at bc11ace3e50315313d428f3b681424fee910aef3. Read skills/delegation-planner/scripts/artifact_structure.py, tests/test_structure.py, skills/delegation-planner/references/bundle-format.md; reference only, never edit.
Read complete plan /Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task/.codefactory/execution-plans/table-row-completeness/execution-plan.md revision 1, SHA-256 a7bb61c3261cc917ccafa0827d7c865efa9309a5a00a2ea7ec6b06bd4f4ccf88 and verify adjacent checksum. Task/plan readiness and earlier self-review do not determine your recommendation.
```

## Required Output
1. Round recommendation: COMPLETE, REMEDIATE, or ESCALATE
2. Ledger updates: stable finding ID, class, status, criterion ID, supported reproduction, expected/actual result, impact, current-head evidence, and attempt
3. Non-blocking observations: findings that fail the admissible blocker test
4. Rationale: brief evidence-based explanation
5. Assumptions or missing context that could affect confidence
