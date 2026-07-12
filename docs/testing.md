# Testing, Snapshot, And Distribution Operations

This repository uses checked-in Vitest file snapshots as contract baselines for
public markdown-engine behavior. The `snapshots/` directory is not disposable
test output. It records reviewable expected output for normalized IR,
diagnostics, selected `cmark-gfm` comparison output, and deterministic
serialization.

## Snapshot Inventory

- `snapshots/ir/**`: normalized engine IR for representative parser fixtures.
- `snapshots/diagnostics/**`: frontmatter and rule diagnostic output.
- `snapshots/cmark-gfm/**`: selected comparison output from the `cmark-gfm`
  oracle used by parser fixture tests.
- `snapshots/rich-ir/**`: durable target/source, derived-view, and query
  evidence for representative rich IR fixtures.
- `snapshots/serialization/**`: stable serialized JSON for parse, normalize,
  and validation results.

Parser, rule, and serialization tests resolve snapshot paths through
`snapshotRoot` in `tests/support/parser-fixture-support.ts`. Rich IR target and
query tests resolve their durable snapshot paths directly under
`snapshots/rich-ir/**`. All snapshot-backed tests assert the files with Vitest
`toMatchFileSnapshot`.

## Operating Rules

Treat a snapshot diff as a contract diff until proven otherwise. Do not update
snapshots only to make a failing test pass.

Accept a snapshot update only when one of these conditions is true:

- the engine behavior intentionally changed and the public contract impact has
  been reviewed
- a fixture was intentionally added or corrected and the new baseline records
  the expected behavior
- a parser dependency change was reviewed and the adapter output is still
  acceptable for the engine contract

Before first publication, snapshot baseline updates require coordination under
the execution spec. After publication, changes to public API shape, IR fields,
diagnostic fields, source-location semantics, validation semantics, or
serialized output shape require semantic-version classification.

## Check Commands

Run the full suite before review:

```sh
npm test
```

Generate line and branch coverage metrics:

```sh
npm run test:coverage
```

Coverage uses Vitest's V8 provider and records reports under `coverage/`.
The local report includes detailed terminal output, a terminal summary, HTML,
LCOV, and JSON summary artifacts. Coverage accounting includes executable
`src/**/*.ts` modules and excludes generated output, tests, type-only
declaration files, and passive barrel files.

The coverage gate currently enforces at least `60%` line coverage and `75%`
branch coverage. Keep those thresholds stable during measurement-only changes;
raise them in later PRs after adding executable behavior coverage.

Run the CI-ready coverage gate:

```sh
npm run test:coverage:ci
```

CI systems should run `npm ci` before the gate command. A GitHub Actions job can
use `npm run typecheck`, `npm test`, and `npm run test:coverage:ci` as separate
steps when this repository adopts a workflow file.

Run only snapshot-backed tests when narrowing a snapshot failure:

```sh
npm run test:snapshots
```

Run the full release gate before package tag or publication review:

```sh
npm run release:verify
```

Ordinary `npm test` runs build and behavior checks against the current source
without requiring that unreleased bundle to match the production installer pin.
The full release gate builds the candidate and then runs
`npm run release:verify:installer-pin`, which requires `package.json`, the
installer version and SHA-256, the README install instructions, and the built
artifact to agree exactly. Update those release-owned values together only when
preparing the artifact that will be tagged and published.

## Bundled CLI And Skill Distribution

The bundled CLI artifact is a Node.js ESM distribution artifact for local
operator workflows and Agent Skill handoff. It is not the npm package release
itself and is not a native binary.

Build the current bundled artifact from the repository root:

```sh
npm run build:cli:bundled
```

The build writes `dist-bundled/markdown-engine-cli.mjs`, removes stale files in
`dist-bundled/` before rebuilding, and marks the artifact executable on
platforms that support executable mode bits. The artifact targets Node.js 20
and follows the package engine range in `package.json`: `^20.19.0 || >=22.12.0`.
It still runs on the Node.js runtime and may be invoked with `node` or through
its executable shebang. It is separate from the package `bin` entry and from
future native-binary packaging decisions.

The compatibility build command remains available for callers that still expect
the older artifact path:

```sh
npm run build:cli-bundle
```

That command writes `dist/cli/markdown-engine.mjs`. New distribution checks
should prefer `npm run build:cli:bundled` and
`dist-bundled/markdown-engine-cli.mjs`.

Run these smoke commands after building the bundled artifact:

```sh
node dist-bundled/markdown-engine-cli.mjs --help
node dist-bundled/markdown-engine-cli.mjs validate --file fixtures/declarative-validation/examples/operational-spec/pass.md --profile fixtures/declarative-validation/examples/operational-spec/profile.yaml
node dist-bundled/markdown-engine-cli.mjs validate --file fixtures/declarative-validation/examples/operational-spec/fail.md --profile fixtures/declarative-validation/examples/operational-spec/profile.yaml
```

Pass/fail expectations:

- `npm run build:cli:bundled` prints the bundled artifact path and leaves a
  non-empty `dist-bundled/markdown-engine-cli.mjs` file.
- `--help` exits `0`, writes usage text to stdout, and writes no stderr.
- The passing validation fixture exits `0`, writes JSON with `valid: true`, and
  emits no diagnostics.
- The intentionally failing validation fixture exits `1`, writes JSON with
  `valid: false`, and emits diagnostic entries.

The focused automated checks for this surface are:

```sh
npm run build && npm exec -- vitest run tests/cli-bundle.test.ts tests/installer-pin-release-gate.test.ts tests/profile-backed-markdown-skill.test.ts "--exclude=.worktrees/**"
```

Run the exact production-pin check only against a prepared release candidate:

```sh
npm run build:cli:bundled
npm run release:verify:installer-pin
```

The `profile-backed-markdown` Agent Skill consumes the bundled artifact through
`skills/profile-backed-markdown/scripts/validate-profile-backed-markdown.mjs`.
The wrapper resolves the CLI in this order: `MARKDOWN_ENGINE_CLI`, a copied
`skills/profile-backed-markdown/scripts/markdown-engine-cli.mjs`, then the
package-level `dist-bundled/markdown-engine-cli.mjs`.

For a standalone skill folder, build and copy the artifact into the skill:

```sh
npm run build:cli:bundled
cp dist-bundled/markdown-engine-cli.mjs skills/profile-backed-markdown/scripts/
```

Release containment remains explicit. Building, copying, testing, or packaging
the bundled artifact does not authorize a git tag, npm publish, npm dist-tag
mutation, GitHub Release, public release-completion claim, or native binary
ship decision. Native binaries are outside this slice and require separate
build, validation, and release approval.

## Update Commands

Update parser, IR, diagnostic, and `cmark-gfm` snapshots:

```sh
npm run snapshots:update:parser
```

Update rule diagnostic snapshots:

```sh
npm run snapshots:update:rules
```

Update rich IR target/source and derived-view/query snapshots:

```sh
npm run snapshots:update:rich-ir
```

Update serialization snapshots and run the adjacent boundary proof:

```sh
npm run snapshots:update:serialization
```

After any snapshot update, inspect the diff before committing:

```sh
git diff -- snapshots
npm test
```

Use `npm run release:verify` instead of only `npm test` when the change also
touches package metadata, release scripts, dependency boundaries, or serialized
output behavior.

## Review Checklist

- Confirm each changed snapshot maps to an intentional source, fixture, parser
  dependency, or serializer change.
- Confirm IR and diagnostic diffs preserve the documented public contracts in
  `docs/contracts/**`.
- Confirm source-location changes are expected, especially for diagnostics and
  raw HTML representation.
- Confirm rich IR target/source and query snapshot diffs preserve documented
  target stability limits, source-slice absence behavior, public view fields,
  and deterministic ordering.
- Confirm serialized JSON remains deterministic with
  `npm run build && node scripts/prove-repeatability.mjs --runs 10` or
  `npm run release:verify`.
- Update evidence docs when a new snapshot family is added or when a snapshot
  change alters release-readiness evidence.
