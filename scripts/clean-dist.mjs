#!/usr/bin/env node
import { rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(scriptDir, "..");

rmSync(join(repoRoot, "dist"), { force: true, recursive: true });
