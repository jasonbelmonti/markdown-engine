# Declarative Validation Contract

Status: package 2.0.0, v1 profile syntax, document contract 1.0.0
Last updated: 2026-05-13

This document defines the public declarative validation contract for
`@jasonbelmonti/markdown-engine`. The stable surface is the package-root API,
the v1 profile syntax, the CLI validation command, diagnostic codes, serialized
result shapes, and evidence fields. Internal parser output, compiled rule-plan
records, selector target records, and evaluator implementation modules are not
public contracts.

Package 2.0 does not introduce `documentVersion: "2.0.0"` or
`markdown-engine.validation@v2`. Declarative validation continues to use the v1
profile syntax against the existing `documentVersion: "1.0.0"` rich IR
document contract.

## 1.0 Contract

Declarative validation is a local, deterministic validation layer over a
normalized `EngineDocument`. It accepts inert YAML-compatible profile data,
compiles supported selectors and assertions into engine-owned rule plans, and
returns stable diagnostics, rule results, profile metadata, and optional
evidence.

The public API functions are:

```ts
parseValidationProfile(
  input: string | JsonSafeValue,
  options?: DeclarativeProfileParseOptions,
): DeclarativeProfileParseResult

validateWithProfile(
  document: EngineDocument,
  profile: ValidationProfile,
  options?: DeclarativeValidationOptions,
): DeclarativeValidationResult
```

Compiled declarative validation plans are internal. They are not exported from
the package root, are not serialized in API or CLI results, and carry no semver
stability guarantee.

## Syntax Versioning

The v1 syntax is selected with:

```yaml
syntaxVersion: markdown-engine.validation@v1
```

`syntaxVersion` is required. Missing or unsupported values emit
`profile.config.unsupportedSyntaxVersion`.

The v1 vocabulary is closed. Unknown profile keys, rule keys, selector keys,
known assertion keys, and nested assertion keys emit
`profile.config.unsupportedKey` unless the contract assigns a more specific
compile diagnostic for an unsupported selector target or unsupported assertion
member.

Regex-like keys are explicitly unsupported in v1:

- `matches`
- `pattern`
- `regex`
- `regexp`

Executable-like keys are also unsupported:

- `callback`
- `eval`
- `execute`
- `expression`
- `function`
- `import`
- `imports`
- `plugin`
- `script`

These keys are treated as data-only unsupported config. They are not executed,
imported, evaluated, or compiled.

## Document-Version Behavior

Profiles may include:

```yaml
documentVersion: 1.0.0
```

Supported profile `documentVersion` values are `"0.0.0"` and `"1.0.0"`.
Omission is allowed. `parseValidationProfile` preserves omission and does not
inject a default into the parsed profile.

Direct object inputs to `parseValidationProfile` are closed as JSON-safe data
before schema traversal. Accessors, proxies, cyclic values, sparse arrays,
functions, non-finite numbers, explicit `undefined`, and `__proto__` data
properties are rejected with inert diagnostics rather than being executed or
compiled.

`validateWithProfile` resolves an omitted profile `documentVersion` to the
supplied `EngineDocument.version`. The returned
`DeclarativeValidationResult.profile.documentVersion` records that resolved
version.

If the resolved profile `documentVersion` differs from `document.version`,
validation emits `profile.config.documentVersionMismatch`, returns no rule
results, and does not evaluate rules.

## Profile Shape

The top-level profile shape is:

```ts
interface ValidationProfile {
  syntaxVersion: "markdown-engine.validation@v1";
  documentVersion?: EngineDocumentVersion;
  rules: readonly DeclarativeValidationRule[];
}

interface DeclarativeValidationRule {
  id: string;
  severity?: "error" | "warning" | "info";
  select: DeclarativeSelector;
  assert: DeclarativeAssertion;
}
```

Rule IDs must be non-empty strings and unique within one profile. Duplicate rule
IDs emit `profile.config.invalidShape` because diagnostics, rule results, and
evidence identify output by `ruleId`.

Rule `severity` defaults to `error` when omitted. Unsupported severity values
emit `profile.config.invalidShape`.

Profile values must be JSON-safe data properties after YAML materialization.
Functions, accessors, proxies, cyclic structures, sparse arrays, `undefined`
payloads in required positions, non-finite numbers, and `__proto__` properties
are rejected as invalid shape.

## Selector Contract

Selectors resolve against public `EngineDocument` structure and query helper
semantics. Supported selector targets are:

```ts
type DeclarativeSelector =
  | { target: "document" }
  | { target: "section"; title?: string; depth?: number }
  | { target: "heading"; text?: string; depth?: number }
  | { target: "table"; section?: string; header?: readonly string[] }
  | {
      target: "tableRow";
      section?: string;
      tableHeader?: readonly string[];
      where?: { column: string; equals?: string; includes?: string };
    }
  | {
      target: "tableCell";
      section?: string;
      tableHeader?: readonly string[];
      column: string;
      rowWhere?: { column: string; equals?: string; includes?: string };
    }
  | { target: "textSpan"; section?: string; nodeType?: string; textIncludes?: string }
  | { target: "link"; section?: string; text?: string; url?: string }
  | { target: "list"; section?: string; ordered?: boolean; depth?: number };
```

Unsupported selector targets emit `profile.compile.unsupportedSelector`.

String matching is deterministic literal matching. Heading, section, header,
column, `equals`, and frontmatter field names use exact string equality.
`includes`, `contains`, `excludes`, and `textOccurrenceCount.text` use literal
substring matching. No profile-supplied regular expression is compiled.

Table `header` and `tableHeader` arrays match normalized table header cells as
an exact-title ordered subsequence. Unrelated columns may appear before, between,
or after listed values. Duplicate supplied values require separate matching
header cells.

`tableRow.where` and `tableCell.rowWhere` require a non-empty `column` and at
least one of `equals` or `includes`. When both are present, both tests must
pass. A missing predicate column makes the row fail the predicate; it does not
emit a diagnostic by itself.

## Assertion Contract

Supported assertion members are:

```ts
interface DeclarativeAssertion {
  exists?: true;
  sectionsRequired?: {
    headings: readonly string[];
    order?: "none" | "strict";
  };
  tableColumnsRequired?: {
    columns: readonly string[];
  };
  ids?: {
    prefix?: string;
    unique?: boolean;
    caseSensitive?: boolean;
  };
  references?: {
    idsFrom: { section?: string; column?: string; prefix?: string };
    mustAppearIn: readonly string[];
  };
  text?: {
    contains?: string;
    excludes?: readonly string[];
  };
  textOccurrenceCount?: {
    text: string;
    count: number;
  };
  textLength?: {
    min?: number;
    max?: number;
  };
  frontmatterRequired?: {
    fields: readonly string[];
  };
}
```

Unsupported first-level assertion members parsed from YAML or JSON-safe profile
input emit `profile.compile.unsupportedAssertion`, except regex-like and
executable-like keys, which retain `profile.config.unsupportedKey` precedence.
Direct typed profile objects passed to validation are hardened as closed
JSON-safe data before execution; unsupported assertion properties on that path
emit `profile.config.unsupportedKey`.

Selector/assertion compatibility is part of the public contract:

| Assertion | Compatible selector targets |
| --- | --- |
| `exists` | all supported selector targets |
| `sectionsRequired` | `document` |
| `tableColumnsRequired` | `table` |
| `ids` | all supported selector targets |
| `references` | `document` |
| `text` | all supported selector targets |
| `textOccurrenceCount` | all supported selector targets |
| `textLength` | all supported selector targets |
| `frontmatterRequired` | `document` |

Incompatible supported selector/assertion pairs emit
`profile.compile.incompatibleSelectorAssertion`.

`exists` must be `true`. It passes when the selector resolves at least one
target and fails with `profile.validation.emptySelection` when the selector
resolves zero targets.

`sectionsRequired.order` defaults to `none`. `strict` checks that configured
headings appear as an ordered subsequence in the normalized section tree
flattened in source order.

`ids.unique` must be `true`; `prefix` and `caseSensitive` are modifiers, not
standalone predicates. `caseSensitive` defaults to `true`. ID tokens use the
documented token grammar `[A-Za-z][A-Za-z0-9]*-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*`.

`text` must include `contains` or a non-empty `excludes` array.
`textOccurrenceCount.count` is a finite number and counts non-overlapping
literal occurrences per selected target.
`textLength` must include `min`, `max`, or both. Bounds are non-negative
integers, `min` must be less than or equal to `max` when both are present, and
evaluation uses JavaScript string `.length` for each selected target's
normalized text.

Empty selector results produce `profile.validation.emptySelection` for exists,
table, ID, reference, text, occurrence, and text-length assertions.
Document-scoped required-section and required-frontmatter assertions evaluate
against the document.

## Diagnostics

All declarative validation diagnostics use the public `MarkdownDiagnostic`
shape. Config diagnostics are error severity except
`profile.config.yamlWarning`, which is warning severity. Compile diagnostics are
error severity. Validation diagnostics use the rule severity. Source ranges are
included when a selected target has source evidence; locations are omitted
rather than fabricated when unavailable.

| Code | Severity source | Emitted when |
| --- | --- | --- |
| `profile.config.invalidYaml` | `error` | YAML text cannot be parsed or materialized as JSON-safe profile data. |
| `profile.config.yamlWarning` | `warning` | YAML materialization produces a non-fatal parser warning. |
| `profile.config.unsupportedSyntaxVersion` | `error` | `syntaxVersion` is missing or is not `markdown-engine.validation@v1`. |
| `profile.config.invalidShape` | `error` | Required fields are missing, fields have wrong types, arrays or strings are empty, rule IDs duplicate, scalar values are invalid, table predicates are ineffective, or assertion payloads contain no effective predicate. |
| `profile.config.documentVersionMismatch` | `error` | Resolved profile `documentVersion` differs from the supplied `EngineDocument.version`. |
| `profile.config.unsupportedKey` | `error` | A closed profile, rule, selector, known assertion object, nested object, regex-like key, executable-like key, or direct typed profile object contains unsupported syntax. |
| `profile.compile.unsupportedSelector` | `error` | `select.target` is not a supported v1 target. |
| `profile.compile.unsupportedAssertion` | `error` | Parsed YAML or JSON-safe `assert` input contains an unsupported first-level assertion member that does not have unsupported-key precedence. |
| `profile.compile.incompatibleSelectorAssertion` | `error` | A supported selector target is paired with an incompatible supported assertion. |
| `profile.validation.emptySelection` | Rule severity | A rule cannot evaluate because its selector matches no applicable target. |
| `profile.validation.assertionFailed` | Rule severity | A supported assertion evaluates and fails without a more specific diagnostic code, including missing table columns, exact occurrence-count mismatches, and text-length bound failures. |
| `profile.validation.duplicateId` | Rule severity | An `ids.unique` assertion finds repeated IDs. |
| `profile.validation.frontmatterFieldMissing` | Rule severity | A required frontmatter field is absent. |
| `profile.validation.referenceMissing` | Rule severity | A source ID is absent from a required target section. |
| `profile.validation.sectionMissing` | Rule severity | A required section heading is absent. |
| `profile.validation.sectionOrder` | Rule severity | A strict required-section order cannot be satisfied. |
| `profile.validation.textExcluded` | Rule severity | A selected target contains forbidden literal text. |
| `profile.validation.textMissing` | Rule severity | A selected target lacks required literal text from a `text.contains` assertion. |
| `profile.validation.assertionUnsupported` | `error` | A compiled assertion has no evaluator implementation; this is an internal safety diagnostic. |

## Result Shape

`DeclarativeValidationResult` extends the public validation result shape:

```ts
interface DeclarativeValidationResult extends ValidationResult {
  valid: boolean;
  diagnostics: readonly MarkdownDiagnostic[];
  ruleResults: readonly ValidationRuleResult[];
  profile: {
    syntaxVersion: "markdown-engine.validation@v1";
    documentVersion: EngineDocumentVersion;
    ruleCount: number;
  };
  evidence?: DeclarativeValidationEvidence;
}
```

`valid` is `false` when any error-severity diagnostic exists. Warning and info
validation diagnostics can make a rule result fail without making the aggregate
result invalid.

Rule results are sorted deterministically. Each rule result includes the public
`ruleId`, `passed`, and cloned diagnostics. Results do not expose compiled rule
plans or selector internals.

## Evidence Fields

Evidence is emitted only when `DeclarativeValidationOptions.includeEvidence` is
`true`:

```ts
interface DeclarativeValidationEvidence {
  inputHash: string;
  profileHash: string;
  engineVersion: string;
  runtimeVersion: string;
  ruleResults: readonly ValidationRuleResult[];
  diagnostics: readonly MarkdownDiagnostic[];
}
```

`inputHash` is a lowercase hexadecimal SHA-256 digest of the stable JSON
serialization of the supplied normalized `EngineDocument` after omitting only
the top-level `document.path` field. Structural target paths remain part of the
canonical input.

`profileHash` is a lowercase hexadecimal SHA-256 digest of the stable JSON
serialization of the resolved `ValidationProfile` after applying the resolved
`documentVersion` and default rule severity of `error`. An omitted
`documentVersion` and an explicit matching `documentVersion` therefore produce
the same profile hash for the same document version and rules.

`engineVersion` records the package version that produced the evidence. In the
2.0 release line this is `"2.0.0"` even though `documentVersion` remains
`"1.0.0"`.

Raw Markdown bytes, raw YAML bytes, YAML comments, caller file paths, and
`includeEvidence` itself are not part of either evidence hash.

## CLI Behavior

The declarative validation CLI command is:

```sh
markdown-engine validate --file <markdown-file> --profile <profile-file> [--format json]
```

`--format json` is the default and only supported validation output format.
The command always normalizes Markdown with `documentVersion: "1.0.0"` and does
not accept `--document-version`.

The CLI reads and checks the profile before reading the Markdown file. Profile
parse, config, and compile failures emit profile-stage JSON and do not parse or
validate the Markdown file.

After profile compilation succeeds, the CLI emits a validation-result JSON
shape whether the document passes or fails. Validation CLI results include
evidence.

## CLI JSON Union

The CLI JSON output is:

```ts
type DeclarativeValidationCliJsonResult =
  | DeclarativeValidationResult
  | DeclarativeValidationConfigErrorResult;

interface DeclarativeValidationConfigErrorResult {
  valid: false;
  stage: "profile";
  diagnostics: readonly MarkdownDiagnostic[];
  ruleResults: readonly [];
  profile?: undefined;
  evidence?: undefined;
}
```

Profile-stage JSON is used for invalid YAML, invalid profile shape,
unsupported syntax version, unsupported keys, unsupported selector targets,
unsupported assertion members, and incompatible selector/assertion pairs. It
contains no `profile` and no `evidence`.

Validation-result JSON is used after profile compilation succeeds. It contains
`profile`, `ruleResults`, `diagnostics`, `valid`, and `evidence`.

## Exit Codes

| Exit code | Meaning |
| --- | --- |
| `0` | Validation completed with no error-severity diagnostics. |
| `1` | Profile/config/compile, Markdown normalization, document-version mismatch, or validation diagnostics include at least one error. |
| `2` | CLI usage, unsupported format, unknown argument, missing argument value, repeated singleton flag, unsupported `--document-version`, or local file read error. |

## Compatibility And Migration

The v1 declarative validation syntax is a durable authoring contract for the
2.0 package release line. Changes to profile syntax names, selector names,
assertion names, result fields, diagnostic codes, CLI flags, CLI JSON shape, or
evidence hash inputs require explicit compatibility review.

Migration notes:

- Consumers using fixed `validate(document, config)` rule families can continue
  using that API. Declarative validation is additive and does not replace fixed
  rule validation.
- Consumers that need reusable structural policies should move profile-owned
  checks into `parseValidationProfile` and `validateWithProfile`.
- Consumers parsing CLI validation output must handle the
  `DeclarativeValidationCliJsonResult` union. Profile-stage failures do not
  include `profile` or `evidence`.
- Consumers that compare evidence hashes must normalize expectations around
  resolved `documentVersion`, default rule severity, stable key order, and
  exclusion of only top-level `document.path` from `inputHash`.
- Regex-like matching, JavaScript predicates, plugins, semantic scoring, and
  profile-specific rules belong outside this package unless a future contract
  explicitly expands the engine boundary.

## Examples

Minimal profile:

```yaml
syntaxVersion: markdown-engine.validation@v1
rules:
  - id: sections.present
    select:
      target: document
    assert:
      sectionsRequired:
        headings:
          - Mission Brief
```

Link existence profile:

```yaml
syntaxVersion: markdown-engine.validation@v1
rules:
  - id: rollback-link.exists
    select:
      target: link
      section: Escalation
      text: rollback guide
      url: ./rollback-guide.md
    assert:
      exists: true
```

Table cell text profile:

```yaml
syntaxVersion: markdown-engine.validation@v1
documentVersion: 1.0.0
rules:
  - id: requirement-text
    severity: error
    select:
      target: tableCell
      section: Requirements
      tableHeader:
        - ID
        - Requirement statement
      column: Requirement statement
    assert:
      text:
        contains: shall
        excludes:
          - and/or
      textOccurrenceCount:
        text: shall
        count: 1
```

CLI invocation:

```sh
markdown-engine validate --file docs/mission.md --profile validation-profile.yaml
```

Reader-facing operational spec, release checklist, and requirements
traceability examples live under
`fixtures/declarative-validation/examples/**`. After building from the
repository root, run one passing and one intentionally failing example with:

```sh
node dist/cli/index.js validate --file fixtures/declarative-validation/examples/operational-spec/pass.md --profile fixtures/declarative-validation/examples/operational-spec/profile.yaml
node dist/cli/index.js validate --file fixtures/declarative-validation/examples/operational-spec/fail.md --profile fixtures/declarative-validation/examples/operational-spec/profile.yaml
```

The passing command exits `0`; the intentionally failing command exits `1` and
emits validation JSON with representative diagnostics and evidence.

## Boundary And Non-Goals

Declarative validation remains inside the `markdown-engine` deterministic local
boundary: parse, normalize, validate, diagnose, serialize, and emit evidence.

The v1 contract explicitly excludes:

- arbitrary JavaScript
- expression evaluation
- user-supplied regular expression compilation
- profile-sourced regex compilation
- plugins and plugin loading
- network calls
- LLM calls
- file watching
- persistence
- profile-specific core semantics
- operational-design-spec, AGENTS.md, TASK.md, or other domain-specific rule
  meaning in core engine code

The CLI reads only the caller-specified local Markdown and profile files. The
API owns no file traversal, daemon, database, browser runtime, network service,
agent adapter, MCP transport, runtime lens, or persistent cache.

## Contract Review Gates

The BEL-985 contract gates are:

```sh
npm run docs:declarative-validation-contract
npm run audit:declarative-validation-boundary
```

The documentation gate checks this contract, README links, evidence files, and
package script wiring. The boundary audit checks dependency drift, source-level
runtime boundary patterns, unsupported regex-like and executable profile-key
coverage, and declarative validation boundary evidence.
