# Repair Brief Contract

`--repair-brief` emits a compact diagnostic summary on stderr and preserves the
validator JSON result on stdout.

Each diagnostic entry is derived from validator JSON only:

- `ruleId`: the failing profile rule when present, otherwise `(none)`.
- `message`: the validator diagnostic message.
- `sourceRange`: the validator diagnostic range when present, otherwise
  `unavailable`.

The wrapper must not invent validation outcomes, synthesize missing diagnostics,
or edit local profile assets.
