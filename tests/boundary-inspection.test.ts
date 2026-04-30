import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("..", import.meta.url));

describe("WP-5 boundary inspection", () => {
  it("VAL-8/EVD-8 reports no forbidden source or dependency drift", () => {
    const output = execFileSync(
      process.execPath,
      ["scripts/check-boundaries.mjs"],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    expect(output).toContain("Boundary inspection PASS");
  });
});
