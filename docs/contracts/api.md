# Public API Contract

Status: 1.0.0 public contract
Last updated: 2026-05-11

This document defines the public `@jasonbelmonti/markdown-engine` package
contract for the `1.0.0` release. The stable public surface is the package
export from `@jasonbelmonti/markdown-engine`, not internal adapter modules or
raw parser output. The 1.0 rich IR design is tracked in
`docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md`.

## Exported Surface

The package root exports the API functions, helpers, and types from `src/api/**`:

- `parse(markdown, options?)`
- `normalize(parsed, options?)`
- `validate(document, config?, options?)`
- `serialize(result, options?)`
- `documentQueries`
- `validateAnnotations(document, annotations)`
- `parseValidationProfile(input, options?)`
- `validateWithProfile(document, profile, options?)`

The package root also exports the public result, document, diagnostic, config,
and function types declared in `src/api/**`.

The following implementation details are internal and are not stable public
contracts:

- raw mdast/unified parser AST nodes
- raw parser `position` fields
- raw `yaml` parser documents, CST, tokens, warnings, and errors
- internal parser, frontmatter, config-loader, IR-normalizer, and rule-registry
  modules

## `parse`

Signature:

```ts
parse(markdown: string, options?: ParseOptions): ParseResult
```

`ParseOptions.path` is optional. When present, the path is copied into the
parsed result and normalized engine document.

`ParseResult` contains:

- `parsed`: the engine-owned parsed Markdown value
- `diagnostics`: all parse/frontmatter diagnostics produced by parsing

`ParsedMarkdown` contains:

- `markdown`: the original input string
- `body`: Markdown body content after frontmatter extraction
- `path`: optional caller-supplied path
- `frontmatter`: JSON-safe parsed YAML value when frontmatter is present
- `document`: an engine-owned `EngineDocument`
- `diagnostics`: parse/frontmatter diagnostics

Absent frontmatter omits `frontmatter`. Empty frontmatter produces `{}`.
Frontmatter YAML behavior is defined by `docs/contracts/frontmatter.md`.

## `normalize`

Signature:

```ts
normalize(parsed: ParsedMarkdown, options?: NormalizeOptions): NormalizeResult
```

`NormalizeOptions.documentVersion` selects the document contract version. The
final 1.0 rich IR path is `"1.0.0"`. The retained `0.1.0`-compatible path is
`"0.0.0"`.

`NormalizeOptions.preserveSourceLocations` defaults to `true`. When set to
`false`, source ranges and source slices are omitted from the normalized
document, but deterministic node target IDs are still generated for the 1.0
path.

`NormalizeResult` contains:

- `document`: a cloned and normalized `EngineDocument`
- `diagnostics`: cloned diagnostics from the parsed input

Normalization sorts object attribute keys, clones public values, preserves
frontmatter when present, and does not expose raw parser AST data.

## `validate`

Signature:

```ts
validate(
  document: EngineDocument,
  config?: ValidationConfig,
  options?: ValidateOptions,
): ValidationResult
```

`ValidationConfig` is YAML-friendly and currently supports a `rules` object.
The supported deterministic rule families in this contract slice are:

- `codeFences.languages`
- `frontmatter.required`
- `headings.required`
- `links.allowedSchemes`
- `rawHtml.policy`

`ValidateOptions.path` is accepted as a public option for API symmetry and
future diagnostics, but the current implementation does not emit additional
path-derived result fields from validation.

`codeFences.languages` configuration shape:

```yaml
rules:
  codeFences.languages:
    allowed:
      - ts
      - bash
    requireLanguage: true
    severity: error
```

`allowed` is optional when `requireLanguage` is `true`; when present it must be
a non-empty array of non-empty strings. `requireLanguage` is optional and
defaults to `false`. At least one of `allowed` or `requireLanguage` must be
configured. `severity` is optional and defaults to `error`; allowed values are
`error`, `warning`, and `info`.

`frontmatter.required` configuration shape:

```yaml
rules:
  frontmatter.required:
    fields:
      - title
      - owner
    severity: error
```

`fields` must be a non-empty array of non-empty strings. `severity` is optional
and defaults to `error`; allowed values are `error`, `warning`, and `info`.

`headings.required` configuration shape:

```yaml
rules:
  headings.required:
    headings:
      - Objective
      - Success Criteria
    severity: error
```

`headings` must be a non-empty array of non-empty strings. The rule checks
normalized heading text. `severity` is optional and defaults to `error`;
allowed values are `error`, `warning`, and `info`.

`links.allowedSchemes` configuration shape:

```yaml
rules:
  links.allowedSchemes:
    schemes:
      - https
      - mailto
    severity: error
```

`schemes` must be a non-empty array of non-empty strings. URL schemes are
compared case-insensitively. Relative URLs without a scheme do not produce
diagnostics. `severity` is optional and defaults to `error`; allowed values are
`error`, `warning`, and `info`.

`rawHtml.policy` configuration shape:

```yaml
rules:
  rawHtml.policy:
    policy: deny
```

`policy` must be `allow`, `warn`, or `deny`. `allow` emits no diagnostics.
`warn` emits warning diagnostics for raw HTML nodes and does not make the
validation result invalid. `deny` emits error diagnostics for raw HTML nodes.
The package still treats raw HTML as inert data; it does not execute, render,
sanitize, fetch, or evaluate HTML.

Unsupported rules produce `config.rule.unsupported` diagnostics. Invalid config
shape produces config diagnostics. Unsupported rules are not inferred,
executed, or delegated to semantic evaluation.

`ValidationResult` contains:

- `valid`: `false` when any error-severity diagnostic exists
- `diagnostics`: top-level validation diagnostics
- `ruleResults`: per-rule deterministic results

Each `ValidationRuleResult` contains `ruleId`, `passed`, and `diagnostics`.
`passed` is `false` when the rule emits diagnostics, including warning or info
diagnostics. `valid` is controlled by error-severity diagnostics only.

## Declarative Validation

Signatures:

```ts
parseValidationProfile(
  input: string | JsonSafeValue,
  options?: DeclarativeProfileParseOptions,
): DeclarativeProfileParseResult

validateWithProfile(
  document: EngineDocument,
  profile: ValidationProfile,
  options?: DeclarativeValidationOptions,
): DeclarativeValidationResult
```

`parseValidationProfile` accepts YAML text or JSON-safe profile objects. The
top-level profile keys are `syntaxVersion`, `documentVersion`, and `rules`.
`syntaxVersion` must be `"markdown-engine.validation@v1"`.
`documentVersion` is optional; when provided it must be `"0.0.0"` or
`"1.0.0"`. The parser preserves omission and does not inject a default into
the parsed profile.

`validateWithProfile` resolves an omitted profile `documentVersion` to the
supplied normalized `EngineDocument.version`. The returned
`DeclarativeValidationResult.profile.documentVersion` records that resolved
version. If an explicit profile `documentVersion` does not match
`document.version`, validation emits `profile.config.documentVersionMismatch`,
returns no rule results, and does not evaluate rules.

When `DeclarativeValidationOptions.includeEvidence` is `true`, the result
contains deterministic evidence. `inputHash` hashes the canonical supplied
`EngineDocument` without top-level `document.path`. `profileHash` hashes the
resolved profile after applying the `documentVersion` and rule `severity`
defaults, so an omitted `documentVersion` and an explicit matching
`documentVersion` produce the same profile hash for the same document version
and rules.

## `serialize`

Signature:

```ts
serialize(
  result:
    | ParseResult
    | NormalizeResult
    | ValidationResult
    | DeclarativeValidationResult
    | EngineDocument
    | AnnotationValidationResult,
  options?: SerializeOptions,
): string
```

`SerializeOptions.pretty` controls two-space JSON formatting. Serialization
normalizes plain object key order, recursively normalizes arrays and objects,
and omits `undefined` properties.

`SerializeOptions.compatibilityMode` is optional. When provided, it verifies
document-bearing public results before serialization:

- `compatibilityMode: "default"` expects document version `"1.0.0"`.
- `compatibilityMode: "legacy-0.1"` expects document version `"0.0.0"`.

Mismatched document-bearing results throw `EngineCompatibilityError` with code
`engine.compatibility.versionMismatch`, `requestedMode`, `expectedVersion`, and
`actualVersion`. Results that do not contain an `EngineDocument`, such as the
current `ValidationResult`, are not rejected by the compatibility check.

The serializer is intended for stable JSON review evidence and downstream
contract checks. It does not accept arbitrary class instances as a public data
model.

## Document Contract

`EngineDocument` contains:

- `kind`: currently `"markdown-document"`
- `version`: currently `"0.0.0"`
- `path`: optional caller-supplied path
- `frontmatter`: JSON-safe parsed frontmatter value when present
- `children`: normalized `EngineNode[]`
- `sourceRange`: optional source range

`EngineNode` contains:

- `type`: engine-owned node type string
- `text`: optional text content
- `attributes`: optional JSON-safe attributes
- `sourceRange`: optional source range
- `children`: optional child nodes

Node type coverage remains limited to the current parser/IR implementation and
will expand through implementation work packages. Code nodes may include a
`kind` attribute of `fenced` or `indented`; `codeFences.*` rules apply only to
code nodes with `kind: "fenced"`. Raw parser node objects are not public.

## 1.0 Contract

The final 1.0 contract is selected as `documentVersion: "1.0.0"` and checked
with `compatibilityMode: "default"`.

Callers select the 1.0 contract with:

```ts
const parsed = parse(markdown, { path: "mission.md" });
const document = normalize(parsed.parsed, {
  documentVersion: "1.0.0",
}).document;

const sections = documentQueries.sections(document);
const serialized = serialize(document, { compatibilityMode: "default" });
```

The retained `0.1.0`-compatible path remains explicit:

```ts
const legacyDocument = normalize(parsed.parsed, {
  documentVersion: "0.0.0",
}).document;

const serializedLegacy = serialize(legacyDocument, {
  compatibilityMode: "legacy-0.1",
});
```

### 1.0 Document Fields

When callers normalize with `documentVersion: "1.0.0"`, the document
includes deterministic derived structural views:

- `kind`: `"markdown-document"`.
- `version`: `"1.0.0"`.
- `path`: optional caller-supplied path from parse or normalized document input.
- `frontmatter`: JSON-safe parsed frontmatter value when present.
- `target`: the document-level `EngineNodeTarget`.
- `children`: normalized `EngineNode[]`; each node has `target` in the 1.0
  path.
- `sourceRange`: optional document source range when source locations are
  preserved.
- `compatibility`: `{ mode: "default", reason: "1.0 document contract" }`.
- `sections`: heading-derived `EngineSection[]`.
- `textSpans`: text-bearing `EngineTextSpan[]`.
- `tables`: `EngineTable[]` with flattened table-cell coordinates.
- `lists`: `EngineList[]` with list item coordinates.
- `links`: `EngineLink[]`.
- `annotations`: optional caller-owned annotations if a caller attaches a
  validated annotation result to the document.

`EngineNode` keeps the `0.1.0` fields `type`, optional `text`, optional
`attributes`, optional `sourceRange`, and optional `children`. In the 1.0
path it may also include:

- `target`: deterministic `EngineNodeTarget`.
- `source`: `{ range, text }` when source locations are preserved and parser
  offsets are usable.

### Target Contract And Stability Limits

`EngineNodeTarget` contains:

- `kind`: currently `"node"`.
- `id`: deterministic target ID, such as `node:1.1:link` or
  `section:node:0:heading`.
- `path`: optional zero-based structural path through `children`.
- `nodeType`: optional engine-owned node type, such as `"document"`,
  `"heading"`, `"paragraph"`, `"link"`, or `"section"`.
- `sourceRange`: optional cloned source range when source locations are
  preserved.

Compatibility-first target taxonomy decision: the serialized
`EngineNodeTarget` shape remains unchanged for the 1.0 release lane. Its
`kind` field is still `"node"` for document, ordinary node, and section
addresses, so callers must not treat `target.kind` as the semantic target
category. Runtime target category is resolved by the documented query helpers:

- `document`: the document-level `document.target`. It identifies the whole
  normalized document, is not returned by `documentQueries.nodes`, and does not
  currently produce a source slice because normalized documents do not retain
  the complete source text.
- `node`: an actual recursive `EngineNode.target` in `document.children`.
  `documentQueries.nodes(document, { targetId })` only resolves this category.
- `section`: an `EngineSection.target` derived from an owning heading target.
  It is resolved through `documentQueries.sections`; `sourceSlice` returns the
  owning heading source slice when available.

Target IDs are deterministic for identical Markdown input, parser behavior,
normalization options, package version, and runtime version. They are not a
promise of stability across arbitrary content edits, parser upgrades, or final
1.0 contract promotion. They do not expose raw mdast nodes or raw parser
position objects.

`SourceRange` contains `start` and `end` positions. Each position has `line`,
`column`, and optional `offset`. Source slices are produced only when both
offsets are present, integers, ordered, non-negative, and contained by the
document source text.

### Structural Views

`sections` contains heading-derived `EngineSection` records:

- `target`: section target whose ID is derived from the heading target.
- `headingTarget`: target for the owning heading node.
- `parentSection`: optional parent section target.
- `depth`: heading depth.
- `title`: normalized heading text.
- `bodyTargets`: node targets owned by the section body.
- `childSections`: child section targets.

`textSpans` contains `EngineTextSpan` records with `target`, `text`, and
optional `sourceRange`.

`tables` contains `EngineTable` records with `target` and flattened `cells`.
Each `EngineTableCell` exposes `target`, normalized `text`, zero-based
`rowIndex`, zero-based `columnIndex`, `header`, and optional `sourceRange`. The
GFM header row is row index `0`; body rows continue at `1`, `2`, and so on.

`lists` contains `EngineList` records with `target`, `ordered`, optional
`start`, and `items`. Each `EngineListItem` exposes `target`, zero-based
`itemIndex` within its immediate list container, zero-based `depth`, optional
`checked`, and optional `sourceRange`.

`links` contains `EngineLink` records with `target`, `url`, normalized `text`,
optional `title`, and optional `sourceRange`.

### Query Helpers

`documentQueries` exposes deterministic helper methods over this public IR:

- `nodes(document, query?)` filters recursive nodes by node type or target ID.
  Recursive node-backed helper results use preorder depth-first document order:
  each node appears before its descendants, and descendants are exhausted before
  the next sibling.
- `sections(document, query?)` filters sections by target ID, heading target
  ID, parent section target ID, title, or depth.
- `textSpans(document, query?)` filters spans by target ID, node type, exact
  text, or included text.
- `tables(document, query?)` filters table views by target ID.
- `lists(document, query?)` filters list views by target ID, ordered state, or
  item depth.
- `links(document, query?)` filters link views by target ID, URL, or text.
- `targetCategory(document, target)` returns `"document"`, `"node"`,
  `"section"`, or `undefined` for targets that do not resolve in the document.
- `resolveTarget(document, target)` returns a category-specific resolution:
  document target, ordinary node plus optional source slice, or section plus
  optional owning-heading source slice.
- `sourceSlice(document, target)` returns the precomputed source slice for node
  targets when parser offsets are present, integer, ordered, non-negative, and
  in bounds. For section targets, it returns the source slice for the owning
  heading target. For document targets, it returns `undefined` because complete
  source text is not stored on `EngineDocument`. It returns `undefined` instead
  of guessing when offsets are absent, non-integer, reversed, negative,
  unsupported, out of bounds, or when the target does not resolve.

### Annotation Contract

Annotations use an explicit address-mode wrapper:

```ts
type EngineAnnotationTarget =
  | { kind: "node"; nodeTarget: EngineNodeTarget }
  | { kind: "source"; sourceRange: SourceRange };
```

For node annotations, `kind: "node"` identifies the annotation addressing mode.
The annotated Markdown node type remains `nodeTarget.nodeType`, such as
`"heading"` or `"paragraph"`. For source annotations, `sourceRange` contains
the exact caller-provided range. Annotation `payload` values remain opaque and
caller-owned; the engine validates only target shape and target existence.

`validateAnnotations(document, annotations)` returns:

- `valid`: `true` when all annotation targets are accepted.
- `annotations`: cloned annotations with target data preserved.
- `diagnostics`: deterministic `EngineTargetDiagnostic[]`.

The annotation validator accepts all resolvable engine targets: the document
target, ordinary node targets, and section targets. These keep
`target.kind: "node"` for wire compatibility; target category is determined by
the resolver APIs above. For source targets, it verifies start/end shape and
ordering. When the normalized
document has `sourceRange`, source targets must be contained by that document
range; when `sourceRange` is absent, the validator cannot prove source-target
bounds and does not synthesize a document range. It rejects malformed target
wrappers, malformed node targets, unknown node targets, invalid source range
ordering, and source ranges proven out of bounds. It does not interpret,
normalize, validate, or serialize caller payload semantics beyond normal public
serialization behavior.

### Compatibility And Migration

The current package version is `1.0.0`. The 1.0 contract is selected with
`normalize(..., { documentVersion: "1.0.0" })` and checked at serialization
with `compatibilityMode: "default"`.

The retained compatibility selector is `compatibilityMode: "legacy-0.1"`,
which accepts document-bearing public results with `version: "0.0.0"`. This is
the documented 0.1.x-compatible behavior gate. Consumers should not infer
compatibility from the absence of rich IR fields.

Migration from the `0.1.0` document shape to the 1.0 shape requires
consumers to:

- request `documentVersion: "1.0.0"` during normalization;
- read `target`, `sections`, `textSpans`, `tables`, `lists`, `links`, and
  `source` from the normalized document instead of re-deriving them from raw
  Markdown;
- use `documentQueries` for structural access rather than depending on internal
  traversal helpers;
- use `validateAnnotations` for caller-owned node and source annotations;
- serialize document-bearing rich IR outputs with `compatibilityMode:
  "default"` in gates that must reject legacy document versions;
- use `compatibilityMode: "legacy-0.1"` only for retained 0.1.x-compatible
  parse or normalize outputs.

### CLI Impact

The local CLI runs parse and normalization for one Markdown file and writes
pretty JSON. BEL-952 changes the CLI default output to the 1.0 rich IR
contract: `--file` and `--path` emit a normalized result whose
`document.version` is `"1.0.0"` and whose document includes derived rich
IR views such as `target`, `sections`, `textSpans`, `tables`, `lists`, and
`links` when present.

Legacy CLI output remains explicit:

```sh
markdown-engine --document-version 0.0.0 --file mission.md
```

The supported CLI selector values are:

- `--document-version 1.0.0`: 1.0 rich IR output, also the default
  when the selector is omitted.
- `--document-version 0.0.0`: retained `0.1.0`-compatible normalized document
  output without rich derived views.

The selector accepts spaced or assignment-form syntax, such as
`--document-version 0.0.0` or `--document-version=0.0.0`. Missing, invalid, or
repeated `--document-version` selectors exit with code `2` and usage text; an
empty assignment-form selector is treated as missing. Directory traversal
remains unsupported.

Semver classification: this is a breaking CLI output-shape change for consumers
that parse default CLI JSON. Migration is to either consume the rich IR fields or
pin `--document-version 0.0.0` until the downstream consumer is ready. API
consumers migrating to rich IR should continue to use the `documentVersion` and
`compatibilityMode` selectors documented above. The CLI default-output cutover
is carried in the 1.0 release lane, not as a `0.1.x` patch.

### Non-Goals And Limits

Structural views are derived from engine-owned document nodes, targets, and
source metadata. They do not expose raw parser AST fields as public contract.

The package boundary remains domain-neutral. The 1.0 contract does not
implement SpecTrace entities, profile compiler behavior, runtime lenses, MCP
transport, agent adapters, semantic or LLM evaluation, arbitrary rule plugins,
network services, persistence, file watching, graph storage, rendering,
sanitization, fetching, or raw HTML execution.

Source text and raw HTML remain inert strings. The engine does not promise
source slices when parser offsets are missing or unusable, and it does not
promise node target stability across arbitrary edits.

## Diagnostic Contract

`MarkdownDiagnostic` contains:

- `code`: stable diagnostic code string
- `ruleId`: optional validation rule identifier
- `message`: human-readable diagnostic message
- `severity`: `"error"`, `"warning"`, or `"info"`
- `sourceRange`: optional source range

`SourceRange` contains `start` and `end` positions. Each position has `line`,
`column`, and optional `offset`.

## Compatibility Notes

The `0.1.0` contract was review-gated by WP-2, MS-2, and MS-3 before first
publication. From the published `0.1.0` baseline forward, changes to public API
signatures, result fields, diagnostic schema, source-location semantics,
validation config semantics, or serialized output shape require
semantic-version classification. The planned 1.0 rich IR contract will update
this API contract before 1.0 release approval.

The `@jasonbelmonti/markdown-engine` package boundary remains limited to
parsing, normalization, deterministic validation, diagnostics, and
serialization. Profile compiler behavior, runtime lenses, MCP transport, agent
adapters, network services, persistence, LLM calls, semantic rubrics, and
arbitrary rule plugins are out of scope.
