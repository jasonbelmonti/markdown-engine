# @jasonbelmonti/markdown-engine

Deterministic Markdown parsing and validation engine package for downstream
profile and runtime work.

Package release state:

- package name: `@jasonbelmonti/markdown-engine`
- package metadata version: `3.1.0`
- published npm versions before this release: `0.1.0`, `1.0.0`, `2.0.0`,
  `3.0.0`
- npm release target: `3.1.0` on `latest`
- website: <https://jasonbelmonti.github.io/markdown-engine/>
- release focus: document-set validation, V2 `frontmatterShape` and
  `textFormat: isoDate` support, and OKF profile examples while retaining the
  existing `documentVersion: "1.0.0"` rich IR contract as the default API and
  CLI document shape
- maintainer documentation map: [docs/README.md](docs/README.md)
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
- `parseValidationProfile(input, options?)`
- `validateWithProfile(document, profile, options?)`
- `validateDocumentSet(entries, options?)`

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

Package 3.1 retains the serialized document contract at
`documentVersion: "1.0.0"` and makes that rich IR path the default for
`normalize(parsed)`. Callers may still pass
`normalize(parsed, { documentVersion: "1.0.0" })` explicitly. That path adds
deterministic targets, structural views, source slices, query helpers, and
caller-owned annotation target validation. The retained `0.1.0`-compatible
document path remains selectable as `documentVersion: "0.0.0"` and
serialization gates can require it with `compatibilityMode: "legacy-0.1"`.

## CLI

The package includes a minimal local CLI for experimenting with one Markdown
file at a time. The default command runs parse and normalization, then writes
the normalized result as pretty JSON. The `validate` subcommand runs one
declarative validation profile against one Markdown file and writes pretty JSON.

From the repository or package root after building, run:

```sh
npm run build
node dist/cli/index.js --file fixtures/declarative-validation/examples/operational-spec/pass.md
```

The package binary accepts `--file` or `--path` as aliases for a single file.
For an npm install in the current project, point at the bundled examples through
`node_modules/@jasonbelmonti/markdown-engine`:

```sh
markdown-engine --path node_modules/@jasonbelmonti/markdown-engine/fixtures/declarative-validation/examples/operational-spec/pass.md
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
markdown-engine --document-version 0.0.0 --file node_modules/@jasonbelmonti/markdown-engine/fixtures/declarative-validation/examples/operational-spec/pass.md
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
markdown-engine validate --file node_modules/@jasonbelmonti/markdown-engine/fixtures/declarative-validation/examples/operational-spec/pass.md --profile node_modules/@jasonbelmonti/markdown-engine/fixtures/declarative-validation/examples/operational-spec/profile.yaml
```

`--format json` is accepted for validation, is the default, and is the only
supported format. The validation command reads and checks the profile before
reading the Markdown file. Profile parse/config/compile failures exit with code
`1` and emit JSON with `stage: "profile"`, empty `ruleResults`, no `profile`,
and no `evidence`. Markdown read errors and usage errors exit with code `2`.
Successful validation exits with code `0`; validation or normalization error
diagnostics exit with code `1`. Validation JSON includes `profile`,
`ruleResults`, `diagnostics`, and `evidence`.

Declarative validation compatibility is syntax-versioned. Existing v1 profiles
remain on the v1 result and evidence shape by keeping:

```yaml
syntaxVersion: markdown-engine.validation@v1
```

Conditional V2 behavior is selected only by an explicit v2 profile:

```yaml
syntaxVersion: markdown-engine.validation@v2
rules:
  - id: release.docs
    anyOf:
      - label: release-section
        select:
          target: section
          title: Release
        assert:
          exists: true
      - label: changelog-link
        select:
          target: link
          text: changelog
        assert:
          exists: true
```

CLI validation output uses `profile.syntaxVersion` as the v1/v2 discriminator.
V1 rule results keep the existing flat `ruleId`, `passed`, and `diagnostics`
fields. V2 rule results add `status` and `evaluation`; v2 profile metadata adds
`evaluatedRuleCount` and `skippedRuleCount` when the profile explicitly opts into
`markdown-engine.validation@v2`.

Reader-facing declarative validation examples live under
`fixtures/declarative-validation/examples/**`. From the repository or package
root after building, run one passing and one intentionally failing example with:

```sh
node dist/cli/index.js validate --file fixtures/declarative-validation/examples/operational-spec/pass.md --profile fixtures/declarative-validation/examples/operational-spec/profile.yaml
node dist/cli/index.js validate --file fixtures/declarative-validation/examples/operational-spec/fail.md --profile fixtures/declarative-validation/examples/operational-spec/profile.yaml
```

The passing example exits `0`; the failing example exits `1` and prints JSON
diagnostics for review.

### OKF v0.1 example composition

The packaged OKF v0.1 examples show how callers can compose generic
declarative-validation primitives without making `markdown-engine` an OKF
adapter. The example profiles use `frontmatterShape` for role-specific
frontmatter checks, `textFormat` for `log.md` date headings, and
`validateDocumentSet` to aggregate caller-supplied Markdown/profile pairs.

The caller remains responsible for caller-owned path classification, bundle
traversal, IO, and profile selection. A caller-owned router should classify
non-reserved concept documents separately from reserved files:

- concept documents use `profiles/concept.yaml`, where `frontmatterShape`
  requires a non-empty string `type`
- the bundle-root `index.md` uses `profiles/root-index.yaml`, which permits the
  OKF version exception `okf_version: "0.1"`
- non-root `index.md` files use `profiles/non-root-index.yaml`, where
  frontmatter is forbidden
- `log.md` uses `profiles/log.yaml`, where `textFormat` validates level-2 date
  headings as real `YYYY-MM-DD` calendar dates

This package does not discover bundles, classify OKF paths, route roles for
callers, reject unknown concept types, check links, require optional
`index.md` files, or publish an OKF CLI.

### Bundled CLI install for constrained agent harnesses

The package ships a single-file bundled CLI at
`dist-bundled/markdown-engine-cli.mjs`. Agent harnesses that forbid random
runtime package execution should install this artifact once and run it through a
local wrapper instead of using `npx`:

```sh
scripts/install-markdown-engine-cli.sh
export PATH="${MARKDOWN_ENGINE_BIN_DIR:-$HOME/.local/bin}:$PATH"
```

From a project root where the package is installed as a dependency, invoke the
packaged installer directly:

```sh
node_modules/@jasonbelmonti/markdown-engine/scripts/install-markdown-engine-cli.sh
export PATH="${MARKDOWN_ENGINE_BIN_DIR:-$HOME/.local/bin}:$PATH"
```

By default, the installer places the CLI under
`${MARKDOWN_ENGINE_HOME:-${XDG_DATA_HOME:-$HOME/.local/share}/markdown-engine}`
and writes the wrapper to
`${MARKDOWN_ENGINE_BIN_DIR:-$HOME/.local/bin}/markdown-engine`. The installer
uses a local bundled artifact only when it matches the pinned artifact hash.
Otherwise it downloads `@jasonbelmonti/markdown-engine@3.1.0` with `npm pack
--ignore-scripts` and extracts only
`package/dist-bundled/markdown-engine-cli.mjs` from the tarball. It verifies the
pinned artifact hash before installing:

```text
57f6a1a05cd9a6d042de530fe0b38c55048887e2d8387ca07c4f4bc135f49533
```

The installed wrapper is:

```sh
"${MARKDOWN_ENGINE_BIN_DIR:-$HOME/.local/bin}/markdown-engine" validate --file <file.md> --profile <profile.yaml> --format json
```

Package 3.1 keeps the 2.0 API normalization default: callers that invoke
`normalize(parsed)` receive the rich IR `1.0.0` document shape. Consumers that
still need the legacy `0.0.0` shape should consume the rich IR fields
(`target`, `sections`, `textSpans`, `tables`, `lists`, and `links`) or pin
`normalize(parsed, { documentVersion: "0.0.0" })` until they are ready. The CLI
continues to default to the rich IR document contract and keeps
`--document-version 0.0.0` for explicit legacy output.

Package and contract references:

- [Consumer website](https://jasonbelmonti.github.io/markdown-engine/)
- [Maintainer documentation map](docs/README.md)
- [Public API contract](docs/contracts/api.md)
- [Declarative validation contract](docs/contracts/declarative-validation.md)
- [Frontmatter contract](docs/contracts/frontmatter.md)
- [Markdown Engine 1.0 Rich IR design](docs/design/markdown-engine-1.0-rich-ir-operational-design-spec.md)
- [Testing and snapshot operations](docs/testing.md)
- [Changelog](CHANGELOG.md)
- [Security policy](SECURITY.md)

## Validation

Run focused contract documentation gates from the repository root:

```sh
npm run docs:rich-ir-contract
npm run docs:declarative-validation-contract
npm run audit:declarative-validation-boundary
```

Run full release-readiness and publication dry-run gates only when preparing a
release, tag, package artifact, or publication decision:

```sh
npm run release:verify
npm pack --dry-run
npm publish --dry-run --access public
```

The full maintainer and evidence index lives in
[docs/README.md](docs/README.md). The focused contract documentation gates
currently check these evidence records:

- [Rich IR contract documentation gate](docs/evidence/wp-5-evd-6-rich-ir-contract.md)
- [Declarative validation contract review](docs/evidence/wp-5-evd-7-declarative-validation-contract-review.md)
- [Declarative validation boundary audit](docs/evidence/wp-5-evd-8-declarative-validation-boundary-audit.md)
- [OKF validation seal evidence](docs/evidence/bel-1332-okf-release-readiness.md)

Snapshot baseline updates are operational changes, not routine test-output
cleanup. Use the [testing and snapshot operations](docs/testing.md) guide before
updating files under `snapshots/**`.
