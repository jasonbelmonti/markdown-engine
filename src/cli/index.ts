#!/usr/bin/env node
import { runCli } from "./run.js";

process.exitCode = await runCli({
  args: process.argv.slice(2),
  cwd: process.cwd(),
  stderr: process.stderr,
  stdout: process.stdout,
});
