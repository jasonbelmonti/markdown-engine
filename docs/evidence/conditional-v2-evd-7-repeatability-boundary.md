# Conditional V2 EVD-7: Repeatability and Boundary Audit

Issue: BEL-1112
Parent issue: BEL-1084
Blocked-by leaf: BEL-1111, completed 2026-05-30
Branch: `codex/BEL-1112-boundary-audit`
Worktree: `.worktrees/BEL-1112-boundary-audit`
Baseline: `origin/main` at `35cf733`
Date: 2026-05-30

## Scope

EVD-7 records Conditional V2 repeatability and boundary audit evidence for
MS-3. The scope is limited to repeatability proof output, nested-boundary
regex-like and executable-like rejection coverage, automated boundary audit
output, and boundary/security reviewer notes.

This evidence does not change Conditional V2 grammar semantics, runtime
behavior, public result shape, CLI JSON, parser, rich IR, network behavior, LLM
behavior, persistence behavior, downstream design-spec exercise breadth,
release verification, tag creation, package publication, or MS-3 approval.

No runtime behavior, public result shape, CLI JSON, parser, rich IR, network,
LLM, persistence, or feature semantics changed in this BEL-1112 boundary-audit
leaf.

## Repeatability Command

Run from `.worktrees/BEL-1112-boundary-audit` on 2026-05-30:

```sh
npm run test:validation:repeatability
```

The package script runs:

```sh
npm run build
vitest run tests/declarative-validation-repeatability.test.ts "--exclude=.worktrees/**"
node scripts/prove-declarative-validation-repeatability.mjs --runs 10
```

## Repeatability Result

```text
tests/declarative-validation-repeatability.test.ts (2 tests) passed
Declarative validation repeatability PASS
Runs: 10
Cases per run: 45
declarative-validation:v2-composite-cli-json: 69f624440dd8378dbe4acab11f2be9a3093d16257545117f7e8510fcb3ee3f00 (4971 bytes)
```

Representative Conditional V2 repeatability hashes remained stable on this
branch:

| Case | SHA-256 | Bytes |
| --- | --- | --- |
| `declarative-validation:v2-id-count-result:compact` | `d05a901565739b686c50f815f63d55c420ee9058de278f0a1c47150f93615d18` | 719 |
| `declarative-validation:v2-table-column-coverage-result:compact` | `c48b5114d3314d7cf5542791ca261bf1dcf31a416018cbe335c61427606852fc` | 741 |
| `declarative-validation:v2-composite-result:compact` | `5a8a30af0c089e376d53dc7eb4a38330f981f68528d69a21864533a8100b1f9d` | 3039 |
| `declarative-validation:v2-composite-evidence:compact` | `2bffed5953228e07e178b02c187ae77b0d9b10608ff6c84b2e5fdbe95e833c6d` | 1541 |
| `declarative-validation:v2-composite-cli-json` | `69f624440dd8378dbe4acab11f2be9a3093d16257545117f7e8510fcb3ee3f00` | 4971 |

Observed composite evidence hashes:

```text
v2-composite inputHash: 5a30ac5ef9348f32760eec7224a34401b45ab4d6723a9b90e2a7917a69ad3655
v2-composite profileHash: 87753d6efc394efdae86ce16dc05e8bf3b0514d0ce6d2c1b4aacdea5ee5f7899
```

## Nested Boundary Rejection Coverage

`tests/declarative-validation-profile.test.ts` includes explicit Conditional V2
nested-boundary rejection cases for regex-like and executable-like keys:

| Case | Boundary | Rejected key class | Expected diagnostic |
| --- | --- | --- | --- |
| `v2-when-regex-key` | rule-level `when` object | regex-like | `profile.config.unsupportedKey` |
| `v2-when-script-key` | rule-level `when` object | executable-like | `profile.config.unsupportedKey` |
| `v2-when-assertion-regexp-key` | `when.assert.text` object | regex-like | `profile.config.unsupportedKey` |
| `v2-branch-regexp-key` | grouped branch object | regex-like | `profile.config.unsupportedKey` |
| `v2-branch-script-key` | grouped branch object | executable-like | `profile.config.unsupportedKey` |
| `v2-branch-selector-pattern-key` | grouped branch `select.where` object | regex-like | `profile.config.unsupportedKey` |
| `v2-branch-selector-plugin-key` | grouped branch `select.where` object | executable-like | `profile.config.unsupportedKey` |
| `v2-branch-assertion-matches-key` | grouped branch `assert.text` object | regex-like | `profile.config.unsupportedKey` |
| `v2-branch-assertion-callback-key` | grouped branch `assert.text` object | executable-like | `profile.config.unsupportedKey` |

Run from `.worktrees/BEL-1112-boundary-audit` on 2026-05-30:

```sh
npm run test:validation:profile
```

Recorded result:

```text
tests/declarative-validation-profile.test.ts (56 tests) passed
```

## Boundary Audit Command

Run from `.worktrees/BEL-1112-boundary-audit` on 2026-05-30:

```sh
npm run audit:declarative-validation-boundary
```

The package script runs:

```sh
node scripts/check-declarative-validation-boundary.mjs
```

## Boundary Audit Result

```text
Declarative validation boundary audit PASS
Direct dependency matches: 0
Runtime boundary source matches: 0
Regex-like key rejection checks: present
Unsafe executable key rejection checks: present
Profile-specific core semantic matches: 0
```

## Executable-Key Rejection Summary

The boundary audit now checks that direct rejection coverage exists for:

- legacy regex-like keys: `matches`, `pattern`, `regex`, and `regexp`;
- legacy executable-like keys: `callback`, `eval`, `execute`, `expression`,
  `function`, `import`, `imports`, `plugin`, and `script`;
- Conditional V2 nested boundary cases listed in this evidence record;
- direct typed profile closure cases that prevent function-bearing values from
  reaching compiled plans;
- evidence wording for arbitrary JavaScript, expression evaluation,
  profile-sourced regex compilation, plugins, network calls, LLM calls, file
  watching, persistence, and profile-specific core semantics.

## Boundary/security reviewer notes

Approval status: pending boundary/security review.

Reviewer checks requested:

- Confirm Conditional V2 profile input remains closed, JSON-safe, deterministic,
  and inert at top-level, rule, branch, `when`, selector, assertion, and nested
  assertion object boundaries.
- Confirm regex-like keys and executable-like keys produce inert
  `profile.config.unsupportedKey` diagnostics rather than compiled predicates,
  profile-sourced regular expressions, callbacks, plugins, imports, or scripts.
- Confirm the audit reports zero forbidden dependency matches, zero runtime
  boundary source matches, and zero profile-specific core semantic matches.
- Confirm this BEL-1112 diff does not encode operational-design-spec,
  AGENTS.md, TASK.md, issue-key, entity-registry, relationship, semantic
  scoring, network, LLM, persistence, or file-watching behavior in core
  declarative validation code.

## Review Boundary

Review BEL-1112 for boundary audit correctness, Conditional V2 nested rejection
coverage, audit script enforcement, and the accuracy of this EVD-7 evidence
record. Downstream design-spec exercise, release readiness, rollback handoff,
tag creation, package publication, and MS-3 approval remain out of scope unless
this diff contradicts or prevents those later gates.

## Residual Risks

- The boundary audit is a targeted source, dependency, test-coverage, and
  evidence gate. It is not a complete static security analyzer.
- The CLI continues to read caller-specified local Markdown and profile files by
  design. This evidence excludes file watching, traversal services, background
  persistence, and API-owned writes, not explicit local file reads.
- EVD-8 downstream design-spec exercise and EVD-9 release-readiness handoff
  remain future WP-7 / MS-4 work.

## Conclusion

BEL-1112 boundary audit evidence passes pending boundary/security review.
Conditional V2 nested profile structures reject regex-like and executable-like
keys with inert diagnostics, repeatability remains stable across 10 runs, and
the automated boundary audit reports no executable predicates, profile-sourced
regex execution, plugins, network calls, LLM calls, persistence, file watching,
or design-spec-specific core semantics.
