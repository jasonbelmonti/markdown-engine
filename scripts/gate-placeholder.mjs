#!/usr/bin/env node

const gateName = process.argv[2] ?? "unknown";

console.error(
  `${gateName} is registered for the 1.0 implementation lane but is not implemented in BEL-934 / WP-1A.`,
);
console.error("Implement this gate in its assigned downstream work package.");
process.exit(1);
