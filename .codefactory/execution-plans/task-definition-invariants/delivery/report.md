# Task Definition invariant delivery

Implemented and tested within TD-SC-1 through TD-SC-6. The reordered-authority blocker from independent review is repaired; Round 2 review is pending.
This is an implementation self-review against the supplied Review Boundary;
structural validation does not establish evidence truth or implementation acceptance.

Before reviewing or resuming, read the complete controlling task first:
[/Users/jasonbelmonti/Documents/Codex/2026-09-13/can/outputs/markdown-engine-handoff/task-definition.md](/Users/jasonbelmonti/Documents/Codex/2026-09-13/can/outputs/markdown-engine-handoff/task-definition.md).
Then read its controlling snapshots under [/Users/jasonbelmonti/Documents/Codex/2026-09-13/can/outputs/markdown-engine-handoff/sources](/Users/jasonbelmonti/Documents/Codex/2026-09-13/can/outputs/markdown-engine-handoff/sources),
and the validated [execution plan](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/execution-plan.md) with its
[checksum](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/execution-plan.sha256). Source comparisons are retained in
[source-comparison.json](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/source-comparison.json).
The packet SHA256SUMS verification passed for all 20 entries. At implementation baseline, the maintained profile, guides and baseline suite matched the packet. Consumer main later advanced to cbfec4bab0a19ca9f70a4b159b60176ecb7cd407 with documentation-only proof guidance; its profile and runtime tests are unchanged. The updated upstream example also passes the corrected profile.

| Component | Baseline | Delivered / tested revision |
| --- | --- | --- |
| Markdown Engine | `ec9c5bfe5ecb9c5c8cc4a075f5d4e46e599fcd30` | `fb9aa69bac5d12bdb860b985a3dc6bc48027e267` |
| Task Definition consumer | `040fb2b740f52459a8e55cbb0fe2e08ee691109b` | `45d326db4937e76ffc311398b37e46d4aeede61b` |

Both repositories use branch `codex/task-definition-invariants` in their own
project-local `.worktrees/task-definition-invariants` checkout. The engine
reports version **3.5.0**, with unreleased extensions identified by the exact
implementation commit above. Released 3.5.0 alone cannot execute this corrected
profile. No published version or installed-wrapper activation is claimed.

Corrected profile SHA256: `068798f6e0e95256e4fa1d7d469380b7781bdeb4a039186d0da45ff6bdb959b2`.
Baseline profile SHA256: `57d8498e8fc14641ffef404bd48d4f5604d49ac45a07419b08dbd2c8010f6cdc`.

[Corrected profile](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/delivery/task-definition.yaml) · [Applicable consumer patch](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/delivery/task-definition.patch)
· [Committed consumer source](/Users/jasonbelmonti/Documents/Development/task-definition/.worktrees/task-definition-invariants/skills/task-definition/profiles/task-definition.yaml)
· [Capability and maintenance notes](/Users/jasonbelmonti/Documents/Development/task-definition/.worktrees/task-definition-invariants/skills/task-definition/tests/README.md).

Apply the patch to the named consumer baseline with `git apply --check` followed
by `git apply`. Verification in an isolated worktree used `git apply --index`;
the resulting tree `492dbcea00962b686ac98e23a7aec45104f7e49f` exactly matches the
committed consumer tree. The applied profile passed all six supplied probes:
[applied-patch.json](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/applied-patch.json).

| Supplied fixture | Before: valid / exit | After: valid / exit |
| --- | --- | --- |
| baseline | true / 0 | true / 0 |
| checkpoint-baseline | true / 0 | true / 0 |
| duplicate-control-row | true / 0 | false / 1 |
| duplicate-checkpoint-row | true / 0 | false / 1 |
| invalid-checkpoint-status | true / 0 | false / 1 |
| review-ready-without-evidence | true / 0 | false / 1 |

The two positives remain valid. All four invalid fixtures previously passed with
no diagnostics; they now fail with `task-control.row.count`,
`execution-checkpoint.row.when-present`, `execution-checkpoint.status.allowed`,
or `execution-checkpoint.required-evidence.coverage`, respectively.
[Before results](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/before.json) and [after results](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/after.json)
retain engine version, input/profile file hashes, exit status, and diagnostics.

| Required criterion | Observed evidence |
| --- | --- |
| TD-SC-1 | Control zero/duplicate rows and tables fail; duplicate headings fail; existing BLOCKED detail-table case passes. |
| TD-SC-2 | Absent checkpoint passes; missing, duplicate, wrong-depth, misplaced and decoy structures fail, including table-before-heading and sibling-section cases. |
| TD-SC-3 | Every allowed status passes with coherent content; all five columns reject empty, whitespace, comments, empty HTML and whitespace entities; prose, Markdown formatting and literal code pass. |
| TD-SC-4 | Undeclared IDs fail; review-ready rejects missing/partial required references and references only elsewhere. Required/optional and all-optional cases pass appropriately. Declared renamed IDs and prose proof references pass. |
| TD-SC-5 | Six supplied cases match fixed expectations; 83 existing consumer cases and 99 invariant cases pass; 684 engine tests pass across 53 files. |
| TD-SC-6 | Consumer and engine changes plus tests are committed; patch applies to its named baseline and matches its tested tree; every negative matrix case asserts a diagnostic identifying its intended rule. |

Existing capabilities enforce cardinality, placement, exact checkpoint columns,
status tokens, and reference-or-sentinel shape. Global table uniqueness plus
section-scoped checks prove the checkpoint table belongs to both Execution Notes
and Execution Checkpoint without a new selector feature.

The necessary reusable v2 extensions are `text.nonBlank`,
`tableColumnCoverage.source.rowWhere`, and `tableColumnCoverage.allowEmptySource`.
The sibling filter reuses existing normalized cell predicate semantics. The empty
source policy preserves old failure behavior by default and permits legitimate
no-evidence or all-optional cases only when source structure resolves. These options
are implemented in generic schema, compiler, and evaluator layers; the engine has
no Task Definition headings, statuses, or criterion prefixes hardcoded into it.

Proof records:

- [99-case invariant matrix](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/matrix.json): all matched, with raw file hashes and intended diagnostic rules.
- [83 existing consumer results](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/consumer-results.json): CLI evidence hashes, actual exit statuses and top-level diagnostics; [suite log](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/consumer-regressions.log).
- [Full engine regression log](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/regressions.log): 684 tests, 53 test files, zero failures.
- [Focused extension tests](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/engine-focused.log): 45 tests pass, including typed/file profile rejection, source-less diagnostics, optional filtering and visible text across selector targets.
- [Typecheck](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/typecheck.log), [boundary audit](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/boundaries.log), [validation boundary audit](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/validation-boundaries.log), [Rich IR documentation](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/rich-ir-docs.log), and [validation documentation](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/validation-docs.log): all pass.
- [Plan structural validator](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/plan-profile.json) and [plan relational validator](/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/task-definition-invariants/.codefactory/execution-plans/task-definition-invariants/evidence/plan-relations.json): valid, no diagnostics; semantic route audit PASS.

The criterion-reference checks do not verify that a cited test ran, evidence is
fresh, a claim is true, or implementation deserves acceptance. The visible-text
predicate does not evaluate CSS or browser rendering. Publishing, fleet activation,
and unrelated skill recommendations remain outside this delivery.

Convergent review Round 1 independently found `TD-CONTROL-REORDERED-DUPLICATE`
(TD-SC-1): a second authority table with reordered columns escaped the ordered
header selector. Two reviewers raised the same blocker and the supervisor
reproduced exit 0 with no diagnostics. The consumer now rejects all five
noncanonical orders of the complete authority field set using existing
`selectionCount` and header selectors. No engine code changed during remediation.
Twenty new negative cases cover every reordered permutation with rows or no rows,
in Task Control or elsewhere. All twenty failed their expected rejection before
the fix and now reject; a new positive sharing only one header remains valid.
The 83 existing cases and complete 99-case matrix pass. Historical pre-review
matrix/after results retain the former profile hash and are not current admission.

PRs: [engine #218](https://github.com/jasonbelmonti/markdown-engine/pull/218) and
[consumer #14](https://github.com/jasonbelmonti/task-definition/pull/14).
The original execution plan remains applicable: this bounded consumer repair
follows EP-RESP-1 and EP-ACT-1/EP-ACT-4 with no outcome, route or boundary change.
