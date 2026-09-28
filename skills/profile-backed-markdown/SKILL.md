---
name: profile-backed-markdown
description: Validate Markdown files that declare a local markdown-engine validation profile in frontmatter.
---

# Profile-Backed Markdown

Use this skill when a Markdown file contains frontmatter with `validationProfile`
and you need deterministic profile validation before editing or handing off the
file.

## Workflow

1. Run the bundled wrapper:

```bash
node scripts/validate-profile-backed-markdown.mjs --file /path/to/file.md
```

2. Treat stdout as the validator JSON source of truth. Do not infer pass/fail
   from prose or repair notes. Compact output includes total diagnostic counts
   and omission/truncation counts. The wrapper does not save a report, so its
   summary has no `report` field. No automatic report cache is created or pruned.
   When omitted details matter, retrieve complete results as described below.
3. If validation fails, rerun with `--repair-brief` to emit compact repair
   guidance on stderr while preserving validator JSON on stdout.
4. Edit the Markdown file only when the user asked for repair. Do not edit
   validation profiles unless explicitly requested.
5. Rerun the wrapper after edits and require exit code `0` before reporting the
   document clean.

## Complete Results

Invoke the same CLI selected under Bundled CLI directly, using the profile file
resolved under Frontmatter Contract (including any custom `--profile-root`):

```bash
node /path/to/markdown-engine-cli.mjs validate \
  --file /path/to/file.md --profile /path/to/resolved-profile.yaml --output full
```

This returns all diagnostics and evidence on stdout. To also retain the complete
report, add `--report-file /path/to/new-report.json`; its parent must exist and
the destination must not already exist. An explicit report-write failure exits
`2` with stderr and no validation JSON. These options belong to the CLI; the
wrapper does not accept `--output` or `--report-file`.

## Frontmatter Contract

The wrapper reads a top-level frontmatter scalar:

```yaml
validationProfile: operational-spec
```

Profile names resolve to `assets/profiles/<validationProfile>.yaml` by default.
The wrapper rejects absolute paths and parent-directory traversal so validation
profiles stay within the local skill assets.

## Bundled CLI

The wrapper does not require a globally installed `markdown-engine` binary. It
uses `MARKDOWN_ENGINE_CLI` when set, then checks for a local
`scripts/markdown-engine-cli.mjs`, then falls back to the package-level
`dist-bundled/markdown-engine-cli.mjs`.

For a standalone skill folder, build and copy the bundled CLI artifact before
distribution:

```bash
npm run build:cli:bundled
cp dist-bundled/markdown-engine-cli.mjs skills/profile-backed-markdown/scripts/
```
