# @jasonbelmonti/markdown-engine

Deterministic Markdown parsing and validation engine package for downstream
profile and runtime work.

Current published release:

- package name: `@jasonbelmonti/markdown-engine`
- version: `0.1.0`

Next release target:

- version: `1.0.0`
- release focus: feature-complete rich IR, structural query helpers, source
  targeting, table/list models, annotations, and deterministic serialization
- design reference:
  [Markdown Engine 1.0 Rich IR design](docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md)

## Scope

`@jasonbelmonti/markdown-engine` owns the deterministic engine boundary:

- parse GFM Markdown and YAML frontmatter
- normalize parser output into engine-owned IR
- validate deterministic declarative rules
- emit structured diagnostics
- serialize public results with stable JSON key ordering

Out of scope for this package: profile compiler behavior, runtime lenses, MCP
transport, agent adapters, semantic or LLM evaluation, arbitrary rule plugins,
network services, persistence, and raw parser AST as a public contract.

## Public API

The package root exports:

- `parse(markdown, options?)`
- `normalize(parsed, options?)`
- `validate(document, config?, options?)`
- `serialize(result, options?)`
- `documentQueries`
- `validateAnnotations(document, annotations)`

Example:

```ts
import {
  normalize,
  parse,
  serialize,
  validate,
} from "@jasonbelmonti/markdown-engine";

const markdown = `---
title: Mission Brief
owner: docs
---

# Mission Brief

\`\`\`ts
const ready = true;
\`\`\`
`;

const parseResult = parse(markdown, { path: "mission.md" });
const normalizeResult = normalize(parseResult.parsed);
const validationResult = validate(normalizeResult.document, {
  rules: {
    "frontmatter.required": { fields: ["title", "owner"] },
    "headings.required": { headings: ["Mission Brief"] },
    "codeFences.languages": {
      allowed: ["ts"],
      requireLanguage: true,
    },
  },
});

console.log(validationResult.valid);
console.log(serialize(validationResult, { pretty: true }));
```

The 1.0 implementation lane exposes the rich IR draft contract through
`normalize(parsed, { documentVersion: "1.0.0-draft" })`. That path adds
deterministic targets, structural views, source slices, query helpers, and
caller-owned annotation target validation. The retained `0.1.0`-compatible
document path remains selectable as `documentVersion: "0.0.0"` and
serialization gates can require it with `compatibilityMode: "legacy-0.1"`.

## CLI

The package includes a minimal local CLI for experimenting with one Markdown
file at a time. It runs parse and normalization, then writes the normalized
result as pretty JSON.

After building, run:

```sh
npm run build
node dist/cli/index.js --file fixtures/representative.md
```

The package binary accepts `--file` or `--path` as aliases for a single file:

```sh
markdown-engine --path fixtures/representative.md
```

By default, CLI output uses the 1.0 draft rich IR contract:

```json
{
  "document": {
    "version": "1.0.0-draft",
    "target": { "kind": "node", "nodeType": "document" },
    "sections": []
  }
}
```

Use `--document-version 0.0.0` when a caller still needs the legacy
`0.1.0`-compatible document shape without rich derived views:

```sh
markdown-engine --document-version 0.0.0 --file fixtures/representative.md
```

Supported selector values are `1.0.0-draft` and `0.0.0`. Missing, invalid, or
repeated `--document-version` selectors exit with code `2` and usage text.
Directory traversal is not supported by this CLI slice.

BEL-952 classifies the default CLI output change as breaking for consumers that
parse CLI JSON without selecting `--document-version 0.0.0`. Migration is to
either consume the rich IR fields (`target`, `sections`, `textSpans`, `tables`,
`lists`, and `links`) or pin the explicit legacy selector until the downstream
consumer is ready. This default-output cutover belongs to the 1.0 release lane,
not a `0.1.x` patch.

Contract references:

- [Public API contract](docs/contracts/api.md)
- [Frontmatter contract](docs/contracts/frontmatter.md)
- [Markdown Engine 1.0 Rich IR design](docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md)
- [Testing and snapshot operations](docs/testing.md)
- [Changelog](CHANGELOG.md)
- [Security policy](SECURITY.md)

## Validation

Run the release-readiness gates from the repository root:

```sh
npm run docs:rich-ir-contract
npm run release:verify
npm pack --dry-run
npm publish --dry-run --access public
```

Validation records include:

- [EVD-6 rich IR contract docs](docs/evidence/wp-5-evd-6-rich-ir-contract.md)
- [EVD-8 compatibility and CLI impact](docs/evidence/wp-5-evd-8-compatibility-cli-impact.md)
- [EVD-9 1.0 downstream exercise](docs/evidence/wp-6-evd-9-downstream-exercise.md)
- [EVD-10 1.0 release readiness](docs/evidence/wp-6-evd-10-release-readiness.md)
- [EVD-7 release readiness](docs/evidence/wp-6-evd-7-release-readiness.md)
- [EVD-9 merge readiness](docs/evidence/wp-6-evd-9-merge-readiness.md)
- [EVD-10 rollback containment](docs/evidence/wp-6-evd-10-rollback-containment.md)
- [EVD-11 downstream handoff](docs/evidence/wp-6-evd-11-downstream-handoff.md)

Snapshot baseline updates are operational changes, not routine test-output
cleanup. Use the [testing and snapshot operations](docs/testing.md) guide before
updating files under `snapshots/**`.

## 1.0 Release Gate

Do not tag or publish the 1.0 release until approval is recorded with:

- semver classification and package version decision
- release/tag decision
- rollback and containment notes
- downstream profile/runtime consumer confirmation
- complete evidence links from EVD-1 through EVD-11

Current MS-3 decision: BEL-944 withholds the actual 1.0 tag and package
publication until the BEL-956 publication audit is complete. The release
candidate validation and handoff evidence are recorded, but
`@jasonbelmonti/markdown-engine@0.1.0` remains the latest published package. A
future explicit release decision may promote the draft rich IR contract to a
final 1.0 package release only after BEL-956 records a publish-ready
recommendation.

When 1.0 is approved, publish the package as:

```sh
npm publish --access public
```

The publish path is guarded by npm lifecycle scripts: `prepublishOnly` and
`prepack` both run the release verification gate before `npm publish` or
`npm pack` creates an artifact. The gate rebuilds `dist` and fails if tracked
files drift from `HEAD`.
