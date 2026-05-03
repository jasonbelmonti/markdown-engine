---
title: Rich IR proving fixture
status: draft
owner: markdown-engine
---

# Mission Brief

Use [markdown-engine](https://example.com/markdown-engine) to prove the structural path.

## Execution Target

Track one table, one nested task list, one source span, one raw HTML block, and one code fence.

| Field | Value |
| --- | --- |
| signal | go |

- [x] Parse the parent task
  - [ ] Preserve the nested task target

```ts
export const signal = "go";
```

<div data-engine="inert">Raw HTML data</div>
