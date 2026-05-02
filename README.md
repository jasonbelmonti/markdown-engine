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

Directory traversal is not supported by this CLI slice.

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
npm run release:verify
npm pack --dry-run
npm publish --dry-run --access public
```

The WP-6 validation record is:

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

When 1.0 is approved, publish the package as:

```sh
npm publish --access public
```

The publish path is guarded by npm lifecycle scripts: `prepublishOnly` and
`prepack` both run the release verification gate before `npm publish` or
`npm pack` creates an artifact. The gate rebuilds `dist` and fails if tracked
files drift from `HEAD`.
