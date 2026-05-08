#!/usr/bin/env node

const gateName = process.argv[2] ?? "unknown";

console.error(
  `${gateName} is registered for its implementation lane but is not implemented in this work package.`,
);
console.error("Implement this gate in its assigned downstream work package.");
process.exit(1);
