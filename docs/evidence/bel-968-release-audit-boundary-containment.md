# BEL-968 Release Audit: Boundary Containment

Date: 2026-05-07 12:06 CDT
Issue: BEL-968
Baseline: `origin/main` at `e52cdd0`
Worktree: `.worktrees/BEL-968-boundary-containment`

## Objective

Verify that the full 1.0 release candidate remains inside the deterministic
local `markdown-engine` package boundary. The package boundary remains parse,
normalize, deterministic validation, diagnostics, structural/query helpers,
annotation target validation, and stable serialization.

This audit does not authorize a 1.0 tag, npm publication, release completion
claim, or public-contract finalization. BEL-957 and BEL-958 still record
release-withhold blockers for final package/document version policy and the
already-published `0.1.0` npm version.

## Execution Gate

Execution Estimation was run before audit execution in proposal mode for the
expected evidence artifact path:

```text
schemaVersion: execution-estimation.v5
mode: proposal
repoRoot: /Users/jasonbelmonti/Documents/Development/markdown-engine
execution.action: proceed
risk.blastRadius.level: low
estimation.adjustedStoryPoints: 2
estimation.decompositionRecommended: false
planning.blocksExecution: false
```

No decomposition or plan-first gate blocked this audit.

## Boundary Inputs

- Linear `BEL-968` was inspected before execution. It is the controlling audit
  item, status `Backlog`, priority High, parent `BEL-956`, with success criteria
  requiring dependency, source/public-type/docs/tests/evidence, annotation
  payload, and blocker classification review.
- `README.md:19-31` defines `markdown-engine` ownership as deterministic parse,
  normalize, validate, diagnose, and serialize only, and explicitly excludes
  profile compiler behavior, runtime lenses, MCP transport, agent adapters,
  semantic or LLM evaluation, arbitrary rule plugins, network services,
  persistence, and raw parser AST as public contract.
- `docs/contracts/api.md:397-427` documents annotation targets and says payloads
  remain opaque and caller-owned.
- `docs/contracts/api.md:497-533` restates the domain-neutral boundary and
  excludes SpecTrace entities, profile/runtime/MCP, agent adapters, semantic or
  LLM evaluation, arbitrary rule plugins, network services, persistence, file
  watching, graph storage, rendering, sanitization, fetching, and raw HTML
  execution.
- `docs/execution/markdown-engine-1.0-rich-ir-execution-spec.md:46-62`,
  `112`, `552-561`, and `695-709` provide the 1.0 boundary controls used for
  this audit.
- Prior boundary evidence in
  `docs/evidence/wp-5-evd-8-boundary-inspection.md:8-20` and `38-57` establishes
  the dependency and alias audit model.
- Completed functional audit evidence files for BEL-957 through BEL-964 are
  present under `docs/evidence/**`; their conclusions and validation sections
  were reviewed as source-grounded inputs.

## Dependency And Alias Review

Required command:

```sh
npm run audit:rich-ir-boundary
```

Result:

```text
Boundary dependency audit PASS
Direct dependencies scanned: 8
Forbidden dependency matches: 0
Annotation semantic boundary PASS
Annotation semantic leakage matches: 0
```

Direct dependencies and dev dependencies are limited to:

```text
dependencies    remark-gfm       ^4.0.1
dependencies    remark-parse     ^11.0.0
dependencies    unified          ^11.0.5
dependencies    yaml             ^2.8.3
devDependencies @types/node      ^22.19.17
devDependencies cmark-gfm        ^0.9.0
devDependencies typescript       ^5.8.3
devDependencies vitest           ^3.1.3
```

`rg -n "npm:" package.json package-lock.json` returned no matches, so no npm
alias target can hide a forbidden package. `tsconfig.json:1-31` and
`tsconfig.document-contract.json:1-10` define no `paths` alias targets.

The broad lockfile scan found `undici-types`, but it is classified as
non-blocking: `package-lock.json:917-925` shows it is a dev-only dependency of
`@types/node`, and `package-lock.json:3099-3104` marks the installed package as
`dev: true`. It is not a direct dependency, not an `undici` runtime client, and
no production source imports it.

## Source And Public Contract Review

Manual source scan:

```sh
rg -n -i "profile compiler|markdown[-_ ]profile|runtime lens|markdown[-_ ]runtime|markdown[-_ ]mcp|model context protocol|\bmcp\b|\bllm\b|large language model|openai|anthropic|agent adapter|agent-adapter|semantic evaluator|network service|axios|undici|node-fetch|cross-fetch|isomorphic-fetch|\bfetch\s*\(|websocket|persistence|database|sqlite|postgres|domain entity|entity registry|entity id|issue key|arbitrary rule plugin|rule plugin" src
```

Result: no matches.

Source import review found no profile/runtime/MCP/LLM/network/persistence/domain
package imports. Production imports are local modules, parser/YAML dependencies,
and Node APIs used by the CLI. The CLI file surface is bounded:
`src/cli/files.ts:8-26` resolves and reads one caller-specified file and rejects
directories; it does not traverse, watch, serve, persist, or call network APIs.

Public types in `src/api/document.ts:3-182` expose engine document, node, source,
section, table, list, link, query, annotation, compatibility, and serializable
result types only. The public contract term test in
`tests/document-contract.test.ts:145-155` asserts that raw parser AST,
downstream domain/runtime terms, and `richIr` labels stay out of the public
contract modules.

`src/rules/index.ts:42-87` is a closed deterministic registry for the five
documented rule families. Unknown rule IDs return unsupported config diagnostics
through `src/config/index.ts:51-64`; there is no plugin loader, dynamic rule
execution, semantic evaluator, or LLM fallback.

The only production filename containing the word `runtime` is
`src/api/annotation-target-runtime.ts`. This is not `markdown-runtime` or runtime
lens behavior. It contains bounded JavaScript value and property inspection for
hostile caller-provided annotation targets: placeholders and limits are defined
at `src/api/annotation-target-runtime.ts:1-12`, arrays are normalized with depth,
length, and work limits at `20-74` and `149-247`, and own properties are read by
descriptor at `126-147` without invoking accessors.

## Docs, Tests, Evidence, And Architecture Mentions

Manual docs/tests/evidence scans found boundary terms only in these categories:

- non-goals and explicit exclusions in README, API docs, SECURITY, execution
  specs, design specs, and evidence;
- boundary-audit tests that inject forbidden names to prove detection;
- downstream exercise fixture/test payload examples that keep semantic keys out
  of engine-owned document structures;
- `RUNTIME_ARCHITECTURE.md`, which documents the larger package decomposition.

`RUNTIME_ARCHITECTURE.md:32-41` assigns profile compiler, runtime lens, MCP,
agent adapter, and agent-evaluation responsibilities to separate packages, while
`RUNTIME_ARCHITECTURE.md:85-97` keeps the first package focused on stable IR,
deterministic diagnostics, source locations, YAML-friendly config inputs,
unsupported-rule failures, and no hidden semantic inference. It is classified as
architecture context, not an engine-owned runtime/MCP implementation.

`SECURITY.md:22-28` reinforces the local package boundary: no raw HTML
execution, network resource fetching, LLM provider calls, plugins, services,
persistence, or semantic-rule evaluation.

`tests/boundary-inspection.test.ts:17-141` covers dependency audit success,
forbidden dependency detection, false-positive avoidance, and `npm:` alias target
inspection. `tests/boundary-inspection.test.ts:143-344` covers annotation
semantic leakage detection for profile IDs, entity registries, issue keys,
entity IDs, relationship types, MCP, LLM, and semantic evaluator identifiers.

## Annotation Payload Opacity

`src/api/document.ts:83-90` defines annotation targets and a generic
`payload: TPayload`; no payload fields are named by the engine. `validateAnnotations`
in `src/api/annotations.ts:16-35` computes diagnostics from annotation targets
and clones the annotation target, while preserving the annotation payload field.

`src/api/annotation-target-validation.ts:39-267` validates only target wrapper
kind, target ID existence, source range shape, ordering, and containment.
`src/api/annotation-target-validation.ts:400-411` clones known annotation targets
or normalizes malformed diagnostic targets. `src/api/annotation-target-validation.ts:543-675`
clones and bounds source ranges. These paths do not inspect payload keys or
payload values.

Serialization remains generic JSON serialization: `src/api/serialize.ts:32-60`
checks optional compatibility mode, sorts plain object keys, omits `undefined`,
recurses arrays and plain objects, and does not branch on annotation payload
semantics.

Focused tests back this boundary:

- `tests/rich-ir-annotations.test.ts:24-76` proves valid node, section, and
  source annotations are accepted, caller annotation objects are not mutated,
  targets are cloned, and opaque payload content is preserved.
- `tests/rich-ir-downstream.test.ts:23-82` exercises a SpecTrace-style consumer
  workflow without semantic leakage.
- `tests/rich-ir-downstream.test.ts:170-202` scans the resulting engine-owned
  document structure for forbidden semantic keys such as `entityId`, `issueKey`,
  `registry`, and `relationship`.

## Validation Results

- `git fetch origin`: pass.
- `git worktree add .worktrees/BEL-968-boundary-containment -b codex/bel-968-boundary-containment origin/main`:
  pass; worktree is based on `e52cdd0`.
- `npm run audit:rich-ir-boundary`: pass; 8 direct dependencies scanned, 0
  forbidden dependency matches, 0 annotation semantic leakage matches.
- `rg -n "npm:" package.json package-lock.json`: pass; no alias specs found.
- Source boundary scan command above: pass; no matches in `src/**`.
- `npm run test:rich-ir:annotations`: pass; 1 file, 15 tests.
- `npm run test:rich-ir:downstream`: pass; 1 file, 2 tests.
- `npm run test:rich-ir:contract`: pass; 1 file, 3 tests.
- `npm run docs:rich-ir-contract`: pass; checked README, API contract, rich IR
  design, and prior rich IR contract/CLI evidence.
- `git diff --check HEAD --`: pass.
- `git diff --check --no-index -- /dev/null docs/evidence/bel-968-release-audit-boundary-containment.md`:
  no whitespace errors; command exits `1` because the evidence file is new.

## Boundary Result

No BEL-968 boundary blocker was found.

The release candidate remains inside the deterministic local package boundary:
direct dependencies and alias targets have no forbidden matches; production
source and public types do not own profile/runtime/MCP/LLM/network/persistence
or domain semantics; documentation and evidence mention those terms as
non-goals, controls, tests, or package-decomposition context; and annotation
payload semantics remain caller-owned and opaque.

Publication remains withheld by BEL-956/BEL-957/BEL-958 release-decision
constraints. BEL-968 does not clear, override, or soften those release blockers.

## Success Criteria Status

- [x] Direct dependencies and alias targets pass boundary audit with no forbidden
  package matches.
- [x] Source code, public types, docs, tests, and evidence contain no engine-owned
  profile/runtime/MCP/LLM/network/persistence/domain semantics.
- [x] Caller-owned annotation payload semantics remain opaque and are not
  interpreted by core code.
- [x] Boundary concerns are classified. No BEL-968 boundary concern remains
  unresolved or requires a release-blocker record.
