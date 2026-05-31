# Conditional V2 EVD-7: Repeatability and Boundary Consolidation

Issue: BEL-1113
Issue: BEL-1112
Parent issue: BEL-1084
Consolidates: BEL-1111 repeatability evidence and BEL-1112 boundary audit evidence
Branch under review: `codex/BEL-1113-repeatability-boundary-evd7`
Evidence command commit: `951c627f4dfc39d7c841c2e7e8659039e3d98a0e`
Worktree: `.worktrees/BEL-1113-repeatability-boundary-evd7`
Baseline: `main` / `origin/main` at `951c627`
Date: 2026-05-31

Audit coverage phrase: Conditional V2 EVD-7: Repeatability and Boundary Audit.

## Scope

EVD-7 records Conditional V2 repeatability and boundary audit evidence for
MS-3 review. This BEL-1113 consolidation covers repeatability command output,
10-run deterministic evidence notes, boundary audit output, executable-key
rejection coverage, reviewer notes, and the exact branch or commit under
review.

This evidence does not change Conditional V2 grammar semantics, runtime
behavior, public result shape, CLI JSON, parser, rich IR, network behavior, LLM
behavior, persistence behavior, downstream design-spec exercise breadth,
release verification, tag creation, package publication, or MS-3 approval.

No runtime behavior, public result shape, CLI JSON, parser, rich IR, network,
LLM, persistence, fixture, release-readiness, or feature semantics changed in
this BEL-1113 evidence-consolidation leaf.

## Source Evidence

This record consolidates the following prior leaf outputs:

| Source | Branch | Command date | Evidence carried forward |
| --- | --- | --- | --- |
| BEL-1111 | `codex/BEL-1111-repeatability` | 2026-05-30 | Conditional V2 API result JSON, CLI validation JSON, standalone evidence JSON, and 10-run deterministic hashes. |
| BEL-1112 | `codex/BEL-1112-boundary-audit` | 2026-05-30 | Nested regex-like and executable-like key rejection coverage, boundary audit output, executable-key rejection summary, and boundary/security reviewer notes. |

BEL-1112 is merged into `main` at merge commit `951c627`, so the BEL-1113
worktree contains both source evidence sets before this consolidation.

## Repeatability Command

Run from `.worktrees/BEL-1113-repeatability-boundary-evd7` on 2026-05-31:

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

The BEL-1113 rerun proves byte-for-byte deterministic output across 10 runs for
45 repeatability cases. Conditional V2 coverage includes flat passing and
failing cases, grouped branch cases, skipped `when` cases, ID count bounds,
table-column coverage, standalone evidence JSON, and CLI validation JSON.

Representative Conditional V2 repeatability hashes from the BEL-1113 rerun:

| Case | SHA-256 | Bytes |
| --- | --- | --- |
| `declarative-validation:v2-flat-passing-result:compact` | `c9e91c6c27f37e4858e07d0afffa6e24d27fc7dead725c3ea9df85677cfb72d8` | 713 |
| `declarative-validation:v2-flat-failing-result:compact` | `d461e21934f6f0165d2af9b620386de7c5382a0a33fd7dc398f7174b49c78983` | 2372 |
| `declarative-validation:v2-grouped-result:compact` | `434182a8f5d8b4f977ebf56db94ec9749d8906cb2f751ebcc865c9b183c4f689` | 5744 |
| `declarative-validation:v2-when-result:compact` | `b0d39218a1aae02a3c6d458ae4e1d5a21ff0ea30263b000d0add2b589bf50a37` | 1425 |
| `declarative-validation:v2-id-count-result:compact` | `d05a901565739b686c50f815f63d55c420ee9058de278f0a1c47150f93615d18` | 719 |
| `declarative-validation:v2-table-column-coverage-result:compact` | `c48b5114d3314d7cf5542791ca261bf1dcf31a416018cbe335c61427606852fc` | 741 |
| `declarative-validation:v2-composite-result:compact` | `5a8a30af0c089e376d53dc7eb4a38330f981f68528d69a21864533a8100b1f9d` | 3039 |
| `declarative-validation:v2-composite-evidence:compact` | `2bffed5953228e07e178b02c187ae77b0d9b10608ff6c84b2e5fdbe95e833c6d` | 1541 |
| `declarative-validation:v2-composite-cli-json` | `69f624440dd8378dbe4acab11f2be9a3093d16257545117f7e8510fcb3ee3f00` | 4971 |

Observed Conditional V2 evidence hashes from the BEL-1113 rerun:

```text
v2-flat-passing inputHash: 8f3376c2986860c3acb6ac94fa40226aacae8b0cbd50da5b804701f2510d6a56
v2-flat-passing profileHash: 51e970b199657e6edbc3fd6aef15af21dfd8b77c7e4b29eb05f48ddf0aba1cbf
v2-grouped inputHash: 5eaac330a75e0355dca7b534f2ce01880ede3f702545e9fab0b86eac01d3fb70
v2-grouped profileHash: 0f9a07ce52075f4a7f17d9020a1363633de2c4e7b932515a65293b4f57d0e968
v2-when inputHash: 5eaac330a75e0355dca7b534f2ce01880ede3f702545e9fab0b86eac01d3fb70
v2-when profileHash: d26d32116a487081212bbb46bd4f082e50b9c9f9c0bd25a1697f83cec5fb1fdb
v2-id-count inputHash: 5a30ac5ef9348f32760eec7224a34401b45ab4d6723a9b90e2a7917a69ad3655
v2-id-count profileHash: ed8ef4cc7413c4e9fd8c7735a37d5f016dd32d702c456243e29a6ff94720e874
v2-table-column-coverage inputHash: 5a30ac5ef9348f32760eec7224a34401b45ab4d6723a9b90e2a7917a69ad3655
v2-table-column-coverage profileHash: b5e20132a5295f708b2465c4e6c6b6b8e67f6c75cf53bb082d99902846df4319
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

Run from `.worktrees/BEL-1113-repeatability-boundary-evd7` on 2026-05-31:

```sh
npm run test:validation:profile
```

Recorded BEL-1113 result:

```text
tests/declarative-validation-profile.test.ts (56 tests) passed
```

## Boundary Audit Command

Run from `.worktrees/BEL-1113-repeatability-boundary-evd7` on 2026-05-31:

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

The boundary audit and profile coverage check that direct rejection coverage
exists for:

- legacy regex-like keys: `matches`, `pattern`, `regex`, and `regexp`;
- legacy executable-like keys: `callback`, `eval`, `execute`, `expression`,
  `function`, `import`, `imports`, `plugin`, and `script`;
- Conditional V2 nested boundary cases listed in this evidence record;
- direct typed profile closure cases that prevent function-bearing values from
  reaching compiled plans;
- evidence wording for arbitrary JavaScript, expression evaluation,
  profile-sourced regex compilation, plugins, network calls, LLM calls, file
  watching, persistence, and profile-specific core semantics.

The expected behavior is inert `profile.config.unsupportedKey` diagnostics, not
compiled predicates, profile-sourced regular expressions, callbacks, imports,
plugins, scripts, network calls, LLM calls, persistence, or file watching.

## MS-3 Boundary and Determinism Findings

No untracked MS-3 boundary or determinism finding remains in this BEL-1113
consolidation. The currently tracked findings are:

| Finding area | Tracking status | Evidence |
| --- | --- | --- |
| 10-run deterministic API, CLI, and evidence JSON output | tracked and passing | `npm run test:validation:repeatability` passed with 10 runs and 45 cases per run. |
| Conditional V2 nested regex-like key rejection | tracked and passing | `tests/declarative-validation-profile.test.ts` includes the nested cases listed above and passed 56 tests. |
| Conditional V2 nested executable-like key rejection | tracked and passing | `tests/declarative-validation-profile.test.ts` includes the nested cases listed above and passed 56 tests. |
| Forbidden dependency and runtime boundary source matches | tracked and passing | Boundary audit reports zero direct dependency matches and zero runtime boundary source matches. |
| Profile-specific core semantic leakage | tracked and passing | Boundary audit reports zero profile-specific core semantic matches. |
| Boundary/security reviewer approval | tracked and pending | Reviewer checks remain requested below. |

## Boundary/Security Reviewer Notes

Boundary/security reviewer notes remain pending review.

Approval status: pending boundary/security review.

BEL-1114 MS-3 gate status on 2026-05-31: not approved for final
implementation merge readiness. The BEL-1114 gate record at
`docs/evidence/conditional-v2-ms-3-gate-bel-1114.md` found that this EVD-7
artifact exists and the repeatability/boundary validation gates pass, but no
boundary/security reviewer approval was recorded in this artifact or in the
fetched GitHub PR #166 and PR #167 metadata.

Reviewer checks requested:

- Confirm Conditional V2 profile input remains closed, JSON-safe,
  deterministic, and inert at top-level, rule, branch, `when`, selector,
  assertion, and nested assertion object boundaries.
- Confirm regex-like keys and executable-like keys produce inert
  `profile.config.unsupportedKey` diagnostics rather than compiled predicates,
  profile-sourced regular expressions, callbacks, plugins, imports, or scripts.
- Confirm the audit reports zero forbidden dependency matches, zero runtime
  boundary source matches, and zero profile-specific core semantic matches.
- Confirm the BEL-1113 diff remains evidence-only and does not encode
  operational-design-spec, AGENTS.md, TASK.md, issue-key, entity-registry,
  relationship, semantic scoring, network, LLM, persistence, file-watching, or
  release-readiness behavior in core declarative validation code.

## Review Boundary

Review BEL-1113 for EVD-7 consolidation completeness, deterministic command
output accuracy, boundary audit output accuracy, Conditional V2 nested
rejection coverage, executable-key rejection summary accuracy, tracked MS-3
boundary/determinism findings, reviewer-note clarity, and evidence-only scope.

Runtime behavior, public result shape, CLI JSON semantics, parser behavior,
rich IR behavior, downstream design-spec exercise, release readiness, rollback
handoff, tag creation, package publication, and MS-3 approval remain out of
scope unless this diff contradicts or prevents those later gates.

## Residual Risks

- The repeatability proof covers representative Conditional V2 inputs, not all
  possible Markdown/profile inputs.
- The boundary audit is a targeted source, dependency, test-coverage, and
  evidence gate. It is not a complete static security analyzer.
- The CLI continues to read caller-specified local Markdown and profile files by
  design. This evidence excludes file watching, traversal services, background
  persistence, and API-owned writes, not explicit local file reads.
- Boundary/security reviewer approval remains pending.
- EVD-8 downstream design-spec exercise and EVD-9 release-readiness handoff
  remain future WP-7 / MS-4 work.

## Conclusion

BEL-1113 EVD-7 consolidation evidence passes. Conditional V2 output remains
byte-for-byte deterministic across 10 runs for the covered API result JSON, CLI
validation JSON, and standalone evidence JSON cases. Conditional V2 nested
profile structures reject regex-like and executable-like keys with inert
diagnostics, and the automated boundary audit reports no executable predicates,
profile-sourced regex execution, plugins, network calls, LLM calls,
persistence, file watching, or design-spec-specific core semantics.
