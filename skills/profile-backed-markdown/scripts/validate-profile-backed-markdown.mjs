#!/usr/bin/env node
import { spawn } from "node:child_process";
import { constants } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = dirname(scriptPath);
const skillRoot = resolve(scriptDir, "..");
const defaultProfileRoot = join(skillRoot, "assets", "profiles");
const profileFileExtensions = [".yaml", ".yml", ".json"];
const defaultBundledCliPath = resolve(
  skillRoot,
  "..",
  "..",
  "dist-bundled",
  "markdown-engine-cli.mjs",
);
const usage = `Usage: validate-profile-backed-markdown --file <markdown-file> [--profile-root <profiles-dir>] [--repair-brief]

Routes frontmatter validationProfile to a local profile asset and runs the bundled markdown-engine validator.

Options:
  --file <markdown-file>          Markdown file to validate.
  --profile-root <profiles-dir>   Local directory for validation profiles. Defaults to skill assets/profiles.
  --repair-brief                  Emit compact repair guidance on stderr while preserving JSON on stdout.
  -h, --help                      Show this help message.
`;

main(process.argv.slice(2)).then((exitCode) => {
  process.exitCode = exitCode;
});

async function main(args) {
  const parsedArgs = parseArgs(args);

  if (parsedArgs.kind === "help") {
    process.stdout.write(usage);
    return 0;
  }

  if (parsedArgs.kind === "error") {
    process.stderr.write(`${parsedArgs.message}\n\n${usage}`);
    return 2;
  }

  const profileRefResult = await readValidationProfileRef(parsedArgs.filePath);

  if (profileRefResult.kind === "error") {
    process.stderr.write(`${profileRefResult.message}\n`);
    return 2;
  }

  const profileResult = await resolveProfilePath(
    profileRefResult.validationProfile,
    parsedArgs.profileRoot,
  );

  if (profileResult.kind === "error") {
    process.stderr.write(`${profileResult.message}\n`);
    return 2;
  }

  const cliPathResult = await resolveBundledCliPath();

  if (cliPathResult.kind === "error") {
    process.stderr.write(`${cliPathResult.message}\n`);
    return 2;
  }

  const validation = await runBundledValidator({
    cliPath: cliPathResult.cliPath,
    filePath: parsedArgs.filePath,
    profilePath: profileResult.profilePath,
  });

  process.stdout.write(validation.stdout);
  process.stderr.write(validation.stderr);

  if (parsedArgs.repairBrief) {
    process.stderr.write(renderRepairBrief(validation.stdout));
  }

  return validation.exitCode;
}

function parseArgs(args) {
  const filePaths = [];
  const profileRoots = [];
  let profileRoot = defaultProfileRoot;
  let repairBrief = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "-h" || arg === "--help") {
      return { kind: "help" };
    }

    if (arg === "--repair-brief") {
      repairBrief = true;
      continue;
    }

    if (arg === "--file") {
      const value = readRequiredValue(arg, args, index);

      if (value.kind === "error") {
        return value;
      }

      filePaths.push(value.value);
      index += 1;
      continue;
    }

    if (arg?.startsWith("--file=") === true) {
      filePaths.push(arg.slice("--file=".length));
      continue;
    }

    if (arg === "--profile-root") {
      const value = readRequiredValue(arg, args, index);

      if (value.kind === "error") {
        return value;
      }

      profileRoots.push(value.value);
      index += 1;
      continue;
    }

    if (arg?.startsWith("--profile-root=") === true) {
      profileRoots.push(arg.slice("--profile-root=".length));
      continue;
    }

    return { kind: "error", message: `Unknown argument: ${arg ?? ""}` };
  }

  if (filePaths.length === 0) {
    return { kind: "error", message: "Expected exactly one --file target." };
  }

  if (filePaths.length > 1) {
    return {
      kind: "error",
      message: "Expected one Markdown file target, received multiple.",
    };
  }

  if (profileRoots.length > 1) {
    return {
      kind: "error",
      message: "Expected at most one --profile-root selector.",
    };
  }

  const [filePath] = filePaths;
  const [selectedProfileRoot] = profileRoots;

  if (filePath === undefined || filePath.trim() === "") {
    return { kind: "error", message: "File path cannot be empty." };
  }

  if (selectedProfileRoot !== undefined) {
    profileRoot = selectedProfileRoot;
  }

  return {
    kind: "ok",
    filePath,
    profileRoot: resolve(process.cwd(), profileRoot),
    repairBrief,
  };
}

function readRequiredValue(flag, args, index) {
  const value = args[index + 1];

  if (value === undefined || value.startsWith("-")) {
    return { kind: "error", message: `Missing value for ${flag}.` };
  }

  return { kind: "ok", value };
}

async function readValidationProfileRef(filePath) {
  let markdown;

  try {
    markdown = await readFile(resolve(process.cwd(), filePath), "utf8");
  } catch (error) {
    return {
      kind: "error",
      message: `Unable to read "${filePath}": ${errorMessage(error)}`,
    };
  }

  const frontmatter = extractFrontmatter(markdown);

  if (frontmatter.kind === "error") {
    return frontmatter;
  }

  return parseValidationProfileField(frontmatter.raw);
}

function extractFrontmatter(markdown) {
  const content = markdown.startsWith("\uFEFF") ? markdown.slice(1) : markdown;
  const lines = content.split(/\r\n|\n|\r/);

  if (lines[0] !== "---") {
    return {
      kind: "error",
      message: "Expected YAML frontmatter with validationProfile at the start of the Markdown file.",
    };
  }

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line === "---",
  );

  if (closingIndex === -1) {
    return {
      kind: "error",
      message: "Expected closing YAML frontmatter delimiter before validation.",
    };
  }

  return {
    kind: "ok",
    raw: lines.slice(1, closingIndex).join("\n"),
  };
}

function parseValidationProfileField(frontmatter) {
  let validationProfile;

  for (const [index, line] of frontmatter.split("\n").entries()) {
    const field = /^validationProfile\s*:(.*)$/.exec(line);

    if (field === null) {
      continue;
    }

    if (validationProfile !== undefined) {
      return {
        kind: "error",
        message: "Expected exactly one frontmatter validationProfile field.",
      };
    }

    const value = parseProfileScalar(field[1]?.trim() ?? "");

    if (value.kind === "error") {
      return {
        kind: "error",
        message: `Invalid validationProfile on frontmatter line ${index + 2}: ${value.message}`,
      };
    }

    validationProfile = value.value;
  }

  if (validationProfile === undefined) {
    return {
      kind: "error",
      message: "Expected frontmatter validationProfile to select a local profile asset.",
    };
  }

  return {
    kind: "ok",
    validationProfile,
  };
}

function parseProfileScalar(rawValue) {
  if (rawValue === "") {
    return { kind: "error", message: "expected a non-empty string scalar." };
  }

  const value = unquoteScalar(stripLineComment(rawValue));

  if (value.kind === "error") {
    return value;
  }

  if (!/^[A-Za-z0-9._/-]+$/.test(value.value)) {
    return {
      kind: "error",
      message: "expected a local profile id using letters, numbers, dots, dashes, underscores, or slashes.",
    };
  }

  return value;
}

function stripLineComment(value) {
  let quote;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    const previous = value[index - 1];

    if (quote === "\"") {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (character === "\\") {
        escaped = true;
        continue;
      }

      if (character === quote) {
        quote = undefined;
      }
      continue;
    }

    if (quote === "'") {
      if (character === "'" && value[index + 1] === "'") {
        index += 1;
        continue;
      }

      if (character === quote) {
        quote = undefined;
      }
      continue;
    }

    if (character === "\"" || character === "'") {
      quote = character;
      continue;
    }

    if (
      character === "#" &&
      (index === 0 || previous === " " || previous === "\t")
    ) {
      return value.slice(0, index).trimEnd();
    }
  }

  return value.trim();
}

function unquoteScalar(value) {
  if (value.startsWith("\"")) {
    try {
      const parsed = JSON.parse(value);

      return typeof parsed === "string"
        ? { kind: "ok", value: parsed }
        : { kind: "error", message: "expected a string scalar." };
    } catch (error) {
      return { kind: "error", message: errorMessage(error) };
    }
  }

  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length < 2) {
      return { kind: "error", message: "unterminated single-quoted string." };
    }

    return { kind: "ok", value: value.slice(1, -1).replaceAll("''", "'") };
  }

  return { kind: "ok", value };
}

async function resolveProfilePath(validationProfile, profileRoot) {
  if (isAbsolute(validationProfile)) {
    return {
      kind: "error",
      message: "validationProfile must resolve to a local profile asset, not an absolute path.",
    };
  }

  const normalizedRef = validationProfile.replaceAll("\\", "/");
  const profileSegments = normalizedRef.split("/");

  if (
    profileSegments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    return {
      kind: "error",
      message: "validationProfile must not contain empty, current-directory, or parent-directory segments.",
    };
  }

  const candidates = hasProfileFileExtension(normalizedRef)
    ? [normalizedRef]
    : [
        ...profileFileExtensions.map((extension) => `${normalizedRef}${extension}`),
        normalizedRef,
      ];

  for (const candidate of candidates) {
    const candidatePath = resolve(profileRoot, candidate);

    if (!isWithinDirectory(profileRoot, candidatePath)) {
      return {
        kind: "error",
        message: "validationProfile resolved outside the local profile root.",
      };
    }

    if (await isReadableFile(candidatePath)) {
      return { kind: "ok", profilePath: candidatePath };
    }
  }

  return {
    kind: "error",
    message: `Unable to resolve validationProfile "${validationProfile}" under ${profileRoot}.`,
  };
}

function hasProfileFileExtension(profileRef) {
  return profileFileExtensions.some((extension) =>
    profileRef.toLowerCase().endsWith(extension),
  );
}

function isWithinDirectory(root, target) {
  const relativePath = relative(root, target);

  return (
    relativePath === "" ||
    (!relativePath.startsWith("..") && !relativePath.includes(`..${sep}`))
  );
}

async function resolveBundledCliPath() {
  const candidates = [
    process.env.MARKDOWN_ENGINE_CLI,
    join(scriptDir, "markdown-engine-cli.mjs"),
    defaultBundledCliPath,
  ].filter((candidate) => candidate !== undefined && candidate !== "");

  for (const candidate of candidates) {
    const cliPath = resolve(process.cwd(), candidate);

    if (await isReadableFile(cliPath)) {
      return { kind: "ok", cliPath };
    }
  }

  return {
    kind: "error",
    message: [
      "Unable to locate bundled markdown-engine CLI.",
      "Set MARKDOWN_ENGINE_CLI, copy markdown-engine-cli.mjs into this skill's scripts directory,",
      "or run `npm run build:cli:bundled` from the package root.",
    ].join(" "),
  };
}

async function isReadableFile(path) {
  try {
    const candidate = await stat(path);
    if (!candidate.isFile()) {
      return false;
    }

    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function runBundledValidator({ cliPath, filePath, profilePath }) {
  return new Promise((resolvePromise) => {
    const child = spawn(
      process.execPath,
      [
        cliPath,
        "validate",
        "--file",
        filePath,
        "--profile",
        profilePath,
        "--format",
        "json",
      ],
      {
        cwd: process.cwd(),
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const stdout = [];
    const stderr = [];

    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));

    child.on("error", (error) => {
      resolvePromise({
        exitCode: 2,
        stderr: `${errorMessage(error)}\n`,
        stdout: "",
      });
    });

    child.on("close", (code) => {
      resolvePromise({
        exitCode: typeof code === "number" ? code : 2,
        stderr: Buffer.concat(stderr).toString("utf8"),
        stdout: Buffer.concat(stdout).toString("utf8"),
      });
    });
  });
}

function renderRepairBrief(jsonText) {
  let result;

  try {
    result = JSON.parse(jsonText);
  } catch {
    return "\nRepair brief unavailable: validator output was not JSON.\n";
  }

  if (result?.valid === true) {
    return "\nRepair brief:\n- Validation passed. No repair actions.\n";
  }

  const diagnostics = Array.isArray(result?.diagnostics) ? result.diagnostics : [];

  if (diagnostics.length === 0) {
    return "\nRepair brief:\n- Validation failed without diagnostics in validator JSON.\n";
  }

  return [
    "",
    "Repair brief:",
    ...diagnostics.map((diagnostic) => formatDiagnostic(diagnostic)),
    "",
  ].join("\n");
}

function formatDiagnostic(diagnostic) {
  const ruleId = typeof diagnostic.ruleId === "string" ? diagnostic.ruleId : "(none)";
  const message = typeof diagnostic.message === "string" ? diagnostic.message : "(no message)";
  const sourceRange = formatSourceRange(diagnostic.sourceRange);

  return [
    `- ruleId: ${ruleId}`,
    `  message: ${message}`,
    `  sourceRange: ${sourceRange}`,
  ].join("\n");
}

function formatSourceRange(sourceRange) {
  const start = sourceRange?.start;
  const end = sourceRange?.end;

  if (
    typeof start?.line !== "number" ||
    typeof start?.column !== "number" ||
    typeof end?.line !== "number" ||
    typeof end?.column !== "number"
  ) {
    return "unavailable";
  }

  return `${start.line}:${start.column}-${end.line}:${end.column}`;
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
