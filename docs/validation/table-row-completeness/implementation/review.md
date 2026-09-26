# Table row completeness implementation evidence

Status: review-ready retained changes; independent review has not been performed.

Before review, read the complete task, execution plan and their controlling sources.
Repository/worktree root: `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task`. All relative paths below resolve there.

- Task: `docs/tasks/table-row-completeness.md`, task ID `profile-table-row-completeness`, revision 1, SHA-256 `10b252a47e8ec4cf049610f4aee8537a160a6d7fb283562b90532c1e2defb4f3`. Adjacent checksum remains unchanged and verified.
- Plan: `.codefactory/execution-plans/table-row-completeness/execution-plan.md`, plan ID `table-row-completeness`, revision 1, READY, SHA-256 `a7bb61c3261cc917ccafa0827d7c865efa9309a5a00a2ea7ec6b06bd4f4ccf88`. Verify adjacent `execution-plan.sha256` from its directory before reliance.
- Controlling sources: task Source Authority; `docs/contracts/declarative-validation.md` table/text clauses; `src/declarative-validation/assertions/table-columns-exact.ts`; `src/ir/document-table-views.ts`; `tests/declarative-validation-table-columns-exact.test.ts`, originally read at `f490a2fdc9925977e918f29c8a921e5453c49146`. The contract now contains the additive feature documentation. Source comparison shows existing semantics retained.
- Read-only consumer: `/Users/jasonbelmonti/Documents/Development/delegation-planner/.worktrees/bounded-context-task`, commit `bc11ace3e50315313d428f3b681424fee910aef3`; exact source paths and byte hashes are retained in `examples-state.json`. Its helper, tests and bundle-format reference were read before implementation.

## Contract and plan readiness

Operation REVIEW: task verdict READY; observed and recommended state/route are READY / PLAN_REQUIRED. The installed 3.6.0 runtime returned exit 0, `valid: true`, no diagnostics (`task-review-profile.json`). Semantic review found all five criteria objectively testable, aligned with the cited sources, and contained by the stated review boundary. No blocking findings. Syntax and ordering were properly delegated to planning. The original task/checkpoint is preserved as preparation history; this evidence reports execution progress without changing its authority.

Operation CREATE: plan semantic route audit PASS; structural profile and relational validator both exit 0, `valid: true`, no diagnostics (`plan-profile.json`, `plan-relational.json`). The structural engine version is 3.6.0. The validated candidate was promoted with checksum-first installation, reread and verified before EP-ACT-1. EP-ACT-1 through EP-ACT-3 and EP-GATE-1/2 are now executed. Plan readiness does not establish independent acceptance.

Remote main was fetched and matched the prepared HEAD `f490a2fdc9925977e918f29c8a921e5453c49146`. Local main `76f920f` is an ancestor. No merge was necessary. No filesystem AGENTS.md was found on the applicable repository ancestry; the supplied operating manual governed the work. Existing task, handoff and preparation validation files were fingerprinted and remain byte-identical (`prepared-inputs.json`).

## Criterion evidence

| Criterion | Observation and proof |
| --- | --- |
| TD-SC-1 | Static `oracle.json` and Markdown fixtures independently specify complete, truncated and excess outcomes. Typed public API, YAML admission and real built CLI agree; complete passes, short/long fail. Escaped pipes, literal code, Unicode and blockquote nesting are included. `focused.log` and `oracle-*.json` retain observations. |
| TD-SC-2 | API composition tests prove explicit empty cells pass shape but fail `text.nonBlank`; header-only passes shape but fails a separate row-count minimum; no tables produces emptySelection; section descendants and header filters exclude unrelated malformed tables. Fixture validity is also verified through CLI. |
| TD-SC-3 | Exact API diagnostic expectations for two malformed rows include table ID, numeric row index, expected/actual coordinates, line, column and offset. Repeated API and real CLI output is stable. Multiple tables use their own header widths. Removing body-cell ranges yields no fabricated range even when the table range exists. `oracle-multiple.json` retains located output. |
| TD-SC-4 | Public parser and direct validation reject seven malformed payload classes, four wrong selector kinds, and v1 admission. Exported `DeclarativeAssertion` compiles with `true` and rejects `false`. Grouped/applicability paths use existing semantics. Real CLI invalid payload and selector cases fail at their documented boundaries. Dedicated contract TypeScript check and package typecheck exit 0. |
| TD-SC-5 | Full suite: 56 files, 722 tests pass, including existing exact/required headers, normalization snapshots, compatibility and repeatability. Unchanged consumer fixture passes installed baseline and local legacy profile; new profile fails row 2 at line 20; adding the missing identity cell passes. See consumer reports and runnable example README. No consumer-side shape helper runs. |

Independent oracle: `fixtures/declarative-validation/examples/table-rows-complete/oracle.json`. The exact consumer diagnostic is rule `sources.columns`, table `node:4:table`, body row 2, expected `[0,1,2,3]`, actual `[0,1,2]`, range line 20 columns 1–18, offsets 493–510. Expected exits are 0/1/0; raw reports and commands are retained in `examples-state.json` and `consumer-*.json`.

## Tested state and applicability

Tested HEAD: `f490a2fdc9925977e918f29c8a921e5453c49146` with retained modifications on `codex/table-row-validation-task`; it is not a clean-commit proof. Node `v22.20.0`, npm `11.13.0`, locked dependencies from SHA-256 `3087a38d23c70609e951d33f97c1236b86c50adc2d49cba97cd8393e5b076985`. `regression-state.json` fingerprints tracked and relevant untracked sources, tests, fixtures, snapshots, scripts, configuration, documents, dependency installation lock and native binding before/after the gate; the manifests match. Generated `dist` fingerprints are included. `final-state.json` confirms these inputs still match at handoff and records generated bundled artifacts.

`changed-paths.json` fingerprints every changed feature path (digest `b044ae130516819a554782f776b83e2cc993b2ffb6e0a72132a0a24cdbb3992f`); `tracked.patch` retains tracked changes, and new files remain in the worktree. Reassess relevant input fingerprints before relying on results. Source, fixture, assertion, shared dependency or configuration changes invalidate affected checks; preserve prior logs and rerun affected gates. Documentation-only changes do not invalidate runtime checks unless consumed by them.

The focused gate passed 38 tests plus build and exported-contract TypeScript checks. Later changes were the README, contract documentation, doc checker and package focused-test script; runtime source and typed-contract inputs remained unchanged. The final full suite reran all focused runtime tests, and the final documentation/boundary gates passed.

Commands retained in `regression.log`, all exit 0:

- `npm run typecheck`
- `npm test` (56 files / 722 tests)
- `npm run docs:declarative-validation-contract`
- `npm run docs:rich-ir-contract`
- `node scripts/check-boundaries.mjs`
- `npm run audit:declarative-validation-boundary`

The first focused attempt exposed a test expectation error: allOf publishes a group diagnostic and nests row diagnostics in branch evidence. The test was corrected to the existing contract; production behavior did not change. The first full attempt passed 717 tests but could not load cmark-gfm because initial dependency installation suppressed lifecycle scripts. `npm rebuild cmark-gfm` restored the test dependency; the final full suite passed. Historical failures remain in `*-attempt-1.*` and are not admitted as successful proof.

## Changed paths

- `docs/contracts/declarative-validation.md`
- `fixtures/declarative-validation/examples/table-rows-complete/README.md`
- `fixtures/declarative-validation/examples/table-rows-complete/blockquote.md`
- `fixtures/declarative-validation/examples/table-rows-complete/complete.md`
- `fixtures/declarative-validation/examples/table-rows-complete/consumer-missing.md`
- `fixtures/declarative-validation/examples/table-rows-complete/consumer-repaired.md`
- `fixtures/declarative-validation/examples/table-rows-complete/excess.md`
- `fixtures/declarative-validation/examples/table-rows-complete/explicit-empty.md`
- `fixtures/declarative-validation/examples/table-rows-complete/header-only.md`
- `fixtures/declarative-validation/examples/table-rows-complete/legacy.yaml`
- `fixtures/declarative-validation/examples/table-rows-complete/missing.md`
- `fixtures/declarative-validation/examples/table-rows-complete/multiple.md`
- `fixtures/declarative-validation/examples/table-rows-complete/oracle.json`
- `fixtures/declarative-validation/examples/table-rows-complete/profile.yaml`
- `fixtures/declarative-validation/examples/table-rows-complete/shape.yaml`
- `fixtures/declarative-validation/examples/table-rows-complete/syntax.md`
- `package.json`
- `scripts/check-declarative-validation-contract-docs.mjs`
- `src/declarative-validation/assertions/evaluator.ts`
- `src/declarative-validation/assertions/table-rows-complete.ts`
- `src/declarative-validation/compiler/assertion-builders.ts`
- `src/declarative-validation/compiler/assertions.ts`
- `src/declarative-validation/compiler/compatibility.ts`
- `src/declarative-validation/compiler/plan.ts`
- `src/declarative-validation/compiler/table-rows-complete.ts`
- `src/declarative-validation/profile/assertion-schema.ts`
- `src/declarative-validation/profile/index.ts`
- `tests/declarative-validation-contract.test.ts`
- `tests/declarative-validation-table-rows-complete-cli.test.ts`
- `tests/declarative-validation-table-rows-complete-config.test.ts`
- `tests/declarative-validation-table-rows-complete.test.ts`

Planning artifacts: `.codefactory/execution-plans/table-row-completeness/execution-plan.md` and its adjacent checksum. Execution evidence: this `docs/validation/table-row-completeness/implementation/` directory. Prepared files outside that directory were preserved.

## Review and limitations

Bounded self-review found no blocking defect. New compiler and evaluator modules own the behavior; existing large schema, type and dispatch files receive only necessary vocabulary/admission wiring. The scalar schema check stays beside the existing true-only `exists` check; unrelated refactoring would increase the change boundary. No parser, IR, selector, consumer helper, Fleet pin, capsule or raw-marker behavior changed.

The original source contract remains revision 1 and unchanged. Independent review is the next action. Older runtimes reject the opt-in assertion; consumers retain their helper until separately approved runtime adoption. No version bump, merge, publication or active runtime installation occurred. The release clean-tree gate was not claimed: these are intentionally retained uncommitted changes. Existing tests only exercised installer behavior in temporary test locations.
