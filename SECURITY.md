# Security Policy

## Supported Versions

Security fixes target the latest published major version of
`@jasonbelmonti/markdown-engine`. As of the 4.0 release line, fixes are expected
to land on the latest `4.x` package unless a release note states otherwise.
Older `0.x`, `1.x`, `2.x`, and `3.x` lines are not maintained unless an explicit
backport is announced.

## Reporting A Vulnerability

Report suspected vulnerabilities privately by emailing
jasonbelmonti@gmail.com. Include:

- affected package version
- reproduction steps or input Markdown/config
- expected and observed behavior
- any known impact or workaround

Do not publish exploit details publicly until a fix or mitigation plan is
available.

## Scope

This package parses Markdown and YAML frontmatter, normalizes engine-owned IR,
evaluates deterministic validation rules, and serializes public result objects.

It does not execute raw HTML, fetch network resources, call LLM providers,
run plugins, start services, or evaluate semantic rules. The CLI writes full
validation reports to its private local cache by default, or to an explicit
`--report-file` destination; `--output full` avoids automatic report writes.
