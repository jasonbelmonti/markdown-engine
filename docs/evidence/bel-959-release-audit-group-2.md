# BEL-959 Release Audit Group 2: Parser, Frontmatter, And Source Positions

Date: 2026-05-07 07:17 CDT / 2026-05-07 12:17 UTC
Issue: BEL-959
Parent audit: BEL-956
Baseline: `origin/main` at `a5ba719af234b0c6122304d4f7476c2f3177d479`
Worktree: `.worktrees/BEL-959-release-audit-group-2`

## Current Status

This is a dated BEL-956 release-audit record. The `0.1.0` package and
release-withhold statements below describe the 2026-05-07 audit baseline. At the
BEL-1158 cleanup baseline (`origin/main` at `804c6351edf0`, 2026-05-20), package
metadata is `@jasonbelmonti/markdown-engine@2.0.0`; do not read those statements
as current package truth.

## Scope

This audit verifies Markdown parsing, YAML frontmatter handling, source-position
propagation, raw HTML inertness, fixture coverage, and snapshot contract
baselines before any 1.0 tag or npm publication. It does not authorize a tag,
package publish, version promotion, release-policy decision, or broad parser
behavior change.

## Conclusion

No BEL-959 parser/frontmatter/source-position release blocker was found. The
current implementation is source-consistent with the documented frontmatter and
public API contracts, focused parser/frontmatter validation passes, and reviewed
snapshots remain stable engine-owned JSON baselines.

Release publication remains outside this audit's authority and still withheld
under BEL-944/BEL-956. The package remains `@jasonbelmonti/markdown-engine@0.1.0`
in `package.json:1-3`, and local tags list only `v0.1.0`.

## Audit Results

- PASS: Frontmatter extraction matches the documented delimiter contract. The
  contract recognizes only an optional UTF-8 BOM followed by a top-of-file
  opening `---` line and a later closing `---` line; an unclosed opening
  delimiter is Markdown body content, and absent or empty frontmatter is
  diagnostic-free (`docs/contracts/frontmatter.md:12-25`). The extractor strips a
  BOM, requires exact `---` line content, returns the body start after the
  closing delimiter, and falls back to Markdown body content when no closing
  delimiter is found (`src/frontmatter/extract.ts:11-75`,
  `src/frontmatter/extract.ts:86-135`). Tests cover absent, empty, BOM, EOF, and
  unclosed-delimiter behavior (`tests/parser-frontmatter.test.ts:92-171`,
  `tests/parser-frontmatter.test.ts:497-511`).
- PASS: YAML parser behavior is pinned to the public contract. The documented
  options require YAML 1.2 core parsing, disabled merge behavior, unresolved
  known tags as warnings, unique keys, `mapAsMap: true`, and `maxAliasCount: 50`
  (`docs/contracts/frontmatter.md:27-61`, `docs/contracts/frontmatter.md:88-108`).
  Source matches those options in `src/frontmatter/yaml-options.ts:10-28` and
  blocks parsed frontmatter on YAML errors, unsupported keys, materialization
  failures, non-JSON-safe values, and alias failures while preserving warnings
  when a JSON-safe value exists (`src/frontmatter/yaml.ts:31-91`,
  `src/frontmatter/yaml.ts:96-125`).
- PASS: Frontmatter values are JSON-safe public data. Scalars, arrays, maps,
  finite numbers, and recursive values are converted through
  `toJsonSafeValue`; non-finite numbers, cyclic aliases, unsupported values, and
  non-string materialized map keys produce `frontmatter.yaml.invalid`
  diagnostics (`src/frontmatter/yaml-json.ts:12-18`,
  `src/frontmatter/yaml-json.ts:30-135`). String keys are defined with
  `Object.defineProperty`, so prototype-like keys remain own JSON data rather
  than mutating object prototypes (`src/frontmatter/yaml-json.ts:137-148`).
- PASS: Unsupported YAML mapping keys are rejected before JavaScript key
  coercion. The contract rejects numeric, boolean, null, sequence, and mapping
  keys (`docs/contracts/frontmatter.md:79-86`). Source walks nested YAML maps and
  sequences before materialization and emits key-specific diagnostics for any
  non-string scalar or non-scalar key (`src/frontmatter/yaml-key-policy.ts:13-77`,
  `src/frontmatter/yaml-diagnostics.ts:46-55`). The committed test suite covers
  numeric keys (`tests/parser-frontmatter.test.ts:316-344`); the runtime probe
  below additionally covered boolean, null, sequence, and mapping keys.
- PASS: Documented YAML edge cases are covered by source and focused tests.
  Tests cover YAML 1.2 scalar resolution, duplicate keys, multiple documents,
  unresolved tags as warnings, non-finite numbers, disabled merge keys, supported
  aliases, excessive alias expansion, cyclic aliases, JSON stringification of
  cyclic-failure results, and Markdown body parsing after frontmatter failures
  (`tests/parser-frontmatter.test.ts:173-468`).
- PASS: Markdown parsing preserves representative GFM structure through
  engine-owned IR. The parser uses `remark-parse` and `remark-gfm`, then maps the
  mdast-like root into `EngineDocument` instead of returning parser internals
  (`src/parser/adapter.ts:12-24`, `src/parser/engine-document.ts:8-52`).
  Attribute mapping is explicit for headings, links, images, lists, task-list
  items, code, tables, and footnotes (`src/parser/engine-document.ts:54-155`).
  The fixture suite covers at least 30 parser/frontmatter fixtures, selected
  cmark-GFM oracle comparisons, and representative GFM semantics
  (`tests/parser-fixtures.test.ts:25-139`).
- PASS: Public parser results do not expose raw mdast `position` fields or raw
  YAML parser internals. The public API contract names raw mdast/unified AST
  nodes, raw parser `position` fields, and raw YAML parser documents/CST/tokens
  as internal-only (`docs/contracts/api.md:26-33`). Tests assert the parsed
  document JSON does not contain `"position"` and that frontmatter lacks YAML
  internals such as `contents` and `items` (`tests/parser-frontmatter.test.ts:62-89`,
  `tests/parser-fixtures.test.ts:31-40`).
- PASS: Source-position remapping after frontmatter is correct for body nodes
  and diagnostics. `parse()` passes body-start line, column, and offset offsets
  into body parsing (`src/api/parse.ts:30-40`); engine source positions add line
  offsets globally, apply column offset only to the first parsed body line, and
  add offset offsets when parser offsets exist (`src/parser/engine-document.ts:251-279`).
  YAML diagnostics map parser offsets back to Markdown source positions or fall
  back to the full frontmatter block (`src/frontmatter/yaml-diagnostics.ts:15-28`,
  `src/frontmatter/yaml-diagnostics.ts:112-185`). Tests and snapshots verify BOM
  remapping, empty-body EOF ranges, duplicate-key diagnostic ranges, and nested
  frontmatter body offsets (`tests/parser-frontmatter.test.ts:113-171`,
  `snapshots/diagnostics/frontmatter-duplicate-key.json:1-19`,
  `snapshots/ir/frontmatter-nested.json:27-66`).
- PASS: Raw HTML remains inert string data in parse and validation paths. The
  public contract states that raw HTML is inert and the package does not render,
  sanitize, fetch, execute, or evaluate it (`docs/contracts/api.md:177-189`,
  `docs/contracts/api.md:492-499`). Parser mapping copies mdast string values
  into node `text` without rendering (`src/parser/engine-document.ts:196-199`),
  and the raw HTML policy rule only emits diagnostics for `html` nodes
  (`src/rules/raw-html-policy.ts:7-42`). Tests and snapshots verify raw HTML
  block and inline nodes are represented as `html` text nodes
  (`tests/parser-frontmatter.test.ts:62-66`,
  `tests/parser-fixtures.test.ts:109-117`,
  `snapshots/ir/raw-html-block.json:1-38`).
- PASS: Snapshot baselines remain contract-aligned. Parser fixture tests bind
  table IR, raw HTML IR, nested frontmatter IR, duplicate-key diagnostics, and
  selected cmark-GFM comparison output to checked-in snapshots
  (`tests/parser-fixtures.test.ts:167-194`). Manual inspection found no raw
  parser `position` fields or YAML internals in the reviewed snapshots.

## Runtime Probe

Additional runtime probe through `dist/index.js` confirmed behavior not fully
enumerated by committed fixture assertions:

```json
{
  "unsupportedKeyCases": [
    "boolean",
    "null",
    "sequence",
    "mapping"
  ],
  "prototypeSafeOwnKeys": [
    "__proto__",
    "constructor"
  ],
  "remappedHeadingStart": {
    "line": 4,
    "column": 1,
    "offset": 22
  },
  "rawHtmlNode": {
    "type": "html",
    "text": "<div onclick=\"fetch('https://example.invalid')\">Raw</div>"
  },
  "unclosedOpeningDelimiterFirstNode": "thematicBreak"
}
```

The probe asserted that unsupported key classes reject with
`frontmatter.yaml.invalid`, prototype-like string keys remain own properties and
JSON-serializable, frontmatter-remapped body positions are line/column/offset
correct, raw HTML is preserved as literal text, serialized normalized output
does not contain `position`, and an unclosed opening delimiter parses as a
Markdown thematic break.

## Validation Results

- Execution estimation: pass. `schemaVersion` was `execution-estimation.v5`;
  mode was `proposal`; blast radius was medium with score 4; action was
  `proceed-with-controls`; decomposition was not recommended at depth 1.
- `git fetch --all --prune`: pass.
- `git worktree add .worktrees/BEL-959-release-audit-group-2 -b codex/bel-959-release-audit-group-2 origin/main`:
  pass; worktree baseline is `a5ba719af234b0c6122304d4f7476c2f3177d479`.
- `npm run build && npx vitest run tests/parser-frontmatter.test.ts tests/parser-fixtures.test.ts "--exclude=.worktrees/**"`:
  pass, 2 files and 23 tests.
- `npm run typecheck`: pass.
- Runtime `node --input-type=module` probe through `dist/index.js`: pass.
- `git tag --list`: pass; local tag output is `v0.1.0`.

`npm run release:verify` was not run for this audit because no source, snapshot,
package, or contract behavior changed. Running it after this evidence-only
change would fail the clean-diff gate until the evidence artifact is committed.

## Success Criteria Status

- [x] Frontmatter extraction behavior matches the documented contract for BOMs,
  delimiters, empty blocks, unclosed delimiters, duplicate keys, unsupported
  keys, aliases, and non-JSON-safe values.
- [x] Markdown body parse results preserve expected GFM structure without
  exposing raw mdast or YAML parser internals through public results.
- [x] Line, column, and offset remapping after frontmatter is correct for
  representative source ranges and diagnostics.
- [x] Raw HTML and recovered source text remain inert strings with no render,
  fetch, sanitize, execute, network, or persistence behavior.

## Required Next Decisions

No BEL-959 parser/frontmatter/source-position blocker requires a source change.
Before any 1.0 tag or npm publication, BEL-956/BEL-944 must still explicitly
authorize release versioning, package publication, and the final release
candidate validation sequence.
