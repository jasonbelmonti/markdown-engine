# markdown-engine

Deterministic Markdown parsing and validation engine package for downstream
profile and runtime work.

The current package is private and unpublished:

- package name: `markdown-engine`
- version: `0.0.0`
- release status: no package tag or publication authorized

## Scope

`markdown-engine` owns the local deterministic engine boundary:

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
import { normalize, parse, serialize, validate } from "markdown-engine";

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

Contract references:

- [Public API contract](docs/contracts/api.md)
- [Frontmatter contract](docs/contracts/frontmatter.md)

## Validation

Run the release-readiness gates from the repository root:

```sh
npm run typecheck
npm test
node scripts/check-boundaries.mjs
npm run build && node scripts/prove-repeatability.mjs --runs 10
git diff --check
```

The WP-6 validation record is:

- [EVD-7 release readiness](docs/evidence/wp-6-evd-7-release-readiness.md)
- [EVD-9 merge readiness](docs/evidence/wp-6-evd-9-merge-readiness.md)
- [EVD-10 rollback containment](docs/evidence/wp-6-evd-10-rollback-containment.md)
- [EVD-11 downstream handoff](docs/evidence/wp-6-evd-11-downstream-handoff.md)

## Release Gate

Do not tag or publish this package until MS-3 approval is recorded with:

- semver classification and package version decision
- release/tag decision
- rollback and containment notes
- downstream profile/runtime consumer confirmation
- complete evidence links from EVD-1 through EVD-11
