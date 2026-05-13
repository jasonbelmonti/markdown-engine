#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildDeclarativeValidationRepeatabilityCases } from "./declarative-validation-repeatability-cases.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..");
const engine = await import("@jasonbelmonti/markdown-engine");

const runCount = parseRunCount(process.argv);
const baseline = buildDeclarativeValidationRepeatabilityCases(repoRoot, engine);
const failures = [];

for (let run = 1; run <= runCount; run += 1) {
  const observed = buildDeclarativeValidationRepeatabilityCases(repoRoot, engine);

  if (observed.length !== baseline.length) {
    failures.push({
      run,
      name: "case count",
      expected: String(baseline.length),
      actual: String(observed.length),
    });
  }

  for (let caseIndex = 0; caseIndex < baseline.length; caseIndex += 1) {
    const observedCase = observed[caseIndex];
    const baselineCase = baseline[caseIndex];
    const failure = compareCase(run, observedCase, baselineCase);

    if (failure !== undefined) {
      failures.push(failure);
    }
  }
}

if (failures.length > 0) {
  console.error("Declarative validation repeatability FAIL");
  for (const failure of failures) {
    console.error(
      `run ${failure.run} ${failure.name}: expected ${failure.expected}, actual ${failure.actual}`,
    );
  }
  process.exit(1);
}

console.log("Declarative validation repeatability PASS");
console.log(`Runs: ${runCount}`);
console.log(`Cases per run: ${baseline.length}`);
for (const testCase of baseline) {
  console.log(
    `${testCase.name}: ${testCase.sha256} (${testCase.byteLength} bytes)`,
  );
}

console.log("Observed evidence hashes:");
printEvidenceHashes(baseline, "passing");
printEvidenceHashes(baseline, "failing");

function compareCase(run, observedCase, baselineCase) {
  if (
    observedCase !== undefined &&
    baselineCase !== undefined &&
    observedCase.name === baselineCase.name &&
    Buffer.from(observedCase.json, "utf8").equals(
      Buffer.from(baselineCase.json, "utf8"),
    )
  ) {
    return undefined;
  }

  return {
    run,
    name: observedCase?.name ?? baselineCase?.name ?? "missing case",
    expected: baselineCase?.sha256 ?? "missing",
    actual: observedCase?.sha256 ?? "missing",
  };
}

function printEvidenceHashes(cases, resultName) {
  const evidence = evidenceCase(cases, resultName);

  console.log(`${resultName} inputHash: ${evidence.inputHash}`);
  console.log(`${resultName} profileHash: ${evidence.profileHash}`);
}

function evidenceCase(cases, resultName) {
  const testCase = cases.find(
    (candidate) =>
      candidate.name === `declarative-validation:${resultName}-evidence:compact`,
  );

  if (testCase === undefined) {
    throw new Error(`Missing ${resultName} evidence repeatability case.`);
  }

  return JSON.parse(testCase.json);
}

function parseRunCount(argv) {
  const runsIndex = argv.indexOf("--runs");

  if (runsIndex === -1) {
    return 10;
  }

  const value = Number(argv[runsIndex + 1]);

  if (!Number.isInteger(value) || value < 1) {
    throw new Error("--runs must be a positive integer");
  }

  return value;
}
