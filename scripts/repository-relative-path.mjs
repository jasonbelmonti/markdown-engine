import * as path from "node:path";

export function repositoryRelativePath(repositoryRoot, filePath) {
  return repositoryRelativePathWith(path, repositoryRoot, filePath);
}

export function repositoryRelativePathWith(
  pathApi,
  repositoryRoot,
  filePath,
) {
  const normalizedRoot = pathApi.resolve(repositoryRoot);
  const normalizedFile = pathApi.resolve(filePath);
  const relativeFile = pathApi.relative(normalizedRoot, normalizedFile);

  if (
    relativeFile === "" ||
    pathApi.isAbsolute(relativeFile) ||
    relativeFile === ".." ||
    relativeFile.startsWith(`..${pathApi.sep}`)
  ) {
    return normalizedFile;
  }

  return relativeFile.split(pathApi.sep).join("/");
}
