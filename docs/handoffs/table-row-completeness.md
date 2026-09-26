# Markdown Engine handoff prompt

Implement the task defined by `docs/tasks/table-row-completeness.md`, revision 1, in the Markdown Engine repository. Its SHA-256 is `10b252a47e8ec4cf049610f4aee8537a160a6d7fb283562b90532c1e2defb4f3`; verify `docs/tasks/table-row-completeness.sha256` from the task directory before relying on it.

Prepared worktree: `/Users/jasonbelmonti/Documents/Development/markdown-engine/.worktrees/table-row-validation-task`

Branch: `codex/table-row-validation-task`. Inspected source baseline: `f490a2fdc9925977e918f29c8a921e5453c49146` (3.6.0). The prepared task, handoff and validation records may be uncommitted; preserve them and any other existing changes. Reconcile current main and repository instructions before implementation. If using another worktree or machine, transfer these task artifacts unchanged and resolve their repository-relative paths there.

Read the complete task and its listed controlling sources first. The cross-repository reproducer is available in `/Users/jasonbelmonti/Documents/Development/delegation-planner/.worktrees/bounded-context-task` at `bc11ace3e50315313d428f3b681424fee910aef3`; use the exact paths listed by the task. That checkout is a source reference, not an edit target.

Use the installed task-definition skill in REVIEW mode to verify the contract against the current baseline. It is READY / PLAN_REQUIRED: create and validate the execution plan with the installed execution-plan skill before implementation. Then implement the approved route through a verified, review-ready result. Preserve the task's five criteria and review boundary.

Deliver opt-in body-row completeness through the public profile/API/CLI. Prove missing and excess cells fail, explicit empty cells remain a separate nonblank concern, selected-table scope is honored, and existing profiles retain their behavior. Capture independent expected outcomes, located diagnostics, relevant regression results and the documented consumer example.

Return changed paths, task/plan identities, evidence for each criterion, tested source state and remaining limitations. Keep raw-source marker validation, consumer helper migration, Fleet activation and capsule changes outside this task. Do not merge, publish or install an active runtime.
