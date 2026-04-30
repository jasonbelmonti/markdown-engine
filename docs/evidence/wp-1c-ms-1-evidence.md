# WP-1C MS-1 Evidence

Issue: `BEL-890`
Date: 2026-04-29
Branch: `codex/bel-890-wp-1c`
Fixture: `fixtures/representative.md`

## EVD-1 Critical-Path Proof Record

Proving-slice commands:

```sh
npm ci
npm run typecheck
npm test -- --run tests/ms1-pipeline.test.ts
```

Final validation commands run for review readiness:

```sh
npm run typecheck
npm test
git diff --check
rg -n "MCP|agent-adapter|agent adapter|LLM|fetch\\(|network service|profile compiler|runtime lens" src tests
```

Final validation result:

- `npm run typecheck`: pass
- `npm test`: pass, 3 test files and 13 tests
- `git diff --check`: pass
- Boundary grep over `src` and `tests`: no matches

Representative path proven:

```text
parse -> normalize -> validate -> serialize
```

The representative fixture parses YAML frontmatter, normalizes into engine-owned
IR, preserves source ranges on representative nodes, keeps raw HTML as inert
text data, and serializes deterministic JSON without exposing raw parser
`position` fields.

Representative normalized output excerpt:

```json
{
  "frontmatter": {
    "owner": "markdown-engine",
    "status": "draft",
    "tags": ["parser", "frontmatter"],
    "title": "Representative parser fixture"
  },
  "firstNode": {
    "type": "heading",
    "text": "Mission Brief",
    "attributes": {
      "depth": 1
    },
    "sourceRange": {
      "start": {
        "line": 10,
        "column": 1,
        "offset": 116
      },
      "end": {
        "line": 10,
        "column": 16,
        "offset": 131
      }
    }
  },
  "htmlNode": {
    "type": "html",
    "text": "<div data-engine=\"inert\">Raw HTML data</div>",
    "sourceRange": {
      "start": {
        "line": 20,
        "column": 1,
        "offset": 283
      },
      "end": {
        "line": 20,
        "column": 45,
        "offset": 327
      }
    }
  },
  "diagnostics": []
}
```

Serialized validation output:

```json
{
  "diagnostics": [],
  "ruleResults": [
    {
      "diagnostics": [],
      "passed": true,
      "ruleId": "frontmatter.required"
    }
  ],
  "valid": true
}
```

## EVD-4 Config And Rule Validation Report

Minimal YAML-friendly proving config:

```yaml
rules:
  frontmatter.required:
    fields:
      - title
      - owner
```

Supported deterministic rule:

- `frontmatter.required` checks required fields on normalized
  `EngineDocument.frontmatter`.
- Rule output is deterministic and includes `ruleId`, `passed`, and nested
  diagnostics.
- Validation result validity is derived from error-severity diagnostics.

Unsupported-rule diagnostic example:

```json
{
  "diagnostics": [
    {
      "code": "config.rule.unsupported",
      "message": "Unsupported validation rule \"semantic.summaryQuality\".",
      "ruleId": "semantic.summaryQuality",
      "severity": "error"
    },
    {
      "code": "frontmatter.required.missing",
      "message": "Required frontmatter field \"title\" is missing.",
      "ruleId": "frontmatter.required",
      "severity": "error"
    },
    {
      "code": "frontmatter.required.missing",
      "message": "Required frontmatter field \"owner\" is missing.",
      "ruleId": "frontmatter.required",
      "severity": "error"
    }
  ],
  "ruleResults": [
    {
      "diagnostics": [
        {
          "code": "frontmatter.required.missing",
          "message": "Required frontmatter field \"title\" is missing.",
          "ruleId": "frontmatter.required",
          "severity": "error"
        },
        {
          "code": "frontmatter.required.missing",
          "message": "Required frontmatter field \"owner\" is missing.",
          "ruleId": "frontmatter.required",
          "severity": "error"
        }
      ],
      "passed": false,
      "ruleId": "frontmatter.required"
    }
  ],
  "valid": false
}
```

## Validation Mapping

- `VAL-1`: Existing representative parser test covers GFM heading, link,
  task-list item, code fence, and raw HTML intake.
- `VAL-2`: Existing frontmatter tests cover valid, absent, empty, invalid,
  alias, cyclic alias, and BOM cases.
- `VAL-3`: `tests/ms1-pipeline.test.ts` checks normalized IR hierarchy, node
  type, text, source ranges, frontmatter, and inert raw HTML representation.
- `VAL-4`: `tests/ms1-pipeline.test.ts` checks the minimal deterministic config
  rule and explicit unsupported-rule diagnostics.

## Boundary Notes

This slice does not implement semantic rules, LLM calls, custom plugin
execution, profile/runtime behavior, MCP transport, agent adapters, persistence,
network services, or raw-HTML policy diagnostics. Raw HTML remains inert IR data.
