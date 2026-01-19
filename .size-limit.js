/**
 * Size Limit Configuration
 * Prevents bundle size regression
 */

export default [
  {
    name: "Main Bundle (ESM)",
    path: "dist/index.js",
    limit: "8 KB",
    gzip: true,
    ignore: ["fs", "path", "node:*"],
  },
  {
    name: "Main Bundle (CJS)",
    path: "dist/index.cjs",
    limit: "8 KB",
    gzip: true,
    ignore: ["fs", "path", "node:*"],
  },
  {
    name: "CLI Bundle",
    path: "dist/cli/index.js",
    limit: "5 KB",
    gzip: true,
    ignore: ["fs", "path", "node:*"],
  },
];
