import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@luxalgo/journal-core", "@luxalgo/journal-importers"],
  serverExternalPackages: ["better-sqlite3"],
  typescript: {
    // tests/ is type-checked by `pnpm typecheck` (plain tsconfig.json) but
    // excluded here so a pending test rewrite never blocks a production
    // build; vitest runs the tests themselves without going through tsc.
    tsconfigPath: "tsconfig.build.json",
  },
  // Runtime journal files belong on the user's disk, never in a deployable bundle.
  outputFileTracingExcludes: {
    "/*": ["./data/**/*", "../../outputs/**/*", "../../.runtime-backup*/**/*"],
  },
};

export default nextConfig;
