import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

export class CliFileError extends Error {
  override readonly name = "CliFileError";
}

export async function readMarkdownFile(
  targetPath: string,
  cwd: string,
): Promise<string> {
  return readCliFile(targetPath, cwd);
}

export async function readCliFile(
  targetPath: string,
  cwd: string,
): Promise<string> {
  const absolutePath = resolve(cwd, targetPath);
  const targetStat = await readTargetStat(absolutePath, targetPath);

  if (!targetStat.isFile()) {
    throw new CliFileError(
      `Expected a file path for "${targetPath}". Directories are not supported.`,
    );
  }

  try {
    return await readFile(absolutePath, "utf8");
  } catch (error) {
    throw new CliFileError(`Unable to read "${targetPath}": ${errorMessage(error)}`);
  }
}

async function readTargetStat(absolutePath: string, targetPath: string) {
  try {
    return await stat(absolutePath);
  } catch (error) {
    throw new CliFileError(`Unable to read "${targetPath}": ${errorMessage(error)}`);
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
