import signale from "signale";
// @ts-ignore
import types from "signale/types.js";

export const signaleLogger = new signale.Signale({
  logLevel: process.env.LOG_LEVEL || "warn",
  types: {
    ...types,
    info: {
      ...types.info,
      logLevel: "error",
    },
  },
});
