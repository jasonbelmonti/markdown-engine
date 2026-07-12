export function securityPolicyFailures({
  packageFile,
  packageJson,
  securityFile,
  securityMarkdown,
}) {
  const failures = [];
  const packageMajor = packageMajorVersion(
    packageFile,
    packageJson,
    failures,
  );

  if (packageMajor === undefined) {
    return failures;
  }

  const supportedMajorMatches = [
    ...securityMarkdown.matchAll(/latest `(\d+)\.x` package/g),
  ];
  if (supportedMajorMatches.length !== 1) {
    failures.push(
      `${securityFile}: expected exactly one latest supported major declaration`,
    );
  } else {
    const supportedMajor = Number(supportedMajorMatches[0]?.[1]);
    if (supportedMajor !== packageMajor) {
      failures.push(
        `${securityFile}: latest supported major ${supportedMajor}.x does not match package major ${packageMajor}.x`,
      );
    }
  }

  for (let major = 0; major < packageMajor; major += 1) {
    if (!securityMarkdown.includes(`\`${major}.x\``)) {
      failures.push(
        `${securityFile}: missing retired release line ${major}.x`,
      );
    }
  }

  return failures;
}

function packageMajorVersion(packageFile, packageJson, failures) {
  let manifest;

  try {
    manifest = JSON.parse(packageJson);
  } catch (error) {
    failures.push(
      `${packageFile}: unable to parse package JSON: ${errorMessage(error)}`,
    );
    return undefined;
  }

  const match = /^(\d+)\./.exec(String(manifest.version ?? ""));
  if (match === null) {
    failures.push(`${packageFile}: package version must begin with a major number`);
    return undefined;
  }

  return Number(match[1]);
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
