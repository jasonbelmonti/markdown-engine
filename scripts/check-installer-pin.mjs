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

  const documentedVersions = packageVersionReferences(installDocs);
  if (
    documentedVersions.length !== 1 ||
    documentedVersions[0] !== packageVersion
  ) {
    failures.push(
      `README bundled CLI install section must contain exactly one package version reference to ${packageVersion}; found ${formatValues(documentedVersions)}`,
    );
  }

  const documentedHashes = sha256References(installDocs);
  if (documentedHashes.length !== 1 || documentedHashes[0] !== artifactHash) {
    failures.push(
      `README bundled CLI install section must contain exactly one SHA-256 reference to ${artifactHash}; found ${formatValues(documentedHashes)}`,
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
  const assignmentStart = new RegExp(`^\\s*(?:export\\s+)?${name}\\s*=`);
  const assignmentLines = source
    .split(/\r?\n/)
    .filter((line) => assignmentStart.test(line));

  if (assignmentLines.length !== 1) {
    throw new Error(
      `installer ${name} assignment must appear exactly once; found ${assignmentLines.length}`,
    );
  }

  const match = assignmentLines[0].match(new RegExp(`^${name}="([^"]+)"$`));

  if (match === null) {
    throw new Error(`installer ${name} assignment is invalid`);
  }

  return match[1];
}

function packageVersionReferences(source) {
  return [
    ...source.matchAll(
      /@jasonbelmonti\/markdown-engine@([0-9A-Za-z][0-9A-Za-z.+-]*)/g,
    ),
  ].map((match) => match[1]);
}

function sha256References(source) {
  return source.match(/\b[a-f0-9]{64}\b/g) ?? [];
}

function formatValues(values) {
  return values.length === 0 ? "none" : values.join(", ");
}

function readmeSection(source, heading) {
  const sectionStart = source.indexOf(`### ${heading}`);

  if (sectionStart === -1) {
    throw new Error(`README section is missing: ${heading}`);
  }

  const nextSection = source.indexOf("\n### ", sectionStart + heading.length + 4);
  return source.slice(sectionStart, nextSection === -1 ? undefined : nextSection);
}
