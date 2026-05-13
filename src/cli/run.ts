import { serialize } from "../api/contracts.js";
import { parseCliArgs } from "./args.js";
import { runDeclarativeValidationCli } from "./declarative-validation.js";
import { compatibilityModeForDocumentVersion } from "./document-version.js";
import { readMarkdownFile } from "./files.js";
import { normalizeMarkdown } from "./normalize-markdown.js";

export interface TextOutput {
  write(chunk: string): void | boolean;
}

export interface RunCliInput {
  args: string[];
  cwd: string;
  stderr: TextOutput;
  stdout: TextOutput;
}

export async function runCli(input: RunCliInput): Promise<number> {
  const argsResult = parseCliArgs(input.args);

  if (argsResult.kind === "help") {
    input.stdout.write(argsResult.usage);
    return 0;
  }

  if (argsResult.kind === "error") {
    input.stderr.write(`${argsResult.message}\n\n${argsResult.usage}`);
    return 2;
  }

  if (argsResult.kind === "validate") {
    const validationResult = await runDeclarativeValidationCli({
      cwd: input.cwd,
      filePath: argsResult.filePath,
      format: argsResult.format,
      profilePath: argsResult.profilePath,
    });

    if (validationResult.kind === "fileError") {
      input.stderr.write(`${validationResult.message}\n`);
      return 2;
    }

    input.stdout.write(`${validationResult.output}\n`);
    return validationResult.exitCode;
  }

  try {
    const markdown = await readMarkdownFile(argsResult.targetPath, input.cwd);
    const normalizeResult = normalizeMarkdown({
      documentVersion: argsResult.documentVersion,
      markdown,
      path: argsResult.targetPath,
    });

    input.stdout.write(
      `${serialize(normalizeResult, {
        compatibilityMode: compatibilityModeForDocumentVersion(
          argsResult.documentVersion,
        ),
        pretty: true,
      })}\n`,
    );
    return 0;
  } catch (error) {
    input.stderr.write(`${errorMessage(error)}\n`);
    return 1;
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
