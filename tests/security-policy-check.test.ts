import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { securityPolicyFailures } from "../scripts/security-policy-check.mjs";

const packageFile = "package.json";
const securityFile = "SECURITY.md";
const packageJson = readFileSync(
  new URL("../package.json", import.meta.url),
  "utf8",
);
const packageMajor = packageMajorFrom(packageJson);
const securityMarkdown = readFileSync(
  new URL("../SECURITY.md", import.meta.url),
  "utf8",
);

describe("security policy version gate", () => {
  it("binds the supported security line to the package major", () => {
    expect(checkSecurityPolicy()).toEqual([]);
  });

  it("rejects stale supported-major metadata", () => {
    const staleMajor = packageMajor === 0 ? 1 : packageMajor - 1;
    const stalePolicy = securityMarkdown.replace(
      `latest \`${packageMajor}.x\` package`,
      `latest \`${staleMajor}.x\` package`,
    );

    expect(checkSecurityPolicy(stalePolicy)).toContain(
      `SECURITY.md: latest supported major ${staleMajor}.x does not match package major ${packageMajor}.x`,
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

function packageMajorFrom(manifestJson: string) {
  const version = String(JSON.parse(manifestJson).version ?? "");
  const major = Number.parseInt(version, 10);

  if (!Number.isFinite(major)) {
    throw new Error("package.json must contain a numeric major version");
  }

  return major;
}
