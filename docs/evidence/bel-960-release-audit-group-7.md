# BEL-960 Release Audit Group 7: CLI and File Runtime Surface

Date: 2026-05-07
Issue: BEL-960
Parent: BEL-956
Base: `origin/main` at `d88c409258f8d123fa8ddffdd44bf63bfe044355`

## Scope

This audit covers the documented local single-file CLI surface: CLI argument
selection, file target behavior, default rich IR output, explicit legacy output,
public CLI documentation, and release-audit evidence. It does not tag, publish,
promote `1.0.0-draft` to `1.0.0`, add directory traversal, or add public
`RichIr*` APIs.

## Result

Status: pass with evidence and test coverage updates.

No runtime source change was required. The committed runtime behavior matched
the intended single-file CLI contract. The audit added focused coverage for
assignment-form selector failures and missing-file failure behavior, clarified
the public CLI selector syntax documentation, and recorded the built CLI command
matrix below.

The package remains `0.1.0`; 1.0 publication remains withheld pending BEL-956.

## Observed CLI Contract

- Default CLI output emits `document.version: "1.0.0-draft"` and rich IR fields
  such as document `target` and `sections`.
- `--document-version 0.0.0` emits retained legacy output without rich derived
  views such as document `target` and `sections`.
- `--document-version=1.0.0-draft` selects the same rich IR output as the
  default.
- Invalid, missing, empty assignment-form, and repeated `--document-version`
  selectors exit `2`, write no stdout, and include usage text on stderr.
- Missing file targets exit `1`, write no stdout, and report the read failure on
  stderr.
- Directory targets exit `1`, write no stdout, and report that directories are
  unsupported. No traversal behavior is exposed.

## Built CLI Matrix

Command form: `node dist/cli/index.js ...` from a temporary working directory
containing `mission.md`, `legacy.md`, and `docs/nested.md`.

```text
default rich IR | exit=0 | stdout=document.version:1.0.0-draft, target:true, sections:true | stderr="" | usage=false
legacy selector | exit=0 | stdout=document.version:0.0.0, target:false, sections:false | stderr="" | usage=false
assignment selector | exit=0 | stdout=document.version:1.0.0-draft, target:true, sections:true | stderr="" | usage=false
invalid split selector | exit=2 | stdout=empty | stderr="Invalid document version: 1.0.0. Expected one of: 0.0.0 | 1.0.0-draft." | usage=true
invalid assignment selector | exit=2 | stdout=empty | stderr="Invalid document version: 1.0.0. Expected one of: 0.0.0 | 1.0.0-draft." | usage=true
missing split selector | exit=2 | stdout=empty | stderr="Missing value for --document-version." | usage=true
empty assignment selector | exit=2 | stdout=empty | stderr="Missing value for --document-version." | usage=true
repeated mixed selector | exit=2 | stdout=empty | stderr="Expected at most one --document-version selector." | usage=true
missing file target | exit=1 | stdout=empty | stderr="Unable to read \"missing.md\": ENOENT: no such file or directory, stat '<temp>/missing.md'" | usage=false
directory target | exit=1 | stdout=empty | stderr="Expected a file path for \"docs\". Directories are not supported." | usage=false
```

## Validation

Baseline from the fresh BEL-960 worktree before edits:

```sh
npm run build
npm run docs:rich-ir-contract
npx vitest run tests/cli.test.ts "--exclude=.worktrees/**"
```

Observed result: build passed; docs contract gate passed; focused CLI suite
passed with 9 tests.

Post-audit validation:

```sh
npx vitest run tests/cli.test.ts "--exclude=.worktrees/**"
npm run build
npm run docs:rich-ir-contract
npm run typecheck
npm test
git diff --check HEAD --
```

Observed result: focused CLI suite passed with 13 tests; build passed; docs
contract gate passed; typecheck passed; full test suite passed with 16 files
and 100 tests; whitespace diff check passed.

## Residual Risks

- This audit proves the local single-file CLI surface only. It does not expand
  the CLI into a workflow, directory traversal, or batch-processing surface.
- Downstream consumers that parse default CLI JSON by shape still need to
  migrate to the rich IR fields or pin `--document-version 0.0.0`.
- The final 1.0 document-version decision remains outside this audit; do not
  promote `1.0.0-draft` during BEL-960.
