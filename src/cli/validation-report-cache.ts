import { randomUUID } from "node:crypto";
import { lstat, mkdir, readdir, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import { isAbsolute, join } from "node:path";
import { saveValidationReport } from "./validation-report.js";

const retentionMs = 7 * 24 * 60 * 60 * 1000;
const reportName = /^report-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$/;

/** Automatic reports are disposable; caller-selected report paths bypass this cache. */
export async function saveAutomaticValidationReport(content: string) {
  const configuredRoot = process.env.XDG_CACHE_HOME;
  const root = configuredRoot && isAbsolute(configuredRoot)
    ? configuredRoot : join(homedir(), ".cache");
  const directory = join(root, "markdown-engine", "validation-reports");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const report = await saveValidationReport(directory, `report-${randomUUID()}.json`, content);
  await pruneExpiredReports(directory, report.path);
  return report;
}

async function pruneExpiredReports(directory: string, currentReport: string) {
  // Cache maintenance must not invalidate an otherwise complete validation result.
  try {
    const cutoff = Date.now() - retentionMs;
    for (const name of await readdir(directory)) {
      const path = join(directory, name);
      if (path === currentReport || !reportName.test(name)) continue;
      try {
        const metadata = await lstat(path);
        if (metadata.isFile() && metadata.mtimeMs < cutoff) await unlink(path);
      } catch {
        // Another validation or external cache cleanup may already have removed it.
      }
    }
  } catch {
    // Unreadable caches still permit publication when the directory is writable.
  }
}
