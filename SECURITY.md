# Security Policy

## Supported Versions

`@jasonbelmonti/markdown-engine` is pre-1.0 software. Security fixes are
expected to target the latest published minor version unless a release note
states otherwise.

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
run plugins, start services, persist data, or evaluate semantic rules.
