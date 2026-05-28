# Declarative Validation Contract

Status: package 2.0.0, v1 profile syntax with v2 profile admission, document contract 1.0.0
Last updated: 2026-05-24
Current v2 surface: flat-rule result/evidence shell, ID count-bound schema and
runtime evaluator contract, plus `tableColumnCoverage` schema, compiled-plan,
and runtime evaluator contract, grouped rule runtime contract, and rule-level
`when` schema, matcher, public skipped-rule result, skipped counts, and evidence
cloning contract.

This document defines the public declarative validation contract for
`@jasonbelmonti/markdown-engine`. The stable surface is the package-root API,
the v1 profile syntax, the admitted v2 profile syntax and runtime subset, the
CLI validation command, diagnostic codes, serialized result shapes, and evidence
fields. Internal parser output, compiled rule-plan records, selector target
records, and evaluator implementation modules are not public contracts.

Package 2.0 does not introduce `documentVersion: "2.0.0"` or CLI JSON
discrimination.
Declarative validation continues to use the existing `documentVersion: "1.0.0"`
rich IR document contract, while the profile admission path recognizes
`markdown-engine.validation@v2` for the same flat rule shape with `id`, optional
`severity`, `select`, and `assert`; non-recursive `anyOf` and `allOf`; and
optional rule-level `when`. The admitted v2 path exposes the result and evidence
shell needed to distinguish assertion, grouped, and skipped evaluation output
from v1 output, plus the ID count-bound schema, compiled-plan, and runtime
evaluator contract; the `tableColumnCoverage` schema, compiled-plan, and
runtime evaluator contract; and the `when` schema plus private compiled-plan and
matcher contract. Matched applicability continues into normal rule evaluation.
Non-matching applicability returns a public skipped rule result with
`status: "skipped"`, `passed: true`, `evaluation.kind: "skipped"`,
`reason: "whenNotMatched"`, `skippedRuleCount`, no top-level diagnostics, and a
nested `when` applicability result.

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

The v2 syntax is admitted as an additive profile syntax:

```yaml
syntaxVersion: markdown-engine.validation@v2
```

This release recognizes v2 as a distinct syntax version at profile admission,
admits ID count bounds at the schema, compiled-plan, and runtime evaluator
layers, admits `tableColumnCoverage` at the schema, internal compiled-plan, and
runtime evaluator layers, admits non-recursive grouped rules at the schema,
compiled-plan, and runtime evaluator layers, and admits optional rule-level
`when` at the schema, internal compiled-plan, and matcher layers. Matching
`when` rules continue through normal flat or grouped evaluation and do not add a
public `when` field to the evaluated rule result. Non-matching `when` rules are
not evaluated; they return the public skipped-rule result shape, increment
`skippedRuleCount`, and leave `evaluatedRuleCount` unchanged.

The admitted v1/v2 flat vocabulary is closed. Unknown profile keys, rule keys,
selector keys, known assertion keys, and nested assertion keys emit
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
type ValidationProfileSyntaxVersion =
  | "markdown-engine.validation@v1"
  | "markdown-engine.validation@v2";

interface ValidationProfile {
  syntaxVersion: ValidationProfileSyntaxVersion;
  documentVersion?: EngineDocumentVersion;
  rules: readonly DeclarativeValidationRule[];
}

type DeclarativeValidationRule =
  | DeclarativeValidationFlatRule
  | DeclarativeValidationGroupRule;

interface DeclarativeValidationRuleFields {
  id: string;
  severity?: "error" | "warning" | "info";
  when?: DeclarativeValidationApplicability;
}

interface DeclarativeValidationFlatRule extends DeclarativeValidationRuleFields {
  select: DeclarativeSelector;
  assert: DeclarativeAssertion;
}

interface DeclarativeValidationApplicability {
  select: DeclarativeSelector;
  assert: DeclarativeAssertion;
}

type DeclarativeValidationGroupRule =
  | DeclarativeValidationAnyOfRule
  | DeclarativeValidationAllOfRule;

interface DeclarativeValidationAnyOfRule
  extends DeclarativeValidationRuleFields {
  anyOf: readonly DeclarativeValidationBranch[];
}

interface DeclarativeValidationAllOfRule
  extends DeclarativeValidationRuleFields {
  allOf: readonly DeclarativeValidationBranch[];
}

interface DeclarativeValidationBranch {
  label?: string;
  select: DeclarativeSelector;
  assert: DeclarativeAssertion;
}
```

Rule IDs must be non-empty strings and unique within one profile. Duplicate rule
IDs emit `profile.config.invalidShape` because diagnostics, rule results, and
evidence identify output by `ruleId`.

Rule `severity` defaults to `error` when omitted. Unsupported severity values
emit `profile.config.invalidShape`.

Rule-level `when` is allowed only on v2 rules. Branch-level `when` remains
unsupported. V1 profiles preserve the original flat rule authoring contract;
grouped `anyOf` / `allOf`, ID count bounds, `tableColumnCoverage`, and
rule-level `when` are v2 additions.

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
    minCount?: number;
    maxCount?: number;
  };
  references?: {
    idsFrom: { section?: string; column?: string; prefix?: string };
    mustAppearIn: readonly string[];
  };
  tableColumnCoverage?: {
    source: {
      section: string;
      column: string;
      prefix?: string;
      caseSensitive?: boolean;
    };
    target: {
      section: string;
      tableHeader?: readonly string[];
      column: string;
    };
    require: "everySourceId";
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
| `tableColumnCoverage` | `document` |
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

For v1 profiles, `ids.unique` must be `true`. For v2 profiles, `ids.unique`
must be `true` when provided and may be omitted when `ids.minCount` or
`ids.maxCount` provides the predicate. `prefix` and `caseSensitive` are modifiers,
not standalone predicates. `caseSensitive` defaults to `true`. ID tokens use the
documented token grammar `[A-Za-z][A-Za-z0-9]*-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*`.
For v2 profiles, `ids.minCount` and `ids.maxCount` are admitted as non-negative
integer schema and compiled-plan fields. When both are present, `minCount` must
be less than or equal to `maxCount`. Runtime count evaluation uses unique
comparison values after prefix filtering and duplicate occurrence de-duplication.
Failed lower and upper bounds emit `profile.validation.idCountTooLow` and
`profile.validation.idCountTooHigh`.

For v2 profiles, `tableColumnCoverage` is admitted as a flat-rule schema and
internal compiled-plan assertion. It is compatible only with a `document`
selector because the assertion owns its source and target table-column inputs.
`source.section`, `source.column`, `target.section`, and `target.column` are
required non-empty strings. `source.prefix` is optional and must be non-empty
when provided. `source.caseSensitive` is optional and defaults to `true` in the
compiled plan. `target.tableHeader` is an optional non-empty string array.
`require` must be exactly `"everySourceId"`. Runtime evaluation extracts unique
source IDs from `source.section` and `source.column`, applies `source.prefix`
and `source.caseSensitive`, and requires every source ID comparison value to
appear in the configured target table column. IDs appearing elsewhere in the
target section do not satisfy coverage. Missing target sections, missing target
columns, and missing target-column IDs emit deterministic validation diagnostics
source-grounded to the source ID when source evidence is available.

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

Rule-level `when` uses the existing validation diagnostic codes. When
applicability does not match, those diagnostics are cloned into
`ruleResults[].when.diagnostics`; they are not promoted into top-level
`diagnostics`, so a skipped rule with a nested error-severity applicability
diagnostic can still leave the aggregate `valid` value `true`.

| Code | Severity source | Emitted when |
| --- | --- | --- |
| `profile.config.invalidYaml` | `error` | YAML text cannot be parsed or materialized as JSON-safe profile data. |
| `profile.config.yamlWarning` | `warning` | YAML materialization produces a non-fatal parser warning. |
| `profile.config.unsupportedSyntaxVersion` | `error` | `syntaxVersion` is missing or is not `markdown-engine.validation@v1` or `markdown-engine.validation@v2`. |
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
| `profile.validation.idCountTooHigh` | Rule severity | Unique ID count after filtering is higher than `ids.maxCount`. |
| `profile.validation.idCountTooLow` | Rule severity | Unique ID count after filtering is lower than `ids.minCount`. |
| `profile.validation.referenceMissing` | Rule severity | A source ID is absent from a required target section. |
| `profile.validation.sectionMissing` | Rule severity | A required section heading is absent. |
| `profile.validation.sectionOrder` | Rule severity | A strict required-section order cannot be satisfied. |
| `profile.validation.tableColumnCoverageIdMissing` | Rule severity | A source ID is absent from the configured target table column. |
| `profile.validation.tableColumnCoverageTargetColumnMissing` | Rule severity | The configured target table column cannot be resolved. |
| `profile.validation.tableColumnCoverageTargetSectionMissing` | Rule severity | The configured target section cannot be resolved. |
| `profile.validation.textExcluded` | Rule severity | A selected target contains forbidden literal text. |
| `profile.validation.textMissing` | Rule severity | A selected target lacks required literal text from a `text.contains` assertion. |
| `profile.validation.assertionUnsupported` | `error` | A compiled assertion or compiled assertion feature has no evaluator implementation; this is an internal safety diagnostic. |

## Result Shape

`DeclarativeValidationResult` extends the public validation result shape:

```ts
interface DeclarativeValidationResult extends ValidationResult {
  valid: boolean;
  diagnostics: readonly MarkdownDiagnostic[];
  ruleResults: readonly (
    | ValidationRuleResult
    | DeclarativeValidationRuleResultV2
  )[];
  profile: {
    syntaxVersion: ValidationProfileSyntaxVersion;
    documentVersion: EngineDocumentVersion;
    ruleCount: number;
  };
  evidence?: DeclarativeValidationEvidence;
}
```

For admitted v2 profiles, result metadata records
`syntaxVersion: "markdown-engine.validation@v2"`, `evaluatedRuleCount`, and
`skippedRuleCount`. V2 rule results include the v1-compatible `ruleId`,
`passed`, and `diagnostics` fields plus `status`, optional skipped
applicability metadata, and flat, grouped, or skipped evaluation metadata:

```ts
interface DeclarativeValidationRuleResultV2 extends ValidationRuleResult {
  status: "passed" | "failed" | "skipped";
  when?: DeclarativeValidationApplicabilityResult;
  evaluation:
    | { kind: "assertions"; diagnostics: readonly MarkdownDiagnostic[] }
    | {
        kind: "anyOf";
        selectedBranch?: DeclarativeValidationBranchReference;
        branches: readonly DeclarativeValidationBranchResult[];
      }
    | {
        kind: "allOf";
        branches: readonly DeclarativeValidationBranchResult[];
      }
    | { kind: "skipped"; reason: "whenNotMatched" };
}

interface DeclarativeValidationApplicabilityResult {
  status: "matched" | "notMatched";
  diagnostics: readonly MarkdownDiagnostic[];
}

interface DeclarativeValidationBranchReference {
  branchIndex: number;
  label?: string;
}

interface DeclarativeValidationBranchResult
  extends DeclarativeValidationBranchReference {
  status: "passed" | "failed";
  diagnostics: readonly MarkdownDiagnostic[];
}
```

For configured `when`, matched applicability continues into normal flat or
grouped evaluation and contributes one evaluated rule. The evaluated rule result
does not serialize a `when` field. Non-matching applicability returns one
skipped rule result with `status: "skipped"`, `passed: true`, empty top-level
rule `diagnostics`, `when.status: "notMatched"`, nested applicability
diagnostics, `evaluation.kind: "skipped"`, and `reason: "whenNotMatched"`.
Skipped rules increment `skippedRuleCount`, do not increment
`evaluatedRuleCount`, and do not evaluate flat assertions or grouped branches.

`valid` is `false` when any top-level error-severity diagnostic exists in
`diagnostics`. Nested skipped applicability diagnostics under
`ruleResults[].when.diagnostics` do not by themselves make the aggregate result
invalid. Warning and info validation diagnostics can make a rule result fail
without making the aggregate result invalid.

Rule results are sorted deterministically. Each rule result includes the public
`ruleId`, `passed`, and cloned diagnostics. Results do not expose compiled rule
plans or selector internals.

## Evidence Fields

Evidence is emitted only when `DeclarativeValidationOptions.includeEvidence` is
`true`:

```ts
interface DeclarativeValidationEvidence<
  RuleResult extends ValidationRuleResult = ValidationRuleResult,
> {
  inputHash: string;
  profileHash: string;
  engineVersion: string;
  runtimeVersion: string;
  ruleResults: readonly RuleResult[];
  diagnostics: readonly MarkdownDiagnostic[];
}
```

For v1 profiles, `ruleResults` contains the unchanged v1 rule-result shape. For
admitted v2 profiles, `ruleResults` clones the public v2 rule-result shape,
including `status`, flat assertion evaluation, and grouped `anyOf` / `allOf`
branch evaluation. Skipped v2 rule results are cloned through evidence in the
same `ruleResults` array, and `evidence.diagnostics` clones the top-level
diagnostics array. Evidence does not serialize compiled rule plans, selector
target records, assertion-specific ID count evidence, or assertion-specific
table-column coverage evidence.

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
evidence. V2 CLI results use the same validation-result arm of the CLI JSON
union; there is no extra CLI discriminator beyond
`profile.syntaxVersion: "markdown-engine.validation@v2"`.

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
`profile`, `ruleResults`, `diagnostics`, `valid`, and `evidence`. For v2
profiles, that same validation-result JSON can include `evaluatedRuleCount`,
`skippedRuleCount`, `status: "skipped"`, nested `when` diagnostics, and
`evaluation.kind: "skipped"`.

## Exit Codes

| Exit code | Meaning |
| --- | --- |
| `0` | Validation completed with no top-level error-severity diagnostics. |
| `1` | Profile/config/compile, Markdown normalization, document-version mismatch, or top-level validation diagnostics include at least one error. |
| `2` | CLI usage, unsupported format, unknown argument, missing argument value, repeated singleton flag, unsupported `--document-version`, or local file read error. |

## Compatibility And Migration

The v1 declarative validation syntax is a durable authoring contract for the
2.0 package release line. Changes to profile syntax names, selector names,
assertion names, result fields, diagnostic codes, CLI flags, CLI JSON shape, or
evidence hash inputs require explicit compatibility review.

V1 preservation is explicit: v1 authoring syntax, v1 rule result shape, v1
diagnostic inventory, v1 CLI JSON behavior, and v1 evidence hash inputs remain
unchanged by the admitted v2 syntax.

Compatibility examples:

```yaml
# v1 compatibility profile: remains on the v1 authoring and result contract.
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

```yaml
# v2 opt-in profile: selects Conditional V2 behavior explicitly.
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

The v1 profile above continues to emit the v1 validation-result shape. The v2
profile above emits syntax-versioned v2 result metadata with
`evaluatedRuleCount` and `skippedRuleCount`; v2 rule results include `status`
and `evaluation`. The CLI does not add a second discriminator for v2; consumers
branch on
`profile.syntaxVersion: "markdown-engine.validation@v2"`.

Migration notes:

- Consumers using fixed `validate(document, config)` rule families can continue
  using that API. Declarative validation is additive and does not replace fixed
  rule validation.
- Consumers that need reusable structural policies should move profile-owned
  checks into `parseValidationProfile` and `validateWithProfile`.
- Consumers parsing CLI validation output must handle the
  `DeclarativeValidationCliJsonResult` union. Profile-stage failures do not
  include `profile` or `evidence`.
- Consumers opting into `markdown-engine.validation@v2` must handle rule
  `status` values of `"passed"`, `"failed"`, and `"skipped"`, plus
  `evaluatedRuleCount`, `skippedRuleCount`, grouped branch results, and nested
  skipped-rule `when` diagnostics. Aggregate validity is still determined from
  top-level diagnostics.
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

Conditional v2 grouped rule with applicability:

```yaml
syntaxVersion: markdown-engine.validation@v2
rules:
  - id: release.when.docs-ready
    when:
      select:
        target: section
        title: Release
      assert:
        exists: true
    anyOf:
      - label: contract-link
        select:
          target: link
          section: Release
          text: contract
        assert:
          exists: true
      - label: contract-heading
        select:
          target: heading
          text: Contract
        assert:
          exists: true
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

The admitted v2 Conditional V2 surface also excludes `documentVersion: "2.0.0"`,
recursive grouped rules, branch-level `when`, profile-defined predicates,
assertion-specific evidence payloads, a separate skipped-rule evidence channel,
and a new CLI JSON discriminator.

The CLI reads only the caller-specified local Markdown and profile files. The
API owns no file traversal, daemon, database, browser runtime, network service,
agent adapter, MCP transport, runtime lens, or persistent cache.

## Contract Review Gates

The BEL-985 contract gates are:

```sh
npm run docs:declarative-validation-contract
npm run audit:declarative-validation-boundary
```

The documentation gate checks this contract, README links, legacy contract and
boundary evidence files, Conditional V2 EVD-6 reviewer notes, and package script
wiring. The boundary audit checks dependency drift, source-level runtime
boundary patterns, unsupported regex-like and executable profile-key coverage,
and declarative validation boundary evidence.
