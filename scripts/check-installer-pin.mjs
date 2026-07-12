#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = requestedRepoRoot(process.argv.slice(2)) ?? defaultRepoRoot;

try {
  const packageManifest = await readJson(join(repoRoot, "package.json"));
  const packageVersion = requiredString(
    packageManifest.version,
    "package.json version",
  );
  const installerText = await readFile(
    join(repoRoot, "scripts", "install-markdown-engine-cli.sh"),
    "utf8",
  );
  const readmeText = await readFile(join(repoRoot, "README.md"), "utf8");
  const artifact = await readFile(
    join(repoRoot, "dist-bundled", "markdown-engine-cli.mjs"),
  );
  const artifactHash = createHash("sha256").update(artifact).digest("hex");
  const installerVersion = shellAssignment(installerText, "VERSION");
  const installerHash = shellAssignment(installerText, "EXPECTED_SHA256");
  const installDocs = readmeSection(readmeText, "Bundled CLI install");
  const failures = [];

  if (installerVersion !== packageVersion) {
    failures.push(
      `installer VERSION is ${installerVersion}; expected package version ${packageVersion}`,
    );
  }

  if (installerHash !== artifactHash) {
    failures.push(
      `installer EXPECTED_SHA256 is ${installerHash}; expected built artifact hash ${artifactHash}`,
    );
  }

  if (!installDocs.includes(`@jasonbelmonti/markdown-engine@${packageVersion}`)) {
    failures.push(
      `README bundled CLI install section does not reference package version ${packageVersion}`,
    );
  }

  if (!installDocs.includes(artifactHash)) {
    failures.push(
      `README bundled CLI install section does not contain built artifact hash ${artifactHash}`,
    );
  }

  if (failures.length > 0) {
    console.error("Installer pin release gate FAIL");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log("Installer pin release gate PASS");
  console.log(`Version: ${packageVersion}`);
  console.log(`SHA-256: ${artifactHash}`);
} catch (error) {
  console.error("Installer pin release gate FAIL");
  console.error(`- ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

function requestedRepoRoot(args) {
  if (args.length === 0) {
    return undefined;
  }

  if (args.length !== 2 || args[0] !== "--repo-root" || args[1] === "") {
    console.error("Usage: check-installer-pin [--repo-root <path>]");
    process.exit(2);
  }

  return resolve(args[1]);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function requiredString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }

  return value;
}

function shellAssignment(source, name) {
  const match = source.match(new RegExp(`^${name}="([^"]+)"$`, "m"));

  if (match === null) {
    throw new Error(`installer ${name} assignment is missing or invalid`);
  }

  return match[1];
}

function readmeSection(source, heading) {
  const sectionStart = source.indexOf(`### ${heading}`);

  if (sectionStart === -1) {
    throw new Error(`README section is missing: ${heading}`);
  }

  const nextSection = source.indexOf("\n### ", sectionStart + heading.length + 4);
  return source.slice(sectionStart, nextSection === -1 ? undefined : nextSection);
}
