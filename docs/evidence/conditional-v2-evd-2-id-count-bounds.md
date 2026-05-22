# Conditional V2 EVD-2: ID Count Bounds

Issue: BEL-1093
Parent issue: BEL-1084
Branch: `codex/bel-1093-id-count-fixtures`
Worktree: `.worktrees/bel-1093-id-count-fixtures`
Date: 2026-05-22

## Scope

EVD-2 records targeted fixture coverage for `ids.minCount` and
`ids.maxCount`. The scope is limited to ID-family cardinality after prefix
filtering and occurrence de-duplication plus duplicate-ID compatibility.
Table-column coverage, grouped rules, `when`, downstream design-spec exercise,
runtime semantic expansion, and rich IR changes are out of scope for this leaf.

## Fixture Coverage

The fixture suite is
`fixtures/declarative-validation/conditional-v2/id-count-bounds.yaml`.

| Fixture | Contract |
| --- | --- |
| `min-count-pass` | Passing `ids.minCount` after prefix filtering. |
| `min-count-fail` | Failing `ids.minCount` after repeated comparison values collapse. |
| `max-count-pass` | Passing `ids.maxCount` after prefix filtering. |
| `max-count-fail` | Failing `ids.maxCount` at the first excess unique ID. |
| `combined-bounds-pass` | Combined `ids.minCount` and `ids.maxCount` exact-count pass. |
| `duplicate-id-compatibility` | Existing duplicate-ID compatibility diagnostic remains active. |
| `prefix-filtering-pass` | Nonmatching ID families are ignored before count bounds. |
| `case-sensitivity-pass` | Default case-sensitive matching and case-insensitive prefix matching both pass. |

## Compiled-Plan Coverage

`tests/declarative-validation-id-count-fixtures.test.ts` parses each fixture
profile, compiles it with `compileValidationProfile`, and verifies the private
compiled `ids` assertion shape for each fixture rule. The assertions include
the expected `prefix`, `unique`, `caseSensitive`, `minCount`, and `maxCount`
fields where applicable.

## Diagnostics Notes

- `profile.validation.idCountTooLow` is covered by `min-count-fail`.
- `profile.validation.idCountTooHigh` is covered by `max-count-fail`.
- `profile.validation.duplicateId` is covered by
  `duplicate-id-compatibility`.
- Count diagnostics are source-grounded to the best available target evidence:
  `min-count-fail` anchors to the first known matching ID, and
  `max-count-fail` anchors to the first excess unique ID.
- Duplicate occurrences are collapsed before count bounds are evaluated.
- Prefix filtering happens before cardinality checks.
- Case-insensitive matching includes differently cased prefixes while default
  case-sensitive matching excludes them.

## Command Results

Commands were run from `.worktrees/bel-1093-id-count-fixtures`.

```text
npm run test:validation:compiler
PASS tests/declarative-validation-compiler.test.ts (35 tests)
Test Files  1 passed (1)
Tests  35 passed (35)
```

```text
npm run test:validation:assertions
PASS tests/declarative-validation-assertions.test.ts (100 tests)
Test Files  1 passed (1)
Tests  100 passed (100)
```

```text
npm run build && npm exec -- vitest run tests/declarative-validation-id-count-fixtures.test.ts "--exclude=.worktrees/**"
PASS tests/declarative-validation-id-count-fixtures.test.ts (9 tests)
Test Files  1 passed (1)
Tests  9 passed (9)
```

## Existing Duplicate-ID Compatibility

The dedicated `duplicate-id-compatibility` fixture uses the existing v1
`ids.unique` assertion shape and expects the stable
`profile.validation.duplicateId` diagnostic. This preserves the already covered
duplicate-ID behavior while keeping v2 count bounds additive.
