import { chmod, mkdir, rm, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

import { build } from "esbuild";

export async function buildCliArtifact({
  cleanOutputDirectory = false,
  cleanOutputFile = false,
  outfile,
  repoRoot,
}) {
  const outputDirectory = dirname(outfile);

  if (cleanOutputDirectory) {
    await rm(outputDirectory, { force: true, recursive: true });
  } else if (cleanOutputFile) {
    await rm(outfile, { force: true });
  }

  await mkdir(outputDirectory, { recursive: true });

  await build({
    banner: {
      js: [
        'import { createRequire as __markdownEngineCreateRequire } from "node:module";',
        "const require = __markdownEngineCreateRequire(import.meta.url);",
      ].join("\n"),
    },
    bundle: true,
    entryPoints: [join(repoRoot, "src", "cli", "index.ts")],
    format: "esm",
    legalComments: "none",
    outfile,
    platform: "node",
    sourcemap: false,
    target: "node20",
  });

  await chmod(outfile, 0o755);

  const outputStats = await stat(outfile);
  return {
    relativeOutfile: relative(repoRoot, outfile),
    size: outputStats.size,
  };
}

export function writeBuildSummary({ relativeOutfile, size }) {
  process.stdout.write(`Bundled CLI: ${relativeOutfile} (${size} bytes)\n`);
}
