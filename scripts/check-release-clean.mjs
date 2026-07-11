#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultRepoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = requestedRepoRoot(process.argv.slice(2)) ?? defaultRepoRoot;
const failures = [];

const whitespaceCheck = runGit(repoRoot, ["diff", "--check", "HEAD", "--"]);
if (whitespaceCheck.status !== 0) {
  failures.push("tracked changes contain whitespace errors");
  appendCommandOutput(whitespaceCheck, failures);
}

const trackedChanges = runGit(repoRoot, [
  "diff",
  "--name-only",
  "HEAD",
  "--",
]);
if (trackedChanges.status !== 0) {
  failures.push("unable to inspect tracked changes");
  appendCommandOutput(trackedChanges, failures);
} else {
  for (const file of lines(trackedChanges.stdout)) {
    failures.push(`tracked file differs from HEAD: ${file}`);
  }
}

const untrackedFiles = runGit(repoRoot, [
  "ls-files",
  "--others",
  "--exclude-standard",
  "-z",
]);
if (untrackedFiles.status !== 0) {
  failures.push("unable to inspect untracked files");
  appendCommandOutput(untrackedFiles, failures);
} else {
  for (const file of nulSeparated(untrackedFiles.stdout)) {
    failures.push(`untracked file is not release-safe: ${file}`);
  }
}

if (failures.length > 0) {
  console.error("Release clean-tree gate FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Release clean-tree gate PASS");
console.log("Tracked changes: 0");
console.log("Untracked non-ignored files: 0");

function requestedRepoRoot(args) {
  if (args.length === 0) {
    return undefined;
  }

  if (args.length !== 2 || args[0] !== "--repo-root" || args[1] === "") {
    console.error("Usage: check-release-clean [--repo-root <path>]");
    process.exit(2);
  }

  return resolve(args[1]);
}

function runGit(cwd, args) {
  return spawnSync("git", args, {
    cwd,
    encoding: "utf8",
  });
}

function lines(value) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function nulSeparated(value) {
  return typeof value === "string"
    ? value.split("\0").filter((entry) => entry.length > 0)
    : [];
}

function appendCommandOutput(result, target) {
  for (const line of [...lines(result.stdout), ...lines(result.stderr)]) {
    target.push(line);
  }

  if (result.error !== undefined) {
    target.push(result.error.message);
  }
}
