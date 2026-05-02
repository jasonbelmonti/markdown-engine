# Public API Contract

Status: Initial contract for `BEL-884 / WP-2`; release metadata updated by `BEL-928`
Last updated: 2026-05-01

This document defines the public `@jasonbelmonti/markdown-engine` package
contract for the current `0.1.0` release candidate. The stable public surface
is the package export from `@jasonbelmonti/markdown-engine`, not internal
adapter modules or raw parser output.

## Exported Surface

The package root exports the API functions and types from `src/api/**`:

- `parse(markdown, options?)`
- `normalize(parsed, options?)`
- `validate(document, config?, options?)`
- `serialize(result, options?)`

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

`NormalizeOptions.preserveSourceLocations` defaults to `true`. When set to
`false`, source ranges are omitted from the normalized document.

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

## `serialize`

Signature:

```ts
serialize(
  result: ParseResult | NormalizeResult | ValidationResult,
  options?: SerializeOptions,
): string
```

`SerializeOptions.pretty` controls two-space JSON formatting. Serialization
normalizes plain object key order, recursively normalizes arrays and objects,
and omits `undefined` properties.

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

Before the first package release, these contracts are review-gated by WP-2,
MS-2, and MS-3. After release, changes to public API signatures, result fields,
diagnostic schema, source-location semantics, validation config semantics, or
serialized output shape require semantic-version classification.

The `@jasonbelmonti/markdown-engine` package boundary remains limited to
parsing, normalization, deterministic validation, diagnostics, and
serialization. Profile compiler behavior, runtime lenses, MCP transport, agent
adapters, network services, persistence, LLM calls, semantic rubrics, and
arbitrary rule plugins are out of scope.
