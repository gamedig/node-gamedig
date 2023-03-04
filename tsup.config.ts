import type { Options } from "tsup";

export const tsup: Options = {
  splitting: false,
  sourcemap: false,
  clean: true,
  bundle: true,
  dts: true,
  keepNames: true,
  target: "esnext",
  format: ["esm", "cjs"],
  entryPoints: ["src/index.ts", "src/bin.ts"],
};


