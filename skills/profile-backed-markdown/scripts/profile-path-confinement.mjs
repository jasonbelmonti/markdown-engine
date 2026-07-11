import * as path from "node:path";

export function isPathWithinDirectory(root, target) {
  return isPathWithinDirectoryWith(path, root, target);
}

export function isPathWithinDirectoryWith(pathApi, root, target) {
  const relativePath = pathApi.relative(
    pathApi.resolve(root),
    pathApi.resolve(target),
  );

  return (
    relativePath === "" ||
    (!pathApi.isAbsolute(relativePath) &&
      relativePath !== ".." &&
      !relativePath.startsWith(`..${pathApi.sep}`))
  );
}
