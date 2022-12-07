import alias from "@rollup/plugin-alias";
import hq from "alias-hq";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import swc from "rollup-plugin-swc3";

export default [
  {
    input: "src/index.ts",
    external: id => !/^[(./)|(@\/)]/.test(id),
    plugins: [
      nodeResolve({ extensions: [".ts", ".js", ".node", ".mjs"] }),
      alias({
        entries: hq.get("rollup"),
      }),
      swc({ sourceMaps: false }),
    ],
    output: [
      {
        file: `dist/index.js`,
        format: "esm",
        sourcemap: true,
      },
    ],
  },
];
