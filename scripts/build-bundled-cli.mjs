#!/usr/bin/env node
import { chmod, mkdir, rm, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { build } from "esbuild";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..");
const entryPoint = join(repoRoot, "src", "cli", "index.ts");
const outputDir = join(repoRoot, "dist-bundled");
const outfile = join(outputDir, "markdown-engine-cli.mjs");

await rm(outputDir, { force: true, recursive: true });
await mkdir(outputDir, { recursive: true });

await build({
  banner: {
    js: [
      'import { createRequire as __markdownEngineCreateRequire } from "node:module";',
      "const require = __markdownEngineCreateRequire(import.meta.url);",
    ].join("\n"),
  },
  bundle: true,
  entryPoints: [entryPoint],
  format: "esm",
  legalComments: "none",
  outfile,
  platform: "node",
  sourcemap: false,
  target: "node20",
});

await chmod(outfile, 0o755);

const outputStats = await stat(outfile);
process.stdout.write(
  `Bundled CLI: ${relative(repoRoot, outfile)} (${outputStats.size} bytes)\n`,
);
