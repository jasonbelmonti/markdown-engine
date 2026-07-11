import { posix, win32 } from "node:path";

import { describe, expect, it } from "vitest";

import { isPathWithinDirectoryWith } from "../skills/profile-backed-markdown/scripts/profile-path-confinement.mjs";

describe("profile path confinement", () => {
  it("accepts only the root and descendants with POSIX paths", () => {
    const root = "/workspace/profiles";

    expect(isPathWithinDirectoryWith(posix, root, root)).toBe(true);
    expect(
      isPathWithinDirectoryWith(posix, root, "/workspace/profiles/local.yaml"),
    ).toBe(true);
    expect(
      isPathWithinDirectoryWith(posix, root, "/workspace/profiles/..profile.yaml"),
    ).toBe(true);
    expect(
      isPathWithinDirectoryWith(posix, root, "/workspace/outside.yaml"),
    ).toBe(false);
    expect(
      isPathWithinDirectoryWith(
        posix,
        root,
        "/workspace/profiles-other/outside.yaml",
      ),
    ).toBe(false);
  });

  it("rejects Windows targets on another drive or UNC share", () => {
    const driveRoot = String.raw`C:\workspace\profiles`;
    const shareRoot = String.raw`\\server-a\share\profiles`;

    expect(
      isPathWithinDirectoryWith(
        win32,
        driveRoot,
        String.raw`C:\workspace\profiles\local.yaml`,
      ),
    ).toBe(true);
    expect(
      isPathWithinDirectoryWith(
        win32,
        driveRoot,
        String.raw`D:\outside\external.yaml`,
      ),
    ).toBe(false);
    expect(
      isPathWithinDirectoryWith(
        win32,
        shareRoot,
        String.raw`\\server-a\share\profiles\local.yaml`,
      ),
    ).toBe(true);
    expect(
      isPathWithinDirectoryWith(
        win32,
        shareRoot,
        String.raw`\\server-b\share\external.yaml`,
      ),
    ).toBe(false);
  });
});
