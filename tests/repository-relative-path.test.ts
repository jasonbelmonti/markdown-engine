import { posix, win32 } from "node:path";

import { describe, expect, it } from "vitest";

import { repositoryRelativePathWith } from "../scripts/repository-relative-path.mjs";

describe("repository-relative path normalization", () => {
  it("returns slash-delimited paths for POSIX repository files", () => {
    expect(
      repositoryRelativePathWith(
        posix,
        "/workspace/markdown-engine",
        "/workspace/markdown-engine/src/frontmatter/yaml.ts",
      ),
    ).toBe("src/frontmatter/yaml.ts");
  });

  it("returns slash-delimited paths for Windows repository files", () => {
    expect(
      repositoryRelativePathWith(
        win32,
        String.raw`C:\workspace\markdown-engine`,
        String.raw`C:\workspace\markdown-engine\src\frontmatter\yaml.ts`,
      ),
    ).toBe("src/frontmatter/yaml.ts");
  });

  it("does not represent files outside the repository as repository-relative", () => {
    expect(
      repositoryRelativePathWith(
        posix,
        "/workspace/markdown-engine",
        "/workspace/outside.ts",
      ),
    ).toBe("/workspace/outside.ts");
    expect(
      repositoryRelativePathWith(
        win32,
        String.raw`C:\workspace\markdown-engine`,
        String.raw`D:\outside.ts`,
      ),
    ).toBe(String.raw`D:\outside.ts`);
  });
});
