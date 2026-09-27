import { createHash } from "node:crypto";
import { link, mkdtemp, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

export interface ValidationReportReference {
  path: string;
  sha256: string;
  bytes: number;
}

/** Publish complete report bytes without replacing any existing destination. */
export async function saveValidationReport(
  cwd: string,
  reportFile: string,
  content: string,
): Promise<ValidationReportReference> {
  const path = resolve(cwd, reportFile);
  const temporaryDirectory = await mkdtemp(join(dirname(path), ".markdown-engine-report-"));
  try {
    const temporaryFile = join(temporaryDirectory, "report.json");
    await writeFile(temporaryFile, content, { encoding: "utf8", mode: 0o600, flag: "wx" });
    // A same-directory hard link publishes atomically and refuses existing paths,
    // including symlinks/hard links to the Markdown or profile inputs.
    await link(temporaryFile, path);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
  return {
    path,
    sha256: createHash("sha256").update(content, "utf8").digest("hex"),
    bytes: Buffer.byteLength(content, "utf8"),
  };
}
