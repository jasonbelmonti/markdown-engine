#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildCliArtifact, writeBuildSummary } from "./build-cli-artifact.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..");
const outfile = join(repoRoot, "dist", "cli", "markdown-engine.mjs");

writeBuildSummary(
  await buildCliArtifact({
    cleanOutputFile: true,
    outfile,
    repoRoot,
  }),
);
