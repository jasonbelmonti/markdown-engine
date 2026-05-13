# @jasonbelmonti/markdown-engine

Deterministic Markdown parsing and validation engine package for downstream
profile and runtime work.

Current package release:

- package name: `@jasonbelmonti/markdown-engine`
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

The 1.0 release exposes the rich IR contract through
`normalize(parsed, { documentVersion: "1.0.0" })`. That path adds
deterministic targets, structural views, source slices, query helpers, and
caller-owned annotation target validation. The retained `0.1.0`-compatible
document path remains selectable as `documentVersion: "0.0.0"` and
serialization gates can require it with `compatibilityMode: "legacy-0.1"`.

## CLI

The package includes a minimal local CLI for experimenting with one Markdown
file at a time. The default command runs parse and normalization, then writes
the normalized result as pretty JSON. The `validate` subcommand runs one
declarative validation profile against one Markdown file and writes pretty JSON.

After building, run:

```sh
npm run build
node dist/cli/index.js --file fixtures/representative.md
```

The package binary accepts `--file` or `--path` as aliases for a single file:

```sh
markdown-engine --path fixtures/representative.md
```

By default, CLI output uses the 1.0 rich IR contract:

```json
{
  "document": {
    "version": "1.0.0",
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

The selector accepts spaced or assignment-form syntax, such as
`--document-version 0.0.0` or `--document-version=0.0.0`. Supported selector
values are `1.0.0` and `0.0.0`. Missing, invalid, or repeated
`--document-version` selectors exit with code `2` and usage text; an empty
assignment-form selector is treated as missing. Directory traversal is not
supported by this CLI slice.

Declarative validation uses the 1.0 document contract and does not accept
`--document-version`:

```sh
markdown-engine validate --file fixtures/representative.md --profile profile.yaml
```

`--format json` is accepted for validation, is the default, and is the only
supported format. The validation command reads and checks the profile before
reading the Markdown file. Profile parse/config/compile failures exit with code
`1` and emit JSON with `stage: "profile"`, empty `ruleResults`, no `profile`,
and no `evidence`. Markdown read errors and usage errors exit with code `2`.
Successful validation exits with code `0`; validation or normalization error
diagnostics exit with code `1`. Validation JSON includes `profile`,
`ruleResults`, `diagnostics`, and `evidence`.

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
- [EVD-6 declarative validation repeatability](docs/evidence/wp-5-evd-6-declarative-validation-repeatability.md)
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

Current release decision: BEL-965 promotes the package metadata and public rich
IR document contract to `1.0.0` after BEL-956 child audit tracks completed and
the release gates passed. The `v1.0.0` git tag must point only at a commit that
passes the validation commands above.

When 1.0 is approved, publish the package as:

```sh
npm publish --access public
```

The publish path is guarded by npm lifecycle scripts: `prepublishOnly` and
`prepack` both run the release verification gate before `npm publish` or
`npm pack` creates an artifact. The gate rebuilds `dist` and fails if tracked
files drift from `HEAD`.
