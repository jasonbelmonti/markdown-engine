# Frontmatter Contract

Status: Initial contract for `BEL-907 / WP-2A`
Last updated: 2026-04-30

This document defines the public behavior of YAML frontmatter parsing in
`markdown-engine`. The raw `yaml` parser document and AST are internal adapter
details and are not exposed through the public parse result.

## Extraction

Frontmatter is recognized only when the Markdown document begins with an
optional UTF-8 BOM followed by an opening `---` line and a later closing `---`
line. If the opening delimiter is not closed, the input is treated as Markdown
body content.

Absent frontmatter produces no diagnostics and leaves `parsed.frontmatter` and
`parsed.document.frontmatter` unset. Empty frontmatter, such as:

```yaml
---
---
```

produces `{}` with no diagnostics.

## YAML Parser Options

The adapter uses `yaml` package APIs verified against `yaml@2.8.3`. Parser
behavior is pinned with these engine-owned options:

```ts
{
  compat: null,
  customTags: null,
  intAsBigInt: false,
  keepSourceTokens: false,
  logLevel: "error",
  merge: false,
  prettyErrors: false,
  resolveKnownTags: false,
  schema: "core",
  strict: true,
  stringKeys: false,
  uniqueKeys: true,
  version: "1.2",
}
```

Materialization uses:

```ts
{
  mapAsMap: true,
  maxAliasCount: 50,
}
```

`mapAsMap: true` prevents JavaScript object key coercion during materialization.
The engine then validates keys and converts supported maps into JSON-safe plain
objects.

## Values

The schema is YAML 1.2 core. Representative scalar behavior:

| YAML source | Parsed value |
| --- | --- |
| `yes`, `no`, `on`, `off` | strings |
| `true`, `false` | booleans |
| `null`, `~` | `null` |
| integer and finite float values | numbers |

The public frontmatter value must be JSON-safe: `null`, booleans, finite
numbers, strings, arrays, and objects with string keys. Non-finite numbers such
as `.nan` or `.inf` are rejected because JSON serialization would otherwise
coerce them silently.

## Keys

Duplicate mapping keys are invalid. They produce a
`frontmatter.yaml.invalid` diagnostic and no parsed frontmatter value.

All mapping keys must be YAML string scalars. Numeric, boolean, null, sequence,
or mapping keys are rejected with a `frontmatter.yaml.invalid` diagnostic before
JavaScript key coercion can change the input shape.

## Warnings

YAML warnings are preserved as `frontmatter.yaml.warning` diagnostics with
severity `warning`. Warnings do not block `parsed.frontmatter` when the YAML can
still materialize into JSON-safe data.

Explicit tags outside the YAML 1.2 core contract are not resolved through
YAML 1.1 known-tag behavior. For example, `!!timestamp 2026-04-30` is preserved
as the string `2026-04-30` and accompanied by an unresolved-tag warning.

## Aliases And Merge Keys

Aliases are supported with `maxAliasCount: 50` as the materialization limit. In
`yaml@2.8.3`, inputs that reach that threshold are rejected as excessive alias
expansion. Missing aliases are invalid and produce `frontmatter.yaml.invalid`.

Cyclic aliases are invalid. They produce `frontmatter.yaml.invalid` and no
parsed frontmatter value.

YAML merge keys are disabled. A `<<` key is treated as an ordinary string key,
not as an instruction to merge mappings.

## Diagnostics

Invalid YAML, multiple YAML documents, duplicate keys, unsupported keys, alias
failures, cyclic aliases, non-finite numbers, and non-JSON-safe materialized
values produce
`frontmatter.yaml.invalid` diagnostics with severity `error`. Diagnostic source
ranges are mapped back to Markdown source positions when the YAML package
provides offsets; otherwise the full frontmatter block range is used.

Warnings produce `frontmatter.yaml.warning` diagnostics with severity
`warning`.

Markdown body parsing continues even when frontmatter parsing fails.
