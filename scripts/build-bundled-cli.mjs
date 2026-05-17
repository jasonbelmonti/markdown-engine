#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildCliArtifact, writeBuildSummary } from "./build-cli-artifact.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..");
const outputDir = join(repoRoot, "dist-bundled");
const outfile = join(outputDir, "markdown-engine-cli.mjs");

writeBuildSummary(
  await buildCliArtifact({
    cleanOutputDirectory: true,
    outfile,
    repoRoot,
  }),
);
