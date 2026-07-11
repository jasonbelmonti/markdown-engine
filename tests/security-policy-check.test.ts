import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { securityPolicyFailures } from "../scripts/security-policy-check.mjs";

const packageFile = "package.json";
const securityFile = "SECURITY.md";
const packageJson = readFileSync(
  new URL("../package.json", import.meta.url),
  "utf8",
);
const securityMarkdown = readFileSync(
  new URL("../SECURITY.md", import.meta.url),
  "utf8",
);

describe("security policy version gate", () => {
  it("binds the supported security line to the package major", () => {
    expect(checkSecurityPolicy()).toEqual([]);
  });

  it("rejects stale supported-major metadata", () => {
    const stalePolicy = securityMarkdown.replace(
      "latest `3.x` package",
      "latest `2.x` package",
    );

    expect(checkSecurityPolicy(stalePolicy)).toContain(
      "SECURITY.md: latest supported major 2.x does not match package major 3.x",
    );
  });
});

function checkSecurityPolicy(markdown = securityMarkdown) {
  return securityPolicyFailures({
    packageFile,
    packageJson,
    securityFile,
    securityMarkdown: markdown,
  });
}
