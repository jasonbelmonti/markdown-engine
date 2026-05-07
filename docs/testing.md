# Testing And Snapshot Operations

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

Run only snapshot-backed tests when narrowing a snapshot failure:

```sh
npm run test:snapshots
```

Run the full release gate before package tag or publication review:

```sh
npm run release:verify
```

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
