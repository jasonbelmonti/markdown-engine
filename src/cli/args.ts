export type CliArgsResult =
  | { kind: "run"; targetPath: string }
  | { kind: "help" }
  | { kind: "error"; message: string };

export const cliUsage = `Usage: markdown-engine (--file <markdown-file> | --path <markdown-file>)

Runs parse and normalization for one Markdown file and writes normalized JSON.

Options:
  --file <markdown-file>  Markdown file to process.
  --path <markdown-file>  Markdown file to process. Directories are not traversed.
  -h, --help              Show this help message.
`;

export function parseCliArgs(args: string[]): CliArgsResult {
  const targets: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "-h" || arg === "--help") {
      return { kind: "help" };
    }

    if (arg === "--file" || arg === "--path") {
      const value = args[index + 1];

      if (value === undefined || value.startsWith("-")) {
        return { kind: "error", message: `Missing value for ${arg}.` };
      }

      targets.push(value);
      index += 1;
      continue;
    }

    if (arg?.startsWith("--file=") === true) {
      targets.push(arg.slice("--file=".length));
      continue;
    }

    if (arg?.startsWith("--path=") === true) {
      targets.push(arg.slice("--path=".length));
      continue;
    }

    return { kind: "error", message: `Unknown argument: ${arg ?? ""}` };
  }

  if (targets.length === 0) {
    return {
      kind: "error",
      message: "Expected exactly one of --file or --path.",
    };
  }

  if (targets.length > 1) {
    return {
      kind: "error",
      message: "Expected one Markdown file target, received multiple.",
    };
  }

  const [targetPath] = targets;

  if (targetPath === undefined || targetPath.trim() === "") {
    return { kind: "error", message: "Target path cannot be empty." };
  }

  return {
    kind: "run",
    targetPath,
  };
}
